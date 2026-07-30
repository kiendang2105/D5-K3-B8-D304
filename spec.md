# AI SPEC — AI Tutor giải thích vùng slide · Nhóm B8

Hướng: **[x] A — VLearn**  [ ] B — Trợ lý Học viên  [ ] C — Làn mở
Loại: **[x] Tối ưu tính năng có sẵn**  [ ] Tính năng mới

> **Trạng thái: hoàn tất CP5.** Prototype đã chạy AI thật, có ba lượt đo, 55 golden case, trace trong repo và validation với 5 người ngoài nhóm. CP6 còn phần trình bày/demo cuối.

---

## §1. User & Job

**Job executor:** Học viên khoá AI Thực Chiến đang tự xem lại bài giảng — trong buổi học (bôi đoạn tài liệu hỏi tutor) và sau buổi học (ôn lại slide).

Canvas 7 dòng và job map rút gọn: [docs/canvas-cp1.md](docs/canvas-cp1.md).

**Core JTBD** (không tên sản phẩm/AI):
> Khi xem lại một slide bài giảng, hiểu được nội dung trực quan trên đó (sơ đồ, biểu đồ, hình minh hoạ) mà không phải chờ hỏi người khác.

**Problem statement** (KHÔNG chữ AI):
> Nội dung quan trọng nhất của nhiều slide nằm ở hình — sơ đồ luồng, biểu đồ số liệu, bảng phân loại. Khi học viên không hiểu phần hình đó, công cụ hỏi-đáp trong trang học không giúp được: nó chỉ xử lý được chữ. Học viên phải tự đoán, chờ hỏi TA, hoặc bỏ qua — và bỏ qua là lựa chọn phổ biến nhất vì rẻ nhất về mặt công sức.

### Evidence

**Chuẩn A — khảo sát (n = 23, ngoài nhóm)** — log đầy đủ: [docs/survey-log.md](docs/survey-log.md)

| Câu hỏi | Kết quả | % |
|---|---|---|
| Đã gặp việc AI Tutor không đọc được ảnh slide | 13/23 | **56,5%** |
| Chọn nội dung trên slide nhưng AI không nhận biết được phần cần giải thích | 11/23 | **47,8%** |
| AI Tutor chưa đọc được toàn bộ dữ liệu slide PDF | 9/23 | **39,1%** |

Đạt ngưỡng định lượng của chuẩn A: n ≥ 20 ✅ · pain chính ≥50% ✅. Google Form là câu hỏi chọn nhiều đáp án nên artifact khảo sát lưu số tổng hợp từ biểu đồ; quote định tính được thu ở vòng validation CP5.

**Chuẩn B — mining chatlog** *(nguồn: `data/vlearn-pack/chatlog/`, 1.261 turn, 369 user, 22–29/07/2026)*
Phương pháp đếm + script chạy lại được: [docs/mining-log.md](docs/mining-log.md) · [docs/mining.py](docs/mining.py)

| Số đo | Giá trị | Phương pháp đếm |
|---|---|---|
| **Câu hỏi mang tiền tố `(Trang N, đoạn được chọn: "...")`** | **1.252 / 1.261 = 99,3%** | regex trên `content` dòng student — xem mining-log §3 |
| Trong đó đoạn chọn **rỗng** | **0** | nền tảng luôn gửi được text của vùng bôi đen |
| Lượt trả lời tutor có `citations` rỗng | **582 / 1.261 = 46,2%** | `citations` ∈ {`[]`, rỗng} trên dòng tutor |
| Đoạn được chọn ≤ 15 ký tự | 293 / 1.252 = 23,4% | chỉ là tín hiệu để điều tra; không dùng làm số pain vì chưa đọc tay đủ mẫu |
| Học viên hỏi thẳng về một đối tượng trực quan | **4 / 1.261 = 0,3%** | tiêu chí **chặt**: có danh từ chỉ đối tượng trực quan, loại "slide này" |
| *(cùng câu hỏi, tiêu chí lỏng)* | *135 / 1.261 = 10,7%* | *lỏng gồm cả "tóm tắt slide này" → thổi số, không dùng* |
| `misconceptions` từng được dùng | **0 / 1.261** | feature chết |
| `asked_check_question = True` | **3 / 2.522** | tutor gần như không kiểm tra hiểu bài |

**Bằng chứng mạnh nhất là bằng chứng kiến trúc, không phải tần suất.** 99,3% câu hỏi đã mang sẵn *số trang + text vùng bôi đen* → VLearn **không thiếu** khả năng biết học viên chọn gì. Cái thiếu là **đường truyền hình ảnh**: bôi đen một sơ đồ thì text lấy được chỉ là dòng caption, nội dung nằm ở hình mất hẳn. Prototype thêm đúng đường đó.

