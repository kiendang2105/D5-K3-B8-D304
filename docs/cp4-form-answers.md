# Đáp án form nộp CP4 (Rà soát Specification)

*Hạn nộp form: 17:30 ngày 1 (K3). Hạn cứng commit `spec.md`: 23:59 ngày 1.*
*Mọi con số dẫn về một file trong repo để TA mở kiểm lại.*

---

## Q1. Nhóm bạn là khóa bao nhiêu?

> **Khóa 3**

---

## Q2. Lớp (lớp labcode, không phải lớp lý thuyết)

> **D304**

Lấy từ tên repo `K3-D304-AI-Product-Hackathon-B8`. Bạn tự xác nhận lại cho chắc.

---

## Q3. Họ và tên + Mã HV của nhóm trưởng

> ⬜ **Tôi không biết, bạn tự điền.**

Mã này là mã định danh nhóm xuyên suốt các checkpoint, nên điền sai một lần là lệch cả chuỗi. Sau khi điền, nhớ đưa luôn vào bảng phân công trong `README.md` (R7 cho 1 điểm).

---

## Q4. Bằng chứng của nhóm thuộc loại nào?

> **B, Đã phân tích dữ liệu**

Nhóm thực ra có **cả hai**, nhưng chọn B vì bằng chứng B đã hoàn chỉnh trong repo, còn A thì chưa:

| Loại | Trạng thái |
|---|---|
| **B, mining dữ liệu** | ✅ Xong. Số đếm được, phương pháp đếm viết rõ, script chạy lại được: [docs/mining-log.md](mining-log.md) và [docs/mining.py](mining.py) |
| **A, khảo sát người thật** | ⚠️ Có số (13/23 và 11/23) nhưng **chưa có log nguyên văn** từng câu trả lời. Rubric R1 ghi rõ: không có log thì không được tính là bằng chứng |

**Nếu form cho chọn nhiều thì chọn cả A và B.** Nếu chỉ chọn được một thì chọn B, và phải điền [docs/survey-log.md](survey-log.md) trước khi nộp bài cuối, vì 6/15 điểm R1 đang bị chặn ở đó.

---

## Q5. Con số bằng chứng mạnh nhất và cách tạo ra nó

*(đoạn văn, tối thiểu 100 ký tự)*

> **99,3% câu hỏi học viên gửi cho AI Tutor (1.252 trên 1.261 lượt) đã mang sẵn tiền tố có cấu trúc `(Trang N, đoạn được chọn: "...")`, và số lượt có đoạn chọn rỗng là 0.**
>
> Cách tạo ra: đọc trực tiếp file `data/vlearn-pack/chatlog/chat_history_anonymized_for_hackathon.csv` (2.522 dòng, ghép theo `turn_id` thành 1.261 cặp hỏi và đáp), rồi khớp regex `^\(Trang\s*(\d+),\s*đoạn được chọn:\s*"(.*?)"\)\s*(.*)$` trên cột `content` của các dòng `role = student`. Script chạy lại được: `docs/mining.py`, chỉ đọc, không sửa dữ liệu.
>
> Vì sao đây là con số thuyết phục nhất: nó chứng minh VLearn **không thiếu** khả năng biết học viên đang chọn phần nào. Nền tảng đã truyền cả số trang và text của vùng bôi đen. Cái thiếu là **đường truyền hình ảnh**: bôi đen một sơ đồ thì text lấy được chỉ là dòng caption, còn nội dung nằm trong hình mất hẳn. Ví dụ điển hình là hội thoại `C0302/T0611`, học viên bôi đúng caption *"Mô hình Double Diamond, Don Norman / British Design Council 2005"* rồi hỏi *"giải thích hình ảnh này"*. Nhóm bổ sung đúng mảnh còn thiếu đó, không làm lại thứ đã có.
>
> Con số phụ, cùng nguồn: 46,2% lượt trả lời của tutor có trường `citations` rỗng (582 trên 1.261), tức gần một nửa câu trả lời học viên không kiểm lại được.
>
> **Ghi trung thực một số bất lợi:** đếm theo tiêu chí chặt thì chỉ có 4 trên 1.261 lượt hỏi thẳng về một đối tượng trực quan (0,3%). Nghĩa là mining **không chứng minh được tần suất** của pain, chỉ chứng minh nó tồn tại và chứng minh chỗ hổng kiến trúc. Đã ghi rõ trong `spec.md` mục 1 và 2, và cột *tần suất* trong bảng impact để trống thay vì bịa.

