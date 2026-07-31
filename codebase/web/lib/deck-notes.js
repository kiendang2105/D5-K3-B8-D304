// ============================================================
// GHI CHÚ BUỔI HỌC — thứ duy nhất phần ôn tập được phép nhìn thấy.
//
// Nguyên tắc, và cũng là lý do file này tồn tại thay vì đọc thẳng PDF:
//
//   TUTOR CHỈ BIẾT NHỮNG TRANG HỌC VIÊN ĐÃ TỰ MỞ.
//
// Không có bước "quét sẵn cả file" nào, kể cả lúc mở tài liệu. Học viên
// lật tới trang nào thì đúng lúc đó app ghi lại một ghi chú ngắn cho
// trang ấy — từ chính thứ nó đã đọc để phục vụ trang đó, không đọc thêm
// một lần nào chỉ để làm ghi chú:
//
//   - trang có lớp text  -> lấy tiêu đề (dòng chữ to nhất nửa trên) +
//                           đoạn đầu, cắt ở DECK_NOTE_CHARS. Không gọi AI.
//   - trang chỉ có ảnh   -> ghi "chưa đọc được" và ĐỂ NGUYÊN như vậy.
//                           Không tự ý quét ảnh sau lưng học viên.
//   - trang đã hỏi tutor -> nâng cấp ghi chú bằng chính câu tutor đã trả
//                           lời (bản đã hiểu, tốt hơn đoạn text thô).
//
// Nhờ (a) mà "quét cả tài liệu" không bao giờ xảy ra: một trang chưa lật
// tới thì với phần ôn tập nó không tồn tại. Học viên lướt hết buổi học
// thì tutor mới nhớ được hết buổi học — đúng thứ tự nhân quả đó.
//
// Ghi xuống localStorage theo từng tài liệu, giống ConversationStore.
// ============================================================

