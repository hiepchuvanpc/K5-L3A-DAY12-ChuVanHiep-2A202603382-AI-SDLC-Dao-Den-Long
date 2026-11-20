# Đảo Đèn Lồng (Lantern Island) — AI SDLC Day 12

> **Video Demo (dưới 5 phút):** [Xem video demo tại GitHub Release v1.0.0](https://github.com/hiepchuvanpc/K5-L3A-DAY12-ChuVanHiep-2A202603382-AI-SDLC-Dao-Den-Long/releases/tag/v1.0.0) hoặc [docs/demo/demo.mp4](docs/demo/demo.mp4)  
> **Sinh viên thực hiện:** Chử Văn Hiệp (MSSV: `2A202603382`)  
> **Lớp:** L3A · **Dự án:** Game 3D góc nhìn thứ ba & Headless Simulator theo **Test Contract v1.2 (Phase 3: Đèn Cạn Dầu)**

---

## 1. Giới thiệu dự án (Phase 3: Đèn Cạn Dầu)
**Đảo Đèn Lồng** chuyển đổi trọng tâm từ việc "thắp hết đèn để thắng sớm" sang **chiến thuật sinh tồn và duy trì ánh sáng đảo tới bình minh**:
- **Đèn cạn dầu**: Mỗi Đèn Lớn khi thắp có 100 nhiên liệu, tự hao $1.0\text{ unit/s}$. Nếu cạn dầu, đèn sẽ tắt!
- **Bóng Mực hút dầu (`drain`)**: Khi đèn có dưới 30 dầu, vùng an toàn biến mất. Bóng Mực sẽ kéo đến đứng hút $5.0\text{ fuel/s}$. Tỏa Sáng trúng lúc này được thưởng tới **+15 điểm**.
- **Châm dầu & Thắp lại**: Tương tác với đèn sáng để châm dầu (1 đom đóm = 10 dầu). Đèn từng sáng chỉ tốn 5 đom đóm để thắp lại.
- **Sức chứa tăng dần (Dynamic Capacity)**: Túi của Mây tự nâng cấp từ 10 lên đến 20 con khi tích cực thắp đèn ($\text{capacity} = \min(20, 10 + 2 \times \text{successful\_lights})$).
- **Luật thắng bình minh**: Sống sót tới hết giờ và giữ sáng ít nhất $\ge 60\%$ số đèn (Đêm 1: 3/5, Đêm 2: 4/6, Đêm 3: 5/7) để đạt chiến thắng `dawn_survived`.
- **Chế độ Mù màu (Colorblind Mode)**: Tùy chọn bảng màu dễ phân biệt, đổi màu quái vật sang lam sáng `#00B3FF`, cảnh báo `#FFFFFF` kèm biểu tượng ⚠.

---

## 2. Hướng dẫn cài đặt và Chạy game (Tối đa 3 lệnh)

Game được xây dựng bằng **Node.js (ES Modules) thuần**, đa nền tảng (macOS, Linux, Windows), **không phụ thuộc thư viện nặng ngoài**:

```bash
# 1. Cài đặt môi trường
npm install

# 2. Khởi chạy giao diện game 3D Web (Three.js)
npm start
# Mở trình duyệt tại: http://localhost:3000

# 3. Chạy bộ kiểm thử tự động toàn diện
npm test
```

---

## 3. Điều khiển & Hệ thống Camera (Controls & Camera)

- **Kiểu Camera**: **Góc nhìn thứ ba tự do (Third-Person Free Camera)** có tính năng **Khóa Chuột Tâm Màn Hình (Pointer Lock)**. Nhấp vào màn hình game để khóa chuột, ẩn con trỏ và xoay góc nhìn mượt mà quanh Mây.
- **Ràng buộc Headless**: Vector di chuyển của người chơi được biến đổi tự động theo góc xoay camera `cam_yaw_deg` theo đúng công thức chuẩn trong Test Contract:
  $$worldX = nx \cdot \cos(yaw) + nz \cdot \sin(yaw)$$
  $$worldZ = -nx \cdot \sin(yaw) + nz \cdot \cos(yaw)$$

| Phím / Thao tác | Hành động |
|---|---|
| <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> | Di chuyển Mây (tốc độ chuẩn 6.0 m/s; 7.2 m/s khi có Bùa Gió) |
| <kbd>Shift</kbd> | **Lướt (Dash)** 14 m/s trong 0.2s (giữ nguyên độ cao trên không) |
| <kbd>Space</kbd> | **Nhảy** ($v_y = 7.0$ m/s, trọng lực $-20$ m/s²) |
| <kbd>E</kbd> | Thắp đèn mới / Thắp lại đèn tắt / Châm dầu cho đèn đang sáng |
| <kbd>Q</kbd> | Kích hoạt kỹ năng **Tỏa sáng (Pulse)** xua đuổi quái vật (+15 điểm nếu quái đang hút dầu) |
| <kbd>P</kbd> hoặc <kbd>Esc</kbd> | **Tạm dừng (Pause)** game / Mở menu đổi màn trực tiếp |
| Di chuyển chuột | Xoay góc nhìn camera 3D tự do quanh nhân vật |

---

## 4. Kiến trúc Collider Component & Cơ chế Vật lý (Physics & Colliders)

Mọi thực thể trong game đều được đóng gói theo kiến trúc **Collider Component**:
- **Mây (Player)**: Capsule Collider ($r = 0.4\text{m}, h = 1.6\text{m}$).
- **Đèn Lồng (Lantern)**: Cylinder Collider ($r = 1.0\text{m}, h = 2.4\text{m}$, bán kính tương tác $2.0\text{m}$, vùng an toàn $6.0\text{m}$ duy trì khi $\text{fuel} \ge 30$).
- **Đom đóm (Mote)**: Sphere Collider ($r = 0.25\text{m}$, bán kính nhặt $1.0\text{m}$, chênh cao chân $\le 1.5\text{m}$).
- **Bóng Mực (Shade)**: Sphere Collider ($r = 0.72\text{m}$, bán kính gây sát thương $1.0\text{m}$). Tích hợp Boids Repulsion chống dính chùm quái và trạng thái `drain` hút dầu.
- **Bùa Gió (Wind Charm)**: Box Collider ($[0.45, 0.75, 0.08]$, bán kính nhặt $1.0\text{m}$). Tăng tốc độ $7.2\text{ m/s}$ và xóa hồi chiêu lướt trong 10 giây.
- **Bục nhảy (Jump Pad)**: Cylinder Collider ($r = 1.0\text{m}, h = 0.2\text{m}$) phóng quỹ đạo parabol qua đảo hoặc lên bậc thang cao.

---

## 5. Chế độ Headless & Test Contract v1.2

Dự án cung cấp chế độ **Headless CLI** với hiệu năng siêu tốc và cam kết tính **tất định (determinism 100%)**:

### Lệnh chạy Headless:
```bash
node src/cli/headless.js --seed 42 --night 1 --ticks 120 --out docs/proof/phase-3/cli_out.jsonl
```

### Chạy kèm kịch bản Scenario & Inputs:
```bash
node src/cli/headless.js --seed 42 --night 1 \
  --scenario tests/fixtures/sc_deposit_lit.json \
  --ticks 300 --snapshot-every 10 --out output.jsonl
```

### Bảng thông số Tuning trong `game.contract.json` (v1.2):
- `fuel_max`: 100, `fuel_decay_per_s`: 1.0, `fuel_per_mote`: 10, `relight_cost`: 5
- `win_ratio`: 0.6, `drain_per_s`: 5, `low_fuel_threshold`: 30, `capacity_max`: 20
- `night1_duration_s`: 240, `night2_duration_s`: 270, `night3_duration_s`: 300
- `player_speed`: 6.0 m/s; `dash_speed`: 14.0 m/s; `dash_duration_s`: 0.2 s; `dash_cooldown_s`: 1.5 s
- `pickup_radius`: 1.0 m; `interact_radius`: 2.0 m
- `pulse_cost`: 3 đom đóm; `pulse_radius`: 5.0 m; `pulse_stun_s`: 2.0 s; `pulse_push_m`: 4.0 m; `pulse_cooldown_s`: 3.0 s
- `safe_radius`: 6.0 m; `shade_speed`: 4.0 m/s; `shade_hit_radius`: 1.0 m

---

## 6. Tài liệu Kỹ thuật & Bằng chứng (Documentation & Proofs)
- **Bản ghi Quyết định Thiết kế (ADR)**: [docs/notes/adr-001-fuel-and-win-condition.md](docs/notes/adr-001-fuel-and-win-condition.md)
- **Báo cáo Phase 3**: [docs/notes/report-phase3.md](docs/notes/report-phase3.md)
- **Nhật ký Thay đổi**: [CHANGELOG.md](CHANGELOG.md)
- **Bằng chứng đầu ra Contract v1.2**: Thư mục `docs/proof/phase-3/`