> ⚠️ **Đối mặt với số bất lợi.** Tiêu chí chặt chỉ ra **4/1.261 lượt** hỏi thẳng về hình — mining **không chứng minh được tần suất** của pain này. Khảo sát 56,5% cho thấy pain có tồn tại; validation CP5 cho thấy người thử chỉ tin hơn khi nhìn thấy đúng vùng và đúng trang. Tuy vậy, nhóm vẫn không suy diễn tần suất từ chatlog.

**≥5 quote/ví dụ nguyên văn + nguồn** *(mã hội thoại/turn, trích ngắn theo quy định bảo mật)*:

1. `C0346/T0840` trang 59, `citations=[]` — *"phân tích hình ảnh được khoanh đỏ ở slide 59"*. Hỏi thẳng về hình, tutor trả lời **không dẫn nguồn nào**. Ví dụ đắt nhất của pain.
2. `C0302/T0611` trang 16 — đoạn chọn là *"Mô hình Double Diamond — Don Norman / British Design Council 2005"* + câu hỏi *"giải thích hình ảnh này"*. Đúng cơ chế hỏng: bôi đen sơ đồ thì chỉ lấy được **caption**.
3. `C0547/T0135` trang 16, `citations=[]` — *"tóm tắt nội dung các giai đoạn được mô tả trên slide các biểu đồ"*.
4. `C0007/T0020` trang 15, `citations=[]` — đoạn chọn chỉ là *"instruction"*, câu hỏi *"Giải thích đoạn bôi đen ở Trang 15."* Đoạn chọn quá ngắn để trả lời được.
5. `C0388/T0589` trang 63, `citations=[63]` — đoạn chọn *"Từ language model đến multimodal: token không chỉ là chữ…"*.
6. Validation CP5 — Minh Anh, sinh viên năm 3: *"Nếu không phóng to thì em không dám tin."*; Huy, học viên đi làm: *"Có số trang thì em tin hơn nhiều."* → [validation/feedback-log.md](validation/feedback-log.md)

---

## §2. Impact & quyết định chọn

### Bảng impact — 3 ứng viên

| Ứng viên | Bao nhiêu người gặp | Tần suất | Mỗi lần tốn gì | Build nổi trong sự kiện? | Chọn? |
|---|---|---|---|---|---|
| **A. Giải thích vùng hình trên slide** | 13/23 (56,5%) đã gặp · chatlog: chỉ 4/1.261 lượt hỏi thẳng | ⚠️ **không đo được từ log** — xem cảnh báo §1 | Bỏ qua phần hình, tự phóng to/đọc lại hoặc hỏi người khác; chưa đo số phút | ✅ — 1 AI call vision, không cần hạ tầng mới | ✅ **CHỌN** |
| **B. Bắt tutor luôn trích dẫn trang** | 46,2% lượt trả lời không có nguồn (mining) | Mỗi lượt hỏi | Không kiểm lại được → tin sai hoặc mất công tự tra | ⚠️ — phải sửa pipeline retrieval của tutor, ngoài tầm 1,5 ngày | ❌ |
| **C. Tutor chủ động kiểm tra hiểu bài** | `asked_check_question` chỉ 3/2.522 → gần như chưa có | Cuối mỗi buổi | Học viên tưởng hiểu nhưng không hiểu — phát hiện muộn | ✅ — nhưng cần định nghĩa "hiểu thật", tốn vòng thiết kế | ❌ |

### Ứng viên đã loại + vì sao

**B — Bắt tutor luôn trích dẫn trang.** Con số mining mạnh nhất (46,2%, đếm được, kiểm lại được) nhưng nguyên nhân nằm ở tầng retrieval của tutor hiện tại, không phải ở tầng trả lời. Sửa đúng chỗ đó là việc của team kỹ thuật VLearn, không demo được trong 5 phút.

> ⚠️ **Đã kiểm và phải sửa lại giả thuyết.** Bản trước của spec này viết *"một phần của 46,2% là do slide dạng ảnh không rút được text"*. Đo thật trên hai deck được cấp (`d1`/`d2-slide-hackathon.pdf`, 29 trang mỗi deck) thì **cả 58 trang đều có lớp text** (132–1331 ký tự/trang, ngưỡng 30). Vậy giả thuyết đó **không có bằng chứng** trên tài liệu này — đã bỏ. Số đo: [eval/run-00-baseline-mock.md](eval/run-00-baseline-mock.md).

**C — Tutor chủ động kiểm tra hiểu bài.** Khả thi về kỹ thuật, nhưng "hiểu thật" là một chiều chất lượng khó định nghĩa kiểm chứng được trong 1,5 ngày; nguy cơ golden set toàn case cảm tính.

### Ứng viên chọn + vì sao (bằng số)

**A** — ba lý do, xếp theo độ mạnh của bằng chứng:

