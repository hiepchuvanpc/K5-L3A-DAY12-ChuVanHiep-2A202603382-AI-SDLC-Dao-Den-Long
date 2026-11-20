# Báo cáo Triển khai Phase 3 — Ticket-03 "Đèn cạn dầu"
## Dự án: Đảo Đèn Lồng (Lantern Island)

- **Sinh viên thực hiện**: Chử Văn Hiệp (MSSV: `2A202603382`, Lớp: `L3A`)
- **Repository**: `https://github.com/hiepchuvanpc/K5-L3A-DAY12-ChuVanHiep-2A202603382-AI-SDLC-Dao-Den-Long.git`
- **Hợp đồng kiểm thử**: Test Contract v1.2 (Tag: `phase-3`)
- **Ngày hoàn thành**: 20/11/2026

---

### 1. Tổng quan Công việc Thực hiện (Scope & Deliverables)

Phase 3 thực hiện Change Request cốt lõi **"Đèn cạn dầu" (Ticket-03)** chuyển đổi mục tiêu từ "thắp hết đèn để thắng sớm" sang "duy trì ngọn lửa đảo tới bình minh", cùng với việc giải quyết triệt để các phản hồi về vật lý và giao diện web 3D.

#### A. Core Engine & Test Contract v1.2
1. **Nhiên liệu Đèn (Lantern Fuel System)**:
   - Đèn có `fuel_max = 100`. Vừa thắp có `fuel = 100.0`.
   - Tự tiêu hao $1.0\text{ unit/s}$ ($\frac{1}{60}$ mỗi tick).
   - Châm dầu (`refuel`): tương tác với đèn đang sáng tiêu hao $\min(\text{carried}, \lceil(100 - \text{fuel}) / 10\rceil)$ đom đóm, hồi phục 10 nhiên liệu mỗi con.
   - Hết dầu (`fuel <= 0`): đèn tắt (`lit = false`), phát sự kiện `lantern_out`, ghi nhớ `ever_lit = true`.
   - Thắp lại (`relight`): đèn đã từng sáng chỉ tốn 5 đom đóm (thay vì 10).
2. **Bóng Mực hút dầu (`drain` state)**:
   - Đèn có $\text{fuel} < 30$ bị mất vùng an toàn.
   - Bóng Mực `wander` ưu tiên tìm đến đèn sáng có $\text{fuel} < 30$ gần nhất. Khi cách $\le 2\text{m}$, chuyển sang trạng thái `drain`, hút $5.0\text{ fuel/s}$ ($\frac{5}{60}$ mỗi tick).
   - Phát sự kiện `fuel_drain` mỗi 60 tick.
   - Bị Tỏa Sáng khi đang drain: thưởng **+15 điểm** (thay vì +5).
3. **Luật Thắng Mới & Thời lượng Màn**:
   - Thời lượng: Đêm 1: 240s, Đêm 2: 270s, Đêm 3: 300s.
   - Thắng tại bình minh (`time_left_s <= 0`) nếu số đèn sáng $\ge \lceil 0.6 \times \text{tổng đèn} \rceil$ với lý do `dawn_survived`. Thắp hết đèn không kết thúc sớm.
   - Thua: `dawn` (không đủ đèn khi hết giờ) hoặc `no_flames` (hết mạng).
4. **Sức chứa Đom đóm Tăng dần (Dynamic Capacity)**:
   - $\text{capacity} = \min(20, 10 + 2 \times \text{successful\_lights})$.
5. **Công thức Điểm Chuẩn v1.2**:
   - +5 mỗi đom đóm nạp vào đèn.
   - +100 thắp lần đầu, +40 thắp lại.
   - +5 choáng quái (+15 nếu quái đang hút dầu).
   - Thưởng bình minh: $+50 + \lfloor\text{fuel}\rfloor$ mỗi đèn sáng, $+50 \times \text{flames}$.
