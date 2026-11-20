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

## 3. Điều khiển (Controls)

| Phím / Thao tác | Hành động |
|---|---|
| <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> | Di chuyển Mây (tốc độ chuẩn 6.0 m/s; 7.2 m/s khi có Bùa Gió) |
| <kbd>Shift</kbd> | **Lướt (Dash)** 14 m/s trong 0.2s (giữ nguyên độ cao trên không) |
| <kbd>Space</kbd> | **Nhảy** ($v_y = 7.0$ m/s, trọng lực $-20$ m/s²) |
| <kbd>E</kbd> | Thắp đom đóm vào Đèn Lồng Lớn (trong bán kính $\le 2.0$m) |
| <kbd>Q</kbd> | Kích hoạt kỹ năng **Tỏa sáng (Pulse)** làm choáng và đẩy lùi Bóng Mực/Gió Lạc |
| <kbd>P</kbd> hoặc <kbd>Esc</kbd> | **Tạm dừng (Pause)** game / Mở menu tùy chọn |
| Giữ chuột trái & kéo | Xoay góc nhìn camera 3D quanh Mây |

---

## 4. Cách tính điểm chuẩn hóa (Scoring System)

Điểm số được tính toán tự động và đồng bộ giữa chế độ Headless và 3D Web:
- **Nạp đom đóm vào đèn:** +10 điểm / đom đóm.
- **Thắp sáng Đèn Lồng Lớn:** +100 điểm / đèn.
- **Làm choáng Bóng Mực / Trúng Tỏa Sáng:** +5 điểm / con mỗi lần.
- **Thưởng chiến thắng mỗi Đêm:**
  - Thời gian còn lại: $+ \lfloor \text{time\_left\_s} \rfloor \times 2$ điểm.
  - Ngọn lửa sinh mệnh còn lại: $+ 50 \times \text{flames}$ điểm.
- **Tổng điểm game:** Tổng điểm các Đêm đã vượt qua.

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

## 7. Tài liệu & Bằng chứng SDLC
- [Đặc tả & Giả định Phase 2 (Ticket-02)](docs/notes/phase-2-spec.md)
- [Đặc tả & Giả định Phase 1 (PRD-0)](docs/notes/phase-1-spec.md)
- [Nhật ký dùng AI & Đánh giá](docs/notes/ai-log.md)
- [Bằng chứng kiểm chứng Phase 2](docs/proof/phase-2/)
- [Quy ước cho AI Agent (AGENTS.md)](AGENTS.md)
- [Bản quyền & Tài sản (CREDITS.md)](CREDITS.md)
