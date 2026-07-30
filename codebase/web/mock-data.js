// ============================================================
// MOCK DATA — CP2 (chưa có AI thật, toàn bộ câu trả lời là mock)
// Tại CP3: thay router trong app.js bằng lời gọi Gemini vision
// với ảnh crop base64 — cấu trúc zone/citation giữ nguyên.
// ============================================================

// Mỗi slide: SVG 960x540 + danh sách "zone" (vùng nội dung có nghĩa).
// Zone dùng để mock việc AI nhận diện vùng chọn: vùng chọn của user
// chồng lên zone nào nhiều nhất thì trả câu giải thích của zone đó.

const MOCK_SLIDES = [
  {
    id: "slide-12",
    label: "Slide 12 · Automation",
    footer: "AI Thực Chiến · Buổi 2 · Xác định bài toán",
    svg: `
<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
  <rect width="960" height="540" fill="#ffffff"/>
  <rect width="960" height="8" fill="#4f46e5"/>
  <text x="60" y="70" font-family="Segoe UI, sans-serif" font-size="30" font-weight="700" fill="#111827">Chọn mức automation theo cost-of-error</text>

  <!-- Cột trái: 3 mức -->
  <text x="60" y="150" font-family="Segoe UI, sans-serif" font-size="19" fill="#111827">•  <tspan font-weight="700">Augment</tspan> — AI gợi ý, người quyết định</text>
  <text x="84" y="178" font-family="Segoe UI, sans-serif" font-size="15" fill="#6b7280">Sai thì đắt: kiến thức sai đến học viên</text>
  <text x="60" y="230" font-family="Segoe UI, sans-serif" font-size="19" fill="#111827">•  <tspan font-weight="700">Conditional</tspan> — case chắc thì tự làm</text>
  <text x="84" y="258" font-family="Segoe UI, sans-serif" font-size="15" fill="#6b7280">Case mơ hồ chuyển người xử lý</text>
  <text x="60" y="310" font-family="Segoe UI, sans-serif" font-size="19" fill="#111827">•  <tspan font-weight="700">Automate</tspan> — AI tự làm toàn bộ</text>
  <text x="84" y="338" font-family="Segoe UI, sans-serif" font-size="15" fill="#6b7280">Sai thì rẻ, user tự thấy và tự sửa được</text>

  <!-- Cột phải: sơ đồ conditional -->
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
        id: "z-flow",
        label: "Sơ đồ conditional automation",
        rect: [455, 95, 495, 335],
        citation: "Trang 12 · [T02-118]",
        answer:
          "Sơ đồ bạn chọn mô tả **mức automation Conditional**. Mỗi câu hỏi của học viên đi qua một cổng kiểm tra duy nhất: *\"Có căn cứ trong tài liệu không?\"*\n\n" +
          "• Nhánh **Có** (màu xanh): AI tự trả lời và bắt buộc kèm trích dẫn trang — vì đã có nguồn để user kiểm lại.\n" +
          "• Nhánh **Không** (màu đỏ): AI không đoán, mà nói rõ giới hạn rồi chuyển TA.\n\n" +
          "Ý chính của sơ đồ: quyền tự trả lời của AI phụ thuộc vào việc *có căn cứ hay không*, chứ không phụ thuộc độ tự tin của model.",
        simple:
          "Nói đơn giản: AI chỉ được tự trả lời khi tìm thấy câu trả lời trong tài liệu. Không tìm thấy thì nói thật là không biết và gọi TA — tuyệt đối không đoán.",
      },
      {
        id: "z-bullets",
        label: "3 mức automation",
        rect: [40, 120, 400, 240],
        citation: "Trang 12 · [T02-112]",
        answer:
          "Phần bạn chọn liệt kê **3 mức automation**, xếp theo mức độ AI tự quyết tăng dần:\n\n" +
          "1. **Augment** — AI chỉ gợi ý, người ra quyết định cuối. Dùng khi sai thì đắt (vd: kiến thức sai đến học viên).\n" +
          "2. **Conditional** — AI tự xử lý case chắc chắn, chuyển người xử lý case mơ hồ.\n" +
          "3. **Automate** — AI tự làm toàn bộ. Chỉ đúng khi sai thì rẻ và user tự phát hiện + tự sửa được.\n\n" +
          "Tiêu chí chọn mức nằm ở cột phải của slide: **cost-of-error** — sai thì ai chịu gì, sửa đắt hay rẻ.",
        simple:
          "3 mức từ thấp đến cao: AI gợi ý thôi (Augment) → AI tự làm phần chắc chắn (Conditional) → AI tự làm hết (Automate). Lỗi càng đắt thì càng phải để người kiểm soát nhiều hơn.",
      },
    ],
  },
  {
    id: "slide-18",
    label: "Slide 18 · Grounding",
    footer: "AI Thực Chiến · Buổi 2 · Xác định bài toán",
    svg: `
<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
  <rect width="960" height="540" fill="#ffffff"/>
  <rect width="960" height="8" fill="#4f46e5"/>
  <text x="60" y="70" font-family="Segoe UI, sans-serif" font-size="30" font-weight="700" fill="#111827">Tutor có đang grounding vào tài liệu?</text>

  <!-- Bar chart -->
  <line x1="100" y1="440" x2="480" y2="440" stroke="#9ca3af" stroke-width="2"/>
  <line x1="100" y1="440" x2="100" y2="130" stroke="#9ca3af" stroke-width="2"/>
  <rect x="150" y="199" width="110" height="241" fill="#4f46e5" rx="4"/>
  <text x="205" y="185" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="18" font-weight="700" fill="#312e81">53,8%</text>
  <text x="205" y="470" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="14" fill="#374151">Có trích dẫn</text>
  <rect x="310" y="233" width="110" height="207" fill="#f59e0b" rx="4"/>
  <text x="365" y="219" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="18" font-weight="700" fill="#92400e">46,2%</text>
  <text x="365" y="470" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="14" fill="#374151">Trích dẫn rỗng</text>

  <!-- Note box -->
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
        id: "z-chart",
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
      },
      {
        id: "z-note",
        label: "Ghi chú hậu quả",
        rect: [545, 135, 370, 230],
        citation: "Trang 18 · [T02-234]",
        answer:
          "Ô chú thích bạn chọn nêu **hậu quả của việc thiếu trích dẫn**: khi tutor không dẫn trang, học viên rơi vào một trong hai tình huống — *tin luôn* (rủi ro học sai) hoặc *tự đi tra lại* (tốn thời gian đáng lẽ tutor phải tiết kiệm cho họ).\n\nDòng cuối ghi phương pháp đo: đếm trên 1.261 turn chatlog thật trong tuần 22–29/07 — số kiểm lại được, không phải cảm nhận.",
        simple:
          "Không có nguồn thì một là tin bừa, hai là mất công tự tra. Cả hai đều là chi phí mà tutor lẽ ra phải cắt.",
      },
    ],
  },
];

