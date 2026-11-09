# Hướng dẫn Phối hợp AI Agent & Skills — Dự án Shinme (`shinme-jp`)

Tài liệu này quy định quy tắc làm việc và cách phối hợp giữa hai bộ skill thiết kế cốt lõi đã cài đặt trong dự án **Shinme (`shinme-jp`)** — hệ thống quản lý đào tạo, giáo viên, học viên, tài liệu, bài tập và bài kiểm tra tiếng Nhật đa ngôn ngữ (**JA / VI / EN**).

---

## 1. Bản đồ Skills & Phân vai Trách nhiệm

Dự án sử dụng kết hợp **Impeccable** (Điều phối thiết kế, quy chuẩn thẩm mỹ & kiểm định chất lượng) và **UI UX Pro Max Suite** (Cơ sở dữ liệu tra cứu thiết kế, hệ thống token & hướng dẫn theo tech stack):

| Nhóm Skill | Đường dẫn | Vai trò chính (Khi nào dùng) |
| :--- | :--- | :--- |
| **Impeccable** | `.agent/skills/impeccable/` | **Kiến trúc sư trưởng & Kiểm định viên:** Quản lý ngữ cảnh sản phẩm (`PRODUCT.md`, `DESIGN.md`), định hình luồng UX (`shape`), thiết lập tiêu chuẩn chất lượng (`craft-floor.md`), tinh chỉnh giao diện (`polish`, `layout`, `typeset`, `distill`, `harden`) và quét lỗi tự động (`detect`, `critique`, `audit`). |
| **UI UX Pro Max** | `.agents/skills/ui-ux-pro-max/` | **Thư viện Tra cứu Thiết kế (Search Engine):** Tra cứu dữ liệu cục bộ bằng Python CLI (`search.py`) cho UX guidelines (`--domain ux`), loại biểu đồ thống kê (`--domain chart`), bảng màu, cặp font và best practices theo framework (`--stack`). |
| **Design System** | `.agents/skills/design-system/` | **Kiến trúc Token 3 lớp:** Chuẩn hóa hệ thống CSS variables / design tokens (`primitive → semantic → component`) cho màu sắc, khoảng cách và chữ viết. |
| **UI Styling** | `.agents/skills/ui-styling/` | **Thực thi Component:** Hướng dẫn xây dựng component có tính truy cập cao (accessible dialogs, forms, tables, bài test) với Tailwind CSS / shadcn/ui. |
| **Brand / Design / Banner / Slides** | `.agents/skills/{brand,design,banner-design,slides}/` | **Tài nguyên Thương hiệu & Học liệu:** Dùng khi cần thiết kế nhận diện thương hiệu Shinme, icon, banner thông báo lớp học hoặc slide bài giảng HTML. |

---

## 2. Nguyên tắc "Nguồn Sự Thật Duy Nhất" (Chống Xung Đột)

Để hai bộ skill không ghi đè hoặc tạo ra các quy chuẩn mâu thuẫn nhau, Agent **BẮT BUỘC** tuân thủ thứ tự ưu tiên sau:

1. **`PRODUCT.md` là bất biến về nghiệp vụ:** Mọi quyết định tính năng, vai trò người dùng (Admin, Giáo viên, Học viên) và ràng buộc đa ngôn ngữ (JA - VI - EN) phải bám sát `PRODUCT.md`.
2. **`DESIGN.md` & `.impeccable/` là nguồn sự thật duy nhất về thẩm mỹ:**
   - Khi dùng `ui-ux-pro-max`, **KHÔNG** dùng cờ `--persist` để tạo thư mục `design-system/MASTER.md` riêng biệt gây phân mảnh ngữ cảnh.
   - Mọi kết quả tra cứu từ `ui-ux-pro-max` (bảng màu, cặp font, quy tắc UX) chỉ đóng vai trò **dữ liệu đầu vào tham khảo** để chọn lọc và ghi nhận thống nhất vào `DESIGN.md` cùng hệ thống token của dự án.
3. **Chế độ bề mặt (Impeccable Modes) quyết định mức độ biểu đạt:**
   - **Operate Mode** *(Dashboard Admin, Quản lý học viên/giáo viên, Quản lý bài tập, Màn hình làm bài Test)*: Ưu tiên độ rõ ràng, tốc độ quét thông tin, thao tác chính xác và sự tập trung tuyệt đối. Không lạm dụng hiệu ứng trang trí gây xao nhãng.
   - **Read Mode** *(Hệ thống tài liệu, Giáo trình tiếng Nhật, Hướng dẫn ngữ pháp/từ vựng)*: Ưu tiên cấu trúc phân cấp nội dung, độ dễ đọc của chữ Kanji/Kana/Furigana và trải nghiệm đọc lâu không mỏi mắt.
   - **Persuade Mode** *(Landing page giới thiệu trung tâm Shinme, nếu có)*: Cho phép bố cục táo bạo, giàu cảm xúc và mang đậm bản sắc thương hiệu.

---

## 3. Quy trình Phối hợp 5 Bước (Standard Workflow)

Khi xây dựng tính năng mới hoặc cải tiến giao diện trong `shinme-jp`, hãy thực hiện tuần tự 5 bước sau:

### Bước 1: Nạp ngữ cảnh dự án (Đầu mỗi phiên làm việc)
Chạy lệnh ngữ cảnh của Impeccable (chỉ chạy 1 lần mỗi phiên):
```powershell
.agent/skills/impeccable/scripts/impeccable.cmd context
```
Đọc kỹ `PRODUCT.md`, `DESIGN.md` (nếu đã có) và xác định đúng **Mode** (`Operate` / `Read` / `Persuade`) của màn hình đang làm.

