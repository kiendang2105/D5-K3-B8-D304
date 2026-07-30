# Mining log — chatlog VLearn tutor

**Nguồn:** `data/vlearn-pack/chatlog/chat_history_anonymized_for_hackathon.csv`
**Phạm vi:** 2.522 dòng = 1.261 turn (mỗi turn 1 student + 1 tutor) · 369 user · 585 hội thoại · 22–29/07/2026

**Chuẩn B** (rubric R1) yêu cầu: số đếm được + ≥5 ví dụ nguyên văn + **phương pháp đếm kiểm lại được**. Mọi con số dưới đây kèm quy tắc đếm để người khác chạy lại ra cùng kết quả.

> Ví dụ chỉ ghi **mã hội thoại/turn + trích ngắn** theo quy định bảo mật data (README mục "Bảo mật dữ liệu được cung cấp", quy tắc 3) — không dán nguyên văn dài.

---

## 1. Cách đếm

Ghép theo `turn_id` để có cặp (câu hỏi học viên → câu trả lời tutor). 1.261 cặp, không có turn lệch.

```python
byturn = {}
for r in csv.DictReader(open(CSV, encoding="utf-8")):
    byturn.setdefault(r["turn_id"], {})[r["role"]] = r
turns = [(k, v["student"], v["tutor"]) for k, v in byturn.items()
         if "student" in v and "tutor" in v]      # -> 1261
```

---

## 2. Số đo · Tutor có grounding vào tài liệu không

| Số đo | Giá trị | Quy tắc đếm |
|---|---|---|
| Lượt trả lời tutor có `citations` rỗng | **582 / 1.261 = 46,2%** | `citations.strip() in ("[]", "")` trên dòng `role == "tutor"` |

Khớp đúng con số trong `DATA_DICTIONARY.md` → quy tắc đếm đã đúng.

---

## 3. Số đo · Nền tảng đang truyền gì cho tutor

Phát hiện quan trọng nhất của lượt mining này. **99,3% câu hỏi mang tiền tố có cấu trúc:**

```
(Trang 37, đoạn được chọn: "tóm tắt nội dung chính trong slide này") tóm tắt nội dung chính...
```

| Số đo | Giá trị | Quy tắc đếm |
|---|---|---|
| Turn có tiền tố `(Trang N, đoạn được chọn: "...")` | **1.252 / 1.261 = 99,3%** | regex `^\(Trang\s*(\d+),\s*đoạn được chọn:\s*"(.*?)"\)\s*(.*)$` |
| Turn không có tiền tố (học viên gõ tay, không bôi đen) | 9 = 0,7% | phần còn lại |
| Turn có tiền tố nhưng đoạn chọn **rỗng** | **0** | `len(group(2).strip()) == 0` |
| Độ dài đoạn được chọn | min 1 · median 32 · p90 177 · max 300 ký tự | |

**Nghĩa là:** VLearn **đã** truyền cho tutor số trang + **text** của vùng học viên bôi đen. Cái thiếu không phải là "không biết học viên chọn gì" — mà là **không có đường nào truyền hình ảnh**. Bôi đen một sơ đồ thì phần text lấy được chỉ là nhãn rời rạc (hoặc rỗng), còn nội dung nằm ở hình thì mất hẳn.

Đây là bằng chứng **cấp kiến trúc** cho lát cắt: prototype thêm đúng đường còn thiếu (gửi ảnh vùng chọn), không phải thêm một thứ đã có.

---

## 4. Số đo · Học viên có hỏi về nội dung trực quan không

⚠️ **Đây là chỗ evidence YẾU. Ghi lại trung thực.**

Đếm hai lần với hai tiêu chí, vì tiêu chí lỏng cho con số đẹp nhưng sai bản chất:

| Tiêu chí | Quy tắc | Kết quả | Trong đó `citations` rỗng |
|---|---|---|---|
| **Lỏng** — có bất kỳ từ nào trong {sơ đồ, biểu đồ, hình, ảnh, bảng, mô hình, **slide này**, trong slide, cột, trục, mũi tên, flow, chart, graph…} | regex rộng trên `content` | 135 / 1.261 = **10,7%** | 55 / 135 = 40,7% |
| **Chặt** — có **danh từ chỉ đúng một đối tượng trực quan** {sơ đồ, biểu đồ, đồ thị, lưu đồ, hình vẽ/ảnh/minh hoạ, hình này/trên, bảng này/trên, mũi tên, trục tung/hoành, diagram, flowchart} · **loại bỏ** "slide này"/"trong slide" | regex hẹp trên `đoạn được chọn` + phần gõ thêm | **4 / 1.261 = 0,3%** | 2 / 4 = 50% |

**Vì sao lấy con số chặt (0,3%) làm số công bố:** đọc tay 135 case của tiêu chí lỏng thì phần lớn là *"tóm tắt nội dung chính trong slide này"* — đó là yêu cầu tóm tắt cả trang, không phải câu hỏi về một hình cụ thể. Tính chúng vào là tự thổi số.

