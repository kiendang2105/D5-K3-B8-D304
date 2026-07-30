# Codebase — AI Tutor giải thích vùng slide

**Lát cắt:** Học viên chọn một vùng hình ảnh trên slide, AI Tutor nhận diện và giải thích riêng vùng đó theo ngữ cảnh bài học.

## Chạy thử

```
codebase/web/index.html      ← mở thẳng bằng trình duyệt: chạy ngay với slide mẫu
```

Đủ để demo toàn bộ 4 đường đi trải nghiệm + nhánh quét ảnh. **Mở PDF thật** và **gọi AI thật** cần chạy qua server tĩnh (Worker của pdf.js không tạo được từ `file://`; prompt nạp bằng fetch):

```bash
npx serve .            # hoặc: python -m http.server 8765   (chạy từ GỐC REPO)
# app:    http://localhost:PORT/codebase/web/index.html
# runner: http://localhost:PORT/eval/runner.html
```

*(Serve từ gốc repo vì app và runner đều đọc `data/vlearn-pack/slides/*.pdf`.)*

**Slide deck có sẵn:** header có nút **Slide buổi 1** / **Slide buổi 2** — bấm là mở luôn deck trong data pack, không phải tự chọn file. Nút **Mở PDF khác…** dành cho file ngoài. Data pack không được commit (`.gitignore`) nên máy mới clone sẽ chưa có hai deck đó; nút sẽ báo rõ thay vì lỗi im lặng.

## Bật AI thật (CP3)

