// ============================================================
// MOCK DATA — CP2. Toàn bộ câu trả lời ở đây là MOCK.
//
// 3 slide mẫu, trong đó slide 24 cố tình mô phỏng trường hợp
// "PDF không có text layer" (hasText: false) để demo được nhánh
// QUÉT ẢNH mà không cần file PDF thật.
//
// `zones` = vùng nội dung có nghĩa, toạ độ theo hệ 960x540.
// Dùng để mock việc AI nhận diện vùng người dùng khoanh.
// ============================================================

const MOCK_SLIDES = [
  {
    num: 12,
    label: "Slide 12 · Automation",
    hasText: true, // PDF đọc được text -> chế độ TEXT
    svg: `
<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
  <rect width="960" height="540" fill="#ffffff"/>
  <rect width="960" height="8" fill="#4f46e5"/>
  <text x="60" y="70" font-family="Segoe UI, sans-serif" font-size="30" font-weight="700" fill="#111827">Chọn mức automation theo cost-of-error</text>
  <text x="60" y="150" font-family="Segoe UI, sans-serif" font-size="19" fill="#111827">•  <tspan font-weight="700">Augment</tspan> — AI gợi ý, người quyết định</text>
  <text x="84" y="178" font-family="Segoe UI, sans-serif" font-size="15" fill="#6b7280">Sai thì đắt: kiến thức sai đến học viên</text>
  <text x="60" y="230" font-family="Segoe UI, sans-serif" font-size="19" fill="#111827">•  <tspan font-weight="700">Conditional</tspan> — case chắc thì tự làm</text>
  <text x="84" y="258" font-family="Segoe UI, sans-serif" font-size="15" fill="#6b7280">Case mơ hồ chuyển người xử lý</text>
  <text x="60" y="310" font-family="Segoe UI, sans-serif" font-size="19" fill="#111827">•  <tspan font-weight="700">Automate</tspan> — AI tự làm toàn bộ</text>
  <text x="84" y="338" font-family="Segoe UI, sans-serif" font-size="15" fill="#6b7280">Sai thì rẻ, user tự thấy và tự sửa được</text>
  <rect x="600" y="110" width="240" height="52" rx="8" fill="#eef2ff" stroke="#4f46e5" stroke-width="2"/>
  <text x="720" y="142" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="16" fill="#312e81">Câu hỏi học viên</text>
  <line x1="720" y1="162" x2="720" y2="196" stroke="#6b7280" stroke-width="2"/>
  <polygon points="720,192 714,182 726,182" fill="#6b7280"/>
  <polygon points="720,200 830,255 720,310 610,255" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
  <text x="720" y="248" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="14" fill="#78350f">Có căn cứ trong</text>
  <text x="720" y="268" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="14" fill="#78350f">tài liệu?</text>
  <line x1="610" y1="255" x2="560" y2="255" stroke="#6b7280" stroke-width="2"/>
  <line x1="560" y1="255" x2="560" y2="360" stroke="#6b7280" stroke-width="2"/>
  <polygon points="560,356 554,346 566,346" fill="#6b7280"/>
  <text x="572" y="248" font-family="Segoe UI, sans-serif" font-size="13" fill="#16a34a" font-weight="700">Có</text>
  <rect x="470" y="360" width="180" height="56" rx="8" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
  <text x="560" y="384" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="14" fill="#14532d">Tự trả lời</text>
  <text x="560" y="403" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="14" fill="#14532d">+ trích dẫn trang</text>
  <line x1="830" y1="255" x2="880" y2="255" stroke="#6b7280" stroke-width="2"/>
  <line x1="880" y1="255" x2="880" y2="360" stroke="#6b7280" stroke-width="2"/>
  <polygon points="880,356 874,346 886,346" fill="#6b7280"/>
  <text x="842" y="248" font-family="Segoe UI, sans-serif" font-size="13" fill="#dc2626" font-weight="700">Không</text>
  <rect x="790" y="360" width="150" height="56" rx="8" fill="#fee2e2" stroke="#dc2626" stroke-width="2"/>
  <text x="865" y="384" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="14" fill="#7f1d1d">Nói rõ giới hạn</text>
  <text x="865" y="403" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="14" fill="#7f1d1d">+ chuyển TA</text>
  <text x="60" y="512" font-family="Segoe UI, sans-serif" font-size="13" fill="#9ca3af">AI Thực Chiến · Buổi 2 · trang 12</text>
</svg>`,
    zones: [
      {
        id: "z12-flow",
        label: "Sơ đồ conditional automation",
        rect: [455, 95, 495, 335],
        citation: "Trang 12 · [T02-118]",
        answer:
          "Sơ đồ bạn chọn mô tả **mức automation Conditional**. Mỗi câu hỏi của học viên đi qua một cổng kiểm tra duy nhất: *\"Có căn cứ trong tài liệu không?\"*\n\n" +
          "• Nhánh **Có** (màu xanh): AI tự trả lời và bắt buộc kèm trích dẫn trang — vì đã có nguồn để user kiểm lại.\n" +
          "• Nhánh **Không** (màu đỏ): AI không đoán, mà nói rõ giới hạn rồi chuyển TA.\n\n" +
          "Ý chính: quyền tự trả lời của AI phụ thuộc vào việc *có căn cứ hay không*, chứ không phụ thuộc độ tự tin của model.",
        simple:
          "Nói đơn giản: AI chỉ được tự trả lời khi tìm thấy câu trả lời trong tài liệu. Không tìm thấy thì nói thật là không biết và gọi TA — tuyệt đối không đoán.",
        suggestions: ["Nhánh Không xảy ra khi nào?", "Vì sao phải kèm trích dẫn?"],
      },
      {
        id: "z12-bullets",
        label: "3 mức automation",
        rect: [40, 120, 400, 240],
        citation: "Trang 12 · [T02-112]",
        answer:
          "Phần bạn chọn liệt kê **3 mức automation**, xếp theo mức độ AI tự quyết tăng dần:\n\n" +
          "1. **Augment** — AI chỉ gợi ý, người ra quyết định cuối. Dùng khi sai thì đắt.\n" +
          "2. **Conditional** — AI tự xử lý case chắc chắn, chuyển người xử lý case mơ hồ.\n" +
          "3. **Automate** — AI tự làm toàn bộ. Chỉ đúng khi sai thì rẻ và user tự sửa được.\n\n" +
          "Tiêu chí chọn mức nằm ở tiêu đề slide: **cost-of-error** — sai thì ai chịu gì, sửa đắt hay rẻ.",
        simple:
          "3 mức từ thấp đến cao: AI gợi ý thôi (Augment) → AI tự làm phần chắc chắn (Conditional) → AI tự làm hết (Automate). Lỗi càng đắt thì càng phải để người kiểm soát nhiều.",
        suggestions: ["Cost-of-error là gì?", "Khi nào chọn Augment?"],
      },
    ],
  },

  {
    num: 18,
    label: "Slide 18 · Grounding",
    hasText: true,
    svg: `
<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
  <rect width="960" height="540" fill="#ffffff"/>
  <rect width="960" height="8" fill="#4f46e5"/>
  <text x="60" y="70" font-family="Segoe UI, sans-serif" font-size="30" font-weight="700" fill="#111827">Tutor có đang grounding vào tài liệu?</text>
  <line x1="100" y1="440" x2="480" y2="440" stroke="#9ca3af" stroke-width="2"/>
  <line x1="100" y1="440" x2="100" y2="130" stroke="#9ca3af" stroke-width="2"/>
  <rect x="150" y="199" width="110" height="241" fill="#4f46e5" rx="4"/>
  <text x="205" y="185" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="18" font-weight="700" fill="#312e81">53,8%</text>
  <text x="205" y="470" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="14" fill="#374151">Có trích dẫn</text>
  <rect x="310" y="233" width="110" height="207" fill="#f59e0b" rx="4"/>
  <text x="365" y="219" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="18" font-weight="700" fill="#92400e">46,2%</text>
  <text x="365" y="470" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="14" fill="#374151">Trích dẫn rỗng</text>
  <rect x="560" y="150" width="340" height="200" rx="10" fill="#fffbeb" stroke="#f59e0b" stroke-width="2"/>
  <text x="580" y="190" font-family="Segoe UI, sans-serif" font-size="17" font-weight="700" fill="#92400e">⚠ 46,2% lượt trả lời không kèm</text>
  <text x="580" y="215" font-family="Segoe UI, sans-serif" font-size="17" font-weight="700" fill="#92400e">trang tài liệu nào</text>
  <text x="580" y="252" font-family="Segoe UI, sans-serif" font-size="14" fill="#78350f">Học viên không kiểm lại được câu</text>
  <text x="580" y="274" font-family="Segoe UI, sans-serif" font-size="14" fill="#78350f">trả lời → tin sai hoặc mất công tự</text>
  <text x="580" y="296" font-family="Segoe UI, sans-serif" font-size="14" fill="#78350f">tra — cả hai đều tốn.</text>
  <text x="580" y="330" font-family="Segoe UI, sans-serif" font-size="13" fill="#b45309">Nguồn: chatlog 1.261 turn, 22–29/07</text>
  <text x="60" y="512" font-family="Segoe UI, sans-serif" font-size="13" fill="#9ca3af">AI Thực Chiến · Buổi 2 · trang 18</text>
</svg>`,
    zones: [
      {
        id: "z18-chart",
        label: "Biểu đồ tỷ lệ trích dẫn",
        rect: [80, 110, 420, 370],
        citation: "Trang 18 · [T02-231]",
        answer:
          "Biểu đồ cột bạn chọn so sánh **tỷ lệ câu trả lời của tutor có/không có trích dẫn tài liệu**:\n\n" +
          "• Cột xanh **53,8%** — trả lời có kèm số trang, học viên bấm vào kiểm lại được.\n" +
          "• Cột cam **46,2%** — trường citations rỗng: tutor trả lời \"chay\", không chỉ ra căn cứ.\n\n" +
          "Con số đo trên 1.261 lượt hỏi-đáp thật (22–29/07). Gần một nửa câu trả lời không kiểm chứng được là lý do slide này đặt câu hỏi về grounding.",
        simple:
          "Cứ 2 câu tutor trả lời thì gần 1 câu không dẫn nguồn trang nào — nghĩa là học viên phải tin chay, không kiểm lại được.",
        suggestions: ["Số liệu này đo thế nào?", "46,2% nghĩa là gì?"],
      },
      {
        id: "z18-note",
        label: "Ghi chú hậu quả",
        rect: [545, 135, 370, 230],
        citation: "Trang 18 · [T02-234]",
        answer:
          "Ô chú thích bạn chọn nêu **hậu quả của việc thiếu trích dẫn**: khi tutor không dẫn trang, học viên rơi vào một trong hai tình huống — *tin luôn* (rủi ro học sai) hoặc *tự đi tra lại* (tốn thời gian đáng lẽ tutor phải tiết kiệm cho họ).\n\nDòng cuối ghi phương pháp đo: đếm trên 1.261 turn chatlog thật tuần 22–29/07 — số kiểm lại được, không phải cảm nhận.",
        simple:
          "Không có nguồn thì một là tin bừa, hai là mất công tự tra. Cả hai đều là chi phí mà tutor lẽ ra phải cắt.",
      },
    ],
  },

  // ---- Slide mô phỏng PDF KHÔNG CÓ TEXT LAYER (ảnh chụp/scan) ----
  {
    num: 24,
    label: "Slide 24 · ảnh scan (không text)",
    hasText: false, // <- kích hoạt nhánh QUÉT ẢNH
    svg: `
<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
  <defs>
    <linearGradient id="glare" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="45%" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.10"/>
    </linearGradient>
  </defs>
  <rect width="960" height="540" fill="#4b5563"/>
  <g transform="rotate(-1.1 480 270)" font-family="Segoe UI, sans-serif">
    <rect x="26" y="20" width="912" height="502" fill="#e7e5e0"/>
    <text x="60" y="80" font-size="28" font-weight="700" fill="#2f2f2f">Bốn lớp chỗ khó của tính năng AI</text>
    <line x1="60" y1="96" x2="520" y2="96" stroke="#9a9a9a" stroke-width="2"/>

    <rect x="60" y="130" width="400" height="150" fill="#f5f3ee" stroke="#b0aca4" stroke-width="1.5"/>
    <text x="80" y="165" font-size="19" font-weight="700" fill="#7c2d12">① Nguồn sự thật</text>
    <text x="80" y="196" font-size="15" fill="#44403c">Chỗ nào AI bịa được?</text>
    <text x="80" y="222" font-size="15" fill="#44403c">Không có căn cứ thì làm gì?</text>
    <text x="80" y="255" font-size="13" fill="#78716c">vd: trích dẫn sai số trang</text>

    <rect x="500" y="130" width="400" height="150" fill="#f5f3ee" stroke="#b0aca4" stroke-width="1.5"/>
    <text x="520" y="165" font-size="19" font-weight="700" fill="#7c2d12">② Mơ hồ / thiếu thông tin</text>
    <text x="520" y="196" font-size="15" fill="#44403c">Input không đủ chắc: hỏi lại,</text>
    <text x="520" y="222" font-size="15" fill="#44403c">đoán có báo, hay từ chối?</text>
    <text x="520" y="255" font-size="13" fill="#78716c">vd: "giải thích cái này" — cái nào?</text>

    <rect x="60" y="300" width="400" height="150" fill="#f5f3ee" stroke="#b0aca4" stroke-width="1.5"/>
    <text x="80" y="335" font-size="19" font-weight="700" fill="#7c2d12">③ Ngoài phạm vi</text>
    <text x="80" y="366" font-size="15" fill="#44403c">User đòi thứ không được phép làm,</text>
    <text x="80" y="392" font-size="15" fill="#44403c">từ chối sao cho vẫn hữu ích?</text>
    <text x="80" y="425" font-size="13" fill="#78716c">vd: "làm hộ bài tập"</text>

    <rect x="500" y="300" width="400" height="150" fill="#f5f3ee" stroke="#b0aca4" stroke-width="1.5"/>
    <text x="520" y="335" font-size="19" font-weight="700" fill="#7c2d12">④ Đặc thù domain</text>
    <text x="520" y="366" font-size="15" fill="#44403c">Sai cái gì thì user học sai kiến thức,</text>
    <text x="520" y="392" font-size="15" fill="#44403c">mất điểm, mất niềm tin ngay?</text>
    <text x="520" y="425" font-size="13" fill="#78716c">vd: giải thích sai công thức trên sơ đồ</text>

    <text x="60" y="495" font-size="12" fill="#8a8a8a">AI Thực Chiến · Buổi 2 · trang 24</text>
  </g>
  <rect width="960" height="540" fill="url(#glare)"/>
</svg>`,
    zones: [
      {
        id: "z24-grid",
        label: "Bảng 4 lớp chỗ khó",
        rect: [45, 115, 875, 350],
        citation: "Trang 24 (quét ảnh) · [T02-402]",
        answer:
          "Trang này trong tài liệu là **ảnh chụp/scan, không có lớp text** — mình đã đọc bằng cách quét ảnh vùng bạn chọn.\n\n" +
          "Bảng bạn chọn chia rủi ro của một tính năng AI thành **4 lớp chỗ khó**:\n\n" +
          "**① Nguồn sự thật** — chỗ nào AI bịa được, và khi không có căn cứ thì xử lý ra sao.\n" +
          "**② Mơ hồ / thiếu thông tin** — input không đủ chắc: hỏi lại, đoán nhưng báo rõ, hay từ chối.\n" +
          "**③ Ngoài phạm vi** — user đòi thứ không được phép làm; từ chối thế nào mà vẫn hữu ích.\n" +
          "**④ Đặc thù domain** — sai cái gì thì học viên học sai kiến thức hoặc mất niềm tin ngay.\n\n" +
          "Lưu ý: vì đọc từ ảnh nên bạn nên đối chiếu lại phần chữ nhỏ với slide gốc.",
        simple:
          "4 kiểu tình huống dễ làm AI hỏng: ① không có nguồn nên bịa · ② không hiểu user muốn gì · ③ bị đòi làm việc ngoài quyền · ④ sai kiến thức chuyên môn.",
        suggestions: ["Lớp ① khác lớp ② chỗ nào?", "Cho ví dụ lớp ④"],
      },
      {
        id: "z24-cell1",
        label: "Ô ① Nguồn sự thật",
        rect: [55, 120, 410, 165],
        citation: "Trang 24 (quét ảnh) · [T02-404]",
        answer:
          "Ô bạn chọn là **lớp ① — Nguồn sự thật**. (Trang này không có text layer, mình đọc bằng quét ảnh vùng bạn chọn.)\n\n" +
          "Hai câu hỏi trong ô là bài kiểm tra bắt buộc cho mọi tính năng AI:\n" +
          "• *Chỗ nào AI bịa được?* — liệt kê những chỗ model có thể sinh ra thông tin không có trong tài liệu.\n" +
          "• *Không có căn cứ thì làm gì?* — phải quyết trước hành vi: nói không biết, hay chuyển người.\n\n" +
          "Ví dụ ghi ở dưới ô là *trích dẫn sai số trang* — lỗi nguy hiểm vì nhìn rất giống câu trả lời đúng.",
        simple:
          "Lớp ① hỏi: AI có thể bịa ở đâu, và khi không tìm được căn cứ thì nó phải làm gì. Ví dụ điển hình là dẫn sai số trang.",
      },
    ],
  },
];

