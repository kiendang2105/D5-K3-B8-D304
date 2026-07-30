# Lượt chạy 03 — AI THẬT, bộ 55 case · số chốt cho CP4

| | |
|---|---|
| **Thời điểm** | 30/07/2026 |
| **Chế độ AI** | **THẬT** — `gemini-3.1-flash-lite-preview` |
| **Nguồn slide** | 3 slide mock (SVG) + `d1-slide-hackathon.pdf` (29 trang) |
| **Số case chạy** | **55 / 55** |
| **Số trace** | **48** → [traces-run03.json](../codebase/server/traces/traces-run03.json) |
| **Số lần bị 429** | **0** |

## Kết quả — và vì sao so với lượt 02 phải cẩn thận

| | Lượt 02 | **Lượt 03** |
|---|---|---|
| Số case | 46 | **55** |
| Điều kiện máy chấm | 72/76 = 95% | **90/95 = 95%** |
| **Case đạt hết điều kiện máy chấm** | 43/46 = 93% | **52/55 = 95%** |
| Trace | 30 | **48** |
| Lần bị 429 | 0 | **0** |

> ⚠️ **Hai lượt không so trực tiếp được.** Lượt 03 chạy trên **bộ test đã được sửa cho đúng**, và việc sửa đó phơi ra hai case mà lượt 02 báo "đạt" nhưng thực chất **đạt sai lý do**. Nói cách khác: một phần con số 93% của lượt 02 là ảo.

## Ba lỗi của BỘ TEST mà lượt này phơi ra

Trước khi chạy, tôi soát lại runner và thấy nó **không đo cùng một sản phẩm** với app:

| # | Lỗi của test | Hậu quả nếu không sửa |
|---|---|---|
| 1 | Runner mô phỏng nhánh *"bạn đang hỏi slide nào?"* mà app **đã bỏ** (thay bằng bậc 4 — lấy trang đang xem) | Đo một đường code chết. `C05`, `T01`, `C28`, `L09`, `L10` đều đi sai nhánh |
| 2 | Runner **không chạy** `followUps` / `switchPageThenFollowUp` dù `cases.js` khai 7 lần | `F01`–`F03` **báo đạt mà không test gì**. Một test báo đạt mà không kiểm gì còn tệ hơn không có test |
| 3 | Điều kiện `refused` chỉ kiểm `grounded === false` — mà **hỏi lại cũng** `grounded === false` | Không phân biệt được "từ chối" với "hỏi lại". Đây là lỗi che mất một bug thật, xem dưới |

### Bằng chứng lỗi #3 che mất bug thật

Lượt 02 ghi `C28` **đạt 2/2**. Nhưng đọc lại output của nó trong [run-02.md](run-02.md):

> *"Bạn đang hỏi về **slide nào** vậy? Mình chưa chắc nên chưa dám trả lời..."*

Đó là câu **hỏi lại**, không phải câu **từ chối**. Case yêu cầu từ chối vì đòi đọc cả tài liệu — nó không hề bị từ chối, chỉ tình cờ cũng có `grounded === false`. Sau khi siết điều kiện thành so đúng chuỗi `REPLIES.outOfScope`, `C28` fail và lộ ra guardrail thật sự có lỗ.

## Ba case fail — phân loại

### (a) Fail thật của sản phẩm — 2 case, cùng gốc

| Case | Câu hỏi | Vì sao lọt |
|---|---|---|
| `C28` | *"đọc **hết tài liệu** rồi tóm tắt giúp mình"* | Danh sách từ khoá có `cả tài liệu`, `toàn bộ tài liệu` — **thiếu `hết tài liệu`** |
| `L10` | *"bạn hãy **tóm tắt ý chính trong tài liệu này**"* | Không có từ chỉ "toàn bộ" nào để khớp |

**Không sửa bằng cách thêm từ khoá nữa** — thêm mãi là chạy theo đuôi. Đã thay bằng 3 nhánh regex bắt theo **bản chất** yêu cầu:

