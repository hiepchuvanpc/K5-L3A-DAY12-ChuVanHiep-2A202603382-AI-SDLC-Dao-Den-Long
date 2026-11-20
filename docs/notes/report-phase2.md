# Báo Cáo SDLC & Đánh Giá Tổng Hợp — Phase 2 (Ticket-02)

## 1. Ma Trận Truy Vết Yêu Cầu (Requirements Traceability Matrix)

| Mã Yêu Cầu | Nội Dung Yêu Cầu (Ticket-02 / Contract v1.1) | File Mã Nguồn Xử Lý | File Kiểm Thử / Scenario | Bằng Chứng Đầu Ra (Proof) | Kết Quả |
|---|---|---|---|---|---|
| **REQ-01** | Chuẩn hóa chạy (6 m/s), nhảy (7 m/s, $g=-20$), Lướt (14 m/s, 0.2s, cd 1.5s) | `src/core/engine.js` | `tests/phase2.test.js` (Subtest 14) | `docs/proof/phase-2/dash.jsonl` | **ĐẠT** |
| **REQ-02** | Rơi khỏi đảo ($Y < -10$): mất 1 lửa, mất sạch đom đóm, chờ 60 tick, hồi sinh bất tử 90 tick | `src/core/engine.js` | `tests/phase2.test.js` (Subtest 15) | `docs/proof/phase-2/fall.jsonl` | **ĐẠT** |
| **REQ-03** | Đom đóm nhặt $XZ \le 1.0$, $dY \le 1.5$; sinh thêm mỗi 240 tick (trần 30); đèn nạp $\min$ | `src/core/engine.js` | `tests/regression.test.js` (Subtest 20, 21) | `docs/proof/phase-2/night1.jsonl` | **ĐẠT** |
| **REQ-04** | Vùng an toàn 6m quanh đèn sáng, đẩy Bóng Mực ra mép trong 30 tick | `src/core/engine.js` | `tests/engine.test.js` (Subtest 4) | `docs/proof/phase-2/night1.jsonl` | **ĐẠT** |
| **REQ-05** | Tỏa Sáng: 3 đom đóm, bán kính 5m, choáng 120 tick, đẩy lùi 4m trong 15 tick | `src/core/engine.js` | `tests/regression.test.js` (Subtest 22) | `docs/proof/phase-2/dash.jsonl` | **ĐẠT** |
| **REQ-06** | Bóng Mực: tốc độ 4.0 m/s (Đêm 3: 4.5 m/s); trạng thái chuẩn; giật lùi 2m khi đánh | `src/core/engine.js` | `tests/engine.test.js` (Subtest 6) | `docs/proof/phase-1/hit.jsonl` | **ĐẠT** |
| **REQ-07** | Gió Lạc (Drifter): cướp đom đóm khi mang $\ge 5$; bị Tỏa Sáng thì bỏ chạy/rơi đom đóm | `src/core/engine.js` | `tests/phase2.test.js` (Subtest 16) | `docs/proof/phase-2/drifter.jsonl` | **ĐẠT** |
| **REQ-08** | Bùa Gió (Wind Charm): tăng tốc 7.2 m/s, không hồi chiêu lướt trong 600 tick | `src/core/engine.js` | `tests/phase2.test.js` (Subtest 17) | `docs/proof/phase-2/charm.jsonl` | **ĐẠT** |
| **REQ-09** | Bục nhảy (Jump Pads): phóng Mây sang đảo đối diện hoặc lên tầng cao | `src/core/engine.js` | `tests/phase2.test.js` (Subtest 19) | `docs/proof/phase-2/jumppad.jsonl` | **ĐẠT** |
| **REQ-10** | Tạm dừng (Pause): đóng băng sim_tick và mọi bộ đếm, trạng thái ghi "paused" | `src/core/engine.js` | `tests/phase2.test.js` (Subtest 18) | `docs/proof/phase-2/pause.jsonl` | **ĐẠT** |
| **REQ-11** | Kiểm tra hồi quy Phase 1: Mọi tính năng cốt lõi Đêm 1 vẫn hoạt động chính xác | `src/core/engine.js` | `tests/regression.test.js` (Subtest 20-23) | `docs/proof/phase-2/determinism_and_perf.txt` | **ĐẠT** |
| **REQ-12** | Tính tất định (Determinism 100%): Cùng seed/night/scenario cho hash đầu ra giống hệt | `src/core/math.js` | `tests/phase2.test.js` (Subtest 23) | `docs/proof/phase-2/determinism_and_perf.txt` | **ĐẠT** |

---

## 2. Báo Cáo Hiệu Năng & Tính Tất Định (Rubric Hạng mục E)

- **Công cụ đo đạc**: Chạy mô phỏng Headless CLI với kịch bản tổng hợp cả 3 Đêm (21.600 ticks = 360 giây gameplay).
- **Kết quả đo lường**:
  - Thời gian thực thi: **0.06 giây** cho 21.600 ticks (đạt ~360.000 ticks/giây).
  - So với ngưỡng yêu cầu của đề bài ($\le 30$ giây): Nhanh gấp **500 lần**.
- **Xác thực Tính Tất Định**:
  - Chạy 2 lần độc lập cùng `--seed 42 --night 1 --ticks 1200`.
  - Mã băm SHA-256 của file snapshot: `e1f8623b7ef8d527a4192b00eb8863fbaeb1b23c21a486da4961be493864d4c5` (trùng khớp 100%).

---

## 3. Nhật Ký Sử Dụng AI & Phân Bổ Token (Rubric Hạng mục D)

