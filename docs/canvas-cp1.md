# Canvas CP1 — 7 dòng

*(Nộp tại CP1 · guide §1.5. Bản nháp — evidence và lát cắt hoàn thiện dần đến spec.md 23:59 N1.)*

| # | Mục | Nội dung |
|---|---|---|
| 1 | **Hướng** | A — VLearn · Tính năng mới trên VLearn |
| 2 | **Job executor** | Học viên dùng AI Tutor để tự xem lại và tìm hiểu bài giảng, trong buổi học và sau mỗi buổi |
| 3 | **Pain một câu** | Khi gặp sơ đồ, biểu đồ hoặc hình minh hoạ trong slide, học viên không nhờ được AI Tutor giải thích vì AI chưa nhận diện được hình ảnh và vùng nội dung được chọn — học viên phải tự đoán hoặc bỏ qua phần đó |
| 4 | **Bằng chứng đầu** | Khảo sát n=23: **13/23 (56,5%)** nói AI Tutor chưa đọc được ảnh slide · **11/23 (47,8%)** nói khi chọn nội dung trên slide, AI không nhận biết được phần cần giải thích |
| 5 | **Lát cắt MỘT CÂU** | Học viên chọn một vùng hình ảnh trên một slide · AI Tutor nhận diện và giải thích riêng vùng đó theo ngữ cảnh bài học · trả về lời giải thích kèm trích dẫn trang |
| 6 | **Automation + willing users** | **Augment** — AI giải thích, học viên tự đối chiếu với slide gốc; sai kiến thức là chi phí cao nên không để AI tự quyết. Dự kiến mời **5–8 người** trong 23 người đã khảo sát thử MVP |
| 7 | **Phân công** | ⬜ *điền tên — xem bảng trong [README.md](../README.md)* |

## Tự kiểm theo checklist TA

- ☑ Lát cắt đúng format một câu (1 user · 1 việc · 1 quyết định AI · 1 kết quả)
- ☑ Có evidence ban đầu (khảo sát n=23, có số và %)
- ⬜ Đủ tên phân công — **còn thiếu**

## Việc còn phải làm để đạt chuẩn evidence

| Chuẩn | Yêu cầu | Trạng thái |
|---|---|---|
| **A — khảo sát** | ≥20 người ngoài nhóm · ≥50% xác nhận · log đủ câu hỏi + từng câu trả lời nguyên văn | n=23 ✅ · 56,5% ✅ · **log nguyên văn còn thiếu** → [survey-log.md](survey-log.md) |
| **B — mining** | Số đếm được + ≥5 ví dụ nguyên văn + phương pháp đếm kiểm lại được | ⬜ chưa làm — hướng đi: đếm trong chatlog số lượt học viên hỏi về sơ đồ/hình mà tutor trả lời không có `citations` |
