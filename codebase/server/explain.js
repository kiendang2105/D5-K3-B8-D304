// ============================================================
// QUYẾT ĐỊNH AI TRUNG TÂM của lát cắt.
//
// Bốn quyết định nằm ở đây, theo thứ tự:
//   1. readMode()      — đọc vùng bằng TEXT hay bằng QUÉT ẢNH?
//   2. isOutOfScope()  — có được phép trả lời không? (guardrail rẻ, chạy trước)
//   3. buildPayload()  — GỬI ĐI NHỮNG GÌ (xem GIỚI HẠN DỮ LIỆU ở config.js)
//   4. callGemini()    — gọi model vision với đúng payload đó
//
// buildPayload() là CHỖ DUY NHẤT dữ liệu rời khỏi máy học viên. Soát hàm
// đó là soát được toàn bộ đường dữ liệu đi ra.
//
// Mức prototype hiện tại là Mock nên file này chạy thẳng ở client (không
// dựng backend riêng). Khi tách backend thật, đem nguyên callGemini() sang
// server — giao diện Explain.run() không đổi.
// ============================================================

const Explain = {
  _promptTemplate: null,
  _reviewTemplate: null,   // khung prompt ôn tập
  _taskTemplate: null,     // hai khối nhiệm vụ (tóm tắt / quiz)

  // --- Kiểm key + tự chọn model ---
  // Gọi ListModels để biết key này dùng được model nào. Làm vậy để không
  // phải đoán tên model (đoán sai là nhận 404 ngay giữa lúc demo).
  async listModels(key) {
    const res = await fetch(`${CONFIG.GEMINI_ENDPOINT}?key=${key}&pageSize=100`);
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}${body ? " — " + body.slice(0, 200) : ""}`);
    }
    const data = await res.json();
    return (data.models || [])
      .filter((m) => (m.supportedGenerationMethods || []).includes("generateContent"))
      .map((m) => ({
        id: m.name.replace(/^models\//, ""),
        display: m.displayName || m.name,
        inputLimit: m.inputTokenLimit,
      }));
  },

  // Chọn model theo thứ tự ưu tiên trong CONFIG.GEMINI_PREFER
  pickModel(models) {
    for (const pref of CONFIG.GEMINI_PREFER) {
      const hit = models.find((m) => m.id.includes(pref));
      if (hit) return hit.id;
    }
    return models[0] ? models[0].id : null;
  },

  // --- Quyết định 1: đọc bằng cách nào ---
  // "text" = trang có lớp text -> grounding bằng text trong vùng (nhanh, rẻ)
  // "scan" = trang không có lớp text (slide ảnh/scan) -> cho model NHÌN ảnh vùng
  readMode(page) {
    if (!page) return "scan";
    return page.textLen >= CONFIG.MIN_TEXT_CHARS ? "text" : "scan";
  },

  // --- Quyết định 2: guardrail ngoài phạm vi ---
  // Chạy TRƯỚC khi cắt ảnh và gửi đi. Không đáng gửi dữ liệu ra ngoài chỉ
  // để nhận về một câu từ chối.
  //
  // Trả CATEGORY ("task" | "logistics" | "bulk") thay vì boolean — để câu
  // từ chối nêu đúng lý do khớp với yêu cầu (REPLIES.refusal). Trả null
  // khi trong phạm vi; mọi chỗ gọi kiểu truthiness vẫn chạy y nguyên.
  isOutOfScope(question) {
    const q = (question || "").toLowerCase();
    for (const [cat, pats] of Object.entries(OUT_OF_SCOPE_GROUPS)) {
      if (pats.some((p) => q.includes(p))) return cat;
    }
    if (LOGISTICS_REGEX.test(q)) return "logistics";
    // Mẫu "động từ yêu cầu + từ chỉ toàn bộ + đối tượng tài liệu" — bắt các
    // cách nói mà danh sách từ khoá cố định không phủ hết (xem ghi chú ở
    // OUT_OF_SCOPE_REGEX trong mock-data.js).
    return OUT_OF_SCOPE_REGEX.test(q) ? "bulk" : null;
  },

  // --- Quyết định 2b: đây có phải yêu cầu ÔN TẬP không? ---
  //
  // Chạy TRƯỚC isOutOfScope. Từ 31/07, "tóm tắt cả buổi" và "tạo quiz"
  // không còn bị từ chối — chúng có đường đi riêng (Explain.review) chỉ
  // dùng ghi chú của những trang học viên đã tự mở.
  //
  // Vì sao đổi: câu từ chối cũ ("mình đọc đúng một trang mỗi câu hỏi, không
  // sinh quiz") bảo vệ đúng một thứ — không đọc trang học viên chưa xem.
  // Thứ đó vẫn được bảo vệ nguyên vẹn ở đường mới, bằng ghi chú thay vì
  // bằng lời từ chối. Cái mất đi chỉ là việc học viên phải tự lật lại 12
  // trang để ôn.
  //
  // KHÔNG đụng tới hai nhánh từ chối còn lại: "làm hộ bài tập / đưa đáp án"
  // (task) và "deadline / điểm số" (logistics) vẫn từ chối y như cũ. Quiz để
  // TỰ kiểm tra khác hẳn làm bài hộ — một bên học viên phải tự trả lời, một
  // bên đưa sẵn đáp án cho bài đang bị chấm điểm.
  //
  // Trả "quiz" | "summary" | null.
  reviewIntent(question) {
    const q = (question || "").toLowerCase().trim();
    if (!q) return null;
    if (DECK_QUIZ_REGEX.test(q)) return "quiz";
    if (DECK_SUMMARY_REGEX.test(q)) return "summary";
    // "tóm tắt toàn bộ tài liệu" — trước đây là nhánh `bulk` bị từ chối,
    // giờ chính là yêu cầu tóm tắt buổi học.
    if (this.isOutOfScope(q) === "bulk") return "summary";
    return null;
  },

  // --- Quyết định 3: đóng gói dữ liệu gửi đi ---
  // Nhận: { page, region (toạ độ TRANG), question }
  // Trả:  { image, text, disclosure } — disclosure là bảng để hiện cho
  //        học viên biết chính xác cái gì đã rời máy.
  buildPayload({ page, region, mode, history, historyOutline }) {
    // (a) Ảnh: CHỈ vùng đã cắt, không phải cả trang
    const image = ContentDetector.cropPage(page, region);

    // (b) Text: chỉ các đoạn nằm trong vùng chọn + lề, không phải text cả trang
    let text = "";
    let itemCount = 0;
    if (mode === "text" && page.textItems) {
      const m = CONFIG.TEXT_MARGIN_PX;
      const box = {
        x: region.x - m, y: region.y - m,
        r: region.x + region.w + m, b: region.y + region.h + m,
      };
      const inside = page.textItems.filter(
        (t) => t.x + t.w >= box.x && t.x <= box.r && t.y + t.h >= box.y && t.y <= box.b
      );
      itemCount = inside.length;
      text = inside.map((t) => t.str).join(" ").replace(/\s+/g, " ").trim()
        .slice(0, CONFIG.MAX_TEXT_CHARS);
    }

    // (c) Lịch sử — chỉ CHỮ. Hai tầng, xem ConversationStore:
    //   hist    : lượt của ĐÚNG trang này, hỏi + đáp nguyên văn
    //   outline : lượt của trang khác, mặc định CHỈ câu hỏi của học viên
    //             (không kèm đáp) — nối được mạch mà không đọc thêm chữ
    //             nào của trang khác.
    // Trần vẫn chặn cứng ở đây thay vì tin vào chỗ gọi.
    const hist = (history || []).filter((h) => h && h.question)
      .slice(-CONFIG.HISTORY_MAX_TURNS);
    const histChars = hist.reduce(
      (n, h) => n + (h.question || "").length + (h.answer || "").length, 0);

    const outline = (historyOutline || []).filter((h) => h && h.question)
      .slice(-CONFIG.HISTORY_OUTLINE_MAX);
    const outlineChars = outline.reduce(
      (n, h) => n + (h.question || "").length + (h.answer || "").length, 0);

    // (d) Bảng công khai — học viên tự kiểm cái gì đã gửi đi
    const disclosure = {
      pages: 1, // trần cứng CONFIG.MAX_PAGES_PER_REQUEST
      pageNum: page.num,
      imageW: Math.round(region.w),
      imageH: Math.round(region.h),
      regionPctOfPage: Math.round((region.w * region.h * 100) / (page.width * page.height)),
      textChars: text.length,
      textItems: itemCount,
      historyTurns: hist.length,
      historyChars: histChars,
      // Tách riêng khỏi historyTurns: điều kiện `historyOnlySamePage` của
      // golden set (F03) đo đúng con số historyTurns, giữ nguyên nghĩa "lượt
      // cùng trang gửi đầy đủ" để test không đổi ý nghĩa.
      historyOutline: outline.length,
      historyOutlineChars: outlineChars,
      historyOutlineMode: CONFIG.HISTORY_CROSS_PAGE,
      // Bất biến kiểm được: ở chế độ mặc định, dàn ý KHÔNG mang câu trả lời
      // của trang khác. Golden set kiểm cờ này thay vì tin vào tên chế độ.
      historyOutlineHasAnswers: outline.some((h) => !!h.answer),
      sentFileName: false,
      sentOtherPages: false,
      wholePage: !!region.wholePage,
    };

    return { image, text, history: hist, historyOutline: outline, disclosure };
  },

  // --- Quyết định 3b: đóng gói dữ liệu cho ĐƯỜNG ÔN TẬP ---
  //
  // Chỗ thứ hai (và cuối cùng) dữ liệu rời khỏi máy học viên. Khác
  // buildPayload ở ba điểm, và cả ba đều phải kiểm được từ bảng công khai:
  //
  //   1. KHÔNG có ảnh. Ôn tập chỉ gửi chữ.
  //   2. KHÔNG có text thô của trang. Chỉ ghi chú đã cắt ở DECK_NOTE_CHARS —
  //      thứ app đã rút ra lúc học viên đi qua trang đó.
  //   3. Chỉ những trang HỌC VIÊN ĐÃ TỰ MỞ. Trang chưa lật tới thì không có
  //      ghi chú, nên không có gì để gửi. Đây là chốt chặn thật, không phải
  //      lời hứa: DeckNotes chỉ ghi trong DeckNotes.visit().
  //
  // Cắt trần lại ở đây thay vì tin vào DeckNotes — cùng lý do buildPayload
  // cắt lại lịch sử: chỗ đóng gói phải tự chịu trách nhiệm.
  buildDeckPayload({ notes, coverage, asked, intent }) {
    const kept = [];
    let chars = 0;
    for (const n of notes || []) {
      const title = (n.title || "").slice(0, 80);
      const gist = (n.gist || "").slice(0, CONFIG.DECK_NOTE_CHARS);
      const size = title.length + gist.length;
      if (chars + size > CONFIG.DECK_MAX_CHARS) break;
      chars += size;
      kept.push({ page: n.page, title, gist, source: n.source });
    }

    // Câu hỏi của học viên — lời của chính họ, không phải nội dung tài liệu.
    // Đây là nguồn của 5 câu quiz "chỗ bạn từng thắc mắc".
    const askedList = (asked || [])
      .filter((a) => a && a.question)
      .slice(-CONFIG.HISTORY_OUTLINE_MAX)
      .map((a) => ({ page: a.page, question: String(a.question).slice(0, 160) }));
    const askedChars = askedList.reduce((n, a) => n + a.question.length, 0);

    const disclosure = {
      kind: "deck-review",
      intent,
      pages: kept.length,
      pageNums: kept.map((n) => n.page),
      noteChars: chars,
      images: 0,                 // ôn tập không gửi ảnh nào
      rawPageText: false,        // chỉ ghi chú, không phải text thô của trang
      askedQuestions: askedList.length,
      askedChars,
      coverageSeen: coverage ? coverage.seen : kept.length,
      coverageTotal: coverage ? coverage.total : kept.length,
      sentFileName: false,
      sentUnseenPages: false,    // bất biến: không trang nào chưa xem lọt vào
    };

    return { notes: kept, asked: askedList, disclosure };
  },

  // --- Điểm vào duy nhất ---
  // req: { question, page, region, mode }
  // trả: { text, citation?, mode, zone?, grounded?, disclosure?, trace? }
  //
  // MỌI guard phải nằm ở đây, KHÔNG nằm trong MockAI. Bài học từ lượt chạy
  // 01: guard "vùng quá nhỏ thì hỏi lại" ban đầu chỉ có trong MockAI.route,
  // nên khi bật AI thật thì một dải viền mảnh vẫn được gửi đi và model mô tả
  // nó rất tự tin — đúng lỗi mà lớp ② phải chặn. Golden set bắt được (case C04).
  async run(req, opts = {}) {
    // ③ Ngoài phạm vi — từ chối TRƯỚC khi đóng gói, không gì rời máy.
    // `kind` là marker cho máy chấm (runner so kind, không so nguyên câu) —
    // nhờ đó câu chữ của REPLIES đổi được mà bộ test không vỡ.
    const scopeCat = this.isOutOfScope(req.question);
    if (scopeCat) {
      return { text: REPLIES.refusal(scopeCat), kind: "outOfScope", mode: req.mode, grounded: false };
    }

    // ② Vùng quá nhỏ / dải viền mảnh — không đủ chắc user hỏi gì thì hỏi lại,
    // không gửi đi và không đoán. Áp cho CẢ mock và AI thật.
    const { region, page } = req;
    const ratio = (region.w * region.h) / (page.width * page.height);
    if (ratio < CONFIG.MIN_SEL_RATIO) {
      return { text: REPLIES.tooSmall, kind: "tooSmall", mode: req.mode, grounded: false };
    }

    const payload = this.buildPayload(req);
    const full = { ...req, ...payload };

    // opts.onChunk -> đường stream (chữ ra dần). Runner gọi run() một tham
    // số nên luôn đi đường một-phát cũ — số đo so được giữa các lượt chạy.
    // Mock không stream: app vẫn giả lập gõ chữ như trước.
    const onChunk = typeof opts.onChunk === "function" ? opts.onChunk : null;
    const reply = CONFIG.USE_REAL_AI
      ? (onChunk ? await this.callGeminiStream(full, onChunk) : await this.callGemini(full))
      : await MockAI.route(full);
    return { ...reply, disclosure: reply.grounded === false ? null : payload.disclosure };
  },

  // --- Điểm vào thứ hai: ÔN TẬP CUỐI BUỔI ---
  //
  // Tách khỏi run() chứ không nhét thêm một nhánh vào trong đó: hai đường
  // có trần dữ liệu khác nhau (xem GIỚI HẠN DỮ LIỆU ở config.js), trộn
  // chung một hàm là sớm muộn cũng có người sửa nhánh này làm hỏng trần
  // của nhánh kia.
  //
  // req: { intent: "summary"|"quiz", notes, coverage, asked }
  async review(req, opts = {}) {
    const intent = req.intent === "quiz" ? "quiz" : "summary";
    const payload = this.buildDeckPayload({ ...req, intent });

    // Chưa đi qua trang nào thì không có gì để ôn. Nói thẳng lý do và cách
    // gỡ, đừng gọi model để nhận về một câu vô nghĩa.
    if (payload.notes.length < CONFIG.DECK_MIN_PAGES) {
      return {
        text: REPLIES.deckTooFew(payload.notes.length, CONFIG.DECK_MIN_PAGES),
        kind: "deckTooFew", grounded: false,
      };
    }

    const full = { ...req, ...payload, intent };
    const onChunk = typeof opts.onChunk === "function" ? opts.onChunk : null;
    const reply = CONFIG.USE_REAL_AI
      ? await this.callGeminiReview(full, intent === "summary" ? onChunk : null)
      : await MockAI.review(full);

    // Chốt chặn cuối cho nhãn nhóm: học viên chưa hỏi câu nào thì KHÔNG câu
    // nào được mang nhãn "từ câu bạn đã hỏi", dù model có in tiêu đề nhóm 1
    // hay không. Nhãn này là một lời khẳng định về dữ liệu của chính học
    // viên — sai là mất tin ngay, mà kiểm thì rẻ.
    if (reply.quiz && !payload.asked.length) {
      for (const q of reply.quiz) q.group = 2;
    }

    return {
      ...reply,
      intent,
      coverage: req.coverage || null,
      disclosure: reply.grounded === false ? null : payload.disclosure,
    };
  },

  // Lấy khối nhiệm vụ giữa dòng mốc `<<<TÊN>>>` và dòng mốc kế tiếp.
  // Trả "" khi không có mốc — chỗ gọi phải ném lỗi rõ thay vì gửi đi một
  // prompt không có phần việc nào.
  _cutTask(src, name) {
    const lines = (src || "").split("\n");
    const isMark = (s) => /^\s*<<<[A-Z]+>>>\s*$/.test(s);
    const start = lines.findIndex((s) => s.trim() === `<<<${name}>>>`);
    if (start < 0) return "";
    const out = [];
    for (let i = start + 1; i < lines.length; i++) {
      if (isMark(lines[i])) break;
      out.push(lines[i]);
    }
    return out.join("\n").trim();
  },

  // Prompt ôn tập. Khung chung ở deck-review.md, phần việc ở deck-tasks.md
  // (cắt theo mốc <<<SUMMARY>>> / <<<QUIZ>>>) — sửa lời một nhiệm vụ không
  // đụng nhiệm vụ kia.
  async buildReviewPrompt({ intent, notes, asked, coverage }) {
    if (!this._reviewTemplate) {
      const res = await fetch(CONFIG.REVIEW_PROMPT_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status} khi tải ${CONFIG.REVIEW_PROMPT_URL}`);
      this._reviewTemplate = await res.text();
    }
    if (!this._taskTemplate) {
      const res = await fetch(CONFIG.REVIEW_TASKS_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status} khi tải ${CONFIG.REVIEW_TASKS_URL}`);
      this._taskTemplate = await res.text();
    }

    // Mốc phải đứng RIÊNG MỘT DÒNG. Bản đầu dùng indexOf trần và dính bẫy
    // ngay: comment ở đầu deck-tasks.md có nhắc tên hai mốc, nên indexOf
    // bắt trúng chữ trong comment, phần việc bị cắt thành rỗng — cả tóm tắt
    // lẫn quiz đều chạy KHÔNG có nhiệm vụ, và model tự bịa ra bố cục.
    // Kiểm bằng AI thật mới lộ: gõ "tạo 10 câu quiz" nhận về một bản tóm tắt.
    const task = this._cutTask(this._taskTemplate, intent === "quiz" ? "QUIZ" : "SUMMARY");
    if (!task) throw new Error(`deck-tasks.md thiếu mốc <<<${intent.toUpperCase()}>>>`);

    const cov = coverage || { seen: notes.length, total: notes.length, full: true };
    const covText = cov.full
      ? `Học viên đã đi qua **cả ${cov.total} trang** của tài liệu này.`
      : `Học viên mới đi qua **${cov.seen}/${cov.total} trang**. ` +
        `Những trang chưa xem: ${(cov.missing || []).slice(0, 30).join(", ") || "(không rõ)"}. ` +
        "Bản ôn này chỉ phủ phần đã xem — phải nói rõ điều đó ở cuối.";

    // Ghi chú là DỮ LIỆU. Bẻ răng dấu đóng khung trước khi nối, cùng lý do
    // như safeText ở buildPrompt: học viên mở được PDF bất kỳ.
    const safe = (s) => (s || "").replace(/"{3,}/g, '""');
    const notesText = notes.map((n) => {
      if (n.source === "image") {
        return `- Trang ${n.page}: (chỉ có ảnh, chưa đọc được)`;
      }
      const head = n.title ? `**${safe(n.title)}** — ` : "";
      return `- Trang ${n.page}: ${head}${safe(n.gist)}`;
    }).join("\n");

    const askedText = (asked || []).length
      ? "## Những câu chính học viên đã hỏi trong buổi\n\n" +
        "Đây là lời của chính học viên, không phải nội dung tài liệu. Dùng để " +
        "biết họ từng vướng ở đâu:\n\n" +
        asked.map((a) => `- (trang ${a.page}) ${safe(a.question)}`).join("\n")
      : "## Những câu chính học viên đã hỏi trong buổi\n\n" +
        "(buổi này học viên chưa hỏi câu nào — nhóm 1 lấy từ các ý chính, " +
        "và nói rõ trong phần lý do là học viên chưa hỏi gì)";

    return this._reviewTemplate
      .replace("{{TASK}}", task)
      .replace("{{COVERAGE}}", covText)
      .replace("{{NOTES}}",
        "## Ghi chú các trang học viên đã mở\n\n" + notesText)
      .replace("{{ASKED}}", askedText);
  },

  // Lời gọi model cho đường ôn tập. Chỉ có CHỮ trong parts — không ảnh.
  async callGeminiReview(full, onChunk) {
    const key = localStorage.getItem("GEMINI_API_KEY");
    const model = CONFIG.GEMINI_MODEL || localStorage.getItem("GEMINI_MODEL");
    if (!key || !model) {
      return {
        text: "Chưa có API key. Bấm **API key** trên header để nhập (key chỉ lưu trong trình duyệt).",
        grounded: false,
      };
    }

    let prompt;
    try {
      prompt = await this.buildReviewPrompt(full);
    } catch (err) {
      return {
        text: `Không đọc được file prompt ôn tập (${err.message}).\n\n` +
              "Chạy qua server tĩnh giúp mình: `python deploy/devserver.py` rồi mở lại.",
        grounded: false,
      };
    }

    // Quiz 10 câu 4 lựa chọn dài hơn hẳn một câu giải thích -> nới trần.
    const body = JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: full.intent === "quiz" ? 3072 : 1536,
      },
    });

    const stream = !!onChunk;
    const url = `${CONFIG.GEMINI_ENDPOINT}/${model}:` +
      (stream ? "streamGenerateContent?alt=sse&" : "generateContent?") + `key=${key}`;
    const started = performance.now();

    let res;
    try {
      res = await fetch(url, {
        method: "POST", headers: { "Content-Type": "application/json" }, body,
      });
    } catch (err) {
      return { text: `Không gọi được model (mạng): ${err.message}`, grounded: false };
    }
    if (!res.ok) return this._httpErrorReply(res, model, "text");

    let raw = "", finish = null, usage = null;
    if (stream) {
      try {
        await this._readSse(res, (obj) => {
          const cand = obj?.candidates?.[0];
          finish = cand?.finishReason || finish;
          usage = obj?.usageMetadata || usage;
          const delta = (cand?.content?.parts || []).map((x) => x.text || "").join("");
          if (!delta) return;
          raw += delta;
          try { onChunk(delta, raw); }
          catch (e) { console.warn("[review] onChunk lỗi UI, stream vẫn chạy:", e); }
        });
      } catch (err) {
        if (!raw) return this.callGeminiReview(full, null); // chưa có chữ — thử một phát
      }
    } else {
      let data;
      try { data = await res.json(); }
      catch (err) {
        return { text: "Model trả về dữ liệu không đọc được. Bạn thử lại nhé.", grounded: false };
      }
      raw = data?.candidates?.[0]?.content?.parts?.map((x) => x.text).join("") || "";
      finish = data?.promptFeedback?.blockReason || data?.candidates?.[0]?.finishReason;
      usage = data?.usageMetadata;
    }

    const trace = {
      kind: "deck-review",
      intent: full.intent,
      model,
      latency_ms: Math.round(performance.now() - started),
      streamed: stream,
      usage: usage || null,
      finish_reason: finish || null,
      sent: full.disclosure,
      answer: raw,
    };
    console.log("[AI TRACE]", JSON.stringify(trace, null, 2));
    Explain.traces.push(trace);

    if (!raw.trim()) {
      return {
        text: `Model không trả về nội dung${finish ? ` (lý do: ${finish})` : ""}.`,
        grounded: false, trace,
      };
    }

    return full.intent === "quiz"
      ? { ...this.parseQuiz(raw), trace, truncated: finish === "MAX_TOKENS" }
      : { text: raw.replace(/```+/g, "").trim(), trace, truncated: finish === "MAX_TOKENS" };
  },

  // Tách bài quiz thành cấu trúc để vẽ được nút "xem đáp án" — thay vì đổ
  // nguyên khối markdown ra màn hình rồi lộ hết đáp án ngay dòng dưới câu hỏi.
  //
  // Model không phải lúc nào cũng theo đúng khuôn. Câu nào parse không ra
  // đủ (thiếu đáp án, thiếu lựa chọn) thì BỎ câu đó chứ không vẽ nửa vời,
  // và `text` giữ nguyên bản gốc để không mất gì nếu khuôn lệch hẳn.
  parseQuiz(raw) {
    const s = (raw || "").replace(/```+/g, "");
    const items = [];
    let group = 1;

    // Cắt theo tiêu đề câu "### 1. ..." — mốc duy nhất bắt buộc trong khuôn
    const chunks = s.split(/^###\s*/m).slice(1);
    let cursor = 0;
    for (const chunk of chunks) {
      // Nhóm được xác định bằng vị trí của dòng "## NHÓM 2" trong bản gốc
      const at = s.indexOf(chunk, cursor);
      cursor = at + 1;
      const before = s.slice(0, at);
      // Mặc định là NHÓM 2 (từ nội dung), KHÔNG phải nhóm 1. Model không in
      // tiêu đề nhóm nào — hay gặp khi học viên chưa hỏi câu nào nên nhóm 1
      // rỗng — thì dán nhãn "từ câu bạn đã hỏi" lên câu lấy từ nội dung là
      // nói sai về chính dữ liệu của mình. Chỉ nhận nhóm 1 khi có tiêu đề.
      group = /##\s*NHÓM\s*2/i.test(before) ? 2
        : (/##\s*NHÓM\s*1/i.test(before) ? 1 : 2);

      const lines = chunk.split("\n");
      const head = (lines.shift() || "").replace(/^\d+\.\s*/, "").trim();
      const rest = lines.join("\n");

      const options = [];
      const optRe = /^\s*[-*]?\s*([A-D])[.)]\s*(.+)$/gm;
      let m;
      while ((m = optRe.exec(rest))) options.push({ key: m[1], text: m[2].trim() });

      const ansM = rest.match(/ĐÁP\s*ÁN\s*:\s*([A-D])\b\s*[—\-–:]?\s*([^\n]*)/i);
      const srcM = rest.match(/NGUỒN\s*:\s*trang\s*(\d+)/i);

      if (!head || options.length < 2 || !ansM) continue;
      items.push({
        n: items.length + 1,
        group,
        question: head,
        options,
        answer: ansM[1].toUpperCase(),
        why: (ansM[2] || "").trim(),
        page: srcM ? parseInt(srcM[1], 10) : null,
      });
    }

    return { quiz: items, text: items.length ? "" : s.trim(), rawQuiz: s };
  },

  // --- Quyết định 4: lời gọi vision thật (CP3) ---
  // Key lấy từ localStorage (nút "API key" trên header), KHÔNG commit.
  //
  // Hai đường cùng bộ đồ nghề: callGemini (một phát, runner dùng — số đo
  // lượt này so được với lượt trước) và callGeminiStream (chữ ra dần, app
  // dùng). Phần chung tách thành _prepare / _httpErrorReply / _finalize
  // để hai đường không copy-paste lệch nhau.

  // Kiểm key + model + dựng prompt + lắp parts. Lỗi ở bước nào trả
  // { err: <reply lỗi> } ở bước đó — message giữ nguyên văn như trước.
  async _prepare({ question, image, text, page, mode, history, historyOutline }) {
    const key = localStorage.getItem("GEMINI_API_KEY");
    if (!key) {
      return { err: {
        text: "Chưa có API key. Bấm **API key** trên header để nhập (key chỉ lưu trong trình duyệt).",
        mode, grounded: false,
      } };
    }
    const model = CONFIG.GEMINI_MODEL || localStorage.getItem("GEMINI_MODEL");
    if (!model) {
      return { err: {
        text: "Chưa chọn được model. Bấm **API key** trên header để app dò lại danh sách model của key này.",
        mode, grounded: false,
      } };
    }

    let prompt;
    try {
      prompt = await this.buildPrompt({ question, text, page, mode, history, historyOutline });
    } catch (err) {
      return { err: {
        text: `Không đọc được file prompt \`server/prompts/explain-region.md\` (${err.message}).\n\n` +
              "Chạy qua server tĩnh giúp mình: `npx serve codebase` rồi mở `/web/index.html`.",
        mode, grounded: false,
      } };
    }

    // Đúng MỘT ảnh: vùng học viên chọn. Không đính kèm ảnh cả trang,
    // không đính kèm trang nào khác.
    const parts = [{ text: prompt }];
    if (image) {
      parts.push({ inlineData: { mimeType: "image/png", data: stripDataUrl(image) } });
    }
    return { key, model, parts };
  },

  // Body gửi đi — dùng chung cho cả hai endpoint.
  _requestBody(parts) {
    return JSON.stringify({
      contents: [{ role: "user", parts }],
      // Không đặt gì thì temperature mặc định ~1.0: CÙNG một case chạy
      // hai lần ra hai câu khác nhau — hai người chấm G/S/H/C độc lập
      // sẽ chấm trên hai đáp án khác nhau. Tutor là bài giải thích tài
      // liệu, không phải bài sáng tác: ghim thấp.
      // maxOutputTokens chặn trần "bài văn tả cả trang" (vi phạm chiều
      // S) và bớt phần đuôi của những lượt 27s ở lượt 03.
      // 1024 chứ không phải 512: prompt v2 cho phép tới 10 câu + khối
      // [NGOÀI TÀI LIỆU] + dòng GỢI Ý, và model dòng 2.5-flash tính cả
      // thinking token vào trần này — 512 là tự cắt cụt câu trả lời dài
      // hợp lệ. Chạm trần vẫn được phát hiện và báo (cờ `truncated`).
      generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
    });
  },

  // Dịch lỗi HTTP thành reply có hướng sửa. Google nói rõ lý do trong
  // body — không nuốt nó, vì "lỗi 403" trần trụi thì không ai biết sửa gì.
  async _httpErrorReply(res, model, mode) {
    const body = await res.text().catch(() => "");
    let reason = "";
    try { reason = JSON.parse(body)?.error?.message || ""; } catch { reason = body.slice(0, 200); }

    let hint = "";
    if (res.status === 404) {
      hint = ` — model \`${model}\` không dùng được với key này. Bấm **API key** để dò lại danh sách.`;
    } else if (res.status === 429) {
      hint = " — vượt quota free tier, chờ một lát rồi thử lại.";
    } else if (res.status === 403) {
      // 403 hầu như luôn là một trong ba nguyên nhân dưới đây.
      hint =
        " — key bị từ chối. Ba nguyên nhân thường gặp:\n" +
        "1. Key đặt **giới hạn HTTP referrer** (Website restrictions) — Generative Language API **không nhận** key loại đó. Đổi key về *None* hoặc tạo key mới không giới hạn.\n" +
        "2. Key giới hạn theo API nhưng **chưa tick Generative Language API**.\n" +
        `3. Model \`${model}\` là bản preview/trả phí mà key free không được dùng — bấm **API key** chọn lại model khác.`;
    }
    console.warn("[AI ERROR]", res.status, body.slice(0, 500));
    return {
      text: `Gọi model lỗi (${res.status})${hint}${reason ? `\n\n*Google trả về:* \`${reason}\`` : ""}`,
      // status để runner nhận diện 429 bằng số thay vì regex trên câu chữ
      status: res.status,
      mode, grounded: false,
    };
  },

  // Cắt phần đuôi dở dang của một câu trả lời KHÔNG trọn vẹn (stream đứt
  // hoặc chạm trần token). parseAnswer chỉ nhận diện marker HOÀN CHỈNH,
  // nên "[NGOÀI TÀI LI" hay "GỢI Ý: câu 1 | c" cụt sẽ lọt nguyên ra màn
  // hình — đúng thứ progressiveParse đã che suốt lúc stream.
  _trimDangling(raw) {
    let s = raw || "";
    // Ngoặc vuông mở gần cuối mà chưa đóng: '[NGOÀI TÀI LI...'
    const br = s.lastIndexOf("[");
    if (br >= 0 && br >= s.length - 25 && !s.slice(br).includes("]")) {
      s = s.slice(0, br);
    }
    // Dòng GỢI Ý cuối: đã cụt thì độ tin cậy bằng 0 (item chót có thể bị
    // cắt giữa chữ) — bỏ cả dòng, gợi ý là phần trang trí, thiếu còn hơn sai
    s = s.replace(/\n\s*GỢI Ý\s*:[^\n]*$/i, "");
    // Marker 'GỢI Ý:' mới gõ được vài ký tự ở đầu dòng cuối
    const M = "GỢI Ý:";
    const up = s.toUpperCase();
    for (let k = Math.min(M.length, 8); k >= 1; k--) {
      const cut = s.length - k;
      if (cut < 0 || !up.endsWith(M.slice(0, k))) continue;
      const lineStart = s.lastIndexOf("\n", cut - 1) + 1;
      if (s.slice(lineStart, cut).trim() === "") { s = s.slice(0, cut); break; }
    }
    return s.replace(/`{1,3}$/, "").trimEnd();
  },

  // Chốt một lượt gọi: parse toàn văn + ghi trace + dựng reply.
  // Trace giữ nguyên tên field cũ (traces.json so sánh giữa các lượt chạy),
  // chỉ THÊM: latency_first_token_ms, streamed, stream_error.
  _finalize({ raw, blockReason, usage, model, mode, page, question, text,
              history, disclosure, started, firstTokenAt, streamed, streamError }) {
    // Câu trả lời không trọn (đứt stream / chạm trần token) -> dọn đuôi
    // dở dang TRƯỚC khi parse, và mang cờ để UI nói thẳng với học viên.
    const truncated = !streamError && blockReason === "MAX_TOKENS";
    if (streamError || truncated) raw = this._trimDangling(raw);

    const parsed = this.parseAnswer(raw);
    const answer = parsed.text;

    const trace = {
      page: page.num, mode, question: question || "(trống)",
      model,
      latency_ms: Math.round(performance.now() - started),
      latency_first_token_ms:
        firstTokenAt == null ? null : Math.round(firstTokenAt - started),
      streamed: !!streamed,
      ...(streamError ? { stream_error: streamError } : {}),
      usage: usage || null,
      finish_reason: streamError ? "STREAM_INTERRUPTED" : (blockReason || null),
      sent: disclosure,
      answer,
      outsideDoc: parsed.outsideDoc || null,
      suggestions: parsed.suggestions,
      // Bộ lọc thứ tự đọc cho người chấm chiều H — không phải phán quyết
      grounding_probe: this.groundingProbe({
        answer: parsed.text, text, question, history, mode }),
    };
    console.log("[AI TRACE]", JSON.stringify(trace, null, 2));
    Explain.traces.push(trace);

    if (!answer && !parsed.outsideDoc) {
      // Rỗng + MAX_TOKENS = model tiêu hết trần vào thinking (dòng
      // 2.5-flash) — nói cho người dùng cách thoát thay vì in mã lỗi khó hiểu
      if (truncated) {
        return {
          text: "Model tiêu hết hạn mức độ dài trước khi viết được câu trả lời " +
                "(thường gặp ở model dòng flash có bật thinking). Bạn thử lại — " +
                "nếu lặp lại, bấm **API key** chọn model `flash-lite`.",
          mode, grounded: false, trace,
        };
      }
      return {
        text: `Model không trả về nội dung${blockReason ? ` (lý do: ${blockReason})` : ""}.`,
        mode, grounded: false, trace,
      };
    }
    return {
      text: answer,
      outsideDoc: parsed.outsideDoc,      // phần kiến thức chung, hiển thị tách biệt
      suggestions: parsed.suggestions,    // gợi ý câu hỏi tiếp
      citation: `Trang ${page.num}${mode === "scan" ? " (quét ảnh)" : ""}`,
      mode, trace,
      ...(streamError ? { streamInterrupted: true } : {}),
      ...(truncated ? { truncated: true } : {}),
    };
  },

  // Đường MỘT PHÁT (:generateContent) — runner dùng để số đo so được
  // giữa các lượt; app cũng rơi về đây khi stream chưa nối đã đứt.
  async callGemini(full) {
    const p = await this._prepare(full);
    if (p.err) return p.err;
    const { mode, page, question, text, history, historyOutline, disclosure } = full;

    const url = `${CONFIG.GEMINI_ENDPOINT}/${p.model}:generateContent?key=${p.key}`;
    const started = performance.now();
    let res;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: this._requestBody(p.parts),
      });
    } catch (err) {
      return { text: `Không gọi được model (mạng): ${err.message}`, mode, grounded: false };
    }
    if (!res.ok) return this._httpErrorReply(res, p.model, mode);

    // 200 nhưng body không phải JSON (proxy công ty / captive portal chen
    // vào) — không được để nổ exception xuyên run(): runner sẽ nhận throw
    // thay vì reply lỗi, và app rò typing indicator.
    let data;
    try {
      data = await res.json();
    } catch (err) {
      return {
        text: "Model trả về dữ liệu không đọc được (mạng công ty/proxy có thể " +
              "đang chen vào giữa). Bạn thử lại giúp mình nhé.",
        mode, grounded: false,
      };
    }
    const raw = data?.candidates?.[0]?.content?.parts?.map((x) => x.text).join("") || "";
    const blockReason = data?.promptFeedback?.blockReason
      || data?.candidates?.[0]?.finishReason;

    return this._finalize({
      raw, blockReason, usage: data?.usageMetadata, model: p.model,
      mode, page, question, text, history, disclosure,
      started, firstTokenAt: null, streamed: false,
    });
  },

  // Parser SSE mức thấp. Gemini alt=sse gửi mỗi event một dòng `data: {json}`,
  // không có [DONE]. Chunk JSON hỏng thì bỏ qua chứ không ném — mất 1 chunk
  // vẫn hơn chết cả stream.
  async _readSse(res, onEvent) {
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i).replace(/\r$/, "");
        buf = buf.slice(i + 1);
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload) continue;
        try { onEvent(JSON.parse(payload)); }
        catch (e) { console.warn("[SSE] chunk hỏng, bỏ qua:", payload.slice(0, 120)); }
      }
    }
    buf += dec.decode();
    const last = buf.trim();
    if (last.startsWith("data:")) {
      try { onEvent(JSON.parse(last.slice(5).trim())); } catch {}
    }
  },

  // Đường STREAM (:streamGenerateContent?alt=sse) — chữ ra tới đâu app vẽ
  // tới đó. onChunk(delta, accRaw) chỉ được gọi khi delta khác rỗng.
  //
  // Fallback 3 tầng theo "đã có chữ nào tới tay học viên chưa":
  //   - hỏng TRƯỚC byte đầu (mạng đứt / reader lỗi khi raw rỗng)
  //       -> gọi lại callGemini MỘT lần, học viên không biết có fallback
  //   - lỗi HTTP (403/404/429) -> KHÔNG retry: lỗi tất định, gọi lại chỉ
  //       đốt quota và phá vòng backoff 429 của runner
  //   - đứt GIỮA CHỪNG khi đã có chữ -> giữ phần đã nhận, KHÔNG retry
  //       (retry sẽ thay chữ học viên đang đọc), trả streamInterrupted
  async callGeminiStream(full, onChunk) {
    const p = await this._prepare(full);
    if (p.err) return p.err;
    const { mode, page, question, text, history, historyOutline, disclosure } = full;

    const url = `${CONFIG.GEMINI_ENDPOINT}/${p.model}:streamGenerateContent?alt=sse&key=${p.key}`;
    const started = performance.now();
    let res;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: this._requestBody(p.parts),
      });
    } catch (err) {
      return this.callGemini(full); // mạng đứt trước khi nối — thử đường thường
    }
    if (!res.ok) return this._httpErrorReply(res, p.model, mode);

    let raw = "", firstTokenAt = null, finish = null, usage = null,
        block = null, streamError = null;
    try {
      await this._readSse(res, (obj) => {
        block = obj?.promptFeedback?.blockReason || block;
        const cand = obj?.candidates?.[0];
        finish = cand?.finishReason || finish;
        usage = obj?.usageMetadata || usage;
        const delta = (cand?.content?.parts || []).map((x) => x.text || "").join("");
        if (!delta) return;
        if (firstTokenAt === null) firstTokenAt = performance.now();
        raw += delta;
        // Bug render của UI không được giết câu trả lời
        try { onChunk(delta, raw); }
        catch (e) { console.warn("[stream] onChunk lỗi UI, stream vẫn chạy tiếp:", e); }
      });
    } catch (err) {
      if (!raw) return this.callGemini(full); // chưa có chữ nào — thử đường thường
      streamError = err.message || String(err);
    }

    return this._finalize({
      raw, blockReason: block || finish, usage, model: p.model,
      mode, page, question, text, history, disclosure,
      started, firstTokenAt, streamed: true, streamError,
    });
  },

  // --- Tự kiểm grounding (chỉ ghi vào trace, KHÔNG hiện cho học viên) ---
  //
  // Ý tưởng: ở chế độ `text` ta biết chính xác đoạn text nào đã gửi đi. Đếm
  // xem những từ mang nghĩa trong câu trả lời có bao nhiêu % KHÔNG xuất hiện
  // trong text đó (cũng không có trong câu hỏi hay lịch sử).
  //
  // ĐÂY KHÔNG PHẢI PHÁN QUYẾT. Model diễn giải bằng lời của nó là đúng yêu
  // cầu, nên tỉ lệ cao không đồng nghĩa với bịa. Mục đích duy nhất: cho hai
  // người chấm chiều H một thứ tự đọc — case tỉ lệ cao đọc trước.
  //
  // Phần [NGOÀI TÀI LIỆU] bị loại khỏi phép đo, vì nó vốn dĩ nằm ngoài tài liệu.
  groundingProbe({ answer, text, question, history, mode }) {
    if (mode !== "text" || !text || !answer) return null;

    const STOP = new Set(("và là của có trong cho khi thì mà này đó các những một " +
      "được không với như để nên nếu vì sao nào bạn mình phần nội dung tài liệu " +
      "slide trang bên trên dưới sau trước cũng rất hơn nhất tức nghĩa vậy " +
      "chào nhé ạ hoặc hay còn về từ theo ra vào lại đang đã sẽ bị do bởi " +
      "chỉ chưa vẫn nữa thêm cùng giữa mỗi nhiều ít lớn nhỏ đây kia ấy").split(/\s+/));

    const words = (s) => (s || "").toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
    const haystack = new Set([
      ...words(text), ...words(question),
      ...(history || []).flatMap((h) => [...words(h.question), ...words(h.answer)]),
    ]);

    const content = words(answer).filter((w) => w.length >= 4 && !STOP.has(w));
    if (!content.length) return null;
    const uniq = new Set(content);
    const unsupported = [...new Set(content.filter((w) => !haystack.has(w)))];
    const ratio = Math.round(unsupported.length * 100 / uniq.size);

    // Chỉ gắn cờ khi câu trả lời ĐỦ DÀI mà vẫn lệch nhiều. Đo thử cho thấy
    // một câu từ chối trung thực ("phần tài liệu này không đề cập...") cũng
    // ra 100% vì chỉ có 2 từ nội dung — gắn cờ nó là báo động sai, và báo
    // động sai nhiều thì người chấm bỏ luôn cái cờ.
    const flag = uniq.size >= CONFIG.PROBE_MIN_WORDS && ratio >= CONFIG.PROBE_FLAG_RATIO;

    return {
      contentWords: content.length,
      uniqueContentWords: uniq.size,
      unsupportedRatio: ratio,
      unsupportedSample: unsupported.slice(0, 12),
      readFirst: flag,
      note: "Bộ lọc THỨ TỰ ĐỌC cho người chấm chiều H, không phải phán quyết. " +
            "Model diễn giải bằng lời của nó là đúng yêu cầu, nên tỉ lệ cao " +
            "KHÔNG đồng nghĩa với bịa. Câu ngắn (dưới " + CONFIG.PROBE_MIN_WORDS +
            " từ nội dung) không được gắn cờ vì dễ báo động sai.",
    };
  },

  // ---- Parse TẠM khi đang stream ----
  // Mục tiêu: dòng `GỢI Ý:` và nhãn `[NGOÀI TÀI LIỆU]` — kể cả khi model
  // mới gõ được nửa — KHÔNG BAO GIỜ hiện ra trong bong bóng rồi biến mất.
  // parseAnswer(raw) toàn văn ở cuối stream vẫn là nguồn chân lý duy nhất;
  // hàm này chỉ để vẽ. Trả { main, outside } (outside=null khi chưa gặp nhãn).
  progressiveParse(raw) {
    let s = (raw || "").replace(/^\s*```[a-z]*\s*$/gim, "");

    // Từ "GỢI Ý:" hoàn chỉnh trở đi giấu hẳn — finalize mới render thành chip
    const g = s.search(/^\s*GỢI Ý\s*:/im);
    if (g >= 0) s = s.slice(0, g);

    // Giữ lại phần đuôi CHƯA CHẮC (marker đang gõ dở), tối đa ~20 ký tự —
    // chunk sau tới là hiện, mắt thường không thấy giật.
    const holdTail = (t) => {
      // (a) ngoặc vuông chưa đóng gần cuối: che '[', '[NG', '[NGOÀI TÀI LI'…
      const br = t.lastIndexOf("[");
      if (br >= 0 && br >= t.length - 20 && !t.slice(br).includes("]")) {
        return t.slice(0, br);
      }
      // (b) "GỢI Ý:" đang gõ dở ở đầu dòng cuối. "Đầu dòng" phải tính cả
      // thụt lề: regex marker hoàn chỉnh chấp nhận `^\s*GỢI Ý`, nên nếu ở
      // đây đòi đứng SÁT sau \n thì "  GỢ" thụt lề sẽ hiện ra rồi bị cắt
      // khi hoàn chỉnh — đúng cái nháy chữ mà hàm này sinh ra để chống.
      const M = "GỢI Ý:";
      const up = t.toUpperCase();
      for (let k = Math.min(M.length, 8); k >= 1; k--) {
        const cut = t.length - k;
        if (cut < 0 || !up.endsWith(M.slice(0, k))) continue;
        const lineStart = t.lastIndexOf("\n", cut - 1) + 1;
        if (t.slice(lineStart, cut).trim() === "") return t.slice(0, cut);
      }
      // (c) backtick lơ lửng cuối chuỗi
      return t.replace(/`{1,3}$/, "");
    };

    const i = s.search(/\[\s*NGOÀI TÀI LIỆU\s*\]/i);
    if (i >= 0) {
      return {
        main: s.slice(0, i).trim(),
        outside: holdTail(s.slice(i).replace(/\[\s*NGOÀI TÀI LIỆU\s*\]/i, "")).trim(),
      };
    }
    return { main: holdTail(s).trimEnd(), outside: null };
  },

  // Tách câu trả lời thành 3 phần. Nhãn [NGOÀI TÀI LIỆU] là ranh giới cứng
  // giữa "cái này có trong slide" và "cái này là kiến thức chung" — trộn hai
  // loại vào nhau chính là lỗi lớp ① mà sản phẩm phải tránh.
  parseAnswer(raw) {
    let s = (raw || "").trim();

    // Model thỉnh thoảng bọc câu trả lời trong ``` (vì prompt có ví dụ dùng
    // fence) — lượt 03 case L13 in nguyên dấu ``` ra màn hình học viên,
    // dính CUỐI dòng chữ ("…cho bạn được. ```") chứ không phải dòng riêng.
    // Lột cả fence-dòng-riêng lẫn ``` lơ lửng bất kỳ đâu (chat không có
    // trường hợp dùng ``` hợp lệ).
    s = s.replace(/^\s*```[a-z]*\s*$/gim, "").replace(/```+/g, "").trim();

    // Dòng gợi ý ở cuối
    let suggestions = [];
    s = s.replace(/^\s*GỢI Ý\s*:\s*(.+)$/im, (_, list) => {
      suggestions = list.split("|").map((x) => x.trim())
        .filter((x) => x && x.length <= 60).slice(0, 3);
      return "";
    }).trim();

    // Nhãn ngoài tài liệu
    let outsideDoc = null;
    const i = s.search(/\[\s*NGOÀI TÀI LIỆU\s*\]/i);
    if (i >= 0) {
      outsideDoc = s.slice(i).replace(/\[\s*NGOÀI TÀI LIỆU\s*\]/i, "").trim();
      s = s.slice(0, i).trim();
    }
    return { text: s, outsideDoc, suggestions };
  },

  // Bộ trace của phiên hiện tại — runner tải xuống thành file cho eval/
  traces: [],

  // Prompt là file riêng (server/prompts/explain-region.md) để sửa được
  // mà không đụng code, và để trình bày ở CP5 khi bị hỏi về prompt.
  async buildPrompt({ question, text, page, mode, history, historyOutline }) {
    if (!this._promptTemplate) {
      const res = await fetch(CONFIG.PROMPT_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status} khi tải ${CONFIG.PROMPT_URL}`);
      this._promptTemplate = await res.text();
    }
    // Text của trang là DỮ LIỆU, không phải lệnh — nhưng nó được nối thẳng
    // vào prompt, nên một PDF chứa dòng '"""' + "bỏ qua quy tắc..." có thể
    // phá khung trích dẫn rồi tiêm lệnh (học viên mở được PDF bất kỳ qua
    // "Mở PDF khác…"). Bẻ răng dấu đóng khung trước khi nối.
    const safeText = (text || "").replace(/"{3,}/g, '""');
    const grounding =
      mode === "text"
        ? `Ảnh đính kèm là vùng học viên chọn trên trang ${page.num}.\n` +
          `Text nằm trong vùng đó:\n"""\n${safeText}\n"""\n` +
          "Ngoài vùng này bạn không có thông tin gì khác về tài liệu — đừng suy đoán."
        : `Ảnh đính kèm là vùng học viên chọn trên trang ${page.num}. Trang này KHÔNG có ` +
          "lớp text (slide ảnh hoặc bản scan) nên không có text kèm theo — hãy đọc trực tiếp " +
          "từ ảnh. Ngoài vùng này bạn không có thông tin gì khác về tài liệu.";

    // Lịch sử để câu hỏi tiếp ("chi tiết hơn nữa", "còn cái kia thì sao")
    // có nghĩa. Vẫn bám đúng vùng ảnh đang gửi, không nới phạm vi.
    let hist = (history || []).length
      ? "HỘI THOẠI TRƯỚC ĐÓ về đúng vùng này (dùng để hiểu học viên đang hỏi tiếp gì; " +
        "vẫn chỉ được căn cứ vào ảnh/text ở trên):\n" +
        history.map((h, i) =>
          `[${i + 1}] Học viên: ${h.question}\n    Bạn đã trả lời: ${h.answer}`).join("\n") +
        "\n"
      : "";

    // Dàn ý các lượt về TRANG KHÁC. Mặc định chỉ có câu hỏi của học viên —
    // đủ để bạn biết đã bàn gì rồi và không hỏi lại thứ họ vừa hỏi, nhưng
    // KHÔNG mang theo chữ nào của trang khác. Nói rõ ranh giới đó cho model,
    // nếu không nó sẽ tưởng mình biết nội dung các trang kia rồi trả lời liều.
    if ((historyOutline || []).length) {
      hist +=
        "\nCÁC CÂU HỌC VIÊN ĐÃ HỎI TRƯỚC ĐÓ Ở TRANG KHÁC (chỉ liệt kê để bạn nắm mạch " +
        "hội thoại — bạn KHÔNG được cấp nội dung các trang đó, nên đừng trả lời thay " +
        "cho chúng; cần thì mời học viên mở lại đúng trang):\n" +
        historyOutline.map((h) =>
          `- (trang ${h.page}) học viên hỏi: ${h.question}` +
          (h.answer ? `\n    Bạn đã trả lời: ${h.answer}` : "")).join("\n") +
        "\n";
    }

    return this._promptTemplate
      .replace("{{GROUNDING}}", grounding)
      .replace("{{HISTORY}}", hist)
      // Bấm chọn một vùng rồi gửi mà không gõ gì là chuyện thường (popover ghi
      // rõ "bỏ trống = giải thích"). Câu thay thế phải RA LỆNH RÕ, nếu không
      // model đọc "giải thích phần này giúp mình" như một lời mở đầu xã giao
      // và đáp lại bằng "Xin chào, mình có thể giúp gì cho bạn" — đã gặp thật.
      .replace("{{QUESTION}}",
        question || "Giải thích nội dung trong vùng ảnh được gửi kèm. " +
                    "Đi thẳng vào nội dung, không chào hỏi, không hỏi lại.");
  },
};

function stripDataUrl(dataUrl) {
  return dataUrl.replace(/^data:image\/\w+;base64,/, "");
}