// Từ khoá nhận diện yêu cầu ngoài phạm vi (lớp ③).
//
// Danh sách này lớn dần theo dữ liệu thật, không theo trí tưởng tượng.
// Lượt chạy 02 để lọt case `L12` — câu nguyên văn từ chatlog `C0063/T0849`:
// "TẠO QUIZ ĐỂ TÔI HIỂU RÕ VÀ ÔN LẠI TOÀN BỘ SLIDE NÀY". Sinh quiz là
// non-goal số 4 và đọc cả slide vượt giới hạn 1 trang/câu hỏi, nhưng không
// từ khoá nào khớp nên nó được gửi thẳng cho model. Bộ case tự nghĩ không
// bắt được lỗi này vì không ai nghĩ ra câu viết hoa kiểu đó.
const OUT_OF_SCOPE_PATTERNS = [
  // làm hộ bài / đòi đáp án
  "làm hộ", "làm giúp", "giải hộ", "giải giúp", "đáp án", "code hộ",
  "làm bài tập", "làm bài lab", "nộp bài",
  // logistics
  "điểm của", "deadline", "bao giờ thi", "khi nào thi", "lịch học",
  // non-goal: sinh quiz / ra đề
  "tạo quiz", "làm quiz", "sinh quiz", "tạo câu hỏi", "ra đề", "tạo đề",
  // vượt giới hạn 1 trang/câu hỏi: đòi đọc cả tài liệu
  "toàn bộ slide", "toàn bộ tài liệu", "cả tài liệu", "cả bài giảng",
  "tất cả các trang", "toàn bộ bài",
];

