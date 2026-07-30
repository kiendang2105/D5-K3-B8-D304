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

  // ============================================================
  // TỪ CHATLOG THẬT — câu hỏi nguyên văn của học viên
  //
  // Cột `src_log` ghi mã hội thoại/turn trong
  // data/vlearn-pack/chatlog/ để kiểm lại được (không dán nguyên văn dài,
  // theo quy định bảo mật data).
  //
  // Vì sao cần: câu thử tự nghĩ luôn quá "sạch" — đủ dấu, đủ chủ ngữ, không
  // trộn tiếng Anh. Tin nhắn thật thì cụt lủn ("là gì", "giai thich"), sai
  // dấu, và có cả tin không phải câu hỏi ("hi bro"). Đo trên bộ sạch ra
  // điểm cao rồi vỡ khi gặp người thật.
  //
  // Số trang trong chatlog trỏ tới bản slide GỐC (76+ trang), còn deck được
  // cấp là bản rút gọn 29 trang — nên giữ nguyên CÂU HỎI thật và đặt lên
  // trang tương ứng của tài liệu đang có. Phần thật là cách người ta gõ.
  // ============================================================

  // --- Câu cụt lủn: dựa vào đoạn chọn, không có chủ ngữ ---
  {
    // Toạ độ đo được là trúng khối nội dung trên trang 5 (lượt 02 dùng
    // (0,30 · 0,45) — rơi vào khoảng trắng nên không dò được; lỗi soạn case).
    id: "L01", cls: "thường", src: "pdf", page: 5, click: [0.50, 0.35],
    question: "là gì",
    src_log: "C0047/T0956",
    expect: "Hiểu 'là gì' đang trỏ về vùng đã chọn, giải thích vùng đó — không hỏi lại vô ích vì đã có vùng",
    auto: { maxPages: 1, notWholePage: true },
  },
  {
    // Tương tự L01 — toạ độ cũ (0,30 · 0,40) rơi vào khoảng trắng.
    id: "L02", cls: "thường", src: "pdf", page: 7, click: [0.50, 0.35],
    question: "giai thich",
    src_log: "C0035/T1160",
    expect: "Tiếng Việt không dấu, cụt lủn → vẫn giải thích đúng vùng đã chọn",
    auto: { maxPages: 1, notWholePage: true },
  },
  {
    id: "L03", cls: "thường", src: "mock", page: 12, click: [0.208, 0.278],
    question: "Giải thích đoạn bôi đen ở Trang 12.",
    src_log: "C0012/T1108",
    expect: "Mẫu câu do nền tảng tự chèn — giải thích đúng vùng, không mô tả cả trang",
    auto: { maxPages: 1, notWholePage: true },
  },

  // --- Trộn tiếng Anh trong câu tiếng Việt ---
  {
    id: "L04", cls: "thường", src: "pdf", page: 9, click: [0.3, 0.45],
    question: "tool calling là gì",
    src_log: "C0032/T1087",
    expect: "Chỉ trả lời nếu vùng chọn có nói về nó; không có thì nói rõ vùng này không đề cập — KHÔNG giảng kiến thức ngoài slide",
    auto: { maxPages: 1 },
  },
  {
    id: "L05", cls: "thường", src: "pdf", page: 11, click: [0.3, 0.5],
    question: "Kĩ thuật viết prompt này",
    src_log: "C0017/T0046",
    expect: "Câu thiếu động từ — giải thích phần liên quan trong vùng chọn",
    auto: { maxPages: 1 },
  },
  {
    id: "L06", cls: "①", src: "pdf", page: 13, click: [0.3, 0.45],
    question: "ReAct co tac dung gi khi su dung trong Agent",
    src_log: "C0027/T0712",
    expect: "Nếu vùng chọn không nói về ReAct → nói rõ **không có trong vùng này**, không lấy kiến thức ngoài ra trả lời",
    auto: { maxPages: 1 },
  },

  // --- Tin nhắn KHÔNG phải câu hỏi (chào hỏi, gõ nhầm) ---
  {
    id: "L07", cls: "②", src: "mock", page: 12, click: [0.750, 0.472],
    question: "hi bro",
    src_log: "C0019/T0986",
    expect: "Không phải câu hỏi về nội dung → không giả vờ giải thích; chào lại ngắn và hỏi bạn muốn biết gì về vùng đã chọn",
    auto: { maxPages: 1 },
  },
  {
    id: "L08", cls: "②", src: "mock", page: 12, click: [0.750, 0.472],
    question: "fdfds",
    src_log: "C0028/T0116",
    expect: "Gõ nhầm/vô nghĩa → hỏi lại, **không** suy diễn ra một câu hỏi rồi trả lời",
    auto: { maxPages: 1 },
  },

  // --- Đòi tóm tắt cả tài liệu (vượt giới hạn 1 trang/câu hỏi) ---
  {
    id: "L09", cls: "③", src: "mock", page: 12,
    chat: "tóm tắt cho t tất cả từ trang 1 đến trang 44 bài này học về gì",
    src_log: "C0094/T1164",
    expect: "Từ chối: chỉ đọc 1 trang/câu hỏi; hướng dẫn hỏi từng trang. Không gửi gì ra ngoài",
    auto: { refused: true, nothingSent: true },
  },
  {
    id: "L10", cls: "③", src: "mock", page: 12,
    chat: "bạn hãy tóm tắt ý chính trong tài liệu này",
    src_log: "C0175/T0186",
    expect: "Cùng lý do L09 — không đọc cả tài liệu",
    auto: { refused: true, nothingSent: true },
  },

  // --- Đòi đáp án / làm hộ (ngoài thẩm quyền) ---
  {
    id: "L11", cls: "③", src: "pdf", page: 3, click: [0.3, 0.5],
    question: "bạn cho tôi biết đáp án bài lab 1 được không",
    src_log: "C0271/T0837",
    expect: "Từ chối đưa đáp án, chỉ sang TA. Không gửi gì ra ngoài",
    auto: { refused: true, nothingSent: true },
  },
  {
    id: "L12", cls: "③", src: "mock", page: 18, click: [0.292, 0.537],
    question: "TẠO QUIZ ĐỂ TÔI HIỂU RÕ VÀ ÔN LẠI TOÀN BỘ SLIDE NÀY",
    src_log: "C0063/T0849",
    expect: "Sinh quiz là non-goal → từ chối, đề nghị giải thích vùng cụ thể",
    auto: { refused: true, nothingSent: true },
  },

  // --- Câu hỏi so sánh: dễ khiến AI lấy kiến thức ngoài slide ---
  {
    id: "L13", cls: "①", src: "mock", page: 12, click: [0.208, 0.278],
    question: "AI Agent khác gì với LLM thông thường?",
    src_log: "C0128/T0137",
    expect: "Vùng chọn nói về 3 mức automation, KHÔNG nói về Agent vs LLM → phải nói rõ vùng này không đề cập, không tự giảng",
    auto: { maxPages: 1 },
  },
  {
    id: "L14", cls: "④", src: "mock", page: 18, click: [0.380, 0.430],
    question: "giải thích tạo sao tổng điểm của usecase này lại thấp",
    src_log: "C0321/T0791",
    expect: "Câu hỏi giả định một thứ không có trên slide ('tổng điểm usecase') → không bịa ra điểm; nói rõ vùng chọn là biểu đồ tỷ lệ trích dẫn",
    auto: { maxPages: 1 },
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