---

## Q6. Nhóm đã cân nhắc những ý tưởng nào? Vì sao chọn ý tưởng này?

*(bắt buộc, đoạn văn)*

> Nhóm cân nhắc 3 ứng viên, tất cả đều bắt đầu từ số đo trong chatlog thật:
>
> **A. Giải thích vùng hình trên slide (CHỌN).** Học viên bấm vào một sơ đồ hoặc biểu đồ, AI đọc đúng vùng đó rồi giải thích, kèm trích dẫn trang.
>
> **B. Bắt tutor luôn trích dẫn trang (LOẠI).** Đây là ứng viên có con số mạnh nhất: 46,2% lượt trả lời không có nguồn nào. Loại vì nguyên nhân nằm ở tầng retrieval của tutor hiện tại, không nằm ở tầng trả lời. Sửa đúng chỗ đó là việc của team kỹ thuật VLearn, không build và demo được trong 1,5 ngày.
>
> **C. Tutor chủ động kiểm tra hiểu bài (LOẠI).** Trường `asked_check_question` chỉ bằng True ở 3 trên 2.522 dòng, tức gần như chưa từng dùng. Khả thi về kỹ thuật, nhưng "hiểu thật" là chiều chất lượng rất khó định nghĩa kiểm chứng được trong 1,5 ngày, dễ dẫn tới golden set toàn case cảm tính.
>
> **Vì sao chọn A, xếp theo độ mạnh của bằng chứng:**
>
> 1. **Bằng chứng kiến trúc, mạnh nhất và đếm được:** 99,3% câu hỏi đã mang sẵn số trang và text vùng bôi đen, 0 lượt đoạn chọn rỗng. Nền tảng có đủ mọi thứ trừ đường truyền hình ảnh. A bổ sung đúng mảnh còn thiếu.
> 2. **Khảo sát:** 13 trên 23 người (56,5%) xác nhận đã gặp việc AI Tutor không đọc được ảnh slide.
> 3. **Chi phí build thấp nhất trong 3 ứng viên:** một lời gọi vision ở đúng một quyết định, phần còn lại mock được, và demo trọn trong 5 phút với một case chuẩn cộng một case chỗ khó.
>
> **Điểm yếu đã biết của lựa chọn này, ghi để không ai đọc spec mà tưởng bằng chứng chắc hơn thực tế:** mining không chứng minh được tần suất, chỉ 4 trên 1.261 lượt hỏi thẳng về hình. Có hai cách đọc chưa phân biệt được: (1) pain thật nhưng vô hình trong log vì học viên thử một lần thấy không được rồi thôi, log chỉ ghi những gì người ta còn hỏi chứ không ghi những gì người ta đã bỏ; (2) pain nhỏ. Cách phân biệt: ở vòng validation CP5 hỏi đúng câu *"lần gần nhất bạn gặp một hình trong slide mà không hiểu, bạn có thử hỏi tutor không, nếu không thì vì sao"*. Nếu câu trả lời cho thấy học viên chưa từng nghĩ đến việc hỏi tutor về hình thì ứng viên C đáng xem lại.

---

## Q7. Bốn kiểu tình huống khó của sản phẩm

*(bắt buộc, đoạn văn, tối thiểu 200 ký tự)*

