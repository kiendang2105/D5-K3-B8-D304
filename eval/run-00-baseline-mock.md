# Lượt chạy 00 — baseline MOCK

> **Chế độ: MOCK — chưa gọi AI thật.** Lượt này chạy để (a) kiểm tra bộ chạy tự động
> hoạt động, (b) chốt baseline cho các điều kiện **máy chấm được**, (c) khảo sát lớp
> text của slide deck thật. **Chưa dùng cho R4** — R4 cần lượt chạy với AI thật
> (xem `run-01.md`).

| | |
|---|---|
| Thời điểm | 2026-07-30 |
| Cách chạy | `eval/runner.html` qua server tĩnh, headless Edge |
| Nguồn slide | 3 slide mock (SVG) + `d1-slide-hackathon.pdf` (29 trang) |
| Chế độ AI | **MOCK** (`MockAI.route()`) |
| Số case chạy | 32 / 32 |

## Kết quả chấm máy

| | |
|---|---|
| Điều kiện máy chấm đạt | **55 / 55 (100%)** |
| Case đạt hết điều kiện máy chấm | **32 / 32 (100%)** |
| Traces AI thật | 0 (đang mock) |

**Bốn chiều G/S/H/C để trống** — phải chấm bằng người, hai thành viên chấm độc lập rồi so (rubric R4).

## Khảo sát lớp text của slide deck thật

| Deck | Số trang | Trang phải quét ảnh | Ký tự text/trang (min–max) |
|---|---|---|---|
| `d1-slide-hackathon.pdf` | 29 | **0 (0%)** | 145 – 1032 |
| `d2-slide-hackathon.pdf` | 29 | **0 (0%)** | 132 – 1331 |

Ngưỡng `MIN_TEXT_CHARS = 30`.

> ⚠️ **Phát hiện đáng chú ý:** cả hai slide deck được cấp đều **có lớp text ở mọi trang**.
> Nghĩa là nhánh "quét ảnh khi PDF không đọc được text" **không kích hoạt được trên
> tài liệu thật của khoá** — hiện chỉ demo được bằng slide mock 24 (cố ý dựng không
> có lớp text). Xem phần "Việc phải quyết" bên dưới.

## Điều kiện máy chấm bị FAIL

Lượt đầu: **1 fail / 52** — case `P02` không dò được vùng. Truy ra là **lỗi của test case, không phải của code**: điểm click (0,50 · 0,50) rơi vào khoảng trắng giữa trang 2; hành vi "không đoán" là đúng.

Đã sửa toạ độ `P02` sang (0,25 · 0,50) — đo được là trúng khối nội dung — và **thêm case `P04`** bấm vào khoảng trắng của slide thật để chốt lại hành vi ① (trước đó không có case nào khẳng định điều này trên PDF thật).

Chạy lại trọn bộ sau khi sửa: **55/55 điều kiện đạt, 32/32 case đạt** (bảng dưới là lượt sau khi sửa).

## Đo thêm: tỉ lệ dò trúng trên slide thật

Dò tại 15 điểm (3 cột × 5 hàng) trên mỗi trang:

| Trang d1 | Mật độ nội dung (ink) | Dò trúng | Hộp bao nội dung |
|---|---|---|---|
| 1 | 4,2% | **3 / 15** | 888×328 trên trang 1536×864 |
| 2 | 6,1% | **4 / 15** | 652×732 |
| 3 | 22,7% | **15 / 15** | 1464×808 |

> ⚠️ **Đây là failure đau nhất của lượt này.** Slide thật có rất nhiều khoảng trắng;
> bán kính hút khối gần nhất hiện tại (`DETECT_SNAP_CELLS = 12` ô = 48px trang ≈ 30px
> hiển thị) quá nhỏ so với khoảng cách giữa các khối trên slide thưa. Học viên bấm
> vào khoảng trắng sẽ nhận "không nhận diện được" thường xuyên hơn mức chấp nhận được.
>
> **Không tự nới bán kính** vì nới rộng sẽ phá case C01 (bấm vào vùng trống hẳn phải
> đi nhánh ①, không được hút bừa sang khối cách đó cả trăm pixel). Hướng sửa đề xuất
> cho lượt sau: hai mức — gần thì trả lời luôn, xa thì **hỏi lại "bạn muốn hỏi khối
> này?"** kèm khung dò, quá xa thì nhánh ①. Đây là G10, không phải nới ngưỡng.

