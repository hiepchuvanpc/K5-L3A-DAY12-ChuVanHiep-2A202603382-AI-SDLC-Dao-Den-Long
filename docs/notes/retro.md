# Báo cáo Tổng kết Dự án & Retrospective (4 Phase)
## Dự án: Đảo Đèn Lồng (Lantern Island)

- **Sinh viên thực hiện**: Chử Văn Hiệp (MSSV: `2A202603382`, Lớp: `L3A`)
- **Dự án**: Game 3D Hành động Cổ tích & Headless Simulator theo Test Contract v1.0 $\rightarrow$ v1.3
- **Ngày hoàn tất**: 20/11/2026

---

### 1. Tổng kết Đánh giá Qua 4 Phase (Evaluation Across 4 Phases)

| Phase | Trọng tâm Yêu cầu | Test Contract | Thách thức Lớn nhất | Kết quả Đạt được |
|---|---|---|---|---|
| **Phase 1** | Xây dựng lõi game, chuyển động, nhặt đom đóm, thắp đèn, headless runner | v1.0 | Tách biệt hoàn toàn Core Engine tất định khỏi 3D View | 13/13 tests PASS, SHA-256 trùng khớp 100% |
| **Phase 2** | Mở rộng 3 Đêm, Dash, rơi đảo, Gió Lạc, Bùa Gió, Bục nhảy, Pause | v1.1 | Giữ đúng thứ tự 12 bước trong tick và chuẩn hóa trạng thái quái | 23/23 tests PASS, hiệu năng headless 21.600 ticks trong 0.06s |
| **Phase 3** | Change Request "Đèn cạn dầu": hao dầu, quái hút dầu, luật thắng mới | v1.2 | Sửa chữa các breaking changes mà không làm hỏng tính tất định | 31/31 tests PASS, cập nhật toàn bộ test contract cũ |
| **Phase 4** | Non-functional: Benchmark FPS, Soak test, Leaderboard, Accessibility | v1.3 | Đảm bảo hiệu năng đồ họa WebGL và kiểm soát rò rỉ bộ nhớ | 37/37 tests PASS, Benchmark 85 FPS, Soak test 0 crash (1.12x mem) |

---

### 2. Những Điều Hiệu Quả và Không Hiệu Quả khi Làm việc với AI

#### Điều thực sự hiệu quả:
1. **Kiến trúc Tách biệt (Decoupled Core Architecture)**: Ép AI xây dựng Core Engine chạy headless độc lập bằng pure JavaScript trước khi xây dựng 3D Web View giúp loại bỏ 90% lỗi logic phức tạp. Mọi bug thuật toán, va chạm hay điểm số đều được phát hiện ngay bằng test suite headless.
2. **Kiểm thử Hướng Hợp đồng (Test-Driven Contract Verification)**: Định nghĩa JSON Schema và các test case biên trước khi yêu cầu AI viết code giúp AI không bị "bịa đặt" hay mở rộng tính năng ngoài lề.
3. **Commit Nhỏ và Tuần tự**: Mỗi phase chia thành các bước nhỏ (Core Logic $\rightarrow$ CLI Runner $\rightarrow$ Web View $\rightarrow$ Accessibility), giúp việc đánh giá diff và kiểm soát chất lượng trở nên tức thời.

#### Điều không hiệu quả (Cần khắc phục):
1. **Giao nhiệm vụ quá rộng**: Khi giao cho AI "hãy làm toàn bộ Phase 3 gồm cả đồ họa và logic", AI dễ bỏ sót các ràng buộc nhỏ như thứ tự ưu tiên sự kiện hay tỷ lệ hao dầu.
2. **Để AI tự phán đoán UI/UX**: AI có xu hướng dùng các kích thước chữ nhỏ (10–14px) hoặc hiệu ứng hoạt họa mặc định không đáp ứng các tiêu chuẩn tiếp cận khắt khe (như cỡ chữ $\ge 18\text{px}$). Phải có thông số định lượng cụ thể trong hướng dẫn.

---

### 3. Phân tích Lỗi của AI & Cách Phát hiện