> **Lớp 1, Nguồn sự thật (chỗ AI bịa được).** Ảnh mờ, chữ nhỏ, sơ đồ nhiều chi tiết. Model vision **luôn** trả về một câu trả lời trôi chảy kể cả khi không đọc được gì, và học viên không có cách nào tự biết. Đây là chỗ nguy hiểm nhất của lát cắt. Hành vi bắt buộc: đọc không rõ thì nói thẳng là không đọc rõ; bấm vào vùng trống thì nói không nhận diện được nội dung nào và không đoán.
>
> **Lớp 2, Mơ hồ hoặc thiếu thông tin.** Vùng chọn quá nhỏ, bấm vào khe hẹp giữa hai hộp nên máy dò ra một dải viền mảnh, hoặc câu hỏi dùng đại từ mà không chỉ rõ ("cái sơ đồ đó" khi trang có hai sơ đồ). Hành vi bắt buộc: vùng dưới 1% diện tích trang thì hỏi lại, không gửi đi và không đoán.
>
> **Lớp 3, Ngoài phạm vi hoặc ngoài thẩm quyền.** Có hai mức. Mức nội dung: bấm vào đề bài rồi bảo "làm hộ", đòi đáp án, đòi sinh quiz, hỏi deadline hoặc điểm số. Mức dữ liệu: đòi "đọc hết tài liệu rồi tóm tắt" hoặc "tóm tắt từ trang 1 đến trang 44", tức vượt giới hạn 1 trang cho một câu hỏi. Hành vi bắt buộc: từ chối trước khi đóng gói dữ liệu, nên không có gì rời khỏi máy, và nói rõ điều đó cho học viên.
>
> **Lớp 4, Đặc thù domain (sai là học viên học sai ngay).** Đọc sai số liệu trên biểu đồ, đảo chiều logic của sơ đồ điều kiện (nhánh Có thành nhánh Không), trộn lẫn hai khái niệm nằm cạnh nhau trong bảng, hoặc đọc nhầm trang vì số in trên slide lệch với chỉ số trang trong file PDF.
>
> **Kịch bản nhóm sợ nhất khi demo là đọc nhầm trang:** câu trả lời sai hoàn toàn nhưng nghe hoàn toàn trơn tru. Vì vậy mỗi câu trả lời đều bắt buộc kèm ảnh thu nhỏ của trang đã đọc và nút *"Không phải trang này?"*.
>
> Bảng đầy đủ 14 kịch bản kèm hành vi mong muốn và nguyên tắc áp dụng: `spec.md` mục 5. Golden set 55 case phủ cả 4 lớp (lớp 1: 7 case, lớp 2: 8, lớp 3: 6, lớp 4: 5): [eval/golden-set.md](../eval/golden-set.md).

---

## Q8. Nhóm áp dụng nguyên tắc thiết kế nào? Ở đâu?

*(bắt buộc, đoạn văn, tối thiểu 200 ký tự)*

> Chín nguyên tắc HAX, mỗi cái chỉ được ra một chỗ cụ thể trong prototype:
>
> **G1, làm rõ hệ thống làm được gì.** Dòng phạm vi nằm ngay header, là câu đầu tiên học viên thấy: *"Khoanh vùng trên slide, mình giải thích phần đó theo tài liệu buổi học, ngoài tài liệu mình sẽ nói rõ."*
>
> **G2, làm rõ nó làm tốt đến đâu.** Băng trạng thái trên slide hiện **trước khi** học viên hỏi: `Trang này đọc được text (N ký tự)` hoặc `Trang này không có lớp text, sẽ quét ảnh vùng bạn chọn`. Mỗi câu trả lời kèm badge chế độ đọc.
>
> **G8, gạt bỏ dễ dàng.** Bấm ra chỗ khác là đổi vùng chọn. Không có bước nào chặn flow để chờ AI.
>
> **G9, sửa dễ dàng.** Kéo chuột khoanh tay khi máy dò không đúng ý. Nút *"Không phải trang này?"* để nhập lại số trang rồi đọc lại. Nút *"Giải thích đơn giản hơn"* ngay trên output.
>
> **G10, thu hẹp phạm vi khi nghi ngờ.** Bấm vào chỗ trống hẳn thì nói không nhận diện được. Máy dò ra dải mảnh dưới 1% diện tích trang thì hỏi lại. Cả hai đều không gửi dữ liệu đi.
>
> **G11, giải thích vì sao.** Khung dò hiện ngay trên slide nên học viên thấy máy hiểu vùng nào **trước khi** đọc câu trả lời. Thêm chip trích dẫn trang, ảnh thu nhỏ trang đã đọc, và nút *"Vùng này ở đâu?"* nháy sáng lại đúng vùng trên slide.
>
> **G12, nhớ tương tác gần.** Câu hỏi tiếp kiểu *"chi tiết hơn nữa"* bám đúng vùng vừa hỏi thay vì hỏi lại *"slide nào"*. Lịch sử chỉ gửi chữ, chỉ của đúng trang đang bàn, tối đa 3 lượt.
>
> **G15, mời feedback chi tiết.** Nút 👎 kèm ô *"Sai chỗ nào?"*, không phải thumbs down trống.
>
> **G17, quyền kiểm soát tổng.** Bảng *"Đã gửi đi những gì"* dưới mỗi câu trả lời, ghi rõ số trang, kích thước ảnh vùng, số ký tự text, số lượt lịch sử. Hỏi về slide khác thì màn hình **không** tự chuyển, học viên tự bấm *"Đi tới slide N"*.
>
> **Nguyên tắc PAIR quan trọng nhất mà nhóm áp, và một thứ nhóm cố ý KHÔNG làm:** PAIR nói *tin đúng mức tốt hơn tin tối đa*. Vì vậy nhóm **không** hiển thị điểm tin cậy kiểu "độ tin 4/5", dù nó trông thông minh. Model tự chấm độ tin của chính nó thì calibration rất kém, và một con số "độ tin cao" đặt cạnh một câu trả lời sai làm học viên tin **mạnh hơn** so với không hiện gì. Thay vào đó nhóm chỉ hiện **bằng chứng kiểm được**: chip trích dẫn, ảnh trang đã đọc, khối *"Ngoài tài liệu"* tách riêng bằng màu và nhãn.
>
> Vị trí code cụ thể của từng nguyên tắc: [codebase/README.md](../codebase/README.md).

