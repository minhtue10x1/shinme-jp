"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Lock, Mail, User, ShieldCheck, Sparkles, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  checkOrLoginWithGoogle,
  completeGoogleRegistration,
  cancelGoogleRegistration,
  loginWithEmail,
  registerWithEmail,
  type GoogleLoginCheckResult,
} from "@/lib/auth-service";
import { useRole } from "@/lib/role-context";
import type { User as FirebaseUser } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const { setUserProfile } = useRole();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Modal State for New Google User Confirmation
  const [newGoogleUser, setNewGoogleUser] = useState<{
    user: FirebaseUser;
    email: string;
    displayName: string;
    targetJLPT: "N5" | "N4" | "N3" | "N2" | "N1" | "KAIWA";
  } | null>(null);

  // 1. Đăng nhập qua Google (Gmail OAuth2) với cơ chế hỏi xác nhận tạo mới nếu chưa có tài khoản
  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      const result: GoogleLoginCheckResult = await checkOrLoginWithGoogle();

      if (result.status === "EXISTING_USER") {
        // Đã có tài khoản -> Vào thẳng LMS
        setUserProfile(result.profile);
        toast.success(`Chào mừng trở lại, ${result.profile.fullName}!`, {
          description: `Đăng nhập thành công bằng tài khoản Google.`,
        });
        router.push("/portal");
      } else {
        // Gmail này chưa có tài khoản -> Mở Modal hỏi xác nhận
        setNewGoogleUser({
          user: result.user,
          email: result.email,
          displayName: result.displayName || "Học viên Shinme",
          targetJLPT: "N3",
        });
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error("Không thể đăng nhập bằng Google", {
        description: "Vui lòng thử lại hoặc đảm bảo popup trình duyệt không bị chặn.",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Xác nhận tạo tài khoản mới bằng Gmail
  const handleConfirmGoogleRegistration = async () => {
    if (!newGoogleUser) return;
    try {
      setIsLoading(true);
      const profile = await completeGoogleRegistration(
        newGoogleUser.user,
        newGoogleUser.displayName,
        newGoogleUser.targetJLPT
      );
      setUserProfile(profile);
      setNewGoogleUser(null);
      toast.success("Tạo tài khoản học viên mới thành công!", {
        description: `Chào mừng bạn đến với Shinme. Tài khoản liên kết với ${profile.email}.`,
      });
      router.push("/portal");
    } catch (err) {
      console.error(err);
      toast.error("Không thể hoàn tất tạo tài khoản. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  // Hủy đăng ký bằng Gmail
  const handleCancelGoogleRegistration = async () => {
    await cancelGoogleRegistration();
    setNewGoogleUser(null);
    toast.info("Đã hủy quá trình đăng ký tài khoản mới.");
  };

  // 2. Đăng nhập / Đăng ký bằng Email & Mật khẩu
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Vui lòng điền đầy đủ email và mật khẩu.");
      return;
    }

    try {
      setIsLoading(true);
      if (mode === "login") {
        const { profile } = await loginWithEmail(email, password);
        setUserProfile(profile);
        toast.success(`Đăng nhập thành công!`, {
          description: `Xin chào ${profile.fullName}.`,
        });
      } else {
        if (!fullName.trim()) {
          toast.error("Vui lòng nhập họ và tên của bạn.");
          return;
        }
        const { profile } = await registerWithEmail(email, password, fullName);
        setUserProfile(profile);
        toast.success("Tạo tài khoản thành công!", {
          description: "Chào mừng bạn đến với Trung tâm Nhật ngữ Shinme.",
        });
      }
      router.push("/portal");
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Đã có lỗi xảy ra.";
      toast.error("Thao tác không thành công", { description: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-[#FAF8F2] px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#135E36] text-white shadow-sm">
              <Sparkles className="h-5 w-5 text-[#6CC24A]" />
            </div>
            <span className="font-heading text-2xl font-black tracking-tight text-[#135E36]">
              Shinme LMS
            </span>
          </Link>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">
            {mode === "login" ? "Đăng nhập Cổng Học Viên & Sensei" : "Tạo tài khoản học viên mới"}
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Hệ thống đào tạo tiếng Nhật trực tuyến Trung tâm Nhật ngữ Shinme
          </p>
        </div>

        {/* Card Box */}
        <div className="mt-6 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8">
          {/* OAuth2 Primary Action Button */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isLoading}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 shadow-2xs transition hover:border-[#135E36]/40 hover:bg-slate-50 disabled:opacity-50"
            >
              {isGoogleLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-[#135E36]" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Đăng nhập 1-chạm bằng Google (Gmail)</span>
            </button>
            <p className="text-center text-[0.7rem] text-slate-500">
              Phương thức xác thực khuyến nghị cho Học viên & Giảng viên
            </p>
          </div>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <span className="relative bg-white px-3 text-xs font-semibold text-slate-400 uppercase">
              hoặc tài khoản ID / Password
            </span>
          </div>

          {/* Form Email / Password */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Họ và tên của bạn *
                </label>
                <div className="relative">
                  <User className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="VD: Lê Hoàng Nam"
                    className="w-full rounded-xl border border-slate-200 py-2.5 pr-3.5 pl-10 text-sm font-medium text-slate-900 focus:border-[#135E36] focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">
                Email của bạn *
              </label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hocvien@shinme.edu.vn"
                  className="w-full rounded-xl border border-slate-200 py-2.5 pr-3.5 pl-10 text-sm font-medium text-slate-900 focus:border-[#135E36] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">
                Mật khẩu *
              </label>
              <div className="relative">
                <Lock className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 py-2.5 pr-3.5 pl-10 text-sm font-medium text-slate-900 focus:border-[#135E36] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#135E36] py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#0f4a2a] disabled:opacity-50"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin text-[#6CC24A]" />}
              <span>{mode === "login" ? "Đăng nhập ngay" : "Tạo tài khoản học viên"}</span>
            </button>
          </form>

          {/* Toggle Login / Register */}
          <div className="mt-5 text-center text-xs text-slate-600">
            {mode === "login" ? (
              <p>
                Chưa có tài khoản học viên?{" "}
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className="font-bold text-[#135E36] hover:underline"
                >
                  Đăng ký tài khoản mới
                </button>
              </p>
            ) : (
              <p>
                Đã có tài khoản?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="font-bold text-[#135E36] hover:underline"
                >
                  Đăng nhập lại
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#135E36]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Quay lại Trang chủ Shinme
          </Link>
        </div>
      </div>

      {/* NEW GOOGLE USER REGISTRATION CONFIRMATION DIALOG */}
      {newGoogleUser && (
        <Dialog open={true} onOpenChange={(open) => !open && handleCancelGoogleRegistration()}>
          <DialogContent className="max-w-md p-6 sm:p-8">
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-[#135E36]">
                <Sparkles className="h-6 w-6 text-[#6CC24A]" />
              </div>

              <div>
                <DialogTitle className="text-xl font-extrabold text-slate-900">
                  Xác nhận tạo tài khoản mới bằng Gmail
                </DialogTitle>
                <DialogDescription className="mt-1.5 text-xs text-slate-600">
                  Địa chỉ email <strong className="font-bold text-slate-900">{newGoogleUser.email}</strong> chưa có tài khoản trong hệ thống Shinme. Bạn có muốn sử dụng email này để đăng ký tài khoản Học viên mới?
                </DialogDescription>
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-[#FAF8F2] p-4">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Họ và tên hiển thị:
                  </label>
                  <input
                    type="text"
                    value={newGoogleUser.displayName}
                    onChange={(e) =>
                      setNewGoogleUser({ ...newGoogleUser, displayName: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-[#135E36] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Mục tiêu trình độ JLPT của bạn:
                  </label>
                  <select
                    value={newGoogleUser.targetJLPT}
                    onChange={(e) =>
                      setNewGoogleUser({
                        ...newGoogleUser,
                        targetJLPT: e.target.value as "N5" | "N4" | "N3" | "N2" | "N1" | "KAIWA",
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#135E36] focus:outline-none"
                  >
                    <option value="N5">JLPT N5 (Sơ cấp 1)</option>
                    <option value="N4">JLPT N4 (Sơ cấp 2)</option>
                    <option value="N3">JLPT N3 (Trung cấp)</option>
                    <option value="N2">JLPT N2 (Trung thượng cấp)</option>
                    <option value="N1">JLPT N1 (Cao cấp)</option>
                    <option value="KAIWA">Giao tiếp Kaiwa chuyên sâu</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleCancelGoogleRegistration}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Hủy bỏ
                </button>

                <button
                  type="button"
                  onClick={handleConfirmGoogleRegistration}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#135E36] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#0f4a2a] disabled:opacity-50"
                >
                  {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#6CC24A]" />}
                  Đồng ý tạo tài khoản
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