const DeckNotes = {
  docId: null,
  notes: {},        // { [pageNum]: {page, title, gist, source, at} }
  allPages: [],     // số trang THẬT của tài liệu, không phải 1..N

  // ---- vòng đời ----

  // allPages là danh sách số trang thật. Không suy ra từ "tổng số trang":
  // slide mẫu đánh số 12/18/24 (cố ý, để mô phỏng bẫy số trang lệch) nên
  // đếm 1..3 sẽ báo thiếu trang 1,2,3 trong khi học viên đã xem đủ cả ba.
  openDoc(docId, allPages) {
    this.docId = docId;
    this.allPages = Array.isArray(allPages) ? allPages.slice() : [];
    this.notes = this._load(docId);
    return this.count();
  },

  count() { return Object.keys(this.notes).length; },

  // Bao nhiêu phần tài liệu học viên đã thật sự đi qua.
  // Con số này phải hiện lên màn hình: nó là điều kiện để phần ôn tập có
  // nghĩa, mà cũng là thứ duy nhất học viên điều khiển được.
  coverage() {
    const seen = this.count();
    const total = this.allPages.length || seen;
    const missing = this.missingPages();
    return {
      seen, total,
      pct: total ? Math.round((seen * 100) / total) : 0,
      full: total > 0 && !missing.length,
      missing,
    };
  },

  missingPages() {
    return this.allPages.filter((n) => !this.notes[n]);
  },

  pages() {
    return Object.keys(this.notes).map(Number).sort((a, b) => a - b);
  },

  // ---- nhặt ghi chú ----

  // Gọi khi học viên MỞ một trang. Không ghi đè ghi chú "answer" đã có:
  // câu tutor đã giải thích luôn tốt hơn đoạn text thô cắt máy móc.
  visit(page) {
    if (!page) return null;
    const old = this.notes[page.num];
    if (old && old.source === "answer") return old;

    const note = this._fromPage(page);
    this.notes[page.num] = note;
    this._save();
    return note;
  },

  // Gọi sau khi tutor trả lời xong về một trang. Câu trả lời là bản đã
  // hiểu của chính trang đó, dùng làm ghi chú thì sát hơn text thô nhiều.
  noteFromAnswer(pageNum, answer, title) {
    const s = (answer || "").replace(/\s+/g, " ").trim();
    if (!pageNum || s.length < 40) return null;
    const cur = this.notes[pageNum];
    this.notes[pageNum] = {
      page: pageNum,
      title: (cur && cur.title) || title || "",
      gist: s.slice(0, CONFIG.DECK_NOTE_CHARS),
      source: "answer",
      at: new Date().toISOString(),
    };
    this._save();
    return this.notes[pageNum];
  },

  // Rút ghi chú từ lớp text của trang — KHÔNG gọi AI, không tốn gì.
  // Trang chỉ có ảnh thì thành thật ghi là chưa đọc được, chứ không tự
  // quét: quét ảnh là một lời gọi AI, mà học viên không hề yêu cầu.
  _fromPage(page) {
    const base = { page: page.num, at: new Date().toISOString() };

    if (page.textLen < CONFIG.MIN_TEXT_CHARS) {
      return { ...base, title: "", gist: "", source: "image" };
    }

    const items = (page.textItems || []).filter((t) => t.str && t.str.trim());
    const top = items.filter((t) => t.y < page.height * 0.5);
    const title = top.length
      ? top.slice().sort((a, b) => b.h - a.h)[0].str.trim().slice(0, 80)
      : "";

    // Đọc theo thứ tự trên xuống, trái sang phải — gần với cách người đọc
    const body = items.slice()
      .sort((a, b) => (Math.abs(a.y - b.y) > 6 ? a.y - b.y : a.x - b.x))
      .map((t) => t.str.trim()).join(" ")
      .replace(/\s+/g, " ").trim();

    return {
      ...base, title, source: "text",
      gist: body.slice(0, CONFIG.DECK_NOTE_CHARS),
    };
  },

  // ---- gói gửi đi ----

  // Trả mảng ghi chú đã cắt trần, kèm số ký tự thật. Cắt ở ĐÂY chứ không
  // tin vào chỗ gọi — cùng lý do buildPayload cắt trần lần nữa.
  forRequest() {
    // GIỮ cả trang chỉ có ảnh, dù ghi chú rỗng. Lọc chúng đi thì model
    // không biết trang đó tồn tại và sẽ tóm tắt buổi học như thể nó không
    // có — im lặng bỏ sót còn tệ hơn nói "trang này mình chưa đọc được".
    // Chúng tốn ~0 ký tự nên không ảnh hưởng trần.
    const list = this.pages().map((n) => this.notes[n]).filter(Boolean);

    const out = [];
    let total = 0;
    for (const n of list) {
      const gist = (n.gist || "").slice(0, CONFIG.DECK_NOTE_CHARS);
      const size = (n.title || "").length + gist.length;
      if (total + size > CONFIG.DECK_MAX_CHARS) break;
      total += size;
      out.push({ page: n.page, title: n.title || "", gist, source: n.source });
    }
    return { notes: out, chars: total, dropped: list.length - out.length };
  },

  // ---- lưu ----

  _key(docId) { return "VLEARN_DECK::" + (docId || this.docId || "?"); },

  _save() {
    try {
      localStorage.setItem(this._key(), JSON.stringify(this.notes));
    } catch (e) {
      console.warn("[deck] không lưu được ghi chú:", e);
    }
  },

  _load(docId) {
    try {
      const raw = localStorage.getItem(this._key(docId));
      const obj = raw ? JSON.parse(raw) : {};
      return obj && typeof obj === "object" && !Array.isArray(obj) ? obj : {};
    } catch (e) {
      return {};
    }
  },

  clear() {
    this.notes = {};
    this._save();
  },
};

// Xem ghi chú đang có từ Console: __deck()
window.__deck = () => JSON.stringify(DeckNotes.forRequest(), null, 2);
