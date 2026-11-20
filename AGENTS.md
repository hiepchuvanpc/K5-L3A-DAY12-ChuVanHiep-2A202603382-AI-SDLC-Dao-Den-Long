# AGENTS.md — Hướng dẫn cho AI Agent

Dự án **Đảo Đèn Lồng** (Day 12 AI SDLC).

## 1. Nguyên tắc cốt lõi
- **Chính xác tuyệt đối theo Test Contract v1.0**: Chế độ headless là bài kiểm tra tự động của khách hàng/giảng viên, không được phép thay đổi định dạng hoặc làm lệch tick/tọa độ.
- **Tách bạch Core Logic và View**: Mọi logic tính toán vị trí, va chạm, điểm số, trạng thái (state machine) nằm trong `src/core/`. Giao diện 3D (`src/web/`) chỉ lắng nghe hoặc render state, không chứa logic quyết định contract.
- **Không bao giờ làm giả test / output**: Mọi test phải chạy thật và phản ánh đúng trạng thái code.
- **Tính tất định (Determinism)**: Cùng `--seed`, `--scenario`, `--inputs` phải tạo ra output giống hệt nhau 100%.

## 2. Các lệnh thường dùng
- Cài đặt: `npm install`
- Chạy kiểm thử tự động: `npm test`
- Chạy headless mô phỏng: `node src/cli/headless.js --seed 42 --night 1 --ticks 120 --out out.jsonl`
- Chạy giao diện 3D: `npm start` (mở trình duyệt tại http://localhost:3000)

## 3. Quy ước code
- Chuẩn ES Module (`import`/`export`), Node.js v20+.
- Tọa độ 3D: trục Y hướng lên, Y=0 là mặt đất đảo. Khoảng cách đo trên mặt phẳng ngang XZ.
- Số thực trong JSONL làm tròn đúng 3 chữ số thập phân (`round(val, 3)`).
