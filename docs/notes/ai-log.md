# Nhật ký sử dụng AI & Đánh giá (AI Log & Evaluation) — Toàn bộ 4 Phase

## 1. Ước tính Token & Chi phí Qua các Phase
- **Model sử dụng**: Gemini 3.8 Flash (High efficiency, concise context).
- **Chiến lược tối ưu token**:
  - Không nạp lại toàn bộ transcript cũ hay các file test không liên quan.
  - Tách bạch cấu trúc bản đồ sang `src/core/maps.js` và bảng xếp hạng sang `src/core/leaderboard.js` để module hóa logic.
  - Sử dụng batching đọc và ghi file khi triển khai các tính năng mới.
- **Chi tiết từng phase**:
  - **Phase 1 (PRD-0)**: ~28,000 input / ~6,200 output tokens.
  - **Phase 2 (Ticket-02)**: ~25,000 input / ~5,500 output tokens.
  - **Phase 3 (Ticket-03)**: ~32,000 input / ~7,000 output tokens.
  - **Phase 4 (Ticket-04)**: ~35,000 input / ~7,500 output tokens.
- **Tổng cộng**: ~120,000 input tokens / ~26,200 output tokens.
- **Tổng chi phí ước tính**: **< $0.08**.

---

## 2. Phân tích Lỗi của AI & Cách Tinh chỉnh Harness (4 Phase)
- **Phase 1**:
  - *Lỗi*: AI thiết kế logic di chuyển gắn liền với Three.js Vector3, không thể chạy headless.
  - *Cách khắc phục*: Tách rời hoàn toàn Core Logic sang `src/core/math.js` và `src/core/engine.js`.
- **Phase 2**:
  - *Lỗi 1 (Thứ tự 12 bước trong tick)*: Vi phạm thứ tự bước kiểm tra rơi đảo và di chuyển.
  - *Cách khắc phục*: Đưa nguyên văn danh sách 12 bước vào `AGENTS.md` mục 2.
  - *Lỗi 2 (Trạng thái chuẩn Bóng Mực)*: Tên trạng thái thiếu `recoil` và `wander`.
  - *Cách khắc phục*: Cập nhật FSM trong `engine.js` và viết test kiểm chứng.
- **Phase 3**:
  - *Lỗi (Breaking Changes)*: AI giữ logic thắng sớm khi thắp hết đèn thay vì đợi bình minh.
  - *Cách khắc phục*: Viết ADR ghi nhận quyết định kiến trúc, cập nhật test hồi quy.
- **Phase 4**:
  - *Lỗi 1 (Camera Shake bị ghi đè)*: Biến rung camera bị ghi đè bởi hàm cập nhật vị trí camera.
  - *Cách khắc phục*: Tích hợp trực tiếp `camShakeTimer` vào bước cập nhật camera cuối cùng.
  - *Lỗi 2 (Cỡ chữ UI)*: Cỡ chữ mặc định nhỏ hơn 18px ở độ phân giải 1280x720.
  - *Cách khắc phục*: Chuẩn hóa base font-size $\ge 18\text{px}$ và `large-ui` mode $\ge 22.5\text{px}$.