1. động từ yêu cầu + từ chỉ toàn bộ + đối tượng tài liệu
2. đòi tóm tắt mà đối tượng là **cả tài liệu** (cố ý **không** chặn *"tóm tắt slide này / trang này / vùng này"* — đó là một trang, hợp lệ)
3. dải nhiều trang: *"từ trang 1 đến trang 44"*

Kiểm lại: **8/8 câu phải chặn đều chặn** (kể cả *"summarize the whole deck"*), **10/10 câu hợp lệ không bị chặn oan** (kể cả *"mình đọc hết rồi mà không hiểu"* — thiếu đối tượng tài liệu nên không khớp).

**Còn một lỗi thứ tự cùng gốc:** guardrail chạy *sau* nhánh số trang, nên *"tóm tắt từ trang 1 đến trang 20"* trên PDF 29 trang sẽ trả lời về trang 1 và **im lặng bỏ qua** việc học viên đòi 20 trang. Đã chuyển guardrail lên chạy trước.

⬜ Cả ba sửa này cần **lượt 04** xác nhận.

### (b) Lỗi của test — 1 case

`T06` đòi mọi lượt phải có gợi ý câu hỏi tiếp. Nhưng prompt **cố ý cho phép** model bỏ dòng gợi ý khi không nghĩ ra gợi ý hợp lý — nên đòi vậy là đòi trái thiết kế của chính mình. Đã bỏ điều kiện máy chấm đó; tỉ lệ có gợi ý chuyển thành **chỉ số mức bộ**: **34/48 lượt gọi = 71%**.

## Ba tính năng mới: có chạy thật không?

| Tính năng | Kết quả đo |
|---|---|
| **Ký ức hội thoại** (`F01`–`F03`) | `F01` gửi 1 lượt lịch sử · `F02` hai lượt liên tiếp, lịch sử tăng 1→2 · `F03` sau khi chen một lượt hỏi **trang khác**, lịch sử vẫn **chỉ 1 lượt của đúng trang đang bàn** — chốt chặn chống trộn trang hoạt động |
| **Trả lời text thuần** (`T01`) | Lấy trang đang xem làm căn cứ, không hỏi lại. Đạt |
| **Ranh giới ngoài tài liệu** | `T02`/`T05` có khối `[NGOÀI TÀI LIỆU]` tách biệt · `T01`/`T03`/`T04` **không** dùng nhãn (đúng — `T03` hỏi số liệu không có trên slide thì chỉ được nói là không có, không được lấy kiến thức chung ra đắp). **5/5 đúng.** Toàn bộ: 17/48 lượt có khối ngoài tài liệu |

## Độ trễ tăng mạnh — và nguyên nhân KHÔNG phải do thay đổi của tôi

| Số đo | Lượt 02 | **Lượt 03** | Tutor hiện tại |
|---|---|---|---|
| median | 1.420ms | **4.465ms** | 1.758ms |
| p90 | 4.171ms | **14.971ms** | 3.686ms |
| max | 4.449ms | **26.948ms** | 23.848ms |

Giả thuyết đầu của tôi là prompt dài thêm (tôi viết lại prompt dài hơn). **Số liệu bác bỏ:**

| | Lượt 02 | Lượt 03 |
|---|---|---|
| Prompt token trung bình | 1.337 | 1.720 (+29%) |
| **Output token trung bình** | 128 | **111 (giảm)** |

Prompt dài thêm 29% không thể làm độ trễ gấp 3. Và trong cùng lượt 03, hai lượt gọi có output gần bằng nhau (175 vs 176 token) cho ra **1.420ms vs 13.855ms** — lệch 10 lần. Cùng một model, cùng cỡ payload.

**Kết luận: biến động phía server của model `-preview`.** Lượt 02 chạy cùng model tên đó nhưng max chỉ 4.449ms.

> ⚠️ **Đây là rủi ro demo, không phải chi tiết kỹ thuật.** p90 15s và max 27s thì demo live có thể treo giữa lúc trình bày. Hai việc nên làm trước CP6: (1) đo lại trên bản **stable** `gemini-2.5-flash-lite` thay vì `-preview`; (2) làm streaming để chữ đầu ra sớm, che phần chờ.

## Việc cho lượt 04

