# 🌿 HƯỚNG DẪN TRẢI NGHIỆM HỆ THỐNG SHINME (DÀNH CHO SENSEI)

Kính gửi các Sensei,  
Hệ thống Trung tâm Nhật ngữ Shinme đã hoàn thiện bản trải nghiệm trực tuyến (Demo). Sensei có thể mở trực tiếp bằng trình duyệt trên máy tính hoặc điện thoại theo đường link:

👉 **Link trải nghiệm:** [https://shinme-demo.web.app](https://shinme-demo.web.app)

---

## 💡 Nút thần kỳ: "Đổi vai trò" (Demo Role Switcher)
Khi vào mục **"Cổng LMS"** (hoặc truy cập [shinme-demo.web.app/portal](https://shinme-demo.web.app/portal)), ở ngay trên đầu trang có một thanh màu xanh đậm với 3 nút bấm:
- **Học viên (HV-Nam)**: Trải nghiệm đúng góc nhìn của học viên (nhận bài, làm bài thi, xem tài liệu).
- **Giáo viên (SS-Tanaka)**: Trải nghiệm góc nhìn của Sensei (soạn đề thi, đăng thông báo, xem sổ điểm của lớp).
- **Admin**: Quản trị trung tâm và danh sách học viên đăng ký tư vấn.

*Sensei chỉ cần bấm vào nút tương ứng là màn hình sẽ tự động chuyển đổi giao diện ngay lập tức mà không cần đăng nhập mật khẩu.*

---

## 🎯 4 TÍNH NĂNG CHÍNH SENSEI NÊN TRẢI NGHIỆM

### 1. Trải nghiệm làm bài kiểm tra tiếng Nhật như một học viên
Sensei chọn vai trò **Học viên** rồi vào mục **"Kiểm tra & Khảo thí"** (hoặc bấm [VÀO ĐÂY](https://shinme-demo.web.app/portal/tests/n3-mock-test-01/take/)):
- **Đầy đủ 4 dạng đề thi thật (Mondai)**:
  - *Trắc nghiệm Từ vựng / Ngữ pháp N3* (có sẵn chữ Hán kèm phiên âm Hiragana nhỏ trên đầu).
  - *Bài tập dấu sao ★*: Bấm trực tiếp vào các mảnh từ vựng để xếp vào 4 ô trống `___ ___ ★ ___`.
  - *Đọc hiểu (Dokkai)*: Chia đôi màn hình — bài đọc tiếng Nhật bên trái, câu hỏi bên phải, không phải cuộn trang lên xuống tìm đoạn văn.
  - *Nghe hiểu (Choukai)*: Bấm nút Nghe để phát giọng đọc hội thoại (hệ thống có đếm số lần nghe như thi thật).
- **Không lo mất bài**: Nếu đang làm bài mà lỡ tắt web hoặc tải lại trang (F5), toàn bộ câu đã chọn và thời gian còn lại vẫn được lưu nguyên vẹn.
- **Nộp bài & Xem giải thích**: Sau khi bấm **Nộp bài**, hệ thống sẽ chấm điểm ngay, hiển thị linh vật mầm cây Shinme cổ vũ *"Cố lên! ♡"*, kèm lời giải chi tiết cho từng câu hỏi.

---

### 2. Xem Sổ điểm lớp & "Câu hỏi học viên hay sai nhất" (Item Analysis)
Sensei chuyển sang vai trò **Giáo viên** và vào mục **"Sổ điểm & Thống kê"** (hoặc bấm [VÀO ĐÂY](https://shinme-demo.web.app/portal/gradebook/)):
- **Bảng điểm cả lớp**: Xem nhanh danh sách học viên nào đã làm bài, đạt bao nhiêu điểm, mất bao nhiêu phút, đã Đạt (Goukaku) hay Chưa đạt.
- **Mục "Câu hỏi học viên hay sai nhất"**: Hệ thống tự động phát hiện những câu ngữ pháp nào cả lớp đang chọn sai nhiều nhất và chỉ rõ *“câu bẫy nào học viên hay bị lừa nhất”* để Sensei biết và tập trung chữa bài trong buổi học tiếp theo.
- **Tải file Excel**: Bấm nút **"Xuất Bảng Điểm (.CSV)"** để tải toàn bộ bảng điểm của lớp về máy tính.

---

### 3. Thử tính năng Soạn đề thi có Furigana tự động
Sensei vào mục **"Soạn đề thi mới"** (hoặc bấm [VÀO ĐÂY](https://shinme-demo.web.app/portal/tests/create/)):
- **Gõ phiên âm siêu dễ**: Sensei chỉ cần gõ chữ Hán kèm cách đọc trong ngoặc vuông, ví dụ gõ:  
  `日本語[にほんご]で未来[みらい]をひらく`  
  -> Hệ thống sẽ tự động hiển thị phiên âm chữ nhỏ trên đầu chữ Hán ngay lập tức bên dưới.
- Sensei có thể chọn số phút làm bài, đặt hạn nộp bài, bật tính năng tự động đảo thứ tự câu hỏi và viết lời giải chi tiết cho học sinh.

---

### 4. Đăng thông báo dặn dò bài tập cho lớp
Sensei vào trang chính **Bảng điều khiển** ([shinme-demo.web.app/portal](https://shinme-demo.web.app/portal)):
- Bấm nút **"Đăng thông báo mới"** để viết dặn dò bài tập về nhà hoặc đổi lịch học.
- Có nút gạt **"Ghim thông báo quan trọng"** để đưa lên đầu bảng tin.
- Khi vừa đăng xong, Sensei bấm chuyển sang vai trò **Học viên** sẽ thấy thông báo của mình xuất hiện ngay lập tức trên bảng tin của học viên.

---

> 🌿 **Góp ý & Nhận xét**:  
> Bản demo này được thiết kế theo đúng quy chuẩn lớp học tiếng Nhật của Shinme. Trong quá trình bấm thử, nếu Sensei thấy cần điều chỉnh cỡ chữ, cách bố trí bài thi hay bổ sung dạng bài tập nào cho tiện giảng dạy, xin vui lòng gửi phản hồi lại để đội ngũ cập nhật ngay ạ!