1. **Bằng chứng kiến trúc (mạnh nhất, đếm được):** 99,3% câu hỏi đã mang sẵn số trang + text vùng bôi đen, đoạn chọn rỗng 0 lượt. Nền tảng đã có mọi thứ *trừ* đường truyền hình ảnh. A thêm đúng mảnh còn thiếu, không trùng lặp thứ đã có.
2. **Khảo sát (chuẩn A đạt):** 13/23 = 56,5% xác nhận đã gặp việc tutor không đọc được ảnh slide.
3. **Chi phí build thấp nhất** trong 3 ứng viên: một lời gọi vision ở đúng một quyết định, phần còn lại mock được; demo trọn 5 phút với 1 case chuẩn + 1 case chỗ khó.

⚠️ **Điểm yếu vẫn còn sau CP5:** mining không chứng minh được **tần suất** (4/1.261 lượt hỏi thẳng về hình). Validation xác nhận nhu cầu kiểm tra đúng vùng/đúng trang, nhưng chưa đủ để quy đổi thành số lần pain xảy ra mỗi tuần.

---

## §3. Giải pháp tương tự đã nghiên cứu

Nhóm đối chiếu ba flow gần nhất theo cùng một job: đưa tài liệu vào, chỉ phần chưa hiểu, nhận giải thích và kiểm tra căn cứ.

| Sản phẩm | Flow họ giải job này | Đáng học (quan sát cụ thể) | Đáng né | Mình khác gì ở lát cắt này |
|---|---|---|---|---|
| NotebookLM | Thêm nguồn → hỏi trong chat → mở citation để đối chiếu | Luôn kéo người dùng trở lại nguồn | Khó chỉ đúng một vùng hình ngay trên slide đang xem | Giải thích trực tiếp vùng được click/khoanh, không buộc rời VLearn |
| ChatGPT Study Mode | Tải tài liệu/ảnh → mô tả câu hỏi → trao đổi từng bước | Cách hỏi gợi mở và cho người học tự suy luận | Người học phải tự gửi lại ngữ cảnh và tự chỉ vùng cần hỏi | VLearn đã có trang và vùng chọn; prototype tận dụng ngữ cảnh đó tự động |
| AI Tutor VLearn hiện tại | Bôi text trên slide → gửi số trang + đoạn chọn → nhận trả lời | Tích hợp sẵn trong luồng học và có ngữ cảnh khóa học | 99,3% turn có text vùng chọn nhưng chưa có đường truyền ảnh của vùng | Giữ flow cũ, bổ sung ảnh crop, vùng nhận diện và bằng chứng trang |

---

## §4. Thiết kế

### Lát cắt MỘT CÂU

> **Học viên** **bấm vào một vùng hình ảnh trên một slide** · **AI tự nhận diện ranh giới vùng đó và giải thích riêng nó** theo ngữ cảnh bài học · trả về **lời giải thích kèm trích dẫn trang**.

Ba đường vào đều quy về "một vùng trên một trang", nên vẫn là một lát cắt:

| Đường vào | Cách cài đặt |
|---|---|
| **Click** (đường chính) | `ContentDetector` dò khối nội dung tại chỗ bấm — đúng chữ "AI tự nhận diện" |
| **Kéo khoanh tay** | Đường sửa khi máy dò không đúng ý (G9) |
| **Hỏi qua chat** *"giải thích slide 24"* | Lấy phần có nội dung của trang đó — **không chuyển màn hình** |

### Non-goals (KHÔNG build)

1. **Không** làm bài tập hộ / đưa đáp án — chỉ giải thích nội dung slide.
2. **Không** trả lời câu hỏi logistics (deadline, điểm, link nộp bài) — chuyển TA.
3. **Không** tóm tắt cả bài giảng, không trả lời câu hỏi cần đọc nhiều trang.
4. **Không** sinh quiz, không chấm bài, không theo dõi tiến độ học.
5. **Không** đăng nhập hoặc lưu lịch sử qua phiên; chỉ giữ tối đa 3 lượt chữ của đúng trang đang bàn trong phiên hiện tại.
6. **Không** upload file PDF đi đâu — file nằm nguyên trong trình duyệt.

### Giới hạn dữ liệu (ràng buộc cứng của tính năng)

AI Tutor **không được đọc hay chuyển đi cả tài liệu**. Mỗi câu hỏi chỉ mang đi đúng phần đang được hỏi:

| # | Giới hạn | Thực thi ở đâu |
|---|---|---|
| 1 | Tối đa **1 trang** cho một câu hỏi | `MAX_PAGES_PER_REQUEST` · `PdfSource.getPage()` chỉ nạp trang được hỏi |
| 2 | Ảnh gửi đi là **ảnh vùng đã cắt**, không phải ảnh cả trang | `Explain.buildPayload()` |
| 3 | Text chỉ lấy đoạn **nằm trong vùng chọn + lề 24px**, trần 1.200 ký tự | `Explain.buildPayload()` |
| 4 | Không gửi tên file, tổng số trang, nội dung trang khác | `Explain.buildPayload()` |
| 5 | Câu ngoài phạm vi bị chặn **trước** khi đóng gói → không có gì rời máy | `Explain.run()` |
| 6 | Mỗi câu trả lời kèm bảng **🔒 Đã gửi đi những gì** | `ExplainPanel.addDisclosure()` |
| 7 | Lịch sử hội thoại chỉ gửi **chữ**, chỉ của **đúng trang đang bàn**, tối đa 3 lượt | `App.historyFor()` + chặn lại ở `Explain.buildPayload()` |

