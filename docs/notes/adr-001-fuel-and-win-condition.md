# Architecture Decision Record (ADR-001)
## Chuyển đổi Mô hình Trạng thái Đèn (Nhiên liệu) và Luật Thắng (Sống sót tới Bình minh)

- **Trạng thái**: Đã chấp thuận (Accepted)
- **Ngày**: 2026-11-20
- **Tác giả**: Chử Văn Hiệp (MSSV: 2A202603382, Lớp L3A)
- **Dự án**: Đảo Đèn Lồng (Lantern Island) — Phase 3 (Ticket-03)
- **Hợp đồng áp dụng**: Test Contract v1.2

---

### 1. Bối cảnh (Context)
Trong Phase 1 và Phase 2, quy tắc trò chơi là:
1. Mỗi Đèn Lớn khi nạp đủ 10 đom đóm sẽ sáng vĩnh viễn và không bao giờ tắt.
2. Khi người chơi thắp sáng toàn bộ các đèn trên đảo, trò chơi ngay lập tức kết thúc với chiến thắng sớm (`reason: "all_lit"`).

**Vấn đề phát hiện qua Playtest:**
- Người chơi có kỹ năng tốt thường gom đủ đom đóm và thắp hết đèn trong khoảng 2 phút đầu. Game kết thúc quá sớm, dẫn tới việc nửa sau của Đêm không còn thử thách hay cảm giác hồi hộp.
- Không có áp lực quản lý tài nguyên sau khi đèn đã thắp.

---

### 2. Các quyết định thiết kế (Design Decisions)

#### Quyết định 1: Mô hình Nhiên liệu Đèn hữu hạn & Tắt đèn (Finite Fuel & Extinction)
- **Cơ chế**: Mỗi ngọn đèn khi thắp có `fuel = 100.0`.
- **Hao hụt tự nhiên**: Tiêu hao $1.0\text{ đơn vị/giây}$ (tương ứng $\frac{1}{60}$ mỗi tick).
- **Hao hụt do Bóng Mực hút (`drain`)**: Khi đèn có $\text{fuel} < 30$, vùng an toàn biến mất. Bóng Mực ở trạng thái `wander` sẽ tìm đến đèn yếu này; khi tiếp cận $\le 2\text{m}$ (XZ), nó chuyển sang trạng thái mới `drain`, đứng yên và hút thêm $5.0\text{ fuel/giây}$ ($\frac{5}{60}$ mỗi tick/con).
- **Cạn dầu (`fuel <= 0`)**: Đèn tắt hoàn toàn, `deposited = 0`, phát sự kiện `lantern_out`, ghi nhớ `ever_lit = true`.
- **Châm dầu (`refuel`)**: Khi đèn đang sáng và $\text{fuel} < 100$, tương tác tiêu tốn $\text{used} = \min(\text{carried}, \lceil(100 - \text{fuel}) / 10\rceil)$ đom đóm để tăng $10 \times \text{used}$ nhiên liệu, phát sự kiện `refuel`.
- **Thắp lại (`relight`)**: Đèn đã từng sáng (`ever_lit == true`) chỉ cần 5 đom đóm để thắp lại (thay vì 10).
- **Độ chính xác số học**: Tính toán nhiên liệu theo đơn vị nguyên $\frac{1}{60}$ (60 units = 1.0 fuel, 6000 units = 100.0 fuel) để loại bỏ triệt để sai số tích lũy số thực IEEE-754 trong mô phỏng tất định (deterministic simulation).

#### Quyết định 2: Chuyển đổi Luật Thắng từ "Thắp hết" sang "Giữ đảo sáng tới Bình minh"
- **Không còn thắng sớm**: Thắp đủ tất cả đèn không kết thúc Đêm. Người chơi phải liên tục tuần tra, nhặt đom đóm và châm dầu duy trì ngọn lửa.
- **Điều kiện thắng**: Sống sót khi hết thời gian của Đêm (`time_left_s <= 0`) VÀ số đèn đang sáng tại tick cuối $\ge \lceil 0.6 \times \text{tổng số đèn} \rceil$:
  - Đêm 1: $\ge 3/5$ đèn.
  - Đêm 2: $\ge 4/6$ đèn.
  - Đêm 3: $\ge 5/7$ đèn.
- **Lý do kết thúc**:
  - Thắng: `dawn_survived`
  - Thua: `dawn` (hết giờ nhưng không đủ đèn sáng) hoặc `no_flames` (hết mạng trước bình minh).
  - Loại bỏ hoàn toàn lý do `all_lit`.

#### Quyết định 3: Sức chứa Đom đóm Tăng dần (Dynamic Capacity)
- Thay vì cố định 10 con như cũ, sức chứa tăng theo số lần thắp đèn thành công:
  $$\text{capacity} = \min(20, 10 + 2 \times \text{successful\_lights})$$
- Thưởng cho người chơi tích cực thắp và giữ đèn, giúp giai đoạn cuối có thể mang nhiều tài nguyên hơn để ứng phó với nhiều ngọn đèn cùng lúc.

#### Quyết định 4: Tái cấu trúc Hệ thống Điểm (New Scoring Formula)
- Thay thế toàn bộ công thức cũ:
  - +5 mỗi đom đóm nạp vào đèn (thắp mới, thắp lại hoặc châm dầu).
  - +100 thắp lần đầu, +40 thắp lại.
  - +5 làm choáng Bóng Mực (+15 nếu con đó đang trong trạng thái `drain`).
  - Thưởng bình minh: $+50 + \lfloor\text{fuel}\rfloor$ cho mỗi đèn đang sáng, $+50 \times \text{flames}$.
  - Hủy bỏ thưởng thời gian còn lại (vì game yêu cầu sống sót hết thời lượng).

---

### 3. Hệ quả (Consequences)
- **Tích cực**:
  - Tạo nhịp độ chơi căng thẳng, chiến thuật luân chuyển hợp lý giữa việc thu thập đom đóm, bảo vệ đèn sắp cạn dầu và xua đuổi quái vật.
  - Engine giữ vững tính tất định 100% nhờ xử lý số học nguyên $\frac{1}{60}$.
- **Thay đổi phá vỡ tương thích (Breaking Changes)**:
  - Các test cũ kỳ vọng game kết thúc ngay khi thắp hết 5 đèn bị lỗi thời; đã được cập nhật sang kiểm thử điều kiện bình minh `dawn_survived` theo Test Contract v1.2.
  - Snapshot và Scenario contract bổ sung các trường `fuel`, `ever_lit`, `relit_count`, `capacity`, `drain`.
