// ============================================================
// CONFIG — mọi hằng số điều chỉnh hành vi nằm ở đúng một chỗ.
// Đổi ngưỡng ở đây rồi chạy lại golden set, không sửa rải rác.
// ============================================================

const CONFIG = {
  // --- Khung hiển thị slide (toạ độ vùng chọn tính theo hệ này) ---
  SLIDE_W: 960,
  SLIDE_H: 540,

  // --- Ngưỡng quyết định (đưa vào golden set để kiểm chứng) ---

  // Trang có ít hơn ngần này ký tự text -> coi như PDF KHÔNG đọc được text
  // (slide ảnh / scan) -> chuyển sang chế độ QUÉT ẢNH bằng vision.
  MIN_TEXT_CHARS: 30,

  // Vùng chọn nhỏ hơn ngần này (tỉ lệ diện tích so với cả trang) -> không
  // đủ chắc user muốn hỏi gì -> hỏi lại thay vì đoán (lớp ② mơ hồ).
  // Dùng tỉ lệ thay vì px tuyệt đối để không phụ thuộc kích thước trang.
  //
  // 1% cũng là chốt chặn cho trường hợp máy dò ra một dải viền mảnh (bấm
  // vào khe hẹp giữa hai hộp): dò được nhưng không chắc là ý gì -> hỏi lại.
  MIN_SEL_RATIO: 0.01,

  // Vùng chọn phải chồng lên một zone nội dung ít nhất ngần này
  // mới coi là "nhận diện được" (lớp ① nguồn sự thật).
  ZONE_HIT_RATIO: 0.25,

  // --- Dò nội dung khi CLICK (ContentDetector) ---
  // Ô 4px: đủ nhỏ để bắt được các đường nối mảnh của sơ đồ (đường 2px ở
  // hệ hiển thị). Ô 8px làm mất chúng và khối bị cắt đôi.
  DETECT_CELL_PX: 4,          // cạnh ô lưới dò, tính theo px của trang
  DETECT_BG_RADIUS: 8,        // bán kính (ô) tính độ sáng nền cục bộ
  DETECT_INK_THRESHOLD: 18,   // lệch độ sáng so với nền cục bộ -> coi là có nội dung
  DETECT_DILATE: 2,           // nới bao nhiêu ô để chữ rời rạc dính thành khối
  DETECT_SNAP_CELLS: 12,      // bấm vào chỗ trống thì hút về khối gần nhất trong bán kính này
  DETECT_PAD_PX: 10,          // đệm quanh khối đã dò
  DETECT_MAX_COVERAGE: 0.85,  // khối phủ hơn ngần này -> coi như cả trang
  CLICK_SLOP_PX: 6,           // chuột di dưới ngưỡng này = CLICK, không phải kéo

  // --- Giới hạn dữ liệu gửi đi (xem GIỚI HẠN DỮ LIỆU bên dưới) ---
  MAX_PAGES_PER_REQUEST: 1,   // KHÔNG BAO GIỜ gửi quá 1 trang cho một câu hỏi
  TEXT_MARGIN_PX: 24,         // chỉ lấy text nằm trong vùng chọn + lề này
  MAX_TEXT_CHARS: 1200,       // trần ký tự text gửi kèm

  // --- Ký ức hội thoại ---
  // LƯU thì giữ toàn bộ (ConversationStore, có ghi localStorage). Các trần
  // dưới đây chỉ quyết định phần nào được GỬI ĐI trong một request.
  HISTORY_MAX_TURNS: 3,       // gửi kèm tối đa 3 lượt gần nhất CỦA CÙNG TRANG
  HISTORY_MAX_CHARS: 700,     // trần ký tự mỗi câu trả lời cũ

  // Lượt của TRANG KHÁC được gửi kèm thế nào:
  //   "outline" — chỉ câu hỏi của học viên + số trang, KHÔNG kèm câu trả lời.
  //               Model nối được mạch hội thoại mà không đọc thêm chữ nào
  //               của trang khác → trần "1 trang/câu hỏi" vẫn nguyên.
  //   "full"    — gửi cả câu trả lời cũ. PHÁ trần 1 trang/câu hỏi; để đây
  //               làm nhánh đối chứng khi chạy golden set, không dùng thật.
  //   "off"     — không gửi gì của trang khác (hành vi trước 31/07).
  HISTORY_CROSS_PAGE: "outline",
  HISTORY_OUTLINE_MAX: 12,    // trần số lượt trang khác đưa vào dàn ý

  // --- Tự kiểm grounding (ghi vào trace, KHÔNG hiện cho học viên) ---
  // Ngưỡng gắn cờ "đọc case này trước" khi chấm tay chiều H.
  // Đo thử: câu từ chối trung thực chỉ có 2 từ nội dung mà vẫn ra 100% lệch
  // -> phải có sàn số từ, nếu không thì cờ toàn báo động sai và bị bỏ qua.
  PROBE_MIN_WORDS: 8,         // dưới ngần này từ nội dung thì không gắn cờ
  PROBE_FLAG_RATIO: 70,       // % từ nội dung không tìm thấy trong text đã gửi

  // --- Render ---
  // Chiều rộng tối đa khi render trang để gửi cho vision.
  // Cao hơn = chữ rõ hơn nhưng tốn token ảnh và chậm hơn.
  SCAN_MAX_WIDTH: 1536,

  // --- Lời gọi AI ---
  // Bật/tắt bằng nút "API key" trên header. Có key trong localStorage thì
  // tự bật AI thật; xoá key thì quay lại mock.
  // Key KHÔNG BAO GIỜ được commit vào repo.
  USE_REAL_AI: false,

  // Tên model không hardcode: sau khi nhập key, app gọi ListModels để xem
  // key đó thực sự dùng được model nào rồi tự chọn — tránh đoán sai tên
  // model và nhận 404 giữa lúc demo.
  GEMINI_MODEL: null,
  GEMINI_ENDPOINT: "https://generativelanguage.googleapis.com/v1beta/models",
  // Thứ tự ưu tiên khi tự chọn model (khớp theo chuỗi con trong tên).
  //
  // Ưu tiên flash-lite vì hai lý do đo được:
  //   1. VLearn production chạy `gemini-3.1-flash-lite` (1.101/1.261 turn theo
  //      DATA_DICTIONARY). Đo prototype trên cùng model thì kết quả mới nói
  //      được điều gì về sản phẩm thật.
  //   2. Free tier của bản lite chịu được nhiều request/phút hơn — chạy trọn
  //      bộ 32 case trên `2.5-flash` bị 429 liên tục (xem run-01).
  GEMINI_PREFER: [
    "3.1-flash-lite", "flash-lite-latest", "2.5-flash-lite", "flash-lite",
    "flash-latest", "2.5-flash", "2.0-flash", "flash", "pro",
  ],

  // Đường dẫn file prompt, tính từ trang đang mở. eval/runner.html ghi đè
  // giá trị này vì nó nằm ở thư mục khác.
  PROMPT_URL: "../server/prompts/explain-region.md",

  // --- Slide deck có sẵn trong data pack ---
  // Hiện thành nút trên header, bấm là mở luôn — không phải tự chọn file.
  // Chỉ tải được khi chạy qua server tĩnh (fetch không đọc được file://).
  // File nằm trong .gitignore nên máy nào chưa có data pack thì nút báo lỗi rõ.
  BUILTIN_DECKS: [
    { label: "Slide buổi 1", url: "../../data/vlearn-pack/slides/d1-slide-hackathon.pdf" },
    { label: "Slide buổi 2", url: "../../data/vlearn-pack/slides/d2-slide-hackathon.pdf" },
  ],

  // Giãn cách giữa các lời gọi AI thật khi chạy trọn bộ golden set.
  // Đo thật: 4,5s (≈13 req/phút) vẫn ăn 429 với gemini-2.5-flash free tier
  // → nới lên 7s (≈8,5 req/phút). Runner còn tự thử lại sau 30s nếu vẫn 429.
  REAL_AI_DELAY_MS: 7000,

  // --- pdf.js (bản UMD 3.11.174, nạp khi user mở PDF) ---
  // Để LOCAL, không dùng CDN, vì hai lý do:
  //   1. Worker phải CÙNG ORIGIN — Chrome/Edge chặn tạo Worker từ URL khác
  //      origin, và pdf.js treo (không resolve, không reject) khi worker
  //      không init được. Đã gặp thật khi dùng CDN.
  //   2. Demo tại CP6 không phụ thuộc mạng.
  // eval/runner.html ghi đè hai giá trị này vì nó nằm ở thư mục khác.
  PDFJS_URL: "vendor/pdf.min.js",
  PDFJS_WORKER_URL: "vendor/pdf.worker.min.js",
};

