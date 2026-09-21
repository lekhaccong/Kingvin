# Nghiên cứu upstream heidi-luong1109/games

Nguồn tham khảo: https://github.com/heidi-luong1109/games  
Upstream commit được ghim: `a2278e9c8845f18748688d896564dc8531d1c64d`

## Kết luận sơ bộ

- Repo upstream là client Cocos2d-JS đã build, không phải full backend.
- `server.js` chỉ dùng Express để phục vụ thư mục `public` trên cổng 8090.
- Logic client tập trung trong `public/game.min.js` (minified, khoảng 6.5 MB).
- Xóc Đĩa có bộ resource riêng tại `public/res/CardGame/ResXocDia`, gồm sprite/plist, âm thanh và animation.
- Lobby và icon game nằm dưới `public/res/Lobby` và `public/res/LobbyNew`.
- `package.json` upstream khai báo license `ISC`, nhưng GitHub repository metadata không nhận diện license và không có LICENSE file ở root.

## Cách dùng trong KINGVIN

Không thay thế code KINGVIN hiện tại bằng client upstream. KINGVIN đã có:
- `src/components/games/xocdia-table.tsx`
- `src/components/games/taixiu-table.tsx`
- `src/components/games/baucua-table.tsx`
- `src/lib/game/engine.ts`
- `src/lib/game/rules.ts`
- `src/lib/game/wallet.ts`

Dùng upstream để:
1. Đối chiếu bố cục, animation và luồng UI Xóc Đĩa.
2. Xác định tài nguyên/âm thanh cần thay thế bằng asset do KINGVIN kiểm soát.
3. Viết lại component Xóc Đĩa bằng React/TypeScript, giữ engine/wallet server-authoritative của KINGVIN.
4. Không mang logo, thương hiệu, banking/cash-out hay tài nguyên có quyền sở hữu không rõ ràng vào bản phát hành.

## Khởi tạo submodule

```bash
git submodule update --init --recursive
```

Mục đích của submodule là cố định một snapshot để nghiên cứu và so sánh; không coi upstream là backend production.