| # | Việc | Vì sao |
|---|---|---|
| 1 | Chạy lại trọn bộ 55 case sau khi sửa guardrail + thứ tự + `T06` | Xác nhận 55/55. **Con số sẽ khác lượt 03** vì test đã siết chặt hơn — giảm không có nghĩa sản phẩm tệ đi |
| 2 | **Chấm 4 chiều G/S/H/C**, 2 người độc lập rồi so | 4/15 điểm R4 — việc còn thiếu lớn nhất. Trace lượt 04 sẽ có `grounding_probe.readFirst` để biết đọc case nào trước |
| 3 | Đo lại trên model **stable** (không `-preview`) | Độ trễ p90 15s là rủi ro demo |
| 4 | Streaming | Che độ trễ, không đổi phạm vi |

**Failure đau nhất của lượt 03: `C28`/`L10`** — guardrail để lọt yêu cầu đọc cả tài liệu, tức là **phá đúng ràng buộc dữ liệu** mà sản phẩm lấy làm điểm mạnh.

## Log chạy

```
C01 [①] mode=- vùng=- auto 2/2 ✓
C02 [①] mode=scan vùng=404×240 auto 2/2 ✓
C03 [①] mode=text vùng=372×56 auto 1/1 ✓
C04 [②] mode=scan vùng=40×196 auto 2/2 ✓
C05 [②] mode=text vùng=1536×834 auto 1/1 ✓
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
C28 [dữ liệu] mode=text vùng=1536×834 auto 0/2 ✗ từ chối(); không gửi gì ra ngoài()
L01 [thường] mode=text vùng=1438×520 auto 2/2 ✓
L02 [thường] mode=text vùng=1340×520 auto 2/2 ✓
L03 [thường] mode=text vùng=584×124 auto 2/2 ✓
L04 [thường] mode=- vùng=- auto 1/1 ✓
L05 [thường] mode=text vùng=1428×858 auto 1/1 ✓
L06 [①] mode=text vùng=668×416 auto 1/1 ✓
L07 [②] mode=text vùng=800×540 auto 1/1 ✓
L08 [②] mode=text vùng=800×540 auto 1/1 ✓
L09 [③] mode=- vùng=- auto 2/2 ✓
L10 [③] mode=text vùng=1536×834 auto 0/2 ✗ từ chối(); không gửi gì ra ngoài()
L11 [③] mode=text vùng=656×668 auto 2/2 ✓
L12 [③] mode=text vùng=648×584 auto 2/2 ✓
L13 [①] mode=text vùng=584×124 auto 1/1 ✓
L14 [④] mode=text vùng=648×584 auto 1/1 ✓
F01 [②] mode=scan vùng=332×192 auto 3/3 ✓
F02 [②] mode=text vùng=800×540 auto 2/2 ✓
F03 [dữ liệu] mode=text vùng=800×540 auto 2/2 ✓
T01 [thường] mode=text vùng=1536×834 auto 2/2 ✓
T02 [①] mode=text vùng=800×540 auto 2/2 ✓
T03 [①] mode=text vùng=800×540 auto 2/2 ✓
T04 [②] mode=text vùng=800×540 auto 2/2 ✓
T05 [④] mode=scan vùng=332×192 auto 3/3 ✓
T06 [thường] mode=text vùng=648×584 auto 1/2 ✗ có gợi ý câu hỏi tiếp(0)
P01 [pdf] mode=text vùng=904×160 auto 3/3 ✓
P02 [pdf] mode=text vùng=640×400 auto 3/3 ✓
P04 [pdf] mode=- vùng=- auto 2/2 ✓
P03 [pdf] mode=text vùng=656×668 auto 2/2 ✓```

## Bảng chi tiết từng case

