// ============================================================
// RUNNER — chạy trọn bộ golden set một lượt, xuất bảng markdown.
//
// Vì sao cần: nhịp lặp của CP3-CP5 là "chạy trọn bộ → bảng % → sửa MỘT
// failure → chạy lại TRỌN BỘ". Làm tay 28 case mỗi lượt thì đến lượt thứ
// hai là bỏ. Runner làm phần cơ học; phần chấm ngữ nghĩa vẫn là người.
//
// Máy chấm được: kích thước vùng dò, số trang gửi đi, có từ chối không,
// có hỏi lại không, chế độ đọc, ảnh có phải cả trang không.
// Người chấm: 4 chiều G/S/H/C — runner để trống cho hai người chấm
// độc lập rồi so (yêu cầu của rubric R4).
// ============================================================

const PDF_URL = "../data/vlearn-pack/slides/d1-slide-hackathon.pdf";

// runner.html nằm ở eval/ nên các đường dẫn tương đối khác với codebase/web/
CONFIG.PROMPT_URL = "../codebase/server/prompts/explain-region.md";
CONFIG.PDFJS_URL = "../codebase/web/vendor/pdf.min.js";
CONFIG.PDFJS_WORKER_URL = "../codebase/web/vendor/pdf.worker.min.js";

const Runner = {
  mockSource: null,
  pdfSource: null,
  results: [],

  log(msg, cls) {
    const el = document.getElementById("log");
    const line = document.createElement("div");
    if (cls) line.className = cls;
    line.textContent = msg;
    el.appendChild(line);
    el.scrollTop = el.scrollHeight;
  },

  async init() {
    this.mockSource = new MockSource();
    this.log(`Nguồn mock: ${this.mockSource.pageCount} slide (${this.mockSource.rangeText()})`);

    // PDF thật chỉ tải được khi mở qua HTTP (file:// bị CORS chặn)
    const pdfStatus = document.getElementById("pdf-status");
    if (location.protocol === "file:") {
      pdfStatus.textContent = "Bỏ qua case PDF: đang mở bằng file://. Chạy qua server để test PDF thật.";
      pdfStatus.className = "warn";
    } else {
      try {
        this.pdfSource = await PdfSource.openUrl(PDF_URL);
        pdfStatus.textContent = `PDF thật: ${this.pdfSource.name} · ${this.pdfSource.pageCount} trang`;
        pdfStatus.className = "ok";
        await this.reportPdfTextLayers();
      } catch (err) {
        pdfStatus.textContent = `Bỏ qua case PDF: ${err.message}`;
        pdfStatus.className = "warn";
      }
    }

    const key = localStorage.getItem("GEMINI_API_KEY");
    const model = localStorage.getItem("GEMINI_MODEL");
    const modeEl = document.getElementById("ai-mode");
    if (key && model) {
      CONFIG.GEMINI_MODEL = model;
      CONFIG.USE_REAL_AI = true;
      modeEl.textContent = `AI THẬT · ${model}`;
      modeEl.className = "ok";
    } else {
      modeEl.textContent = "MOCK — chưa có key. Nhập key ở app (nút API key) rồi quay lại đây.";
      modeEl.className = "warn";
    }
    document.title = "READY";
  },

  // Khảo sát lớp text CẢ tài liệu — con số này quyết định trang nào phải
  // quét ảnh, và chính là bằng chứng đo được cho tính năng đó.
  // Chỉ gọi getTextContent, KHÔNG render trang (render 1536px mỗi trang chỉ
  // để đếm ký tự thì quá đắt và làm treo trang).
  async reportPdfTextLayers() {
    const total = this.pdfSource.pageCount;
    const rows = [];
    let scanCount = 0;
    for (let i = 1; i <= total; i++) {
      const chars = await this.pdfSource.textLenOf(i);
      const mode = chars >= CONFIG.MIN_TEXT_CHARS ? "text" : "scan";
      if (mode === "scan") scanCount++;
      rows.push({ page: i, chars, mode });
    }
    this.pdfTextSurvey = rows;

    const tbody = document.querySelector("#textlayer tbody");
    // Chỉ hiện các trang phải quét + 8 trang đầu, cho gọn
    const show = rows.filter((r) => r.mode === "scan" || r.page <= 8);
    tbody.innerHTML = show.map((r) =>
      `<tr><td>${r.page}</td><td>${r.chars}</td>` +
      `<td class="${r.mode === "scan" ? "warn" : "ok"}">${r.mode === "scan" ? "👁 quét ảnh" : "📄 text"}</td></tr>`
    ).join("") + (show.length < total
      ? `<tr><td colspan="3" class="k">… ${total - show.length} trang còn lại đều đọc được text</td></tr>` : "");

    const pct = Math.round(scanCount * 100 / total);
    document.getElementById("textlayer-summary").innerHTML =
      `<b>${this.pdfSource.name}</b> · ${total} trang: <b class="${scanCount ? "warn" : "ok"}">` +
      `${scanCount} trang phải quét ảnh (${pct}%)</b>, ${total - scanCount} trang đọc được text. ` +
      `Ngưỡng <code>MIN_TEXT_CHARS = ${CONFIG.MIN_TEXT_CHARS}</code>.` +
      (scanCount === 0
        ? " <span class=\"k\">Tài liệu này có lớp text ở mọi trang — nhánh quét ảnh cần slide dạng ảnh/scan để demo.</span>"
        : "");
  },

  async sourceFor(c) {
    if (c.src === "pdf") return this.pdfSource;
    return this.mockSource;
  },

  // ---- chạy một case ----
  async runCase(c) {
    const source = await this.sourceFor(c);
    if (!source) return { id: c.id, cls: c.cls, skipped: "không có nguồn" };

    const startPage = await source.getPage(c.page);
    if (!startPage) return { id: c.id, cls: c.cls, skipped: `không có trang ${c.page}` };

    // Câu hỏi qua chat có thể trỏ sang trang khác
    let page = startPage;
    let question = c.question || "";
    let stayedOn = startPage.num;

    // Phải BÁM ĐÚNG 4 bậc tìm căn cứ của App.askFromChat, nếu không thì
    // runner đo một sản phẩm khác với sản phẩm thật:
    //   số slide trong câu > vùng chọn > vùng vừa hỏi > TRANG ĐANG XEM
    // Bậc 4 là đường mới; trước đây runner mô phỏng nhánh "hỏi lại slide nào"
    // mà app đã bỏ — số đo sẽ nói về code chết.
    if (c.chat) {
      question = c.chat;
      // Guardrail chạy TRƯỚC nhánh số trang — y như App.askFromChat. Nếu không
      // thì "tóm tắt từ trang 1 đến trang 44" đi vào nhánh số trang và runner
      // đo một hành vi khác với app.
      const scopeCat = Explain.isOutOfScope(question);
      if (scopeCat) {
        const refusalText = REPLIES.refusal(scopeCat);
        return {
          id: c.id, cls: c.cls, expect: c.expect,
          out: refusalText, grounded: false,
          mode: "-", region: null, disclosure: null, stayedOn,
          auto: this.check(c, { grounded: false, kind: "outOfScope", text: refusalText }, null, null, stayedOn),
        };
      }
      const m = c.chat.match(PAGE_IN_QUESTION);
      if (m) {
        const n = parseInt(m[1], 10);
        if (!source.hasPage(n)) {
          return {
            id: c.id, cls: c.cls, expect: c.expect,
            out: REPLIES.pageOutOfRange(n, source.rangeText()), grounded: false,
            mode: "-", region: null, disclosure: null, stayedOn,
            auto: this.check(c, { grounded: false, kind: "pageOutOfRange" }, null, null, stayedOn),
          };
        }
        page = await source.getPage(n);
      }
      // Không nêu số slide -> bậc 4: giữ nguyên trang đang xem (startPage)
    }

    // Xác định vùng
    let region = null;
    if (c.click) {
      region = ContentDetector.detectAt(page, c.click[0] * page.width, c.click[1] * page.height);
    } else if (c.region) {
      region = {
        x: c.region[0] * page.width, y: c.region[1] * page.height,
        w: c.region[2] * page.width, h: c.region[3] * page.height,
      };
    } else if (c.wholePage || c.chat) {
      region = { ...ContentDetector.contentBounds(page), wholePage: true };
    }

    if (!region) {
      // Không dò được -> nhánh ①
      return {
        id: c.id, cls: c.cls, expect: c.expect,
        out: REPLIES.noContent, grounded: false,
        mode: "-", region: null, disclosure: null, stayedOn,
        auto: this.check(c, { grounded: false, kind: "noContent", text: REPLIES.noContent }, null, null, stayedOn),
      };
    }

    const mode = Explain.readMode(page);
    let reply = await Explain.run({ question, page, region, mode });

    // ---- Câu hỏi TIẾP: chạy thêm từng lượt, tích luỹ lịch sử như App làm ----
    // Không có phần này thì F01-F03 báo "đạt" mà không test gì — một test báo
    // đạt mà không kiểm gì còn tệ hơn không có test.
    let turns = [];
    let followUpReplies = [];
    if (c.followUps && c.followUps.length) {
      if (reply.grounded !== false) {
        turns.push({ page: page.num, question: question || "(giải thích vùng này)", answer: reply.text });
      }

      // Chen một lượt hỏi trang khác vào giữa, để kiểm lịch sử KHÔNG trộn trang
      if (c.switchPageThenFollowUp && source.hasPage(c.switchPageThenFollowUp)) {
        const other = await source.getPage(c.switchPageThenFollowUp);
        const oRegion = { ...ContentDetector.contentBounds(other), wholePage: true };
        const oReply = await Explain.run({
          question: "giải thích trang này", page: other, region: oRegion,
          mode: Explain.readMode(other),
        });
        if (oReply.grounded !== false) {
          turns.push({ page: other.num, question: "giải thích trang này", answer: oReply.text });
        }
        if (CONFIG.USE_REAL_AI) await sleep(CONFIG.REAL_AI_DELAY_MS);
      }

      // Chỉ LẬT sang xem trang khác, KHÔNG hỏi gì về nó. Mô phỏng đúng thao
      // tác thật: học viên lật slide để đối chiếu rồi gõ tiếp câu hỏi về
      // trang cũ. `page`/`region` giữ nguyên trang đang bàn — đó chính là
      // hành vi đang được kiểm: chủ đề bám thứ đang HỎI, không theo đang XEM.
      if (c.viewPageAfter && source.hasPage(c.viewPageAfter)) {
        await source.getPage(c.viewPageAfter); // nạp vào bộ nhớ, không gửi đi
      }

      for (const fq of c.followUps) {
        // Dùng ĐÚNG hàm chọn ngữ cảnh của app (ConversationStore.select) chứ
        // không viết lại một bản na ná — runner phải đo cùng một sản phẩm.
        const ctx = ConversationStore.select(turns, page.num);
        const fr = await Explain.run({
          question: fq, page, region, mode,
          history: ctx.full, historyOutline: ctx.outline,
        });
        followUpReplies.push({ q: fq, reply: fr, histSent: ctx.full.length });
        if (fr.grounded !== false) {
          turns.push({ page: page.num, question: fq, answer: fr.text });
        }
        if (CONFIG.USE_REAL_AI) await sleep(CONFIG.REAL_AI_DELAY_MS);
      }
      // Chấm trên lượt hỏi tiếp CUỐI — đó là thứ case này muốn kiểm
      const last = followUpReplies[followUpReplies.length - 1];
      if (last) reply = last.reply;
    }

    return {
      id: c.id, cls: c.cls, expect: c.expect,
      out: reply.text, grounded: reply.grounded, mode: reply.mode || mode,
      status: reply.status || null, // HTTP status khi lời gọi lỗi (429...)
      answeredPage: page.num, stayedOn,
      region: { w: Math.round(region.w), h: Math.round(region.h),
                pct: Math.round(region.w * region.h * 100 / (page.width * page.height)) },
      pageDims: { w: page.width, h: page.height },
      disclosure: reply.disclosure || null,
      trace: reply.trace || null,
      followUps: followUpReplies.map((f) => ({ q: f.q, histSent: f.histSent,
        histTurns: f.reply.disclosure ? f.reply.disclosure.historyTurns : null })),
      auto: this.check(c, reply, region, page, stayedOn),
      hFlag: this.flagH(c, reply.text),
    };
  },

  // ---- chấm máy ----
  check(c, reply, region, page, stayedOn) {
    const a = c.auto || {};
    const out = [];
    const add = (name, ok, detail) => out.push({ name, ok, detail: detail || "" });

    if (a.detected) add("dò được vùng", !!region);
    if (a.noContentPath) add("đi nhánh ① không đoán", reply.kind === "noContent");
    // `grounded === false` đúng cho CẢ từ chối và hỏi lại — kiểm mỗi cờ đó là
    // không phân biệt được hai thứ. Lượt 02 vì thế báo C28 "đạt" trong khi
    // output thực tế là câu HỎI LẠI, không phải câu từ chối: một pass sai lý do
    // che mất một bug thật của guardrail.
    // Từ lượt 04: so marker `kind` do TỪNG producer gắn — vẫn phân biệt được
    // từ-chối/hỏi-lại như so chuỗi, nhưng câu chữ REPLIES đổi thoải mái
    // (kể cả nhiều biến thể câu) mà máy chấm không vỡ.
    if (a.asksBack) {
      add("hỏi lại thay vì đoán",
        reply.grounded === false && reply.kind === "tooSmall",
        reply.kind === "outOfScope" ? "đây là câu TỪ CHỐI, không phải hỏi lại" : "");
    }
    if (a.refused) {
      add("từ chối vì ngoài phạm vi",
        reply.grounded === false && reply.kind === "outOfScope",
        reply.grounded === false && reply.kind !== "outOfScope"
          ? "grounded=false nhưng KHÔNG phải câu từ chối" : "");
    }
    // Chiều ngược của refused: câu hỏi NỘI DUNG hợp lệ không được từ chối
    // oan. Bài học L14 lượt 03: "tổng điểm của usecase này" bị từ khoá
    // "điểm của" bắn nhầm → trả câu từ chối lạc đề mà auto vẫn ✓ vì không
    // có điều kiện nào bắt.
    if (a.notRefused) add("không từ chối oan", reply.kind !== "outOfScope",
      reply.kind === "outOfScope" ? "guardrail bắn nhầm câu hỏi nội dung" : "");
    if (a.nothingSent) add("không gửi gì ra ngoài", !reply.disclosure);
    if (a.mode) add(`chế độ đọc = ${a.mode}`, (reply.mode || "") === a.mode, reply.mode || "-");
    if (a.maxPages) {
      add(`gửi ≤ ${a.maxPages} trang`,
        !reply.disclosure || reply.disclosure.pages <= a.maxPages,
        reply.disclosure ? String(reply.disclosure.pages) : "-");
    }
    if (a.notWholePage) {
      add("ảnh không phải cả trang",
        !!reply.disclosure && reply.disclosure.wholePage === false,
        reply.disclosure ? `${reply.disclosure.imageW}×${reply.disclosure.imageH}` : "-");
    }
    if (a.textWithinCap) {
      add(`text ≤ ${CONFIG.MAX_TEXT_CHARS} ký tự`,
        !!reply.disclosure && reply.disclosure.textChars <= CONFIG.MAX_TEXT_CHARS,
        reply.disclosure ? String(reply.disclosure.textChars) : "-");
    }
    if (a.hasCitation) add("có trích dẫn trang", !!reply.citation);
    if (a.hasOutsideDoc) add("có khối [NGOÀI TÀI LIỆU] tách biệt", !!reply.outsideDoc);
    if (a.noOutsideDoc) add("KHÔNG dùng nhãn ngoài tài liệu", !reply.outsideDoc);
    if (a.hasSuggestions) add("có gợi ý câu hỏi tiếp",
      !!(reply.suggestions && reply.suggestions.length),
      String((reply.suggestions || []).length));
    if (a.hasHistory) add("lượt hỏi tiếp có gửi lịch sử",
      !!(reply.disclosure && reply.disclosure.historyTurns > 0),
      String(reply.disclosure ? reply.disclosure.historyTurns : "-"));
    if (a.historyOnlySamePage) {
      // Đã hỏi 1 lượt trang này + 1 lượt trang khác. Phần lịch sử gửi ĐẦY ĐỦ
      // (hỏi + đáp) chỉ được gồm lượt của trang đang bàn -> đúng 1, không phải 2.
      const n = reply.disclosure ? reply.disclosure.historyTurns : -1;
      add("lịch sử đầy đủ chỉ gồm lượt của đúng trang này", n === 1, String(n));
    }
    // Dàn ý lượt trang khác được phép có (để nối mạch hội thoại) nhưng
    // TUYỆT ĐỐI không được mang theo câu trả lời của trang khác — đó mới là
    // thứ phá trần "1 trang/câu hỏi".
    if (a.outlineNoAnswers) {
      const d = reply.disclosure;
      add("dàn ý trang khác không kèm câu trả lời",
        !!d && d.historyOutlineHasAnswers === false,
        d ? `${d.historyOutline} câu hỏi · chế độ ${d.historyOutlineMode}` : "-");
    }
    if (a.regionDisplay && region && page) {
      const s = CONFIG.SLIDE_W / page.width; // trang -> hệ hiển thị 960
      const dw = Math.round(region.w * s), dh = Math.round(region.h * s);
      const ok = Math.abs(dw - a.regionDisplay[0]) <= (a.tol || 30) &&
                 Math.abs(dh - a.regionDisplay[1]) <= (a.tol || 30);
      add(`khung ≈ ${a.regionDisplay[0]}×${a.regionDisplay[1]} (±${a.tol || 30})`, ok, `${dw}×${dh}`);
    }
    if (a.answeredPage) add(`đọc trang ${a.answeredPage}`, reply.disclosure?.pageNum === a.answeredPage,
      String(reply.disclosure?.pageNum ?? "-"));
    if (a.stayedOnPage) add(`không rời trang ${a.stayedOnPage}`, stayedOn === a.stayedOnPage, String(stayedOn));

    return out;
  },

  // Cờ nghi vấn cho chiều H — KHÔNG phải phán quyết, chỉ là bộ lọc giúp
  // người chấm biết nên đọc kỹ case nào trước.
  //
  // Nguyên tắc: khi `expect` của case nói rằng sản phẩm PHẢI rào lại (nói
  // không có / không đọc rõ / không đề cập), mà câu trả lời không có một chữ
  // rào nào, thì rất có thể model đã tự tin trả lời một thứ không có căn cứ.
  // Người chấm vẫn phải tự đọc và quyết.
  flagH(c, out) {
    if (!out || !c.expect) return null;
    const mustHedge = /không (có|đề cập|đọc rõ|nhận diện)|nói rõ|không được (bịa|đoán|suy diễn)|hỏi lại/i
      .test(c.expect);
    if (!mustHedge) return null;
    const hasHedge = /không (có|đề cập|nói|nêu|thấy|đọc rõ|nhận diện|tìm thấy|xuất hiện)|chưa chắc|không rõ|không chắc|ngoài (phạm vi|vùng)|mình không/i
      .test(out);
    return hasHedge ? null : "⚠ nghi H: expect đòi rào lại nhưng câu trả lời không có chữ rào nào";
  },

  // ---- chạy trọn bộ ----
  async runAll() {
    document.getElementById("btn-run").disabled = true;
    document.getElementById("log").innerHTML = "";
    Explain.traces = [];
    this.results = [];

    const cases = GOLDEN_CASES.filter((c) => c.src !== "pdf" || this.pdfSource);
    const skipped = GOLDEN_CASES.length - cases.length;
    if (skipped) this.log(`⚠ Bỏ qua ${skipped} case PDF (không tải được PDF thật)`, "warn");

    let i = 0;
    for (const c of cases) {
      try {
        // Free tier giới hạn theo phút — giãn cách giữa các lời gọi thật
        if (CONFIG.USE_REAL_AI && i++ > 0) await sleep(CONFIG.REAL_AI_DELAY_MS);

        let r = await this.runCase(c);

        // Ăn 429 (vượt quota theo phút) thì lùi dần rồi thử lại tối đa 3 lần.
        // Thử một lần là không đủ: đo thật thấy lần hai vẫn 429, và case bị
        // ghi nhận fail vì lý do hạ tầng chứ không phải vì sản phẩm sai.
        for (let attempt = 1; attempt <= 3; attempt++) {
          if (!CONFIG.USE_REAL_AI || r.status !== 429) break;
          const backoff = 30000 * attempt;
          this.log(`${c.id} bị 429 (lần ${attempt}) — chờ ${backoff / 1000}s rồi thử lại`, "warn");
          await sleep(backoff);
          r = await this.runCase(c);
        }
        // Vẫn 429 sau 3 lần -> đánh dấu là lỗi hạ tầng, KHÔNG lẫn với fail sản phẩm
        if (CONFIG.USE_REAL_AI && r.status === 429) r.rateLimited = true;
        this.results.push(r);
        const auto = r.auto || [];
        const fail = auto.filter((x) => !x.ok);
        this.log(
          `${r.id} [${r.cls}] ${r.skipped ? "BỎ QUA — " + r.skipped
            : `mode=${r.mode} vùng=${r.region ? r.region.w + "×" + r.region.h : "-"} ` +
              `auto ${auto.length - fail.length}/${auto.length}` +
              (fail.length ? " ✗ " + fail.map((f) => f.name + `(${f.detail})`).join("; ") : " ✓")}`,
          r.skipped ? "warn" : fail.length ? "bad" : "good");
      } catch (err) {
        this.results.push({ id: c.id, cls: c.cls, error: err.message });
        this.log(`${c.id} LỖI: ${err.message}`, "bad");
      }
    }

    this.renderSummary();
    document.getElementById("btn-run").disabled = false;
    document.getElementById("outputs").hidden = false;
  },

  renderSummary() {
    const all = this.results.filter((r) => !r.skipped && !r.error);
    // Case bị chặn quota là lỗi hạ tầng — tách ra, không tính vào % sản phẩm
    const rl = all.filter((r) => r.rateLimited);
    const rows = all.filter((r) => !r.rateLimited);
    let total = 0, passed = 0;
    for (const r of rows) for (const a of r.auto || []) { total++; if (a.ok) passed++; }
    const casesWithAuto = rows.filter((r) => (r.auto || []).length);
    const casesAllPass = casesWithAuto.filter((r) => r.auto.every((a) => a.ok));

    // Chỉ số mức BỘ, không phải mức case — có những thứ không nên đòi ở từng
    // lượt (vd gợi ý câu hỏi tiếp: prompt cho phép bỏ khi không có gợi ý hợp lý)
    const tr = Explain.traces || [];
    const corpus = tr.length
      ? ` · <span class="k">toàn bộ: ${tr.filter((t) => (t.suggestions || []).length).length}/${tr.length} ` +
        `lượt gọi có gợi ý · ${tr.filter((t) => t.outsideDoc).length}/${tr.length} lượt có khối ngoài tài liệu` +
        (tr.some((t) => t.grounding_probe && t.grounding_probe.readFirst)
          ? ` · <b class="warn">${tr.filter((t) => t.grounding_probe && t.grounding_probe.readFirst).length} lượt nên đọc trước khi chấm H</b>`
          : "") + "</span>"
      : "";

    document.getElementById("summary").innerHTML =
      `<b>${rows.length}</b> case đã chạy · ` +
      `chấm máy: <b>${passed}/${total}</b> điều kiện đạt ` +
      `(<b>${total ? Math.round(passed * 100 / total) : 0}%</b>) · ` +
      `<b>${casesAllPass.length}/${casesWithAuto.length}</b> case đạt hết điều kiện máy chấm ` +
      `(<b>${casesWithAuto.length ? Math.round(casesAllPass.length * 100 / casesWithAuto.length) : 0}%</b>)` +
      (rl.length
        ? `<br><span class="warn">${rl.length} case bị chặn quota (429) sau 3 lần thử — ` +
          `lỗi hạ tầng, đã tách khỏi % trên: ${rl.map((r) => r.id).join(", ")}</span>`
        : "") +
      corpus +
      `<br><span class="warn">Bốn chiều G/S/H/C vẫn phải chấm bằng người — bảng markdown bên dưới đã để cột trống.</span>`;

    document.getElementById("md").value = this.toMarkdown();
    document.getElementById("traces").value = JSON.stringify(Explain.traces, null, 2);
  },

  toMarkdown() {
    const esc = (s) => String(s == null ? "" : s).replace(/\|/g, "\\|").replace(/\n+/g, " ");
    const trunc = (s, n) => { s = esc(s); return s.length > n ? s.slice(0, n) + "…" : s; };

    const lines = [];
    lines.push(`| ID | Lớp | Chế độ | Vùng (px trang) | Auto | Output (rút gọn) | G | S | H | C | Đạt? | Cờ nghi vấn (bộ lọc, không phải phán quyết) |`);
    lines.push(`|---|---|---|---|---|---|:-:|:-:|:-:|:-:|:-:|---|`);
    for (const r of this.results) {
      if (r.skipped) { lines.push(`| ${r.id} | ${r.cls} | — | — | BỎ QUA | ${esc(r.skipped)} | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |`); continue; }
      if (r.error) { lines.push(`| ${r.id} | ${r.cls} | — | — | LỖI | ${esc(r.error)} | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |`); continue; }
      if (r.rateLimited) { lines.push(`| ${r.id} | ${r.cls} | ${r.mode} | — | **429 quota** | ${trunc(r.out, 120)} | — | — | — | — | — | Lỗi hạ tầng, không tính vào % |`); continue; }
      const auto = r.auto || [];
      const fail = auto.filter((a) => !a.ok);
      const autoTxt = auto.length
        ? (fail.length ? `✗ ${auto.length - fail.length}/${auto.length}: ` + fail.map((f) => `${f.name}=${f.detail}`).join("; ")
                       : `✓ ${auto.length}/${auto.length}`)
        : "—";
      lines.push(`| ${r.id} | ${r.cls} | ${r.mode} | ${r.region ? r.region.w + "×" + r.region.h + ` (${r.region.pct}%)` : "—"} ` +
        `| ${esc(autoTxt)} | ${trunc(r.out, 160)} | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ${esc(r.hFlag || "")} |`);
    }
    return lines.join("\n");
  },

  copy(id) {
    const el = document.getElementById(id);
    el.select();
    document.execCommand("copy");
    this.log(`Đã copy ${id === "md" ? "bảng markdown" : "traces"} vào clipboard`, "good");
  },

  download(id, filename) {
    const blob = new Blob([document.getElementById(id).value], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  },
};

window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btn-run").onclick = () => Runner.runAll();
  document.getElementById("btn-copy-md").onclick = () => Runner.copy("md");
  document.getElementById("btn-copy-traces").onclick = () => Runner.copy("traces");
  document.getElementById("btn-dl-traces").onclick = () => Runner.download("traces", "traces.json");
  Runner.init();
});
