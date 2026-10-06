# Ném Cứt Phá Đám (FA Strike)

Web game dọc 9:16: bạn là kẻ phá đám bí ẩn trong công viên, ném “cục” vào các cặp đôi trước khi bảo vệ tóm được.
Bản concept và 9 quyết định thiết kế đã chốt nằm ở [docs/concept-review.html](docs/concept-review.html).

## Chạy

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # kiểm tra kiểu + build ra dist/ (web tĩnh, deploy ở đâu cũng được)
```

## Điều khiển

| Thao tác | Mobile | Desktop |
| --- | --- | --- |
| Ngắm + ném | Chạm, kéo ngược kiểu súng cao su, thả tay | Kéo chuột |
| Núp | Giữ nút **NÚP** | Giữ **Space** |
| Đổi đạn | Chạm ô Cục bên trái | Phím **1–6** |
| Tạm dừng | Nút ⏸ | **Esc** / **P** |

## Luật chính

- Mỗi màn có mục tiêu “phá đám N cặp” trong thời gian giới hạn. Còn dư giờ được thưởng 20 điểm/giây.
- Điểm một cú = (điểm gốc + 50 nếu ở làn xa) × combo (5 cú: ×2, 10 cú: ×3) × Cục Vàng (×2).
- Điểm gốc: 100 một người · 300 Double Hit · 1.000 trúng đúng lúc tỏ tình · 1.500 lúc mở nhẫn cầu hôn.
- Ném trúng người vô tội bị trừ điểm cố định và tăng **Nghi Ngờ**. Ông bà −200, các NPC khác −50.
- Thanh Nghi Ngờ đầy thì bảo vệ chạy tới bụi cây lục 3 giây. Đang đứng là bị bắt (Game Over), giữ NÚP là thoát.
- Cặp đôi có thể né rồi ném dép ngược. Thấy dấu **!** thì NÚP, không thì choáng 1,5 giây và mất combo.
- Chó đớp cục đang bay: mất lượt ném nhưng giữ combo. Cục ném hụt nằm lại 5 giây, trẻ con có thể nhặt đi mách.
- Boss màn 10 có 3 lớp lá chắn. Lớp 1: ném trúng bất kỳ ai. Lớp 2: chỉ ném người đang phát sáng. Lớp 3: Double Hit lúc hai người ôm nhau.

## Cấu trúc

```
src/
  art/kit.ts        Bộ vẽ SVG: người, Cục, chó, cảnh vật (cùng tỉ lệ với bản concept)
  art/sprites.ts    Định nghĩa nhân vật + trạng thái, raster SVG → canvas, nền theo giờ trong ngày
  config.ts         Thế giới 360×640, làn, điểm, nghi ngờ, bảng 10 màn
  game/play.ts      Vòng chơi: input, spawn, va chạm, tính điểm, kết thúc màn
  game/couple.ts    6 kiểu cặp đôi (kể cả ông bà) và khoảnh khắc tỏ tình
  game/npc.ts       Bảo vệ, bà cô, trẻ con, nhiếp ảnh gia, người đi đường, chó
  game/boss.ts      Boss 3 lớp lá chắn
  game/render.ts    Vẽ cảnh theo chiều sâu + HUD
  ui/screens.ts     Menu, chọn màn, giới thiệu màn, tạm dừng, kết quả (DOM)
  core/             Âm thanh tổng hợp WebAudio, lưu tiến độ localStorage, tiện ích
