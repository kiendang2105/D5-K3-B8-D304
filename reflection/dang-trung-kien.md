# Reflection — Đặng Trung Kiên (2A202601887)

## Vai trò & phần tôi làm
- Phụ trách chính toàn bộ tiến trình dự án: định hướng sản phẩm, viết spec, điều phối nhóm và giữ cho các mảng research, frontend, backend và demo đi đúng mục tiêu.
- Tôi là người chịu trách nhiệm chính với các file và tài liệu cốt lõi của dự án, đặc biệt là [README.md](../README.md), [spec.md](../spec.md), [STATUS.md](../STATUS.md) và [validation/feedback-log.md](../validation/feedback-log.md).
- Trong quá trình làm việc, tôi tập trung kết nối các phần khác nhau của hệ thống để đảm bảo prototype có một hướng đi thống nhất: từ vấn đề người dùng, đến trải nghiệm, đến cách AI giải thích vùng slide.
- Tôi cũng tham gia vào việc rà soát và điều chỉnh các nội dung quan trọng để chuẩn bị cho các checkpoint và buổi demo.

## AI hỗ trợ thế nào
- Tôi dùng AI như một công cụ hỗ trợ tư duy và tăng tốc độ triển khai, đặc biệt trong các bước viết draft spec, sắp xếp cấu trúc tài liệu, rà soát câu chữ và đề xuất cách trình bày nội dung rõ ràng hơn.
- AI giúp tôi nhanh chóng tóm tắt ý tưởng, tạo khung nội dung ban đầu cho [spec.md](../spec.md) và hỗ trợ chỉnh sửa các đoạn mô tả trong [README.md](../README.md).
- Tuy nhiên, phần quan trọng như định hướng sản phẩm, quyết định trải nghiệm và kiểm soát chất lượng tổng thể vẫn cần tôi tự đánh giá và điều chỉnh. Đây là điểm mà AI hỗ trợ rất tốt ở tầng tốc độ, nhưng chưa thể thay thế được vai trò của người phụ trách toàn bộ dự án.
- Tôi cũng nhận ra rằng AI rất hữu ích trong việc gợi ý cách trình bày logic và cải thiện sự nhất quán của tài liệu, nhưng vẫn cần người dùng kiểm tra kỹ để tránh sai lệch về ngữ cảnh hoặc mục tiêu sản phẩm.

## Bài học từ một case fail của nhóm
- Case: [eval/run-01.md](../eval/run-01.md) — case C04 và C25.
- Chuyện gì xảy ra: Trong lượt chạy AI thật, hệ thống vẫn có thể đưa ra câu trả lời cho một vùng quá nhỏ thay vì hỏi lại, dù đây là đúng điều kiện mà golden set đã định nghĩa. Đây là một lỗi rất nguy hiểm vì AI có thể tự tin giải thích sai mà không cảnh báo người dùng.
- Vì sao xảy ra: Nguyên nhân nằm ở chỗ guard kiểm tra vùng quá nhỏ chỉ được áp dụng trong mock flow, nhưng khi bật AI thật, logic này không được đưa vào ngay ở tầng chung trước khi gọi model. Điều này cho thấy việc tích hợp AI thật cần phải có một lớp kiểm soát chung, chứ không chỉ ở một nhánh riêng.
- Nếu làm lại tôi sẽ: Đưa logic kiểm soát và guard vào tầng xử lý chung trước khi gọi AI, thay vì chỉ áp dụng riêng cho mock; đồng thời chạy lại toàn bộ golden set sau mỗi thay đổi để chắc chắn lỗi này không lặp lại.

## Kết luận
- Vai trò của tôi trong dự án không chỉ dừng ở việc làm một phần việc cụ thể, mà là kết nối toàn bộ hệ thống để sản phẩm có thể đi từ ý tưởng đến prototype một cách có cấu trúc.
- Qua dự án này, tôi hiểu rõ hơn rằng vận hành một sản phẩm AI không chỉ là code, mà còn là quản lý logic, trải nghiệm, bằng chứng và chất lượng đầu ra từ đầu đến cuối.
