# AI SPEC — AI Tutor giải thích vùng slide · Nhóm [XX] · Zone B8

Hướng: **[x] A — VLearn**  [ ] B — Trợ lý Học viên  [ ] C — Làn mở
Loại: **[x] Tối ưu tính năng có sẵn**  [ ] Tính năng mới

> ⚠️ **BẢN ĐANG VIẾT.** Ô ⬜ là phần chưa xong. **Hạn cứng: commit trước 23:59 ngày 1 — quality bar §7 chốt từ thời điểm đó và giữ nguyên sau đó.**

---

## §1. User & Job

**Job executor:** Học viên khoá AI Thực Chiến đang tự xem lại bài giảng — trong buổi học (bôi đoạn tài liệu hỏi tutor) và sau buổi học (ôn lại slide).

⬜ *Đính kèm worksheet JTBD / ảnh sơ đồ job map.*

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

Đạt ngưỡng chuẩn A: n ≥ 20 ✅ · ≥50% xác nhận ✅ · ⬜ **log nguyên văn từng câu trả lời còn thiếu**

**Chuẩn B — mining chatlog** *(nguồn: `data/vlearn-pack/chatlog/`, 1.261 turn, 369 user, 22–29/07/2026)*

| Số đo | Giá trị | Phương pháp đếm |
|---|---|---|
| Lượt trả lời tutor có `citations` rỗng | **46,2%** | Đếm dòng `role = tutor` có `citations = []` chia tổng dòng tutor (1.261) |
| Trường `misconceptions` từng được dùng | **0 / 1.261** | Đếm dòng có `misconceptions ≠ []` |
| Tutor chủ động hỏi lại kiểm tra hiểu bài | **3 / 2.522** | Đếm `asked_check_question = True` |
| ⬜ Lượt học viên hỏi về sơ đồ/hình/biểu đồ | ⬜ | ⬜ **CẦN ĐẾM** — lọc `role = student`, `content` chứa {sơ đồ, biểu đồ, hình, ảnh, bảng, mô hình...}; đọc tay 30–50 mẫu trước để chốt tiêu chí, rồi đếm |
| ⬜ Trong số đó, bao nhiêu lượt tutor trả lời không có `citations` | ⬜ | ⬜ **CẦN ĐẾM** — đây là con số trúng đích nhất cho pain này |

**≥5 quote/ví dụ nguyên văn + nguồn:** ⬜ **CẦN LÀM** — lấy từ khảo sát (`docs/survey-log.md`) và/hoặc chatlog (ghi mã `C0xxx`/`T0xxx`, không dán nguyên văn dài).

1. ⬜
2. ⬜
3. ⬜
4. ⬜
5. ⬜

---

## §2. Impact & quyết định chọn

### Bảng impact — 3 ứng viên

| Ứng viên | Bao nhiêu người gặp | Tần suất | Mỗi lần tốn gì | Build nổi trong sự kiện? | Chọn? |
|---|---|---|---|---|---|
| **A. Giải thích vùng hình trên slide** | 13/23 (56,5%) đã gặp | ⬜ *đo: mỗi buổi mấy lần* | Bỏ qua phần hình → hổng kiến thức trực quan; hoặc ⬜ *___ phút* tự tra | ✅ — 1 AI call vision, không cần hạ tầng mới | ✅ **CHỌN** |
| **B. Bắt tutor luôn trích dẫn trang** | 46,2% lượt trả lời không có nguồn (mining) | Mỗi lượt hỏi | Không kiểm lại được → tin sai hoặc mất công tự tra | ⚠️ — phải sửa pipeline retrieval của tutor, ngoài tầm 1,5 ngày | ❌ |
| **C. Tutor chủ động kiểm tra hiểu bài** | `asked_check_question` chỉ 3/2.522 → gần như chưa có | Cuối mỗi buổi | Học viên tưởng hiểu nhưng không hiểu — phát hiện muộn | ✅ — nhưng cần định nghĩa "hiểu thật", tốn vòng thiết kế | ❌ |

### Ứng viên đã loại + vì sao

**B — Bắt tutor luôn trích dẫn trang.** Con số mining mạnh nhất (46,2%, đếm được, kiểm lại được) nhưng nguyên nhân nằm ở tầng retrieval của tutor hiện tại, không phải ở tầng trả lời. Sửa đúng chỗ đó là việc của team kỹ thuật VLearn, không demo được trong 5 phút. *Giữ lại làm bối cảnh cho A: một phần của 46,2% này chính là các slide dạng ảnh không rút được text — A xử lý đúng phần đó.*

**C — Tutor chủ động kiểm tra hiểu bài.** Khả thi về kỹ thuật, nhưng "hiểu thật" là một chiều chất lượng khó định nghĩa kiểm chứng được trong 1,5 ngày; nguy cơ golden set toàn case cảm tính.

