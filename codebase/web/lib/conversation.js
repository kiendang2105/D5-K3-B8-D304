// ============================================================
// KÝ ỨC HỘI THOẠI — nơi duy nhất giữ lịch sử chat.
//
// Trước file này: App.turns là mảng bị `shift()` khi quá 3 phần tử, nên
// app QUÊN SẠCH sau 3 lượt. Học viên hỏi 10 câu rồi nhắc "cái lúc nãy
// bạn nói ấy" là hệ thống không biết gì.
//
// Ở đây tách bạch hai chuyện hay bị lẫn:
//
//   1. LƯU  — giữ TOÀN BỘ hội thoại, không cắt, còn ghi ra localStorage
//             để tải lại trang vẫn còn. Đây là ký ức thật của phiên.
//   2. GỬI  — chọn phần nào của ký ức đó được đi ra ngoài. KHÔNG phải cứ
//             nhớ là được gửi: câu trả lời cũ về trang 18 mà kèm vào câu
//             hỏi trang 24 thì model đọc nội dung 2 trang trong 1 request,
//             phá đúng trần "1 trang/câu hỏi" mà sản phẩm đang khai.
//
// Cách giải: gửi hai tầng.
//   - Tầng ĐẦY ĐỦ  : lượt của ĐÚNG trang đang bàn — hỏi + đáp nguyên văn.
//   - Tầng DÀN Ý   : mọi lượt còn lại — chỉ CÂU HỎI CỦA HỌC VIÊN + số
//                    trang, KHÔNG kèm câu trả lời. Model biết "đã bàn gì
//                    rồi" để nối mạch, nhưng không nhận thêm chữ nào của
//                    trang khác.
//
// Câu hỏi là lời của chính học viên, không phải nội dung tài liệu — nên
// tầng dàn ý không làm rò rỉ thêm gì từ tài liệu. Bảng 🔒 vẫn khai đủ cả
// hai tầng để học viên tự kiểm.
//
// Đổi CONFIG.HISTORY_CROSS_PAGE để chạy golden set so ba chế độ:
//   "outline" (mặc định) · "full" (gửi cả đáp của trang khác) · "off"
// ============================================================

const ConversationStore = {
  turns: [],        // TOÀN BỘ lượt của tài liệu đang mở, không cắt
  docId: null,

  // ---- vòng đời ----

  // Mở tài liệu nào thì nạp đúng ký ức của tài liệu đó. Không trộn: d1 và
  // d2 đều có "trang 3", trộn vào là lịch sử tài liệu cũ chui vào request.
  openDoc(docId) {
    this.docId = docId;
    this.turns = this._load(docId);
    return this.turns.length;
  },

  add({ page, question, answer, mode }) {
    const turn = {
      n: this.turns.length + 1,
      page,
      question: question || "(giải thích vùng này)",
      answer: answer || "",
      mode: mode || null,
      at: new Date().toISOString(),
    };
    this.turns.push(turn);
    this._save();
    return turn;
  },

  clear() {
    this.turns = [];
    this._save();
  },

  count() { return this.turns.length; },

  // ---- đọc ----

  all() { return this.turns.slice(); },

  forPage(pageNum) { return this.turns.filter((t) => t.page === pageNum); },

  // Toàn bộ hội thoại dạng chữ — để đọc/kiểm tra/dán vào báo cáo.
  // Gõ `copy(ConversationStore.transcript())` trong Console là có ngay.
  transcript() {
    if (!this.turns.length) return "(chưa có lượt nào)";
    return this.turns.map((t) =>
      `[${t.n}] trang ${t.page}${t.mode ? ` · ${t.mode}` : ""} · ${t.at}\n` +
      `  HỌC VIÊN: ${t.question}\n` +
      `  TUTOR: ${t.answer}`).join("\n\n");
  },

  export() {
    return JSON.stringify({ doc: this.docId, turns: this.turns }, null, 2);
  },

  // ---- chọn phần được GỬI ĐI ----
  //
  // Trả { full, outline }:
  //   full    : [{question, answer}] — lượt cùng trang, cắt theo trần config
  //   outline : [{n, page, question}] — lượt trang khác, KHÔNG có answer
  contextFor(pageNum) {
    return ConversationStore.select(this.turns, pageNum);
  },

  // Bản THUẦN của contextFor: nhận mảng turns bất kỳ.
  // Tồn tại để eval/runner.js dùng ĐÚNG hàm chọn ngữ cảnh này thay vì tự
  // viết lại một bản na ná. Bài học lượt 03: runner tự mô phỏng một nhánh
  // mà app đã bỏ, thành ra đo một sản phẩm không tồn tại.
  select(turns, pageNum) {
    const mode = CONFIG.HISTORY_CROSS_PAGE;

    const same = (turns || []).filter((t) => t.page === pageNum);
    const full = same
      .slice(-CONFIG.HISTORY_MAX_TURNS)
      .map((t) => ({
        question: t.question.slice(0, 300),
        answer: (t.answer || "").slice(0, CONFIG.HISTORY_MAX_CHARS),
      }));

    if (mode === "off") return { full, outline: [] };

    const others = (turns || []).filter((t) => t.page !== pageNum);

    // "full": gửi luôn cả đáp của trang khác. KHÔNG phải mặc định — nó phá
    // trần 1 trang/câu hỏi. Để đây làm nhánh so sánh khi chạy golden set.
    if (mode === "full") {
      return {
        full,
        outline: others.slice(-CONFIG.HISTORY_OUTLINE_MAX).map((t) => ({
          n: t.n, page: t.page,
          question: t.question.slice(0, 300),
          answer: (t.answer || "").slice(0, CONFIG.HISTORY_MAX_CHARS),
        })),
      };
    }

    // "outline" — mặc định: chỉ câu hỏi + số trang
    return {
      full,
      outline: others.slice(-CONFIG.HISTORY_OUTLINE_MAX).map((t) => ({
        n: t.n, page: t.page, question: t.question.slice(0, 160),
      })),
    };
  },

  // ---- lưu xuống localStorage ----
  // Chỉ chữ của chính hội thoại này, không có ảnh, không có nội dung tài
  // liệu nào khác. Nằm trên máy học viên, không gửi đi đâu.

  _key(docId) { return "VLEARN_CHAT::" + (docId || this.docId || "?"); },

  _save() {
    try {
      localStorage.setItem(this._key(), JSON.stringify(this.turns));
    } catch (e) {
      // Hết chỗ (quota) thì bỏ nửa cũ rồi thử lại một lần — mất ký ức cũ
      // vẫn hơn là ném lỗi giữa lúc học viên đang hỏi.
      try {
        this.turns = this.turns.slice(-Math.ceil(this.turns.length / 2));
        localStorage.setItem(this._key(), JSON.stringify(this.turns));
        console.warn("[chat] localStorage đầy — đã cắt bớt nửa lịch sử cũ");
      } catch (e2) {
        console.warn("[chat] không lưu được lịch sử:", e2);
      }
    }
  },

  _load(docId) {
    try {
      const raw = localStorage.getItem(this._key(docId));
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  },
};

// Xem toàn bộ hội thoại từ Console: __chat()  ·  __chat("json")
window.__chat = (fmt) =>
  fmt === "json" ? ConversationStore.export() : ConversationStore.transcript();
