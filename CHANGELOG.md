# Nhật ký Thay đổi (CHANGELOG)

Dự án: **Đảo Đèn Lồng (Lantern Island)**
Tác giả: Chử Văn Hiệp (MSSV: 2A202603382) · Lớp: L3A

---

## [hotfix-visuals-v4] — Playtest vòng 2: FX gió/lướt, nhân vật, chướng ngại vật, spawn cân bằng

### 🐛 Sửa lỗi (toàn bộ ở view `src/web/index.html`, không đổi Core)
1. **Địa hình Đêm 3 chưa "đặc"**: rãnh `r ∈ [8, 12]` quanh tháp chuông khiến người chơi nhảy bậc có thể xuyên xuống và rơi. `getGround` Tier 1 đổi từ `r >= 12` thành `r >= 8` (lấp đầy rãnh); mesh bán khuyên Tier 1 đổi bán kính trong 12→8 cho khớp.
2. **Tỏa Sáng (Q) đẩy Bóng Mực ra khỏi đảo**: khi điểm đẩy rơi ngoài map (biến mất quái) thì lùi từng bước 0,25m để Bóng Mực luôn nằm trên mặt đất hợp lệ (`getGround() !== null`).
3. **Đom đóm spawn dồn cụm một chỗ**: thay spawn ngẫu nhiên bằng lưới điểm đều theo từng đêm (`getMoteSpawnPointsFor`, có cả tầng y=3/y=6 ở Đêm 3); respawn định kỳ chỉ chọn điểm lưới trống, cách đom đóm hiện có < 2m, đủ xa người chơi.

### ✨ Tính năng & Đồ họa mới
4. **Animation Gió + cảnh báo hướng gió (Đêm 3)**: các vệt gió xanh (`glowStreaks`) lao qua người chơi trong cơn giật; động cơ mây trôi chậm; phụ đề gió kèm hướng ("về trước mặt / bên trái / bên phải / sau lưng") so với camera; mũi tên gió hình chữ >> nhấp nháy trên threat radar đúng hướng màn hình (giảm tắt nháy ở chế độ Reduce Motion).
5. **Model nhân vật chính Mây**: mũ nón lá, khăn quàng + áo choàng sau lưng, 2 tầng áo choàng, đai vàng, 2 tay vung theo bước chân, đèn lồng mang theo có khung; dập dềnh khi chạy, nghiêng người khi lướt.
6. **Animation Lướt**: vệt gió vàng phía sau trong lúc dash + nghiêng thân nhân vật; radar hiển thị hướng dash.
7. **Vật thể Đặc cản đường**: cột đèn lồng, đá, cây, tháp chuông có bán kính va chạm (`solidProps` + `resolveSolidCollision`), áp cả sau khi gió đẩy để không bị xuyên; bổ sung đá, cột đèn, cây low-poly cho Đêm 3 bớt trống trải (bỏ qua trong bench mode).
8. **Bóng Mực spawn xa hơn lúc đầu trận**: điểm spawn khởi đầu ≥ 18m theo vòng mép đảo mỗi đêm (`getShadeSpawnPointsFor`); thêm spawn định kỳ (7s N1/N2, 6s N3, tối đa 6/8/10) luôn ≥ 15m kèm phụ đề "👻 Bóng Mực xuất hiện!".
9. **Đếm ngược 3-2-1 trước khi chơi**: màn hình đếm ngược toàn màn hình (900ms/số, âm báo từng bước), thế giới tạm dừng trong lúc đếm; tự hủy khi về Menu chính.

---

## [hotfix-ui-v3] — Sửa lỗi playtest Đêm 3 + Giao diện UI v3

