# SEM 1 OS — Personal Command Center

Một personal productivity operating system chạy hoàn toàn trên trình duyệt (không backend, không database) để quản lý lịch học, task, focus time, mục tiêu học kỳ và thống kê tiến độ.

## Cấu trúc project

```
sem1os/
├── index.html          # Shell chính: sidebar, topbar, 6 views, command palette, bottom nav
├── css/
│   └── app.css         # Toàn bộ design system: tokens, layout, components, responsive
├── js/
│   ├── data.js          # Dữ liệu tĩnh: lịch học (giữ nguyên 100%), goals mặc định, nhãn danh mục
│   ├── utils.js          # Hàm tiện ích: giờ/phút, ngày ISO, định dạng, greeting theo giờ
│   ├── state.js          # Lớp persistence (localStorage) + XP/level/streak/daily score
│   ├── schedule.js       # Logic + render timeline, xác định buổi NOW/NEXT
│   ├── tasks.js          # Smart task list: lọc/sắp xếp/hiển thị
│   ├── focus.js          # Focus timer engine (start/pause/finish, preset 25/50/90/tuỳ chỉnh)
│   ├── goals.js          # Render goal cards + sparkline tiến độ
│   ├── stats.js          # Weekly summary, phân bổ theo danh mục, heatmap 35 ngày
│   ├── command.js        # Command palette (Ctrl/Cmd + K)
│   └── app.js            # Bootstrap: routing, Next Action Engine, wiring sự kiện, đồng hồ
└── README.md
```

Toàn bộ là **vanilla HTML/CSS/JS** — không build step, không framework, chạy tốt trên GitHub Pages.

## Chạy local

Vì `index.html` chỉ dùng script thường (không phải ES module) và không `fetch()` file ngoài, bạn có thể:

- Mở trực tiếp `index.html` bằng trình duyệt (double click), **hoặc**
- Chạy một static server đơn giản để trải nghiệm sát với môi trường deploy:
  ```bash
  cd sem1os
  python3 -m http.server 8000
  # rồi mở http://localhost:8000
  ```

## Deploy GitHub Pages

1. Push toàn bộ thư mục `sem1os/` (đổi tên thành tên repo nếu cần) lên GitHub.
2. Vào **Settings → Pages**, chọn branch `main` (hoặc `master`) và thư mục `/root`.
3. Đảm bảo `index.html` nằm ở root của thư mục được publish — tất cả đường dẫn trong project đều là **relative path** (`css/app.css`, `js/app.js`, …) nên hoạt động đúng ở bất kỳ subpath nào (kể cả `username.github.io/repo-name/`).
4. Sau vài phút, trang sẽ có tại `https://<username>.github.io/<repo>/`.

## Dữ liệu & persistence

- Dữ liệu người dùng (tasks, buổi đã hoàn thành, lịch sử focus, XP/streak, mục tiêu) được lưu trong `localStorage` dưới key `sem1os:v3`. Reload trang không mất dữ liệu.
- Nếu trình duyệt chặn `localStorage` (chế độ ẩn danh nghiêm ngặt, v.v.), app vẫn chạy được trong phiên hiện tại và sẽ hiện toast cảnh báo là dữ liệu sẽ không được lưu.
- Lịch học (`js/data.js`) là dữ liệu tĩnh, **giữ nguyên 100%** nội dung gốc: thứ, giờ, môn học, mô tả, loại buổi, phòng học.

## Feature đã implement

- **Home / Command Center**: greeting theo giờ, đồng hồ realtime, hero NOW/NEXT/DAY COMPLETE/CATCH UP, timeline hôm nay có highlight buổi hiện tại, progress bar + stats, tuần-tại-một-cái-nhìn.
- **Next Action Engine**: gợi ý hành động cụ thể dựa trên buổi hiện tại/sắp tới và số phút còn lại.
- **Schedule**: xem đầy đủ lịch 7 ngày, chuyển ngày, đánh dấu hoàn thành từng buổi.
- **Smart Tasks**: title, category, priority, deadline, estimated time, status; thêm/sửa trạng thái/xoá; filter Hôm nay/Sắp tới/Hoàn thành/Tất cả; sort theo ưu tiên/hạn chót/mới tạo.
- **Focus Mode**: vòng tròn tiến trình, preset 25/50/90 phút + tuỳ chỉnh, start/pause/finish, tự động cộng XP/streak/lịch sử khi hoàn thành.
- **Goals**: current/target/progress bar/deadline/sparkline lịch sử, cập nhật progress trực tiếp.
- **Analytics**: tổng quan 7 ngày (giờ học, giờ focus, task hoàn thành, completion rate, streak hiện tại/cao nhất), phân bổ thời gian theo danh mục, heatmap hoạt động 35 ngày kiểu contribution graph.
- **Gamification nhẹ**: XP, level (hiển thị ở sidebar), daily score ngầm dùng cho heatmap.
- **Command Palette**: `Ctrl/Cmd + K`, tìm và chạy lệnh, điều hướng bằng bàn phím.
- **Keyboard shortcuts**: `H` `S` `T` `F` `N` để điều hướng nhanh, `Esc` đóng modal.
- **Responsive**: sidebar desktop → bottom navigation trên mobile, layout co giãn 3 → 2 → 1 cột.
- **Empty/error states**: task rỗng, chưa có lịch sử focus, cảnh báo khi localStorage lỗi.
- **Accessibility**: HTML semantic (`aside/nav/main/header/section`), `:focus-visible`, `aria-label` cho icon button, tôn trọng `prefers-reduced-motion`.

## Feature chưa implement / rút gọn so với bản đề xuất đầy đủ

- **Light mode**: chưa có — dark mode là chế độ duy nhất (đúng theo ưu tiên "5 feature cực kỳ tốt" hơn là dàn trải).
- **Modal chuyên dụng cho input tuỳ chỉnh**: phiên focus "Tuỳ chỉnh" hiện dùng `prompt()` của trình duyệt thay vì modal riêng.
- **Goal history chart nâng cao**: chỉ có sparkline đơn giản (SVG polyline), chưa có biểu đồ tương tác đầy đủ.
- **Most productive day/time nâng cao**: analytics hiện dựa trên dữ liệu bạn tự tạo ra khi dùng app (sẽ có ý nghĩa dần theo thời gian sử dụng), chưa suy luận "khung giờ năng suất nhất" chi tiết theo từng giờ trong ngày.
- **Đồng bộ nhiều thiết bị**: dữ liệu chỉ lưu local trên từng trình duyệt (đúng yêu cầu "không backend, không database").

Đã test: chuyển đủ 6 view, thêm/xoá/hoàn thành task, đánh dấu buổi học, chạy trọn 1 phiên focus, cập nhật goal, mở command palette và phím tắt — không có lỗi console (kiểm tra bằng smoke test tự động, không dùng trình duyệt thật).
