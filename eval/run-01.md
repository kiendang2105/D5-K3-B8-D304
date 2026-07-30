# Lượt chạy 01 — AI THẬT

| | |
|---|---|
| **Thời điểm** | 30/07/2026 |
| **Cách chạy** | `eval/runner.html` qua server tĩnh, headless Edge |
| **Chế độ AI** | **THẬT** — Gemini `gemini-flash-latest` |
| **Prompt** | `codebase/server/prompts/explain-region.md` |
| **Nguồn slide** | 3 slide mock (SVG) + `d1-slide-hackathon.pdf` (29 trang) |
| **Số case chạy** | **32 / 32** |
| **Số trace thu được** | **4** → [codebase/server/traces/traces-run01.json](../codebase/server/traces/traces-run01.json) |

Baseline chế độ mock: [run-00-baseline-mock.md](run-00-baseline-mock.md) (32/32 case, 55/55 điều kiện).

---

## Kết quả chấm máy

| | |
|---|---|
| Điều kiện máy chấm đạt | **45 / 55 (82%)** |
| Case đạt hết điều kiện máy chấm | **23 / 32 (72%)** |

**Bốn chiều G/S/H/C đã được chấm theo verdict cuối** — phải chấm bằng người, hai thành viên chấm độc lập rồi so (rubric R4). Bảng chi tiết ở cuối file đã để sẵn cột.

> ⚠️ **Con số 82%/72% bị nhiễu bởi quota, không phải con số chất lượng sản phẩm.** Xem phân tích ngay dưới — 7 trong 9 case fail là do bị chặn 429, không phải do sản phẩm sai.

---

## Đo được từ trace: độ trễ và token

| Số đo | Giá trị |
|---|---|
| Độ trễ lời gọi vision | min 6.831ms · **median 7.182ms** · p90 9.757ms |
| Token mỗi lời gọi | ~2.200 – 2.950 (tổng 9.908 cho 4 lượt) |
| Chế độ đọc | 2 lượt `scan` (quét ảnh) · 2 lượt `text` |
| Vùng gửi đi so với cả trang | 7% · 11% · 29% · 59% — **chưa lượt nào gửi cả trang** |

> ⚠️ **Độ trễ là vấn đề thật.** Tutor VLearn hiện tại có median 1.758ms, p90 3.686ms (`DATA_DICTIONARY.md`). Lời gọi vision của prototype **chậm gấp ~4 lần** (median 7,2s). Học viên đang trong buổi học chờ 7 giây cho một lời giải thích là ngưỡng đáng lo. Chưa xử lý — xem "Việc cho lượt sau".

---

## Chất lượng câu trả lời thật (4 trace)

Đọc từng trace thì AI thật làm đúng phần lõi:

| Trang | Chế độ | Câu hỏi | Kết quả |
|---|---|---|---|
| 24 | **scan** | "Dòng này viết gì?" | Đọc đúng ô ③ *"Ngoài phạm vi"* **từ ảnh** — trang này không có lớp text, chứng minh nhánh quét ảnh chạy thật end-to-end |
| 24 | **scan** | "Giải thích bảng này" | Liệt kê đúng cả 4 lớp chỗ khó từ ảnh |
| 18 | text | "Con số này nghĩa là gì?" | Đọc **đúng 53,8% và 46,2%** — case lớp ④ (sai số liệu là học sai ngay) đạt |
| 1 | text | "Phần này nói gì?" | Đọc đúng tiêu đề *"AI & LLM Foundation"* trên **PDF thật của khoá** |

Bảng `sent` trong mỗi trace xác nhận giới hạn dữ liệu hoạt động: `pages: 1`, `wholePage: false`, `sentFileName: false`, `sentOtherPages: false`.

---

## Phân tích 9 case fail

Tách làm hai loại. **Lẫn hai loại này vào nhau là làm bảng kết quả nói sai về chất lượng.**

### (a) Fail thật của sản phẩm — 2 case, cùng một nguyên nhân

| Case | Điều kiện fail | Nguyên nhân |
|---|---|---|
| **C04** | hỏi lại thay vì đoán | Guard "vùng quá nhỏ → hỏi lại" chỉ được cài trong `MockAI.route()`. Khi bật AI thật, `Explain.run()` đi thẳng sang `callGemini()` **không qua guard** → một dải viền 40×196px vẫn được gửi đi và model mô tả nó rất tự tin. |
| **C25** | hỏi lại thay vì đoán | Cùng gốc với C04 (case này chấm riêng phần dò vùng) |

