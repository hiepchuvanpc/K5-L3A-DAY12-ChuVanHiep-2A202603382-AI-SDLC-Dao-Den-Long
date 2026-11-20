# Đảo Đèn Lồng (Lantern Island) — AI SDLC Day 12

> **Video Demo (dưới 5 phút):** [Xem video demo tại GitHub Release v1.0.0](https://github.com/hiepchuvanpc/5-L3A-DAY12-ChuVanHiep-2A202603382-AI-SDLC-Dao-Den-Long/releases/tag/v1.0.0) hoặc [docs/demo/demo.mp4](docs/demo/demo.mp4)  
> **Sinh viên thực hiện:** Chu Văn Hiệp (MSSV: 2A202603382)  
> **Lớp:** L3A · **Dự án:** Game 3D góc nhìn thứ ba & Headless Simulator theo Test Contract v1.1

---

## 1. Giới thiệu dự án (Phase 2: Ba Hòn Đảo)
**Đảo Đèn Lồng** mở rộng thành chuỗi **3 Đêm** đầy thử thách mang phong cách cổ tích Á Đông:
- **Đêm 1 — Đảo Bến:** Đảo tròn bán kính 40m, 5 Đèn Lồng Lớn, làm quen với đom đóm và Bóng Mực.
- **Đêm 2 — Đảo Cau:** Hai hòn đảo tròn bán kính 28m nối nhau bằng cầu tre mộc mạc và 2 bục nhảy liên đảo; xuất hiện sinh vật nhanh nhẹn **Gió Lạc** và **Bùa Gió**.
- **Đêm 3 — Đảo Chuông:** Hòn đảo 3 tầng bậc thang cao vút với tháp chuông cổ kính, dốc leo, bục nhảy và những cơn gió giật định kỳ 30s.

---

## 2. Hướng dẫn cài đặt và Chạy game (Tối đa 3 lệnh)

Game được xây dựng bằng **Node.js (ES Modules) thuần**, đa nền tảng (chạy mượt mà trên macOS, Linux, Windows), **không cần cài đặt phụ thuộc nặng**:

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

- **Kiểu Camera**: **Góc nhìn thứ ba tự do (Third-Person Free-Rotate Camera)** theo sau Mây, khoảng cách 9m, cao 5.5m.
- **Điều khiển Camera**: **Chỉ cần rê chuột ngang là xoay góc nhìn mượt mà** quanh Mây (không cần giữ chuột).
- **Ràng buộc Headless**: Vector di chuyển của người chơi được biến đổi tự động theo góc xoay camera `cam_yaw_deg` theo đúng công thức chuẩn trong Test Contract:
  $$worldX = -nx \cdot \cos(yaw) + nz \cdot \sin(yaw)$$
  $$worldZ = nx \cdot \sin(yaw) + nz \cdot \cos(yaw)$$

| Phím / Thao tác | Hành động |
|---|---|
| <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> | Di chuyển Mây (tốc độ chuẩn 6.0 m/s; 7.2 m/s khi có Bùa Gió) |
| <kbd>Shift</kbd> | **Lướt (Dash)** 14 m/s trong 0.2s (giữ nguyên độ cao trên không) |
| <kbd>Space</kbd> | **Nhảy** ($v_y = 7.0$ m/s, trọng lực $-20$ m/s²) |
| <kbd>E</kbd> | Thắp đom đóm vào Đèn Lồng Lớn (trong bán kính $\le 2.0$m) |
| <kbd>Q</kbd> | Kích hoạt kỹ năng **Tỏa sáng (Pulse)** làm choáng và đẩy lùi Bóng Mực/Gió Lạc |
| <kbd>P</kbd> hoặc <kbd>Esc</kbd> | **Tạm dừng (Pause)** game / Mở menu đổi màn |
| Di chuyển chuột | Xoay góc nhìn camera 3D tự do quanh nhân vật |

---

## 4. Kiến trúc Collider Component & Cơ chế Vật lý (Physics & Colliders)

Mọi thực thể trong game đều được đóng gói theo kiến trúc **Collider Component**:
- **Mây (Player)**: Capsule Collider ($r = 0.4\text{m}, h = 1.6\text{m}$).
- **Đèn Lồng (Lantern)**: Cylinder Collider ($r = 1.0\text{m}, h = 2.4\text{m}$, bán kính tương tác $2.0\text{m}$, vùng an toàn $6.0\text{m}$).
- **Đom đóm (Mote)**: Sphere Collider ($r = 0.25\text{m}$, bán kính nhặt $1.0\text{m}$).
- **Bóng Mực (Shade)**: Sphere Collider ($r = 0.72\text{m}$, bán kính gây sát thương $1.0\text{m}$). Tích hợp lực đẩy phân tách đàn (Boids Separation) chống gộp quái.
- **Bùa Gió (Wind Charm)**: Box Collider ($[0.45, 0.75, 0.08]$, bán kính nhặt $1.0\text{m}$) mô phỏng lá bùa Đạo gia viền vàng. **Tác dụng khi nhặt**: Tăng tốc độ chạy lên $7.2\text{ m/s}$ và cho phép **Lướt (Shift) liên tục không có hồi chiêu** trong 10 giây (600 tick).
- **Bục nhảy (Jump Pad)**: Cylinder Collider ($r = 1.0\text{m}, h = 0.2\text{m}$) với lực đẩy $v_y = 14\text{ m/s}, v_{horiz} = 24\text{ m/s}$ giúp Mây bay vút sang đảo đối diện hoặc lên tầng cao.

---

## 5. Lý giải thông số Tuning trong `game.contract.json` (Tuning Rationale)

- **`lantern_cost` = 10 đom đóm**: Sức chứa túi đom đóm của Mây là 10. Đêm 1 có 5 đèn (tổng 50 đom đóm). Mức 10 đòi hỏi người chơi phải nạp đầy túi ít nhất 5 chuyến, tạo nên nhịp điệu gom đốm sáng vừa vặn với thời gian 300 giây.
- **`pulse_cost` = 3 đom đóm**: Tiêu tốn 30% sức chứa tối đa. Đủ rẻ để người chơi kích hoạt thoát hiểm khi bị Bóng Mực bủa vây, nhưng đủ đắt để phải cân nhắc giữa việc nạp đèn hay xua đuổi kẻ địch.
- **`pulse_radius` = 5.0m & `pulse_stun_s` = 2.0s**: Đảm bảo vùng an toàn đủ rộng đẩy quái lùi 4m để Mây kịp lướt chạy.
- **`shade_speed` = 4.0 m/s (Đêm 3: 4.5 m/s)**: Thấp hơn tốc độ chạy của Mây (6.0 m/s), tạo cảm giác hồi hộp rượt đuổi nhưng vẫn công bằng cho người chơi.

---

## 5. Chế độ Headless & Test Contract v1.1

Dự án cung cấp chế độ **Headless CLI** với hiệu năng cực cao (**21.600 tick trong 0.06 giây**, vượt xa yêu cầu $\le 30$s) và cam kết tính **tất định (determinism 100%)**:

### Lệnh chạy Headless:
```bash
node src/cli/headless.js --seed 42 --night 1 --ticks 120 --out docs/proof/phase-2/cli_out.jsonl
```

### Chạy kèm kịch bản Scenario & Inputs:
```bash
node src/cli/headless.js --seed 42 --night 2 \
  --scenario tests/fixtures/p2_sc_drifter.json \
  --ticks 300 --snapshot-every 10 --out output.jsonl
```

### Bảng thông số Tuning trong `game.contract.json`:
- `player_speed`: 6.0 m/s; `dash_speed`: 14.0 m/s; `dash_duration_s`: 0.2 s; `dash_cooldown_s`: 1.5 s
- `carry_capacity`: 10 đom đóm; `lantern_cost`: 10 đom đóm / đèn
- `pickup_radius`: 1.0 m; `interact_radius`: 2.0 m
- `pulse_cost`: 3 đom đóm; `pulse_radius`: 5.0 m; `pulse_stun_s`: 2.0 s; `pulse_push_m`: 4.0 m; `pulse_cooldown_s`: 3.0 s
- `safe_radius`: 6.0 m (Vùng an toàn quanh đèn đã thắp, đẩy Bóng Mực ra mép trong 30 ticks)
- `shade_speed`: 4.0 m/s (Đêm 3: 4.5 m/s); `shade_hit_radius`: 1.0 m
- `invuln_s`: 1.5 s (90 ticks); `hit_drop_ratio`: 0.5 (rơi 50% số đom đóm quanh vành 1.5–2.5m, TTL 480 ticks)
- `fall_enabled`: true (Rơi $Y < -10$ mất 1 ngọn lửa, mất sạch đom đóm, chờ 60 ticks rồi hồi sinh tại mốc xuất phát)

---

## 6. Sáng tạo của tôi (My Creatives — Rubric Hạng mục F)

1. **Chuỗi 3 Đêm liền mạch với Menu & Cài đặt:** Người chơi có thể trải nghiệm toàn diện từ Đêm 1 đến Đêm 3 với cốt truyện liền mạch, lời dẫn dắt của Ông Đăng và màn hình Bình Minh khi chiến thắng Đêm 3.
2. **Hệ thống âm thanh Procedural Web Audio API:** Toàn bộ hiệu ứng âm thanh (Lướt gió, Nhảy, Đom đóm, Thắp đèn, Cướp đom đóm, Choáng, Nhạc nền) được tổng hợp thời gian thực mà không cần tải bất kỳ file audio ngoài nào.
3. **Bảng màu chuẩn Á Đông:** Áp dụng hệ thống mã màu chuẩn (`#0E1430` trời đêm, `#2F5D50` đồng cỏ, `#F2C14E` sắc vàng đèn lồng, `#C8102E` Bùa Gió và khăn Mây).
4. **Bảo toàn lõi và Headless:** Toàn bộ hiệu ứng hiển thị chỉ nằm ở tầng View (`src/web/`), không ảnh hưởng đến đầu ra của Headless CLI. Báo cáo [determinism_and_perf.txt](docs/proof/phase-2/determinism_and_perf.txt) xác nhận 100% tính tất định và hiệu năng 0.06s cho 21.600 ticks.

---

## 7. Tài liệu & Bằng chứng SDLC (Rubric B, C, D)
- **[Báo Cáo SDLC & Đánh Giá Tổng Hợp Phase 2](docs/notes/report-phase2.md)**: Ma trận truy vết yêu cầu (Traceability Matrix), Đánh giá AI, Token, Phân tích lỗi, Retro, và Kịch bản quay video demo.
- [Đặc tả & Giả định Phase 2 (Ticket-02)](docs/notes/phase-2-spec.md)
- [Đặc tả & Giả định Phase 1 (PRD-0)](docs/notes/phase-1-spec.md)
- [Nhật ký Thay đổi (CHANGELOG.md)](CHANGELOG.md)
- [Nhật ký dùng AI & Đánh giá (ai-log.md)](docs/notes/ai-log.md)
- [Bằng chứng kiểm chứng Phase 2](docs/proof/phase-2/) (Gồm snapshots JSONL, báo cáo tính tất định và đo đạc hiệu năng)
- [Bằng chứng kiểm chứng Phase 1](docs/proof/phase-1/)
- [Quy ước & Harness AI Agent (AGENTS.md)](AGENTS.md)
- [Bản quyền & Tài sản (CREDITS.md)](CREDITS.md)

---

## 8. Trạng thái Nộp bài & Tags
- Tag Phase 1: `phase-1` (Hoàn thành Đêm 1 theo Test Contract v1.0)
- Tag Phase 2: `phase-2` (Hoàn thành Ticket-02 theo Test Contract v1.1)
- Lệnh tự kiểm tra:
  ```bash
  npm test
  node scripts/generate_proofs_phase2.js
  git tag -l
  ```
