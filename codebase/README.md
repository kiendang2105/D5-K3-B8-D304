# Codebase — AI Tutor giải thích vùng slide

**Lát cắt:** Học viên chọn một vùng hình ảnh trên slide, AI Tutor nhận diện và giải thích riêng vùng đó theo ngữ cảnh bài học.

## Chạy thử

```
codebase/web/index.html      ← mở thẳng bằng trình duyệt, chạy được ngay với slide mẫu
```

Muốn dùng **PDF thật** (nút "Mở PDF…") thì phải chạy qua server tĩnh, vì pdf.js cần tải worker:

```bash
npx serve codebase/web
```

## Cấu trúc

```
codebase/
├── README.md
├── .env.example              ← mẫu biến môi trường (KHÔNG commit key thật)
└── web/
    ├── index.html
    ├── css/styles.css
    └── js/
        ├── config.js         ← mọi ngưỡng quyết định nằm ở đây, sửa 1 chỗ
        ├── mock-data.js      ← 3 slide mẫu + toàn bộ câu trả lời mock
        ├── pdf-source.js     ← nguồn slide: MockSource | PdfSource (pdf.js)
        ├── selection.js      ← vẽ slide, khoanh vùng, cắt ảnh, thumbnail
        ├── ai-client.js      ← RANH GIỚI AI — CP3 chỉ sửa file này
        ├── chat-ui.js        ← chat panel, badge, bằng chứng quét, feedback
        └── app.js            ← nối các phần, điều phối một lượt hỏi
```

## Tính năng: quét ảnh khi PDF không đọc được text

Vấn đề: nhiều slide là **ảnh hoặc bản scan**, rút text ra thì rỗng. Tutor hiện tại vẫn trả lời — trả lời chay, không căn cứ. Đây là một phần của con số **46,2% lượt trả lời có `citations` rỗng** trong chatlog.

Cách xử lý trong prototype:

| Bước | Làm gì | Ở đâu |
|---|---|---|
| 1 | Rút text của trang bằng `page.getTextContent()` | [pdf-source.js](web/js/pdf-source.js) |
| 2 | Dưới `MIN_TEXT_CHARS` (30) ký tự → kết luận trang **không có lớp text** | [config.js](web/js/config.js) |
| 3 | Render trang thành ảnh ở `SCAN_MAX_WIDTH` (1536px) | [pdf-source.js](web/js/pdf-source.js) |
| 4 | Gửi **ảnh trọn trang + ảnh vùng khoanh** cho model nhìn | [ai-client.js](web/js/ai-client.js) |
| 5 | Trả lời kèm badge `👁 Đọc bằng quét ảnh trang` + **thumbnail trang đã quét** | [chat-ui.js](web/js/chat-ui.js) |

Ngưỡng ở bước 2 là **định nghĩa kiểm chứng được** — người ngoài nhóm mở cùng file PDF sẽ đếm ra cùng kết quả. Đây là điều kiện để đưa vào golden set.

**Bẫy đã xử lý — số trang lệch.** Số in trên slide ("trang 12") thường lệch với chỉ số trang trong file PDF vì có trang bìa. Quét nhầm trang thì câu trả lời sai hoàn toàn nhưng nghe vẫn trơn tru. Vì vậy mỗi câu trả lời chế độ quét **bắt buộc kèm thumbnail trang đã đọc** + nút *"Không phải trang này?"* để user chỉ lại trang đúng.

**Chặn trước khi quét.** Câu ngoài phạm vi ("làm hộ bài tập") bị guardrail chặn *trước* bước render — không gửi ảnh trọn trang lên model chỉ để nhận về một câu từ chối.

## Trạng thái: CP2 — Mock

| Phần | Trạng thái |
|---|---|
| Đọc PDF, rút text, phát hiện trang không có text layer | ✅ **thật** (pdf.js) |
| Render trang → ảnh · khoanh vùng · cắt ảnh ở độ phân giải gốc | ✅ **thật** |
| Thumbnail trang đã quét, sửa số trang, badge chế độ đọc | ✅ **thật** |
| Guardrail ngoài phạm vi | ✅ **thật** (khớp từ khoá) |
| **Đoạn văn giải thích** | ⚠️ **MOCK** — `MockAI.route()` trong [ai-client.js](web/js/ai-client.js) |
| 3 slide mẫu | ⚠️ MOCK — SVG tự dựng; slide 24 cố tình không có text layer để demo nhánh quét |

**CP3:** hàm `AiClient.callGemini()` đã viết sẵn và đầy đủ trong [ai-client.js](web/js/ai-client.js). Bật bằng nút **API key** trên header (key lưu ở `localStorage`, không commit). Không phải sửa UI hay flow.

## Kịch bản demo

| Đường đi | Cách trigger | Hành vi |
|---|---|---|
| Happy path | Slide 12 → khoanh sơ đồ | Giải thích + trích dẫn `[T02-118]` |
| **Quét ảnh** | Slide 24 (băng vàng báo không có text) → khoanh bảng | Quét trang → trả lời + thumbnail |
| Hỏi qua chat | Gõ `giải thích slide 24` | Nhảy trang, khoanh trọn trang, quét |
| Sai trang | Bấm *"Không phải trang này?"* | Nhập trang khác → đọc lại |
| ② Low-confidence | Khoanh vùng rất nhỏ · hoặc gõ `giải thích cái sơ đồ đó` | Hỏi lại, không đoán |
| ① Không căn cứ | Khoanh vùng trống | Nói rõ không nhận diện được |
| ③ Ngoài phạm vi | Gõ `làm hộ bài tập này` | Từ chối + chỉ sang TA/Discord |
| Correction | *"Giải thích đơn giản hơn"* · 👎 *"Sai chỗ nào?"* | Bản đơn giản · thu feedback |

## Nguyên tắc HAX — vị trí áp dụng cụ thể (cho spec §4b)

| Nguyên tắc | Áp vào đâu |
|---|---|
| **G1** Làm rõ hệ thống làm được gì | Dòng scope ngay header |
| **G2** Làm rõ nó làm tốt đến đâu | Băng trạng thái trang (`📄 đọc được text` / `👁 không có lớp text`) hiện **trước khi** user hỏi + badge chế độ dưới mỗi câu trả lời |
| **G9** Sửa dễ dàng | Nút *"Không phải trang này?"* và *"Giải thích đơn giản hơn"* |
| **G10** Thu hẹp phạm vi khi nghi ngờ | Vùng chọn quá nhỏ → hỏi lại · không nêu số slide → hỏi lại · vùng trống → từ chối |
| **G11** Giải thích vì sao | Thumbnail trang đã quét + chip trích dẫn trang |
| **G15** Mời feedback chi tiết | 👎 kèm *"Sai chỗ nào?"* |

## Luật an toàn

- Không commit API key — key nhập qua nút **API key**, lưu trong `localStorage` của trình duyệt.
- Không commit nguyên slide deck / data pack của khoá vào repo nộp bài. Slide mẫu trong `mock-data.js` là tự dựng.