// Từ khoá nhận diện yêu cầu ngoài phạm vi (lớp ③) — mock cho CP2
const OUT_OF_SCOPE_PATTERNS = [
  "làm hộ", "làm giúp", "giải hộ", "giải giúp", "đáp án", "code hộ",
  "làm bài tập", "nộp bài", "điểm của", "deadline",
];

const MOCK_REPLIES = {
  outOfScope:
    "Phần này mình không hỗ trợ được: mình chỉ **giải thích nội dung trên slide** để bạn tự làm, chứ không làm bài / đưa đáp án thay bạn.\n\nThay vào đó, nếu bạn chỉ vùng nào trên slide đang khiến bạn kẹt, mình giải thích kỹ vùng đó — hoặc bạn nhắn TA trên Discord cho các câu hỏi về bài tập & deadline nhé.",
  tooSmall:
    "Vùng bạn chọn hơi nhỏ, mình **chưa chắc** bạn đang muốn hỏi phần nào 🤔\n\nBạn kéo chọn rộng ra một chút — trọn sơ đồ hoặc trọn đoạn chữ — để mình không giải thích nhầm phần bạn không cần nhé.",
  noContent:
    "Trong vùng bạn vừa chọn, mình **không nhận diện được nội dung** nào của bài học (có thể là vùng trống hoặc lề slide).\n\nMình sẽ không đoán bừa để tránh giải thích sai. Bạn thử chọn lại vào sơ đồ, biểu đồ hoặc đoạn chữ trên slide — hoặc gõ câu hỏi cụ thể kèm vùng chọn.",
  feedbackThanks:
    "Cảm ơn bạn! Góp ý đã được ghi lại để nhóm cải thiện câu trả lời cho vùng này.",
};
