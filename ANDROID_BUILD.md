# Build APK Kim Lân trên GitHub

Ứng dụng Android là vỏ cài đặt cho website game. Server và database vẫn chạy
trực tuyến để nhiều điện thoại nhìn thấy cùng một ván và cùng một số dư.

## Cấu hình một lần

1. Triển khai website game lên một địa chỉ HTTPS hoạt động ổn định.
2. Trong repository GitHub, mở **Settings → Secrets and variables → Actions → Variables**.
3. Tạo biến `KINGVIN_SERVER_URL`, ví dụ `https://game.tenmiencuaban.vn`.

## Build APK

1. Mở tab **Actions**.
2. Chọn workflow **Build Android APK**.
3. Chọn **Run workflow**.
4. Khi workflow hoàn tất, tải artifact **KimLan-debug-apk** và giải nén để lấy
   `app-debug.apk`.

Nếu chưa đặt `KINGVIN_SERVER_URL`, APK vẫn cài được nhưng chỉ hiển thị màn hình
hướng dẫn cấu hình máy chủ.