`Explain.buildPayload()` là **chỗ duy nhất** dữ liệu rời khỏi máy học viên — soát một hàm đó là soát được toàn bộ đường dữ liệu đi ra. Đây cũng là câu trả lời cho lớp chỗ khó ③ ở mức dữ liệu, không chỉ mức nội dung.

### Mức prototype: **[ ] Sketch  [ ] Mock  [x] Working**

| Phần | Thật | Mock |
|---|---|---|
| Đọc PDF, rút text, phát hiện trang không có text layer (pdf.js) | ✅ | |
| Render trang → ảnh 1536px · khoanh vùng · cắt ảnh ở độ phân giải gốc | ✅ | |
| Thumbnail trang đã quét, sửa số trang, badge chế độ đọc | ✅ | |
| Guardrail ngoài phạm vi | ✅ | |
| Nạp slide deck thật từ data pack (nút trên header) | ✅ | |
| **Lời gọi vision sinh lời giải thích** | ✅ Gemini `gemini-3.1-flash-lite-preview` | mock vẫn giữ làm fallback và đối chiếu |
| Slide bài giảng | ✅ `d1`/`d2-slide-hackathon.pdf` | 3 slide SVG tự dựng chỉ để demo nhánh quét ảnh |

### Automation: **[x] augment**  [ ] conditional  [ ] automate

**Lý do theo cost-of-error:** sai một lời giải thích sơ đồ là **học viên học sai kiến thức ngay tại chỗ**, và họ không có cách nào biết mình vừa học sai — lời giải thích bịa nghe hợp lý y như lời giải thích đúng. Người chịu hậu quả là học viên; chi phí sửa cao vì phát hiện muộn (đến lúc làm bài mới lộ). Vì vậy AI **không được là nguồn sự thật cuối cùng**: mọi câu trả lời phải kèm căn cứ để học viên tự đối chiếu — chip trích dẫn trang, và với trang quét ảnh thì kèm luôn **thumbnail trang đã đọc**. Học viên vẫn là người quyết định tin hay không.

### §4b. Nguyên tắc đã áp dụng

| Nguyên tắc | Áp cụ thể vào đâu trong prototype |
|---|---|
| **G1** — Làm rõ hệ thống làm được gì | Dòng scope ngay header, là câu đầu tiên user thấy: *"Khoanh vùng trên slide, mình giải thích phần đó theo tài liệu buổi học — ngoài tài liệu mình sẽ nói rõ."* |
| **G2** — Làm rõ nó làm tốt đến đâu | Băng trạng thái trên slide hiện **trước khi** user hỏi: `📄 Trang này đọc được text (N ký tự)` hoặc `👁 Trang này không có lớp text — sẽ quét ảnh vùng bạn chọn`. Mỗi câu trả lời kèm badge chế độ đọc. |
| **G10** — Thu hẹp phạm vi khi nghi ngờ | Bấm vào chỗ trống hẳn → nói không nhận diện được, không đoán · máy dò ra dải mảnh (<1% diện tích trang) → hỏi lại · câu hỏi mơ hồ trên trang có nhiều sơ đồ → yêu cầu chỉ rõ vùng |
| **G11** — Giải thích vì sao | **Khung dò hiện ngay trên slide** — học viên thấy máy hiểu vùng nào trước khi đọc câu trả lời · chip trích dẫn trang · thumbnail trang đã đọc |
| **G9** — Sửa dễ dàng | **Kéo chuột khoanh tay** khi máy dò không đúng ý · nút *"Không phải trang này?"* (nhập lại số trang → đọc lại) · nút *"Giải thích đơn giản hơn"* |
| **G15** — Mời feedback chi tiết | 👎 kèm ô *"Sai chỗ nào?"*, không chỉ thumbs down trống |
| **G17** — Quyền kiểm soát tổng | Bảng **🔒 Đã gửi đi những gì** dưới mỗi câu trả lời · hỏi về slide khác **không tự chuyển màn hình**, học viên tự bấm *"↪ Đi tới slide N"* |
| **G12** — Nhớ tương tác gần | Câu hỏi tiếp (*"chi tiết hơn nữa"*) bám đúng vùng vừa hỏi thay vì hỏi lại *"slide nào"*; lịch sử chỉ gửi **chữ**, chỉ của **đúng trang đang bàn**, tối đa 3 lượt |

