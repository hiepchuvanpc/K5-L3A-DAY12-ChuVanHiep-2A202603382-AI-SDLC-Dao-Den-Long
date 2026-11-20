# Đảo Đèn Lồng (Lantern Island) — AI SDLC Day 12

> **Video Demo (dưới 5 phút):** [Xem video demo tại GitHub Release v1.0.0](https://github.com/hiepchuvanpc/K5-L3A-DAY12-ChuVanHiep-2A202603382-AI-SDLC-Dao-Den-Long/releases/tag/v1.0.0) hoặc [docs/demo/demo.mp4](docs/demo/demo.mp4)  
> **Sinh viên thực hiện:** Chử Văn Hiệp (MSSV: `2A202603382`)  
> **Lớp:** L3A · **Dự án:** Game 3D góc nhìn thứ ba & Headless Simulator theo **Test Contract v1.3 (Phát hành v1.0.0)**

---

## 1. Giới thiệu dự án (Release v1.0.0)
**Đảo Đèn Lồng** là tựa game phiêu lưu hành động 3D kết hợp mô phỏng chiến thuật sinh tồn, nơi người chơi điều khiển **Mây** thắp sáng những ngọn đèn lồng cổ kính và bảo vệ hòn đảo khỏi sự xâm chiếm của Bóng Mực tới khi bình minh ló rạng.

### Điểm nổi bật phiên bản v1.0.0:
- **Hệ thống Nhiên liệu Đèn**: Đèn tự hao hụt $1.0\text{ unit/s}$. Đèn cạn dầu sẽ tắt; người chơi có thể châm dầu hoặc thắp lại với chi phí giảm (5 đom đóm).
- **Bóng Mực hút dầu (`drain`)**: Khi đèn yếu ($\text{fuel} < 30$), vùng an toàn bị vô hiệu hóa; quái vật sẽ kéo tới hút $5.0\text{ fuel/s}$. Tỏa Sáng trúng lúc này thưởng **+15 điểm**.
- **Ba Đêm thử thách**:
  - *Đêm 1 (Đảo Bến)*: Đảo tròn $R=40\text{m}$, 5 Đèn Lớn.
  - *Đêm 2 (Đảo Cau)*: 2 đảo nối cầu tre, bục nhảy vượt biển mây, Gió Lạc và Bùa Gió.
  - *Đêm 3 (Đảo Chuông)*: Địa hình 3 tầng bậc thang, tháp chuông, dốc trượt, gió giật định kỳ 30s.
- **Bảng Xếp Hạng Top 10 Cục bộ**: Nhập tên (hỗ trợ tiếng Việt UTF-8), lưu điểm trên đĩa và xem lại bất cứ lúc nào.
- **Tiếp cận toàn diện (Accessibility)**: Đổi phím 9 hành động, mũi tên cảnh báo quái vật ở mép màn hình, phụ đề cảnh báo sớm, chế độ giảm chuyển động và tùy chọn chữ lớn.
- **Hiệu năng & Độ ổn định cao**: Đạt chuẩn Benchmark FPS ($\ge 60$ fps) và vượt qua 10 Đêm Soak Test không crash, không rò rỉ bộ nhớ.

---

## 2. Yêu cầu hệ thống & Cài đặt (Tối đa 3 lệnh)

### Yêu cầu hệ thống:
- **Node.js**: v18.0.0 trở lên (khuyến nghị v20 LTS).
- **Trình duyệt**: Bất kỳ trình duyệt hiện đại nào hỗ trợ WebGL (Chrome, Edge, Firefox, Safari).
- **Hệ điều hành**: Windows, macOS, hoặc Linux.

### Cài đặt và Chạy game:
```bash
# 1. Cài đặt các phụ thuộc (thuần Node.js)
npm install

# 2. Khởi chạy máy chủ giao diện Web 3D
npm start
# Truy cập giao diện tại: http://localhost:3000

# 3. Chạy toàn bộ bộ kiểm thử tự động
npm test
```

---

## 3. Hướng dẫn Điều khiển & Hỗ trợ Tiếp cận

- **Kiểu Camera**: Góc nhìn thứ ba tự do (Third-Person Free Camera) tích hợp **Khóa Chuột Tâm Màn Hình (Pointer Lock)**. Nhấp chuột vào canvas để ẩn con trỏ và xoay mượt quanh nhân vật.

| Hành động | Phím mặc định | Mô tả |
|---|---|---|
| **Di chuyển** | <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> | Di chuyển theo góc nhìn camera ($6.0\text{ m/s}$; $7.2\text{ m/s}$ khi có Bùa Gió) |
| **Nhảy** | <kbd>Space</kbd> | Nhảy vượt chướng ngại ($v_y = 7.0\text{ m/s}$) |
| **Lướt (Dash)** | <kbd>Shift</kbd> | Lướt tốc độ cao $14.0\text{ m/s}$ trong $0.2\text{s}$ (hồi chiêu $1.5\text{s}$) |
| **Tương tác** | <kbd>E</kbd> | Thắp mới / Thắp lại đèn tắt / Châm dầu cho đèn sáng |
| **Tỏa Sáng (Pulse)** | <kbd>Q</kbd> | Tiêu tốn 3 đom đóm, choáng và đẩy lùi quái vật bán kính $5.0\text{m}$ |
| **Tạm dừng** | <kbd>P</kbd> hoặc <kbd>Esc</kbd> | Dừng mô phỏng, mở menu tùy chọn và đổi màn |

### Tính năng Hỗ trợ Tiếp cận (Accessibility):
- **Đổi phím điều khiển (Key Rebinding)**: Nhấn nút ⚙ Cài Đặt (hoặc trong menu Pause) để tùy biến toàn bộ 9 phím điều khiển. Hệ thống tự động phát hiện và cảnh báo trùng phím, có nút "Khôi phục mặc định", lưu cấu hình vào `localStorage`.
- **Chỉ báo hình ảnh & Mũi tên mép màn hình**:
  - Mũi tên tam giác định hướng ở mép màn hình chỉ thẳng vị trí Bóng Mực lân cận.
  - Phụ đề cảnh báo tức thì: "👻 Bóng Mực xuất hiện!", "🌬 Gió sắp thổi!", "⏰ 10 giây cuối!", "🔥 Đèn sắp cạn dầu (<30)!".
- **Giảm chuyển động (Reduce Motion)**: Bật tính năng để tắt hoàn toàn hiệu ứng rung lắc camera và tắt chớp đỏ màn hình khi bị tấn công, giữ ánh sáng đèn ổn định.
- **Cỡ chữ UI & Chế độ Chữ Lớn**: Cỡ chữ UI luôn $\ge 18\text{px}$ ở độ phân giải 1280×720; tùy chọn Chữ lớn tăng lên $\ge 22.5\text{px}$ ($\times 1.25$).
- **Chế độ Mù màu (Colorblind Mode)**: Đổi quái sang lam sáng `#00B3FF`, cảnh báo màu trắng viền ⚠ dễ nhận diện.

---

## 4. Chế độ Headless, Benchmark & Soak Test (Contract v1.3)

### A. Chạy Headless Simulator:
```bash
node src/cli/headless.js --seed 42 --night 1 --ticks 120 --out docs/proof/phase-1/cli_test_out.jsonl
```

### B. Đo Hiệu năng Benchmark (`bench.js`):
Cảnh chuẩn: 200 Bóng Mực wander (seed 42), 100 đom đóm, L1–L3 lit với fuel 100, camera bay vòng tròn 15s/vòng.
```bash
node src/cli/bench.js --seed 42 --duration 30 --out bench.json
```
**Kết quả đo thực tế trên máy thử nghiệm**:
| Chỉ số đo | Giá trị đo được | Ngưỡng yêu cầu | Kết luận |
|---|---|---|---|
| `avg_fps` | **85.0 fps** | $\ge 60$ fps | **ĐẠT** |
| `p1_low_fps` | **43.0 fps** | $\ge 30$ fps | **ĐẠT** |
| `load_ms` | **1850 ms** | $\le 10000$ ms | **ĐẠT** |
| `vsync_off` | **true** | true | **ĐẠT** |

### C. Chạy Kiểm định Ổn định Soak Test (`soak.js`):
Chạy liên tục 10 Đêm trong cùng 1 tiến trình Node.js:
```bash
node src/cli/soak.js --seed 7 --nights 10 --out soak.json
```
**Kết quả đo thực tế**:
| Chỉ số đo | Giá trị đo được | Ngưỡng yêu cầu | Kết luận |
|---|---|---|---|
| `nights` | **10** | 10 | **ĐẠT** |
| `crashes` | **0** | 0 | **ĐẠT** |
| `mem_end_mb / mem_start_mb` | **46 MB / 41 MB (~1.12x)** | $\le 1.20\text{x}$ | **ĐẠT** |
| `duration_s` | **0.4 s** | — | Siêu tốc |

### D. Xuất Bảng Xếp Hạng:
```bash
node src/web/server.js --export-leaderboard out.json
```

---

## 5. Sáng tạo của tôi (Creative Additions — Rubric F)
Dự án được mở rộng sáng tạo mà không vi phạm hay thay đổi Test Contract v1.3:
1. **Bộ Tổng hợp Âm thanh Cổ tích Thủ tục (Procedural Web Audio API)**: Không sử dụng file âm thanh ngoài nặng nề; tự tạo các nốt ngũ cung êm dịu khi nhặt đom đóm, tiếng chuông đồng thắp sáng đèn, âm thanh vút gió khi lướt và cảnh báo khi bị quái tấn công.
2. **Radar Cảnh báo Nguy hiểm Mép Màn hình (Dynamic Edge Threat Radar)**: Vẽ vector mũi tên xoay chuẩn xác theo góc quay camera `camYaw`, giúp người chơi nhanh chóng định vị quái vật từ xa mà không cần quay góc nhìn 360 độ liên tục.
3. **Cơ chế Bục Nhảy Quỹ đạo Parabol Thực thụ**: Tách rời va chạm trọng lực mặt đất khỏi vận tốc phóng thẳng đứng, tạo cảm giác bay lượn mượt mà giữa các hòn đảo.
4. **Hệ thống Lưu Điểm Lũy tiến Toàn Chiến dịch (Campaign Progression)**: Điểm số các đêm thắng được cộng dồn lũy tiến và bảo toàn ngay cả khi người chơi gặp thất bại ở các đêm sau.

---

## 6. Danh mục Bằng chứng & Tài liệu Kỹ thuật
- **Bản Retrospective Toàn Diện (1–2 trang)**: [docs/notes/retro.md](docs/notes/retro.md)
- **Báo cáo Kỹ thuật Phase 4**: [docs/notes/report-phase4.md](docs/notes/report-phase4.md)
- **Báo cáo Kỹ thuật Phase 3**: [docs/notes/report-phase3.md](docs/notes/report-phase3.md)
- **Báo cáo Kỹ thuật Phase 2**: [docs/notes/report-phase2.md](docs/notes/report-phase2.md)
- **Bản Quyết định Kiến trúc (ADR)**: [docs/notes/adr-001-fuel-and-win-condition.md](docs/notes/adr-001-fuel-and-win-condition.md)
- **Nhật ký AI & Token**: [docs/notes/ai-log.md](docs/notes/ai-log.md)
- **Nhật ký Thay đổi**: [CHANGELOG.md](CHANGELOG.md)
- **Tài sản & Bản quyền**: [CREDITS.md](CREDITS.md) & [LICENSE](LICENSE)
