# Nhật ký sử dụng AI & Đánh giá (AI Log & Evaluation) — Phase 2

## 1. Ước tính Token & Chi phí
- **Model sử dụng**: Gemini 3.8 Flash (High efficiency, concise context).
- **Chiến lược tối ưu token**:
  - Không nạp lại toàn bộ transcript cũ hay các file test không liên quan.
  - Tách bạch cấu trúc bản đồ sang `src/core/maps.js` để tránh lặp lại cấu hình bản đồ trong logic engine.
  - Sử dụng batching đọc và ghi file khi triển khai các tính năng mới.
- **Ước tính token Phase 2**: ~25,000 tokens input / ~5,500 tokens output. Tổng chi phí lũy kế: < $0.02.

## 2. Phân tích lỗi của AI & Cách tinh chỉnh Harness
- **Lỗi 1 (Thứ tự 12 bước trong tick)**: Ticket-02 yêu cầu nghiêm ngặt thứ tự 12 bước (xử lý pause trước, giảm bộ đếm, di chuyển Mây rồi kiểm tra rơi, nhặt đồ, tương tác đèn, cập nhật vùng an toàn, tỏa sáng, di chuyển quái, chạm: Gió Lạc cướp trước rồi Bóng Mực gây hit, sinh thực thể, xét thắng thua, ghi snapshot).
  - *Cách khắc phục*: Đưa nguyên văn danh sách 12 bước vào `AGENTS.md` mục 2 để Agent tuân thủ triệt để trong mọi hàm `step()`.
- **Lỗi 2 (Trạng thái chuẩn của Bóng Mực)**: Test Contract v1.1 yêu cầu tên trạng thái Bóng Mực phải đúng chuẩn: `spawning`, `wander`, `chase`, `recoil`, `stunned`. Trong Phase 1 ta chỉ dùng `chase` và `stunned`.
  - *Cách khắc phục*: Bổ sung logic recoil (giật lùi 2m trong 60 ticks) và wander (khi ngoài tầm 18m) và cập nhật state machine.
- **Lỗi 3 (Cơ chế rơi đảo $Y < -10$)**: Rơi đảo gây $-1$ ngọn lửa, mất toàn bộ đom đóm, chờ 60 ticks rồi hồi sinh tại điểm xuất phát với 90 ticks bất tử.
  - *Cách khắc phục*: Viết kịch bản kiểm thử độc lập `tests/phase2.test.js` để kiểm chứng riêng rẽ từng trường dữ liệu của sự kiện `player_hit` do rơi (`{"by": "fall", "flames": n, "dropped": 0, "lost": n}`).
