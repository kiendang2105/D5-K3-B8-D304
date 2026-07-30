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

  // Vùng chọn nhỏ hơn ngần này (px²) -> không đủ chắc user muốn hỏi gì
  // -> hỏi lại thay vì đoán (lớp ② mơ hồ).
  MIN_SEL_AREA: 2500,

  // Vùng chọn phải chồng lên một zone nội dung ít nhất ngần này
  // mới coi là "nhận diện được" (lớp ① nguồn sự thật).
  ZONE_HIT_RATIO: 0.25,

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