### Ứng viên chọn + vì sao (bằng số)

**A** — vì đồng thời có **cả hai chuẩn evidence**: 56,5% người khảo sát xác nhận đã gặp (chuẩn A) và pain nằm trong vùng 46,2% trả lời không nguồn (chuẩn B). Chi phí build thấp nhất trong 3 ứng viên: một lời gọi vision ở đúng một quyết định, phần còn lại mock được. Và nó demo được trọn 5 phút với một case chuẩn + một case chỗ khó.

---

## §3. Giải pháp tương tự đã nghiên cứu

⬜ **CẦN LÀM** — mỗi thành viên dùng thử 1 sản phẩm, 15 phút, trả lời đúng 4 câu (guide §2.2).

| Sản phẩm | Flow họ giải job này | Đáng học (quan sát cụ thể) | Đáng né | Mình khác gì ở lát cắt này |
|---|---|---|---|---|
| NotebookLM | ⬜ | ⬜ | ⬜ | ⬜ |
| ChatGPT study mode | ⬜ | ⬜ | ⬜ | ⬜ |
| ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

---

## §4. Thiết kế

### Lát cắt MỘT CÂU

> **Học viên** chọn **một vùng hình ảnh trên một slide** · **AI nhận diện và giải thích riêng vùng đó** theo ngữ cảnh bài học · trả về **lời giải thích kèm trích dẫn trang**.

Hỏi qua chat *"giải thích slide 24"* được cài đặt là **khoanh trọn trang** — cùng một đường code, không phải lát cắt thứ hai.

### Non-goals (KHÔNG build)

1. **Không** làm bài tập hộ / đưa đáp án — chỉ giải thích nội dung slide.
2. **Không** trả lời câu hỏi logistics (deadline, điểm, link nộp bài) — chuyển TA.
3. **Không** tóm tắt cả slide / cả bài giảng — chỉ đúng vùng được khoanh.
4. **Không** sinh quiz, không chấm bài, không theo dõi tiến độ học.
5. **Không** deploy, không đăng nhập, không lưu lịch sử hội thoại.

### Mức prototype: **[ ] Sketch  [x] Mock  [ ] Working**

| Phần | Thật | Mock |
|---|---|---|
| Đọc PDF, rút text, phát hiện trang không có text layer (pdf.js) | ✅ | |
| Render trang → ảnh 1536px · khoanh vùng · cắt ảnh ở độ phân giải gốc | ✅ | |
| Thumbnail trang đã quét, sửa số trang, badge chế độ đọc | ✅ | |
| Guardrail ngoài phạm vi | ✅ | |
| **Lời gọi vision sinh lời giải thích** | ⬜ *CP3* | ⚠️ hiện là `MockAI.route()` |
| Slide bài giảng | | ⚠️ 3 slide SVG tự dựng |

### Automation: **[x] augment**  [ ] conditional  [ ] automate

**Lý do theo cost-of-error:** sai một lời giải thích sơ đồ là **học viên học sai kiến thức ngay tại chỗ**, và họ không có cách nào biết mình vừa học sai — lời giải thích bịa nghe hợp lý y như lời giải thích đúng. Người chịu hậu quả là học viên; chi phí sửa cao vì phát hiện muộn (đến lúc làm bài mới lộ). Vì vậy AI **không được là nguồn sự thật cuối cùng**: mọi câu trả lời phải kèm căn cứ để học viên tự đối chiếu — chip trích dẫn trang, và với trang quét ảnh thì kèm luôn **thumbnail trang đã đọc**. Học viên vẫn là người quyết định tin hay không.

### §4b. Nguyên tắc đã áp dụng

| Nguyên tắc | Áp cụ thể vào đâu trong prototype |
|---|---|
| **G1** — Làm rõ hệ thống làm được gì | Dòng scope ngay header, là câu đầu tiên user thấy: *"Khoanh vùng trên slide, mình giải thích phần đó theo tài liệu buổi học — ngoài tài liệu mình sẽ nói rõ."* |
| **G2** — Làm rõ nó làm tốt đến đâu | Băng trạng thái trên slide hiện **trước khi** user hỏi: `📄 Trang này đọc được text (N ký tự)` hoặc `👁 Trang này không có lớp text — sẽ quét ảnh`. Mỗi câu trả lời kèm badge chế độ đọc. |
| **G10** — Thu hẹp phạm vi khi nghi ngờ | Vùng chọn < 2500px² → hỏi lại thay vì đoán · hỏi qua chat không nêu số slide → hỏi lại là slide nào · vùng chọn không trúng nội dung nào → nói không nhận diện được |
| **G11** — Giải thích vì sao | Chip trích dẫn trang cạnh câu trả lời · với chế độ quét: **thumbnail trang đã đọc** để user tự kiểm mình đang đọc đúng trang không |
| **G9** — Sửa dễ dàng | Nút *"Không phải trang này?"* (nhập lại số trang → đọc lại) · nút *"Giải thích đơn giản hơn"* ngay trên output |
| **G15** — Mời feedback chi tiết | 👎 kèm ô *"Sai chỗ nào?"*, không chỉ thumbs down trống |