// Khớp chuỗi con không đủ. Lượt 03 để lọt `C28` — "đọc **hết tài liệu** rồi
// tóm tắt" — vì danh sách trên có "cả tài liệu" và "toàn bộ tài liệu" nhưng
// thiếu "hết tài liệu". Thêm mãi từ khoá là chạy theo đuôi.
//
// Regex dưới đòi ĐỦ BA THÀNH PHẦN cạnh nhau: động từ yêu cầu + từ chỉ toàn bộ
// + đối tượng tài liệu. Nhờ vậy "mình đọc hết rồi mà không hiểu" KHÔNG bị từ
// chối oan (thiếu thành phần thứ ba), còn "đọc hết tài liệu" thì bị chặn.
//
// Hạn chế còn lại: khớp mẫu kiểu này về bản chất vẫn giòn. Cách bền hơn là để
// model tự phán phạm vi, nhưng đó là một quyết định AI thứ hai — ghi vào
// backlog thay vì thêm ngay (rubric: sau CP4 không thêm feature mới).
// Ba nhánh, phân theo BẢN CHẤT của yêu cầu chứ không theo cách gõ:
const OUT_OF_SCOPE_REGEX = new RegExp([
  // 1. động từ yêu cầu + từ chỉ toàn bộ + đối tượng tài liệu
  "(đọc|tóm tắt|tóm lược|summar|xem|giải thích|liệt kê)\\s*(hết|toàn bộ|tất cả|cả|nguyên)\\s*(các\\s*)?(tài liệu|slide|bài giảng|bài|trang|file|deck)",
  // 2. đòi tóm tắt mà đối tượng là CẢ TÀI LIỆU (không phải một trang).
  //    Cố ý KHÔNG chặn "tóm tắt slide này / trang này / vùng này" — đó là
  //    một trang, hoàn toàn nằm trong giới hạn.
  "(tóm tắt|tóm lược|summar)[^.!?]{0,30}(tài liệu|bài giảng|deck|cả bài)",
  // 3. dải nhiều trang: "từ trang 1 đến trang 44"
  "từ\\s*trang\\s*\\d+[^.!?]{0,15}(đến|tới|->|-)\\s*trang\\s*\\d+",
].join("|"), "i");

