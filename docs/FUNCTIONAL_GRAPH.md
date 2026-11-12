# Sơ đồ Luồng Chức năng & Nghiệp vụ (Functional Graph) — Shinme (`shinme-jp`)

Tài liệu trực quan hóa toàn bộ cấu trúc chức năng, phân quyền người dùng và các luồng nghiệp vụ chính trong hệ thống **Shinme LMS**.

---

## 1. Bản đồ Phân hệ & Phân quyền Chức năng theo Vai trò

```mermaid
flowchart LR
    Public["Trang chủ Shinme (/)\n& Đăng nhập (/login)"] --> PortalEntry{"Đăng nhập vào\nCổng LMS (/portal)"}

    PortalEntry --> RoleGuest["Vai trò: Khách (guest)"]
    PortalEntry --> RoleStudent["Vai trò: Học viên (student)"]
    PortalEntry --> RoleSensei["Vai trò: Giáo viên (sensei)"]
    PortalEntry --> RoleAdmin["Vai trò: Quản trị viên (admin)"]

    subgraph GuestScope["Phạm vi Khách"]
        G1["Tổng quan: Báo chưa vào lớp\n(Ẩn Bảng tin lớp học)"]
        G2["Hồ sơ cá nhân & Đổi Avatar"]
    end

    subgraph StudentScope["Phạm vi Học viên"]
        S1["Tổng quan lớp đang học &\nBảng tin thông báo lớp"]
        S2["Làm bài thi JLPT & Nộp BTVN"]
        S3["Xem Sổ điểm cá nhân"]
        S4["Xem Kho học liệu & Lịch lớp\n(Ẩn danh sách HV lớp khác)"]
    end

    subgraph SenseiScope["Phạm vi Giáo viên"]
        T1["Quản lý lớp phụ trách &\nĐăng/Ghim Bảng tin"]
        T2["Soạn đề thi JLPT (4 dạng Mondai)"]
        T3["Giao & Chấm bài tập tuần"]
        T4["Xem Sổ điểm lớp + Xuất CSV"]
        T5["Upload học liệu & Link Drive"]
    end

    subgraph AdminScope["Phạm vi Quản trị viên"]
        A1["Quản lý Người dùng (/portal/users)\nXếp lớp HV & Bổ nhiệm Sensei"]
        A2["Thêm / Sửa / Xóa Lớp học"]
        A3["Quản lý Khách tư vấn (Leads)"]
        A4["Toàn quyền Khảo thí & Sổ điểm"]
    end

    RoleGuest --> GuestScope
    RoleStudent --> StudentScope
    RoleSensei --> SenseiScope
    RoleAdmin --> AdminScope
```

---

## 2. Luồng Vòng đời Tài khoản: Đăng ký Khách → Xếp lớp / Bổ nhiệm Giáo viên

```mermaid
flowchart TD
    NewUser(["Người dùng mới\n(Học viên hoặc Giáo viên)"]) -->|"Đăng ký bằng Email / Gmail"| AutoGuest["Hệ thống tạo hồ sơ Firestore\nrole: 'guest' | Mã: KH-XXXX\nclassId: Trống"]
    AutoGuest --> EnterPortal["Đăng nhập vào /portal"]

    EnterPortal --> GuestUI["Chỉ hiện 2 menu:\n1. Tổng quan ('Bạn chưa vào lớp học nào')\n2. Hồ sơ cá nhân & Đổi Avatar"]

    AdminAction(["Admin truy cập\n/portal/users"]) --> SearchUser["Tìm kiếm user theo Tên / Email / Mã\nhoặc lọc nhóm 'Khách chưa xếp lớp'"]

    SearchUser --> Decision{"Phân loại thành viên"}

    Decision -->|"Là Học viên mới"| AssignClass["Bấm 'Xếp vào lớp'\nChọn lớp (VD: N3-Tối 246)"]
    AssignClass --> BecomesStudent["Cập nhật Firestore:\nrole: 'student' | Mã: HV-XXXX\nGán classId & className"]
    BecomesStudent --> StudentUnlocked["Tài khoản tự động mở khóa:\nBảng tin, Đề thi, BTVN, Học liệu lớp"]

    Decision -->|"Là Giáo viên mới"| AssignTeacher["Bấm 'Gán làm Giáo viên'\nChọn 1 hoặc nhiều lớp phụ trách"]
    AssignTeacher --> BecomesSensei["Cập nhật Firestore:\nrole: 'sensei' | Mã: SS-XXXX\nGhi senseiId & senseiName vào các lớp"]
    BecomesSensei --> SenseiUnlocked["Tài khoản mở khóa quyền Sensei:\nSoạn đề, Chấm bài, Đăng bảng tin"]
```

---

## 3. Luồng Khảo thí JLPT, Bài tập & Sổ điểm

```mermaid
flowchart TB
    subgraph TeacherFlow["Quy trình của Sensei / Admin"]
        CreateTest["Soạn đề thi JLPT (/portal/tests/create)\n- Standard / ★ Ghép sao / Dokkai / Choukai\n- Furigana Kanji[reading], Trộn đề"]
        CreateAsg["Tạo Bài tập tuần (/portal/assignments)\n- Kanji / Ngữ pháp / Đọc hiểu / Kaiwa\n- Hạn nộp & Thang điểm"]
    end

    subgraph StudentFlow["Quy trình của Học viên"]
        TakeTest["Làm bài thi (/portal/tests/id/take)\n- Đếm ngược thời gian thực\n- Giới hạn lượt nghe Audio Choukai"]
        DoAsg["Làm & Nộp BTVN (/portal/assignments)\n- Gõ trực tiếp đáp án hoặc dán link"]
    end

    subgraph GradingFlow["Chấm điểm & Tổng hợp"]
        AutoGrade["Chấm điểm tự động ngay lập tức\nLưu vào test_submissions"]
        ManualGrade["Sensei chấm bài & Chọn mẫu nhận xét nhanh\nLưu vào assignments.submissions"]
        Gradebook["Sổ điểm Kiểm tra (/portal/gradebook)\n- HV xem lịch sử & điểm cá nhân\n- Sensei/Admin lọc theo lớp & Xuất CSV"]
    end

    CreateTest -->|"Hiển thị cho lớp"| TakeTest
    TakeTest -->|"Nộp bài"| AutoGrade
    AutoGrade --> Gradebook

    CreateAsg -->|"Giao cho lớp"| DoAsg
    DoAsg -->|"Gửi bài làm"| ManualGrade
    ManualGrade -->|"Phản hồi điểm & lời khuyên"| DoAsg
```

---

## 4. Luồng Tuyển sinh & Chăm sóc Khách hàng (Landing Page → Leads)

```mermaid
flowchart LR
    Visitor(["Khách truy cập\nTrang chủ (/)"]) --> PathA["Làm Bài Thi thử Mini 15 phút\n(#thi-thu)"]
    Visitor --> PathB["Điền Form Tư vấn Lộ trình\n(#tu-van)"]

    PathA -->|"Xem điểm ước lượng & Điền SĐT"| SaveLead["Lưu vào Firestore collection 'leads'\n(Họ tên, SĐT, Trình độ, Mục tiêu, Điểm test)"]
    PathB -->|"Bấm Gửi đăng ký"| SaveLead

    SaveLead --> AdminLeads["Admin xem danh sách tại\n/portal/leads"]
    AdminLeads --> Consult["Tư vấn xếp lớp & Hướng dẫn\nkhách tạo tài khoản trên /login"]
```