### Kết luận trung thực

**Mining KHÔNG chứng minh được tần suất của pain này.** Chỉ 4 lượt trong tuần hỏi thẳng về một đối tượng trực quan.

Hai cách đọc số này, chưa phân biệt được bằng dữ liệu hiện có:

1. **Pain thật nhưng vô hình trong log** — học viên thử một lần, thấy tutor không đọc được hình, nên thôi không hỏi nữa. Log chỉ ghi những gì người ta *còn* hỏi, không ghi những gì người ta *đã bỏ*. Khảo sát 13/23 (56,5%) nói *"đã từng gặp"* nghiêng về cách đọc này.
2. **Pain nhỏ** — học viên phần lớn hỏi về chữ, hình không phải chỗ họ vướng.

**Việc cần làm để phân biệt:** hỏi trong vòng validation CP5 đúng câu *"lần gần nhất bạn gặp một hình trong slide mà không hiểu — bạn có thử hỏi tutor không? nếu không thì vì sao?"*. Câu trả lời "có thử rồi, không được nên thôi" xác nhận cách đọc 1.

**Ảnh hưởng tới spec:** cột *tần suất* trong bảng impact §2 **không điền được từ log**. Không được bịa. Evidence cho lát cắt hiện dựa vào: khảo sát (tồn tại) + bằng chứng kiến trúc ở mục 3 (đường truyền ảnh không tồn tại) — **không phải** tần suất.

---

## 5. Ví dụ nguyên văn (mã + trích ngắn)

### Hỏi thẳng về hình ảnh — cả 4 case của tiêu chí chặt

| # | Mã | Trang | `citations` | Trích |
|---|---|---|---|---|
| 1 | `C0346/T0840` | 59 | **`[]`** | *"phân tích hình ảnh được khoanh đỏ ở slide 59"* — hỏi thẳng về hình, tutor trả lời **không dẫn nguồn nào** |
| 2 | `C0547/T0135` | 16 | **`[]`** | *"tóm tắt nội dung các giai đoạn được mô tả trên slide các biểu đồ"* |
| 3 | `C0302/T0611` | 16 | `[16]` | đoạn chọn *"Mô hình Double Diamond — Don Norman / British Design Council 2005"* + *"giải thích hình ảnh này"* — đoạn chọn chỉ lấy được **caption**, nội dung sơ đồ nằm ở hình |
| 4 | `C0388/T0589` | 63 | `[63]` | đoạn chọn *"Từ language model đến multimodal: token không chỉ là chữ…"* |

Case #1 là ví dụ đắt nhất: học viên nói rõ *"hình ảnh được khoanh đỏ"*, và câu trả lời không có căn cứ nào.
Case #3 minh hoạ đúng cơ chế hỏng: bôi đen một sơ đồ thì text lấy được là **dòng caption**, không phải nội dung sơ đồ.

### Đoạn chọn ngắn — dấu hiệu bôi phải nhãn của hình

| Số đo | Giá trị |
|---|---|
| Đoạn được chọn ≤ 15 ký tự | **293 / 1.252 = 23,4%** |

Ví dụ: `C0007/T0020` trang 15, đoạn chọn chỉ là `"instruction"`, câu hỏi *"Giải thích đoạn bôi đen ở Trang 15."*, `citations = []`.
⬜ **Cần đọc tay** 30–50 case trong nhóm này để biết bao nhiêu là nhãn-của-hình vs từ khoá trong đoạn văn. Chưa làm → **chưa được dùng làm số**.

---

## 6. Số đo khác (bối cảnh, không phải pain chính)

| Số đo | Giá trị | Quy tắc đếm |
|---|---|---|
| `misconceptions` từng được dùng | **0 / 1.261** | `misconceptions != "[]"` |
| `asked_check_question = True` | **3 / 2.522** | so sánh chuỗi `"True"` |
| `move_used = review_concept` | 1.074 / 1.261 = 85,2% | nhóm theo `move_used` trên dòng tutor |

---

## 7. Script chạy lại

Toàn bộ số trên sinh ra bằng script đọc trực tiếp CSV, không sửa dữ liệu. Chạy lại:

```bash
python docs/mining.py
```

Script ở [docs/mining.py](mining.py) — chỉ đọc, không sửa dữ liệu. In ra đúng mọi con số trong file này kèm quy tắc đếm, nên người ngoài nhóm chạy lại kiểm được.

Một lưu ý khi đối chiếu với `DATA_DICTIONARY.md`: script đếm `move_used = review_concept` ra **1.074**, dictionary ghi 1.072. Chênh 2 dòng, chưa truy nguyên nhân — không ảnh hưởng kết luận nào ở trên nhưng ghi lại để không ai tưởng mình đọc sai.