// Mock cho nhánh "câu hỏi khái niệm mà tài liệu không nói tới".
// Bản thật do model quyết và tự gắn nhãn [NGOÀI TÀI LIỆU]; ở đây khớp từ khoá.
const OUTSIDE_DOC_HINTS = [
  { k: "agent", a: "Agent là hệ thống dùng LLM để **tự quyết chuỗi hành động** — gọi tool, đọc kết quả, quyết bước tiếp — thay vì chỉ sinh một câu trả lời rồi dừng. Phần slide bạn đang chọn không bàn về Agent, nên đây là kiến thức chung để bạn đối chiếu thôi." },
  { k: "rag", a: "RAG là cách cho model **tra tài liệu trước khi trả lời** thay vì dựa vào thứ nó nhớ sẵn: tìm đoạn liên quan, nhét vào ngữ cảnh, rồi mới sinh câu trả lời. Slide này không nói về RAG." },
  { k: "token", a: "Token là đơn vị model cắt văn bản ra để xử lý — thường ngắn hơn một từ. Giới hạn context tính theo token, không theo số chữ. Phần bạn chọn không đề cập khái niệm này." },
  { k: "fine-tun", a: "Fine-tuning là huấn luyện thêm trên dữ liệu riêng để đổi *hành vi* của model, khác với việc chỉ đổi prompt. Slide này không bàn tới." },
  { k: "hallucin", a: "Hallucination là khi model nói ra thứ nghe hợp lý nhưng không có căn cứ. Đây đúng là rủi ro mà sản phẩm này phải chặn, nhưng phần slide bạn chọn không định nghĩa nó." },
];

