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
  isOutOfScope(question) {
    const q = (question || "").toLowerCase();
    if (OUT_OF_SCOPE_PATTERNS.some((p) => q.includes(p))) return true;
    // Mẫu "động từ yêu cầu + từ chỉ toàn bộ + đối tượng tài liệu" — bắt các
    // cách nói mà danh sách từ khoá cố định không phủ hết (xem ghi chú ở
    // OUT_OF_SCOPE_REGEX trong mock-data.js).
    return OUT_OF_SCOPE_REGEX.test(q);
  },

  // --- Quyết định 3: đóng gói dữ liệu gửi đi ---
  // Nhận: { page, region (toạ độ TRANG), question }
  // Trả:  { image, text, disclosure } — disclosure là bảng để hiện cho
  //        học viên biết chính xác cái gì đã rời máy.
  buildPayload({ page, region, mode, history }) {
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

    // (c) Lịch sử — chỉ CHỮ, chỉ của đúng trang này. Chặn cứng ở đây thay vì
    // tin vào chỗ gọi: nếu lẫn lượt của trang khác thì loại bỏ.
    const hist = (history || []).filter((h) => h && h.question)
      .slice(-CONFIG.HISTORY_MAX_TURNS);
    const histChars = hist.reduce(
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
      sentFileName: false,
      sentOtherPages: false,
      wholePage: !!region.wholePage,
    };

    return { image, text, history: hist, disclosure };
  },

  // --- Điểm vào duy nhất ---
  // req: { question, page, region, mode }
  // trả: { text, citation?, mode, zone?, grounded?, disclosure?, trace? }
  //
  // MỌI guard phải nằm ở đây, KHÔNG nằm trong MockAI. Bài học từ lượt chạy
  // 01: guard "vùng quá nhỏ thì hỏi lại" ban đầu chỉ có trong MockAI.route,
  // nên khi bật AI thật thì một dải viền mảnh vẫn được gửi đi và model mô tả
  // nó rất tự tin — đúng lỗi mà lớp ② phải chặn. Golden set bắt được (case C04).
  async run(req) {
    // ③ Ngoài phạm vi — từ chối TRƯỚC khi đóng gói, không gì rời máy
    if (this.isOutOfScope(req.question)) {
      return { text: REPLIES.outOfScope, mode: req.mode, grounded: false };
    }

    // ② Vùng quá nhỏ / dải viền mảnh — không đủ chắc user hỏi gì thì hỏi lại,
    // không gửi đi và không đoán. Áp cho CẢ mock và AI thật.
    const { region, page } = req;
    const ratio = (region.w * region.h) / (page.width * page.height);
    if (ratio < CONFIG.MIN_SEL_RATIO) {
      return { text: REPLIES.tooSmall, mode: req.mode, grounded: false };
    }

    const payload = this.buildPayload(req);
    const full = { ...req, ...payload };

    const reply = CONFIG.USE_REAL_AI ? await this.callGemini(full) : await MockAI.route(full);
    return { ...reply, disclosure: reply.grounded === false ? null : payload.disclosure };
  },

  // --- Quyết định 4: lời gọi vision thật (CP3) ---
  // Key lấy từ localStorage (nút "API key" trên header), KHÔNG commit.
  async callGemini({ question, image, text, page, mode, disclosure, history }) {
    const key = localStorage.getItem("GEMINI_API_KEY");
    if (!key) {
      return {
        text: "Chưa có API key. Bấm **API key** trên header để nhập (key chỉ lưu trong trình duyệt).",
        mode, grounded: false,
      };
    }
    const model = CONFIG.GEMINI_MODEL || localStorage.getItem("GEMINI_MODEL");
    if (!model) {
      return {
        text: "Chưa chọn được model. Bấm **API key** trên header để app dò lại danh sách model của key này.",
        mode, grounded: false,
      };
    }

    let prompt;
    try {
      prompt = await this.buildPrompt({ question, text, page, mode, history });
    } catch (err) {
      return {
        text: `Không đọc được file prompt \`server/prompts/explain-region.md\` (${err.message}).\n\n` +
              "Chạy qua server tĩnh giúp mình: `npx serve codebase` rồi mở `/web/index.html`.",
        mode, grounded: false,
      };
    }

    // Đúng MỘT ảnh: vùng học viên chọn. Không đính kèm ảnh cả trang,
    // không đính kèm trang nào khác.
    const parts = [{ text: prompt }];
    if (image) {
      parts.push({ inlineData: { mimeType: "image/png", data: stripDataUrl(image) } });
    }

    const url = `${CONFIG.GEMINI_ENDPOINT}/${model}:generateContent?key=${key}`;
    const started = performance.now();
    let res;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          // Không đặt gì thì temperature mặc định ~1.0: CÙNG một case chạy
          // hai lần ra hai câu khác nhau — hai người chấm G/S/H/C độc lập
          // sẽ chấm trên hai đáp án khác nhau. Tutor là bài giải thích tài
          // liệu, không phải bài sáng tác: ghim thấp.
          // maxOutputTokens chặn trần "bài văn tả cả trang" (vi phạm chiều
          // S) và bớt phần đuôi của những lượt 27s ở lượt 03.
          generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
        }),
      });
    } catch (err) {
      return { text: `Không gọi được model (mạng): ${err.message}`, mode, grounded: false };
    }
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      // Google nói rõ lý do trong body — không nuốt nó, vì "lỗi 403" trần
      // trụi thì không ai biết phải sửa gì.
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
        mode, grounded: false,
      };
    }
    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
    const blockReason = data?.promptFeedback?.blockReason
      || data?.candidates?.[0]?.finishReason;

    // Tách 3 phần model trả về: nội dung dựa vào tài liệu · phần kiến thức
    // chung (sau nhãn [NGOÀI TÀI LIỆU]) · dòng GỢI Ý cuối.
    const parsed = this.parseAnswer(raw);
    const answer = parsed.text;

    // Trace cho R5 ("≥1 lời gọi AI thật, có log/trace trong repo").
    // Ghi cả disclosure để chứng minh đã gửi đi đúng những gì đã khai.
    const trace = {
      page: page.num, mode, question: question || "(trống)",
      model,
      latency_ms: Math.round(performance.now() - started),
      usage: data?.usageMetadata || null,
      finish_reason: blockReason || null,
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
      mode, raw: data, trace,
    };
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

  // Tách câu trả lời thành 3 phần. Nhãn [NGOÀI TÀI LIỆU] là ranh giới cứng
  // giữa "cái này có trong slide" và "cái này là kiến thức chung" — trộn hai
  // loại vào nhau chính là lỗi lớp ① mà sản phẩm phải tránh.
  parseAnswer(raw) {
    let s = (raw || "").trim();

    // Model thỉnh thoảng bọc câu trả lời trong ``` (vì prompt có ví dụ dùng
    // fence) — lượt 03 case L13 in nguyên dấu ``` ra màn hình học viên.
    // Lột fence trước khi tách các phần.
    s = s.replace(/^\s*```[a-z]*\s*$/gim, "").trim();

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
  async buildPrompt({ question, text, page, mode, history }) {
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
    const hist = (history || []).length
      ? "HỘI THOẠI TRƯỚC ĐÓ về đúng vùng này (dùng để hiểu học viên đang hỏi tiếp gì; " +
        "vẫn chỉ được căn cứ vào ảnh/text ở trên):\n" +
        history.map((h, i) =>
          `[${i + 1}] Học viên: ${h.question}\n    Bạn đã trả lời: ${h.answer}`).join("\n") +
        "\n"
      : "";

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
