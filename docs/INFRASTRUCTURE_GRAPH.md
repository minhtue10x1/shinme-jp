# Kiến trúc Hạ tầng Hệ thống (Infrastructure Graph) — Shinme (`shinme-jp`)

Tài liệu mô tả kiến trúc hạ tầng triển khai, luồng xác thực, cơ chế lưu trữ và quy trình CI/CD hiện tại của dự án **Shinme Japanese Center**.

---

## 1. Sơ đồ Hạ tầng Tổng thể (Full-stack Hybrid Architecture)

```mermaid
flowchart TB
    subgraph ClientLayer["Lớp Người dùng (Browser / Mobile / Desktop)"]
        UI["React 19.3 + Tailwind CSS v4\n(Landing Page & LMS Portal)"]
        Canvas["HTML5 Canvas Compressor\n(Nén ảnh Avatar 256x256 WebP/JPEG)"]
        SessionMgr["Session Manager\n(Rolling Session 7 ngày trong localStorage)"]
    end

    subgraph EdgeLayer["Lớp Hosting & Runtime (Vercel)"]
        VercelCDN["Vercel Edge Network & CDN\n(Tĩnh hóa Static Routes + SSR Dynamic Routes)"]
        NextApp["Next.js 16.4.5 App Router\n(Turbopack Build)"]
    end

    subgraph FirebaseLayer["Firebase BaaS (Project: shinme-jp)"]
        FBAuth["Firebase Authentication\n(Email/Password + Google OAuth2)"]
        Firestore["Cloud Firestore Database\n(8 Collections thời gian thực)"]
    end

    subgraph ExternalMedia["Lưu trữ Tài liệu Nặng (Zero-Cost Media)"]
        GDrive["Google Drive / External Links\n(Giáo trình PDF, Slide, Audio Chokai)"]
    end

    UI <-->|"HTTPS / TLS"| VercelCDN
    VercelCDN <--> NextApp
    UI -->|"Chọn ảnh cá nhân"| Canvas
    Canvas -->|"Data URL (~15KB)"| Firestore
    UI <-->|"Heartbeat & Timeout"| SessionMgr
    UI <-->|"JWT ID Token + Auto Refresh"| FBAuth
    UI <-->|"Firebase SDK v13 (Realtime Read/Write)"| Firestore
    UI -->|"Mở / Tải tài liệu trực tiếp"| GDrive
```

---

## 2. Sơ đồ Quy trình Nhánh Git & CI/CD Deployment

```mermaid
flowchart LR
    Dev["Developer Local\n(Next.js + Turbopack)"] -->|"git push origin develop"| RepoDevelop["GitHub Branch: develop\n(Active Full-stack Hybrid)"]
    RepoDevelop -->|"Auto Webhook Trigger"| VercelBuild["Vercel CI/CD Build\n(next build)"]
    VercelBuild -->|"Deploy Production App"| VercelLive["Vercel Live URL\n(Dynamic SSR + Firebase BaaS)"]

    RepoMain["GitHub Branch: main\n(FROZEN Static Demo)"] -->|"Firebase Hosting Workflow"| FBHosting["Firebase Hosting\n(shinme-demo.web.app)"]

    style RepoMain fill:#fef3c7,stroke:#d97706,color:#92400e
    style FBHosting fill:#fef3c7,stroke:#d97706,color:#92400e
    style RepoDevelop fill:#dcfce7,stroke:#16a34a,color:#14532d
    style VercelLive fill:#dcfce7,stroke:#16a34a,color:#14532d
```

> [!IMPORTANT]
> Nhánh `main` được đóng băng riêng cho bản demo tĩnh trên Firebase Hosting (`shinme-demo.web.app`). Mọi tính năng mới, dữ liệu thật và cập nhật hệ thống đều đi qua nhánh **`develop`** và được Vercel tự động build/deploy.

---

## 3. Sơ đồ Cơ chế Xác thực & Phiên trượt 7 ngày (Rolling Session)

```mermaid
flowchart TD
    Start(["Người dùng truy cập Web"]) --> CheckAuth{"Firebase Auth\ncó phiên đăng nhập?"}
    CheckAuth -->|"Chưa"| GuestFallback["Trạng thái Khách chưa đăng nhập\n(Navbar hiện nút Đăng nhập)"]
    CheckAuth -->|"Đã có phiên"| CheckExpiry{"Kiểm tra localStorage\nshinme:last_active_at > 7 ngày?"}

    CheckExpiry -->|"Quá 7 ngày không vào"| AutoLogout["Gọi logoutUser() + clearSession()\nHiển thị Toast hết hạn phiên"]
    AutoLogout --> GuestFallback

    CheckExpiry -->|"Trong vòng 7 ngày"| RefreshTS["touchSession(true)\nGia hạn thêm 7 ngày mới"]
    RefreshTS --> FetchRole["Truy vấn Firestore: users/{uid}\nLấy role, classId, avatarUrl"]
    FetchRole --> ListenActivity["Bật Activity Listeners (5 phút throttle)\nclick / keydown / scroll / touchstart"]
    ListenActivity -->|"Mỗi lần tương tác"| RefreshTS
```

---

## 4. Sơ đồ Kiến trúc Dữ liệu & Lưu trữ Media

```mermaid
erDiagram
    USERS ||--o{ TEST_SUBMISSIONS : "nộp bài thi"
    USERS ||--o{ CLASSES : "giảng dạy / theo học"
    CLASSES ||--o{ TESTS : "được giao đề"
    CLASSES ||--o{ ASSIGNMENTS : "được giao bài tập"
    CLASSES ||--o{ ANNOUNCEMENTS : "nhận thông báo"
    CLASSES ||--o{ MATERIALS : "sở hữu học liệu"
    TESTS ||--o{ TEST_SUBMISSIONS : "chứa kết quả"

    USERS {
        string uid PK
        string email
        string role "guest | student | sensei | admin"
        string code "KH- | HV- | SS- | AD-"
        string fullName
        string classId FK
        string avatarUrl "Data URL 256x256 hoặc URL"
        string targetJLPT
    }

    CLASSES {
        string id PK
        string code
        string name
        string level "N5 | N4 | N3 | N2 | N1 | KAIWA"
        string senseiId FK
        string senseiName
        string schedule
        string room
    }

    TESTS {
        string id PK
        string code
        string title
        string classId FK
        number durationMinutes
        number passScore
        array questions "Standard | Star | Dokkai | Choukai"
    }

    TEST_SUBMISSIONS {
        string id PK
        string testId FK
        string studentId FK
        number score
        boolean passed
        number durationSeconds
        map answers
    }

    ASSIGNMENTS {
        string id PK
        string code
        string title
        string classId FK
        string type "Kanji | Ngu phap | Doc hieu | Kaiwa"
        string dueDate
        map submissions "uid -> score, feedback, answer"
    }

    ANNOUNCEMENTS {
        string id PK
        string classId FK
        string title
        string content
        boolean isPinned
    }

    MATERIALS {
        string id PK
        string classId FK
        string title
        string format "PDF | Audio | Slide | Doc"
        string fileUrl "Google Drive / Direct Link"
    }

    LEADS {
        string id PK
        string fullName
        string phone
        string currentLevel
        string targetGoal
        string status
    }
```

