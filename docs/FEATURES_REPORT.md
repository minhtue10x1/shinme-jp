# Báo cáo Toàn diện Tính năng Hệ thống — Shinme Japanese Center (`shinme-jp`)

**Phiên bản:** Production Full-stack Hybrid (Nhánh `develop`)  
**Nền tảng công nghệ:** Next.js `16.4.5` (App Router + Turbopack) · React `19.3.0` · TypeScript `5` · Tailwind CSS `v4` · Firebase `13.2.0` (Auth + Cloud Firestore) · Deploy trên **Vercel**

---

## 1. Tổng quan & Mô hình Kiến trúc

Hệ thống **Shinme (`shinme-jp`)** là nền tảng kép kết hợp **Landing Page Tuyển sinh** và **Cổng Quản lý Đào tạo Trực tuyến (LMS & Khảo thí JLPT)** cho Trung tâm Nhật ngữ Shinme, hỗ trợ hiển thị chuẩn chữ Nhật (Kanji, Kana, Furigana `<ruby>`).

- **Dữ liệu thời gian thực 100%:** Toàn bộ người dùng, lớp học, đề thi JLPT, bài nộp, bài tập, bảng tin, học liệu và thông tin khách tư vấn được đọc/ghi trực tiếp trên **Cloud Firestore**.
- **Bảo mật & Trải nghiệm đa nền tảng:** Giao diện Responsive chuẩn Desktop & Mobile, tuân thủ hệ thống Design Tokens (`DESIGN.md`).

---

## 2. Ma trận Phân quyền theo Vai trò (RBAC — 4 Roles)

Hệ thống phân chia 4 vai trò rõ ràng được quản lý đồng bộ từ Firestore (`users/{uid}`):

| Phân hệ / Chức năng | Khách (`guest`) | Học viên (`student`) | Giáo viên (`sensei`) | Quản trị viên (`admin`) |
| :--- | :---: | :---: | :---: | :---: |
| **Tổng quan Portal (`/portal`)** | Thông báo *"Chưa vào lớp"* | Tiến độ lớp & điểm cá nhân | Tổng quan lớp dạy & sĩ số | Thống kê toàn trung tâm |
| **Hồ sơ cá nhân & Đổi Avatar (`/portal/profile`)** | ✅ | ✅ | ✅ | ✅ |
| **Bảng tin thông báo lớp học** | ❌ (Ẩn hoàn toàn) | ✅ (Chỉ lớp mình + Chung) | ✅ (Đọc, Đăng, Ghim, Xóa) | ✅ (Đọc, Đăng, Ghim, Xóa) |
| **Lớp học & Lịch đào tạo (`/portal/classes`)** | ❌ | ✅ (Chỉ xem danh sách lớp & bạn cùng lớp, ẩn email) | ✅ (Xem tất cả lớp & roster đầy đủ) | ✅ (Thêm, Sửa, Xóa lớp, Chuyển lớp HV) |
| **Khảo thí & Đề thi JLPT (`/portal/tests`)** | ❌ | ✅ (Làm bài thi online) | ✅ (Tạo đề, Sửa, Quản lý) | ✅ (Toàn quyền) |
| **Sổ điểm kiểm tra (`/portal/gradebook`)** | ❌ | ✅ (Chỉ xem điểm cá nhân) | ✅ (Xem theo lớp/đề + Xuất CSV) | ✅ (Xem toàn bộ + Xuất CSV) |
| **Bài tập & Mondai (`/portal/assignments`)** | ❌ | ✅ (Xem & Nộp bài làm) | ✅ (Tạo bài, Chấm điểm, Nhận xét) | ✅ (Toàn quyền) |
| **Kho học liệu & Giáo trình (`/portal/materials`)** | ❌ | ✅ (Xem & Tải tài liệu) | ✅ (Upload link Drive, Xóa) | ✅ (Toàn quyền) |
| **Quản lý Người dùng & Giáo viên (`/portal/users`)** | ❌ | ❌ | ❌ | ✅ (Tìm user, Xếp lớp, Gán Sensei) |
| **Khách tư vấn Leads (`/portal/leads`)** | ❌ | ❌ | ❌ | ✅ (Xem & Theo dõi đăng ký) |

---

## 3. Chi tiết Các Tính năng Hiện tại

### 3.1. Landing Page Tuyển sinh & Điều hướng thông minh (`/`)
- **Các phân khu nội dung:** Hero Banner, Giới thiệu Shinme (`#ve-shinme`), Lộ trình đào tạo N5–N1 & Kaiwa (`#lo-trinh`), Đội ngũ Sensei (`#sensei`), Bài test đầu vào Mini 15 phút (`#thi-thu`), Blog kinh nghiệm (`#blog`), Form đăng ký tư vấn lộ trình (`#tu-van`).
- **Navbar nhận diện trạng thái đăng nhập:**
  - Chưa đăng nhập: Hiển thị nút **"Đăng nhập"**.
  - Đã đăng nhập: Hiển thị lời chào tiếng Nhật **"こんにちは, [Họ tên]"** kèm ảnh đại diện nhỏ ngay cạnh nút **"Cổng LMS (Portal)"**.
