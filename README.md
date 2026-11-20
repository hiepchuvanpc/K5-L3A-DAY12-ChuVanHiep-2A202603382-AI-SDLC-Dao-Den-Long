# Đảo Đèn Lồng (Lantern Island) — AI SDLC Day 12

> **Video Demo (dưới 5 phút):** [Xem video demo tại GitHub Release v1.0.0](https://github.com/hiepchuvanpc/5-L3A-DAY12-ChuVanHiep-2A202603382-AI-SDLC-Dao-Den-Long/releases/tag/v1.0.0) hoặc [docs/demo/demo.mp4](docs/demo/demo.mp4)  
> **Sinh viên thực hiện:** Chu Văn Hiệp (MSSV: 2A202603382)  
> **Lớp:** L3A · **Dự án:** Game 3D góc nhìn thứ ba & Headless Simulator theo Test Contract v1.0

---

## 1. Giới thiệu dự án
**Đảo Đèn Lồng** là tựa game phiêu lưu 3D góc nhìn thứ ba mang đậm phong cách cổ tích Á Đông:
- **Nhân vật:** Mây — người giữ đèn nhỏ tuổi đội nón lá tre mang theo chiếc đèn lồng nhỏ.
- **Bối cảnh:** Đêm 1 tại Đảo Bến giữa biển mây. Sương đen đã nuốt chửng ánh sáng đảo. Mây phải gom các đốm sáng (đom đóm) để thắp lại 5 Đèn Lồng Lớn.
- **Kẻ địch:** Bóng Mực ẩn nấp trong sương đêm và rượt đuổi Mây. Mây có thể dùng kỹ năng **Tỏa sáng (Pulse)** để làm choáng và đẩy lùi chúng.
- **Điều kiện thắng/thua:** Thắp đủ 5 Đèn Lồng Lớn để giành chiến thắng. Mất hết 3 ngọn lửa sinh mệnh hoặc hết 300 giây sương đêm sẽ thua cuộc.

---

## 2. Hướng dẫn cài đặt và Chạy game (Tối đa 3 lệnh)

Game được xây dựng bằng **Node.js (ES Modules) thuần**, đa nền tảng (chạy mượt mà trên macOS, Linux, Windows), **không cần cài đặt phụ thuộc nặng**:

```bash
# 1. Cài đặt (nếu có cập nhật package)
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
| <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> hoặc Phím mũi tên | Di chuyển Mây theo góc nhìn camera |
| Giữ chuột trái & kéo | Xoay góc nhìn camera 3D (3rd person) |
| <kbd>E</kbd> hoặc <kbd>Space</kbd> | Thắp đom đóm vào Đèn Lồng Lớn (trong bán kính ≤ 2.5m) |
| <kbd>Q</kbd> hoặc <kbd>F</kbd> | Kích hoạt kỹ năng Tỏa sáng (Pulse) tiêu hao 1 đom đóm |

---

## 4. Cách tính điểm (Scoring System)

Điểm số được tính toán tự động và đồng bộ giữa chế độ Headless và 3D Web:
- **Nhặt đom đóm (`per_mote`):** +10 điểm / đom đóm.
- **Thắp sáng Đèn Lồng Lớn (`per_lantern`):** +100 điểm / đèn.
- **Làm choáng Bóng Mực (`per_stun`):** +20 điểm / con.
- **Thưởng chiến thắng khi thắp đủ 5 đèn:**
  - Thời gian còn lại: +1 điểm / giây (`per_second_left * floor(time_left_s)`).
  - Ngọn lửa sinh mệnh còn lại: +50 điểm / ngọn (`per_flame_left * flames`).

---

## 5. Chế độ Headless & Test Contract v1.0

Để phục vụ chấm điểm tự động độc lập, dự án cung cấp chế độ **Headless CLI** với hiệu năng cao (> 1000 ticks/giây) và cam kết tính **tất định (determinism 100%)**:

### Lệnh chạy Headless:
```bash
node src/cli/headless.js --seed 42 --night 1 --ticks 120 --out docs/proof/phase-1/cli_out.jsonl
```

### Chạy kèm kịch bản Scenario & Inputs:
```bash
node src/cli/headless.js --seed 42 --night 1 \
  --scenario tests/fixtures/test_scenario.json \
  --inputs tests/fixtures/test_inputs.json \
  --ticks 300 --snapshot-every 10 --out output.jsonl
```

### Thông số Tuning trong `game.contract.json`:
- `player_speed`: 4.5 m/s
- `carry_capacity`: 5 đom đóm
- `lantern_cost`: 3 đom đóm / đèn
- `pickup_radius`: 2.0 m
- `interact_radius`: 2.5 m
- `pulse_cost`: 1 đom đóm; `pulse_radius`: 6.0 m; `pulse_stun_s`: 3.0 s; `pulse_push_m`: 4.0 m
- `safe_radius`: 5.0 m (Vùng an toàn quanh đèn đã thắp, Bóng Mực không thể tiến vào)
- `shade_speed`: 3.0 m/s; `shade_hit_radius`: 1.2 m
- `invuln_s`: 2.0 s; `hit_drop_ratio`: 0.5 (rơi 50% số đom đóm khi va chạm)

---

## 6. Sáng tạo của tôi (My Creatives — Rubric Hạng mục F)

Theo quy định tự do sáng tạo mà không phá vỡ logic lõi và Test Contract:
1. **Thiết kế nhân vật Mây mang bản sắc văn hóa Việt:** Mây đội nón lá tre truyền thống với chiếc đèn lồng nhỏ treo lơ lửng, tạo vệt sáng ấm áp khi di chuyển.
2. **Hệ thống âm thanh Procedural Web Audio API:** Toàn bộ hiệu ứng âm thanh (nhặt đom đóm, thắp đèn, tiếng đẩy lùi của Pulse, âm va chạm) được tổng hợp bằng dao động sóng âm thời gian thực trong trình duyệt, không cần tải file âm thanh ngoài nặng nề.
3. **Hiệu ứng sương đen và ánh sáng động:** Đảo Bến sáng dần lên theo từng Đèn Lồng được thắp; sương đen và Bóng Mực có hiệu ứng xoáy hạt tím huyền bí.
4. **Bằng chứng phần cũ vẫn đúng 100%:** Toàn bộ hiệu ứng hiển thị chỉ nằm ở tầng View (`src/web/`), không ảnh hưởng hay làm thay đổi bất kỳ trường nào trong đầu ra Headless CLI của `game.contract.json`. Kiểm thử `npm test` và báo cáo `docs/proof/phase-1/determinism.txt` chứng minh 100% tính tất định.

---

## 7. Tài liệu & Bằng chứng SDLC
- [Đặc tả & Giả định Phase 1](docs/notes/phase-1-spec.md)
- [Nhật ký dùng AI & Đánh giá](docs/notes/ai-log.md)
- [Bằng chứng kiểm chứng Phase 1](docs/proof/phase-1/)
- [Quy ước cho AI Agent (AGENTS.md)](AGENTS.md)
- [Bản quyền & Tài sản (CREDITS.md)](CREDITS.md)
