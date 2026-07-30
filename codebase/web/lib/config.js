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

  // --- Render ---
  // Chiều rộng tối đa khi render trang để gửi cho vision.
  // Cao hơn = chữ rõ hơn nhưng tốn token ảnh và chậm hơn.
  SCAN_MAX_WIDTH: 1536,

  // --- Lời gọi AI ---
  // CP2 = false (mock). CP3 = true + đặt key bằng nút "Cấu hình API key"
  // (key lưu ở localStorage của trình duyệt, KHÔNG commit vào repo).
  USE_REAL_AI: false,
  GEMINI_MODEL: "gemini-flash-latest",
  GEMINI_ENDPOINT: "https://generativelanguage.googleapis.com/v1beta/models",

  // --- pdf.js (bản UMD, nạp khi user mở PDF) ---
  PDFJS_URL: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
  PDFJS_WORKER_URL: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js",
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
//
// Kiểm lại: Explain.buildPayload() là chỗ duy nhất đóng gói dữ liệu ra
// ngoài — soát hàm đó là soát được toàn bộ đường dữ liệu rời máy.
// ============================================================