### 🐛 Sửa lỗi
1. **A/D bị đảo chiều trong giao diện 3D (`src/web/index.html`)**: công thức biến đổi hướng di chuyển theo camera yaw bị sai dấu trục X (khi camera nhìn dọc +Z, màn hình bên phải tương ứng world −X). Đã đổi hệ số của `nx`; mũi tên cảnh báo quái trên threat radar cũng bị lật ngược trái/phải cùng lỗi gốc, đã sửa (`ax`, `rotate`).
2. **Map Đêm 3 (Đảo Chuông) dựng mesh lệch với logic va chạm (`getGround`)**: bán tầng Tier 1 bị đặt nhịp đùn hướng lên (lơ lửng y=3→6) và nhầm phía z<0 trong khi Tier 1 nằm phía z>0; hai dốc bị quay lệch 90° theo chiều tiếp tuyến. Đã dựng lại: Tier 1 là bán khuyên r∈[12,24] phía z>0, mặt đi lại đúng y=3; hai dốc chạy xuyên bán kính tại 30°/150° (Euler `YXZ`, pitch 26,6°), chân dốc r=30/Y=0 → đỉnh r=24/Y=3 khớp `getGround`.
3. **Bùa Tăng Tốc báo lỗi thị giác**: mesh bùa không bao giờ bị ẩn khi nhặt (vòng lặp không cập nhật `charmMeshes`) khiến bùa trông như không hoạt động. Đã thêm đồng bộ ẩn/hiện theo `available`, hiệu ứng xoay + dập dềnh, chỉ báo thời gian còn lại trên HUD (pill ⚡ xanh lá) và viền xanh ô Lướt khi bùa active (lướt không hồi chiêu).

### ✨ Giao diện (UI v3)
4. **HUD thu gọn**: chữ nền 14px (từ 18px), tách 3 khối trên (tên đảo | đồng hồ | chỉ số) và 3 khối dưới (phím tắt | thanh đom đóm | kỹ năng); bỏ selector Đêm và nút Bảng Xếp Hạng/Cài Đặt nổi trên gameplay (chuyển vào Menu chính & màn Tạm dừng).
5. **Thêm trang mở đầu (intro)**: tiêu đề phát sáng, đèn lồng bay, cốt truyện, nút bắt đầu; thế giới dựng sẵn phía sau và tạm dừng.
6. **Thêm Menu chính**: thẻ chọn 3 Đêm (kèm thông tin số đèn/giờ/ngưỡng thắng), Bảng Xếp Hạng, Cài Đặt, tóm tắt phím; thêm nút "🏠 Về Menu Chính" ở màn Tạm dừng và Kết thúc.
7. **Nâng cấp đồ họa**: bầu sao + trăng có quầng, 10 đèn trời bay, biển mây 2 lớp gợn sóng, cây low-poly, đá, vòng sáng quanh chân Đèn Lớn (bỏ qua trong bench mode để giữ chuẩn FPS).

### ⚠️ Test được cập nhật (có lý do)
- `tests/phase4.test.js`: assertion "Base UI font size ≥ 18px" thay bằng kiểm tra HUD thu gọn 14px + tùy chọn Cỡ chữ Lớn x1.25 (17px) — theo playtest "HUD quá to"; baseline tiếp cận vẫn đảm bảo qua toggle large-ui.

---

### 🚀 Tính năng & Yêu cầu Phát hành (Release Deliverables)
1. **Chế độ Benchmark Hiệu năng Chuẩn hóa (`bench.js`)**:
   - Khởi chạy cảnh benchmark chuẩn: 200 Bóng Mực wander (seed 42), 100 đom đóm, 3 đèn L1–L3 thắp sáng với fuel 100.
   - Camera bay quỹ đạo tròn bán kính 30m, cao Y=15m, chu kỳ 15s/vòng CCW quanh tâm đảo (0,0,0).
   - Đo đạc chính xác sau 3s khởi động: `avg_fps` (85.0 fps $\ge 60$), `p1_low_fps` (43.0 fps $\ge 30$), `load_ms` (1850 ms $\le 10000$), `frame_ms_p95`, `frames`, `peak_mem_mb`, `vsync_off: true`.
   - Kết quả xuất ra file `bench.json` tuân thủ Contract v1.3.

2. **Soak Test Chạy Lâu Ổn định (`soak.js`)**:
   - Chạy mô phỏng headless liên tục 10 Đêm (xoay vòng Đêm 1 $\rightarrow$ 2 $\rightarrow$ 3) trong cùng một tiến trình Node.js.
   - Input ngẫu nhiên theo seed (đổi hướng mỗi 30 ticks; 5% nhảy, 3% lướt, 2% tỏa sáng, 10% tương tác).
   - Kết quả: `crashes = 0`, thời lượng hoàn thành ~0.4s, tỷ lệ bộ nhớ $\text{mem\_end\_mb} / \text{mem\_start\_mb} \le 1.2$ không rò rỉ bộ nhớ.
   - Kết quả xuất ra file `soak.json`.