1. Lấy key ở [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
2. Bấm **API key** trên header, dán key.
3. App gọi `ListModels` để xem key đó dùng được model nào rồi **tự chọn** — không hardcode tên model (đoán sai tên là nhận 404 giữa lúc demo). Badge đổi thành `CP3 · AI THẬT · <tên model>`.

   Thứ tự ưu tiên đặt **flash-lite lên đầu** (`GEMINI_PREFER`), vì VLearn production chạy `gemini-3.1-flash-lite` (1.101/1.261 turn theo `DATA_DICTIONARY.md`) — đo prototype trên cùng model thì kết quả mới nói được gì về sản phẩm thật. Bản lite cũng chịu được nhiều request/phút hơn: chạy trọn bộ 32 case trên `2.5-flash` bị 429 liên tục.
4. Đổi model thủ công: `localStorage.setItem("GEMINI_MODEL","<tên>")` trong Console rồi tải lại.

Key lưu trong `localStorage` của trình duyệt, **không bao giờ vào repo**. Mỗi lời gọi in `[AI TRACE]` ra Console và cộng vào `Explain.traces` — runner tải xuống thành `traces.json` cho `server/traces/`.

**Quota free tier là ràng buộc thật, không phải chi tiết nhỏ.** Đo trên `gemini-2.5-flash`: giãn 4,5s giữa các call (≈13 req/phút) vẫn ăn **429 ở 12/32 case**. Vì vậy:

- `REAL_AI_DELAY_MS` = 7s (≈8,5 req/phút)
- Runner tự lùi dần và thử lại tối đa 3 lần (30s → 60s → 90s)
- Case vẫn 429 sau 3 lần được đánh dấu `rateLimited` và **tách khỏi % chấm máy** — lỗi hạ tầng không được lẫn vào lỗi sản phẩm, nếu không thì bảng kết quả nói sai về chất lượng

Demo tại CP6 chỉ chạy vài case nên không lo; chạy trọn bộ golden set thì nên dùng bản `flash-lite`.

## Cấu trúc

```
codebase/
├── README.md
├── .env.example                  ← mẫu biến môi trường (KHÔNG commit key thật)
├── web/
│   ├── index.html
│   ├── app.js                    ← điều phối một lượt hỏi, nối các phần
│   ├── css/styles.css
│   ├── components/
│   │   ├── SlideViewer.js        ← render trang vào canvas, letterbox, thumbnail
│   │   ├── RegionSelector.js     ← CLICK (tự dò) hoặc KÉO (khoanh tay) → vùng
│   │   └── ExplainPanel.js       ← chat, badge chế độ đọc, bằng chứng, 🔒 công khai dữ liệu
│   └── lib/
│       ├── config.js             ← mọi ngưỡng quyết định + GIỚI HẠN DỮ LIỆU
│       ├── mock-data.js          ← 3 slide mẫu + toàn bộ câu trả lời mock
│       ├── pdf-source.js         ← nguồn slide: MockSource | PdfSource (pdf.js)
│       ├── content-detector.js   ← dò khối nội dung tại chỗ bấm + cắt ảnh vùng
│       └── mock-ai.js            ← router mock (CP2)
│   └── vendor/                   ← pdf.js 3.11.174 để local (xem ghi chú dưới)
└── server/
    ├── explain.js                ← QUYẾT ĐỊNH AI TRUNG TÂM — CP3 chỉ sửa file này
    ├── prompts/
    │   └── explain-region.md     ← prompt tách riêng, sửa không cần đụng code
    └── traces/                   ← log request/response của AI call thật [R5]
```

**Vì sao `server/` chạy ở client:** mức prototype là Mock nên `explain.js` được nạp thẳng vào trang, không dựng backend riêng. Khi tách backend thật, đem nguyên hàm `callGemini()` sang server và đổi `fetch` trong `Explain.run()` — giao diện không đổi.

**Vì sao vendor pdf.js thay vì dùng CDN:** Chrome/Edge chặn tạo `Worker` từ URL khác origin, và pdf.js **treo** (không resolve, không reject) khi worker không init được — đã gặp thật khi thử CDN. Để local thì worker cùng origin, và demo tại CP6 không phụ thuộc mạng.

## Tính năng: click một phát là nhận diện được vùng

Học viên không phải kéo khung cho khéo — bấm vào sơ đồ thì hệ thống tự tìm ranh giới của chính khối đó. Đúng với chữ *"AI tự nhận diện"* trong lát cắt.

Thuật toán trong [content-detector.js](web/lib/content-detector.js), chạy hoàn toàn trên máy học viên:

| Bước | Làm gì |
|---|---|
| 1 | Thu nhỏ trang thành lưới ô 4px, lấy độ sáng từng ô |
| 2 | So từng ô với **độ sáng nền cục bộ** (làm mờ hộp bán kính 8 ô) — lệch > 18 thì coi là có nội dung |
| 3 | Nới các ô có nội dung ra 2 ô để chữ rời rạc dính thành khối |
| 4 | Loang từ ô được bấm qua các ô liền nhau → lấy hộp bao |

**Vì sao dùng nền cục bộ chứ không phải một màu nền cho cả trang:** slide scan có giấy ngả vàng và vệt sáng loang. So với một màu cố định thì hoặc bắt nhầm cả trang, hoặc bỏ sót nội dung ở vùng tối. Đo thực tế: ngưỡng tuyệt đối cho ink coverage 37–52% (mọi thứ dính thành một khối); ngưỡng thích ứng cho 15–18% và khoanh đúng khối.

Hai chốt chặn:

- **Bấm vào khe giữa hai dòng chữ trong cùng một hộp** — hút về khối gần nhất trong bán kính 12 ô, thay vì bắt học viên bấm chính xác vào nét chữ.
- **Bấm vào chỗ trống hẳn** → không dò được → đi nhánh ① *"không nhận diện được nội dung"*, **không đoán**.
- **Dò ra một dải mảnh** (bấm vào khe hẹp giữa hai hộp) → dưới 1% diện tích trang → đi nhánh ② *hỏi lại*.

Kéo chuột khoanh tay vẫn giữ, làm đường sửa khi máy dò không đúng ý (G9).

**Hạn chế đã biết:** với hộp có viền nhạt trên nền beige (slide scan), khung dò được thường nhỏ hơn hộp thật — bắt được chữ bên trong nhưng không trọn viền. Vẫn đủ để trả lời đúng, nhưng khung nhìn chưa khớp hoàn hảo.

## Không rời slide đang đọc khi hỏi về slide khác

Gõ *"giải thích slide 24"* khi đang xem slide 12: hệ thống **không** kéo học viên sang slide 24. Trang 24 chỉ được nạp ngầm để đọc; câu trả lời kèm thumbnail trang 24 làm bằng chứng và nút **"↪ Đi tới slide 24"** để họ tự quyết định có chuyển hay không.

Lý do: học viên đang đọc dở một slide, bị nhảy đi là mất chỗ. Và bằng chứng thumbnail đã đủ để họ kiểm tra hệ thống đọc đúng trang.

## Giới hạn dữ liệu — AI Tutor không đọc cả tài liệu

Ràng buộc cứng, khai ở đầu [config.js](web/lib/config.js):

| # | Giới hạn | Thực thi ở đâu |
|---|---|---|
| 1 | Tối đa **1 trang** cho một câu hỏi | `MAX_PAGES_PER_REQUEST` · `PdfSource.getPage()` chỉ nạp đúng trang được hỏi |
| 2 | Ảnh gửi đi là **ảnh vùng đã cắt**, không phải ảnh cả trang | `Explain.buildPayload()` |
| 3 | Text chỉ lấy các đoạn **nằm trong vùng chọn + lề 24px**, trần 1200 ký tự | `Explain.buildPayload()` — dùng vị trí từng đoạn text do pdf.js trả về |
| 4 | Không gửi tên file, tổng số trang, nội dung trang khác | `Explain.buildPayload()` |
| 5 | Câu ngoài phạm vi bị chặn **trước** khi đóng gói → không có gì rời máy | `Explain.run()` |
| 6 | Mỗi câu trả lời kèm bảng **🔒 Đã gửi đi những gì** | `ExplainPanel.addDisclosure()` |

`Explain.buildPayload()` là **chỗ duy nhất** dữ liệu rời khỏi máy học viên — soát hàm đó là soát được toàn bộ đường dữ liệu đi ra. File PDF nằm nguyên trong trình duyệt, không upload đi đâu.

## Tính năng: quét ảnh khi PDF không đọc được text

Vấn đề: nhiều slide là **ảnh hoặc bản scan**, rút text ra thì rỗng. Tutor hiện tại vẫn trả lời — trả lời chay, không căn cứ. Đây là một phần của con số **46,2% lượt trả lời có `citations` rỗng** trong chatlog.

Cách xử lý trong prototype:

| Bước | Làm gì | Ở đâu |
|---|---|---|
| 1 | Rút text của trang bằng `page.getTextContent()` | [pdf-source.js](web/lib/pdf-source.js) |
| 2 | Dưới `MIN_TEXT_CHARS` (30) ký tự → kết luận trang **không có lớp text** | [config.js](web/lib/config.js) |
| 3 | Render trang thành ảnh ở `SCAN_MAX_WIDTH` (1536px) | [pdf-source.js](web/lib/pdf-source.js) |
| 4 | Cắt **đúng vùng học viên chọn** ra ảnh, gửi cho model nhìn | [server/explain.js](server/explain.js) |
| 5 | Trả lời kèm badge `👁 Đọc bằng quét ảnh vùng` + **thumbnail trang đã đọc** | [ExplainPanel.js](web/components/ExplainPanel.js) |

Ngưỡng ở bước 2 là **định nghĩa kiểm chứng được** — người ngoài nhóm mở cùng file PDF sẽ đếm ra cùng kết quả. Đây là điều kiện để đưa vào golden set.

**Bẫy đã xử lý — số trang lệch.** Số in trên slide ("trang 12") thường lệch với chỉ số trang trong file PDF vì có trang bìa. Đọc nhầm trang thì câu trả lời sai hoàn toàn nhưng nghe vẫn trơn tru. Vì vậy mỗi câu trả lời chế độ quét **bắt buộc kèm thumbnail trang đã đọc** + nút *"Không phải trang này?"*.

**Chặn trước khi đóng gói.** Câu ngoài phạm vi ("làm hộ bài tập") bị guardrail chặn *trước* `buildPayload()` — không có dữ liệu nào rời máy chỉ để nhận về một câu từ chối. Giao diện nói rõ điều đó.

## Trạng thái: CP2 — Mock

| Phần | Trạng thái |
|---|---|
| Đọc PDF, rút text + vị trí từng đoạn, phát hiện trang không có text layer | ✅ **thật** (pdf.js) |
| **Click nhận diện khối nội dung** (ngưỡng thích ứng + loang + hút khối gần nhất) | ✅ **thật** |
| Kéo khoanh tay · cắt ảnh vùng ở độ phân giải gốc của trang | ✅ **thật** |
| Đọc trang khác không rời màn hình · thumbnail · sửa số trang · badge chế độ | ✅ **thật** |
| Giới hạn dữ liệu + bảng 🔒 công khai đã gửi gì | ✅ **thật** |
| Guardrail ngoài phạm vi | ✅ **thật** (khớp từ khoá) |
| **Đoạn văn giải thích** | ⚠️ **MOCK** — `MockAI.route()` trong [web/lib/mock-ai.js](web/lib/mock-ai.js) |
| 3 slide mẫu | ⚠️ MOCK — SVG tự dựng; slide 24 cố tình không có text layer để demo nhánh quét |

**CP3:** hàm `Explain.callGemini()` đã viết sẵn và đầy đủ trong [server/explain.js](server/explain.js). Bật bằng nút **API key** trên header (key lưu ở `localStorage`, không commit). Không phải sửa UI hay flow.

## Kịch bản demo

| Đường đi | Cách trigger | Hành vi |
|---|---|---|
| **Click nhận diện** | Slide 12 → **bấm một phát** vào sơ đồ | Tự khoanh trọn sơ đồ → giải thích + trích dẫn `[T02-118]` |
| **Quét ảnh** | Slide 24 (băng vàng) → bấm vào ô ① | Quét ảnh vùng đó → trả lời + thumbnail trang |
| **Hỏi slide khác, không rời chỗ** | Đang ở Slide 12, gõ `giải thích slide 24` | Trả lời về slide 24, **màn hình vẫn ở 12**, kèm nút "↪ Đi tới slide 24" |
| **Giới hạn dữ liệu** | Mở `🔒 Đã gửi đi…` dưới câu trả lời | Liệt kê đúng 1 ảnh vùng + text trong vùng + 1 trang |
| Sai trang | Bấm *"Không phải trang này?"* | Nhập trang khác → đọc lại |
| ② Low-confidence | Bấm vào khe hẹp giữa 2 hộp · hoặc gõ `giải thích cái sơ đồ đó` | Hỏi lại, không đoán |
| ① Không căn cứ | Bấm vào vùng trống hẳn | Nói rõ không nhận diện được |
| ③ Ngoài phạm vi | Gõ `làm hộ bài tập này` | Từ chối + **không gửi gì ra ngoài** |
| Correction | **Kéo chuột** khoanh tay · *"Giải thích đơn giản hơn"* · 👎 *"Sai chỗ nào?"* | Chọn lại · bản đơn giản · thu feedback |

## Nguyên tắc HAX — vị trí áp dụng cụ thể (cho spec §4b)

| Nguyên tắc | Áp vào đâu |
|---|---|
| **G1** Làm rõ hệ thống làm được gì | Dòng scope ngay header |
| **G2** Làm rõ nó làm tốt đến đâu | Băng trạng thái trang (`📄 đọc được text` / `👁 không có lớp text`) hiện **trước khi** user hỏi + badge chế độ dưới mỗi câu trả lời |
| **G8** Gạt bỏ dễ dàng | Click ra chỗ khác là đổi vùng chọn; không có bước nào chặn flow chờ AI |
| **G9** Sửa dễ dàng | **Kéo khoanh tay** khi máy dò không đúng ý · *"Không phải trang này?"* · *"Giải thích đơn giản hơn"* |
| **G10** Thu hẹp phạm vi khi nghi ngờ | Bấm chỗ trống → không đoán · dò ra dải mảnh → hỏi lại · không nêu số slide → hỏi lại |
| **G11** Giải thích vì sao | Khung dò hiện ngay trên slide (thấy máy hiểu vùng nào) · thumbnail trang đã đọc · chip trích dẫn |
| **G15** Mời feedback chi tiết | 👎 kèm *"Sai chỗ nào?"* |
| **G17** Quyền kiểm soát tổng | Bảng 🔒 công khai dữ liệu đã gửi · trang được hỏi không tự chuyển màn hình, học viên tự bấm "Đi tới" |

## Luật an toàn

- Không commit API key — key nhập qua nút **API key**, lưu trong `localStorage` của trình duyệt.
- Không commit nguyên slide deck / data pack của khoá vào repo nộp bài. Slide mẫu trong `mock-data.js` là tự dựng.