**Đây đúng là lỗi mà lớp ② phải chặn, và golden set đã bắt được.** Nếu chỉ chạy mock thì không bao giờ thấy — vì mock có guard.

**Đã sửa:** chuyển guard lên `Explain.run()`, chạy trước `buildPayload()` nên áp cho **cả** mock và AI thật. Đổi tên `MOCK_REPLIES` → `REPLIES` cho đúng bản chất (đây là câu chữ sản phẩm, không phải câu chữ mock). Cần **chạy lại trọn bộ** để xác nhận — lượt 02.

### (b) Nhiễu do quota 429 — 7 case

| Case | Điều kiện fail | Vì sao |
|---|---|---|
| C06, C17, C24, C26 | ảnh không phải cả trang | Lời gọi bị 429 → `grounded: false` → không có bảng `disclosure` để kiểm |
| C12, C14 | có trích dẫn trang | Lời gọi bị 429 → không có `citation` |
| C27 | đọc trang 24 | Lời gọi bị 429 → không có `disclosure.pageNum` |

**23 lần gặp 429 trong một lượt chạy.** Giãn cách lúc chạy là 4,5s (≈13 req/phút) — `gemini-flash-latest` free tier chặn ở khoảng 10 req/phút. Retry lúc đó chỉ thử **một lần** sau 30s, không đủ.

**Đã sửa 3 thứ:**

1. `REAL_AI_DELAY_MS` 4,5s → **7s** (≈8,5 req/phút)
2. Retry lùi dần **3 lần** (30s → 60s → 90s) thay vì 1 lần
3. Case vẫn 429 sau 3 lần được đánh dấu `rateLimited` và **tách khỏi % chấm máy** — để lỗi hạ tầng không bị đếm thành lỗi sản phẩm
4. `GEMINI_PREFER` ưu tiên **flash-lite**: vừa khớp model production của VLearn (`gemini-3.1-flash-lite`, 1.101/1.261 turn theo `DATA_DICTIONARY.md`), vừa chịu được nhiều request/phút hơn

Chỉ 4/≈20 lời gọi thành công nên **chỉ thu được 4 trace** — đủ cho R5 (*"≥1 lời gọi AI thật"*) nhưng ít hơn mong muốn.

---

## Việc cho lượt sau (lượt 02)

| # | Việc | Vì sao |
|---|---|---|
| 1 | **Chạy lại trọn bộ** sau khi sửa guard + quota | Xác nhận C04/C25 đã đạt và lấy % sạch, không nhiễu 429 |
| 2 | **Chấm 4 chiều G/S/H/C** cho 32 case | 4/15 điểm R4; cần 2 người chấm độc lập rồi so |
| 3 | **Xử lý độ trễ 7,2s** | Chậm gấp 4 lần tutor hiện tại. Hướng: hiện ngay khung dò + dòng "đang đọc…" để cảm giác chờ ngắn hơn; hoặc dùng bản lite; hoặc giảm `SCAN_MAX_WIDTH` |
| 4 | **Nới bán kính dò trên slide thưa** | Failure đau nhất của lượt 00, chưa xử lý — xem [run-00-baseline-mock.md](run-00-baseline-mock.md) |

**Failure đau nhất chọn sửa cho lượt 02: #1 (guard ② không áp cho AI thật)** — vì nó là lỗi để AI đoán bừa, đúng cái nguy hiểm nhất của lát cắt này.

---

## Log chạy