### Bước 2: Tra cứu dữ liệu thông minh & Lên kế hoạch UX
1. **Tra cứu với `ui-ux-pro-max`** (trên Windows dùng lệnh `python`):
   - Tìm hướng dẫn UX cụ thể (ví dụ: form nộp bài, bảng điểm, bộ lọc):
     ```powershell
     python .agents/skills/ui-ux-pro-max/scripts/search.py "<từ khóa>" --domain ux
     ```
   - Tìm loại biểu đồ phù hợp cho thống kê điểm thi / chuyên cần:
     ```powershell
     python .agents/skills/ui-ux-pro-max/scripts/search.py "student progress exam score" --domain chart
     ```
   - Tìm quy tắc theo Tech Stack của dự án:
     ```powershell
     python .agents/skills/ui-ux-pro-max/scripts/search.py "<vấn đề>" --stack <tên-stack>
     ```
2. **Định hình luồng với `impeccable`:**
   - Với tính năng hoặc màn hình mới phức tạp, sử dụng quy trình trong `.agent/skills/impeccable/reference/shape.md` hoặc `new-work.md` để chốt cấu trúc trước khi viết code.

### Bước 3: Thiết lập Design Tokens & Viết Code Giao diện
1. **Đọc chuẩn sàn chất lượng:** Bắt buộc đọc `.agent/skills/impeccable/reference/craft-floor.md` ngay trước khi tạo hoặc sửa bất kỳ file UI nào.
2. **Áp dụng Token & Component:**
   - Tổ chức biến CSS theo kiến trúc 3 lớp từ `.agents/skills/design-system/SKILL.md` (`primitive → semantic → component`).
   - Xây dựng các thành phần tương tác (bảng dữ liệu học viên, modal giao bài, đồng hồ đếm ngược bài test) theo chuẩn accessibility trong `.agents/skills/ui-styling/SKILL.md`.

### Bước 4: Tinh chỉnh chuyên sâu & Đảm bảo Đa ngôn ngữ (JA / VI / EN)
Sử dụng các lệnh chuyên biệt của Impeccable để hoàn thiện từng khía cạnh:
- `/impeccable typeset`: Chuẩn hóa hệ thống chữ viết đa ngôn ngữ. Đảm bảo font stack hiển thị sắc nét cả chữ Nhật (Kanji, Hiragana, Katakana, Furigana/`<ruby>`) lẫn tiếng Việt có dấu; `line-height` đủ thoáng cho ký tự CJK.
- `/impeccable layout`: Căn chỉnh lưới, khoảng trắng và nhịp điệu thị giác.
- `/impeccable distill`: Lược bỏ chi tiết thừa, đặc biệt quan trọng cho **Màn hình làm bài Test** của học viên để tránh phân tâm.
- `/impeccable harden`: Kiểm tra độ bền giao diện khi chuyển đổi qua lại giữa **Tiếng Nhật - Tiếng Việt - Tiếng Anh** (tránh tràn chữ, vỡ nút bấm khi nhãn tiếng Việt/Anh dài hơn tiếng Nhật), xử lý trạng thái trống (empty states), lỗi mạng khi đang làm bài kiểm tra và an toàn bộ gõ IME (`isComposing`) khi gõ tiếng Nhật/Việt.

### Bước 5: Kiểm định tự động & Đánh giá trước khi hoàn tất
1. **Chạy bộ dò lỗi thiết kế (Mechanical Detector)** một lần sau khi hoàn thành chỉnh sửa code UI:
   ```powershell
   .agent/skills/impeccable/scripts/impeccable.cmd detect --json <đường-dẫn-file-hoặc-thư-mục-vừa-sửa>
   ```
2. **Đánh giá toàn diện (khi hoàn thiện trang/phân hệ):**
   - Dùng `/impeccable critique <target>` để chấm điểm UX heuristic.
   - Dùng `/impeccable audit <target>` để kiểm tra khả năng truy cập (a11y), hiệu năng và hiển thị responsive trên Desktop/Mobile.
   - Dùng `/impeccable document` để cập nhật các quy chuẩn thiết kế đã chốt vào `DESIGN.md`.

---

## 4. Bảng Tra cứu Nhanh theo Tình huống tại `shinme-jp`

| Yêu cầu thực tế | Sự kết hợp khuyên dùng |
| :--- | :--- |
| **Khởi tạo hệ thống màu & font cho Shinme** | Tra cứu gợi ý bằng `ui-ux-pro-max` (`--design-system`) + Cấu trúc hóa token bằng `design-system` + Lưu chính thức vào `DESIGN.md` qua `impeccable`. |
| **Thiết kế Dashboard quản lý học viên / giáo viên** | Chế độ `Operate` của `impeccable` + Tra cứu biểu đồ `--domain chart` của `ui-ux-pro-max` + Bảng dữ liệu chuẩn từ `ui-styling`. |
| **Xây dựng màn hình làm bài Test tiếng Nhật** | `/impeccable shape` để lên luồng làm bài + `/impeccable distill` để tối giản giao diện + `/impeccable harden` để bảo vệ trạng thái làm bài & xử lý IME tiếng Nhật. |
| **Xây dựng kho tài liệu / bài giảng tiếng Nhật** | Chế độ `Read` của `impeccable` + `/impeccable typeset` để tối ưu hiển thị Kanji/Furigana + Skill `slides` khi cần xuất bài giảng dạng trình chiếu. |
| **Kiểm tra và sửa lỗi UI trước khi bàn giao** | Chạy `impeccable.cmd detect` + `/impeccable audit` + `/impeccable polish`. |

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
