# Changelog — Kim Lân

## 2026-09-18

### ANDROID APK

- Thêm dự án Android Capacitor, package `com.kingvin.club`.
- GitHub Actions tự build và xuất artifact `KimLan-debug-apk`.
- Địa chỉ server lấy từ GitHub Actions variable `KINGVIN_SERVER_URL`.
- Nếu chưa cấu hình server, APK hiển thị màn hình hướng dẫn thay vì trang trắng.
- Chỉ cho phép server HTTPS; có quyền Internet và biểu tượng Kim Lân riêng.

### WALLET ATOMICITY

- Đặt cược: trừ ví, ghi sổ cái và tạo/cộng vé cược chạy trong cùng transaction.
- Trả thưởng: khóa kết quả, chốt toàn bộ vé và cộng xu chạy trong cùng transaction.
- Nhận xu ngày: ghi lượt nhận và cộng ví chạy trong cùng transaction.
- Mỗi tài khoản chỉ nhận một gói xu mỗi ngày, không thể nhận cả daily lẫn relief.
- PostgreSQL và PGLite dùng chung giao diện transaction để preview và production đồng nhất.

### BUILD

- Đồng bộ package lock cho `npm ci`.
- Bổ sung `initdb.wasm`, `pglite.wasm`, `pglite.data` vào production bundle.

## 2026-09-15

### MODULE

Nền tảng giải trí xu ảo (không dùng được file `KINGVIN-Server.rar` — không có trong workspace).

### FILE

Toàn bộ app mới trên TanStack Start + Postgres/PGLite.

### OLD BEHAVIOR

Source KINGVIN gốc không giải nén được trong môi trường này (thiếu archive).

### NEW BEHAVIOR

- Bàn Tài Xỉu / Bầu Cua / Xóc Đĩa chạy theo đồng hồ máy chủ: đặt → khóa → kết quả → ván mới.
- Restart không làm kẹt ván; phase tính từ `started_at`.
- Ví atomic + sổ cái; cược có `requestId`.
- Xu ảo only — không nạp, không rút.
- `GET /api/health` + trang Vận hành.
- Auth Google / X / email.

### REASON

Ưu tiên vòng đời Tài Xỉu không chờ vô hạn, có thể chơi ngay trên preview.

### TEST RESULT

- 1000 lần settle Tài Xỉu (unit): pass
- Health: betting → lock → result → roundId tăng
- Đăng ký email → đặt 1.000 xu Tài → sổ cái welcome / bet / payout, số dư 101.000
- Typecheck + production build: pass