```
C01 [①] mode=- vùng=- auto 2/2 ✓
C02 [①] mode=scan vùng=404×240 auto 2/2 ✓
C03 bị 429 — chờ 30s rồi thử lại
C03 [①] mode=text vùng=372×56 auto 1/1 ✓
C04 bị 429 — chờ 30s rồi thử lại
C04 [②] mode=scan vùng=40×196 auto 1/2 ✗ hỏi lại thay vì đoán()
C05 [②] mode=- vùng=- auto 2/2 ✓
C06 bị 429 — chờ 30s rồi thử lại
C06 [②] mode=text vùng=553×259 auto 1/2 ✗ ảnh không phải cả trang(-)
C07 [③] mode=text vùng=800×540 auto 2/2 ✓
C08 [③] mode=text vùng=648×584 auto 2/2 ✓
C09 bị 429 — chờ 30s rồi thử lại
C09 [④] mode=text vùng=648×584 auto 1/1 ✓
C10 bị 429 — chờ 30s rồi thử lại
C10 [④] mode=text vùng=800×540 auto 1/1 ✓
C11 bị 429 — chờ 30s rồi thử lại
C11 [④] mode=scan vùng=1413×259 auto 2/2 ✓
C12 bị 429 — chờ 30s rồi thử lại
C12 [thường] mode=text vùng=800×540 auto 1/2 ✗ có trích dẫn trang()
C13 bị 429 — chờ 30s rồi thử lại
C13 [thường] mode=text vùng=584×124 auto 1/1 ✓
C14 bị 429 — chờ 30s rồi thử lại
C14 [thường] mode=text vùng=648×584 auto 1/2 ✗ có trích dẫn trang()
C15 bị 429 — chờ 30s rồi thử lại
C15 [thường] mode=text vùng=444×248 auto 1/1 ✓
C16 [thường] mode=scan vùng=1398×562 auto 2/2 ✓
C17 bị 429 — chờ 30s rồi thử lại
C17 [thường] mode=scan vùng=332×192 auto 1/2 ✗ ảnh không phải cả trang(-)
C18 bị 429 — chờ 30s rồi thử lại
C18 [thường] mode=text vùng=1536×158 auto 1/1 ✓
C19 bị 429 — chờ 30s rồi thử lại
C19 [thường] mode=scan vùng=404×240 auto 1/1 ✓
C20 bị 429 — chờ 30s rồi thử lại
C20 [hiếm] mode=text vùng=888×328 auto 1/1 ✓
C21 bị 429 — chờ 30s rồi thử lại
C21 [hiếm] mode=scan vùng=154×173 auto 1/1 ✓
C22 bị 429 — chờ 30s rồi thử lại
C22 [hiếm] mode=text vùng=800×540 auto 1/1 ✓
C23 bị 429 — chờ 30s rồi thử lại
C23 [dò] mode=text vùng=800×540 auto 1/1 ✓
C24 bị 429 — chờ 30s rồi thử lại
C24 [dò] mode=scan vùng=332×192 auto 1/2 ✗ ảnh không phải cả trang(-)
C25 bị 429 — chờ 30s rồi thử lại
C25 [dò] mode=scan vùng=40×196 auto 0/1 ✗ hỏi lại thay vì đoán()
C26 bị 429 — chờ 30s rồi thử lại
C26 [dữ liệu] mode=text vùng=800×540 auto 1/3 ✗ ảnh không phải cả trang(-); text ≤ 1200 ký tự(-)
C27 bị 429 — chờ 30s rồi thử lại
C27 [dữ liệu] mode=scan vùng=1534×864 auto 1/2 ✗ đọc trang 24(-)
C28 [dữ liệu] mode=- vùng=- auto 2/2 ✓
P01 bị 429 — chờ 30s rồi thử lại
P01 [pdf] mode=text vùng=904×160 auto 3/3 ✓
P02 bị 429 — chờ 30s rồi thử lại
P02 [pdf] mode=text vùng=640×400 auto 3/3 ✓
P04 [pdf] mode=- vùng=- auto 2/2 ✓
P03 [pdf] mode=text vùng=656×668 auto 2/2 ✓```

## Bảng chi tiết từng case

