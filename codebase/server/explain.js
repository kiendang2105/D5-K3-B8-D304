// ============================================================
// QUYẾT ĐỊNH AI TRUNG TÂM của lát cắt.
//
// Ba quyết định nằm ở đây, theo thứ tự:
//   1. readMode()     — đọc trang bằng TEXT hay bằng QUÉT ẢNH?
//   2. isOutOfScope() — có được phép trả lời không? (guardrail rẻ, chạy trước)
//   3. callGemini()   — gọi model vision với ảnh vùng khoanh (+ ảnh trang)
//
// Mức prototype hiện tại là Sketch/Mock nên file này chạy thẳng ở client
// (không dựng backend riêng). Khi tách backend thật, chỉ cần đem nguyên
// hàm callGemini() sang server và đổi fetch trong explain() thành gọi API
// nội bộ — giao diện Explain.run() không đổi.
//
// CONFIG.USE_REAL_AI = false -> đi MockAI (CP2)
// CONFIG.USE_REAL_AI = true  -> gọi Gemini vision thật (CP3)
// ============================================================

const Explain = {
  _promptTemplate: null,

  // --- Quyết định 1: đọc trang bằng cách nào ---
  // "text" = trang có lớp text -> grounding bằng text (nhanh, rẻ)
  // "scan" = trang không có lớp text (slide ảnh/scan) -> cho model NHÌN ảnh
  readMode(page) {
    if (!page) return "scan";
    return page.textLen >= CONFIG.MIN_TEXT_CHARS ? "text" : "scan";
  },

  // --- Quyết định 2: guardrail ngoài phạm vi ---
  // Chạy TRƯỚC khi render + gửi ảnh. Ảnh trọn trang tốn khá nhiều token,
  // không đáng gửi đi chỉ để nhận về một câu từ chối.
  isOutOfScope(question) {
    const q = (question || "").toLowerCase();
    return OUT_OF_SCOPE_PATTERNS.some((p) => q.includes(p));
  },

  // --- Điểm vào duy nhất ---
  // req: { question, cropImage, pageImage, page, region, mode }
  // trả: { text, citation?, mode, zone?, grounded?, raw? }
  async run(req) {
    if (this.isOutOfScope(req.question)) {
      return { text: MOCK_REPLIES.outOfScope, mode: req.mode, grounded: false };
    }
    return CONFIG.USE_REAL_AI ? this.callGemini(req) : MockAI.route(req);
  },

  // --- Quyết định 3: lời gọi vision thật (CP3) ---
  // Key lấy từ localStorage (nút "API key" trên header), KHÔNG commit.
  async callGemini({ question, cropImage, pageImage, page, mode }) {
    const key = localStorage.getItem("GEMINI_API_KEY");
    if (!key) {
      return {
        text: "Chưa có API key. Bấm **API key** trên header để nhập (key chỉ lưu trong trình duyệt).",
        mode, grounded: false,
      };
    }

    let prompt;
    try {
      prompt = await this.buildPrompt({ question, page, mode });
    } catch (err) {
      return {
        text: `Không đọc được file prompt \`server/prompts/explain-region.md\` (${err.message}).\n\n` +
              "Chạy qua server tĩnh giúp mình: \`npx serve codebase\` rồi mở \`/web/index.html\`.",
        mode, grounded: false,
      };
    }

    const parts = [{ text: prompt }];
    // Chế độ quét: gửi ảnh TRỌN TRANG để model có ngữ cảnh xung quanh,
    // kèm ảnh vùng khoanh để model biết user đang hỏi phần nào.
    if (mode === "scan" && pageImage) {
      parts.push({ inlineData: { mimeType: "image/png", data: stripDataUrl(pageImage) } });
    }
    if (cropImage) {
      parts.push({ inlineData: { mimeType: "image/png", data: stripDataUrl(cropImage) } });
    }

    const url = `${CONFIG.GEMINI_ENDPOINT}/${CONFIG.GEMINI_MODEL}:generateContent?key=${key}`;
    const started = performance.now();
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts }] }),
    });
    if (!res.ok) {
      return { text: `Gọi model lỗi (${res.status}). Bạn thử lại giúp mình nhé.`, mode, grounded: false };
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";

    // Trace cho R5 ("≥1 lời gọi AI thật, có log/trace trong repo").
    // In ra console để copy vào codebase/server/traces/ — xem README ở đó.
    const trace = {
      page: page.num, mode, question: question || "(trống)",
      model: CONFIG.GEMINI_MODEL,
      latency_ms: Math.round(performance.now() - started),
      usage: data?.usageMetadata || null,
      prompt_chars: prompt.length,
      images_sent: parts.length - 1,
      answer: text,
    };
    console.log("[AI TRACE]", JSON.stringify(trace, null, 2));

    return {
      text: text || "Model không trả về nội dung.",
      citation: `Trang ${page.num}${mode === "scan" ? " (quét ảnh)" : ""}`,
      mode,
      raw: data,
      trace,
    };
  },

  // Prompt là file riêng (server/prompts/explain-region.md) để sửa được
  // mà không đụng code, và để trình bày ở CP5 khi bị hỏi về prompt.
  async buildPrompt({ question, page, mode }) {
    if (!this._promptTemplate) {
      const res = await fetch("../server/prompts/explain-region.md");
      if (!res.ok) throw new Error("HTTP " + res.status);
      this._promptTemplate = await res.text();
    }
    const grounding =
      mode === "text"
        ? `Nội dung text của trang ${page.num}:\n"""\n${page.text.slice(0, 4000)}\n"""`
        : `Trang ${page.num} của tài liệu KHÔNG có lớp text (slide ảnh hoặc bản scan). ` +
          "Ảnh đính kèm gồm: (1) ảnh trọn trang, (2) ảnh vùng học viên khoanh. " +
          "Hãy đọc trực tiếp từ ảnh.";

    return this._promptTemplate
      .replace("{{GROUNDING}}", grounding)
      .replace("{{QUESTION}}", question || "Giải thích phần này giúp mình.");
  },
};

function stripDataUrl(dataUrl) {
  return dataUrl.replace(/^data:image\/\w+;base64,/, "");
}
