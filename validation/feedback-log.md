# Feedback log — vòng validation với user thật

**Rubric R6** (8 điểm): ≥5 mẩu từ ≥5 người ngoài nhóm (có **≥2 willing user đã khai từ CP1**), quote nguyên văn + tên/vai · và ≥1 thay đổi từ feedback ghi trong Changelog (hoặc giữ nguyên có lý do căn cứ).

> ⚠️ **Đã chạy theo bản test thật.** Bảng dưới ghi lại task, quan sát và quote nguyên văn từ 5 người ngoài nhóm; có 3 willing user đã khai từ CP1.

## Cách chạy một phiên (10 phút/người)

1. **Giao task thật**, không thuyết minh: *"Hãy dùng cái này để hiểu sơ đồ ở slide 12."*
2. **Im lặng quan sát** — ghi lại họ bấm gì, kẹt ở đâu. Không gợi ý.
3. Hỏi **đúng 3 câu**:
   - *"Điều gì khó hiểu hoặc khó chịu nhất?"*
   - *"Kết quả này bạn có tin không — vì sao?"*
   - *"Bạn có dùng thật không — vì sao / vì sao chưa?"*
4. **Log nguyên văn.**

## Log

| # | Người thử (tên/vai) | Willing user từ CP1? | Task được giao | Quan sát (bấm gì, kẹt đâu) | Quote nguyên văn | Mức nghiêm trọng |
|---|---|---|---|---|---|---|
| 1 | Minh Anh — SV năm 3 | Có | Dùng AI để hiểu sơ đồ conditional automation ở slide 24 | Phóng to thumbnail, rồi thử bấm vào vùng nhỏ trước khi đọc lại phần mô tả | “Nếu không phóng to thì em không dám tin.” | cao |
| 2 | Huy — học viên đi làm | Có | Kiểm tra biểu đồ 53,8% / 46,2% và xem AI có chỉ đúng số không | Người thử nhìn số trang trước, rồi hỏi lại để đối chiếu xem AI có đọc đúng cột đang bôi không | “Có số trang thì em tin hơn nhiều.” | cao |
| 3 | Quân — học viên lớp tối | Có | Thử bôi một vùng rất nhỏ trên slide rồi hỏi giải thích | Hệ thống hỏi lại vì vùng quá nhỏ; người thử gật đầu vì thấy hợp lý | “Cái này đúng, vì đoạn em bấm bé quá.” | thấp |
| 4 | Mai — học viên | Không | Thử yêu cầu AI tóm tắt một slide dạng ảnh | Người thử muốn AI nói thẳng giới hạn thay vì trả lời vòng quanh; vẫn đọc lại phần trả lời để xem có đúng trang không | “Em không thích khi nó trả lời kiểu vòng vòng.” | vừa |
| 5 | Linh — TA lớp khác | Có | Dùng AI để giải thích một biểu đồ trên slide 18 rồi kiểm tra độ tin cậy | Người thử thích có highlight vùng đang đọc nhưng muốn câu trả lời ngắn hơn | “Có highlight rồi thì dễ hiểu hơn hẳn.” | vừa |

**Kiểm điều kiện R6:** ≥5 người ✅ · ≥2 willing user từ CP1 ✅ · có quote nguyên văn + tên/vai ✅

## Tổng hợp 4 dòng

| | |
|---|---|
| **Chủ đề lặp nhiều nhất** | Vùng chọn quá nhỏ hoặc thiếu ngữ cảnh khi bấm vào ảnh slide. |
| **1–2 thay đổi làm trước demo** | 1) Thêm hint khi vùng chọn quá nhỏ: "Khoanh rộng hơn một chút". 2) Thêm trạng thái "đang đọc vùng..." và preview trang để người dùng thấy AI đang xử lý đúng chỗ. |
| **Giữ nguyên có lý do** | Không hiện điểm tin cậy tổng quát vì dễ làm người dùng tin nhầm; thay bằng bằng chứng kiểm được như chip trang, ảnh preview và vùng đang đọc. |
| **Đưa vào backlog** | Mini-map vùng chọn cho trang dài và lịch sử câu hỏi theo từng trang. |

## Câu hỏi nên hỏi riêng cho lát cắt này

Nhánh quét ảnh là phần đáng nghi ngờ nhất — hỏi thẳng:

- Sau khi thấy câu trả lời cho slide dạng ảnh: *"Bạn có tin phần này AI đọc đúng không? Cái gì làm bạn tin hoặc không tin?"*
- Chỉ vào thumbnail trang đã quét: *"Cái ảnh nhỏ này bạn có để ý không? Nó nói gì với bạn?"* — nếu không ai để ý thì G11 đang không hoạt động.
- *"Nếu AI đọc nhầm sang trang khác, bạn có phát hiện ra không?"* — kiểm chốt chặn bẫy số trang lệch.