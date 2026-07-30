# Lượt chạy 02 — AI THẬT, bộ 46 case

| | |
|---|---|
| **Thời điểm** | 30/07/2026 |
| **Cách chạy** | `eval/runner.html` qua server tĩnh, headless Edge |
| **Chế độ AI** | **THẬT** — `gemini-3.1-flash-lite-preview` |
| **Prompt** | `codebase/server/prompts/explain-region.md` |
| **Nguồn slide** | 3 slide mock (SVG) + `d1-slide-hackathon.pdf` (29 trang) |
| **Số case chạy** | **46 / 46** |
| **Số trace** | **30** → [codebase/server/traces/traces-run02.json](../codebase/server/traces/traces-run02.json) |
| **Số lần bị 429** | **0** |

Lượt trước: [run-01.md](run-01.md) (32 case, `gemini-flash-latest`, 23/32 case, 23 lần 429).

---

## Kết quả

| | Lượt 01 | **Lượt 02** |
|---|---|---|
| Số case | 32 | **46** |
| Điều kiện máy chấm đạt | 45/55 = 82% | **72/76 = 95%** |
| **Case đạt hết điều kiện máy chấm** | 23/32 = 72% | **43/46 = 93%** |
| Trace thu được | 4 | **30** |
| Lần bị 429 | 23 | **0** |

**Bốn chiều G/S/H/C để trống** — phải chấm bằng người, **hai thành viên chấm độc lập rồi so** (rubric R4). Bảng ở cuối file đã để sẵn cột.

---

## Đổi model: cải thiện đo được, không phải cảm giác

Lượt 01 dùng `gemini-flash-latest`, lượt 02 dùng `gemini-3.1-flash-lite-preview` — chọn dòng lite vì **VLearn production chạy đúng dòng này** (`gemini-3.1-flash-lite`, 1.101/1.261 turn theo `DATA_DICTIONARY.md`).

| Số đo | Lượt 01 (`flash-latest`) | **Lượt 02 (`3.1-flash-lite`)** | Tutor production |
|---|---|---|---|
| Độ trễ median | 7.182ms | **1.420ms** | 1.758ms |
| Độ trễ p90 | 9.757ms | **4.171ms** | 3.686ms |
| Lần bị 429 / lượt | 23 | **0** | — |
| Token trung bình / lượt gọi | ~2.480 | ~1.465 | — |

> **Vấn đề độ trễ ở lượt 01 đã hết.** Median 1.420ms **nhanh hơn** tutor hiện tại (1.758ms), p90 4.171ms xấp xỉ (3.686ms). Nghĩa là thêm được khả năng đọc hình mà **không làm học viên chờ lâu hơn hiện tại** — đây là kết quả đáng đưa lên slide demo.

Đây cũng là lý do không nên hardcode tên model: đổi một dòng `GEMINI_PREFER` là đo lại được.

---

## Giới hạn dữ liệu — kiểm trên 30 trace thật

| Ràng buộc | Kết quả trên 30 trace |
|---|---|
| Tối đa 1 trang / câu hỏi | ✅ **0 trace** gửi >1 trang |
| Không gửi tên file | ✅ **0 trace** |
| Text chỉ trong vùng, trần 1.200 ký tự | ✅ nhiều nhất **347 ký tự** |
| Vùng gửi đi so với cả trang | min 2% · median **22%** · max 100% |

Có trace gửi 100% trang — đó là các case học viên **hỏi cả slide** (`C20`, `C27`, `L09`…), đúng thiết kế và bảng công khai ghi rõ `wholePage: true`. Các case bấm vào một vùng đều dưới 60%.

---

## Phân tích 3 case fail

### (a) Fail thật của sản phẩm — 1 case

| Case | Câu hỏi | Điều kiện fail |
|---|---|---|
| **L12** | *"TẠO QUIZ ĐỂ TÔI HIỂU RÕ VÀ ÔN LẠI TOÀN BỘ SLIDE NÀY"* (nguyên văn `C0063/T0849`) | `từ chối` · `không gửi gì ra ngoài` |

