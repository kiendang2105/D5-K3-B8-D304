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
    return OUT_OF_SCOPE_PATTERNS.some((p) => q.includes(p));
  },

  // --- Quyết định 3: đóng gói dữ liệu gửi đi ---
  // Nhận: { page, region (toạ độ TRANG), question }
  // Trả:  { image, text, disclosure } — disclosure là bảng để hiện cho
  //        học viên biết chính xác cái gì đã rời máy.
  buildPayload({ page, region, mode }) {
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

    // (c) Bảng công khai — học viên tự kiểm cái gì đã gửi đi
    const disclosure = {
      pages: 1, // trần cứng CONFIG.MAX_PAGES_PER_REQUEST
      pageNum: page.num,
      imageW: Math.round(region.w),
      imageH: Math.round(region.h),
      regionPctOfPage: Math.round((region.w * region.h * 100) / (page.width * page.height)),
      textChars: text.length,
      textItems: itemCount,
      sentFileName: false,
      sentOtherPages: false,
      wholePage: !!region.wholePage,
    };

    return { image, text, disclosure };
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
  async callGemini({ question, image, text, page, mode, disclosure }) {
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
      prompt = await this.buildPrompt({ question, text, page, mode });
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
        body: JSON.stringify({ contents: [{ role: "user", parts }] }),
      });
    } catch (err) {
      return { text: `Không gọi được model (mạng): ${err.message}`, mode, grounded: false };
    }
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const hint = res.status === 404
        ? ` — model \`${model}\` không dùng được với key này. Bấm **API key** để dò lại danh sách.`
        : res.status === 429 ? " — vượt quota free tier, chờ một lát rồi thử lại." : "";
      console.warn("[AI ERROR]", res.status, body.slice(0, 500));
      return { text: `Gọi model lỗi (${res.status})${hint}`, mode, grounded: false };
    }
    const data = await res.json();
    const answer = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
    const blockReason = data?.promptFeedback?.blockReason
      || data?.candidates?.[0]?.finishReason;

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
    };
    console.log("[AI TRACE]", JSON.stringify(trace, null, 2));
    Explain.traces.push(trace);

    if (!answer) {
      return {
        text: `Model không trả về nội dung${blockReason ? ` (lý do: ${blockReason})` : ""}.`,
        mode, grounded: false, trace,
      };
    }
    return {
      text: answer,
      citation: `Trang ${page.num}${mode === "scan" ? " (quét ảnh)" : ""}`,
      mode, raw: data, trace,
    };
  },

  // Bộ trace của phiên hiện tại — runner tải xuống thành file cho eval/
  traces: [],

  // Prompt là file riêng (server/prompts/explain-region.md) để sửa được
  // mà không đụng code, và để trình bày ở CP5 khi bị hỏi về prompt.
  async buildPrompt({ question, text, page, mode }) {
    if (!this._promptTemplate) {
      const res = await fetch(CONFIG.PROMPT_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status} khi tải ${CONFIG.PROMPT_URL}`);
      this._promptTemplate = await res.text();
    }
    const grounding =
      mode === "text"
        ? `Ảnh đính kèm là vùng học viên chọn trên trang ${page.num}.\n` +
          `Text nằm trong vùng đó:\n"""\n${text}\n"""\n` +
          "Ngoài vùng này bạn không có thông tin gì khác về tài liệu — đừng suy đoán."
        : `Ảnh đính kèm là vùng học viên chọn trên trang ${page.num}. Trang này KHÔNG có ` +
          "lớp text (slide ảnh hoặc bản scan) nên không có text kèm theo — hãy đọc trực tiếp " +
          "từ ảnh. Ngoài vùng này bạn không có thông tin gì khác về tài liệu.";

    return this._promptTemplate
      .replace("{{GROUNDING}}", grounding)
      .replace("{{QUESTION}}", question || "Giải thích phần này giúp mình.");
  },
};

function stripDataUrl(dataUrl) {
  return dataUrl.replace(/^data:image\/\w+;base64,/, "");
}
