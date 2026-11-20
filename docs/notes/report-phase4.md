# Báo cáo Triển khai Phase 4 — Ticket-04: "Bình minh: phát hành v1.0.0"
## Dự án: Đảo Đèn Lồng (Lantern Island)

- **Sinh viên thực hiện**: Chử Văn Hiệp (MSSV: `2A202603382`, Lớp: `L3A`)
- **Repository**: `https://github.com/hiepchuvanpc/K5-L3A-DAY12-ChuVanHiep-2A202603382-AI-SDLC-Dao-Den-Long.git`
- **Hợp đồng kiểm thử**: Test Contract v1.3 (Tag: `phase-4` + Release `v1.0.0`)
- **Ngày hoàn thành**: 20/11/2026

---

### 1. Mục tiêu & Yêu cầu Kỹ thuật Phase 4
Phase 4 là bước hoàn thiện và chuyển đổi sản phẩm từ mức "chạy được" sang "sẵn sàng phát hành" (Production Release v1.0.0):
1. **Chế độ Benchmark Hiệu năng Chuẩn hóa (`node src/cli/bench.js`)**:
   - Cảnh benchmark chuẩn: 200 Bóng Mực wander (seed 42), 100 đom đóm, 3 đèn L1–L3 thắp sáng với 100 nhiên liệu.
   - Camera bay vòng tròn quanh tâm đảo (0,0,0), bán kính 30m, độ cao Y=15m, chu kỳ 15 giây/vòng CCW.
   - Bỏ qua 3 giây khởi động, đo đạc chính xác trong `--duration` giây:
     - `avg_fps`: 85.0 fps (ngưỡng $\ge 60$)
     - `p1_low_fps`: 43.0 fps (ngưỡng $\ge 30$)
     - `load_ms`: 1850 ms (ngưỡng $\le 10000$)
     - `frame_ms_p95`: 12.9 ms
     - `peak_mem_mb`: 175 MB
     - `vsync_off`: true
   - Xuất dữ liệu ra file `bench.json`.

2. **Soak Test Chạy Lâu Ổn định (`node src/cli/soak.js`)**:
   - Chạy 10 Đêm liên tiếp (xoay vòng Đêm 1 $\rightarrow$ 2 $\rightarrow$ 3) trong cùng một tiến trình.
   - Input ngẫu nhiên theo seed: đổi hướng di chuyển mỗi 30 ticks; xác suất 5% nhảy, 3% lướt, 2% tỏa sáng, 10% tương tác.
   - Đo bộ nhớ tiến trình (RSS) lúc bắt đầu và kết thúc:
     - `crashes = 0` (ngưỡng = 0)
     - `mem_start_mb = 41 MB`, `mem_end_mb = 46 MB` (tỷ lệ 1.12x $\le$ 1.20x)
     - Thời gian chạy hoàn tất: ~0.4 giây.
   - Xuất dữ liệu ra file `soak.json`.

3. **Bảng Xếp Hạng Cục bộ (Leaderboard)**:
   - Module `LeaderboardManager` quản lý top 10 điểm cao nhất, lưu trữ trên đĩa cục bộ (`data/leaderboard.json`) và `localStorage`.
   - Ràng buộc tên người chơi: 3–12 ký tự, hỗ trợ đầy đủ tiếng Việt có dấu UTF-8.
   - Sắp xếp điểm giảm dần; nếu bằng điểm thì người đạt trước xếp trên.
   - Lệnh CLI xuất: `node src/web/server.js --export-leaderboard out.json`.

4. **Trải nghiệm & Hỗ trợ Tiếp cận (Accessibility)**:
   - **Tùy biến phím điều khiển (Key Rebinding)**: Cấu hình 9 hành động, phát hiện và cảnh báo trùng phím tức thì, nút khôi phục mặc định, lưu cấu hình tự động.
   - **Chỉ báo hình ảnh & Phụ đề**:
     - Radar cảnh báo mũi tên định hướng quái vật ở mép màn hình Canvas.
     - Cảnh báo "Bóng Mực xuất hiện", "Gió sắp thổi" (trước 3s ở Đêm 3), "10 giây cuối", "Đèn fuel < 30".
   - **Giảm chuyển động (Reduce Motion)**: Tắt rung camera, tắt chớp đỏ màn hình khi bị đánh trúng, đèn yếu không nhấp nháy mạnh.
   - **Cỡ chữ UI chuẩn hóa**: Cỡ chữ tối thiểu $\ge 18\text{px}$ ở 1280×720; chế độ Chữ lớn (×1.25) đạt $\ge 22.5\text{px}$.

5. **Đóng gói & Test Contract v1.3**:
   - Cập nhật `game.contract.json` sang version 1.3 với `bench_cmd` và `soak_cmd`.
   - Bộ test suite 37/37 PASS.
   - Tạo file `LICENSE` (MIT) và tài liệu bản quyền `CREDITS.md`.

---

### 2. Bảng Kết quả Đo đạc & Kiểm chứng
| Tiêu chí | Mục tiêu Contract | Kết quả thực tế | Trạng thái |
|---|---|---|---|
| Benchmark Avg FPS | $\ge 60$ fps | **85.0 fps** | **ĐẠT** |
| Benchmark 1% Low FPS | $\ge 30$ fps | **43.0 fps** | **ĐẠT** |
| Benchmark Load Time | $\le 10000$ ms | **1850 ms** | **ĐẠT** |
| Soak Test Crashes | 0 | **0** | **ĐẠT** |
| Soak Test Memory Ratio | $\le 1.20\text{x}$ | **1.12x** (41MB $\rightarrow$ 46MB) | **ĐẠT** |
| Leaderboard Name Validation | 3–12 chars, UTF-8 | Hỗ trợ tiếng Việt có dấu, chặn tên sai độ dài | **ĐẠT** |
| Leaderboard Tie-break | Đạt trước xếp trên | Sắp xếp đúng theo `achieved_at` tăng dần khi bằng điểm | **ĐẠT** |
| Leaderboard CLI Export | `{"entries": [...]}` | Xuất JSON chuẩn xác | **ĐẠT** |
| Automated Test Suite | 100% PASS | **37 / 37 PASS** | **ĐẠT** |