*Vị trí code cụ thể: [codebase/README.md](codebase/README.md).*

---

## §5. Kiểu lỗi — 4 lớp chỗ khó + kịch bản

### ① Nguồn sự thật — chỗ nào AI bịa được?

Ảnh mờ, chữ nhỏ, sơ đồ nhiều chi tiết. Model vision **luôn trả về một câu trả lời trôi chảy** kể cả khi không đọc được — đây là chỗ nguy hiểm nhất của lát cắt.

### ② Mơ hồ — input không đủ chắc

Vùng khoanh quá nhỏ, khoanh cắt ngang một sơ đồ, hoặc hỏi "cái này là gì" mà không chỉ ở đâu.

### ③ Ngoài phạm vi — user đòi gì mà không được phép làm

Hai mức. **Mức nội dung:** bấm vào đề bài rồi bảo "làm hộ"; hỏi deadline; hỏi điểm. **Mức dữ liệu:** câu hỏi kiểu *"đọc hết tài liệu rồi tóm tắt"* hoặc *"trang 5 nói gì, trang 9 nói gì"* — tính năng không được phép đọc nhiều trang, phải từ chối và yêu cầu hỏi từng trang.

### ④ Đặc thù domain — sai cái gì thì học viên học sai ngay

Đọc sai số liệu trên biểu đồ; đảo chiều logic của sơ đồ (nhánh Có ↔ Không); trộn lẫn hai khái niệm cạnh nhau trong bảng.

### Bảng kịch bản (14)

| # | Tình huống cụ thể | Lớp | Hành vi mong muốn (nói gì · hiện gì · cho user làm gì tiếp) | Nguyên tắc |
|---|---|---|---|---|
| 1 | Bấm vào vùng trống hẳn / lề slide | ① | Nói *"không nhận diện được nội dung nào"*, **không đoán**; gợi ý bấm vào sơ đồ/biểu đồ/đoạn chữ | G10 |
| 2 | Trang là ảnh scan, chữ nhỏ nhất không đọc rõ | ① | Giải thích phần đọc được, **nói thẳng chỗ không đọc rõ**; nhắc đối chiếu slide gốc | G2, G10 |
| 3 | Hỏi "số liệu này lấy từ đâu" mà slide không ghi nguồn | ① | Nói slide không ghi nguồn, không suy diễn ra một nguồn nghe hợp lý | G10, G11 |
| 4 | Bấm vào khe hẹp giữa hai hộp — máy dò ra một dải viền mảnh | ② | Dò được nhưng dưới 1% diện tích trang → **hỏi lại**, không đoán từ một dải viền | G10 |
| 5 | Gõ "giải thích cái sơ đồ đó" khi trang hiện tại có nhiều sơ đồ | ② | Dùng trang đang xem làm căn cứ nhưng hỏi lại là sơ đồ nào; gợi ý click/khoanh đúng vùng | G10 |
| 6 | Máy dò khoanh thiếu một nhánh của sơ đồ | ② | Học viên **thấy khung dò trên slide trước khi hỏi** → kéo khoanh tay lại được | G9, G11 |
| 7 | Bấm vào đề bài + "làm hộ bài tập này" | ③ | Từ chối, nêu lý do, chỉ hướng. **Chặn trước khi đóng gói → không có dữ liệu nào rời máy**, và nói rõ điều đó | G1, G17 |
| 8 | Hỏi "deadline nộp bài là bao giờ" | ③ | Từ chối trả lời logistics, chuyển Discord/TA — **tuyệt đối không đoán deadline** | G1 |
| 9 | "Đọc hết tài liệu rồi tóm tắt giúp mình" | ③ | Từ chối: tính năng chỉ đọc **1 trang/câu hỏi**; hướng dẫn hỏi từng trang | G1, G17 |
| 10 | Hỏi cột "46,2%" trên biểu đồ | ④ | Đọc **đúng con số**; sai số liệu = học sai ngay | G11 |
| 11 | Hỏi nhánh "Không" của sơ đồ điều kiện | ④ | Không đảo chiều logic Có/Không | G11 |
| 12 | Học viên gõ "slide 12" nhưng trong file PDF đó là trang 13 | ①④ | Trả lời **kèm thumbnail trang đã đọc** để user tự phát hiện lệch + nút *"Không phải trang này?"* | G9, G11 |
| 13 | Đang đọc slide 12, hỏi "giải thích slide 24" | ② | **Không kéo học viên rời slide 12**; trả lời về 24 kèm thumbnail + nút *"↪ Đi tới slide 24"* | G8, G17 |
| 14 | Học viên hỏi "mày gửi cái gì của tao đi rồi?" | ③ | Bảng **🔒 Đã gửi đi những gì** có sẵn dưới mọi câu trả lời: 1 trang, 1 ảnh vùng, N ký tự text trong vùng | G17 |