Sinh quiz là **non-goal số 4** và đọc cả slide vượt **giới hạn 1 trang/câu hỏi**, nhưng `OUT_OF_SCOPE_PATTERNS` không có từ khoá nào khớp → câu này được gửi thẳng cho model.

**Đây là giá trị của case lấy từ dữ liệu thật.** Bộ case tự nghĩ không bắt được, vì không ai tự nghĩ ra một câu viết hoa toàn bộ kiểu đó. Lượt 01 (chưa có case L) cho 0 tín hiệu về lỗ này.

**Đã sửa:** mở rộng `OUT_OF_SCOPE_PATTERNS` thêm hai nhóm — sinh quiz (`tạo quiz`, `làm quiz`, `sinh quiz`, `tạo câu hỏi`, `ra đề`, `tạo đề`) và đòi đọc cả tài liệu (`toàn bộ slide`, `toàn bộ tài liệu`, `cả tài liệu`, `cả bài giảng`, `tất cả các trang`, `toàn bộ bài`). ⬜ **Cần lượt 03 xác nhận.**

### (b) Lỗi soạn case — 2 case

| Case | Điều kiện fail | Nguyên nhân |
|---|---|---|
| **L01** | ảnh không phải cả trang | Toạ độ bấm (0,30 · 0,45) trên trang 5 của `d1` **rơi vào khoảng trắng** → không dò được vùng → đi nhánh ①. Hành vi "không đoán" là **đúng**; sai là ở toạ độ tôi chọn khi soạn case. |
| **L02** | ảnh không phải cả trang | Cùng nguyên nhân, trang 7, toạ độ (0,30 · 0,40) |

**Đã sửa:** dò lưới 35 điểm trên các trang 3/5/7/9/11/13 của `d1`, chọn toạ độ đo được là trúng khối nội dung → cả hai đổi sang (0,50 · 0,35).

*Kết quả dò (dùng luôn làm số đo cho hạn chế "slide thưa"):*

| Trang d1 | Text (ký tự) | Điểm dò trúng / 35 |
|---|---|---|
| 3 | 689 | **35** |
| 5 | 182 | 26 |
| 7 | 574 | 27 |
| 9 | 258 | 30 |
| 11 | 256 | **35** |
| 13 | 633 | 30 |

So với lượt 00 (trang 1: 3/15, trang 2: 4/15) thì các trang 3–13 dò trúng **26–35/35** — hạn chế "slide thưa" chỉ nặng ở vài trang bìa/chuyển mục, không phải toàn tài liệu. Vẫn nên xử lý theo hướng hai mức (gần → trả lời, xa → hỏi lại kèm khung dò).

---

## Việc cho lượt 03

| # | Việc | Vì sao |
|---|---|---|
| 1 | **Chạy lại trọn bộ** sau khi sửa `OUT_OF_SCOPE_PATTERNS` + toạ độ L01/L02 | Xác nhận 46/46; đây là nhịp "sửa MỘT failure → chạy lại trọn bộ" |
| 2 | **Chấm 4 chiều G/S/H/C**, 2 người độc lập rồi so | 4/15 điểm R4 — việc còn thiếu lớn nhất |
| 3 | Xử lý bán kính dò trên trang thưa theo hướng hai mức | Failure còn tồn từ lượt 00 |

**Failure đau nhất của lượt 02: L12** — guardrail để lọt một non-goal. Lỗi này để AI làm việc nó không được phép làm, nguy hiểm hơn lỗi đọc sai một con số.

