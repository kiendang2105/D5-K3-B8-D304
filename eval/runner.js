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

    if (c.chat) {
      question = c.chat;
      const m = c.chat.match(PAGE_IN_QUESTION);
      if (!m) {
        // ② không nêu slide và không có vùng chọn -> hỏi lại, chưa gọi AI
        return {
          id: c.id, cls: c.cls, expect: c.expect,
          out: REPLIES.noPageInQuestion, grounded: false,
          mode: "-", region: null, disclosure: null, stayedOn,
          auto: this.check(c, { grounded: false, text: REPLIES.noPageInQuestion }, null, null, stayedOn),
        };
      }
      const n = parseInt(m[1], 10);
      if (!source.hasPage(n)) {
        return {
          id: c.id, cls: c.cls, expect: c.expect,
          out: REPLIES.pageOutOfRange(n, source.rangeText()), grounded: false,
          mode: "-", region: null, disclosure: null, stayedOn,
          auto: this.check(c, { grounded: false }, null, null, stayedOn),
        };
      }
      page = await source.getPage(n);
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
        auto: this.check(c, { grounded: false, text: REPLIES.noContent }, null, null, stayedOn),
      };
    }

    const mode = Explain.readMode(page);
    const reply = await Explain.run({ question, page, region, mode });

    return {
      id: c.id, cls: c.cls, expect: c.expect,
      out: reply.text, grounded: reply.grounded, mode: reply.mode || mode,
      answeredPage: page.num, stayedOn,
      region: { w: Math.round(region.w), h: Math.round(region.h),
                pct: Math.round(region.w * region.h * 100 / (page.width * page.height)) },
      pageDims: { w: page.width, h: page.height },
      disclosure: reply.disclosure || null,
      trace: reply.trace || null,
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
    if (a.noContentPath) add("đi nhánh ① không đoán", reply.text === REPLIES.noContent);
    if (a.asksBack) {
      add("hỏi lại thay vì đoán",
        reply.grounded === false &&
        [REPLIES.tooSmall, REPLIES.noPageInQuestion].includes(reply.text));
    }
    if (a.refused) add("từ chối", reply.grounded === false);
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
          if (!CONFIG.USE_REAL_AI || !/\(429\)/.test(r.out || "")) break;
          const backoff = 30000 * attempt;
          this.log(`${c.id} bị 429 (lần ${attempt}) — chờ ${backoff / 1000}s rồi thử lại`, "warn");
          await sleep(backoff);
          r = await this.runCase(c);
        }
        // Vẫn 429 sau 3 lần -> đánh dấu là lỗi hạ tầng, KHÔNG lẫn với fail sản phẩm
        if (CONFIG.USE_REAL_AI && /\(429\)/.test(r.out || "")) r.rateLimited = true;
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