## Việc phải quyết (không phải quyết định của một người)

1. **Nhánh quét ảnh không có dữ liệu thật để demo.** Ba lựa chọn: (a) giữ slide mock 24
   làm case demo và khai rõ là mock; (b) tự tạo một trang PDF dạng ảnh (export 1 slide
   thành PNG rồi đóng lại thành PDF) để có case thật; (c) hạ trọng số nhánh quét ảnh,
   tập trung vào giải thích vùng. **Ảnh hưởng tới spec §1**: câu "một phần của 46,2%
   lượt trả lời không trích dẫn là do slide dạng ảnh" **chưa có bằng chứng** trên hai
   deck này — phải sửa hoặc bỏ.
2. **Bán kính hút khối** — theo hướng hai mức ở trên.

## Log chạy

```
C01 [①] mode=- vùng=- auto 2/2 ✓
C02 [①] mode=scan vùng=404×240 auto 2/2 ✓
C03 [①] mode=text vùng=372×56 auto 1/1 ✓
C04 [②] mode=scan vùng=40×196 auto 2/2 ✓
C05 [②] mode=- vùng=- auto 2/2 ✓
C06 [②] mode=text vùng=553×259 auto 2/2 ✓
C07 [③] mode=text vùng=800×540 auto 2/2 ✓
C08 [③] mode=text vùng=648×584 auto 2/2 ✓
C09 [④] mode=text vùng=648×584 auto 1/1 ✓
C10 [④] mode=text vùng=800×540 auto 1/1 ✓
C11 [④] mode=scan vùng=1413×259 auto 2/2 ✓
C12 [thường] mode=text vùng=800×540 auto 2/2 ✓
C13 [thường] mode=text vùng=584×124 auto 1/1 ✓
C14 [thường] mode=text vùng=648×584 auto 2/2 ✓
C15 [thường] mode=text vùng=444×248 auto 1/1 ✓
C16 [thường] mode=scan vùng=1398×562 auto 2/2 ✓
C17 [thường] mode=scan vùng=332×192 auto 2/2 ✓
C18 [thường] mode=text vùng=1536×158 auto 1/1 ✓
C19 [thường] mode=scan vùng=404×240 auto 1/1 ✓
C20 [hiếm] mode=text vùng=888×328 auto 1/1 ✓
C21 [hiếm] mode=scan vùng=154×173 auto 1/1 ✓
C22 [hiếm] mode=text vùng=800×540 auto 1/1 ✓
C23 [dò] mode=text vùng=800×540 auto 1/1 ✓
C24 [dò] mode=scan vùng=332×192 auto 2/2 ✓
C25 [dò] mode=scan vùng=40×196 auto 1/1 ✓
C26 [dữ liệu] mode=text vùng=800×540 auto 3/3 ✓
C27 [dữ liệu] mode=scan vùng=1534×864 auto 2/2 ✓
C28 [dữ liệu] mode=- vùng=- auto 2/2 ✓
P01 [pdf] mode=text vùng=904×160 auto 3/3 ✓
P02 [pdf] mode=text vùng=640×400 auto 3/3 ✓
P04 [pdf] mode=- vùng=- auto 2/2 ✓
P03 [pdf] mode=text vùng=656×668 auto 2/2 ✓```

## Bảng chi tiết từng case

