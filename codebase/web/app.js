// ============================================================
// APP — nối các phần lại.
//
// Ba đường vào cùng một quyết định AI:
//   (A) CLICK vào slide          -> ContentDetector tự dò khối nội dung
//   (B) KÉO khoanh tay            -> khi máy dò không đúng ý (G9)
//   (C) Gõ "giải thích slide N"   -> đọc trang N mà KHÔNG rời slide đang xem
//
// Cả ba đều quy về "một vùng trên một trang", nên lát cắt
// "chọn một vùng · giải thích vùng đó" giữ nguyên.
//
// (C) cố ý KHÔNG chuyển màn hình: học viên đang đọc slide 12 mà bị kéo
// sang slide 24 là mất chỗ đang đọc. Trang được hỏi chỉ nạp ngầm để đọc,
// kèm thumbnail làm bằng chứng và nút "Đi tới slide N" nếu họ muốn.
// ============================================================

const App = {
  source: null,
  currentPage: null,
  busy: false,
  lastAsk: null, // { question, region, page } — vùng đang bàn, để nối câu hỏi tiếp
  turns: [],     // lịch sử hội thoại (chỉ chữ), dùng cho câu hỏi tiếp

  async init() {
    SlideViewer.init();
    RegionSelector.init();
    ExplainPanel.init();

    RegionSelector.onSelected = (e) => this.showPopover(e);
    RegionSelector.onEmptyClick = () => this.onEmptyClick();
    ExplainPanel.onFixPage = (n) => this.rescanPage(n);

    document.getElementById("btn-ask").onclick = () => this.askFromPopover();
    document.getElementById("btn-cancel").onclick = () => this.cancelSelection();
    document.getElementById("question").addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") this.askFromPopover();
    });

    document.getElementById("chat-send").onclick = () => this.askFromChat();
    document.getElementById("chat-q").addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") this.askFromChat();
    });

    document.getElementById("pdf-input").addEventListener("change", (ev) => {
      if (ev.target.files[0]) this.openPdf(ev.target.files[0]);
    });
    document.getElementById("btn-mock").onclick = () => this.useMock();
    document.getElementById("btn-key").onclick = () => this.configKey();

    this.buildDeckButtons();
    this.restoreKey();
    await this.useMock();
  },

  // ---------- nguồn tài liệu ----------

  // Slide deck trong data pack thành nút bấm sẵn, đặt cạnh "Slide mẫu"
  buildDeckButtons() {
    const host = document.getElementById("deck-buttons");
    for (const deck of CONFIG.BUILTIN_DECKS) {
      const b = document.createElement("button");
      b.textContent = "📄 " + deck.label;
      b.onclick = () => this.openBuiltinDeck(deck);
      host.appendChild(b);
    }
  },

  async useMock() {
    this.source = new MockSource();
    document.getElementById("doc-name").textContent = this.source.name;
    await this.buildTabs();
    await this.goToPage(MOCK_SLIDES[0].num);
  },

  // Mở PDF do user tự chọn
  async openPdf(file) {
    return this.useSource(
      () => PdfSource.open(file), file.name);
  },

  // Mở slide deck có sẵn trong data pack — bấm một nút là xong
  async openBuiltinDeck(deck) {
    return this.useSource(() => PdfSource.openUrl(deck.url), deck.label);
  },

  async useSource(open, label) {
    const note = ExplainPanel.addSystemNote(`Đang mở **${label}**…`);
    try {
      this.source = await open();
      document.getElementById("doc-name").textContent =
        `${this.source.name} · ${this.source.pageCount} trang`;
      await this.buildTabs();
      await this.goToPage(1);
      note.innerHTML = mdBold(
        `Đã mở **${this.source.name}** (${this.source.pageCount} trang). ` +
        `Bấm vào một phần trên slide để hỏi, hoặc gõ *"giải thích trang 3"*.`);
    } catch (err) {
      const fileProto = location.protocol === "file:";
      note.innerHTML = mdBold(
        `**Không mở được ${label}:** ${err.message}\n\n` +
        (fileProto
          ? "Đang mở bằng `file://` nên trình duyệt chặn đọc file. Chạy qua server tĩnh: " +
            "`python -m http.server 8765` từ gốc repo, rồi mở " +
            "`http://localhost:8765/codebase/web/index.html`."
          : "Kiểm lại file có trong `data/vlearn-pack/slides/` chưa — data pack " +
            "không được commit vào repo nên máy mới clone sẽ chưa có."));
    }
  },

  async buildTabs() {
    const tabs = document.getElementById("page-tabs");
    tabs.innerHTML = "";
    const labels = this.source.pageLabels();
    // PDF dài thì chỉ hiện 12 trang đầu cho gọn — vẫn hỏi được trang khác qua chat
    for (const p of labels.slice(0, 12)) {
      const b = document.createElement("button");
      b.textContent = p.label;
      b.dataset.page = p.index;
      b.onclick = () => this.goToPage(p.index);
      tabs.appendChild(b);
    }
    if (labels.length > 12) {
      const more = document.createElement("span");
      more.className = "tabs-more";
      more.textContent = `… và ${labels.length - 12} trang nữa — hỏi qua chat`;
      tabs.appendChild(more);
    }
  },

  async goToPage(num) {
    const page = await this.source.getPage(num);
    if (!page) return null;
    this.currentPage = page;
    SlideViewer.setPage(page);
    this.hidePopover();
    [...document.getElementById("page-tabs").children].forEach((b) =>
      b.classList && b.classList.toggle("active", Number(b.dataset.page) === num));
    this.renderPageMeta(page);
    return page;
  },

  // Băng thông tin trạng thái trang: có text hay phải quét ảnh (G2 — nói rõ
  // hệ thống đang làm tốt đến đâu, TRƯỚC khi user hỏi)
  renderPageMeta(page) {
    const meta = document.getElementById("page-meta");
    const mode = Explain.readMode(page);
    meta.className = "page-meta " + mode;
    meta.innerHTML = mode === "text"
      ? `<b>📄 Trang này đọc được text</b> (${page.textLen} ký tự) — mình trả lời dựa trên nội dung tài liệu.`
      : `<b>👁 Trang này không có lớp text</b> (${page.textLen} ký tự) — slide dạng ảnh/scan. ` +
        `Mình sẽ <b>quét ảnh vùng bạn chọn</b> để đọc thay vì trả lời chay.`;
  },

  // ---------- popover ----------

  showPopover(mouseEvent) {
    const wrap = document.getElementById("slide-wrap");
    const wr = wrap.getBoundingClientRect();
    const pop = document.getElementById("popover");
    let left = mouseEvent.clientX - wr.left + 10;
    let top = mouseEvent.clientY - wr.top + 10;
    pop.style.left = Math.max(8, Math.min(left, wr.width - 312)) + "px";
    pop.style.top = Math.max(8, Math.min(top, wr.height - 124)) + "px";
    pop.classList.add("show");
    const q = document.getElementById("question");
    q.value = "";
    q.focus();
  },

  hidePopover() {
    document.getElementById("popover").classList.remove("show");
  },

  cancelSelection() {
    RegionSelector.clear();
    this.hidePopover();
  },

  // ---------- ba đường vào ----------

  // (A) CLICK vào slide -> ContentDetector đã dò xong vùng, chỉ hỏi thêm
  askFromPopover() {
    if (!RegionSelector.regionPage) return;
    const question = document.getElementById("question").value.trim();
    const region = { ...RegionSelector.regionPage };
    this.hidePopover();
    this.ask({ question, region, page: this.currentPage });
  },

  // Bấm vào chỗ trống -> không đoán (lớp ①)
  async onEmptyClick() {
    if (this.busy) return;
    this.hidePopover();
    ExplainPanel.addUser({ question: "(bấm vào một chỗ trên slide)" });
    const { bubble } = ExplainPanel.addBot();
    await ExplainPanel.stream(bubble, REPLIES.noContent);
  },

  // (B) hỏi bằng chat, có thể nhắc tới slide KHÁC slide đang xem.
  // KHÔNG kéo học viên rời khỏi slide họ đang đọc: trang được hỏi chỉ
  // được nạp ngầm để đọc, kèm nút "Đi tới slide N" nếu họ muốn chuyển.
  async askFromChat() {
    const input = document.getElementById("chat-q");
    const question = input.value.trim();
    if (!question || this.busy) return;
    input.value = "";

    // Thứ tự ưu tiên khi tìm CĂN CỨ cho câu hỏi — từ cụ thể nhất tới rộng nhất.
    // Không còn nhánh nào bỏ mặc học viên: gõ câu gì cũng được trả lời.
    //
    //   1. Câu nêu rõ số slide       -> đọc trang đó
    //   2. Đang có vùng chọn         -> vùng đó
    //   3. Vừa hỏi xong một vùng     -> nối tiếp vùng đó (G12)
    //   4. Không có gì cả            -> TRANG ĐANG XEM
    //
    // Bậc 4 là đường mới. Trước đây nó đáp "bạn đang hỏi slide nào?" ngay cả
    // khi học viên đang mở một slide trước mắt — hỏi một thứ hiển nhiên.
    // Guardrail phải chạy TRƯỚC nhánh số trang. Nếu không thì câu "tóm tắt từ
    // trang 1 đến trang 20" sẽ đi vào nhánh số trang, trả lời về trang 1 và
    // IM LẶNG BỎ QUA việc học viên đòi 20 trang — tệ hơn là từ chối thẳng.
    if (Explain.isOutOfScope(question)) {
      ExplainPanel.addUser({ question });
      ExplainPanel.addSystemNote(
        "Câu này ngoài phạm vi → **không có dữ liệu nào được gửi ra ngoài**.");
      const { bubble } = ExplainPanel.addBot();
      await ExplainPanel.stream(bubble, REPLIES.outOfScope);
      return;
    }

    const m = question.match(PAGE_IN_QUESTION);

    if (m) {
      const n = parseInt(m[1], 10);
      if (!this.source.hasPage(n)) {
        ExplainPanel.addUser({ question });
        const { bubble } = ExplainPanel.addBot();
        await ExplainPanel.stream(bubble,
          REPLIES.pageOutOfRange(n, this.source.rangeText()));
        return;
      }
      return this.askAboutPage(n, question);
    }

    if (RegionSelector.regionPage) {
      return this.ask({
        question, region: { ...RegionSelector.regionPage }, page: this.currentPage });
    }

    if (this.lastAsk && this.lastAsk.region && this.lastAsk.page) {
      return this.ask({
        question,
        region: this.lastAsk.region,
        page: this.lastAsk.page,
        offScreen: this.lastAsk.page !== this.currentPage,
        followUp: true,
      });
    }

    // Bậc 4 — câu hỏi text thuần, lấy trang đang xem làm căn cứ
    return this.askAboutCurrentPage(question);
  },

  // Câu hỏi text thuần: không chọn vùng, không nêu slide.
  // Căn cứ = TRANG ĐANG XEM. Model tự quyết nội dung trang có trả lời được
  // câu này không; không có thì nói rõ và (nếu là câu khái niệm) trả lời
  // bằng kiến thức chung NHƯNG phải đánh dấu rõ là ngoài tài liệu.
  async askAboutCurrentPage(question) {
    const page = this.currentPage;
    if (!page) return;
    const region = { ...ContentDetector.contentBounds(page), wholePage: true };
    return this.ask({ question, region, page, textQuestion: true });
  },

  // Hỏi về một trang bất kỳ mà KHÔNG chuyển màn hình.
  // Trang được nạp ngầm (chỉ đúng trang đó), lấy phần có nội dung, gửi đi.
  async askAboutPage(n, question, redo) {
    const page = await this.source.getPage(n);
    if (!page) return;

    const offScreen = page !== this.currentPage;
    const region = offScreen
      ? { ...ContentDetector.contentBounds(page), wholePage: true }
      : RegionSelector.selectWholePage();

    this.ask({ question, region, page, offScreen, redo });
  },

  // Khi user báo "không phải trang này" -> đọc lại trang khác, giữ câu hỏi cũ
  async rescanPage(n) {
    if (!this.source.hasPage(n)) {
      const { bubble } = ExplainPanel.addBot();
      await ExplainPanel.stream(bubble, REPLIES.pageOutOfRange(n, this.source.rangeText()));
      return;
    }
    this.askAboutPage(n, this.lastAsk?.question || "", true);
  },

  // ---------- lõi: một lượt hỏi ----------

  // region: toạ độ TRANG · page: trang được hỏi (có thể khác trang đang xem)
  // followUp: câu hỏi tiếp về đúng vùng của lượt trước
  async ask({ question, region, page, offScreen, redo, followUp }) {
    if (this.busy || !region) return;
    page = page || this.currentPage;
    this.busy = true;
    RegionSelector.locked = true;

    const mode = Explain.readMode(page);
    // Ảnh hiện trong bong bóng chat CHÍNH LÀ ảnh sẽ gửi đi — không có
    // ảnh nào khác rời máy. Học viên nhìn bong bóng là biết đã gửi gì.
    const cropImage = ContentDetector.cropPage(page, region);

    ExplainPanel.addUser({
      cropImage,
      question: redo ? `(đọc lại) ${question || "Giải thích phần này"}` : question,
    });

    const blocked = Explain.isOutOfScope(question);

    // Nói cho user biết hệ thống đang làm gì TRƯỚC khi trả lời (G1/G11)
    if (blocked) {
      // Ảnh vẫn hiện trong bong bóng vì đó là vùng học viên đã chọn, nhưng
      // nói rõ là chưa có gì rời khỏi máy — tránh hiểu nhầm đã gửi đi.
      ExplainPanel.addSystemNote(
        "Câu này ngoài phạm vi → **không có dữ liệu nào được gửi ra ngoài**.");
    } else {
      // Nói rõ đang nối tiếp vùng nào, để học viên không tưởng máy đoán bừa
      if (followUp) {
        ExplainPanel.addSystemNote(
          `Hiểu là bạn hỏi tiếp về **vùng vừa rồi ở trang ${page.num}** — ` +
          "muốn hỏi phần khác thì bấm vào đúng phần đó trên slide.");
      }
      if (offScreen && !followUp) {
        ExplainPanel.addSystemNote(
          `Đang đọc **trang ${page.num}** (bạn vẫn ở trang ${this.currentPage.num}) — ` +
          "chỉ nạp đúng trang đó, không mở cả tài liệu.");
      }
      if (mode === "scan") {
        ExplainPanel.addSystemNote(
          `Trang ${page.num} không có lớp text → **đọc bằng quét ảnh vùng đã chọn**…`);
      }
    }

    RegionSelector.clear();

    // Lịch sử chỉ gửi khi hỏi tiếp về ĐÚNG vùng đó, và chỉ gửi CHỮ của các
    // lượt trước (câu hỏi của học viên + câu trả lời của model) — không có
    // ảnh hay text mới nào của tài liệu rời máy vì thế.
    const reply = await Explain.run({
      question, page, region, mode,
      history: followUp ? this.historyFor(page.num, region) : null,
    });

    const { div, bubble } = ExplainPanel.addBot();
    bubble.innerHTML = '<span class="cursor-blink">▌</span>';
    if (reply.text) {
      await ExplainPanel.stream(bubble, reply.text);
    } else {
      bubble.remove(); // chỉ có phần kiến thức chung, không có phần từ tài liệu
    }

    // Kiến thức chung hiện trong khối riêng, có nhãn — không trộn vào trên
    if (reply.outsideDoc) {
      const body = ExplainPanel.addOutsideDoc(div, "");
      await ExplainPanel.stream(body, reply.outsideDoc);
    }

    // Chỉ khoe "đọc bằng gì" khi thực sự có đọc nội dung. Câu từ chối
    // hoặc hỏi lại (grounded: false) không kèm badge/bằng chứng.
    if (reply.grounded !== false) {
      ExplainPanel.addModeBadge(div, reply.mode || mode);

      // Bằng chứng đọc đúng trang nào + đường sửa. Bắt buộc khi quét ảnh
      // (bẫy số trang lệch) và khi đọc trang đang không hiển thị.
      if ((reply.mode || mode) === "scan" || offScreen) {
        ExplainPanel.addScanEvidence(div, {
          thumb: SlideViewer.thumbOf(page),
          pageNum: page.num,
          pageCount: this.source.kind === "pdf" ? this.source.pageCount : null,
          offScreen,
          onGoTo: offScreen ? () => this.goToPage(page.num) : null,
        });
      }

      // Công khai chính xác cái gì đã rời khỏi máy học viên
      if (reply.disclosure) ExplainPanel.addDisclosure(div, reply.disclosure);
    }

    if (reply.citation) ExplainPanel.addCitation(div, reply.citation);

    // Nút "Vùng này ở đâu?" chỉ có nghĩa khi vùng nằm trên trang ĐANG XEM.
    // Nháy sáng một vùng của trang khác thì vô nghĩa và gây hiểu nhầm.
    const canShow = reply.grounded !== false && page === this.currentPage;
    ExplainPanel.addActions(div, reply.zone || null,
      canShow ? () => RegionSelector.flash(region) : null);
    // Gợi ý câu hỏi tiếp — bấm là gửi luôn, coi như học viên tự gõ
    ExplainPanel.addSuggestions(div, reply.suggestions, (q) => {
      document.getElementById("chat-q").value = q;
      this.askFromChat();
    });
    ExplainPanel.scroll();

    // Ghi lượt này lại để câu hỏi tiếp nối được đúng vùng.
    // Chỉ ghi khi thực sự đã đọc nội dung — câu bị từ chối hoặc hỏi lại
    // không được thành "vùng đang bàn", nếu không thì học viên gõ tiếp một
    // câu vô thưởng vô phạt lại kéo cả vùng cũ ra trả lời.
    if (reply.grounded !== false) {
      this.turns.push({ page: page.num, question: question || "(giải thích vùng này)", answer: reply.text });
      if (this.turns.length > CONFIG.HISTORY_MAX_TURNS) this.turns.shift();
      this.lastAsk = { question, region, page };
    }

    this.busy = false;
    RegionSelector.locked = false;
  },

  // Lịch sử hội thoại cho câu hỏi tiếp — CHỈ các lượt về đúng trang này.
  // Không trộn lượt của trang khác vào: làm vậy là gián tiếp gửi nội dung
  // nhiều trang trong một request, phá giới hạn 1 trang/câu hỏi.
  historyFor(pageNum) {
    return this.turns
      .filter((t) => t.page === pageNum)
      .slice(-CONFIG.HISTORY_MAX_TURNS)
      .map((t) => ({
        question: t.question.slice(0, 300),
        answer: t.answer.slice(0, CONFIG.HISTORY_MAX_CHARS),
      }));
  },

  // ---------- API key (CP3) ----------

  async configKey() {
    const cur = localStorage.getItem("GEMINI_API_KEY") || "";
    const v = prompt(
      "Nhập Gemini API key (lấy ở aistudio.google.com/apikey).\n" +
      "Key chỉ lưu trong localStorage của trình duyệt này, KHÔNG commit vào repo.\n\n" +
      "Để trống = xoá key và quay lại chế độ mock.",
      cur
    );
    if (v === null) return;

    if (!v.trim()) {
      localStorage.removeItem("GEMINI_API_KEY");
      localStorage.removeItem("GEMINI_MODEL");
      CONFIG.USE_REAL_AI = false;
      CONFIG.GEMINI_MODEL = null;
      this.setModeBadge(false);
      ExplainPanel.addSystemNote("Đã xoá key → quay lại chế độ **mock**.");
      return;
    }

    const key = v.trim();
    const note = ExplainPanel.addSystemNote("Đang kiểm key và dò danh sách model…");

    // Dò model thay vì hardcode tên: key khác nhau mở khoá model khác nhau
    try {
      const models = await Explain.listModels(key);
      if (!models.length) throw new Error("key hợp lệ nhưng không có model nào dùng được");

      const picked = Explain.pickModel(models);
      localStorage.setItem("GEMINI_API_KEY", key);
      localStorage.setItem("GEMINI_MODEL", picked);
      CONFIG.GEMINI_MODEL = picked;
      CONFIG.USE_REAL_AI = true;
      this.setModeBadge(true, picked);

      const others = models.filter((m) => m.id !== picked).slice(0, 8).map((m) => m.id);
      note.innerHTML = mdBold(
        `Key hợp lệ. Đang dùng model **${picked}** (${models.length} model khả dụng).\n\n` +
        (others.length ? `Model khác: ${others.join(", ")}` : "") +
        `\n\nĐổi model: chạy \`localStorage.setItem("GEMINI_MODEL","<tên>")\` trong Console rồi tải lại trang.`);
    } catch (err) {
      note.innerHTML = mdBold(
        `**Key không dùng được:** ${err.message}\n\n` +
        "Kiểm lại key ở aistudio.google.com/apikey. Vẫn đang ở chế độ mock.");
    }
  },

  setModeBadge(real, model) {
    const b = document.getElementById("badge-mode");
    b.textContent = real ? `CP3 · AI THẬT · ${model}` : "CP2 · MOCK — chưa gọi AI thật";
    b.classList.toggle("real", !!real);
  },

  // Có key sẵn từ phiên trước thì bật AI thật luôn
  restoreKey() {
    const key = localStorage.getItem("GEMINI_API_KEY");
    const model = localStorage.getItem("GEMINI_MODEL");
    if (key && model) {
      CONFIG.GEMINI_MODEL = model;
      CONFIG.USE_REAL_AI = true;
      this.setModeBadge(true, model);
    }
  },
};

App.init();