1. **Lỗi 1: Vi phạm thứ tự bước trong Tick (Phase 2)**:
   - *Biểu hiện*: AI đặt bước kiểm tra rơi đảo trước khi cập nhật vị trí người chơi sau khi lướt/nhảy.
   - *Cách phát hiện*: Chạy kịch bản scenario headless đối chiếu với Contract v1.1 phát hiện snapshot sai lệch 1 tick.
   - *Cách khắc phục*: Ghi rõ danh sách 12 bước tuần tự bắt buộc vào `AGENTS.md`.

2. **Lỗi 2: Bỏ sót Breaking Change khi chuyển sang Contract v1.2 (Phase 3)**:
   - *Biểu hiện*: AI vẫn giữ điều kiện thắng cũ "thắp hết đèn thì thắng sớm" trong một nhánh logic cũ.
   - *Cách phát hiện*: Test hồi quy `tests/phase3.test.js` bị fail vì trận đấu kết thúc sớm thay vì chạy tới bình minh.
   - *Cách khắc phục*: Tạo Bản ghi Quyết định Kiến trúc (`docs/notes/adr-001-fuel-and-win-condition.md`) và cập nhật test contract.

3. **Lỗi 3: Camera Shake bị ghi đè frame (Phase 4)**:
   - *Biểu hiện*: Rung camera được tính toán nhưng ở dòng sau mã cập nhật camera vị trí lại ghi đè vị trí mới, khiến camera không rung thật.
   - *Cách phát hiện*: Soát mã trực tiếp và thử nghiệm trên giao diện 3D.
   - *Cách khắc phục*: Tích hợp biến `camShakeTimer` trực tiếp vào hàm định vị camera cuối cùng.

---

### 4. Harness Nào Giúp Ích Nhiều Nhất?

1. **`AGENTS.md` (Hướng dẫn ngữ cảnh cốt lõi)**:
   - Đây là thành phần harness quan trọng nhất. Giữ ngắn gọn (~35 dòng), chứa thông số tuning, 12 bước trong tick và danh sách lệnh CLI chuẩn. Mỗi khi AI sai lặp lại lần thứ hai, cập nhật ngay một dòng quy tắc vào `AGENTS.md`.
2. **Bộ Test Tự động (`node --test tests/*.test.js`)**:
   - Chạy siêu tốc (~870 ms cho 37 tests). Hoạt động như một "chốt chặn bảo vệ" (guard rail) ngăn không cho AI hoàn tất lượt làm việc nếu test suite chưa xanh 100%.

---

### 5. Quản lý Token & Chi phí AI Ước tính

- **Tổng lượng Token ước tính toàn dự án (4 Phase)**:
  - **Phase 1**: ~28,000 input / ~6,200 output tokens.
  - **Phase 2**: ~25,000 input / ~5,500 output tokens.
  - **Phase 3**: ~32,000 input / ~7,000 output tokens.
  - **Phase 4**: ~35,000 input / ~7,500 output tokens.
  - **Tổng cộng**: ~120,000 input / ~26,200 output tokens.
  - **Tổng chi phí ước tính**: **< $0.08** (sử dụng Gemini Flash hiệu năng cao).
- **Cách thức tiết kiệm token**:
  - Tách nhỏ mã nguồn theo từng module độc lập (`math.js`, `maps.js`, `leaderboard.js`, `engine.js`).
  - Sử dụng batching khi đọc/ghi file và kiểm tra diff tập trung.
  - Tránh nạp lại các file log hay transcript quá dài vào ngữ cảnh prompts.

---

### 6. Nếu Làm Lại Dự Án Thì Sẽ Thay Đổi Gì?

1. **Thiết kế Hệ thống Sự kiện (Event-driven Architecture) sớm hơn**: Ngay từ Phase 1 nên tạo một Event Bus chuẩn mực (`emit('lantern_lit')`, `emit('fuel_decay')`) để View và CLI lắng nghe một cách tự động, thay vì phải kiểm tra mảng sự kiện thủ công.
2. **Tự động hóa Đo đạc Hiệu năng sớm hơn**: Đưa các bài test đo FPS và bộ nhớ vào quy trình kiểm thử ngay từ Phase 2 thay vì để đến Phase 4, giúp tối ưu hóa Three.js mesh/light từ sớm và tránh phải dọn dẹp bộ nhớ ở cuối dự án.