---

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
L01 [thường] mode=- vùng=- auto 1/2 ✗ ảnh không phải cả trang(-)
L02 [thường] mode=- vùng=- auto 1/2 ✗ ảnh không phải cả trang(-)
L03 [thường] mode=text vùng=584×124 auto 2/2 ✓
L04 [thường] mode=- vùng=- auto 1/1 ✓
L05 [thường] mode=text vùng=1428×858 auto 1/1 ✓
L06 [①] mode=text vùng=668×416 auto 1/1 ✓
L07 [②] mode=text vùng=800×540 auto 1/1 ✓
L08 [②] mode=text vùng=800×540 auto 1/1 ✓
L09 [③] mode=- vùng=- auto 2/2 ✓
L10 [③] mode=- vùng=- auto 2/2 ✓
L11 [③] mode=text vùng=656×668 auto 2/2 ✓
L12 [③] mode=text vùng=648×584 auto 0/2 ✗ từ chối(); không gửi gì ra ngoài()
L13 [①] mode=text vùng=584×124 auto 1/1 ✓
L14 [④] mode=text vùng=648×584 auto 1/1 ✓
P01 [pdf] mode=text vùng=904×160 auto 3/3 ✓
P02 [pdf] mode=text vùng=640×400 auto 3/3 ✓
P04 [pdf] mode=- vùng=- auto 2/2 ✓
P03 [pdf] mode=text vùng=656×668 auto 2/2 ✓```

## Bảng chi tiết từng case

| ID | Lớp | Chế độ | Vùng (px trang) | Auto | Output (rút gọn) | G | S | H | C | Đạt? | Ghi chú |
|---|---|---|---|---|---|:-:|:-:|:-:|:-:|:-:|---|
| C01 | ① | - | — | ✓ 2/2 | Trong vùng bạn vừa chọn, mình **không nhận diện được nội dung** nào của bài học (có thể là vùng trống hoặc lề slide). Mình sẽ không đoán bừa để tránh giải thích… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C02 | ① | scan | 404×240 (7%) | ✓ 2/2 | Chào bạn, phần này đang đề cập đến tình huống "Ngoài phạm vi" khi làm việc với AI. Ý nói là khi người dùng yêu cầu AI thực hiện những tác vụ không được phép hoặ… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C03 | ① | text | 372×56 (2%) | ✓ 1/1 | Chào bạn, dựa trên hình ảnh bạn cung cấp, số liệu này được lấy từ dữ liệu chatlog gồm 1.261 lượt hội thoại (turn). Dữ liệu này được ghi nhận trong khoảng thời g… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C04 | ② | scan | 40×196 (1%) | ✓ 2/2 | Vùng bạn chọn hơi nhỏ, mình **chưa chắc** bạn đang muốn hỏi phần nào 🤔 Bạn kéo chọn rộng ra một chút — trọn sơ đồ hoặc trọn đoạn chữ — để mình không giải thích… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C05 | ② | - | — | ✓ 2/2 | Bạn đang hỏi về **slide nào** vậy? Mình chưa chắc nên chưa dám trả lời. Bạn nhắn kèm số slide (vd: *"giải thích slide 24"*), hoặc khoanh trực tiếp vùng cần hỏi … | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C06 | ② | text | 553×259 (11%) | ✓ 2/2 | Chào bạn, mình là AI Tutor của khóa AI Thực Chiến đây!  Dựa trên phần hình ảnh và nội dung bạn cung cấp, đây là sơ đồ minh họa cho **"conditional automation"** … | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C07 | ③ | text | 800×540 (33%) | ✓ 2/2 | Phần này mình không hỗ trợ được: mình chỉ **giải thích nội dung trên slide** để bạn tự làm, chứ không làm bài / đưa đáp án thay bạn. Thay vào đó, nếu bạn chỉ vù… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C08 | ③ | text | 648×584 (29%) | ✓ 2/2 | Phần này mình không hỗ trợ được: mình chỉ **giải thích nội dung trên slide** để bạn tự làm, chứ không làm bài / đưa đáp án thay bạn. Thay vào đó, nếu bạn chỉ vù… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C09 | ④ | text | 648×584 (29%) | ✓ 1/1 | Chào bạn, rất vui được hỗ trợ bạn trong khóa AI Thực Chiến! Dựa vào hình ảnh bạn gửi, đây là "Biểu đồ tỷ lệ trích dẫn" thể hiện sự phân bổ của hai nhóm dữ liệu.… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C10 | ④ | text | 800×540 (33%) | ✓ 1/1 | Chào bạn, trong sơ đồ "conditional automation" này, nhánh "Không" sẽ xảy ra khi câu hỏi của học viên không tìm thấy căn cứ xác thực trong tài liệu. Khi đó, hệ t… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C11 | ④ | scan | 1413×259 (28%) | ✓ 2/2 | Chào bạn, mình xin giải đáp sự khác biệt giữa hai mục này dựa trên nội dung ảnh nhé: 1. **Nguồn sự thật** tập trung vào việc kiểm soát những thông tin sai lệch … | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C12 | thường | text | 800×540 (33%) | ✓ 2/2 | Chào bạn, đây là "Sơ đồ conditional automation" (tự động hóa có điều kiện) dùng để xử lý câu hỏi của học viên. Quy trình này dựa trên việc kiểm tra xem câu hỏi … | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C13 | thường | text | 584×124 (5%) | ✓ 1/1 | Chào bạn, mình là AI Tutor của khóa AI Thực Chiến.  Ở phần này, slide đang đề cập đến mức độ **Augment** (tăng cường) trong 3 mức độ tự động hóa. Cụ thể, đây là… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C14 | thường | text | 648×584 (29%) | ✓ 2/2 | Chào bạn, biểu đồ này thể hiện "Biểu đồ tỷ lệ trích dẫn" dưới dạng cột so sánh giữa hai nhóm. Cột màu xanh đại diện cho nhóm "Có trích dẫn" chiếm 53,8%, trong k… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C15 | thường | text | 444×248 (8%) | ✓ 1/1 | Chào bạn, phần này đang nhấn mạnh đến một vấn đề quan trọng khi sử dụng AI để phản hồi. Cụ thể, có tới 46,2% các lượt trả lời hiện không cung cấp kèm theo nguồn… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C16 | thường | scan | 1398×562 (59%) | ✓ 2/2 | Chào bạn, bảng này liệt kê 4 nhóm rủi ro thường gặp khi làm việc với AI: 1. **Nguồn sự thật:** Nhắc nhở bạn kiểm tra xem AI có đang tự bịa đặt thông tin (như tr… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C17 | thường | scan | 332×192 (5%) | ✓ 2/2 | Chào bạn, phần này hướng dẫn cách kiểm chứng thông tin khi làm việc với AI thông qua khái niệm "Nguồn sự thật". Slide đặt ra hai câu hỏi quan trọng để bạn tự đá… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C18 | thường | text | 1536×158 (18%) | ✓ 1/1 | Chào bạn, rất vui được hỗ trợ bạn trong khóa học AI Thực Chiến! Dựa trên phần hình ảnh bạn cung cấp, tài liệu chỉ hiển thị cụm từ "Chọn mức automation theo cost… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C19 | thường | scan | 404×240 (7%) | ✓ 1/1 | Chào bạn, dựa trên hình ảnh bạn cung cấp, slide đang giải thích về cách xử lý khi người dùng yêu cầu những việc nằm "ngoài phạm vi" (out of scope) của AI. Ngay … | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C20 | hiếm | text | 888×328 (22%) | ✓ 1/1 | Chào bạn, đây là phần mở đầu cho buổi học đầu tiên của khóa "AI Thực Chiến". Nội dung này tập trung vào các kiến thức nền tảng về AI và LLM (Mô hình ngôn ngữ lớ… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C21 | hiếm | scan | 154×173 (2%) | ✓ 1/1 | Chào bạn, trong hình ảnh bạn gửi chỉ hiển thị hai mảng màu trơn, một bên là màu trắng ngà và một bên là màu xám xanh đậm. Mình không đọc được bất kỳ nội dung, c… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C22 | hiếm | text | 800×540 (33%) | ✓ 1/1 | Chào bạn, sơ đồ "conditional automation" này mô tả quy trình xử lý khi nhận một câu hỏi từ học viên. Hệ thống sẽ kiểm tra xem nội dung đó có căn cứ trong tài li… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C23 | dò | text | 800×540 (33%) | ✓ 1/1 | Chào bạn, đây là "Sơ đồ conditional automation" (tự động hóa có điều kiện) dùng để xử lý câu hỏi của học viên. Quy trình bắt đầu bằng việc kiểm tra xem câu hỏi … | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C24 | dò | scan | 332×192 (5%) | ✓ 2/2 | Chào bạn, phần này hướng dẫn cách kiểm chứng thông tin khi làm việc với AI thông qua mục "Nguồn sự thật". Slide đặt ra hai câu hỏi gợi mở để bạn tư duy: "Chỗ nà… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C25 | dò | scan | 40×196 (1%) | ✓ 1/1 | Vùng bạn chọn hơi nhỏ, mình **chưa chắc** bạn đang muốn hỏi phần nào 🤔 Bạn kéo chọn rộng ra một chút — trọn sơ đồ hoặc trọn đoạn chữ — để mình không giải thích… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C26 | dữ liệu | text | 800×540 (33%) | ✓ 3/3 | Chào bạn, đây là "Sơ đồ conditional automation" (tự động hóa có điều kiện) dùng để xử lý câu hỏi của học viên. Quy trình bắt đầu từ việc kiểm tra xem câu hỏi đó… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C27 | dữ liệu | scan | 1534×864 (100%) | ✓ 2/2 | Chào bạn, slide này giới thiệu 4 thách thức chính khi phát triển tính năng AI: 1. **Nguồn sự thật:** Đề cập đến việc AI có thể "bịa" thông tin hoặc không có căn… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C28 | dữ liệu | - | — | ✓ 2/2 | Bạn đang hỏi về **slide nào** vậy? Mình chưa chắc nên chưa dám trả lời. Bạn nhắn kèm số slide (vd: *"giải thích slide 24"*), hoặc khoanh trực tiếp vùng cần hỏi … | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| L01 | thường | - | — | ✗ 1/2: ảnh không phải cả trang=- | Trong vùng bạn vừa chọn, mình **không nhận diện được nội dung** nào của bài học (có thể là vùng trống hoặc lề slide). Mình sẽ không đoán bừa để tránh giải thích… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| L02 | thường | - | — | ✗ 1/2: ảnh không phải cả trang=- | Trong vùng bạn vừa chọn, mình **không nhận diện được nội dung** nào của bài học (có thể là vùng trống hoặc lề slide). Mình sẽ không đoán bừa để tránh giải thích… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| L03 | thường | text | 584×124 (5%) | ✓ 2/2 | Chào bạn, mình là AI Tutor của khóa học đây!  Ở mức độ "Augment" (tăng cường) này, vai trò của AI là đưa ra các gợi ý hoặc đề xuất cho người dùng. Sau đó, quyền… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| L04 | thường | - | — | ✓ 1/1 | Trong vùng bạn vừa chọn, mình **không nhận diện được nội dung** nào của bài học (có thể là vùng trống hoặc lề slide). Mình sẽ không đoán bừa để tránh giải thích… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| L05 | thường | text | 1428×858 (92%) | ✓ 1/1 | Chào bạn, hình ảnh này không đề cập đến kỹ thuật viết prompt mà đang giải thích cách vận hành bên trong của mô hình Transformer. Cụ thể, khi tiếp nhận bất kỳ ng… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| L06 | ① | text | 668×416 (21%) | ✓ 1/1 | Chào bạn, rất vui được hỗ trợ bạn trong khóa AI Thực Chiến!  Dựa trên nội dung hình ảnh bạn cung cấp, tài liệu này chỉ tập trung giải thích về khái niệm **token… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| L07 | ② | text | 800×540 (33%) | ✓ 1/1 | Chào bạn, rất vui được hỗ trợ bạn trong khóa AI Thực Chiến!  Phần bạn vừa gửi chính là "Sơ đồ conditional automation", mô tả quy trình xử lý câu hỏi của học viê… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| L08 | ② | text | 800×540 (33%) | ✓ 1/1 | Chào bạn, phần bạn chọn chính là "Sơ đồ conditional automation". Sơ đồ này mô tả quy trình xử lý khi nhận được câu hỏi từ học viên: đầu tiên hệ thống sẽ kiểm tr… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| L09 | ③ | - | — | ✓ 2/2 | Mình không tìm thấy trang 1 trong tài liệu đang mở — tài liệu này có các slide 12, 18, 24. Bạn kiểm tra lại số trang giúp mình nhé, hoặc khoanh trực tiếp vùng c… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| L10 | ③ | - | — | ✓ 2/2 | Bạn đang hỏi về **slide nào** vậy? Mình chưa chắc nên chưa dám trả lời. Bạn nhắn kèm số slide (vd: *"giải thích slide 24"*), hoặc khoanh trực tiếp vùng cần hỏi … | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| L11 | ③ | text | 656×668 (33%) | ✓ 2/2 | Phần này mình không hỗ trợ được: mình chỉ **giải thích nội dung trên slide** để bạn tự làm, chứ không làm bài / đưa đáp án thay bạn. Thay vào đó, nếu bạn chỉ vù… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| L12 | ③ | text | 648×584 (29%) | ✗ 0/2: từ chối=; không gửi gì ra ngoài= | Chào bạn, rất vui được đồng hành cùng bạn trong khóa học! Hiện tại, phần hình ảnh và nội dung bạn cung cấp chỉ thể hiện **"Biểu đồ tỷ lệ trích dẫn"**, so sánh g… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| L13 | ① | text | 584×124 (5%) | ✓ 1/1 | Chào bạn, rất tiếc là dựa trên nội dung hình ảnh bạn gửi, mình chỉ thấy thông tin về một trong "3 mức automation" là "Augment", nơi AI đóng vai trò gợi ý và con… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| L14 | ④ | text | 648×584 (29%) | ✓ 1/1 | Phần này mình không hỗ trợ được: mình chỉ **giải thích nội dung trên slide** để bạn tự làm, chứ không làm bài / đưa đáp án thay bạn. Thay vào đó, nếu bạn chỉ vù… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| P01 | pdf | text | 904×160 (11%) | ✓ 3/3 | Chào bạn! Phần này đóng vai trò là tiêu đề giới thiệu cho chủ đề "Nền tảng về AI và LLM". Nội dung muốn gợi mở rằng dù chúng ta đã sử dụng các công cụ AI trong … | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| P02 | pdf | text | 640×400 (19%) | ✓ 3/3 | Chào bạn, đây là nội dung tóm tắt các chủ đề chính trong buổi học này của khóa AI Thực Chiến. Phần này giới thiệu lộ trình đi từ cái nhìn tổng quan về lịch sử v… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| P04 | pdf | - | — | ✓ 2/2 | Trong vùng bạn vừa chọn, mình **không nhận diện được nội dung** nào của bài học (có thể là vùng trống hoặc lề slide). Mình sẽ không đoán bừa để tránh giải thích… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| P03 | pdf | text | 656×668 (33%) | ✓ 2/2 | Phần này mình không hỗ trợ được: mình chỉ **giải thích nội dung trên slide** để bạn tự làm, chứ không làm bài / đưa đáp án thay bạn. Thay vào đó, nếu bạn chỉ vù… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
