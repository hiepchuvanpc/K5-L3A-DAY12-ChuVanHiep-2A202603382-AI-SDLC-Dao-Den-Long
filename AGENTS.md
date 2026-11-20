# AGENTS.md — Hướng dẫn cho AI Agent (Phase 4 — Ticket-04 / Release v1.0.0)

Dự án **Đảo Đèn Lồng** (Day 12 AI SDLC — Final Release v1.0.0).

## 1. Nguyên tắc cốt lõi
- **Chính xác tuyệt đối theo Test Contract v1.3**: Định dạng snapshot, event, thứ tự 12 bước trong tick, các trạng thái chuẩn của Bóng Mực (`spawning`, `wander`, `chase`, `recoil`, `stunned`, `drain`).
- **Tách bạch Core Logic và View**: Mọi logic tính toán vị trí, va chạm, điểm số, trạng thái (state machine) nằm trong `src/core/`. Giao diện 3D (`src/web/`) chỉ lắng nghe hoặc render state, không chứa logic quyết định contract.
- **Không bao giờ làm giả test / output**: Mọi test phải chạy thật và phản ánh đúng trạng thái code.
- **Tính tất định (Determinism)**: Cùng `--seed`, `--night`, `--scenario`, `--inputs` phải tạo ra output giống hệt nhau 100%.

## 2. Thứ tự xử lý trong một tick (Bắt buộc theo Contract v1.1 - v1.3)
1. Đọc input (xử lý pause trước; nếu vừa tạm dừng thì dừng bước ở đây).
2. Giảm các bộ đếm: thời gian, hồi chiêu, bất tử, choáng, bùa, TTL đom đóm rơi, hồi bùa, hao dầu đèn ($1.0\text{/s}$), hút dầu quái ($5.0\text{/s}$).
3. Di chuyển Mây (nhảy, lướt, bục nhảy, gió) rồi kiểm tra rơi khỏi đảo ($Y < -10$).
4. Nhặt đom đóm và bùa.
5. Tương tác với đèn (thắp mới, thắp lại, châm dầu).
6. Cập nhật vùng an toàn (mất khi fuel < 30).
7. Tỏa Sáng.
8. Di chuyển Bóng Mực và Gió Lạc.
9. Chạm: Gió Lạc cướp trước, rồi Bóng Mực gây hit (xét theo id tăng dần).
10. Sinh đom đóm, Bóng Mực, Gió Lạc theo lịch.
11. Xét thắng/thua (khi hết giờ: thắng nếu số đèn sáng $\ge \lceil 0.6 \times \text{tổng đèn}\rceil$).
12. Ghi snapshot nếu tới lượt.

## 3. Các lệnh thường dùng (Test Contract v1.3)
- Cài đặt: `npm install`
- Chạy kiểm thử tự động: `npm test`
- Chạy headless mô phỏng: `node src/cli/headless.js --seed 42 --night 1 --ticks 120 --out out.jsonl`
- Chạy benchmark hiệu năng: `node src/cli/bench.js --seed 42 --duration 30 --out bench.json`
- Chạy soak test ổn định: `node src/cli/soak.js --seed 7 --nights 10 --out soak.json`
- Xuất bảng xếp hạng: `node src/web/server.js --export-leaderboard out.json`
- Chạy giao diện 3D Web: `npm start` (mở trình duyệt tại http://localhost:3000)
