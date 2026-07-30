// ============================================================
// APP — nối các phần lại.
//
// Hai đường vào cùng một quyết định AI:
//   (A) Khoanh vùng trên slide  -> hỏi về vùng đó
//   (B) Gõ "giải thích slide N" -> nhảy tới trang N, khoanh trọn trang
//
// (B) chính là (A) với vùng chọn = cả trang, nên lát cắt
// "chọn một vùng · giải thích vùng đó" vẫn giữ nguyên.
// ============================================================

const App = {
  source: null,
  currentPage: null,
  busy: false,
  lastAsk: null, // để hỏi lại khi user báo quét nhầm trang

  async init() {
    Slide.init();
    Chat.init();

    Slide.onSelected = (rect, e) => this.showPopover(e);
    Chat.onFixPage = (n) => this.rescanPage(n);

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
    const note = Chat.addSystemNote(`Đang mở **${file.name}**…`);
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
    Slide.setPage(page);
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
    const mode = AiClient.readMode(page);
    meta.className = "page-meta " + mode;
    meta.innerHTML = mode === "text"
      ? `<b>📄 Trang này đọc được text</b> (${page.textLen} ký tự) — mình trả lời dựa trên nội dung tài liệu.`
      : `<b>👁 Trang này không có lớp text</b> (${page.textLen} ký tự) — slide dạng ảnh/scan. ` +
        `Mình sẽ <b>quét ảnh trang</b> để đọc thay vì trả lời chay.`;
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
    Slide.clearSelection();
    this.hidePopover();
  },

  // ---------- hai đường vào ----------

  // (A) hỏi về vùng vừa khoanh
  askFromPopover() {
    if (!Slide.selection) return;
    const question = document.getElementById("question").value.trim();
    const region = { ...Slide.selection };
    this.hidePopover();
    this.ask({ question, region });
  },

  // (B) hỏi bằng chat, có thể nhắc tới slide khác
  async askFromChat() {
    const input = document.getElementById("chat-q");
    const question = input.value.trim();
    if (!question || this.busy) return;
    input.value = "";

    const m = question.match(PAGE_IN_QUESTION);

    // ② Mơ hồ: không nêu slide nào và cũng không khoanh vùng -> hỏi lại
    if (!m && !Slide.selection) {
      Chat.addUser({ question });
      const { bubble } = Chat.addBot();
      await Chat.stream(bubble, MOCK_REPLIES.noPageInQuestion);
      return;
    }

    if (m) {
      const n = parseInt(m[1], 10);
      if (!this.source.hasPage(n)) {
        Chat.addUser({ question });
        const { bubble } = Chat.addBot();
        await Chat.stream(bubble,
          MOCK_REPLIES.pageOutOfRange(n, this.source.rangeText()));
        return;
      }
      await this.goToPage(n);
      // hỏi về cả trang = khoanh trọn trang
      const region = Slide.selectWholePage();
      return this.ask({ question, region, wholePage: true });
    }

    // có vùng đang khoanh sẵn -> hỏi về vùng đó
    this.ask({ question, region: { ...Slide.selection } });
  },

  // Khi user báo "không phải trang này" -> quét lại trang khác, giữ câu hỏi cũ
  async rescanPage(n) {
    if (!this.source.hasPage(n)) {
      const { bubble } = Chat.addBot();
      await Chat.stream(bubble, MOCK_REPLIES.pageOutOfRange(n, this.source.rangeText()));
      return;
    }
    await this.goToPage(n);
    const region = Slide.selectWholePage();
    this.ask({
      question: this.lastAsk?.question || "",
      region,
      wholePage: true,
      redo: true,
    });
  },

  // ---------- lõi: một lượt hỏi ----------

  async ask({ question, region, wholePage, redo }) {
    if (this.busy || !region) return;
    this.busy = true;
    Slide.locked = true;
    this.lastAsk = { question, wholePage };

    const page = this.currentPage;
    const mode = AiClient.readMode(page);
    const cropImage = Slide.crop(region);

    Chat.addUser({
      cropImage,
      question: redo ? `(đọc lại) ${question || "Giải thích trang này"}` : question,
    });

    // Câu ngoài phạm vi bị chặn trước -> không quét trang, không tốn token ảnh
    const blocked = AiClient.isOutOfScope(question);

    // Nói cho user biết hệ thống đang làm gì TRƯỚC khi trả lời (G1/G11)
    if (mode === "scan" && !blocked) {
      Chat.addSystemNote(
        `Trang ${page.num} không có lớp text → **đang quét ảnh trang** ở ${page.width}px để đọc…`);
    }

    Slide.clearSelection();

    const reply = await AiClient.explain({
      question,
      cropImage,
      pageImage: mode === "scan" && !blocked ? Slide.pageImage() : null,
      page,
      region,
      mode,
    });

    const { div, bubble } = Chat.addBot();
    bubble.innerHTML = '<span class="cursor-blink">▌</span>';
    await Chat.stream(bubble, reply.text);

    // Chỉ khoe "đọc bằng gì" khi thực sự có đọc nội dung. Câu từ chối
    // hoặc hỏi lại (grounded: false) không kèm badge/bằng chứng.
    if (reply.grounded !== false) {
      Chat.addModeBadge(div, reply.mode || mode);

      // Chế độ quét: bắt buộc cho user thấy đã quét trang nào + đường sửa.
      // Đây là chốt chặn cho bẫy "số trang trên slide ≠ trang trong file".
      if ((reply.mode || mode) === "scan") {
        Chat.addScanEvidence(div, {
          thumb: Slide.pageThumb(),
          pageNum: page.num,
          // Chỉ PDF mới có đánh số trang liên tục để hiện "x / y"
          pageCount: this.source.kind === "pdf" ? this.source.pageCount : null,
        });
      }
    }

    if (reply.citation) Chat.addCitation(div, reply.citation);
    Chat.addActions(div, reply.zone || null);
    Chat.scroll();

    this.busy = false;
    Slide.locked = false;
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