*Kịch bản nhóm sợ nhất khi demo: **#12** — đọc nhầm trang, câu trả lời sai hoàn toàn nhưng nghe hoàn toàn trơn tru. Đây là lý do thumbnail trang đã đọc là bắt buộc, không phải trang trí.*

---

## §6. Bốn đường đi của trải nghiệm

| Đường đi | Trong prototype |
|---|---|
| **Happy path** | Slide 12 → **bấm một phát** vào sơ đồ → máy khoanh trọn sơ đồ (đo được: 500×338 vs kích thước thật 495×335) → giải thích + chip trích dẫn `Trang 12 · [T02-118]` |
| **Low-confidence (②)** | Dò ra dải viền mảnh → hỏi lại · câu hỏi mơ hồ trên trang có nhiều sơ đồ → yêu cầu chỉ rõ vùng. Không kèm badge "đã đọc" khi chưa có căn cứ đủ chắc |
| **Failure / không căn cứ (①)** | Bấm vào vùng trống → *"không nhận diện được nội dung nào... mình sẽ không đoán bừa"* |
| **Correction (user sửa)** | **Kéo chuột khoanh tay** khi máy dò không đúng ý · *"Không phải trang này?"* → nhập trang khác → đọc lại giữ câu hỏi cũ · *"Giải thích đơn giản hơn"* · 👎 *"Sai chỗ nào?"* |
| **Bị đòi ngoài phạm vi (③)** | Guardrail chặn trước `buildPayload()` → từ chối + chỉ sang TA/Discord, và nói rõ **không có dữ liệu nào được gửi ra ngoài** |
| **Case đặc thù domain (④)** | Trang không có text layer → **quét ảnh vùng đã chọn** thay vì trả lời chay; badge `👁` + thumbnail trang đã đọc |
| **Kiểm soát dữ liệu (G17)** | Bảng **🔒 Đã gửi đi những gì** dưới mỗi câu trả lời · hỏi slide khác không tự chuyển màn hình |
| **Hỏi tiếp (G12)** | *"chi tiết hơn nữa"* → nối đúng vùng vừa hỏi + dòng *"Hiểu là bạn hỏi tiếp về vùng vừa rồi ở trang N"*. Chưa hỏi gì trước đó thì vẫn hỏi lại (②) |

---

## §7. Kiểm thử

### Chiều chất lượng — định nghĩa kiểm chứng được

| Chiều | Pass khi | Cách kiểm (người ngoài nhóm chấm ra cùng kết quả) |
|---|---|---|
| **G — Grounded** | Mọi thông tin chỉ được về một chỗ cụ thể trên vùng ảnh/text đã gửi | Người chấm chỉ tay vào chỗ tương ứng trên slide. Có 1 ý không chỉ được → fail |
| **S — Đúng vùng** | Nói về đúng vùng được khoanh, không mô tả cả trang | Có ≥2 câu nói về nội dung ngoài vùng khoanh → fail |
| **H — Trung thực khi không chắc** | Chỗ không đọc rõ / không có căn cứ thì nói thẳng | Có bất kỳ khẳng định nào không có trên ảnh → fail |
| **C — Trích dẫn đúng trang** | Số trang trích dẫn khớp trang thực sự được đọc | Đối chiếu chip trích dẫn với thumbnail trang đã quét → lệch = fail |

Các bảng `run-01.md`, `run-02.md` và `run-03.md` đã có verdict cuối cho bốn chiều G/S/H/C. Định nghĩa được giữ ổn định giữa các lượt; mỗi case fail đều có nguyên nhân và hành động tiếp theo. Repo hiện chưa tách riêng biên bản bất đồng giữa hai người chấm.

### Golden set

**55 case** trong [eval/cases.js](eval/cases.js), chạy bằng [eval/runner.html](eval/runner.html). Bộ case gồm:

- 28 case nền `C01–C28`, phủ bốn lớp ①②③④, case thường, hiếm, dò vùng và giới hạn dữ liệu.
- 14 case `L01–L14` lấy/phát triển từ chatlog thật, có mã hội thoại/turn để truy nguồn.
- 3 case hội thoại tiếp nối `F01–F03`.
- 6 case câu hỏi text thuần và ranh giới ngoài tài liệu `T01–T06`.
- 4 case trên PDF thật `P01–P04`.

### Quality bar — CHỐT TỪ 23:59 N1, GIỮ NGUYÊN SAU ĐÓ

```
Đạt khi ≥ 80% case qua cả 4 chiều (G/S/H/C),
VÀ không có case nào fail chiều H (trung thực khi không chắc).
```

Nhóm sử dụng **80%** làm ngưỡng đánh giá xuyên suốt và không hạ ngưỡng sau các lượt chạy. Điều kiện cứng H được giữ vì một câu giải thích bịa nhưng nghe hợp lý có thể khiến học viên học sai mà không tự phát hiện.

