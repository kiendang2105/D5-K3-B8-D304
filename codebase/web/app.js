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
  lastAsk: null, // để hỏi lại khi user báo quét nhầm trang

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

    await this.useMock();
  },

  // ---------- nguồn tài liệu ----------

  async useMock() {
    this.source = new MockSource();
    document.getElementById("doc-name").textContent = this.source.name;
    await this.buildTabs();
    await this.goToPage(MOCK_SLIDES[0].num);
  },

  async openPdf(file) {
    const note = ExplainPanel.addSystemNote(`Đang mở **${file.name}**…`);
    try {
      this.source = await PdfSource.open(file);
      document.getElementById("doc-name").textContent =
        `${file.name} · ${this.source.pageCount} trang`;
      await this.buildTabs();
      await this.goToPage(1);
      note.innerHTML = mdBold(
        `Đã mở **${file.name}** (${this.source.pageCount} trang). ` +
        `Khoanh vùng để hỏi, hoặc gõ *"giải thích trang 3"*.`);
    } catch (err) {
      note.innerHTML = mdBold(
        `Không mở được PDF: ${err.message}\n\n` +
        `Nếu bạn mở file bằng \`file://\`, hãy chạy qua server tĩnh ` +
        `(\`npx serve codebase/web\`) rồi thử lại — pdf.js cần tải được worker.`);
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
    await ExplainPanel.stream(bubble, MOCK_REPLIES.noContent);
  },

  // (B) hỏi bằng chat, có thể nhắc tới slide KHÁC slide đang xem.
  // KHÔNG kéo học viên rời khỏi slide họ đang đọc: trang được hỏi chỉ
  // được nạp ngầm để đọc, kèm nút "Đi tới slide N" nếu họ muốn chuyển.
  async askFromChat() {
    const input = document.getElementById("chat-q");
    const question = input.value.trim();
    if (!question || this.busy) return;
    input.value = "";

    const m = question.match(PAGE_IN_QUESTION);

    // ② Mơ hồ: không nêu slide nào và cũng không chọn vùng -> hỏi lại
    if (!m && !RegionSelector.regionPage) {
      ExplainPanel.addUser({ question });
      const { bubble } = ExplainPanel.addBot();
      await ExplainPanel.stream(bubble, MOCK_REPLIES.noPageInQuestion);
      return;
    }

    if (m) {
      const n = parseInt(m[1], 10);
      if (!this.source.hasPage(n)) {
        ExplainPanel.addUser({ question });
        const { bubble } = ExplainPanel.addBot();
        await ExplainPanel.stream(bubble,
          MOCK_REPLIES.pageOutOfRange(n, this.source.rangeText()));
        return;
      }
      return this.askAboutPage(n, question);
    }

    // có vùng đang chọn sẵn trên slide đang xem -> hỏi về vùng đó
    this.ask({ question, region: { ...RegionSelector.regionPage }, page: this.currentPage });
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
      await ExplainPanel.stream(bubble, MOCK_REPLIES.pageOutOfRange(n, this.source.rangeText()));
      return;
    }
    this.askAboutPage(n, this.lastAsk?.question || "", true);
  },

  // ---------- lõi: một lượt hỏi ----------

  // region: toạ độ TRANG · page: trang được hỏi (có thể khác trang đang xem)
  async ask({ question, region, page, offScreen, redo }) {
    if (this.busy || !region) return;
    page = page || this.currentPage;
    this.busy = true;
    RegionSelector.locked = true;
    this.lastAsk = { question };

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
      if (offScreen) {
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

    const reply = await Explain.run({ question, page, region, mode });

    const { div, bubble } = ExplainPanel.addBot();
    bubble.innerHTML = '<span class="cursor-blink">▌</span>';
    await ExplainPanel.stream(bubble, reply.text);

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
    ExplainPanel.addActions(div, reply.zone || null);
    ExplainPanel.scroll();

    this.busy = false;
    RegionSelector.locked = false;
  },

  // ---------- API key (CP3) ----------

  configKey() {
    const cur = localStorage.getItem("GEMINI_API_KEY") || "";
    const v = prompt(
      "Nhập Gemini API key (chỉ lưu trong localStorage của trình duyệt này, KHÔNG commit vào repo).\n" +
      "Để trống = xoá key và quay lại chế độ mock.",
      cur
    );
    if (v === null) return;
    if (v.trim()) {
      localStorage.setItem("GEMINI_API_KEY", v.trim());
      CONFIG.USE_REAL_AI = true;
      document.getElementById("badge-mode").textContent = "CP3 · AI THẬT";
      document.getElementById("badge-mode").classList.add("real");
    } else {
      localStorage.removeItem("GEMINI_API_KEY");
      CONFIG.USE_REAL_AI = false;
      document.getElementById("badge-mode").textContent = "CP2 · MOCK — chưa gọi AI thật";
      document.getElementById("badge-mode").classList.remove("real");
    }
  },
};

App.init();
