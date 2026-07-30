# Reflection — Hán Vũ Long (2A202601905)

## Vai trò & phần tôi làm

- Tôi phụ trách mảng **Research & Evidence**, tập trung thu thập và hệ thống hóa bằng chứng để nhóm xác định đúng pain point trước khi chọn tính năng.
- Các phần tôi tham gia chính gồm [docs/survey-log.md](../docs/survey-log.md), [docs/mining-log.md](../docs/mining-log.md), [docs/mining.py](../docs/mining.py), [docs/canvas-cp1.md](../docs/canvas-cp1.md) và phần User & Job, Evidence, Impact trong [spec.md](../spec.md).
- Với khảo sát sinh viên K3 AI Thực Chiến, tôi tổng hợp 23 phản hồi. Kết quả cho thấy 13/23 người (56,5%) gặp vấn đề AI Tutor chưa đọc được ảnh slide, 11/23 người (47,8%) cho biết AI không nhận biết đúng phần được click/chọn và 9/23 người (39,1%) gặp hạn chế khi đọc dữ liệu trong slide PDF.
- Với chatlog VLearn, tôi hỗ trợ xây dựng phương pháp ghép dữ liệu theo `turn_id` để phân tích 1.261 lượt hội thoại. Kết quả đáng chú ý là 582/1.261 lượt trả lời của tutor có `citations` rỗng, tương đương 46,2%.
- Tôi cũng tham gia đối chiếu giữa khảo sát và chatlog. Chatlog chỉ có 4/1.261 lượt hỏi trực tiếp về một đối tượng trực quan, nên tôi không sử dụng con số này để khẳng định pain xảy ra thường xuyên. Thay vào đó, nhóm ghi rõ giới hạn của dữ liệu và dùng khảo sát để bổ sung góc nhìn.
- Từ bằng chứng thu được, tôi hỗ trợ nhóm viết pain point và user need: sinh viên cần hiểu được sơ đồ, biểu đồ hoặc hình minh họa ngay trên slide mà không phải tự chuyển sang công cụ khác hoặc chờ hỏi người khác.

## AI hỗ trợ thế nào

- Tôi sử dụng AI để hỗ trợ viết biểu thức tìm kiếm, đề xuất cách nhóm các trường dữ liệu và tạo bản nháp cho script mining. AI cũng giúp tóm tắt kết quả phân tích thành các bảng ngắn để đưa vào spec và slide trình bày.
- AI làm tốt ở việc gợi ý nhiều cách đếm, phát hiện các trường dữ liệu đáng chú ý như `citations`, `selected_text`, `follow_ups` và `asked_check_question`, đồng thời giúp diễn đạt pain point theo cấu trúc ai đang làm gì, vướng ở đâu và hậu quả là gì.
- Tuy nhiên, tôi phải tự kiểm tra lại định nghĩa của từng phép đếm. Ví dụ, nếu tính cả cụm “slide này” là câu hỏi về hình ảnh thì có thể thu được 135/1.261 lượt, nhưng phần lớn thực tế chỉ là yêu cầu tóm tắt slide. Sau khi đọc lại dữ liệu, nhóm chọn tiêu chí chặt hơn và chỉ công bố 4/1.261 lượt hỏi đúng về đối tượng trực quan.
- AI có xu hướng ưu tiên cách diễn giải tạo ra con số đẹp, trong khi nhiệm vụ của tôi là kiểm tra xem con số đó có thực sự đo đúng pain hay không. Vì vậy, mọi số liệu cuối cùng đều phải có quy tắc đếm và có thể chạy lại bằng [docs/mining.py](../docs/mining.py).

## Bài học từ một case fail của nhóm

- **Case:** nhóm case `L01` và `L02` trong [eval/run-02.md](../eval/run-02.md).
- **Chuyện gì xảy ra:** Hai case được lấy từ dữ liệu thật nhưng tọa độ click ban đầu rơi vào khoảng trắng trên slide. Hệ thống không nhận diện được vùng và bị tính là fail, dù hành vi không đoán khi không có nội dung thực chất là đúng.
- **Vì sao xảy ra:** Nhóm mới chú ý đến tính thực tế của câu hỏi lấy từ chatlog nhưng chưa kiểm chứng đầy đủ phần ngữ cảnh đầu vào, đặc biệt là vị trí vùng chọn trên PDF. Một case có câu hỏi thật vẫn có thể là case test kém nếu vùng chọn không tái hiện đúng tình huống.
- **Nếu làm lại tôi sẽ:** Kiểm tra đồng thời câu hỏi, trang, vùng chọn và hành vi mong muốn trước khi đưa một case vào golden set. Với case lấy từ dữ liệu thật, tôi sẽ lưu rõ mã hội thoại, lý do chọn và bước kiểm tra thủ công để người khác có thể tái hiện đúng.
- Bài học lớn nhất của tôi là bằng chứng không chỉ cần “có số” hoặc “lấy từ dữ liệu thật”; nó còn phải đo đúng vấn đề, có phương pháp kiểm lại và ghi rõ giới hạn để không dẫn nhóm đến một quyết định sai.
