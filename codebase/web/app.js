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
  routing: false,   // đang trong routeChat (kể cả đoạn await getPage TRƯỚC ask) — chống double-submit
  paging: false,    // đang lật trang — chặn giữ phím ← → dồn hàng chục lượt vẽ
  pendingStep: null,// lần nhấn đến trong lúc đang vẽ, chạy nốt khi vẽ xong
  lastAsk: null,    // { question, region, page } — vùng đang bàn, để nối câu hỏi tiếp
  chitchatTurn: 0,  // đổi câu đáp qua lại cho đỡ máy móc
  // Lịch sử hội thoại KHÔNG nằm ở đây nữa — xem lib/conversation.js
  // (ConversationStore): giữ toàn bộ, ghi localStorage, tự chọn phần được gửi.

  // Ký ức là tính năng PHỤ TRỢ, không phải điều kiện để trả lời. Thiếu
  // lib/conversation.js (quên thẻ script, cache HTML cũ, chặn mạng...) thì
  // hệ thống phải mất trí nhớ chứ KHÔNG được câm: trước khi có hàm này,
  // thiếu một file là mọi câu hỏi chết kèm "ConversationStore is not
  // defined" — giữa lúc demo thì hỏng cả buổi.
  mem() {
    if (typeof ConversationStore !== "undefined") return ConversationStore;
    if (!this._memWarned) {
      this._memWarned = true;
      console.warn("[chat] Thiếu lib/conversation.js — chạy KHÔNG có ký ức hội thoại. " +
        "Kiểm thẻ <script src=\"lib/conversation.js\"> trong index.html, rồi Ctrl+F5.");
    }
    // Null-object: đủ mọi hàm app gọi, không nhớ gì cả
    return {
      openDoc: () => 0, add: () => null, all: () => [], count: () => 0,
      contextFor: () => ({ full: [], outline: [] }),
    };
  },

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

    const theme = document.getElementById("btn-theme");
    if (theme) theme.onclick = () => this.toggleTheme();
    this.restoreTheme();

    document.getElementById("pg-first").onclick = () => this.step(-Infinity);
    document.getElementById("pg-prev").onclick = () => this.step(-1);
    document.getElementById("pg-next").onclick = () => this.step(1);
    document.getElementById("pg-last").onclick = () => this.step(Infinity);
    const pgInput = document.getElementById("pg-input");
    pgInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") this.jumpToTyped();
    });
    pgInput.addEventListener("blur", () => this.renderPager());

    // Bắt phím ở tầng document chứ không gắn vào canvas: học viên không bấm
    // vào slide trước rồi mới bấm phím, họ chỉ bấm phím. Gắn vào canvas thì
    // phải focus đúng chỗ mới ăn — đọc tài liệu không ai làm vậy.
    document.addEventListener("keydown", (ev) => this.onKeyNav(ev));

    this.buildDeckButtons();
    this.restoreKey();
    await this.useMock();
  },

  // ---------- sáng / tối ----------
  // CSS đã có sẵn bộ biến cho body.dark; phần này chỉ bật/tắt class và nhớ
  // lựa chọn. Nhớ được là quan trọng: học viên ngồi học buổi tối bật chế độ
  // tối rồi tải lại trang mà mất là bực.

  applyTheme(dark) {
    document.body.classList.toggle("dark", dark);
    const b = document.getElementById("btn-theme");
    if (b) {
      b.textContent = dark ? "☀" : "🌙";
      b.title = dark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối";
    }
    // Slide vẽ trên canvas nên không theo CSS — vẽ lại để nền letterbox
    // khớp với chủ đề mới, nếu không thì viền quanh slide lệch màu hẳn.
    if (SlideViewer.page) SlideViewer.draw();
    RegionSelector.draw();
  },

  toggleTheme() {
    const dark = !document.body.classList.contains("dark");
    localStorage.setItem("VLEARN_THEME", dark ? "dark" : "light");
    this.applyTheme(dark);
  },

  restoreTheme() {
    const saved = localStorage.getItem("VLEARN_THEME");
    // Chưa chọn bao giờ thì theo cài đặt hệ điều hành
    const dark = saved
      ? saved === "dark"
      : window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    this.applyTheme(dark);
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
    this.resetConversation();
  },

  // Đổi tài liệu = đổi ký ức, KHÔNG phải xoá ký ức.
  // ConversationStore khoá lịch sử theo từng tài liệu và ghi xuống
  // localStorage, nên mở lại d1 là hội thoại cũ của d1 còn nguyên — kể cả
  // sau khi tải lại trang. Cái phải tránh là TRỘN: d1 và d2 đều có "trang
  // 3", nạp chung là lịch sử tài liệu này chui vào request của tài liệu kia.
  resetConversation() {
    const n = this.mem().openDoc(this.docId());
    this.lastAsk = null;
    this.chitchatTurn = 0;
    RegionSelector.clear();
    this.renderFocus();
    this.renderGreeting();
    // Vẽ lại hội thoại cũ lên khung chat. Không vẽ thì agent nhớ mà màn hình
    // trống — học viên thấy nó nhắc tới thứ "chưa từng nói" là mất tin ngay.
    if (n) ExplainPanel.replay(this.mem().all());
  },

  renderGreeting() {
    ExplainPanel.resetFor(this.source, this.currentPage,
      this.suggestFor(this.currentPage),
      (q) => { document.getElementById("chat-q").value = q; this.askFromChat(); });
  },

  // Câu hỏi gợi ý mở đầu, suy ra TẠI CHỖ từ nội dung trang đang xem.
  // Không gọi AI: hiện tức thì, không tốn quota, không gửi gì ra ngoài.
  suggestFor(page) {
    if (!page) return [];

    // Trang không đọc được text thì chỉ gợi ý chung được
    if (page.textLen < CONFIG.MIN_TEXT_CHARS) {
      return ["Trang này có gì?", "Giải thích hình trên trang"];
    }

    const out = [];

    // Slide mock có sẵn tên vùng — gợi ý thẳng theo tên đó
    if (page.zones && page.zones.length) {
      for (const z of page.zones.slice(0, 2)) out.push(`Giải thích ${z.label.toLowerCase()}`);
    } else {
      // PDF thật: lấy dòng chữ TO NHẤT ở nửa trên làm tiêu đề
      const items = (page.textItems || []).filter((t) => t.y < page.height * 0.5);
      const title = items.sort((a, b) => b.h - a.h)[0];
      const s = title ? title.str.trim() : "";
      if (s.length >= 4 && s.length <= 60) out.push(`"${s}" nghĩa là gì?`);
    }

    out.push("Trang này nói về gì?");
    return out.slice(0, 3);
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
      // Không nối thêm dòng thông báo nữa — dựng lại hẳn trạng thái mở đầu
      // cho tài liệu mới. Dòng "Đang mở…" ở trên bị xoá cùng.
      this.resetConversation();
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

  // Chip tên trang chỉ có nghĩa khi tài liệu ít trang và trang có tên riêng
  // (slide mẫu: "Slide 12 · Automation"). Với PDF 29 trang thì đổ 12 nút rồi
  // ghi "và 17 trang nữa" không phải là trình đọc tài liệu — dùng thanh
  // ‹ số trang › như mọi trình đọc.
  async buildTabs() {
    const tabs = document.getElementById("page-tabs");
    tabs.innerHTML = "";
    const labels = this.source.pageLabels();
    const dungChip = this.source.kind === "mock" && labels.length <= 6;

    tabs.hidden = !dungChip;
    if (dungChip) {
      for (const p of labels) {
        const b = document.createElement("button");
        b.textContent = p.label;
        b.dataset.page = p.index;
        b.onclick = () => this.goToPage(p.index);
        tabs.appendChild(b);
      }
    }

    // Ô nhảy trang chỉ có nghĩa với tài liệu đánh số LIÊN TỤC 1..N. Slide mẫu
    // đánh số 12/18/24 (cố ý, để mô phỏng bẫy số trang lệch) nên hiện
    // "12 / 3" là vô nghĩa — với nguồn đó thì chip tên slide đã đủ.
    const lienTuc = this.source.kind === "pdf";
    document.getElementById("pg-jump").hidden = !lienTuc;
    if (lienTuc) document.getElementById("pg-total").textContent = labels.length;
    this.renderPager();
  },

  // ---------- thanh trang ----------

  pageList() {
    return this.source ? this.source.pageLabels().map((p) => p.index) : [];
  },

  renderPager() {
    const list = this.pageList();
    const cur = this.currentPage ? this.currentPage.num : null;
    const i = list.indexOf(cur);
    const input = document.getElementById("pg-input");
    if (input && document.activeElement !== input) input.value = cur == null ? "" : cur;

    for (const [id, off] of [["pg-first", -Infinity], ["pg-prev", -1],
                             ["pg-next", 1], ["pg-last", Infinity]]) {
      const b = document.getElementById(id);
      if (!b) continue;
      b.disabled = i < 0 || (off < 0 ? i === 0 : i === list.length - 1);
    }
  },

  async step(delta) {
    // Giữ phím ← hoặc bấm nút liên tục thì mỗi lần nhấn lại gọi goToPage, mà
    // vẽ một trang PDF mất một lúc — không chặn thì hàng chục lượt vẽ chồng
    // lên nhau và cuối cùng dừng ở trang nào là hên xui.
    //
    // Chặn thì phải GỘP chứ không được vứt: vứt thì nhấn nhanh mấy cái chỉ ăn
    // một cái, người dùng tưởng bàn phím lag. Gộp = nhớ lần nhấn cuối, vẽ xong
    // trang này thì đi tiếp — cùng lắm là chạy sau tay người một nhịp, nhưng
    // không mất lần nhấn nào.
    if (this.paging) { this.pendingStep = delta; return; }

    const list = this.pageList();
    const i = list.indexOf(this.currentPage ? this.currentPage.num : -1);
    if (i < 0) return;
    const j = delta === -Infinity ? 0
      : delta === Infinity ? list.length - 1
      : Math.max(0, Math.min(list.length - 1, i + delta));
    if (list[j] === list[i]) return;

    this.paging = true;
    try {
      await this.goToPage(list[j]);
    } finally {
      this.paging = false;
      const cho = this.pendingStep;
      this.pendingStep = null;
      if (cho != null) this.step(cho);
    }
  },

  // Lật trang bằng phím mũi tên — thao tác mặc định của mọi trình đọc tài liệu.
  //
  // Ba chỗ phải chừa ra, nếu không là cướp phím của người dùng:
  //   1. Đang gõ trong ô chat / ô hỏi vùng / ô số trang: ← → là để di con trỏ
  //      trong câu đang viết, lật trang giữa lúc soạn câu hỏi là mất chỗ.
  //   2. Có Ctrl / Alt / Cmd: Alt+← là "quay lại" của trình duyệt.
  //   3. ↑ ↓ để nguyên cho việc cuộn trang.
  onKeyNav(ev) {
    if (ev.ctrlKey || ev.altKey || ev.metaKey || ev.isComposing) return;

    const t = ev.target;
    if (t && t.closest &&
        t.closest("input, textarea, select, [contenteditable='true']")) return;

    const delta = {
      ArrowLeft: -1, PageUp: -1,
      ArrowRight: 1, PageDown: 1,
      Home: -Infinity, End: Infinity,
    }[ev.key];
    if (delta === undefined) return;

    ev.preventDefault(); // ← → không kéo thanh cuộn ngang nữa
    this.step(delta);
  },

  async jumpToTyped() {
    const input = document.getElementById("pg-input");
    const n = parseInt((input.value || "").replace(/\D/g, ""), 10);
    if (!n || !this.source.hasPage(n)) {
      // Gõ số không có thì trả input về trang hiện tại, không im lặng nuốt
      ExplainPanel.addSystemNote(
        `Không có trang ${input.value || "(trống)"} — tài liệu này có ${this.source.rangeText()}.`);
      this.renderPager();
      return;
    }
    await this.goToPage(n);
    input.blur();
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
    this.renderPager();
    // Lật trang KHÔNG đổi chủ đề hội thoại — chỉ cập nhật chip để học viên
    // thấy mình đang hỏi về trang nào và đổi được bằng một chạm nếu muốn.
    this.renderFocus();
    // Chưa hỏi gì mà lật trang thì gợi ý phải theo trang mới, không đứng yên
    // ở trang cũ. Đã có hội thoại rồi thì để nguyên, không phá dòng chat.
    if (!this.mem().count()) this.renderGreeting();
    return page;
  },

  // ---------- chủ đề đang bàn ----------

  // Chip dưới ô chat: "đang hỏi về trang N". Bắt buộc phải hiện, vì từ nay
  // chủ đề KHÔNG tự chạy theo trang đang xem — không hiện thì học viên lật
  // slide, gõ câu hỏi, rồi ngơ ngác không hiểu sao tutor nói chuyện trang cũ.
  renderFocus() {
    const box = document.getElementById("chat-focus");
    if (!box) return;
    box.innerHTML = "";

    const focusPage = this.lastAsk && this.lastAsk.page;
    if (!focusPage) return; // chưa hỏi gì -> câu đầu tiên bám trang đang xem

    const cur = this.currentPage;
    const same = cur && focusPage.num === cur.num;

    const tag = document.createElement("span");
    tag.className = "focus-tag";
    tag.textContent = `Đang hỏi về trang ${focusPage.num}`;
    box.appendChild(tag);

    if (!same && cur) {
      const btn = document.createElement("button");
      btn.className = "focus-switch";
      btn.textContent = `↪ Hỏi về trang ${cur.num} (đang xem)`;
      btn.onclick = () => this.focusCurrentPage();
      box.appendChild(btn);
    }
  },

  // Chuyển chủ đề sang trang đang xem — một chạm, do học viên tự quyết.
  focusCurrentPage() {
    const page = this.currentPage;
    if (!page) return;
    this.lastAsk = {
      question: "",
      region: { ...ContentDetector.contentBounds(page), wholePage: true },
      page,
    };
    RegionSelector.clear();
    this.renderFocus();
    ExplainPanel.addSystemNote(
      `Đã chuyển sang hỏi về **trang ${page.num}**. Hội thoại cũ vẫn được giữ.`);
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
    // Giữ busy suốt animation gõ chữ (~1s) — không giữ thì một câu hỏi chat
    // gửi ngay lúc đó sẽ chạy animation CHỒNG lên: hai con trỏ ▌ song song
    this.busy = true;
    try {
      this.hidePopover();
      ExplainPanel.addUser({ question: "(bấm vào một chỗ trên slide)" });
      const { bubble } = ExplainPanel.addBot();
      await ExplainPanel.stream(bubble, REPLIES.noContent);
    } finally {
      this.busy = false;
    }
  },

  // (B) hỏi bằng chat, có thể nhắc tới slide KHÁC slide đang xem.
  // KHÔNG kéo học viên rời khỏi slide họ đang đọc: trang được hỏi chỉ
  // được nạp ngầm để đọc, kèm nút "Đi tới slide N" nếu họ muốn chuyển.
  async askFromChat() {
    const input = document.getElementById("chat-q");
    const question = input.value.trim();
    if (!question) return;
    // `routing` đóng cái cửa sổ mà `busy` không che được: busy chỉ bật bên
    // trong ask(), còn đường "hỏi trang N" phải await getPage (render PDF
    // >100ms) TRƯỚC khi tới ask(). Hai lần Enter liên tiếp trong cửa sổ đó
    // → câu thứ hai lọt qua busy-check, input đã bị xoá, rồi ask() của nó
    // im lặng return vì busy — tin nhắn bốc hơi không dấu vết.
    // routing bật ĐỒNG BỘ ngay tại đây nên không có cửa sổ nào nữa.
    if (this.routing || this.busy) {
      ExplainPanel.addSystemNote(
        "⏳ Mình đang trả lời câu trước — chờ xong rồi gửi lại giúp mình nhé. " +
        "(Tin nhắn của bạn vẫn còn nguyên trong ô chat.)");
      return; // KHÔNG xoá input — tin nhắn còn nguyên để gửi lại
    }
    this.routing = true;
    input.value = "";
    try {
      await this.routeChat(question);
    } catch (err) {
      // Lỗi ngoài ask() (phân loại, tra trang, dò vùng) cũng phải hiện ra.
      // Im lặng nuốt lỗi ở đây là học viên gõ mãi mà màn hình không đổi gì.
      console.error("[askFromChat] lỗi:", err);
      ExplainPanel.addUser({ question });
      ExplainPanel.addSystemNote(
        `Có lỗi khi xử lý tin nhắn: **${err && err.message ? err.message : err}**.`);
    } finally {
      this.routing = false; // nhả cả khi lỗi — kẹt true là chat câm vĩnh viễn
    }
  },

  async routeChat(question) {

    // Thứ tự ưu tiên khi tìm CĂN CỨ cho câu hỏi — từ cụ thể nhất tới rộng nhất.
    // Không còn nhánh nào bỏ mặc học viên: gõ câu gì cũng được trả lời.
    //
    //   1. Câu nêu rõ số slide       -> đọc trang đó (và ĐỔI chủ đề sang đó)
    //   2. Đang có vùng chọn         -> vùng đó (ĐỔI chủ đề)
    //   3. Đã có chủ đề đang bàn     -> GIỮ NGUYÊN, kể cả khi đang xem trang khác
    //   4. Chưa hỏi gì bao giờ       -> trang đang xem
    //
    // Bậc 4 chỉ dùng cho câu hỏi ĐẦU TIÊN. Trước đây nó đáp "bạn đang hỏi
    // slide nào?" ngay cả khi học viên đang mở một slide trước mắt — hỏi một
    // thứ hiển nhiên.
    // Guardrail phải chạy TRƯỚC nhánh số trang. Nếu không thì câu "tóm tắt từ
    // trang 1 đến trang 20" sẽ đi vào nhánh số trang, trả lời về trang 1 và
    // IM LẶNG BỎ QUA việc học viên đòi 20 trang — tệ hơn là từ chối thẳng.
    const scopeCat = Explain.isOutOfScope(question);
    if (scopeCat) {
      ExplainPanel.addUser({ question });
      ExplainPanel.addSystemNote(
        "Câu này ngoài phạm vi → **không có dữ liệu nào được gửi ra ngoài**.");
      const { bubble } = ExplainPanel.addBot();
      await ExplainPanel.stream(bubble, REPLIES.refusal(scopeCat));
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

    // Phân loại TRƯỚC MỌI THỨ. Bản trước để nhánh "đang có vùng chọn" chạy
    // trước, nên vừa bấm chọn một vùng rồi gõ "lo" thì vẫn gửi cả ảnh vùng
    // đi kèm. Chào hỏi hay gõ nhầm thì không được gửi gì, dù đang chọn gì.
    const kind = this.classify(question);

    if (kind === "chitchat") {
      return this.chitchat(question);
    }

    // Đang có vùng chọn thì học viên đã chỉ rõ, khỏi đoán
    if (RegionSelector.regionPage) {
      return this.ask({
        question, region: { ...RegionSelector.regionPage }, page: this.currentPage });
    }

    // GIỮ CHỦ ĐỀ ĐANG BÀN — kể cả khi học viên đã lật sang trang khác.
    //
    // Bản trước chỉ giữ khi câu hỏi có từ nối ("chi tiết hơn", "còn cái
    // kia"), còn lại thì rơi xuống TRANG ĐANG XEM. Hậu quả thật: hỏi xong
    // về slide A, lật sang B để đối chiếu, rồi gõ tiếp một câu về A —
    // hệ thống lặng lẽ trả lời về B. Học viên không hề nói muốn đổi đề tài;
    // chính hệ thống tự đổi vì nhìn nhầm "đang xem" thành "đang hỏi".
    //
    // Nguyên tắc đúng: chủ đề bám theo thứ học viên đang HỎI, không theo
    // thứ đang XEM. Lật slide chỉ nạp trang đó vào bộ nhớ, không đụng vào
    // mạch hội thoại. Muốn đổi đề tài thì có ba cách RÕ RÀNG, đều do học
    // viên chủ động: nói tên slide ("slide 24 nói gì"), bấm/khoanh một vùng
    // trên slide mới, hoặc bấm nút "Hỏi về trang đang xem" ở chip dưới ô chat.
    if (this.lastAsk && this.lastAsk.region && this.lastAsk.page) {
      return this.ask({
        question,
        region: this.lastAsk.region,
        page: this.lastAsk.page,
        offScreen: this.lastAsk.page !== this.currentPage,
        followUp: true,
      });
    }

    // Chưa hỏi gì bao giờ -> mới lấy trang đang xem làm căn cứ
    return this.askAboutCurrentPage(question);
  },

  // Phân loại tin nhắn: 'chitchat' | 'followup' | 'document'
  classify(q) {
    const s = (q || "").trim();
    if (CHITCHAT_GREET.test(s) || CHITCHAT_ACK.test(s)) return "chitchat";

    // Một "từ" cụt lủn -> gõ nhầm hoặc chưa nói gì. Hỏi lại rẻ hơn nhiều so
    // với đoán rồi trả lời sai (lớp ②). Dấu "?" chỉ được tính là câu hỏi khi
    // có kèm chữ; mỗi dấu "?" trơ trọi thì vẫn là chưa nói gì.
    const tokens = s.split(/\s+/).filter((t) => t.length >= 2);
    const hasWord = /\p{L}{2,}/u.test(s);
    if (tokens.length <= 1 && !/\d/.test(s) && !(hasWord && /\?/.test(s)) && s.length < 8) {
      return "chitchat";
    }

    // "slide này" / "trang này" trỏ tới TRANG ĐANG XEM, không phải vùng vừa
    // hỏi. Phải xét trước FOLLOWUP_HINT vì chữ "này" nằm trong cả hai.
    if (CURRENT_PAGE_REF.test(s)) return "document";

    if (FOLLOWUP_HINT.test(s)) return "followup";
    return "document";
  },

  async chitchat(question) {
    const s = question.trim();
    const bucket = CHITCHAT_GREET.test(s) ? "greeting"
      : CHITCHAT_ACK.test(s) ? "ack" : "unclear";
    const list = CHITCHAT[bucket];
    // Đổi câu qua lại cho đỡ máy móc khi học viên nhắn mấy lần
    const text = list[this.chitchatTurn++ % list.length];

    ExplainPanel.addUser({ question });
    const { bubble } = ExplainPanel.addBot();
    await ExplainPanel.stream(bubble, text);
    ExplainPanel.scroll();
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
    if (this.routing || this.busy) return; // cùng cửa sổ race với askFromChat
    if (!this.source.hasPage(n)) {
      const { bubble } = ExplainPanel.addBot();
      await ExplainPanel.stream(bubble, REPLIES.pageOutOfRange(n, this.source.rangeText()));
      return;
    }
    this.routing = true;
    try {
      await this.askAboutPage(n, this.lastAsk?.question || "", true);
    } finally {
      this.routing = false;
    }
  },

  // ---------- lõi: một lượt hỏi ----------

  // region: toạ độ TRANG · page: trang được hỏi (có thể khác trang đang xem)
  // followUp: câu hỏi tiếp về đúng vùng của lượt trước
  async ask(req) {
    if (!req || !req.region) return;
    if (this.busy) {
      // Chốt chặn cuối: mọi đường tới đây khi đang bận đều phải HIỆN RA,
      // không được nuốt im lặng — tin nhắn biến mất còn tệ hơn phải chờ.
      ExplainPanel.addSystemNote(
        "⏳ Mình đang trả lời câu trước" +
        (req.question ? ` — câu *"${req.question}"* chưa được gửi, bạn gửi lại sau nhé.` : "."));
      return;
    }
    this.busy = true;
    RegionSelector.locked = true;
    try {
      await this.askInner(req);
    } catch (err) {
      // Trước đây không có try/finally: bất kỳ lỗi nào giữa chừng là `busy`
      // kẹt ở true vĩnh viễn, và vì askFromChat mở đầu bằng
      // `if (!question || this.busy) return;` nên MỌI tin nhắn sau đó im lặng
      // thoát, không hiện gì. Chat chết mà không báo một chữ.
      console.error("[ask] lỗi:", err);
      ExplainPanel.addSystemNote(
        `Có lỗi khi xử lý câu hỏi: **${err && err.message ? err.message : err}**. ` +
        "Bạn thử lại; nếu lặp lại thì mở Console (F12) xem chi tiết.");
    } finally {
      this.busy = false;
      RegionSelector.locked = false;
      ExplainPanel.scroll();
    }
  },

  async askInner({ question, region, page, offScreen, redo, followUp }) {
    page = page || this.currentPage;

    const mode = Explain.readMode(page);
    // Ảnh hiện trong bong bóng chat CHÍNH LÀ ảnh sẽ gửi đi — không có
    // ảnh nào khác rời máy. Học viên nhìn bong bóng là biết đã gửi gì.
    const cropImage = ContentDetector.cropPage(page, region);

    // Đoạn text nằm trong vùng chọn — đúng thứ tutor thật gửi kèm câu hỏi.
    // Lấy qua buildPayload để hiện đúng cái sẽ gửi, không tự tính lại một kiểu
    // khác rồi lệch với bảng công khai.
    let excerpt = "";
    if (mode === "text") {
      try {
        excerpt = (Explain.buildPayload({ page, region, mode }).text || "").trim();
      } catch (e) { /* chỉ để hiển thị, hỏng thì bỏ qua */ }
    }

    ExplainPanel.addUser({
      cropImage, excerpt, pageNum: page.num,
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
      // Chỉ báo khi vùng được nối tiếp nằm ở TRANG KHÁC trang đang xem. Nối
      // tiếp một vùng ngay trước mắt thì học viên tự biết, báo mỗi tin nhắn
      // chỉ làm khung chat đầy chữ thừa.
      if (followUp && page !== this.currentPage) {
        ExplainPanel.addSystemNote(
          `Đang hỏi tiếp về vùng ở **trang ${page.num}**, bạn vẫn đang xem trang ${this.currentPage.num}.`);
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
    const typing = blocked ? null : ExplainPanel.addTyping();

    // Đường stream: bong bóng bot chỉ được tạo ở CHUNK ĐẦU TIÊN (lazy) —
    // mock/guardrail/lỗi không phát chunk nào thì typing đứng đó tới khi
    // run resolve, rồi đi nhánh render cũ ở dưới.
    let live = null;
    const onChunk = (delta, raw) => {
      if (!live) {
        if (typing && typing.parentNode) typing.remove();
        live = { ...ExplainPanel.addBot(), outsideBody: null };
      }
      ExplainPanel.renderStream(live, raw);
    };

    // Ký ức gửi kèm ở MỌI lượt, không chỉ lượt được phân loại "hỏi tiếp":
    // học viên hỏi câu mới vẫn mong tutor nhớ vừa nói gì với mình. Phần nào
    // được gửi thì ConversationStore.contextFor() quyết (xem file đó).
    const ctx = this.historyFor(page.num);
    let reply;
    try {
      reply = await Explain.run({
        question, page, region, mode,
        history: ctx.full,
        historyOutline: ctx.outline,
      }, { onChunk });
    } finally {
      // typing phải biến mất CẢ khi run() ném lỗi — không thì bong bóng ba
      // chấm đứng nhấp nháy vĩnh viễn phía trên dòng báo lỗi của ask().
      if (typing && typing.parentNode) typing.remove();
    }

    let div, bubble;
    if (live) {
      // Đã stream: vẽ lại lần cuối theo bản parse toàn văn
      ({ div, bubble } = live);
      ExplainPanel.endStream(live, reply);
    } else {
      ({ div, bubble } = ExplainPanel.addBot());
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
    }

    // Đứt kết nối giữa chừng: giữ phần đã nhận nhưng nói thẳng là chưa trọn
    if (reply.streamInterrupted) {
      ExplainPanel.addSystemNote(
        "⚠ Kết nối tới model bị ngắt giữa chừng — câu trả lời phía trên có thể " +
        "**chưa trọn vẹn**. Bạn có thể hỏi lại câu này.");
    }
    // Chạm trần độ dài: câu cụt KHÔNG được đội lốt câu trọn vẹn (G2).
    // Không báo thì học viên tưởng phần cuối không tồn tại.
    if (reply.truncated) {
      ExplainPanel.addSystemNote(
        "✂ Câu trả lời **chạm trần độ dài** nên có thể thiếu phần cuối — " +
        'gõ *"nói tiếp"* nếu bạn muốn nghe nốt.');
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
      // Lưu TOÀN BỘ, không cắt. Trước đây mảng bị shift() khi quá 3 phần tử
      // nên app quên sạch sau 3 lượt — hỏi 10 câu rồi nhắc "cái lúc nãy bạn
      // nói ấy" là chịu. Cắt là việc của lúc GỬI, không phải lúc NHỚ.
      this.mem().add({
        page: page.num,
        question: question || "(giải thích vùng này)",
        answer: reply.text,
        mode: reply.mode || mode,
      });
      this.lastAsk = { question, region, page };
      this.renderFocus(); // chủ đề vừa đổi -> chip phải đổi theo ngay
    }
    // busy và locked được nhả trong `finally` của ask()
  },

  // Lịch sử hội thoại cho câu hỏi tiếp — CHỈ các lượt về đúng trang này.
  // Không trộn lượt của trang khác vào: làm vậy là gián tiếp gửi nội dung
  // nhiều trang trong một request, phá giới hạn 1 trang/câu hỏi.
  // Khoá theo CẢ tài liệu lẫn trang. Lọc mỗi số trang là chưa đủ: d1 và d2
  // đều có trang 3, nên đổi tài liệu rồi hỏi tiếp sẽ kéo lượt của tài liệu
  // cũ vào request. resetConversation() đã xoá turns khi đổi tài liệu, đây
  // là lớp chặn thứ hai phòng khi có đường nào đó quên gọi reset.
  docId() {
    return this.source ? this.source.kind + ":" + this.source.name : "?";
  },

  // Ký ức nằm trong ConversationStore (giữ TOÀN BỘ, có ghi localStorage).
  // Hàm này chỉ chọn phần được GỬI ĐI: lượt cùng trang gửi đủ hỏi+đáp, lượt
  // trang khác gửi dàn ý (mặc định chỉ câu hỏi). Khoá theo tài liệu đã nằm
  // trong store — mở tài liệu khác là nạp ký ức khác.
  historyFor(pageNum) {
    return this.mem().contextFor(pageNum);
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