// Tin nhắn KHÔNG phải câu hỏi về tài liệu. Trả lời như người, và quan trọng
// hơn: KHÔNG gắn vào vùng nào, KHÔNG gửi gì ra ngoài. Gõ nhầm một chữ mà tốn
// một lời gọi AI kèm ảnh vùng là vô lý.
const CHITCHAT = {
  greeting: [
    "Chào bạn 👋 Bạn muốn hỏi gì về slide này?",
    "Chào bạn! Bấm vào phần nào trên slide là mình giải thích phần đó, hoặc cứ hỏi thẳng ở đây.",
  ],
  ack: [
    "Không có gì. Cần gì cứ hỏi nhé.",
    "Ừ, có gì bạn hỏi tiếp.",
  ],
  unclear: [
    "Mình chưa rõ ý bạn. Bạn gõ rõ hơn một chút, hoặc bấm vào phần trên slide mà bạn muốn hỏi nhé.",
    "Chỗ này mình chưa hiểu bạn muốn gì. Bạn viết đầy đủ hơn, hoặc chỉ vào phần cần hỏi trên slide.",
  ],
};

// Chào hỏi / cảm ơn / ừ ok — nhận diện để đáp cho tự nhiên
const CHITCHAT_GREET = /^(hi+|hello+|helo+|hey+|yo|alo|chào|chao|xin chào|hola)\b/i;
const CHITCHAT_ACK = /^(ok|oke|okay|ổn|uh|ừ|um|vâng|dạ|thanks?|thank you|tks|ty|cảm ơn|cam on|good|nice|hay)\b/i;

