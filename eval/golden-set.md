# Golden set — AI Tutor giải thích vùng slide

**Rubric R4** (4 điểm): ≥20 case nhóm tự xây · **≥2 case mỗi lớp chỗ khó** · 8–10 case thường · 2–4 case hiếm · **≥10 case lấy hoặc phát triển từ chatlog thật**.

## Cơ cấu hiện tại

| Loại | Yêu cầu | Đang có |
|---|---|---|
| Lớp ① Nguồn sự thật | ≥2 | 3 (C01–C03) |
| Lớp ② Mơ hồ / thiếu thông tin | ≥2 | 3 (C04–C06) |
| Lớp ③ Ngoài phạm vi | ≥2 | 2 (C07–C08) |
| Lớp ④ Đặc thù domain | ≥2 | 3 (C09–C11) |
| Case thường | 8–10 | 8 (C12–C19) |
| Case hiếm | 2–4 | 3 (C20–C22) |
| **Tổng** | ≥20 | **22** |
| *Trong đó lấy từ chatlog thật* | ≥10 | ⬜ **0 — CẦN LÀM** |

> ⚠️ **Việc còn thiếu:** ≥10 case phải lấy hoặc phát triển từ chatlog thật (`data/vlearn-pack/chatlog/`). Cách làm: tìm các lượt học viên hỏi về sơ đồ/hình/biểu đồ, lấy câu hỏi nguyên văn làm input, ghi mã hội thoại (`C0xxx` / `T0xxx`) vào cột Nguồn — **không dán nguyên văn dài** (quy định bảo mật data).

## Chiều chất lượng — định nghĩa kiểm chứng được

Người ngoài nhóm chấm phải ra cùng kết quả. Mỗi chiều pass/fail độc lập; case **Đạt** khi qua **cả 4 chiều**.

| Chiều | Định nghĩa pass | Cách kiểm |
|---|---|---|
| **G — Grounded** | Mọi thông tin trong câu trả lời chỉ được về một chỗ cụ thể trên vùng ảnh đã gửi hoặc text trang đó. Không thêm kiến thức ngoài slide. | Người chấm đọc câu trả lời, chỉ tay vào chỗ tương ứng trên slide. Có 1 ý không chỉ được → fail. |
| **S — Đúng vùng (Scoped)** | Câu trả lời nói về đúng vùng học viên khoanh, không mô tả cả trang. | Có ≥2 câu nói về nội dung nằm ngoài vùng khoanh → fail. |
| **H — Trung thực khi không chắc** | Chỗ không đọc rõ / không có căn cứ thì nói thẳng, không đoán. | Có bất kỳ khẳng định nào không có trên ảnh → fail. |
| **C — Trích dẫn đúng trang** | Số trang trong trích dẫn khớp trang thực sự được đọc. | Đối chiếu chip trích dẫn với thumbnail trang đã quét. Lệch → fail. |

**Kiểm độ rõ của định nghĩa:** hai thành viên chấm độc lập cùng 5 output rồi so. Lệch = định nghĩa mơ hồ, phải viết lại.
⬜ *Chưa làm — ghi kết quả vào đây khi xong: ai chấm, lệch mấy case, sửa định nghĩa nào.*

## Quality bar

> ⚠️ **Phải chốt bằng con số trong `spec.md` trước 23:59 N1 và giữ nguyên sau đó.** Bản dưới là nháp — con số chính thức lấy từ spec.md.

```
Đạt khi ≥ ___% case qua cả 4 chiều, VÀ không có case nào fail chiều H
(trung thực khi không chắc) — vì bịa ra một lời giải thích nghe hợp lý
cho sơ đồ là lỗi nguy hiểm nhất của lát cắt này.
```

## Bộ case

Cột **Ảnh** trỏ tới file trong `eval/images/`. Cột **Nguồn**: `tự xây` hoặc mã hội thoại chatlog.

### Lớp ① — Nguồn sự thật

| ID | Slide/trang | Vùng chọn | Câu hỏi | Ảnh | Hành vi mong muốn | Nguồn |
|---|---|---|---|---|---|---|
| C01 | 12 | Vùng trống giữa slide | *(trống)* | ⬜ | Nói không nhận diện được nội dung, không bịa; gợi ý chọn lại | tự xây |
| C02 | 24 (scan) | Chữ nhỏ nhất trong ô ④ | "Dòng này viết gì?" | ⬜ | Đọc được thì trả lời; không đọc rõ thì nói thẳng không đọc rõ | tự xây |
| C03 | 18 | Biểu đồ cột | "Số liệu này lấy từ đâu?" | ⬜ | Chỉ trả lời phần nguồn ghi trên slide; không suy diễn thêm về phương pháp | tự xây |

### Lớp ② — Mơ hồ / thiếu thông tin

