# Nhật ký Thay đổi (CHANGELOG)

Dự án: **Đảo Đèn Lồng (Lantern Island)**
Tác giả: Chử Văn Hiệp (MSSV: 2A202603382) · Lớp: L3A

---

## [phase-3] — Ticket-03: Change Request "Đèn cạn dầu" (Contract v1.2)

### ⚠ Thay đổi Phá vỡ Tương thích (Breaking Changes)
1. **Luật Thắng Mới [THAY THẾ]**:
   - Loại bỏ chiến thắng sớm khi thắp hết tất cả ngọn đèn (`reason: "all_lit"` bị xóa/deprecated).
   - Trò chơi chỉ phân định thắng/thua khi hết thời gian của Đêm (bình minh).
   - Điều kiện thắng: Sống sót khi hết giờ và số đèn đang sáng tại tick cuối $\ge \lceil 0.6 \times \text{tổng số đèn} \rceil$ (lý do kết thúc: `dawn_survived`).
   - Điều kiện thua khi hết giờ: Số đèn đang sáng $< \lceil 0.6 \times \text{tổng số đèn} \rceil$ (lý do kết thúc: `dawn`).
2. **Cơ chế Nhiên liệu Đèn [THAY THẾ]**:
   - Thay thế luật "đèn đã sáng không nhận thêm đom đóm".
   - Đèn có nhiên liệu tối đa `fuel = 100`. Vừa thắp có `fuel = 100`.
   - Đèn tự hao hụt $1.0\text{ đơn vị/giây}$ ($\frac{1}{60}$ mỗi tick).
   - Tương tác với đèn đang sáng tiêu tốn đom đóm để châm dầu (`refuel`). Đèn đầy dầu không thể tương tác.
   - Hết dầu (`fuel <= 0`): đèn tắt hoàn toàn, `deposited = 0`, phát sự kiện `lantern_out`, ghi nhớ `ever_lit = true`.
   - Đèn đã từng sáng (`ever_lit`) chỉ cần 5 đom đóm để thắp lại (`relight_cost = 5`).
3. **Bóng Mực hút dầu & Vùng an toàn [THAY THẾ]**:
   - Đèn có $\text{fuel} < 30$ bị mất vùng an toàn.
   - Bóng Mực `wander` nhắm tới đèn sáng yếu ($\text{fuel} < 30$) gần nhất; tiếp cận $\le 2\text{m}$ chuyển sang trạng thái mới `drain`, hút $5.0\text{ fuel/s}$ ($\frac{5}{60}$ mỗi tick).
   - Sự kiện `fuel_drain` phát mỗi 60 tick.
   - Trúng Tỏa Sáng khi đang drain thưởng **+15 điểm** (thay vì +5).
4. **Hệ thống Điểm số Mới [THAY THẾ]**:
   - +5 điểm mỗi đom đóm nạp vào đèn (thắp mới, thắp lại hoặc châm dầu). Không còn cộng điểm khi vừa nhặt đom đóm ngoài đảo.
   - +100 thắp lần đầu, +40 thắp lại.
   - Thưởng bình minh khi thắng: $+50 + \lfloor\text{fuel}\rfloor$ cho mỗi đèn đang sáng, $+50 \times \text{flames}$.
   - Hủy bỏ thưởng thời gian còn lại.
5. **Cập nhật Test Contract v1.2**:
   - `contract_version: "1.2"`.
   - Snapshot: Lanterns thêm `fuel` (số thực 1 chữ số thập phân), `ever_lit`, `relit_count`; Player thêm `capacity`; Shades thêm trạng thái `drain`.
   - Scenario: Lanterns hỗ trợ `lit`, `fuel`, `ever_lit`; Player hỗ trợ `successful_lights`; Shades hỗ trợ `target_lantern_id`.
   - Thời lượng chuẩn: Đêm 1: 240s, Đêm 2: 270s, Đêm 3: 300s.

### Tính năng Mới & Cải tiến Trải nghiệm
- **Sức chứa Đom đóm Tăng dần (Dynamic Capacity)**: $\text{capacity} = \min(20, 10 + 2 \times \text{successful\_lights})$.
- **Chế độ Mù màu (Colorblind Mode)**:
  - Nút bật/tắt "Bảng màu dễ phân biệt" lưu vào `localStorage`.
  - Hào quang và mắt Bóng Mực đổi từ `#7A3CFF` sang `#00B3FF`.
  - Cảnh báo UI đổi từ `#FF5A5F` sang `#FFFFFF` kèm biểu tượng ⚠.
  - Đèn sắp cạn dầu nhấp nháy 1 Hz, đèn tắt xẹp 20%.
- **Sửa lỗi Phím Nhảy (<kbd>Space</kbd>) & Bục nhảy (Jump Pad)**: Phóng cong mượt mà, không bị kẹp trọng lực sai frame.
- **Sửa lỗi Địa hình & Xuyên Tường Đêm 3**: Tạo hình học Half-Ring chuẩn xác cho Tầng 1 và hình trụ chuẩn cho Tầng 2, ngăn hoàn toàn lỗi chui vào trong núi.
- **Khóa Chuột Tâm Màn Hình (Pointer Lock)**: Nhấp chuột khóa tự do, ẩn con trỏ và giảm độ nhạy xoay camera mượt mà.

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