// Từ nối cho thấy đang hỏi TIẾP về thứ vừa bàn, không phải câu hỏi mới
const FOLLOWUP_HINT = /(chi tiết hơn|rõ hơn|kỹ hơn|đơn giản hơn|ngắn hơn|dài hơn|ví dụ|vd|còn|thế còn|vậy còn|tại sao|vì sao|sao lại|nghĩa là|tức là|ý là|cụ thể|thêm|nữa|này|đó|kia|ấy|vậy)/i;

// "slide này" / "trang này" trỏ tới TRANG ĐANG XEM chứ không phải vùng vừa
// hỏi. Chữ "này" nằm trong cả hai mẫu nên phải xét mẫu này trước.
const CURRENT_PAGE_REF = /\b(slide|trang|tài liệu|bài)\s*(này|hiện tại|đang xem|đang mở)/i;

const REPLIES = {
  outOfScope:
    "Phần này mình không hỗ trợ được: mình chỉ **giải thích nội dung trên slide** để bạn tự làm, chứ không làm bài / đưa đáp án thay bạn.\n\nThay vào đó, nếu bạn chỉ vùng nào trên slide đang khiến bạn kẹt, mình giải thích kỹ vùng đó — hoặc bạn nhắn TA trên Discord cho các câu hỏi về bài tập & deadline nhé.",
  tooSmall:
    "Vùng bạn chọn hơi nhỏ, mình **chưa chắc** bạn đang muốn hỏi phần nào 🤔\n\nBạn kéo chọn rộng ra một chút — trọn sơ đồ hoặc trọn đoạn chữ — để mình không giải thích nhầm phần bạn không cần nhé.",
  noContent:
    "Trong vùng bạn vừa chọn, mình **không nhận diện được nội dung** nào của bài học (có thể là vùng trống hoặc lề slide).\n\nMình sẽ không đoán bừa để tránh giải thích sai. Bạn thử chọn lại vào sơ đồ, biểu đồ hoặc đoạn chữ trên slide nhé.",
  noPageInQuestion:
    "Bạn đang hỏi về **slide nào** vậy? Mình chưa chắc nên chưa dám trả lời.\n\nBạn nhắn kèm số slide (vd: *\"giải thích slide 24\"*), hoặc khoanh trực tiếp vùng cần hỏi trên slide bên trái — như vậy mình chắc chắn giải thích đúng phần bạn cần.",
  pageOutOfRange: (n, rangeText) =>
    `Mình không tìm thấy trang ${n} trong tài liệu đang mở — tài liệu này có ${rangeText}.\n\nBạn kiểm tra lại số trang giúp mình nhé, hoặc khoanh trực tiếp vùng cần hỏi trên slide.`,
  feedbackThanks:
    "Cảm ơn bạn! Góp ý đã được ghi lại để nhóm cải thiện câu trả lời cho vùng này.",

  // Trả lời mock cho PDF thật (không có zone khai sẵn) — CP3 thay bằng vision thật
  realPdfPlaceholder: (page, mode) =>
    `*(CP2 — câu trả lời mock)* Mình đã lấy được **trang ${page}** của tài liệu bạn mở, ở chế độ **${
      mode === "scan" ? "QUÉT ẢNH" : "đọc text"
    }**.\n\n${
      mode === "scan"
        ? "Trang này **không có lớp text** (slide ảnh hoặc bản scan), nên đường đọc text thông thường sẽ trả về rỗng. Thay vì trả lời chay, hệ thống cắt đúng vùng bạn chọn thành ảnh rồi gửi cho model nhìn — ảnh gửi đi chính là ảnh bạn thấy ở trên."
        : "Trang này có lớp text đọc được, nên hệ thống gửi ảnh vùng bạn chọn kèm phần text nằm trong vùng đó — không gửi text cả trang."
    }\n\nỞ **CP3**, chỗ này sẽ là lời gọi Gemini vision thật với đúng ảnh đó. Toàn bộ phần nhận diện chế độ, cắt vùng và trích dẫn trang bạn đang thấy là **thật**, chỉ riêng đoạn văn giải thích là mock.`,
};
