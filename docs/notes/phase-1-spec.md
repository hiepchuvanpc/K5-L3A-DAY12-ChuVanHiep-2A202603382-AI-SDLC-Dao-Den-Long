# Đặc tả & Giả định Phase 1 (PRD-0)

## 1. Yêu cầu bắt buộc & Con số quy định (Test Contract v1.0)
Các tham số được cấu hình chính xác trong `game.contract.json`:
- **Tốc độ di chuyển người chơi (`player_speed`)**: 4.5 m/s.
- **Sức chứa đom đóm (`carry_capacity`)**: 5 đốm sáng.
- **Chi phí thắp một đèn (`lantern_cost`)**: 3 đom đóm.
- **Số lượng đèn Đêm 1 (`lantern_count_night1`)**: 5 Đèn Lồng Lớn (ID: L1, L2, L3, L4, L5).
- **Bán kính nhặt đom đóm (`pickup_radius`)**: 2.0 m.
- **Bán kính tương tác đèn (`interact_radius`)**: 2.5 m.
- **Kỹ năng Tỏa sáng (Pulse)**:
  - Chi phí (`pulse_cost`): 1 đom đóm đang mang.
  - Bán kính (`pulse_radius`): 6.0 m.
  - Thời gian choáng Bóng Mực (`pulse_stun_s`): 3.0 s.
  - Khoảng cách đẩy lùi (`pulse_push_m`): 4.0 m.
  - Hồi chiêu (`pulse_cooldown_s`): 2.0 s.
- **Bóng Mực & Sát thương**:
  - Tốc độ Bóng Mực (`shade_speed`): 3.0 m/s.
  - Bán kính tấn công (`shade_hit_radius`): 1.2 m.
  - Máu ban đầu (`flames`): 3 ngọn lửa sinh mệnh.
  - Thời gian bất tử sau va chạm (`invuln_s`): 2.0 s.
  - Tỉ lệ rơi đom đóm khi bị chạm (`hit_drop_ratio`): 0.5 (rơi `Math.floor(carried * 0.5)`).
  - Vùng an toàn quanh đèn (`safe_radius`): 5.0 m (Bóng Mực bị cản không thể vào phạm vi đèn đã thắp).
- **Thời lượng & Điểm số**:
  - Thời lượng Đêm 1 (`night1_duration_s`): 300 s.
  - Điểm nhặt đom đóm (`per_mote`): 10.
  - Điểm thắp sáng đèn (`per_lantern`): 100.
  - Điểm làm choáng Bóng Mực (`per_stun`): 20.
  - Điểm thưởng thắng cuộc: `time_left_s * per_second_left (1)` + `flames * per_flame_left (50)`.

## 2. Các giả định làm rõ chỗ mơ hồ của PRD-0
1. **Kích hoạt Pulse khi không có đom đóm**: Nếu `player.carried < pulse_cost` (0 đom đóm), Mây không đủ ánh sáng để tỏa sáng, thao tác pulse sẽ không kích hoạt và không tạo ra event.
2. **Khu vực an toàn của đèn (`safe_radius`)**: Áp dụng cho các Đèn Lồng Lớn đã được thắp sáng (`lit == true`). Ánh sáng tỏa ra tạo bức tường năng lượng ngăn Bóng Mực xâm nhập.
3. **Cơ chế nhảy (`jump`)**: Trong Phase 1, Mây có thể nhảy lên (trục Y), nhưng mọi tương tác va chạm, nhặt đom đóm và bán kính đèn đều được đo trên mặt phẳng ngang XZ theo đúng quy định của Test Contract.
4. **Vị trí 5 Đèn Lồng Lớn mặc định**:
   - L1: [0.0, 0.0, 25.0] (theo đúng scenario mẫu của PRD-0)
   - L2: [23.776, 0.0, 7.725]
   - L3: [14.695, 0.0, -20.225]
   - L4: [-14.695, 0.0, -20.225]
   - L5: [-23.776, 0.0, 7.725]
5. **Tính tất định (Determinism)**: Sử dụng thuật toán sinh số giả ngẫu nhiên Mulberry32 với seed được truyền từ `--seed`.

## 3. Ma trận truy vết kiểm chứng (Traceability Matrix)
| Yêu cầu | Mô tả kiểm chứng | Bằng chứng | Kết quả |
|---|---|---|---|
| REQ-01: Di chuyển & Inputs | Chạy scenario nạp inputs với move và cam_yaw | `docs/proof/phase-1/input_move.jsonl` | PASS |
| REQ-02: Nhặt đom đóm | Mây đi vào bán kính ≤ 2.0m của đom đóm | `docs/proof/phase-1/pickup.jsonl` | PASS |
| REQ-03: Nạp sáng & Thắp đèn | Phím interact kích hoạt tại đèn, đủ 3 đom đóm | `docs/proof/phase-1/deposit_lit.jsonl` | PASS |
| REQ-04: Tỏa sáng (Pulse) | Phím pulse kích hoạt làm choáng và đẩy Bóng Mực | `docs/proof/phase-1/pulse.jsonl` | PASS |
| REQ-05: Va chạm Bóng Mực | Bóng Mực chạm Mây gây mất máu, rơi đom đóm | `docs/proof/phase-1/hit.jsonl` | PASS |
| REQ-06: Thắng cuộc | Thắp đủ 5 đèn phát sinh event game_over (won) | `docs/proof/phase-1/win.jsonl` | PASS |
| REQ-07: Thua cuộc (hết máu / hết giờ) | Mất hết 3 ngọn lửa hoặc hết 300s | `docs/proof/phase-1/lose.jsonl` | PASS |
| REQ-08: Tính tất định | Chạy 2 lần cùng seed, so khớp MD5 hash output | `docs/proof/phase-1/determinism.txt` | PASS |