- **Cuộn đầu trang chính xác:** Khi bấm "Về trang chủ Shinme" hoặc logo từ Portal, trang tự động cuộn về vị trí đầu trang Hero.

### 3.2. Hệ thống Xác thực, Phiên trượt 7 ngày & Ảnh đại diện (`/login`, `/portal/profile`)
- **Đăng nhập đa phương thức:** Email/Mật khẩu hoặc Google OAuth2 (có bước xác nhận thông minh nếu Gmail đăng nhập lần đầu).
- **Cơ chế Khách mặc định khi đăng ký:** Mọi tài khoản đăng ký mới qua Form hoặc Google đều được cấp vai trò **`guest`** (mã `KH-XXXX`, chưa gán lớp). Khi vào Portal chỉ nhìn thấy trang Tổng quan báo chưa xếp lớp và Hồ sơ cá nhân.
- **Rolling Session 7 ngày (`src/lib/session-manager.ts`):**
  - Tự động gia hạn thời gian phiên khi học viên/giáo viên truy cập đều đặn hàng tuần (giống cơ chế Facebook).
  - Nếu **quá 7 ngày liên tục không truy cập**, hệ thống tự động đăng xuất an toàn và thông báo đăng nhập lại.
- **Ảnh đại diện (Avatar) không cần Storage trả phí (`src/lib/image-utils.ts`):**
  - Cho phép tải ảnh từ máy tính/điện thoại: trình duyệt tự động cắt vuông từ tâm (center-crop) và nén về kích thước `256×256` WebP/JPEG (~10–25KB) lưu thẳng vào Firestore.
  - Hỗ trợ dán URL ảnh ngoài hoặc gỡ ảnh trở về chữ viết tắt.
  - Hiển thị đồng bộ qua component `<UserAvatar />` tại Navbar, Sidebar, Bảng học viên và Quản lý người dùng.

### 3.3. Quản trị Người dùng, Xếp lớp & Bổ nhiệm Giáo viên (`/portal/users`)
- Dành riêng cho **Admin** để quản lý toàn bộ người dùng đã đăng ký:
  - **Tìm kiếm & Bộ lọc:** Tìm nhanh theo Họ tên, Email, Mã định danh (`KH-`, `HV-`, `SS-`), SĐT; lọc theo vai trò hoặc theo lớp học (kể cả lọc nhanh người *"Chưa vào lớp"*).
  - **Xếp lớp cho Học viên:** Chọn thành viên -> Chọn lớp tiếp nhận -> Tự động nâng cấp tài khoản từ Khách (`KH-...`) lên Học viên chính thức (`HV-...`).
  - **Bổ nhiệm Giáo viên (Sensei) & Phân công lớp:** Chọn tài khoản mới đăng ký (ví dụ giáo viên mới đăng ký mail) -> Bấm *"Gán làm Giáo viên"* -> Chọn 1 hoặc nhiều lớp phụ trách -> Hệ thống tự động đổi vai trò sang `sensei`, cấp mã `SS-...` và cập nhật tên giảng viên vào thông tin các lớp được chọn.

### 3.4. Lớp học & Lịch đào tạo (`/portal/classes`)
- Hiển thị danh sách các lớp đang mở (`N3-Tối 246`, `N4-Cấp Tốc`, `Kaiwa Sơ Trung Cấp`...), tiến độ số buổi (`completedSessions / totalSessions`), bài đang học (kèm Furigana), lịch học, giờ học, phòng học/Zoom ID và Sensei phụ trách.
- **Bảo mật danh sách lớp cho Học viên:**
  - Học viên chỉ xem được thông tin lịch học các lớp khác (ẩn hoàn toàn nút xem danh sách học viên lớp khác).
  - Tại lớp của mình, học viên xem được danh sách bạn đồng môn nhưng ẩn thông tin email cá nhân.
- **Quyền Admin:** Thêm lớp mới, Sửa thông tin lớp, Xóa lớp, Chuyển lớp cho học viên ngay trong modal danh sách lớp.

### 3.5. Trung tâm Khảo thí & Ngân hàng Đề thi JLPT (`/portal/tests`, `create`, `manage`, `[id]/take`)
- **Hỗ trợ 4 dạng câu hỏi Mondai chuẩn JLPT:**
  1. Trắc nghiệm tiêu chuẩn (Từ vựng / Kanji / Ngữ pháp).
  2. Ghép câu dấu sao (`★` Star arrangement) tương tác kéo/chọn thứ tự mảnh ghép.
  3. Đọc hiểu (Dokkai) với đoạn văn dùng chung cho nhóm câu hỏi.
  4. Nghe hiểu (Choukai) với trình phát Audio kiểm soát số lần nghe tối đa (1 lần / 2 lần / không giới hạn) và script tiếng Nhật + tiếng Việt.