// Nhận diện số slide trong câu hỏi: "giải thích slide 12", "trang 3 nói gì"
const PAGE_IN_QUESTION = /(?:slide|trang|page)\s*(?:số\s*)?(\d{1,3})/i;

// ============================================================
// GIỚI HẠN DỮ LIỆU — ràng buộc cứng của tính năng này.
//
// AI Tutor KHÔNG được đọc hay chuyển đi toàn bộ tài liệu. Mỗi câu hỏi
// chỉ được mang đi đúng phần học viên đang hỏi:
//
//   1. Tối đa 1 TRANG cho một câu hỏi (MAX_PAGES_PER_REQUEST).
//      File PDF nằm nguyên trong trình duyệt; pdf.js chỉ render trang
//      được hỏi. Không có bước "nạp cả tài liệu" nào.
//   2. Ảnh gửi đi là ẢNH VÙNG ĐÃ CẮT, không phải ảnh cả trang.
//   3. Text gửi kèm chỉ lấy các đoạn NẰM TRONG vùng chọn + lề
//      TEXT_MARGIN_PX, cắt trần ở MAX_TEXT_CHARS — không gửi text cả trang.
//   4. Không gửi tên file, không gửi tổng số trang, không gửi nội dung
//      của bất kỳ trang nào khác.
//   5. Mỗi câu trả lời kèm bảng "Đã gửi đi những gì" để học viên tự kiểm.
//   6. Câu hỏi TIẾP được gửi kèm lịch sử, nhưng chỉ là CHỮ của các lượt
//      trước (câu học viên đã gõ + câu model đã trả lời) và chỉ của ĐÚNG
//      trang đang bàn. Không lượt nào của trang khác được trộn vào — làm
//      vậy là gián tiếp gửi nội dung nhiều trang trong một request.
//      Bảng công khai ghi rõ số lượt và số ký tự lịch sử đã gửi.
//
// Kiểm lại: Explain.buildPayload() là chỗ duy nhất đóng gói dữ liệu ra
// ngoài — soát hàm đó là soát được toàn bộ đường dữ liệu rời máy.
// ============================================================
