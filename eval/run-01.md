# Lượt chạy 01

| | |
|---|---|
| **Thời điểm** | ⬜ |
| **Người chạy / người chấm** | ⬜ |
| **Phiên bản prototype** | ⬜ *commit hash* |
| **Model** | ⬜ *vd: gemini-flash-latest* |
| **Prompt** | `codebase/server/prompts/explain-region.md` @ ⬜ *commit hash* |
| **Chế độ** | ⬜ AI thật · ⬜ mock |

> ⚠️ **Chưa chạy.** Bảng dưới phải điền bằng output THẬT của prototype. Rubric: bảng phải đủ **mọi case kể cả case chưa đạt** — kết quả thấp vẫn được tính đủ điểm nếu ghi nhận trung thực và có phân tích nguyên nhân; số liệu bị chỉnh sửa hoặc che giấu thì không.

## Kết quả từng case

Chấm theo 4 chiều trong [golden-set.md](golden-set.md): **G** grounded · **S** đúng vùng · **H** trung thực khi không chắc · **C** trích dẫn đúng trang. Case **Đạt** khi qua cả 4.

| ID | Lớp | Output (rút gọn — giữ nguyên văn phần quyết định) | G | S | H | C | Đạt? | Ghi chú |
|---|---|---|:-:|:-:|:-:|:-:|:-:|---|
| C01 | ① | | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C02 | ① | | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C03 | ① | | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C04 | ② | | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C05 | ② | | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C06 | ② | | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C07 | ③ | | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C08 | ③ | | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C09 | ④ | | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C10 | ④ | | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C11 | ④ | | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C12 | thường | | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C13 | thường | | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C14 | thường | | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C15 | thường | | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C16 | thường | | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C17 | thường | | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C18 | thường | | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C19 | thường | | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C20 | hiếm | | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C21 | hiếm | | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C22 | hiếm | | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |

## Tổng kết

| | Số case | Đạt | % |
|---|---|---|---|
| Lớp ① Nguồn sự thật | 3 | ⬜ | ⬜ |
| Lớp ② Mơ hồ | 3 | ⬜ | ⬜ |
| Lớp ③ Ngoài phạm vi | 2 | ⬜ | ⬜ |
| Lớp ④ Đặc thù domain | 3 | ⬜ | ⬜ |
| Thường | 8 | ⬜ | ⬜ |
| Hiếm | 3 | ⬜ | ⬜ |
| **Toàn bộ** | **22** | ⬜ | **⬜%** |

Theo chiều:

| Chiều | Số case pass | % |
|---|---|---|
| G — Grounded | ⬜ | ⬜ |
| S — Đúng vùng | ⬜ | ⬜ |
| H — Trung thực khi không chắc | ⬜ | ⬜ |
| C — Trích dẫn đúng trang | ⬜ | ⬜ |

## Đối chiếu quality bar

| | |
|---|---|
| Quality bar đã chốt (spec.md §7) | ⬜ *___%* |
| Kết quả lượt này | ⬜ *___%* |
| **Đạt bar?** | ⬜ |

## Phân tích failure

*Bắt buộc khi chưa đạt bar. Mỗi failure: trigger → biểu hiện → nguyên nhân giả định → sửa gì.*

| # | Case fail | Chiều fail | Nguyên nhân giả định | Sửa gì ở lượt sau |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

**Một failure đau nhất chọn sửa cho lượt 02:** ⬜

*(Nhịp lặp: sửa xong phải chạy lại TRỌN BỘ — sửa chỗ này vỡ chỗ kia là chuyện thường của prompt.)*