| ID | Lớp | Chế độ | Vùng (px trang) | Auto | Output (rút gọn) | G | S | H | C | Đạt? | Ghi chú |
|---|---|---|---|---|---|:-:|:-:|:-:|:-:|:-:|---|
| C01 | ① | - | — | ✓ 2/2 | Trong vùng bạn vừa chọn, mình **không nhận diện được nội dung** nào của bài học (có thể là vùng trống hoặc lề slide). Mình sẽ không đoán bừa để tránh giải thích… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C02 | ① | scan | 404×240 (7%) | ✓ 2/2 | Trang này trong tài liệu là **ảnh chụp/scan, không có lớp text** — mình đã đọc bằng cách quét ảnh vùng bạn chọn. Bảng bạn chọn chia rủi ro của một tính năng AI … | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C03 | ① | text | 372×56 (2%) | ✓ 1/1 | Ô chú thích bạn chọn nêu **hậu quả của việc thiếu trích dẫn**: khi tutor không dẫn trang, học viên rơi vào một trong hai tình huống — *tin luôn* (rủi ro học sai… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C04 | ② | scan | 40×196 (1%) | ✓ 2/2 | Vùng bạn chọn hơi nhỏ, mình **chưa chắc** bạn đang muốn hỏi phần nào 🤔 Bạn kéo chọn rộng ra một chút — trọn sơ đồ hoặc trọn đoạn chữ — để mình không giải thích… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C05 | ② | - | — | ✓ 2/2 | Bạn đang hỏi về **slide nào** vậy? Mình chưa chắc nên chưa dám trả lời. Bạn nhắn kèm số slide (vd: *"giải thích slide 24"*), hoặc khoanh trực tiếp vùng cần hỏi … | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C06 | ② | text | 553×259 (11%) | ✓ 2/2 | Sơ đồ bạn chọn mô tả **mức automation Conditional**. Mỗi câu hỏi của học viên đi qua một cổng kiểm tra duy nhất: *"Có căn cứ trong tài liệu không?"* • Nhánh **C… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C07 | ③ | text | 800×540 (33%) | ✓ 2/2 | Phần này mình không hỗ trợ được: mình chỉ **giải thích nội dung trên slide** để bạn tự làm, chứ không làm bài / đưa đáp án thay bạn. Thay vào đó, nếu bạn chỉ vù… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C08 | ③ | text | 648×584 (29%) | ✓ 2/2 | Phần này mình không hỗ trợ được: mình chỉ **giải thích nội dung trên slide** để bạn tự làm, chứ không làm bài / đưa đáp án thay bạn. Thay vào đó, nếu bạn chỉ vù… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C09 | ④ | text | 648×584 (29%) | ✓ 1/1 | Biểu đồ cột bạn chọn so sánh **tỷ lệ câu trả lời của tutor có/không có trích dẫn tài liệu**: • Cột xanh **53,8%** — trả lời có kèm số trang, học viên bấm vào ki… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C10 | ④ | text | 800×540 (33%) | ✓ 1/1 | Sơ đồ bạn chọn mô tả **mức automation Conditional**. Mỗi câu hỏi của học viên đi qua một cổng kiểm tra duy nhất: *"Có căn cứ trong tài liệu không?"* • Nhánh **C… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C11 | ④ | scan | 1413×259 (28%) | ✓ 2/2 | Trang này trong tài liệu là **ảnh chụp/scan, không có lớp text** — mình đã đọc bằng cách quét ảnh vùng bạn chọn. Bảng bạn chọn chia rủi ro của một tính năng AI … | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C12 | thường | text | 800×540 (33%) | ✓ 2/2 | Sơ đồ bạn chọn mô tả **mức automation Conditional**. Mỗi câu hỏi của học viên đi qua một cổng kiểm tra duy nhất: *"Có căn cứ trong tài liệu không?"* • Nhánh **C… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C13 | thường | text | 584×124 (5%) | ✓ 1/1 | Phần bạn chọn liệt kê **3 mức automation**, xếp theo mức độ AI tự quyết tăng dần: 1. **Augment** — AI chỉ gợi ý, người ra quyết định cuối. Dùng khi sai thì đắt.… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C14 | thường | text | 648×584 (29%) | ✓ 2/2 | Biểu đồ cột bạn chọn so sánh **tỷ lệ câu trả lời của tutor có/không có trích dẫn tài liệu**: • Cột xanh **53,8%** — trả lời có kèm số trang, học viên bấm vào ki… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C15 | thường | text | 444×248 (8%) | ✓ 1/1 | Ô chú thích bạn chọn nêu **hậu quả của việc thiếu trích dẫn**: khi tutor không dẫn trang, học viên rơi vào một trong hai tình huống — *tin luôn* (rủi ro học sai… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C16 | thường | scan | 1398×562 (59%) | ✓ 2/2 | Trang này trong tài liệu là **ảnh chụp/scan, không có lớp text** — mình đã đọc bằng cách quét ảnh vùng bạn chọn. Bảng bạn chọn chia rủi ro của một tính năng AI … | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C17 | thường | scan | 332×192 (5%) | ✓ 2/2 | Trang này trong tài liệu là **ảnh chụp/scan, không có lớp text** — mình đã đọc bằng cách quét ảnh vùng bạn chọn. Bảng bạn chọn chia rủi ro của một tính năng AI … | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C18 | thường | text | 1536×158 (18%) | ✓ 1/1 | Trong vùng bạn vừa chọn, mình **không nhận diện được nội dung** nào của bài học (có thể là vùng trống hoặc lề slide). Mình sẽ không đoán bừa để tránh giải thích… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C19 | thường | scan | 404×240 (7%) | ✓ 1/1 | Trang này trong tài liệu là **ảnh chụp/scan, không có lớp text** — mình đã đọc bằng cách quét ảnh vùng bạn chọn. Bảng bạn chọn chia rủi ro của một tính năng AI … | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C20 | hiếm | text | 888×328 (22%) | ✓ 1/1 | *(CP2 — câu trả lời mock)* Mình đã lấy được **trang 1** của tài liệu bạn mở, ở chế độ **đọc text**. Trang này có lớp text đọc được, nên hệ thống gửi ảnh vùng bạ… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C21 | hiếm | scan | 154×173 (2%) | ✓ 1/1 | Trong vùng bạn vừa chọn, mình **không nhận diện được nội dung** nào của bài học (có thể là vùng trống hoặc lề slide). Mình sẽ không đoán bừa để tránh giải thích… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C22 | hiếm | text | 800×540 (33%) | ✓ 1/1 | Sơ đồ bạn chọn mô tả **mức automation Conditional**. Mỗi câu hỏi của học viên đi qua một cổng kiểm tra duy nhất: *"Có căn cứ trong tài liệu không?"* • Nhánh **C… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C23 | dò | text | 800×540 (33%) | ✓ 1/1 | Sơ đồ bạn chọn mô tả **mức automation Conditional**. Mỗi câu hỏi của học viên đi qua một cổng kiểm tra duy nhất: *"Có căn cứ trong tài liệu không?"* • Nhánh **C… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C24 | dò | scan | 332×192 (5%) | ✓ 2/2 | Trang này trong tài liệu là **ảnh chụp/scan, không có lớp text** — mình đã đọc bằng cách quét ảnh vùng bạn chọn. Bảng bạn chọn chia rủi ro của một tính năng AI … | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C25 | dò | scan | 40×196 (1%) | ✓ 1/1 | Vùng bạn chọn hơi nhỏ, mình **chưa chắc** bạn đang muốn hỏi phần nào 🤔 Bạn kéo chọn rộng ra một chút — trọn sơ đồ hoặc trọn đoạn chữ — để mình không giải thích… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C26 | dữ liệu | text | 800×540 (33%) | ✓ 3/3 | Sơ đồ bạn chọn mô tả **mức automation Conditional**. Mỗi câu hỏi của học viên đi qua một cổng kiểm tra duy nhất: *"Có căn cứ trong tài liệu không?"* • Nhánh **C… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C27 | dữ liệu | scan | 1534×864 (100%) | ✓ 2/2 | Trang này trong tài liệu là **ảnh chụp/scan, không có lớp text** — mình đã đọc bằng cách quét ảnh vùng bạn chọn. Bảng bạn chọn chia rủi ro của một tính năng AI … | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C28 | dữ liệu | - | — | ✓ 2/2 | Bạn đang hỏi về **slide nào** vậy? Mình chưa chắc nên chưa dám trả lời. Bạn nhắn kèm số slide (vd: *"giải thích slide 24"*), hoặc khoanh trực tiếp vùng cần hỏi … | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| P01 | pdf | text | 904×160 (11%) | ✓ 3/3 | *(CP2 — câu trả lời mock)* Mình đã lấy được **trang 1** của tài liệu bạn mở, ở chế độ **đọc text**. Trang này có lớp text đọc được, nên hệ thống gửi ảnh vùng bạ… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| P02 | pdf | text | 640×400 (19%) | ✓ 3/3 | *(CP2 — câu trả lời mock)* Mình đã lấy được **trang 2** của tài liệu bạn mở, ở chế độ **đọc text**. Trang này có lớp text đọc được, nên hệ thống gửi ảnh vùng bạ… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| P04 | pdf | - | — | ✓ 2/2 | Trong vùng bạn vừa chọn, mình **không nhận diện được nội dung** nào của bài học (có thể là vùng trống hoặc lề slide). Mình sẽ không đoán bừa để tránh giải thích… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| P03 | pdf | text | 656×668 (33%) | ✓ 2/2 | Phần này mình không hỗ trợ được: mình chỉ **giải thích nội dung trên slide** để bạn tự làm, chứ không làm bài / đưa đáp án thay bạn. Thay vào đó, nếu bạn chỉ vù… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