- **Soạn thảo & Quản lý đề thi (Sensei/Admin):**
  - Tạo đề thi trực quan (`/portal/tests/create`), cấu hình thời lượng, điểm đạt chuẩn, số lần làm tối đa, trộn thứ tự câu hỏi, hỗ trợ cú pháp Furigana `Kanji[furigana]`.
  - Chỉnh sửa hoặc xóa đề thi tại `/portal/tests/manage`.
- **Phòng thi trực tuyến (`/portal/tests/[id]/take`):**
  - Đồng hồ đếm ngược thời gian thực, thanh điều hướng câu hỏi, đánh dấu câu làm sau, tự động chấm điểm ngay khi nộp bài và lưu kết quả lên Firestore `test_submissions`.

### 3.6. Sổ điểm Kiểm tra (`/portal/gradebook`)
- Giao diện tinh gọn tập trung vào kết quả thực tế (đã loại bỏ phần phân tích câu sai phức tạp theo yêu cầu vận hành):
  - **Học viên:** Xem lịch sử toàn bộ các bài thi mình đã làm, điểm số, trạng thái Đạt/Chưa đạt, thời gian làm bài.
  - **Sensei / Admin:** Lọc theo bài thi, lọc theo lớp học, tìm kiếm học viên, thống kê số lượt nộp và điểm trung bình, hỗ trợ **Xuất file CSV (Excel)** chỉ với 1 nút bấm.

### 3.7. Bài tập & Mondai tuần (`/portal/assignments`)
- Phân loại theo dạng bài: `Kanji`, `Ngữ pháp`, `Đọc hiểu`, `Kaiwa`, `Tổng hợp`.
- **Sensei / Admin:** Giao bài tập mới theo lớp, chọn hạn nộp, thang điểm; mở hộp thoại chấm bài từng học viên, xem bài làm đã nộp, chọn mẫu nhận xét nhanh của Sensei hoặc nhập lời dặn dò chi tiết.
- **Học viên:** Xem danh sách bài tập của lớp mình, nhập câu trả lời hoặc dán link bài làm để gửi nộp, xem điểm và lời nhận xét từ Sensei.

### 3.8. Kho học liệu & Giáo trình (`/portal/materials`)
- Lưu trữ học liệu theo danh mục: `Giáo trình chính`, `Kanji & Từ vựng`, `Nghe hiểu Chokai`, `Ngữ pháp & Đề thi`, `Tài liệu bổ trợ`.
- Tích hợp **Trình phát Audio Chokai tương tác** trực tiếp trên trang.
- Hỗ trợ chia sẻ tài liệu qua **Link Google Drive / Link trực tuyến** (không giới hạn dung lượng file giáo trình nặng, không phát sinh chi phí Storage).

### 3.9. Quản lý Khách tư vấn (`/portal/leads`)
- Tự động thu thập dữ liệu học viên tiềm năng từ Form tư vấn và Bài Thi thử Mini trên Landing Page về Firestore `leads` để Admin tiện theo dõi và liên hệ.

---

## 4. Cấu trúc Cơ sở dữ liệu (8 Collections trên Cloud Firestore)

| Tên Collection | Mục đích lưu trữ | Khóa chính |
| :--- | :--- | :--- |
| `users` | Hồ sơ người dùng, vai trò (`guest`/`student`/`sensei`/`admin`), mã định danh, lớp học, ảnh đại diện | `uid` (Firebase Auth UID) |
| `classes` | Danh sách lớp học, lịch học, phòng học, giảng viên phụ trách, tiến độ buổi học | `id` |
| `tests` | Ngân hàng đề thi JLPT, cấu hình thời gian, thang điểm và mảng câu hỏi Mondai | `id` |
| `test_submissions` | Lịch sử nộp bài thi trắc nghiệm, điểm số, đáp án đã chọn, thời gian hoàn thành | `id` |
| `assignments` | Đề bài tập tuần, hạn nộp, và map `submissions` lưu bài làm/điểm/nhận xét từng HV | `id` |
| `announcements` | Bảng tin thông báo theo lớp học hoặc toàn trung tâm, hỗ trợ ghim bài (`isPinned`) | `id` |
| `materials` | Kho học liệu số hóa, giáo trình PDF, Slide, Audio gắn link Drive theo lớp học | `id` |
| `leads` | Danh sách khách hàng đăng ký tư vấn từ Landing Page và kết quả thi thử Mini | `id` |

---

## 5. Danh sách Routes Hệ thống (18 Routes)

- **Public:** `/` (Landing Page), `/login` (Đăng nhập & Đăng ký), `/_not-found`
- **Portal Chung:** `/portal` (Tổng quan), `/portal/profile` (Hồ sơ & Avatar)
- **Đào tạo & Khảo thí:** `/portal/classes`, `/portal/assignments`, `/portal/materials`, `/portal/tests`, `/portal/tests/create`, `/portal/tests/manage`, `/portal/tests/[id]/take` (Dynamic), `/portal/gradebook`
- **Quản trị (Admin):** `/portal/users`, `/portal/leads`
- **Legacy Redirects:** `/portal/resources` → `/portal/materials`, `/portal/exam/[id]` → `/portal/tests`

