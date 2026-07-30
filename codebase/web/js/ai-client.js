// ============================================================
// RANH GIỚI AI — CP3 chỉ cần sửa DUY NHẤT file này.
//
// AiClient.explain() nhận đúng những gì một model vision cần:
//   { question, cropImage, pageImage, page, region, mode }
// và trả về { text, citation, mode, zone }.
//
// CONFIG.USE_REAL_AI = false  -> đi nhánh mock (CP2)
// CONFIG.USE_REAL_AI = true   -> gọi Gemini vision thật (CP3)
//
// Quyết định chế độ đọc (readMode) nằm ở đây vì nó là một QUYẾT ĐỊNH
// AI: đọc được text thì dùng text, không đọc được thì nhìn ảnh trang.
// ============================================================

const AiClient = {
  // Quyết định đọc trang bằng cách nào.
  // "text" = PDF có lớp text -> grounding bằng text (nhanh, rẻ)
  // "scan" = PDF không có lớp text -> render trang thành ảnh cho model NHÌN
  readMode(page) {
    if (!page) return "scan";
    return page.textLen >= CONFIG.MIN_TEXT_CHARS ? "text" : "scan";
  },

  // Guardrail rẻ, chạy TRƯỚC khi render + gửi ảnh cho model.
  // Một ảnh trọn trang tốn khá nhiều token — không đáng gửi đi chỉ để
  // nhận về một câu từ chối.
  isOutOfScope(question) {
    const q = (question || "").toLowerCase();
    return OUT_OF_SCOPE_PATTERNS.some((p) => q.includes(p));
  },

  async explain(req) {
    if (this.isOutOfScope(req.question)) {
      return { text: MOCK_REPLIES.outOfScope, mode: req.mode, grounded: false };
    }
    return CONFIG.USE_REAL_AI ? this.callGemini(req) : MockAI.route(req);
  },

  // ---------------------------------------------------------
  // CP3 — lời gọi thật. Chưa bật ở CP2.
  // Key lấy từ localStorage (nút "API key" trên header), KHÔNG commit.
  // ---------------------------------------------------------
  async callGemini({ question, cropImage, pageImage, page, mode }) {
    const key = localStorage.getItem("GEMINI_API_KEY");
    if (!key) {
      return { text: "Chưa có API key. Bấm **API key** trên header để nhập (key chỉ lưu trong trình duyệt).", mode };
    }

    const parts = [{ text: this.buildPrompt({ question, page, mode }) }];

    // Chế độ quét: gửi ảnh TRỌN TRANG để model đọc được cả ngữ cảnh xung quanh,
    // kèm ảnh vùng khoanh để model biết user đang hỏi phần nào.
    if (mode === "scan" && pageImage) {
      parts.push({ inlineData: { mimeType: "image/png", data: stripDataUrl(pageImage) } });
    }
    if (cropImage) {
      parts.push({ inlineData: { mimeType: "image/png", data: stripDataUrl(cropImage) } });
    }

    const url = `${CONFIG.GEMINI_ENDPOINT}/${CONFIG.GEMINI_MODEL}:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts }] }),
    });
    if (!res.ok) {
      return { text: `Gọi model lỗi (${res.status}). Bạn thử lại giúp mình nhé.`, mode };
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
    return {
      text: text || "Model không trả về nội dung.",
      citation: `Trang ${page.num}${mode === "scan" ? " (quét ảnh)" : ""}`,
      mode,
      raw: data, // giữ lại để ghi trace vào eval/
    };
  },

  buildPrompt({ question, page, mode }) {
    const asked = question || "Giải thích phần này giúp mình.";
    const grounding =
      mode === "text"
        ? `Nội dung text của trang ${page.num}:\n"""\n${page.text.slice(0, 4000)}\n"""`
        : `Trang ${page.num} của tài liệu KHÔNG có lớp text (slide ảnh hoặc bản scan). ` +
          `Ảnh đính kèm gồm: (1) ảnh trọn trang, (2) ảnh vùng học viên khoanh. ` +
          `Hãy đọc trực tiếp từ ảnh.`;

    return [
      "Bạn là AI Tutor của khoá AI Thực Chiến, giải thích slide bài giảng cho học viên Việt Nam.",
      "",
      "QUY TẮC:",
      "- Chỉ giải thích ĐÚNG phần học viên khoanh, không mô tả cả trang.",
      "- Mọi thông tin phải trace được về ảnh/text được cung cấp. Không suy diễn ngoài tài liệu.",
      "- Không đọc rõ chỗ nào thì nói thẳng là không đọc rõ, KHÔNG đoán.",
      "- Không làm bài tập hộ, không đưa đáp án, không trả lời câu hỏi về deadline/điểm số.",
      "- Trả lời tiếng Việt, tối đa 6 câu, giọng thân thiện.",
      "",
      grounding,
      "",
      "CÂU HỎI CỦA HỌC VIÊN: " + asked,
    ].join("\n");
  },
};

function stripDataUrl(dataUrl) {
  return dataUrl.replace(/^data:image\/\w+;base64,/, "");
}

// ============================================================
// MOCK AI — CP2. Mô phỏng đúng các nhánh quyết định thật.
// ============================================================

const MockAI = {
  async route({ question, region, page, mode }) {
    await sleep(500 + Math.random() * 400); // giả lập độ trễ model

    // `grounded: false` = chưa thực sự đọc nội dung trang (từ chối / hỏi lại)
    // -> app KHÔNG hiện badge chế độ đọc và bằng chứng quét trang, tránh
    // khoe "đã quét trang 24" trong khi thực chất chỉ từ chối.
    // (③ ngoài phạm vi đã bị chặn ở AiClient.explain trước khi tới đây)

    // ② Mơ hồ: vùng chọn quá nhỏ, không chắc user hỏi gì
    if (region && region.w * region.h < CONFIG.MIN_SEL_AREA) {
      return { text: MOCK_REPLIES.tooSmall, mode, grounded: false };
    }

    // PDF thật: chưa có zone khai sẵn -> trả lời mock nêu rõ chế độ đọc
    if (!page.zones) {
      return {
        text: MOCK_REPLIES.realPdfPlaceholder(page.num, mode),
        citation: `Trang ${page.num}${mode === "scan" ? " (quét ảnh)" : ""}`,
        mode,
      };
    }

    // Slide mock: tìm zone chồng lấn nhiều nhất với vùng chọn
    const best = this.hitZone(region, page.zones);

    // ① Không có căn cứ: không trúng nội dung nào -> nói thật, không bịa
    if (!best) return { text: MOCK_REPLIES.noContent, mode, grounded: false };

    return { text: best.answer, citation: best.citation, mode, zone: best };
  },

  hitZone(sel, zones) {
    let best = null, bestRatio = 0;
    for (const z of zones) {
      const [zx, zy, zw, zh] = z.rect;
      const ix = Math.max(0, Math.min(sel.x + sel.w, zx + zw) - Math.max(sel.x, zx));
      const iy = Math.max(0, Math.min(sel.y + sel.h, zy + zh) - Math.max(sel.y, zy));
      const ratio = (ix * iy) / (sel.w * sel.h);
      if (ratio > bestRatio) { bestRatio = ratio; best = z; }
    }
    return bestRatio >= CONFIG.ZONE_HIT_RATIO ? best : null;
  },
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