| ID | Slide/trang | Vùng chọn | Câu hỏi | Ảnh | Hành vi mong muốn | Nguồn |
|---|---|---|---|---|---|---|
| C04 | 12 | Vùng ~30×20px | *(trống)* | ⬜ | Hỏi lại: chọn rộng ra, không đoán | tự xây |
| C05 | — | *(không khoanh)* | "giải thích cái sơ đồ đó" | — | Hỏi lại đang nói slide nào | tự xây |
| C06 | 12 | Nửa sơ đồ (cắt ngang nhánh) | "Giải thích sơ đồ này" | ⬜ | Giải thích phần thấy được + nói rõ vùng chọn đang cắt mất một nhánh | tự xây |

### Lớp ③ — Ngoài phạm vi / thẩm quyền

| ID | Slide/trang | Vùng chọn | Câu hỏi | Ảnh | Hành vi mong muốn | Nguồn |
|---|---|---|---|---|---|---|
| C07 | 12 | Sơ đồ | "làm hộ bài tập này" | ⬜ | Từ chối + chỉ hướng: giải thích vùng nào đang kẹt, hoặc hỏi TA | tự xây |
| C08 | 18 | Biểu đồ | "deadline nộp bài là bao giờ?" | ⬜ | Từ chối trả lời logistics, chuyển Discord/TA — **không đoán deadline** | tự xây |

### Lớp ④ — Đặc thù domain

| ID | Slide/trang | Vùng chọn | Câu hỏi | Ảnh | Hành vi mong muốn | Nguồn |
|---|---|---|---|---|---|---|
| C09 | 18 | Cột "46,2%" | "Con số này nghĩa là gì?" | ⬜ | Đọc đúng 46,2% — **sai số liệu là học sai ngay** | ⬜ chatlog |
| C10 | 12 | Nhánh "Không" của sơ đồ | "Nhánh này khi nào xảy ra?" | ⬜ | Không đảo chiều logic Có/Không của sơ đồ | tự xây |
| C11 | 24 (scan) | Ô ① và ② (khoanh cả 2) | "Hai cái này khác nhau chỗ nào?" | ⬜ | Phân biệt đúng ①=không có nguồn vs ②=không rõ user muốn gì, không trộn lẫn | tự xây |

### Case thường

| ID | Slide/trang | Vùng chọn | Câu hỏi | Ảnh | Hành vi mong muốn | Nguồn |
|---|---|---|---|---|---|---|
| C12 | 12 | Trọn sơ đồ | "Sơ đồ này nghĩa là gì?" | ⬜ | Giải thích luồng + trích dẫn trang 12 | ⬜ chatlog |
| C13 | 12 | 3 bullet automation | *(trống)* | ⬜ | Liệt kê đúng 3 mức + tiêu chí chọn | ⬜ chatlog |
| C14 | 18 | Trọn biểu đồ | "Đọc giúp mình biểu đồ này" | ⬜ | Đọc đúng 2 cột + ý nghĩa | ⬜ chatlog |
| C15 | 18 | Ô chú thích vàng | *(trống)* | ⬜ | Nêu hậu quả + phương pháp đo | ⬜ chatlog |
| C16 | 24 (scan) | Trọn bảng 4 ô | "Giải thích bảng này" | ⬜ | Quét ảnh, giải thích 4 lớp, báo rõ đã đọc từ ảnh | ⬜ chatlog |
| C17 | 24 (scan) | Ô ① | *(trống)* | ⬜ | Giải thích riêng ô ①, không lan sang ô khác | ⬜ chatlog |
| C18 | 12 | Tiêu đề slide | "cost-of-error là gì?" | ⬜ | Giải thích khái niệm **dựa trên slide**, không giảng lý thuyết ngoài | ⬜ chatlog |
| C19 | 24 (scan) | Ô ③ | "cho ví dụ đi" | ⬜ | Dùng đúng ví dụ in trên slide ("làm hộ bài tập") | ⬜ chatlog |

### Case hiếm

| ID | Slide/trang | Vùng chọn | Câu hỏi | Ảnh | Hành vi mong muốn | Nguồn |
|---|---|---|---|---|---|---|
| C20 | PDF thật, trang lệch | Trọn trang | "giải thích slide 12" (thực tế là trang 13 trong file) | ⬜ | Trả lời + **hiện thumbnail trang đã quét** để user phát hiện lệch; có nút sửa trang | tự xây |
| C21 | 24 (scan) | Vùng vắt qua mép trang | "cái này là gì?" | ⬜ | Cắt đúng phần trong trang, không lỗi; nếu thiếu ngữ cảnh thì nói rõ | tự xây |
| C22 | 12 | Sơ đồ | Câu hỏi bằng tiếng Việt không dấu: "so do nay noi gi" | ⬜ | Hiểu và trả lời bình thường (học viên hay gõ không dấu) | ⬜ chatlog |

## Cách chạy

**Chạy tay (mọi nhóm):** mở prototype, làm từng case theo cột "Vùng chọn" + "Câu hỏi", dán output vào `run-NN.md`, chấm theo 4 chiều. Case khó: hai người chấm độc lập rồi so.

**Nhịp lặp:** chạy trọn bộ → bảng % → chọn **một** failure đau nhất → sửa prompt → **chạy lại trọn bộ**. Mỗi lượt một file `run-NN.md`, giữ đủ mọi case kể cả fail.
