import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updatePassword,
} from "firebase/auth";
import fs from "fs";

// Read .env.local
const envContent = fs.readFileSync(".env.local", "utf-8");
const env = {};
envContent.split("\n").forEach((line) => {
  const [k, ...v] = line.trim().split("=");
  if (k && v.length) env[k] = v.join("=");
});

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const DEFAULT_PASSWORD = "Shinme@123";

const ACCOUNTS = [
  {
    email: "admin@shinme.edu.vn",
    password: DEFAULT_PASSWORD,
    role: "admin",
    code: "ADMIN-01",
    fullName: "Nguyễn Thu Hà (Admin)",
    fullNameJa: "グエン・トゥ・ハー",
    avatarText: "Ad",
    className: "Toàn bộ lớp học",
    targetJLPT: "N1",
  },
  {
    email: "tanaka.yuki@shinme.edu.vn",
    password: DEFAULT_PASSWORD,
    role: "sensei",
    code: "SS-TANAKA",
    fullName: "Tanaka Yuki",
    fullNameJa: "田中[たなか] 由紀[ゆき]",
    avatarText: "田",
    classId: "cls-n3-246",
    className: "N3-Tối 246 (Sensei Tanaka)",
    targetJLPT: "N1",
  },
  {
    email: "nam.le@shinme.edu.vn",
    password: DEFAULT_PASSWORD,
    role: "student",
    code: "HV-202601",
    fullName: "Lê Hoàng Nam",
    fullNameJa: "レ・ホアン・ナム",
    avatarText: "Nam",
    classId: "cls-n3-246",
    className: "N3-Tối 246 (Sensei Tanaka)",
    targetJLPT: "N3",
  },
];

async function seedAuthUsers() {
  console.log("🔐 Bắt đầu tạo tài khoản Firebase Auth với mật khẩu mặc định:", DEFAULT_PASSWORD);

  for (const acc of ACCOUNTS) {
    let uid = "";
    try {
      // 1. Thử tạo mới tài khoản
      const res = await createUserWithEmailAndPassword(auth, acc.email, acc.password);
      uid = res.user.uid;
      console.log(`✅ Đã tạo mới tài khoản Firebase Auth: ${acc.email} (Role: ${acc.role}) -> UID: ${uid}`);
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        // 2. Nếu đã tồn tại, đăng nhập và đổi mật khẩu về Shinme@123
        try {
          const res = await signInWithEmailAndPassword(auth, acc.email, acc.password);
          uid = res.user.uid;
          console.log(`ℹ️ Tài khoản đã tồn tại và mật khẩu đã đúng: ${acc.email} -> UID: ${uid}`);
        } catch {
          console.warn(`⚠️ Tài khoản ${acc.email} đã tồn tại với mật khẩu khác. Vui lòng reset trên Firebase Console nếu cần.`);
          continue;
        }
      } else {
        console.error(`❌ Lỗi khi tạo ${acc.email}:`, err.message);
        continue;
      }
    }

    if (uid) {
      // 3. Đồng bộ UserProfileDoc vào Firestore với docId = uid
      const profileData = {
        uid,
        email: acc.email,
        role: acc.role,
        code: acc.code,
        fullName: acc.fullName,
        fullNameJa: acc.fullNameJa || "",
        avatarText: acc.avatarText,
        classId: acc.classId || "cls-n3-246",
        className: acc.className || "Lớp N3-Tối 246",
        targetJLPT: acc.targetJLPT,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "users", uid), profileData, { merge: true });
      console.log(`📝 Đã ghi nhận UserProfileDoc vào Firestore collection 'users' cho UID: ${uid}`);
    }
  }

  console.log("\n🎉 HOÀN TẤT KHỞI TẠO TÀI KHOẢN CHO 3 ROLE!");
}

seedAuthUsers()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

