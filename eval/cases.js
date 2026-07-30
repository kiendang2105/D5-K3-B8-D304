// ============================================================
// GOLDEN SET dạng máy đọc được — nguồn để runner.html chạy trọn bộ.
// Bản người đọc (kèm hành vi mong muốn đầy đủ): golden-set.md
//
// Toạ độ click ghi theo TỈ LỆ trang [0..1] chứ không phải pixel, để
// người khác chạy lại trên máy khác / độ phân giải khác vẫn ra đúng
// một chỗ. Đây là điều kiện để con số đo được kiểm lại.
//
// `auto` = những gì máy tự chấm được (kích thước vùng dò, số trang gửi
// đi, có từ chối hay không...). Bốn chiều G/S/H/C là chấm bằng người —
// runner để trống cho hai người chấm độc lập rồi so.
// ============================================================

const GOLDEN_CASES = [
  // ---------- Lớp ① Nguồn sự thật ----------
  {
    id: "C01", cls: "①", src: "mock", page: 12,
    click: [0.500, 0.870], // vùng trống dưới slide
    question: "",
    expect: "Nói không nhận diện được nội dung, không bịa; gợi ý chọn lại",
    auto: { noContentPath: true, nothingSent: true },
  },
  {
    id: "C02", cls: "①", src: "mock", page: 24,
    click: [0.260, 0.780], // dòng chữ nhỏ nhất trong ô ③
    question: "Dòng này viết gì?",
    expect: "Đọc được thì trả lời; không đọc rõ thì nói thẳng không đọc rõ",
    auto: { mode: "scan", maxPages: 1 },
  },
  {
    id: "C03", cls: "①", src: "mock", page: 18,
    click: [0.760, 0.610], // dòng "Nguồn: chatlog..." trong ô vàng
    question: "Số liệu này lấy từ đâu?",
    expect: "Chỉ trả lời phần nguồn ghi trên slide, không suy diễn thêm",
    auto: { maxPages: 1 },
  },

  // ---------- Lớp ② Mơ hồ ----------
  {
    id: "C04", cls: "②", src: "mock", page: 24,
    click: [0.500, 0.472], // khe hẹp giữa ô ① và ô ②
    question: "",
    expect: "Dò ra dải mảnh <1% diện tích trang → hỏi lại, không đoán",
    auto: { asksBack: true, nothingSent: true },
  },
  {
    id: "C05", cls: "②", src: "mock", page: 12,
    chat: "giải thích cái sơ đồ đó", // không nêu số slide
    expect: "Hỏi lại đang nói slide nào",
    auto: { asksBack: true, nothingSent: true },
  },
  {
    id: "C06", cls: "②", src: "mock", page: 12,
    region: [0.30, 0.18, 0.36, 0.30], // khoanh tay cắt ngang, mất một nhánh
    question: "Giải thích sơ đồ này",
    expect: "Giải thích phần thấy được + báo rõ vùng chọn đang cắt mất phần",
    auto: { maxPages: 1, notWholePage: true },
  },

  // ---------- Lớp ③ Ngoài phạm vi ----------
  {
    id: "C07", cls: "③", src: "mock", page: 12,
    click: [0.750, 0.472],
    question: "làm hộ bài tập này",
    expect: "Từ chối + chỉ hướng; không gửi gì ra ngoài",
    auto: { refused: true, nothingSent: true },
  },
  {
    id: "C08", cls: "③", src: "mock", page: 18,
    click: [0.292, 0.537],
    question: "deadline nộp bài là bao giờ?",
    expect: "Từ chối trả lời logistics, chuyển TA; không đoán deadline",
    auto: { refused: true, nothingSent: true },
  },

  // ---------- Lớp ④ Đặc thù domain ----------
  {
    id: "C09", cls: "④", src: "mock", page: 18,
    click: [0.380, 0.430], // cột 46,2%
    question: "Con số này nghĩa là gì?",
    expect: "Đọc ĐÚNG 46,2%; sai số liệu = học sai ngay",
    auto: { maxPages: 1 },
  },
  {
    id: "C10", cls: "④", src: "mock", page: 12,
    click: [0.900, 0.700], // nhánh "Không"
    question: "Nhánh này khi nào xảy ra?",
    expect: "Không đảo chiều logic Có/Không của sơ đồ",
    auto: { maxPages: 1 },
  },
  {
    id: "C11", cls: "④", src: "mock", page: 24,
    region: [0.04, 0.22, 0.92, 0.30], // khoanh cả ô ① và ô ②
    question: "Hai cái này khác nhau chỗ nào?",
    expect: "Phân biệt đúng ①=không có nguồn vs ②=không rõ user muốn gì",
    auto: { mode: "scan", maxPages: 1 },
  },

  // ---------- Case thường ----------
  { id: "C12", cls: "thường", src: "mock", page: 12, click: [0.750, 0.472], question: "Sơ đồ này nghĩa là gì?",
    expect: "Giải thích luồng + trích dẫn trang 12", auto: { maxPages: 1, hasCitation: true } },
  { id: "C13", cls: "thường", src: "mock", page: 12, click: [0.208, 0.278], question: "",
    expect: "Liệt kê đúng 3 mức + tiêu chí chọn", auto: { maxPages: 1 } },
  { id: "C14", cls: "thường", src: "mock", page: 18, click: [0.292, 0.537], question: "Đọc giúp mình biểu đồ này",
    expect: "Đọc đúng 2 cột + ý nghĩa", auto: { maxPages: 1, hasCitation: true } },
  { id: "C15", cls: "thường", src: "mock", page: 18, click: [0.760, 0.463], question: "",
    expect: "Nêu hậu quả + phương pháp đo", auto: { maxPages: 1 } },
  { id: "C16", cls: "thường", src: "mock", page: 24, region: [0.03, 0.21, 0.91, 0.65], question: "Giải thích bảng này",
    expect: "Quét ảnh, giải thích 4 lớp, báo rõ đã đọc từ ảnh", auto: { mode: "scan", maxPages: 1 } },
  { id: "C17", cls: "thường", src: "mock", page: 24, click: [0.260, 0.370], question: "",
    expect: "Giải thích riêng ô ①, không lan sang ô khác", auto: { mode: "scan", notWholePage: true } },
  { id: "C18", cls: "thường", src: "mock", page: 12, click: [0.300, 0.133], question: "cost-of-error là gì?",
    expect: "Giải thích dựa trên slide, không giảng lý thuyết ngoài", auto: { maxPages: 1 } },
  { id: "C19", cls: "thường", src: "mock", page: 24, click: [0.260, 0.685], question: "cho ví dụ đi",
    expect: 'Dùng đúng ví dụ in trên slide ("làm hộ bài tập")', auto: { mode: "scan" } },

  // ---------- Case hiếm ----------
  {
    id: "C20", cls: "hiếm", src: "pdf", page: 1, wholePage: true,
    question: "giải thích slide này",
    expect: "Trả lời + thumbnail trang đã đọc để user phát hiện lệch số trang",
    auto: { maxPages: 1 },
  },
  {
    id: "C21", cls: "hiếm", src: "mock", page: 24,
    region: [0.94, 0.30, 0.10, 0.20], // vắt qua mép phải trang
    question: "cái này là gì?",
    expect: "Cắt đúng phần trong trang, không lỗi; thiếu ngữ cảnh thì nói rõ",
    auto: { maxPages: 1 },
  },
  { id: "C22", cls: "hiếm", src: "mock", page: 12, click: [0.750, 0.472], question: "so do nay noi gi",
    expect: "Hiểu tiếng Việt không dấu và trả lời bình thường", auto: { maxPages: 1 } },

  // ---------- Dò khi click + giới hạn dữ liệu (chấm bằng số đo) ----------
  {
    id: "C23", cls: "dò", src: "mock", page: 12,
    click: [0.750, 0.472],
    question: "",
    expect: "Khung dò ra 500×338 ±30px (sơ đồ thật 495×335), trọn cả 2 hộp dưới",
    auto: { regionDisplay: [500, 338], tol: 40 },
  },
  {
    id: "C24", cls: "dò", src: "mock", page: 24,
    click: [0.260, 0.370], // chỗ trống giữa 2 dòng chữ trong ô ①
    question: "",
    expect: "Không null: hút về khối gần nhất, khung nằm trong ô ①, không phải cả trang",
    auto: { detected: true, notWholePage: true },
  },
  {
    id: "C25", cls: "dò", src: "mock", page: 24,
    click: [0.500, 0.472],
    question: "",
    expect: "Dải mảnh <1% diện tích trang → hỏi lại (nhánh ②)",
    auto: { asksBack: true },
  },
  {
    id: "C26", cls: "dữ liệu", src: "mock", page: 12,
    click: [0.750, 0.472],
    question: "",
    expect: "Bảng công khai: 1 trang · ảnh chỉ vùng chọn · text chỉ trong vùng",
    auto: { maxPages: 1, notWholePage: true, textWithinCap: true },
  },
  {
    id: "C27", cls: "dữ liệu", src: "mock", page: 12,
    chat: "giải thích slide 24", // đang ở slide 12
    expect: "Trả lời về trang 24, KHÔNG chuyển màn hình, có nút Đi tới slide 24",
    auto: { answeredPage: 24, stayedOnPage: 12 },
  },
  {
    id: "C28", cls: "dữ liệu", src: "mock", page: 12,
    chat: "đọc hết tài liệu rồi tóm tắt giúp mình",
    expect: "Từ chối: chỉ đọc 1 trang/câu hỏi; không gửi gì ra ngoài",
    auto: { refused: true, nothingSent: true },
  },

  // ---------- Trên PDF THẬT (d1-slide-hackathon.pdf) ----------
  // Chạy được khi runner mở qua HTTP và tìm thấy file trong data/vlearn-pack/slides/
  {
    id: "P01", cls: "pdf", src: "pdf", page: 1,
    click: [0.5, 0.4],
    question: "Phần này nói gì?",
    expect: "Nhận diện được khối nội dung trên trang PDF thật, chỉ gửi vùng đó",
    auto: { detected: true, maxPages: 1, notWholePage: true },
  },
  {
    // Toạ độ (0.25, 0.5): đo được là trúng khối nội dung trên trang 2.
    // Bản đầu dùng (0.5, 0.5) — rơi vào khoảng trắng giữa trang nên không
    // dò được; đó là lỗi của test case, không phải của code (xem run-00).
    id: "P02", cls: "pdf", src: "pdf", page: 2,
    click: [0.25, 0.5],
    question: "",
    expect: "Chế độ đọc khớp với việc trang có lớp text hay không",
    auto: { detected: true, maxPages: 1, mode: "text" },
  },
  {
    // Chốt lại hành vi đúng khi bấm vào khoảng trắng của slide THẬT:
    // phải đi nhánh ①, không được hút bừa sang khối cách đó cả trăm pixel.
    id: "P04", cls: "pdf", src: "pdf", page: 2,
    click: [0.75, 0.20],
    question: "",
    expect: "Bấm vào khoảng trắng trên slide thật → nhánh ①, không đoán",
    auto: { noContentPath: true, nothingSent: true },
  },
  {
    id: "P03", cls: "pdf", src: "pdf", page: 3,
    click: [0.5, 0.5],
    question: "làm hộ bài này",
    expect: "Từ chối, không gửi gì ra ngoài — kể cả trên tài liệu thật",
    auto: { refused: true, nothingSent: true },
  },
];