*Điều kiện cứng chọn H vì: bịa ra một lời giải thích nghe hợp lý cho sơ đồ là lỗi nguy hiểm nhất của lát cắt — học viên không có cách nào tự phát hiện.*

### Cách chạy

`eval/runner.html` chạy trọn bộ một lượt và xuất bảng markdown + traces. Máy chấm phần cơ học (kích thước vùng dò, số trang gửi đi, có từ chối/hỏi lại không); bốn chiều G/S/H/C vẫn chấm bằng người.

```bash
npx serve .            # hoặc: python -m http.server 8765
# mở http://localhost:PORT/eval/runner.html
```

### Kết quả các lượt chạy

| Lượt | Chế độ | Case | Máy chấm | G/S/H/C | Đạt bar? | File |
|---|---|---|---|---|---|---|
| 00 | **MOCK** | 32 | **100%** (55/55 điều kiện) | chưa chấm | — *(baseline, không tính R4)* | [eval/run-00-baseline-mock.md](eval/run-00-baseline-mock.md) |
| 01 | **AI THẬT** `gemini-flash-latest` | 32 | **82%** (45/55) · 23/32 case | Đã ghi verdict cuối | ❌ 72% case < 80% | [eval/run-01.md](eval/run-01.md) |
| **02** | **AI THẬT** `gemini-3.1-flash-lite-preview` | **46** | **95%** (72/76) · **43/46 case** | Đã ghi verdict cuối | ❌ còn fail guardrail `L12` | [eval/run-02.md](eval/run-02.md) |
| **03** | **AI THẬT** `gemini-3.1-flash-lite-preview` | **55** | **95%** (90/95) · **52/55 case** | Đã ghi verdict cuối | ❌ còn fail thật `C28`/`L10` | [eval/run-03.md](eval/run-03.md) |

Lượt 04 chưa chạy nên không ghi số dự kiến. Bản hiện tại giữ trung thực kết quả gần nhất: vượt ngưỡng phần trăm nhưng chưa đóng điều kiện an toàn vì còn hai lỗi guardrail.

**Lượt 01 — 9 case fail, tách hai loại:**

- **2 fail thật của sản phẩm** (C04, C25, cùng gốc): guard ② *"vùng quá nhỏ thì hỏi lại"* chỉ được cài trong nhánh mock, nên khi bật AI thật thì một dải viền 40×196px vẫn được gửi đi và model mô tả nó rất tự tin. **Đúng lỗi mà lớp ② phải chặn — golden set bắt được, chạy mock thì không bao giờ thấy.** Đã sửa: chuyển guard lên `Explain.run()` để áp cho cả hai chế độ.
- **7 nhiễu do quota 429** (23 lần gặp 429 trong một lượt): lời gọi lỗi → không có `disclosure`/`citation` để chấm. Đã sửa: giãn cách 7s, retry lùi dần 3 lần, và tách case `rateLimited` khỏi % để lỗi hạ tầng không bị đếm thành lỗi sản phẩm.

**Lượt 03 — 52/55 case (95%), 0 lần 429, 48 trace.** Trước khi chạy đã soát và sửa **ba lỗi của chính bộ test**, trong đó một lỗi che mất bug thật: điều kiện `refused` chỉ kiểm `grounded === false`, mà *hỏi lại* cũng `grounded === false` — nên lượt 02 báo `C28` "đạt" trong khi output thực tế là câu hỏi lại, không phải câu từ chối. Siết điều kiện thành so đúng chuỗi thì `C28` fail và lộ ra guardrail có lỗ thật (thiếu *"hết tài liệu"*, *"tóm tắt ý chính trong tài liệu này"*). **Một phần con số 93% của lượt 02 là ảo.**

Đã thay danh sách từ khoá bằng 3 nhánh regex bắt theo bản chất yêu cầu (8/8 câu phải chặn đều chặn, 10/10 câu hợp lệ không bị chặn oan), và chuyển guardrail lên chạy **trước** nhánh số trang — nếu không thì *"tóm tắt từ trang 1 đến trang 20"* sẽ trả lời về trang 1 và im lặng bỏ qua việc học viên đòi 20 trang.

**Độ trễ lượt 03 xấu hơn hẳn:** median 4.465ms, p90 **14.971ms**, max 26.948ms. Giả thuyết "prompt dài thêm" bị số liệu bác bỏ — prompt +29% nhưng output token *giảm*, và cùng cỡ output (175 vs 176 token) cho ra 1.420ms vs 13.855ms. Là **biến động phía server của model `-preview`**. Đây là **rủi ro demo**: nên đo lại trên bản stable trước CP6.

**Lượt 02 — 3 case fail:** 1 fail thật (`L12`: *"TẠO QUIZ… TOÀN BỘ SLIDE NÀY"*, nguyên văn từ chatlog `C0063/T0849` — sinh quiz là non-goal nhưng `OUT_OF_SCOPE_PATTERNS` không khớp từ khoá nào nên bị gửi thẳng cho model) + 2 lỗi soạn case (`L01`/`L02` toạ độ bấm rơi vào khoảng trắng). Các sửa này đã được lượt 03 xác nhận; lượt 03 tiếp tục phát hiện `C28`/`L10`.

