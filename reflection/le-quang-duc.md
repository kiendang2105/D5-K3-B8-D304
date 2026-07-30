# Reflection — Lê Quang Đức (2A202601767)

## Vai trò & phần tôi làm

- Tôi phụ trách **Backend / Agent Build**, tập trung vào luồng xử lý trước khi gọi AI, tích hợp model thật, chuẩn hóa response, kiểm soát dữ liệu gửi đi và lưu trace để đánh giá.
- Các phần tôi tham gia chính gồm [codebase/server/explain.js](../codebase/server/explain.js), [codebase/server/prompts/explain-region.md](../codebase/server/prompts/explain-region.md), [codebase/server/traces/](../codebase/server/traces/), [eval/cases.js](../eval/cases.js), [eval/runner.js](../eval/runner.js) và các báo cáo trong [eval/](../eval/).
- Trong `Explain.run()`, tôi hỗ trợ tổ chức các bước kiểm tra đầu vào và guardrail trước khi gọi model. Những yêu cầu ngoài phạm vi như làm hộ bài tập, sinh quiz hoặc tóm tắt cả tài liệu phải bị chặn trước bước đóng gói dữ liệu.
- Trong `Explain.buildPayload()`, dữ liệu được giới hạn ở tối đa một trang, một ảnh vùng đã cắt và phần text nằm trong vùng với giới hạn 1.200 ký tự. Payload không chứa tên file, tổng số trang hoặc nội dung của các trang khác.
- Tôi tham gia tích hợp lời gọi AI thật, lựa chọn model phù hợp với quota, xử lý lỗi `429`, parse phần trả lời và lưu trace request/response để các lượt chạy có thể kiểm chứng lại.
- Ba lượt chạy đã tạo các file `traces-run01.json`, `traces-run02.json` và `traces-run03.json`. Ở lượt 03, hệ thống chạy đủ 55/55 case, thu được 48 trace và không gặp lỗi quota `429`.

## AI hỗ trợ thế nào

- Tôi dùng AI để hỗ trợ viết bản nháp prompt, gợi ý cấu trúc guardrail, phân tích log lỗi và rà soát các nhánh xử lý response.
- AI làm tốt trong việc đề xuất nhiều cách diễn đạt cho prompt, tạo nhanh các mẫu regex ban đầu và chỉ ra những trường hợp biên cần đưa vào golden set.
- AI cũng giúp tổng hợp trace thành các nhóm lỗi để nhóm phân biệt lỗi sản phẩm, lỗi quota và lỗi của chính bộ test. Việc phân loại này giúp nhóm tránh sửa sai phần hoặc công bố một tỷ lệ không phản ánh đúng chất lượng.
- Tuy nhiên, tôi phải tự kiểm tra lại mọi guardrail do AI đề xuất. Cách thêm từng từ khóa riêng lẻ có thể xử lý một câu nhưng bỏ lọt nhiều cách diễn đạt tương đương. Tôi phải chuyển từ kiểm tra một chuỗi cụ thể sang nhận diện cấu trúc yêu cầu gồm động từ, phạm vi toàn bộ và đối tượng tài liệu.
- Tôi cũng không thể chỉ dựa vào việc code chạy không lỗi. Sau mỗi thay đổi ở prompt, guardrail hoặc runner, cần chạy lại toàn bộ golden set và đọc trace để xác nhận hệ thống đang đo đúng phiên bản sản phẩm.

## Bài học từ một case fail của nhóm

- **Case:** `C28` và `L10` trong [eval/run-03.md](../eval/run-03.md).
- **Chuyện gì xảy ra:** Hai yêu cầu “đọc hết tài liệu rồi tóm tắt giúp mình” và “tóm tắt ý chính trong tài liệu này” không bị guardrail chặn đúng. Điều này phá ràng buộc quan trọng của sản phẩm là chỉ xử lý tối đa một trang cho mỗi câu hỏi.
- **Vì sao xảy ra:** Guardrail ban đầu dựa trên danh sách từ khóa như “toàn bộ tài liệu” hoặc “cả tài liệu”, nên bỏ lọt cách nói “hết tài liệu” và câu tóm tắt không có từ chỉ toàn bộ. Ngoài ra, guardrail từng chạy sau nhánh tìm số trang, khiến một yêu cầu nhiều trang có thể bị xử lý sai thứ tự.
- **Nếu làm lại tôi sẽ:** Viết guardrail theo bản chất ý định thay vì nối thêm từ khóa, chạy guardrail trước mọi nhánh định tuyến trang và tạo cả bộ câu phải chặn lẫn câu hợp lệ để kiểm tra chặn đúng nhưng không chặn oan.
- Bài học lớn nhất của tôi là agent build không chỉ là gọi được model. Phần quan trọng hơn là thiết kế ranh giới, thứ tự xử lý, dữ liệu được phép rời máy và bộ trace đủ rõ để chứng minh mỗi quyết định của hệ thống.