6. **Chế độ Mù màu (Colorblind Mode)**:
   - Nút bật/tắt bảng màu dễ phân biệt (lưu `localStorage`).
   - Mắt và hào quang Bóng Mực chuyển sang màu lam sáng `#00B3FF`.
   - Cảnh báo UI chuyển sang `#FFFFFF` kèm biểu tượng ⚠.
   - Đèn tắt thu nhỏ 20% và đèn yếu nhấp nháy 1 Hz.

#### B. Sửa lỗi Vật lý & Trải nghiệm 3D Web (Feedback Fixes)
1. **Sửa lỗi Phím Nhảy (<kbd>Space</kbd>) & Bục nhảy (Jump Pad)**:
   - Bổ sung `e.code === 'Space'` và `e.preventDefault()`.
   - Tách biệt kiểm tra tiếp đất: vận tốc nâng thẳng đứng $v_y > 0$ không còn bị kẹp về ground ở frame đầu tiên. Bục nhảy phóng đường vòng cung mượt mà qua đảo đối diện.
2. **Sửa lỗi Xuyên Tường & Leo Núi Đêm 3 (Đảo Chuông)**:
   - Thay thế mesh sai lệch bằng hình học Half-Ring chuẩn xác: tâm `(0, 0)`, bán kính trong 12m, ngoài 24m cho $Z > 0$, cao $Y=3.0$.
   - Bổ sung ranh giới va chạm vách núi hình trụ: người chơi ở tầng dưới không thể đi xuyên qua chân vách đá trừ khi di chuyển qua 2 dốc nghiêng 3m ở góc 30° và 150°.
3. **Khóa Chuột Tâm Màn Hình (Pointer Lock)**:
   - Nhấp vào canvas sẽ kích hoạt `requestPointerLock()`.
   - Chuột tự động ẩn, xoay camera mượt mà với độ nhạy giảm (`0.002`).
   - Tự động mở khóa khi tạm dừng hoặc kết thúc màn.

---

### 2. Kết quả Kiểm thử Tự động (Automated Test Results)

Hệ thống kiểm thử chạy thực tế với Node.js test runner:
- **Tổng số test**: **31/31 PASS (100%)**
- **Thời gian chạy**: ~226 ms
- **Tập test bao gồm**:
  - `tests/cli.test.js`: Headless CLI runner, argument parsing, error codes.
  - `tests/math.test.js`: PRNG Mulberry32, vector normalization, camera yaw math.
  - `tests/engine.test.js`: Core simulation loop, step order contract v1.2.
  - `tests/phase2.test.js`: Dash, jump pads, wind charms, drifter steal, pause.
  - `tests/phase3.test.js`: Fuel decay, lantern out, refuel, relight, dynamic capacity, shade drain, pulse +15, dawn survival win.
  - `tests/regression.test.js`: Hồi quy tính tất định và tương thích contract.

---

### 3. Danh mục Bằng chứng (Proof Artifacts)
Các tệp bằng chứng được sinh tự động tại thư mục `docs/proof/phase-3/`:
- `proof_fuel_decay_and_out.jsonl`: Dấu vết hao hụt dầu $1.0\text{ unit/s}$ và sự kiện `lantern_out`.
- `proof_refuel_and_relight.jsonl`: Dấu vết châm dầu và thắp lại tốn 5 đom đóm.
- `proof_shade_drain_and_pulse.jsonl`: Dấu vết Bóng Mực chuyển `drain`, hút $5.0\text{ fuel/s}$ và ăn đòn Tỏa Sáng được +15 điểm.
- `proof_dynamic_capacity.jsonl`: Dấu vết sức chứa mở rộng từ 10 lên 12, 14.
- `proof_dawn_survived_win.jsonl`: Dấu vết sống sót tới bình minh đạt chiến thắng `dawn_survived` và cộng thưởng.
- `summary.json`: Tóm tắt kiểm định và thông số Contract v1.2.
- `adr-001-fuel-and-win-condition.md`: Bản ghi quyết định kiến trúc (ADR).
