# Reflection — Trần Duy Hoành (2A202601777)

## Vai trò & phần tôi làm

- Tôi phụ trách **Frontend & UX**, tập trung xây dựng trải nghiệm để học viên có thể mở slide, chọn đúng vùng cần hỏi, nhìn thấy hệ thống đang đọc phần nào và sửa lại khi máy nhận diện chưa đúng.
- Các phần tôi tham gia chính nằm trong [codebase/web/index.html](../codebase/web/index.html), [codebase/web/app.js](../codebase/web/app.js), [codebase/web/components/SlideViewer.js](../codebase/web/components/SlideViewer.js), [codebase/web/components/RegionSelector.js](../codebase/web/components/RegionSelector.js), [codebase/web/components/ExplainPanel.js](../codebase/web/components/ExplainPanel.js) và [codebase/web/css/styles.css](../codebase/web/css/styles.css).
- `SlideViewer` chịu trách nhiệm hiển thị slide mock hoặc PDF thật, quản lý trang đang xem và tạo thumbnail để học viên kiểm tra AI đã đọc đúng trang hay chưa.
- `RegionSelector` hỗ trợ hai cách chọn vùng: click để hệ thống tự dò ranh giới khối nội dung và kéo chuột để người dùng khoanh lại thủ công khi kết quả tự động chưa đúng ý.
- `ExplainPanel` hiển thị câu trả lời, chế độ đọc text/quét ảnh, citation, thumbnail trang, trạng thái đang xử lý và bảng “Đã gửi đi những gì”. Mục tiêu là giúp người dùng không chỉ nhận câu trả lời mà còn nhìn thấy căn cứ của câu trả lời đó.
- Tôi cũng hỗ trợ chuẩn bị flow demo gồm một case chuẩn và một case khó: click vào sơ đồ để tự nhận diện vùng, sau đó click vào khe hẹp để kiểm tra hệ thống có hỏi lại thay vì đoán hay không.

## AI hỗ trợ thế nào

- Tôi dùng AI để hỗ trợ phân tích luồng giao diện, đề xuất cách chia component, rà soát các trạng thái UX và tạo bản nháp CSS/JavaScript cho những tương tác lặp lại.
- AI làm tốt trong việc gợi ý cấu trúc component, các trạng thái loading/error và những trường hợp biên như chưa chọn vùng, vùng quá nhỏ, trang không có text layer hoặc người dùng muốn sửa số trang.
- AI cũng giúp tôi rà lại tính nhất quán giữa giao diện và các nguyên tắc HAX, chẳng hạn hiện khung vùng đã nhận diện trước khi trả lời, cung cấp đường sửa bằng thao tác kéo và hiển thị thumbnail để người dùng tự kiểm chứng.
- Tuy nhiên, tôi phải tự kiểm tra trải nghiệm trên slide thật. Một giao diện nhìn hợp lý trong code chưa chắc hoạt động tốt với slide có nền beige, viền mờ hoặc nhiều khoảng trắng. Các ngưỡng nhận diện và kích thước vùng phải được kiểm tra trực tiếp thay vì chỉ tin vào gợi ý của AI.
- Tôi cũng phải điều chỉnh lại những đề xuất làm giao diện quá nhiều thông tin. Với prototype demo, phần quan trọng nhất là vùng đang đọc, căn cứ trang và cách sửa; các chỉ số hoặc trạng thái không giúp người học ra quyết định được giữ ở mức tối thiểu.

## Bài học từ một case fail của nhóm

- **Case:** `C04` và `C25` trong [eval/run-01.md](../eval/run-01.md).
- **Chuyện gì xảy ra:** Khi người dùng click vào khe hẹp giữa hai hộp, hệ thống dò ra một dải vùng rất nhỏ, khoảng 40×196px và gần 1% diện tích trang. Ở lượt chạy AI thật đầu tiên, vùng này vẫn có thể được gửi đi để model giải thích thay vì yêu cầu người dùng chọn lại.
- **Vì sao xảy ra:** Giao diện đã cho phép tạo vùng chọn nhưng chưa bảo đảm rằng mọi vùng được tạo ra đều đủ rõ để gửi sang AI. Chỉ hiển thị một khung chọn là chưa đủ; hệ thống còn phải đánh giá chất lượng của vùng và phản hồi ngay khi vùng quá nhỏ hoặc quá mơ hồ.
- **Nếu làm lại tôi sẽ:** Xác định rõ các trạng thái UX ngay từ đầu gồm nhận diện thành công, vùng quá nhỏ, không tìm thấy nội dung và người dùng sửa vùng. Tôi cũng sẽ gắn mỗi trạng thái với một case test trước khi nối AI thật.
- Bài học lớn nhất của tôi là với sản phẩm AI, UX không chỉ là phần trình bày kết quả. Giao diện còn là một lớp an toàn giúp người dùng thấy AI đang hiểu gì, phát hiện khi hệ thống hiểu sai và sửa lại trước khi một câu trả lời sai được tạo ra.
