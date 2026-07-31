<!--
Hai khối nhiệm vụ của phần ôn tập, tách khỏi deck-review.md để sửa lời một
nhiệm vụ mà không đụng phần khung chung.

Explain.buildReviewPrompt() cắt file này theo hai dòng mốc bên dưới rồi
thay vào {{TASK}}. ĐỪNG viết lại tên mốc ở bất kỳ đâu khác trong file này,
kể cả trong comment: mốc được tìm theo dòng đứng riêng, nhưng nhắc lại tên
mốc trong văn bản chỉ tổ làm người đọc sau tưởng có ba chỗ cắt.
-->

<<<SUMMARY>>>
## Việc cần làm: tóm tắt buổi học

Viết một bản ôn ngắn cho buổi học này, theo đúng bố cục sau:

**Ý chính của buổi** — 3 đến 5 gạch đầu dòng. Mỗi gạch là một ý học viên phải nhớ, kèm số trang trong ngoặc, ví dụ `(trang 12)`. Sắp theo mạch bài chứ không theo thứ tự trang nếu hai thứ đó khác nhau.

**Mạch nối** — 2 đến 4 câu: các ý trên nối với nhau thế nào, cái nào là nền cho cái nào.

**Chỗ nên xem lại** — 1 đến 3 gạch đầu dòng, ưu tiên đúng những chỗ học viên đã hỏi đi hỏi lại trong buổi (xem phần câu đã hỏi ở dưới). Nếu học viên chưa hỏi gì thì bỏ hẳn mục này.

Tổng cộng không quá 350 chữ. Đây là bản ôn nhanh, không phải chép lại bài.

<<<QUIZ>>>
## Việc cần làm: ra 10 câu hỏi ôn

Ra đúng **10 câu**, chia hai nhóm rõ ràng:

- **NHÓM 1 — 5 câu** bám vào **những gì chính học viên đã hỏi trong buổi** (danh sách ở dưới). Đây là những chỗ họ từng thắc mắc, nên hỏi lại để kiểm tra xem đã thật sự hiểu chưa. Nếu họ hỏi chưa đủ 5 chỗ khác nhau, thì lấy thêm từ những chỗ gần với thứ họ đã hỏi, và ghi rõ trong phần lý do.
- **NHÓM 2 — 5 câu** bám vào **nội dung buổi học nói chung**, ưu tiên các ý chính mà học viên chưa hỏi tới.

Mỗi câu viết theo ĐÚNG khuôn dưới đây, không thêm chữ nào ngoài khuôn:

```
### <số thứ tự>. <câu hỏi>
- A. <lựa chọn>
- B. <lựa chọn>
- C. <lựa chọn>
- D. <lựa chọn>
ĐÁP ÁN: <A/B/C/D> — <giải thích trong một câu>
NGUỒN: trang <số trang>
```

Trước nhóm 1 viết đúng một dòng `## NHÓM 1 — TỪ CÂU BẠN ĐÃ HỎI`, trước nhóm 2 viết đúng một dòng `## NHÓM 2 — TỪ NỘI DUNG BUỔI HỌC`.

Ràng buộc:

- **Ghi chú không đủ để ra 10 câu thì ra ít hơn.** Đây là ràng buộc mạnh hơn con số 10: ghi chú của buổi này có thể chỉ vài trang, mà ép cho đủ 10 câu thì bốn năm câu cuối chắc chắn là bịa. Ra được bao nhiêu câu có căn cứ thì ra bấy nhiêu, rồi viết đúng một dòng cuối: `GHI CHÚ: chỉ ra được N câu vì ...`.
- Câu hỏi phải trả lời được **chỉ bằng ghi chú ở dưới**. Không hỏi chi tiết mà ghi chú không nói tới — thà hỏi ý lớn còn hơn hỏi một con số bạn không chắc.
- Trang được đánh dấu `(chỉ có ảnh, chưa đọc được)` thì **không được ra câu hỏi nào** về nó.
- Mỗi câu chỉ có **một** đáp án đúng, và ba đáp án sai phải là sai thật, không phải sai kiểu buồn cười.
- `NGUỒN` phải là một trang có trong danh sách ghi chú. Không bịa số trang.
- Không ra câu hỏi về deadline, điểm số, lịch học.
