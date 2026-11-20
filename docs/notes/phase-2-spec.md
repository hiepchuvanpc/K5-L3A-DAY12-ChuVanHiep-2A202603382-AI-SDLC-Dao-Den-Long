# Đặc tả & Giả định Phase 2 (Ticket-02 — "Ba hòn đảo")

## 1. Mục tiêu & Thay đổi chính
Phase 2 chuẩn hóa toàn bộ thông số vật lý và luật chơi, đồng thời mở rộng từ 1 Đêm thành chuỗi **3 Đêm** với 3 bản đồ chuẩn, thực thể mới (**Gió Lạc**), cơ chế mới (**Lướt/Dash**, **Bùa Gió**, **Bục nhảy**, **Rơi đảo $Y < -10$**, **Gió giật**, **Tạm dừng/Pause**). Nâng cấp Test Contract lên **v1.1**.

## 2. Tiêu chí nghiệm thu (Acceptance Criteria - AC)

### AC-01: Chuẩn hóa Di chuyển, Nhảy & Lướt (Dash)
- **Tốc độ chạy**: 6.0 m/s; điều khiển trên không đầy đủ.
- **Nhảy**: Vận tốc ban đầu $Y = 7.0$ m/s, trọng lực $g = -20.0$ m/s², chỉ nhảy được khi chạm đất (`grounded == true`).
- **Lướt (Dash)**:
  - Tốc độ: 14.0 m/s, duy trì trong 12 ticks (0.2 s).
  - Hồi chiêu: 90 ticks (1.5 s), tính từ thời điểm bắt đầu lướt.
  - Hướng lướt: Theo hướng di chuyển hiện tại; nếu đứng yên thì theo hướng nhân vật đang quay mặt.
  - Lướt trên không giữ nguyên độ cao $Y$ (không bị trọng lực kéo trong 12 tick lướt).
  - Không bất tử khi lướt. Phát sinh event `dash`.

### AC-02: Cơ chế Rơi khỏi đảo ($Y < -10$)
- Khi Mây rơi xuống $Y < -10$:
  - Mất 1 Ngọn Lửa, mất toàn bộ số đom đóm đang mang (`lost = carried`).
  - Phát sinh event `player_hit` với `{"by": "fall", "flames": n, "dropped": 0, "lost": n}`.
  - Chờ 60 ticks ở trạng thái hồi sinh (không nhặt, không bị chạm), sau đó hồi sinh tại điểm xuất phát `(0, 0, 0)`, vận tốc 0, bất tử 90 ticks.
  - Nếu hết Ngọn Lửa $\rightarrow$ thua ngay (`no_flames`), không hồi sinh.

### AC-03: Đom đóm & Đèn lồng chuẩn hóa
- Sức chứa: 10 đom đóm. Nhặt tự động khi khoảng cách $XZ \le 1.0$ m và $|Y_{player} - Y_{ground\_mote}| \le 1.5$ m.
- Sinh tự nhiên: Bắt đầu 20 con; trần 30 con; mỗi 240 ticks sinh thêm 1 con tại điểm trống nếu $< 30$.
- Đèn lồng: Chi phí 10 đom đóm. Tương tác bán kính 2.0 m. Nạp $\min(\text{carried}, \text{remaining})$.
- Vùng an toàn: Bán kính 6.0 m quanh đèn đã thắp. Bóng Mực ở ngoài bị chặn ở mép 6.0 m; Bóng Mực bên trong khi đèn vừa thắp bị đẩy ra mép trong tối đa 30 ticks và không gây sát thương.

### AC-04: Bóng Mực & Tỏa Sáng chuẩn hóa
- Tốc độ Bóng Mực: 4.0 m/s (Đêm 3: 4.5 m/s). Trạng thái chuẩn: `spawning`, `wander`, `chase`, `recoil`, `stunned`.
- Phát hiện Mây ở 12 m (`chase`), bỏ đuổi khi Mây xa $> 18$ m (`wander`).
- Chạm Mây ($XZ \le 1.0$ m, $\Delta Y \le 1.5$ m): $-1$ Ngọn Lửa; rơi $\lfloor \text{carried} / 2 \rfloor$ đom đóm (tồn tại 480 ticks); bất tử 90 ticks; Bóng Mực giật lùi (recoil) 2 m trong 60 ticks.
- Tỏa Sáng: Chi phí 3 đom đóm, bán kính 3D 5.0 m, hồi chiêu 180 ticks (3 s). Làm choáng 120 ticks, đẩy lùi ngang 4 m trong 15 ticks đầu. $+5$ điểm mỗi con trúng.

### AC-05: Gió Lạc (Drifter)
- Xuất hiện ở Đêm 2 và 3; tối đa 2 con; sinh tại tick 1200, 2400, ... IDs: D1, D2, ...
- Trạng thái: `idle` (2 m/s) $\rightarrow$ `chase` khi Mây mang $\ge 5$ đom đóm và khoảng cách $\le 15$ m $\rightarrow$ `flee` (7 m/s trong 240 ticks rồi biến mất) $\rightarrow$ `removed`.
- Chạm ($XZ \le 1.2$ m): Cướp $\min(3, \text{carried})$ đom đóm, phát sinh event `drifter_steal`, chuyển sang `flee`.
- Bị Tỏa Sáng:
  - Nếu đang `chase` $\rightarrow$ chuyển `flee` không cướp.
  - Nếu đang `flee` có mang đom đóm $\rightarrow$ thả toàn bộ đom đóm cướp được (`drifter_drop`), biến mất sau 120 ticks.

### AC-06: Bùa Gió (Wind Charm)
- Vị trí: Đêm 2 tại (35,0,0); Đêm 3 tại (30,0,25) và (-30,0,25).
- Khi nhặt: Phát sinh event `charm_picked`, duy trì hiệu lực 600 ticks:
  - Tốc độ chạy tăng lên 7.2 m/s.
  - Lướt không có hồi chiêu (`dash_cd = 0`).
- Tái sinh sau 2700 ticks.

### AC-07: Bục nhảy (Jump Pads)
- Đêm 2: Bục bán kính 1 m tại (20, 0, 18) bắn sang Đảo B ($v_y = 14$ m/s, vận tốc ngang 24 m/s hướng về tâm đảo B) và tại (50, 0, -18) bắn sang Đảo A ($v_y = 14$ m/s, vận tốc ngang 24 m/s hướng về tâm đảo A).
- Đêm 3: Bục tại (0, 3, 13) bắn lên Tầng 2 ($v_y = 12$ m/s, vận tốc ngang 8 m/s hướng về $-Z$).

### AC-08: Gió giật Đêm 3
- Mỗi 30 s có cơn gió kéo dài 5 s theo hướng ngẫu nhiên, đẩy người chơi 2 m/s. Telegraphed 2 s trước.
- Snapshot ghi `wind: { "active": boolean, "dir_deg": float }`.

### AC-09: Tạm dừng (Pause)
- Input `pause` chuyển từ `false` sang `true` kích hoạt trạng thái tạm dừng.
- Khi tạm dừng: Phát sinh event `paused`. Mọi đồng hồ đếm ngược, sim_tick, hồi chiêu, spawn, di chuyển đứng yên. Snapshot ghi `state: "paused"`.
- Bấm lại `pause` $\rightarrow$ phát sinh event `resumed`, game tiếp tục.