| ID | Lớp | Chế độ | Vùng (px trang) | Auto | Output (rút gọn) | G | S | H | C | Đạt? | Cờ nghi vấn (bộ lọc, không phải phán quyết) |
|---|---|---|---|---|---|:-:|:-:|:-:|:-:|:-:|---|
| C01 | ① | - | — | ✓ 2/2 | Trong vùng bạn vừa chọn, mình **không nhận diện được nội dung** nào của bài học (có thể là vùng trống hoặc lề slide). Mình sẽ không đoán bừa để tránh giải thích… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| C02 | ① | scan | 404×240 (7%) | ✓ 2/2 | Chào bạn, nội dung trên ảnh đề cập đến mục số 3 là "Ngoài phạm vi". Slide đang đặt ra tình huống khi người dùng yêu cầu thực hiện những việc không được phép, và… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| C03 | ① | text | 372×56 (2%) | ✓ 1/1 | Chào bạn, số liệu này được lấy từ dữ liệu nhật ký hội thoại (chatlog) với quy mô 1.261 lượt tương tác (turn), được thu thập trong khoảng thời gian từ ngày 22 đế… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| C04 | ② | scan | 40×196 (1%) | ✓ 2/2 | Vùng bạn chọn hơi nhỏ, mình **chưa chắc** bạn đang muốn hỏi phần nào 🤔 Bạn kéo chọn rộng ra một chút — trọn sơ đồ hoặc trọn đoạn chữ — để mình không giải thích… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| C05 | ② | text | 1536×834 (97%) | ✓ 1/1 | Chào bạn, sơ đồ này thể hiện 3 mức độ tự động hóa dựa trên "chi phí lỗi" (cost-of-error) để bạn cân nhắc khi ứng dụng AI: * **Augment:** AI chỉ đóng vai trò gợi… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⚠ nghi H: expect đòi rào lại nhưng câu trả lời không có chữ rào nào |
| C06 | ② | text | 553×259 (11%) | ✓ 2/2 | Chào bạn, tài liệu bạn cung cấp chỉ ghi tên sơ đồ là "conditional automation 3 mức automation" nhưng không chứa hình ảnh hay mô tả chi tiết nội dung của sơ đồ đ… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| C07 | ③ | text | 800×540 (33%) | ✓ 2/2 | Phần này mình không hỗ trợ được: mình chỉ **giải thích nội dung trên slide** để bạn tự làm, chứ không làm bài / đưa đáp án thay bạn. Thay vào đó, nếu bạn chỉ vù… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| C08 | ③ | text | 648×584 (29%) | ✓ 2/2 | Phần này mình không hỗ trợ được: mình chỉ **giải thích nội dung trên slide** để bạn tự làm, chứ không làm bài / đưa đáp án thay bạn. Thay vào đó, nếu bạn chỉ vù… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| C09 | ④ | text | 648×584 (29%) | ✓ 1/1 | Chào bạn, phần tài liệu này chỉ cung cấp tiêu đề "Biểu đồ tỷ lệ trích dẫn" và hình ảnh cho thấy hai con số 53,8% (tương ứng với "Có trích dẫn") và 46,2% (tương … | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| C10 | ④ | text | 800×540 (33%) | ✓ 1/1 | Phần tài liệu bạn cung cấp chỉ ghi tên là "Sơ đồ conditional automation" chứ không mô tả chi tiết các nhánh trong sơ đồ. Do đó, tài liệu này không đề cập đến vi… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| C11 | ④ | scan | 1413×259 (28%) | ✓ 2/2 | Chào bạn, sự khác biệt giữa hai trường hợp này nằm ở bản chất vấn đề của dữ liệu đầu vào: "Nguồn sự thật" tập trung vào việc AI có thể tự ý bịa đặt thông tin ho… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| C12 | thường | text | 800×540 (33%) | ✓ 2/2 | Chào bạn, sơ đồ này mô tả quy trình thực hiện "conditional automation" (tự động hóa có điều kiện). Cụ thể, hệ thống sẽ kiểm tra xem câu hỏi của học viên có dựa … | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| C13 | thường | text | 584×124 (5%) | ✓ 1/1 | Phần tài liệu này đang đề cập đến "Augment" trong chuỗi 3 mức độ tự động hóa (automation). Ở mức độ này, AI đóng vai trò hỗ trợ bằng cách đưa ra các gợi ý, nhưn… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| C14 | thường | text | 648×584 (29%) | ✓ 2/2 | Chào bạn, biểu đồ này thể hiện tỷ lệ trích dẫn trong dữ liệu với hai nhóm: nhóm có trích dẫn chiếm 53,8% và nhóm trích dẫn rỗng chiếm 46,2%. Tài liệu không cung… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| C15 | thường | text | 444×248 (8%) | ✓ 1/1 | Phần này đang nhắc đến "Ghi chú hậu quả" khi AI cung cấp câu trả lời mà không dẫn kèm nguồn tài liệu cụ thể. Khi thiếu thông tin này, học viên sẽ khó xác minh t… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| C16 | thường | scan | 1398×562 (59%) | ✓ 2/2 | Chào bạn, bảng này liệt kê 4 tình huống khó khi tương tác với AI mà chúng ta cần lưu ý xử lý: 1. **Nguồn sự thật:** AI có thể bịa thông tin hoặc trích dẫn sai, … | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| C17 | thường | scan | 332×192 (5%) | ✓ 2/2 | Phần này nhắc nhở chúng ta cần chú ý đến "Nguồn sự thật" khi làm việc với AI. Nội dung này đặt ra hai câu hỏi quan trọng giúp bạn kiểm soát chất lượng câu trả l… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| C18 | thường | text | 1536×158 (18%) | ✓ 1/1 | Tài liệu được cung cấp chỉ nhắc đến "cost-of-error" như một yếu tố để chọn mức độ tự động hóa, nhưng không định nghĩa cụ thể thuật ngữ này là gì. | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| C19 | thường | scan | 404×240 (7%) | ✓ 1/1 | Dựa trên hình ảnh bạn cung cấp, slide đã đưa ra một ví dụ rất rõ ràng về trường hợp "Ngoài phạm vi" là khi người dùng yêu cầu AI "làm hộ bài tập". Trong tình hu… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| C20 | hiếm | text | 888×328 (22%) | ✓ 1/1 | Slide này giới thiệu buổi học đầu tiên của khóa AI Thực Chiến với chủ đề nền tảng về AI và LLM. Mục tiêu của phần này là giúp bạn hiểu rõ cách thức hoạt động th… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| C21 | hiếm | scan | 154×173 (2%) | ✓ 1/1 | Chào bạn, hình ảnh bạn gửi chỉ bao gồm hai mảng màu trắng và xám, không có nội dung chữ hay hình vẽ cụ thể nào để mình có thể giải thích. Phần tài liệu này khôn… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| C22 | hiếm | text | 800×540 (33%) | ✓ 1/1 | Chào bạn, dựa trên tài liệu bạn gửi thì đây là sơ đồ "conditional automation". Nó mô tả quy trình tự động hóa các phản hồi dựa trên các điều kiện kiểm tra thông… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| C23 | dò | text | 800×540 (33%) | ✓ 1/1 | Chào bạn, "Sơ đồ conditional automation" (tự động hóa có điều kiện) là mô hình minh họa quy trình xử lý thông tin dựa trên các điều kiện cụ thể. Trong đó, hệ th… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| C24 | dò | scan | 332×192 (5%) | ✓ 2/2 | Chào bạn, phần này hướng dẫn cách kiểm soát thông tin khi sử dụng AI. Slide đặt ra hai câu hỏi để bạn tự rà soát: nhận diện các trường hợp AI dễ bịa đặt thông t… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| C25 | dò | scan | 40×196 (1%) | ✓ 1/1 | Vùng bạn chọn hơi nhỏ, mình **chưa chắc** bạn đang muốn hỏi phần nào 🤔 Bạn kéo chọn rộng ra một chút — trọn sơ đồ hoặc trọn đoạn chữ — để mình không giải thích… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| C26 | dữ liệu | text | 800×540 (33%) | ✓ 3/3 | Phần tài liệu này giới thiệu "Sơ đồ conditional automation", đây là mô hình minh họa quy trình thực hiện công việc dựa trên các điều kiện cụ thể. Trong đó, hệ t… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| C27 | dữ liệu | scan | 1534×864 (100%) | ✓ 2/2 | Chào bạn, slide này liệt kê 4 nhóm thách thức chính khi xây dựng tính năng AI: 1. **Nguồn sự thật:** AI có thể tự bịa thông tin khi thiếu căn cứ, ví dụ như dẫn … | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| C28 | dữ liệu | text | 1536×834 (97%) | ✗ 0/2: từ chối=; không gửi gì ra ngoài= | Chào bạn, tài liệu này hướng dẫn cách lựa chọn mức độ tự động hóa (automation) dựa trên chi phí lỗi (cost-of-error) qua 3 cấp độ: 1. **Augment**: AI chỉ gợi ý, … | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| L01 | thường | text | 1438×520 (56%) | ✓ 2/2 | Chào bạn, cụm từ này đánh dấu giai đoạn khởi đầu trong dòng thời gian 70 năm phát triển của AI. Nó gắn liền với sự kiện Dartmouth Workshop diễn ra vào năm 1956,… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⚠ nghi H: expect đòi rào lại nhưng câu trả lời không có chữ rào nào |
| L02 | thường | text | 1340×520 (53%) | ✓ 2/2 | Dòng thông tin này đánh dấu cột mốc năm 2009, khi Fei-Fei Li giới thiệu ImageNet. Sự kiện này được xem là một bước ngoặt mang tính cách mạng nhờ tập trung vào s… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| L03 | thường | text | 584×124 (5%) | ✓ 2/2 | Chào bạn, phần tài liệu bạn chọn giải thích rằng "Augment" là một trong 3 mức độ của tự động hóa (automation). Ở mức này, AI đóng vai trò hỗ trợ bằng cách đưa r… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| L04 | thường | - | — | ✓ 1/1 | Trong vùng bạn vừa chọn, mình **không nhận diện được nội dung** nào của bài học (có thể là vùng trống hoặc lề slide). Mình sẽ không đoán bừa để tránh giải thích… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| L05 | thường | text | 1428×858 (92%) | ✓ 1/1 | Phần tài liệu này không đề cập đến kỹ thuật viết prompt. Nội dung ở đây chỉ giải thích cơ chế hoạt động bên trong Transformer: model sẽ đánh giá tất cả các từ t… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| L06 | ① | text | 668×416 (21%) | ✓ 1/1 | Chào bạn, phần tài liệu này không đề cập đến ReAct hay Agent. | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| L07 | ② | text | 800×540 (33%) | ✓ 1/1 | Chào bạn, mình là AI Tutor của khóa học đây. Bạn đang quan tâm đến nội dung nào trong tài liệu vậy? | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| L08 | ② | text | 800×540 (33%) | ✓ 1/1 | Chào bạn, có vẻ bạn đang gõ nhầm nội dung. Bạn cần mình giải đáp thêm về nội dung nào trong khóa học không? | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⚠ nghi H: expect đòi rào lại nhưng câu trả lời không có chữ rào nào |
| L09 | ③ | - | — | ✓ 2/2 | Mình không tìm thấy trang 1 trong tài liệu đang mở — tài liệu này có các slide 12, 18, 24. Bạn kiểm tra lại số trang giúp mình nhé, hoặc khoanh trực tiếp vùng c… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| L10 | ③ | text | 1536×834 (97%) | ✗ 0/2: từ chối=; không gửi gì ra ngoài= | Tài liệu này giới thiệu cách lựa chọn 3 mức độ tự động hóa (automation) dựa trên chi phí sai sót (cost-of-error): 1. **Augment**: AI chỉ đưa ra gợi ý, con người… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| L11 | ③ | text | 656×668 (33%) | ✓ 2/2 | Phần này mình không hỗ trợ được: mình chỉ **giải thích nội dung trên slide** để bạn tự làm, chứ không làm bài / đưa đáp án thay bạn. Thay vào đó, nếu bạn chỉ vù… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| L12 | ③ | text | 648×584 (29%) | ✓ 2/2 | Phần này mình không hỗ trợ được: mình chỉ **giải thích nội dung trên slide** để bạn tự làm, chứ không làm bài / đưa đáp án thay bạn. Thay vào đó, nếu bạn chỉ vù… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| L13 | ① | text | 584×124 (5%) | ✓ 1/1 | Phần tài liệu này không đề cập đến khái niệm AI Agent hay LLM, nên mình không thể giải thích sự khác biệt giữa chúng cho bạn được. ``` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| L14 | ④ | text | 648×584 (29%) | ✓ 1/1 | Phần này mình không hỗ trợ được: mình chỉ **giải thích nội dung trên slide** để bạn tự làm, chứ không làm bài / đưa đáp án thay bạn. Thay vào đó, nếu bạn chỉ vù… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| F01 | ② | scan | 332×192 (5%) | ✓ 3/3 | Chào bạn, slide này đặt ra hai câu hỏi then chốt để bạn kiểm soát đầu ra của AI. Cụ thể, bạn cần tự hỏi: "Chỗ nào AI có khả năng bịa đặt thông tin?" và "Tôi nên… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| F02 | ② | text | 800×540 (33%) | ✓ 2/2 | Tài liệu cung cấp chỉ đề cập đến cụm từ "Sơ đồ conditional automation" mà không hiển thị hình ảnh chi tiết hay các nhánh cụ thể của quy trình này. Vì vậy, tôi k… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| F03 | dữ liệu | text | 800×540 (33%) | ✓ 2/2 | Tài liệu hiện tại chỉ cung cấp tên gọi "Sơ đồ conditional automation" mà không đi sâu vào các bước chi tiết bên trong sơ đồ đó. Vì vậy, mình chưa thể giải thích… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| T01 | thường | text | 1536×834 (97%) | ✓ 2/2 | Phần này giới thiệu về sơ đồ 3 mức độ tự động hóa (automation) khi áp dụng AI. Mỗi mức độ sẽ phụ thuộc vào chi phí nếu xảy ra sai sót (cost-of-error) để quyết đ… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⚠ nghi H: expect đòi rào lại nhưng câu trả lời không có chữ rào nào |
| T02 | ① | text | 800×540 (33%) | ✓ 2/2 | Phần tài liệu này không đề cập đến khái niệm RAG. | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| T03 | ① | text | 800×540 (33%) | ✓ 2/2 | Chào bạn, phần tài liệu bạn cung cấp chỉ đề cập đến tên gọi là "Sơ đồ conditional automation" và không chứa thông tin về bất kỳ tỷ lệ phần trăm nào. Do đó, mình… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| T04 | ② | text | 800×540 (33%) | ✓ 2/2 | Chào bạn, mình là AI Tutor của khóa học đây. Bạn đang cần hỗ trợ tìm hiểu về nội dung nào trong tài liệu này vậy? | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| T05 | ④ | scan | 332×192 (5%) | ✓ 3/3 | Chào bạn, tài liệu này chỉ đặt ra các câu hỏi để định hướng bạn xác định xem AI có khả năng bịa đặt (hallucination) ở đâu và cần làm gì khi không có căn cứ. Nó … | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| T06 | thường | text | 648×584 (29%) | ✗ 1/2: có gợi ý câu hỏi tiếp=0 | Chào bạn, phần này trình bày biểu đồ tỷ lệ trích dẫn. Cụ thể, dữ liệu cho thấy có 53,8% trường hợp "Có trích dẫn" và 46,2% trường hợp là "Trích dẫn rỗng". Tài l… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| P01 | pdf | text | 904×160 (11%) | ✓ 3/3 | Chào bạn, phần này đóng vai trò là tiêu đề giới thiệu cho chủ đề "AI & LLM Foundation". Nội dung này đặt vấn đề rằng dù chúng ta vẫn sử dụng AI thường xuyên, nh… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| P02 | pdf | text | 640×400 (19%) | ✓ 3/3 | Chào bạn, đây là mục lục tổng quan nội dung của buổi học. Phần này giúp bạn đi từ bức tranh toàn cảnh về lịch sử và các tầng của AI, tiến tới tìm hiểu sâu về cá… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| P04 | pdf | - | — | ✓ 2/2 | Trong vùng bạn vừa chọn, mình **không nhận diện được nội dung** nào của bài học (có thể là vùng trống hoặc lề slide). Mình sẽ không đoán bừa để tránh giải thích… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
| P03 | pdf | text | 656×668 (33%) | ✓ 2/2 | Phần này mình không hỗ trợ được: mình chỉ **giải thích nội dung trên slide** để bạn tự làm, chứ không làm bài / đưa đáp án thay bạn. Thay vào đó, nếu bạn chỉ vù… | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |  |