---

## Q9. Nhóm còn thiếu gì? Cần hỗ trợ gì?

> **Còn thiếu, theo thứ tự gấp:**
>
> 1. **Chấm 4 chiều chất lượng bằng người, 2 người độc lập rồi so.** Đây là 4 trên 15 điểm R4 và là việc còn thiếu lớn nhất. Bộ chạy tự động đã sinh bảng 55 dòng với output thật (`eval/run-03.md`), nhưng nó chỉ chấm được phần cơ học: có từ chối không, có hỏi lại không, chế độ đọc đúng chưa, số trang gửi đi, ảnh có phải cả trang không. Bốn chiều G (grounded), S (đúng vùng), H (trung thực khi không chắc), C (trích dẫn đúng trang) vẫn phải người đọc.
> 2. **Log nguyên văn 23 người khảo sát** (`docs/survey-log.md`). Có số 13/23 rồi nhưng thiếu log thì theo R1 không được tính, đang chặn 6 trên 15 điểm.
> 3. **Xác nhận quality bar.** Đề xuất là *"≥80% câu thử đạt cả 4 chiều, và AI không được bịa nội dung không có trong vùng ảnh dù một lần"*. Cần cả nhóm chốt vào `spec.md` mục 7 trước 23:59 vì sau đó không hạ được.
> 4. **Mục 3 của spec** (nghiên cứu sản phẩm tương tự). Mỗi người thử một sản phẩm 15 phút, trả lời 4 câu.
> 5. **Bảng phân công có tên** trong `README.md` (R7, 1 điểm; CP5 sẽ hỏi ngẫu nhiên từng người về phần mang tên mình).
>
> **Cần hỗ trợ, 3 câu hỏi cụ thể:**
>
> 1. **Về evidence:** mining chứng minh được pain tồn tại và chứng minh được chỗ hổng kiến trúc (99,3% câu hỏi đã có sẵn số trang và text vùng chọn), nhưng **không** chứng minh được tần suất (chỉ 4 trên 1.261 lượt hỏi thẳng về hình). Nhóm đã ghi trung thực và để trống cột tần suất. **Như vậy có đủ cho R1 hay TA cần nhóm bổ sung khảo sát riêng về tần suất?**
> 2. **Về rủi ro demo:** đo trên `gemini-3.1-flash-lite-preview` thấy độ trễ p90 là 14.971ms và max 26.948ms, trong khi lượt đo trước cùng model chỉ max 4.449ms. Số liệu cho thấy đây là biến động phía server của model bản preview, không phải do prompt (prompt dài thêm 29% nhưng output token lại giảm, và cùng cỡ output cho ra 1.420ms so với 13.855ms). **Nhóm có nên đổi sang bản stable trước CP6, hay ban tổ chức có API key với quota cao hơn?**
> 3. **Về phạm vi:** data dictionary cho thấy hai feature nữa của tutor hiện tại đang chết hẳn, `misconceptions` bằng 0 trên 1.261 và `asked_check_question` chỉ 3 trên 2.522. Cả hai đều hấp dẫn nhưng là **quyết định AI thứ hai**, phá kỷ luật một quyết định AI của lát cắt, và rubric ghi sau CP4 không thêm feature mới. **Nhóm định đưa vào slide 6 "nếu có thêm 1 tuần" thay vì build, TA thấy đúng hướng chưa?**
