# Nhật ký Thay đổi (CHANGELOG)

Dự án: **Đảo Đèn Lồng (Lantern Island)**
Tác giả: Chử Văn Hiệp (MSSV: 2A202603382) · Lớp: L3A

---

## [phase-2] — Ticket-02: Ba Hòn Đảo (Contract v1.1)
- **Chuẩn hóa thông số vật lý (Tuning)**:
  - Tốc độ chạy 6.0 m/s; nhảy 7.0 m/s, trọng lực -20 m/s².
  - Thêm kỹ năng **Lướt (Dash)** 14 m/s trong 0.2s, hồi chiêu 1.5s.
  - Thêm cơ chế **Rơi khỏi đảo ($Y < -10$)**: mất 1 ngọn lửa, mất toàn bộ đom đóm, chờ 60 tick rồi hồi sinh tại điểm xuất phát kèm 90 tick bất tử.
- **Mở rộng 3 Đêm (3 Bản đồ)**:
  - Đêm 1 (Đảo Bến): 5 Đèn Lớn, bán kính đảo 40m.
  - Đêm 2 (Đảo Cau): 2 đảo bán kính 28m nối cầu tre, 2 bục nhảy, xuất hiện Gió Lạc và Bùa Gió.
  - Đêm 3 (Đảo Chuông): 3 tầng bậc thang, tháp chuông, dốc trượt, gió giật định kỳ 30s.
- **Thực thể & Cơ chế mới**:
  - **Gió Lạc (Drifter)**: Cướp đom đóm khi người chơi mang >= 5 con; thả đom đóm khi trúng Tỏa Sáng.
  - **Bùa Gió (Wind Charm)**: Tăng tốc chạy 7.2 m/s, xóa hồi chiêu lướt trong 10s.
  - **Bục nhảy (Jump Pads)**: Bắn người chơi qua đảo đối diện hoặc lên tầng cao.
  - **Tạm dừng (Pause)**: Đóng băng trạng thái mô phỏng và đồng hồ.
- **Tối ưu 3D Web**:
  - Hồi đom đóm liên tục (trần 30 con).
  - Bóng Mực chủ động săn lùng Mây trong bán kính 24m, có vầng hào quang tím.
  - Nâng cấp ánh sáng ban đêm dịu mắt, giảm sương mù, thêm ngọn lửa định hướng trên đèn chưa thắp.
- **Kiểm thử & Bằng chứng**:
  - 23/23 unit & regression tests tự động pass 100%.
  - Hiệu năng Headless đạt 21.600 tick trong 0.06s (chuẩn <= 30s).
  - Tính tất định (determinism) đạt 100% (SHA-256 trùng khớp giữa các lần chạy).

---

## [phase-1] — PRD-0: Đêm 1 — Đảo Bến (Contract v1.0)
- Thiết lập kiến trúc tách biệt hoàn toàn giữa Core Engine (deterministic) và 3D Web View (Three.js).
- Cơ chế di chuyển, nhặt đom đóm (tối đa 10 con), nạp vào 5 Đèn Lớn.
- Bóng Mực xuất hiện và đuổi theo Mây, gây mất lửa khi chạm.
- Kỹ năng Tỏa Sáng (Pulse) tiêu tốn 3 đom đóm, làm choáng và đẩy lùi Bóng Mực.
- Chế độ Headless CLI theo Test Contract v1.0, hỗ trợ `--seed`, `--night`, `--ticks`, `--out`.