*Vị trí code cụ thể: [codebase/README.md](codebase/README.md).*

---

## §5. Kiểu lỗi — 4 lớp chỗ khó + kịch bản

### ① Nguồn sự thật — chỗ nào AI bịa được?

Ảnh mờ, chữ nhỏ, sơ đồ nhiều chi tiết. Model vision **luôn trả về một câu trả lời trôi chảy** kể cả khi không đọc được — đây là chỗ nguy hiểm nhất của lát cắt.

### ② Mơ hồ — input không đủ chắc

Vùng khoanh quá nhỏ, khoanh cắt ngang một sơ đồ, hoặc hỏi "cái này là gì" mà không chỉ ở đâu.

### ③ Ngoài phạm vi — user đòi gì mà không được phép làm

Khoanh vào đề bài rồi bảo "làm hộ"; hỏi deadline; hỏi điểm.

### ④ Đặc thù domain — sai cái gì thì học viên học sai ngay

Đọc sai số liệu trên biểu đồ; đảo chiều logic của sơ đồ (nhánh Có ↔ Không); trộn lẫn hai khái niệm cạnh nhau trong bảng.

### Bảng kịch bản (10)

| # | Tình huống cụ thể | Lớp | Hành vi mong muốn (nói gì · hiện gì · cho user làm gì tiếp) | Nguyên tắc |
|---|---|---|---|---|
| 1 | Khoanh vùng trống / lề slide | ① | Nói *"không nhận diện được nội dung nào"*, **không đoán**; gợi ý chọn lại vào sơ đồ/biểu đồ/đoạn chữ | G10 |
| 2 | Trang là ảnh scan, chữ nhỏ nhất không đọc rõ | ① | Giải thích phần đọc được, **nói thẳng chỗ không đọc rõ**; nhắc đối chiếu slide gốc | G2, G10 |
| 3 | Hỏi "số liệu này lấy từ đâu" mà slide không ghi nguồn | ① | Nói slide không ghi nguồn, không suy diễn ra một nguồn nghe hợp lý | G10, G11 |
| 4 | Vùng chọn ~30×20px | ② | Hỏi lại: *"vùng hơi nhỏ, bạn kéo rộng ra một chút"* — không đoán | G10 |
| 5 | Gõ "giải thích cái sơ đồ đó" không nêu slide | ② | Hỏi lại đang nói slide nào, gợi ý cách chỉ định (số slide hoặc khoanh vùng) | G10 |
| 6 | Khoanh cắt ngang sơ đồ, mất một nhánh | ② | Giải thích phần thấy được **+ báo rõ vùng chọn đang cắt mất một nhánh** | G2, G11 |
| 7 | Khoanh đề bài + "làm hộ bài tập này" | ③ | Từ chối, nêu lý do, chỉ hướng: giải thích vùng đang kẹt, hoặc hỏi TA. **Không quét trang** (tiết kiệm token) | G1 |
| 8 | Hỏi "deadline nộp bài là bao giờ" | ③ | Từ chối trả lời logistics, chuyển Discord/TA — **tuyệt đối không đoán deadline** | G1 |
| 9 | Hỏi cột "46,2%" trên biểu đồ | ④ | Đọc **đúng con số**; sai số liệu = học sai ngay | G11 |
| 10 | Hỏi nhánh "Không" của sơ đồ điều kiện | ④ | Không đảo chiều logic Có/Không | G11 |
| 11 | Học viên gõ "slide 12" nhưng trong file PDF đó là trang 13 | ①④ | Trả lời **kèm thumbnail trang đã đọc** để user tự phát hiện lệch + nút *"Không phải trang này?"* | G9, G11 |

*Kịch bản nhóm sợ nhất khi demo: **#11** — quét nhầm trang, câu trả lời sai hoàn toàn nhưng nghe hoàn toàn trơn tru. Đây là lý do thumbnail trang đã quét là bắt buộc, không phải trang trí.*

---

## §6. Bốn đường đi của trải nghiệm

