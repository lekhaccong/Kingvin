# Kim Lân

Nền tảng game xu ảo gồm website TanStack Start, PostgreSQL/PGLite và ứng dụng
Android Capacitor.

## Kiểm tra source

```bash
npm ci
npm run typecheck
npm run lint
npm run build
```

## Build APK

Đọc [ANDROID_BUILD.md](ANDROID_BUILD.md). GitHub Actions workflow
`Build Android APK` tạo artifact `KimLan-debug-apk` sau mỗi thay đổi Android
trên nhánh `main` hoặc khi chạy thủ công.

> Dự án chỉ sử dụng xu ảo, không hỗ trợ nạp hoặc rút tiền thật.
