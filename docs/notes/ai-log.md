# Nhật ký sử dụng AI & Đánh giá (AI Log & Evaluation) — Phase 1

## 1. Ước tính Token & Chi phí
- **Model sử dụng**: Gemini 3.8 Flash (High efficiency, concise context).
- **Chiến lược tối ưu token**:
  - Không nạp lại toàn bộ file lớn, chỉ trích xuất thông tin cần thiết.
  - Sử dụng cấu trúc phân tách rõ ràng để AI xử lý chính xác từng module nhỏ.
  - Batching các lệnh đọc/ghi file và lệnh kiểm tra để giảm số lượt turn hội thoại.
- **Ước tính token Phase 1**: ~18,000 tokens input / ~3,500 tokens output. Chi phí tương đương: < $0.01.

## 2. Phân tích lỗi của AI & Cách tinh chỉnh Harness
- **Lỗi 1 (Thường gặp với 3D Engine)**: AI có xu hướng import thư viện đồ họa cửa sổ vào code headless khiến test trên CI/Linux không có màn hình (headless) bị lỗi `window is not defined` hoặc crash GPU context.
  - *Cách khắc phục*: Thiết lập quy tắc trong `AGENTS.md` chia tách triệt để `src/core/` (logic thuần) và `src/web/` (giao diện 3D).
- **Lỗi 2 (Sai lệch chuyển đổi góc quay camera)**: Công thức di chuyển theo camera yaw quy định cụ thể:
  $x' = x\cos\theta + z\sin\theta$, $z' = -x\sin\theta + z\cos\theta$. Một số AI hay nhầm chiều quay sin/cos hoặc đổi sang radian hai lần.
  - *Cách khắc phục*: Đưa công thức chuẩn vào unit test toán học độc lập (`tests/math.test.js`).
- **Lỗi 3 (Thứ tự tick và snapshot)**: Snapshot tick 0 là trạng thái khởi tạo trước input. Bước thứ $k$ áp dụng input tick $k$ và tạo ra trạng thái tick $k+1$.
  - *Cách khắc phục*: Viết kịch bản kiểm tra tick chronology để tự động kiểm soát.
