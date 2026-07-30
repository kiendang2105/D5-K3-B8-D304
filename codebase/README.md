# Codebase — AI Tutor giải thích vùng slide

**Lát cắt:** Học viên chọn một vùng hình ảnh trên slide, AI Tutor nhận diện và giải thích riêng vùng đó theo ngữ cảnh bài học.

## Chạy thử

Không cần cài gì — mở thẳng file:

```
codebase/web/index.html
```

hoặc chạy server tĩnh: `npx serve codebase/web`

## Trạng thái: CP2 — Mock

| Phần | Trạng thái | Ghi chú |
|---|---|---|
| Slide viewer + khoanh vùng + crop ảnh | ✅ thật | Crop ra base64 PNG — chính là input sẽ gửi AI ở CP3 |
| Chat panel, trích dẫn, feedback 👍👎, "giải thích đơn giản hơn" | ✅ thật (UI) | |
| **Câu trả lời AI** | ⚠️ **MOCK** | Router trong `app.js` (`routeMockAI`) so vùng chọn với các zone khai trong `mock-data.js` |
| Slide bài giảng | ⚠️ MOCK | 2 slide tự dựng bằng SVG, nội dung phỏng theo bài giảng Buổi 2 |

**Kế hoạch CP3:** thay `routeMockAI()` bằng lời gọi Gemini vision — gửi `cropDataUrl` + câu hỏi + ngữ cảnh (tên bài, đoạn transcript liên quan). Toàn bộ UI và flow giữ nguyên. Log request/response lưu vào `codebase/server/traces/`.

## 4 đường đi trải nghiệm (đã bấm được trong mock)

| Đường đi | Cách trigger | Hành vi |
|---|---|---|
| Happy path | Khoanh trọn sơ đồ/biểu đồ | Giải thích + chip trích dẫn trang `[Txx-NNN]` |
| Low-confidence ② | Khoanh vùng rất nhỏ | Hỏi lại "chọn rộng ra", không đoán |
| Không căn cứ ① | Khoanh vùng trống | Nói rõ không nhận diện được, không bịa |
| Ngoài phạm vi ③ | Gõ câu chứa "làm hộ / đáp án / deadline" | Từ chối + chỉ hướng thay thế (TA/Discord) |
| Correction | Nút "Giải thích đơn giản hơn" · 👎 "Sai chỗ nào?" | Trả bản đơn giản · thu feedback chi tiết |

## Nguyên tắc HAX đã thể hiện trong UI

- **G1** (nói rõ làm được gì): dòng scope ngay header.
- **G2** (làm tốt đến đâu): "ngoài tài liệu mình sẽ nói rõ" + badge MOCK trung thực.
- **G9** (sửa dễ): nút "Giải thích đơn giản hơn" ngay trên output.
- **G10** (thu hẹp khi nghi ngờ): vùng chọn nhỏ → hỏi lại; vùng trống → từ chối có hướng dẫn.
- **G11** (giải thích vì sao): chip trích dẫn trang cạnh mỗi câu trả lời có căn cứ.
- **G15** (mời feedback chi tiết): 👎 kèm "Sai chỗ nào?".
