# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Quản trị viên & Vận hành trung tâm (Admin / Staff):** Quản lý danh sách học viên, giáo viên, lớp học, phân bổ tài liệu và theo dõi tình hình đào tạo tại trung tâm tiếng Nhật Shinme.
- **Giáo viên (Teachers - người Nhật / người Việt / quốc tế):** Quản lý lớp phụ trách, biên soạn và phân phối tài liệu học tập, giao bài tập, tổ chức bài kiểm tra (test) và theo dõi tiến độ từng học viên.
- **Học viên (Students):** Truy cập tài liệu bài học, làm và nộp bài tập, thực hiện các bài kiểm tra đánh giá năng lực tiếng Nhật và theo dõi kết quả học tập của bản thân.

## Product Purpose
Hệ thống quản lý đào tạo, vận hành và học tập tập trung (LMS & Quản lý trung tâm) dành cho trung tâm tiếng Nhật **Shinme** (`shinme-jp`). Sản phẩm giúp chuẩn hóa và số hóa toàn bộ quy trình từ quản lý hồ sơ học viên, giáo viên đến phân phối học liệu, giao bài tập và tổ chức thi/kiểm tra trên một nền tảng web thống nhất.

## Positioning
Nền tảng vận hành và đào tạo nội bộ được thiết kế chuyên biệt cho nghiệp vụ giảng dạy tiếng Nhật của trung tâm Shinme — kết hợp chặt chẽ giữa quản trị học vụ (học viên, giáo viên) và học tập chuyên sâu (học liệu tiếng Nhật, bài tập, bài test) với khả năng vận hành đa ngôn ngữ liền mạch (Nhật - Việt - Anh) cho cả đội ngũ giáo viên bản xứ lẫn học viên và quản lý.

## Operating Context
- Sử dụng hàng ngày trong môi trường đào tạo của trung tâm tiếng Nhật Shinme trên cả máy tính (giáo viên soạn bài, chấm bài, admin quản lý dữ liệu bảng biểu) và thiết bị di động/máy tính bảng (học viên xem tài liệu, làm bài tập, làm bài test nhanh).
- Thường xuyên làm việc với văn bản tiếng Nhật (Kanji, Hiragana, Katakana, cấu trúc câu, đoạn hội thoại, đề thi theo chuẩn tiếng Nhật) song song với giao diện/hướng dẫn bằng tiếng Việt và tiếng Anh.

## Capabilities and Constraints
- **Quản lý học viên:** Hồ sơ học viên, phân lớp, lịch sử học tập, chuyên cần và kết quả đánh giá.
- **Quản lý giáo viên:** Hồ sơ giảng viên, lịch giảng dạy, lớp phụ trách và học liệu biên soạn.
- **Hệ thống tài liệu (Materials/Docs):** Lưu trữ, phân loại theo trình độ/bài học và chia sẻ giáo trình, tài liệu tham khảo.
- **Hệ thống bài tập (Assignments):** Tạo bài tập, giao theo lớp/cá nhân, nộp bài, chấm điểm và phản hồi.
- **Hệ thống bài kiểm tra (Tests/Exams):** Ngân hàng câu hỏi/đề thi, làm bài test trực tuyến, chấm điểm và thống kê kết quả.
- **Đa ngôn ngữ bắt buộc (i18n):** Hỗ trợ đầy đủ 3 ngôn ngữ **Tiếng Nhật (JA)**, **Tiếng Việt (VI)** và **Tiếng Anh (EN)**.
- **Trạng thái kỹ thuật hiện tại:** Dự án mới khởi tạo (greenfield), chưa chốt tech stack/framework cụ thể (sẽ xác nhận khi bắt đầu dựng mã nguồn).

## Brand Commitments
- **Tên thương hiệu:** **Shinme** (`shinme-jp`).
- Bảo toàn tên thương hiệu, logo và các nội dung/tài liệu giảng dạy thực tế của trung tâm khi được đưa vào hệ thống.

## Evidence on Hand
- Repository hiện đang ở giai đoạn khởi tạo (chưa có mã nguồn giao diện, logo file hay dữ liệu mẫu).
- Không tự ý bịa đặt số liệu thống kê học viên, chứng chỉ, đối tác hay đánh giá khi chưa được cung cấp dữ liệu thực tế.

## Product Principles
1. **Rõ ràng và hiệu suất vận hành (Operational Clarity):** Ưu tiên khả năng quét thông tin nhanh, thao tác quản lý học viên, chấm bài và tra cứu tài liệu chính xác, ít bước thừa.
2. **Tôn trọng đặc thù hiển thị tiếng Nhật & Đa ngôn ngữ (Multilingual & CJK Fidelity):** Đảm bảo hiển thị chữ Nhật (Kanji/Kana) rõ nét, dễ đọc ở mọi kích thước cùng khả năng chuyển đổi mượt mà giữa Tiếng Nhật, Tiếng Việt và Tiếng Anh mà không vỡ bố cục.
3. **Trải nghiệm làm bài tập trung, không xao nhãng (Focused Learning & Testing):** Khu vực học liệu, làm bài tập và làm bài test của học viên phải trực quan, giảm thiểu yếu tố gây nhiễu để tối ưu sự tập trung.
4. **Nhất quán theo vai trò (Role-Appropriate Precision):** Phục vụ đúng ngữ cảnh của từng nhóm người dùng (Admin cần tổng quan dữ liệu, Giáo viên cần công cụ soạn/chấm bài nhanh, Học viên cần lộ trình học và làm bài rõ ràng).

## Accessibility & Inclusion
- Hỗ trợ hiển thị đa ngôn ngữ (JA / VI / EN) với độ tương phản rõ ràng, font chữ dễ đọc cho cả ký tự CJK (tiếng Nhật) và chữ cái Latin có dấu (tiếng Việt) trên cả màn hình máy tính và thiết bị di động.