```

Không có file ảnh hay âm thanh: mọi hình vẽ bằng SVG lúc chạy, mọi âm thanh tổng hợp bằng WebAudio.

## Nhạc nền

4 bài chiptune tự soạn trong [src/core/music.ts](src/core/music.ts), phát bằng bộ lập lịch WebAudio:

| Bài | Dùng ở | Nhịp |
| --- | --- | --- |
| Rình Rập | Menu, chọn màn, kết quả | 98 BPM, La thứ, shuffle |
| Công Viên Tình Yêu | Màn 1–6 (sáng, hoàng hôn) | 132 BPM, Fa trưởng, 16 ô nhịp |
| Đêm Rình Rập | Màn 7–9 (tối) | 116 BPM, Rê thứ, shuffle |
| Lá Chắn Tình Yêu | Boss | 152 BPM, Mi thứ |

- Thanh Nghi Ngờ từ 60 trở lên (hoặc lớp lá chắn cuối của boss) thì nhạc thêm hi-hat dồn dập và rải hợp âm to hơn.
- Tạm dừng thì nhạc nhỏ lại, kết thúc màn thì nhạc tắt dần để nghe đoạn nhạc thắng/thua, sau đó quay về nhạc menu.
- Tab bị ẩn thì toàn bộ âm thanh dừng.
- Nút **Nhạc** và **Âm thanh** bật/tắt riêng, có ở màn hình chính và màn tạm dừng, được lưu lại.
- Muốn sửa bài: mỗi bài là một vòng hợp âm (một hợp âm mỗi ô nhịp), giai điệu dạng `Nốt:độ dài` theo nốt móc kép, và mẫu bass/rải hợp âm/trống 16 ô.

Khi chạy `npm run dev`, console có `window.__ncpd` để điều khiển màn chơi khi kiểm thử
(`__ncpd.startLevel(5)`, `__ncpd.play.update(1/60)`, `__ncpd.music.play('boss')`, `__ncpd.autoPause = false`).

## Ngôn ngữ

Game có tiếng Việt và tiếng Anh. Lần đầu mở, game chọn theo ngôn ngữ trình duyệt; nút 🌐 ở màn hình chính và màn tạm dừng để đổi, lựa chọn được lưu lại.
Mọi chuỗi hiển thị nằm trong [src/i18n.ts](src/i18n.ts). Bản tiếng Anh bắt buộc có đủ khóa như bản tiếng Việt (TypeScript báo lỗi nếu thiếu).
Tên game: **Ném Cứt Phá Đám** (VI) / **FA Strike** (EN).

## Video quảng bá

Trailer dọc 1080×1920, **1 phút 41 giây**, 30 fps, H.264 + AAC, dựng thẳng từ engine game (cùng nhân vật, cùng luật, cùng nhạc).
Bản đã xuất: `promo/fa-strike-promo-vi.mp4`, `promo/fa-strike-promo-en.mp4` (khoảng 100 MB mỗi file), kèm ảnh bìa `promo/fa-strike-poster-*.png`.

| Hồi | Thời điểm | Nội dung |
| --- | --- | --- |
| Mở đầu | 0:00 | Công viên toàn cặp đôi, kẻ phá đám ló ra từ bụi cây, logo đập vào giữa mưa "cục" |
| Cách chơi | 0:11 | 6 loại Cục, kéo · ném · SPLAT, Double Hit, canh khoảnh khắc tỏ tình (💔 +1.000) |
| Đa dạng | 0:26 | Dàn 6 kiểu cặp đôi, combo ×2, Cục Bom nổ 2 cặp, chó đớp mất cục, lỡ tay ném ông bà (−200), cặp đôi né rồi ném dép |
| Kịch tính | 1:00 | Phá màn cầu hôn (+1.500), bảo vệ truy đuổi và núp thoát, rồi một lần bị bắt, 10 màn từ sáng tới đêm |
| Boss | 1:20 | Giới thiệu boss, đánh đủ 3 lớp lá chắn, cảnh kết "họ vẫn yêu nhau" |
| Kết | 1:34 | Logo, các con số nổi bật, CHƠI NGAY |

Kịch bản nằm trong [src/promo/](src/promo/): `sequence.ts` (thứ tự và độ dài cảnh), `scenes.ts` và `scenes-late.ts` (từng cảnh), `copy.ts` (chữ VI/EN).
Nhạc nền tự đổi theo cảnh (mỗi cảnh khai báo bài nhạc), các cảnh liền nhau cùng bài thì nhạc chạy liền mạch.

Dựng lại sau khi sửa:

```bash
npm run dev
```

Mở http://localhost:5173/promo.html, bấm **Xem thử** để xem có tiếng, hoặc **Xuất MP4** để ghi file vào `promo/` (khoảng 1 phút mỗi bản).
Việc mã hóa chạy hoàn toàn trong trình duyệt (WebCodecs + mediabunny), không cần ffmpeg; cần Chrome hoặc Edge bản mới.
Console có `__promo.probe('vi')` để chạy thử kịch bản và in điểm, combo, thông báo của từng cảnh.
File MP4 không được đưa vào git (nặng), ảnh bìa thì có.

## Chưa làm

- Cửa hàng skin (Ninja, Ông Chú FA, Học sinh, Hacker, Siêu anh hùng) và Mèo Ghen Tị dạng thú đi kèm có kỹ năng.
- Chia sẻ điểm / clip lên mạng xã hội, bảng xếp hạng.