### 3.1. Thống kê Token & Chi phí
- **Mô hình**: Gemini 3.8 Flash.
- **Tổng lượng token tiêu thụ lũy kế**:
  - Phase 1: ~18.500 input tokens / ~4.200 output tokens (~$0.012).
  - Phase 2: ~26.000 input tokens / ~5.800 output tokens (~$0.018).
  - Tổng cộng 2 Phase: **~54.500 tokens** (Chi phí: **~$0.030**).
- **Chiến lược tiết kiệm token đã áp dụng**:
  - Không đọc lại các file dữ liệu lớn không thay đổi.
  - Sử dụng batch tool calls (gộp các thao tác đọc và chỉnh sửa file trong một lượt gọi).
  - Tránh in log rườm rà ra console; tập trung vào kiểm thử tự động `npm test`.

### 3.2. Phân tích lỗi của AI & Cách tinh chỉnh Harness (`AGENTS.md`)
1. **Lỗi phụ thuộc `node:fs` trong môi trường trình duyệt**:
   - *Biểu hiện*: AI từng định import trực tiếp `config.js` vào `index.html`, khiến trình duyệt báo lỗi `Failed to resolve module specifier "node:fs"` và màn hình bị trắng.
   - *Cách phát hiện*: Kiểm tra console trình duyệt và rà soát các import statement.
   - *Điều chỉnh Harness*: Quy định rõ trong `AGENTS.md` về việc tách biệt tuyệt đối giữa Core Node.js và Client Web standalone.
2. **Lỗi tọa độ Camera Yaw Three.js làm ngược hướng phím A/D**:
   - *Biểu hiện*: Khi camera đặt tại $-Z$ nhìn về $+Z$, trục ngang camera ngược với trục $X$ thế giới, khiến bấm phím A nhân vật lại rẽ phải.
   - *Điều chỉnh Harness*: Cập nhật công thức chuyển đổi vector góc nhìn trong `src/core/math.js` và áp dụng chuẩn vào `index.html`.
3. **Lỗi đom đóm không hồi và bóng ma không đuổi**:
   - *Biểu hiện*: Web ban đầu chỉ sinh đom đóm một lần lúc đầu (20 con) nên không đủ nạp 50 con cho 5 đèn; bóng ma sinh cách quá xa (35m) và không có chu kỳ sinh thêm.
   - *Điều chỉnh*: Thêm hàm hồi sinh đom đóm tự động (trần 30 con) và cơ chế AI săn lùng cho Bóng Mực theo đúng tinh thần Ticket-02.

---

## 4. Đánh Giá Hồi Quy & Bài Học Kinh Nghiệm (Retrospective)

- **Những điều hiệu quả**:
  - Kiến trúc phân lớp (Deterministic Core Engine + Web 3D Presentation) giúp toàn bộ logic được kiểm thử tự động bằng unit test mà không phụ thuộc vào WebGL.
  - Test Contract v1.1 giúp phát hiện sớm sai lệch về tên event hay thứ tự 12 bước trong tick.
- **Nếu làm lại từ đầu thì sẽ thay đổi gì**:
  - Thiết kế mock input adapter ngay từ Phase 1 để Web 3D và Headless CLI dùng chung 100% tệp engine mà không cần duplicate một số logic phụ.
  - Cấu hình sẵn hệ thống ánh sáng 3D với HemisphereLight ngay từ đầu để tránh màn đêm quá tối.

---

## 5. Kịch Bản Quay Video Demo Dưới 5 Phút (Video Demo Script)

*Sinh viên dùng OBS / QuickTime / Windows Game Bar (Win+G) quay màn hình theo kịch bản sau (khoảng 3 phút 30 giây):*

1. **Phút 0:00 – 0:30 (Giới thiệu & Chạy lệnh)**:
   - Mở terminal, gõ `npm test` để giám khảo thấy **23/23 tests pass 100%**.
   - Chạy lệnh Headless CLI: `node src/cli/headless.js --seed 42 --night 2 --ticks 120 --out demo.jsonl` và cho thấy file JSONL được sinh ra tức thì.
2. **Phút 0:31 – 1:30 (Trải nghiệm Đêm 1 — Đảo Bến)**:
   - Chạy `npm start`, mở trình duyệt tại `http://localhost:3000`.
   - Điều khiển Mây di chuyển, nhặt đom đóm, dùng phím <kbd>Shift</kbd> để Lướt (Dash), phím <kbd>E</kbd> nạp đom đóm thắp sáng Đèn Lớn.
   - Cho thấy Bóng Mực có hào quang tím đang đuổi theo, bấm <kbd>Q</kbd> để Tỏa Sáng đẩy lùi và làm choáng Bóng Mực.
3. **Phút 1:31 – 2:30 (Trải nghiệm Đêm 2 & Đêm 3)**:
   - Chuyển sang Đêm 2 (Đảo Cau): Nhảy lên bục nhảy (Jump Pad) để bay vút qua hòn đảo thứ hai, nhặt Bùa Gió và lướt liên tục.
   - Cho thấy Gió Lạc xuất hiện cướp đom đóm và bị Tỏa Sáng đánh rơi lại.
4. **Phút 2:31 – 3:30 (Kiểm tra Harness AI & Bằng chứng)**:
   - Mở nhanh file `AGENTS.md`, `game.contract.json` và thư mục `docs/proof/phase-2/`.
   - Kết thúc video, nén file thành `demo.mp4` (dưới 100MB) và đính kèm vào GitHub Release `v1.0.0`.
