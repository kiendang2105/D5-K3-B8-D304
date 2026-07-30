# traces/ — log lời gọi AI thật

Rubric **R5** (3 điểm): *"≥1 lời gọi AI thật ở quyết định trung tâm (log/trace trong repo); phần mock ghi rõ"*.

## Cách lấy trace

1. Bấm **API key** trên header, nhập Gemini API key → `CONFIG.USE_REAL_AI` bật lên.
2. Hỏi một câu bất kỳ (khoanh vùng hoặc gõ "giải thích slide N").
3. Mở DevTools → Console → tìm dòng `[AI TRACE]`.
4. Copy JSON đó vào một file `trace-NN.json` trong thư mục này.

## Mỗi trace gồm

| Field | Ý nghĩa |
|---|---|
| `page` | Trang được hỏi |
| `mode` | `text` (đọc lớp text) hoặc `scan` (quét ảnh trang) |
| `question` | Câu hỏi nguyên văn của học viên |
| `model` | Model đã gọi |
| `latency_ms` | Độ trễ thực đo |
| `usage` | Token in/out do API trả về |
| `images_sent` | Số ảnh đã gửi (1 = chỉ vùng khoanh · 2 = cả trang + vùng khoanh) |
| `answer` | Câu trả lời model sinh ra |

## Nên giữ ít nhất

- **1 trace `mode: "text"`** — trang đọc được text.
- **1 trace `mode: "scan"`** — trang không có lớp text, phải quét ảnh. Đây là bằng chứng cho tính năng chính.
- **1 trace của case fail** — giữ luôn, đừng xoá. Rubric tính điểm cho việc ghi nhận trung thực.

Trace không chứa API key (key nằm trong URL request, không nằm trong object log). Vẫn nên đọc lại file trước khi commit.