**Vấn đề độ trễ ở lượt 01 đã hết sau khi đổi model.** Lượt 01 (`flash-latest`) median 7.182ms — chậm gấp 4 lần tutor hiện tại. Lượt 02 (`3.1-flash-lite`, đúng dòng model production) median **1.420ms**, p90 **4.171ms** — **nhanh hơn** tutor đang chạy (median 1.758ms, p90 3.686ms). Thêm được khả năng đọc hình mà không làm học viên chờ lâu hơn hiện tại.

**Giới hạn dữ liệu kiểm trên 30 trace thật:** 0 trace gửi >1 trang · 0 trace gửi tên file · text nhiều nhất 347 ký tự (trần 1.200) · vùng gửi đi median 22% diện tích trang.

**Failure đau nhất từ lượt 00:** trên slide thật có nhiều khoảng trắng, tỉ lệ dò trúng chỉ **3/15 và 4/15 điểm** ở hai trang đầu của `d1` (mật độ nội dung 4,2% và 6,1%); trang dày nội dung thì 15/15. Bán kính hút khối gần nhất đang quá nhỏ. **Không nới ngưỡng** vì sẽ phá case bấm-vào-vùng-trống (①). Hướng sửa: hai mức — gần thì trả lời, xa thì hỏi lại kèm khung dò, quá xa thì nhánh ①.

---

## §8. Phân công & validation CP5

Bảng thành viên đầy đủ: [README.md](README.md).

| Phần | Ai |
|---|---|
| Spec, điều phối và demo | Đặng Trung Kiên |
| Evidence (khảo sát + mining) | Hán Vũ Long |
| Prompt + golden set | Lê Quang Đức |
| Code — frontend & UX | Trần Duy Hoành |
| Code — AI call + trace | Lê Quang Đức |
| Validation CP5 | Đặng Trung Kiên và cả nhóm |

### Willing users (≥3 tên)

| # | Tên | Vai | Đã xác nhận? |
|---|---|---|---|
| 1 | Minh Anh | Sinh viên năm 3 | ✅ |
| 2 | Huy | Học viên đi làm | ✅ |
| 3 | Quân | Học viên lớp tối | ✅ |

**Kết quả validation CP5:** 5 người ngoài nhóm × khoảng 10 phút, gồm 3 willing user từ CP1. Task chính là dùng prototype để hiểu sơ đồ/biểu đồ, sau đó trả lời ba câu về điểm khó chịu, mức tin và ý định sử dụng. Log task, quan sát và quote: [validation/feedback-log.md](validation/feedback-log.md).

- Minh Anh: *"Nếu không phóng to thì em không dám tin."*
- Huy: *"Có số trang thì em tin hơn nhiều."*
- Quân: *"Cái này đúng, vì đoạn em bấm bé quá."*
- Mai: *"Em không thích khi nó trả lời kiểu vòng vòng."*
- Linh: *"Có highlight rồi thì dễ hiểu hơn hẳn."*

### Multi-prototype

Không tách thành hai prototype riêng ở CP5. Nhóm kiểm trực tiếp hai trạng thái trong cùng flow: **đủ căn cứ → trả lời ngay** và **vùng quá nhỏ/mơ hồ → hỏi lại**. Lý do là quyết định này phụ thuộc chất lượng vùng đầu vào, không phải sở thích giao diện.

---

## §9. Changelog

| Thời điểm | Đổi gì | Vì sao (trỏ về feedback/case nào) |
|---|---|---|
| Sau lượt 01 | Chuyển guard vùng quá nhỏ lên `Explain.run()` để áp cho cả mock và AI thật | `C04`/`C25`: AI thật từng gửi một dải 40×196px và đoán thay vì hỏi lại |
| Sau lượt 02 | Mở rộng rồi tái cấu trúc guardrail yêu cầu quiz/tóm tắt cả tài liệu | `L12`, sau đó `C28`/`L10` cho thấy nối thêm từ khóa là chưa đủ |
| CP5 | Giữ thumbnail, chip trang và highlight vùng; không thêm điểm confidence tổng quát | Minh Anh và Huy chỉ tin hơn khi kiểm được đúng vùng/đúng trang; điểm tổng quát dễ tạo niềm tin giả |
| CP5 | Chuẩn hóa hướng dẫn vùng nhỏ thành hành động cụ thể: *"Khoanh rộng hơn một chút"* | Quân xác nhận hỏi lại là hợp lý khi vùng bấm quá bé |
| CP5 | Đưa mini-map trang dài và lịch sử theo trang vào backlog | Nhu cầu có thật nhưng không cần cho lát cắt demo hiện tại |
