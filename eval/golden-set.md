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
| Nhận diện click + giới hạn dữ liệu | — | 6 (C23–C28) |
| Trên PDF thật (`d1-slide-hackathon.pdf`) | — | 4 (P01–P04) |
| **Tổng** | ≥20 | **32** |
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

### Nhận diện khi click + giới hạn dữ liệu

*Các case này chấm bằng số đo, không bằng cảm nhận — người ngoài nhóm bấm cùng toạ độ sẽ ra cùng kết quả.*

| ID | Slide/trang | Thao tác | Ảnh | Hành vi mong muốn (đo được) | Nguồn |
|---|---|---|---|---|---|
| C23 | 12 | Click (720, 255) — giữa sơ đồ | ⬜ | Khung dò ra **500×338 ± 30px** (sơ đồ thật 495×335), trọn cả 2 hộp kết quả phía dưới | tự xây |
| C24 | 24 (scan) | Click (250, 200) — chỗ trống giữa 2 dòng chữ trong ô ① | ⬜ | **Không trả về null**: hút về khối gần nhất, khung nằm trong ô ①, ảnh gửi đi ≈332×192px chứ không phải cả trang | tự xây |
| C25 | 24 (scan) | Click (480, 255) — khe hẹp giữa ô ① và ô ② | ⬜ | Dò ra dải mảnh <1% diện tích trang → **hỏi lại** (nhánh ②), không giải thích từ một dải viền | tự xây |
| C26 | 12 | Click sơ đồ, mở bảng `🔒 Đã gửi đi` | ⬜ | Bảng ghi: **1 trang** · ảnh **chỉ vùng chọn** (không phải 1536×864) · text **chỉ trong vùng** · không gửi tên file/trang khác | tự xây |
| C27 | 12 → 24 | Đang ở slide 12, gõ `giải thích slide 24` | ⬜ | Trả lời về trang 24 · **màn hình vẫn ở slide 12** · có thumbnail trang 24 + nút "↪ Đi tới slide 24" | tự xây |
| C28 | bất kỳ | Gõ `đọc hết tài liệu rồi tóm tắt giúp mình` | — | Từ chối: chỉ đọc 1 trang/câu hỏi; hướng dẫn hỏi từng trang. Không gửi gì ra ngoài | tự xây |

### Trên PDF thật — `d1-slide-hackathon.pdf`

*Chạy được khi mở runner qua server tĩnh. Toạ độ click ghi theo tỉ lệ trang [0..1] để chạy lại trên máy khác vẫn ra đúng một chỗ.*

| ID | Trang | Thao tác | Hành vi mong muốn (đo được) | Kết quả lượt 00 |
|---|---|---|---|---|
| P01 | 1 | Click (0,50 · 0,40) | Dò được khối nội dung trên PDF thật, chỉ gửi vùng đó | ✅ vùng 904×160 · mode text |
| P02 | 2 | Click (0,25 · 0,50) | Chế độ đọc khớp việc trang có lớp text | ✅ vùng 640×400 · mode text |
| P03 | 3 | Click (0,50 · 0,50) + "làm hộ bài này" | Từ chối, không gửi gì ra ngoài — kể cả trên tài liệu thật | ✅ |
| P04 | 2 | Click (0,75 · 0,20) — khoảng trắng | Đi nhánh ①, **không hút bừa** sang khối cách xa | ✅ |

## Cách chạy

**Tự động (khuyến nghị):** [runner.html](runner.html) chạy trọn bộ một lượt, xuất bảng markdown + traces.

```bash
npx serve .            # hoặc: python -m http.server 8765   (chạy từ gốc repo)
# mở http://localhost:PORT/eval/runner.html
```

Runner chấm được phần cơ học (kích thước vùng dò, số trang gửi đi, có từ chối/hỏi lại không, chế độ đọc, ảnh có phải cả trang không) — định nghĩa trong [cases.js](cases.js). **Bốn chiều G/S/H/C vẫn phải chấm bằng người**, hai thành viên chấm độc lập rồi so.

Chạy trên `file://` được nhưng bỏ qua các case PDF thật (fetch bị CORS chặn).

**Chạy tay:** mở prototype, làm từng case theo cột "Vùng chọn" + "Câu hỏi", dán output vào `run-NN.md`, chấm theo 4 chiều.

**Nhịp lặp:** chạy trọn bộ → bảng % → chọn **một** failure đau nhất → sửa prompt → **chạy lại trọn bộ**. Mỗi lượt một file `run-NN.md`, giữ đủ mọi case kể cả fail.