| Đường đi | Trong prototype |
|---|---|
| **Happy path** | Slide 12 → khoanh trọn sơ đồ → giải thích + chip trích dẫn `Trang 12 · [T02-118]` |
| **Low-confidence (②)** | Vùng chọn quá nhỏ → hỏi lại · hỏi qua chat không nêu slide → hỏi lại. Không kèm badge "đã đọc" vì thực chất chưa đọc |
| **Failure / không căn cứ (①)** | Vùng trống → *"không nhận diện được nội dung nào... mình sẽ không đoán bừa"* |
| **Correction (user sửa)** | Nút *"Không phải trang này?"* → nhập trang khác → đọc lại giữ nguyên câu hỏi cũ · nút *"Giải thích đơn giản hơn"* · 👎 *"Sai chỗ nào?"* |
| **Bị đòi ngoài phạm vi (③)** | Guardrail chặn trước khi render → từ chối + chỉ sang TA/Discord |
| **Case đặc thù domain (④)** | Trang không có text layer → **quét ảnh trang** thay vì trả lời chay; badge `👁` + thumbnail trang đã quét |

---

## §7. Kiểm thử

### Chiều chất lượng — định nghĩa kiểm chứng được

| Chiều | Pass khi | Cách kiểm (người ngoài nhóm chấm ra cùng kết quả) |
|---|---|---|
| **G — Grounded** | Mọi thông tin chỉ được về một chỗ cụ thể trên vùng ảnh/text đã gửi | Người chấm chỉ tay vào chỗ tương ứng trên slide. Có 1 ý không chỉ được → fail |
| **S — Đúng vùng** | Nói về đúng vùng được khoanh, không mô tả cả trang | Có ≥2 câu nói về nội dung ngoài vùng khoanh → fail |
| **H — Trung thực khi không chắc** | Chỗ không đọc rõ / không có căn cứ thì nói thẳng | Có bất kỳ khẳng định nào không có trên ảnh → fail |
| **C — Trích dẫn đúng trang** | Số trang trích dẫn khớp trang thực sự được đọc | Đối chiếu chip trích dẫn với thumbnail trang đã quét → lệch = fail |

⬜ **Test độ rõ:** hai thành viên chấm độc lập cùng 5 output rồi so. Ghi kết quả: ai chấm, lệch mấy case, sửa định nghĩa nào.

### Golden set

22 case — file: [eval/golden-set.md](eval/golden-set.md). Cơ cấu: ①×3 · ②×3 · ③×2 · ④×3 · thường×8 · hiếm×3.
⬜ **Còn thiếu: ≥10 case lấy/phát triển từ chatlog thật** (hiện 0).

### Quality bar — CHỐT TỪ 23:59 N1, GIỮ NGUYÊN SAU ĐÓ

```
⬜ ĐIỀN SỐ TRƯỚC 23:59:

Đạt khi ≥ ___% case qua cả 4 chiều (G/S/H/C),
VÀ không có case nào fail chiều H (trung thực khi không chắc).
```

*Điều kiện cứng chọn H vì: bịa ra một lời giải thích nghe hợp lý cho sơ đồ là lỗi nguy hiểm nhất của lát cắt — học viên không có cách nào tự phát hiện.*

### Kết quả các lượt chạy

| Lượt | Thời điểm | % qua bộ | Đạt bar? | File |
|---|---|---|---|---|
| 01 | ⬜ | ⬜ | ⬜ | [eval/run-01.md](eval/run-01.md) |

---

## §8. Phân công & kế hoạch

⬜ **Điền tên** — bảng đầy đủ ở [README.md](README.md).

| Phần | Ai |
|---|---|
| Spec | ⬜ |
| Evidence (khảo sát + mining) | ⬜ |
| Prompt + golden set | ⬜ |
| Code — frontend | ⬜ |
| Code — AI call + trace | ⬜ |
| Demo | ⬜ |

### Willing users (≥3 tên)

⬜ *Từ 5–8 người trong 23 người đã khảo sát.* Danh sách: [docs/survey-log.md](docs/survey-log.md)

| # | Tên | Vai | Đã xác nhận? |
|---|---|---|---|
| 1 | ⬜ | | ⬜ |
| 2 | ⬜ | | ⬜ |
| 3 | ⬜ | | ⬜ |

**Kế hoạch vòng validation CP5:** 5 người × 10 phút. 3 câu hỏi cố định (guide §4.2) + 3 câu riêng cho nhánh quét ảnh — xem [validation/feedback-log.md](validation/feedback-log.md). Người log: ⬜

### Multi-prototype

⬜ *Nếu làm: trục khác biệt của ≥2 phương án + lý do chọn. Trục đề xuất: **AI trả lời ngay khi khoanh vùng** vs **hỏi lại xem học viên muốn biết gì trước khi trả lời**.*

---

## §9. Changelog

| Thời điểm | Đổi gì | Vì sao (trỏ về feedback/case nào) |
|---|---|---|
| ⬜ | | |

*(Bắt buộc có ≥1 thay đổi từ feedback vòng validation, hoặc ghi rõ lý do giữ nguyên có căn cứ — R6, 4 điểm.)*