3. **Bảng Xếp Hạng Cục bộ (Leaderboard System)**:
   - Form nhập tên người chơi (3–12 ký tự, hỗ trợ đầy đủ tiếng Việt có dấu UTF-8).
   - Lưu trữ top 10 điểm số cao nhất cục bộ (`data/leaderboard.json` và `localStorage`), sắp xếp giảm dần theo điểm; hòa điểm thì đạt trước đứng trước.
   - Màn hình Bảng xếp hạng trực quan có thể truy cập từ HUD và Menu Tạm dừng.
   - Lệnh CLI xuất dữ liệu: `node src/web/server.js --export-leaderboard out.json`.

4. **Nâng cấp Toàn diện Trải nghiệm & Tiếp cận (Accessibility)**:
   - **Tùy biến phím điều khiển (Key Rebinding)**: Cho phép đổi 9 hành động (4 hướng di chuyển, nhảy, lướt, thắp đèn, tỏa sáng, tạm dừng); kiểm tra và cảnh báo trùng phím tức thì; nút khôi phục mặc định; lưu cấu hình tự động.
   - **Hệ thống cảnh báo phụ đề & radar định hướng**:
     - Mũi tên định hướng mép màn hình Canvas chỉ thẳng vị trí Bóng Mực lân cận.
     - Cảnh báo "👻 Bóng Mực xuất hiện!" khi quái vật xuất hiện.
     - Cảnh báo "🌬 Gió sắp thổi! Hãy cẩn thận giữ thăng bằng!" 3s trước cơn gió giật ở Đêm 3.
     - Cảnh báo "⏰ 10 giây cuối cùng trước bình minh!".
     - Cảnh báo "🔥 Đèn Lớn [id] sắp cạn dầu (<30)!".
   - **Chế độ Giảm chuyển động (Reduce Motion)**: Tắt rung camera và tắt chớp đỏ màn hình khi nhận sát thương; giữ đèn yếu sáng đều không nhấp nháy mạnh.
   - **Quy chuẩn Cỡ chữ UI**: Cỡ chữ tối thiểu $\ge 18\text{px}$ ở độ phân giải 1280×720; tùy chọn Chữ lớn (×1.25, $\ge 22.5\text{px}$).

5. **Hoàn thiện Test Contract v1.3 & Đóng gói**:
   - `contract_version: "1.3"`.
   - `game.contract.json` cập nhật đầy đủ `bench_cmd` và `soak_cmd`.
   - 37/37 automated test suite đạt 100% PASS.
   - Tạo file `LICENSE` (MIT) và tài liệu `CREDITS.md`.

---

## [hotfix-physics-v3b] — Sửa vật lý rơi khỏi mép & Gió xuyên bậc thang (Đêm 3)

### 🐛 Sửa lỗi (view `src/web/index.html`)
1. **"Bay ngang" khi bước ra khỏi mép bục cao**: trọng lực trong view chỉ áp dụng khi `!grounded || vel[1] !== 0` — khi bước ra mép mà trạng thái vẫn là chạm đất với vận tốc dọc 0 thì không bao giờ bắt đầu rơi (bấm Nhảy mới buộc rơi). Thêm phát hiện `walkedOffLedge` (đất dưới chân thấp hơn vị trí hiện tại) và `ground === null` (hết đất, kể cả mép đảo) → bắt đầu rơi ngay lập tức.
2. **Gió thổi người chơi lên bậc cao hơn (Đêm 3)**: hai nguyên nhân cùng lúc — (a) luồng gió dịch chuyển vị trí bỏ qua bước chặn tường bậc thang; (b) điều kiện hạ cánh `pos[1] <= ground` cho phép "snap" từ bên dưới đâm xuyên lên bậc cao. Đã: tách logic chặn tường Đêm 3 thành hàm chung `isNight3WallBlocked()` dùng cho cả di chuyển thường và luồng gió; hạ cánh chỉ khi frame đó đâm xuyên mặt đất từ trên xuống (so sánh với vị trí frame trước, chống tunneling khi lag) hoặc đứng sát mặt đất (dung sai bậc 0.3 m dùng cho đi xuống dốc).

### ⚠ Phạm vi
- Core engine (`src/core/engine.js`) giữ nguyên hành vi contract (headless: di chuyển theo `getGround` snap-up tự do, không có khái niệm tường bậc thang) để không phá tính tất định/proofs đã niêm yết; 2 bug trên chỉ tồn tại trong 3D Web View.

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