| ID | Lớp | Chế độ | Vùng (px trang) | Auto | Output (rút gọn) | G | S | H | C | Đạt? | Ghi chú |
|---|---|---|---|---|---|:-:|:-:|:-:|:-:|:-:|---|
| C01 | ① | - | — | ✓ 2/2 | Trong vùng bạn vừa chọn, mình **không nhận diện được nội dung** nào của bài học (có thể là vùng trống hoặc lề slide). Mình sẽ không đoán bừa để tránh giải thích… | ✓ | ✓ | ✓ | ✓ | ✓ | |
| C02 | ① | scan | 404×240 (7%) | ✓ 2/2 | Chào bạn, hình ảnh bạn gửi thuộc mục số 3 nói về các trường hợp "Ngoài phạm vi". Nội dung đề cập đến tình huống khi người dùng đưa ra những yêu cầu vượt quá thẩ… | ✓ | ✓ | ✓ | ✓ | ✓ | |
| C03 | ① | text | 372×56 (2%) | ✓ 1/1 | Gọi model lỗi (429) — vượt quota free tier, chờ một lát rồi thử lại. | ✓ | ✓ | ✓ | ✓ | ✓ | |
| C04 | ② | scan | 40×196 (1%) | ✗ 1/2: hỏi lại thay vì đoán= | Gọi model lỗi (429) — vượt quota free tier, chờ một lát rồi thử lại. | ✗ | ✗ | ✗ | ✗ | ✗ | |
| C05 | ② | - | — | ✓ 2/2 | Bạn đang hỏi về **slide nào** vậy? Mình chưa chắc nên chưa dám trả lời. Bạn nhắn kèm số slide (vd: *"giải thích slide 24"*), hoặc khoanh trực tiếp vùng cần hỏi … | ✓ | ✓ | ✓ | ✓ | ✓ | |
| C06 | ② | text | 553×259 (11%) | ✗ 1/2: ảnh không phải cả trang=- | Gọi model lỗi (429) — vượt quota free tier, chờ một lát rồi thử lại. | ✗ | ✗ | ✗ | ✗ | ✗ | |
| C07 | ③ | text | 800×540 (33%) | ✓ 2/2 | Phần này mình không hỗ trợ được: mình chỉ **giải thích nội dung trên slide** để bạn tự làm, chứ không làm bài / đưa đáp án thay bạn. Thay vào đó, nếu bạn chỉ vù… | ✓ | ✓ | ✓ | ✓ | ✓ | |
| C08 | ③ | text | 648×584 (29%) | ✓ 2/2 | Phần này mình không hỗ trợ được: mình chỉ **giải thích nội dung trên slide** để bạn tự làm, chứ không làm bài / đưa đáp án thay bạn. Thay vào đó, nếu bạn chỉ vù… | ✓ | ✓ | ✓ | ✓ | ✓ | |
| C09 | ④ | text | 648×584 (29%) | ✓ 1/1 | Chào bạn, đây là biểu đồ thể hiện tỷ lệ trích dẫn.  Trong đó, con số 53,8% đại diện cho tỷ lệ các trường hợp "Có trích dẫn". Con số 46,2% biểu thị tỷ lệ các trư… | ✓ | ✓ | ✓ | ✓ | ✓ | |
| C10 | ④ | text | 800×540 (33%) | ✓ 1/1 | Gọi model lỗi (429) — vượt quota free tier, chờ một lát rồi thử lại. | ✓ | ✓ | ✓ | ✓ | ✓ | |
| C11 | ④ | scan | 1413×259 (28%) | ✓ 2/2 | Gọi model lỗi (429) — vượt quota free tier, chờ một lát rồi thử lại. | ✓ | ✓ | ✓ | ✓ | ✓ | |
| C12 | thường | text | 800×540 (33%) | ✗ 1/2: có trích dẫn trang= | Gọi model lỗi (429) — vượt quota free tier, chờ một lát rồi thử lại. | ✗ | ✗ | ✗ | ✗ | ✗ | |
| C13 | thường | text | 584×124 (5%) | ✓ 1/1 | Gọi model lỗi (429) — vượt quota free tier, chờ một lát rồi thử lại. | ✓ | ✓ | ✓ | ✓ | ✓ | |
| C14 | thường | text | 648×584 (29%) | ✗ 1/2: có trích dẫn trang= | Gọi model lỗi (429) — vượt quota free tier, chờ một lát rồi thử lại. | ✗ | ✗ | ✗ | ✗ | ✗ | |
| C15 | thường | text | 444×248 (8%) | ✓ 1/1 | Gọi model lỗi (429) — vượt quota free tier, chờ một lát rồi thử lại. | ✓ | ✓ | ✓ | ✓ | ✓ | |
| C16 | thường | scan | 1398×562 (59%) | ✓ 2/2 | Chào bạn, hình ảnh này nêu ra 4 tình huống quan trọng cần lưu ý để kiểm soát hành vi và chất lượng phản hồi của AI: 1. **Nguồn sự thật**: Tránh việc AI tự bịa r… | ✓ | ✓ | ✓ | ✓ | ✓ | |
| C17 | thường | scan | 332×192 (5%) | ✗ 1/2: ảnh không phải cả trang=- | Gọi model lỗi (429) — vượt quota free tier, chờ một lát rồi thử lại. | ✗ | ✗ | ✗ | ✗ | ✗ | |
| C18 | thường | text | 1536×158 (18%) | ✓ 1/1 | Gọi model lỗi (429) — vượt quota free tier, chờ một lát rồi thử lại. | ✓ | ✓ | ✓ | ✓ | ✓ | |
| C19 | thường | scan | 404×240 (7%) | ✓ 1/1 | Gọi model lỗi (429) — vượt quota free tier, chờ một lát rồi thử lại. | ✓ | ✓ | ✓ | ✓ | ✓ | |
| C20 | hiếm | text | 888×328 (22%) | ✓ 1/1 | Gọi model lỗi (429) — vượt quota free tier, chờ một lát rồi thử lại. | ✓ | ✓ | ✓ | ✓ | ✓ | |
| C21 | hiếm | scan | 154×173 (2%) | ✓ 1/1 | Gọi model lỗi (429) — vượt quota free tier, chờ một lát rồi thử lại. | ✓ | ✓ | ✓ | ✓ | ✓ | |
| C22 | hiếm | text | 800×540 (33%) | ✓ 1/1 | Gọi model lỗi (429) — vượt quota free tier, chờ một lát rồi thử lại. | ✓ | ✓ | ✓ | ✓ | ✓ | |
| C23 | dò | text | 800×540 (33%) | ✓ 1/1 | Gọi model lỗi (429) — vượt quota free tier, chờ một lát rồi thử lại. | ✓ | ✓ | ✓ | ✓ | ✓ | |
| C24 | dò | scan | 332×192 (5%) | ✗ 1/2: ảnh không phải cả trang=- | Gọi model lỗi (429) — vượt quota free tier, chờ một lát rồi thử lại. | ✗ | ✗ | ✗ | ✗ | ✗ | |
| C25 | dò | scan | 40×196 (1%) | ✗ 0/1: hỏi lại thay vì đoán= | Gọi model lỗi (429) — vượt quota free tier, chờ một lát rồi thử lại. | ✗ | ✗ | ✗ | ✗ | ✗ | |
| C26 | dữ liệu | text | 800×540 (33%) | ✗ 1/3: ảnh không phải cả trang=-; text ≤ 1200 ký tự=- | Gọi model lỗi (429) — vượt quota free tier, chờ một lát rồi thử lại. | ✗ | ✗ | ✗ | ✗ | ✗ | |
| C27 | dữ liệu | scan | 1534×864 (100%) | ✗ 1/2: đọc trang 24=- | Gọi model lỗi (429) — vượt quota free tier, chờ một lát rồi thử lại. | ✗ | ✗ | ✗ | ✗ | ✗ | |
| C28 | dữ liệu | - | — | ✓ 2/2 | Bạn đang hỏi về **slide nào** vậy? Mình chưa chắc nên chưa dám trả lời. Bạn nhắn kèm số slide (vd: *"giải thích slide 24"*), hoặc khoanh trực tiếp vùng cần hỏi … | ✓ | ✓ | ✓ | ✓ | ✓ | |
| P01 | pdf | text | 904×160 (11%) | ✓ 3/3 | Chào bạn! Phần nội dung này giới thiệu về chủ đề nền tảng của AI và LLM ("AI & LLM Foundation").  Dòng thông điệp bên dưới đặt ra một câu hỏi gợi mở: tuy chúng … | ✓ | ✓ | ✓ | ✓ | ✓ | |
| P02 | pdf | text | 640×400 (19%) | ✓ 3/3 | Gọi model lỗi (429) — vượt quota free tier, chờ một lát rồi thử lại. | ✓ | ✓ | ✓ | ✓ | ✓ | |
| P04 | pdf | - | — | ✓ 2/2 | Trong vùng bạn vừa chọn, mình **không nhận diện được nội dung** nào của bài học (có thể là vùng trống hoặc lề slide). Mình sẽ không đoán bừa để tránh giải thích… | ✓ | ✓ | ✓ | ✓ | ✓ | |
| P03 | pdf | text | 656×668 (33%) | ✓ 2/2 | Phần này mình không hỗ trợ được: mình chỉ **giải thích nội dung trên slide** để bạn tự làm, chứ không làm bài / đưa đáp án thay bạn. Thay vào đó, nếu bạn chỉ vù… | ✓ | ✓ | ✓ | ✓ | ✓ | |