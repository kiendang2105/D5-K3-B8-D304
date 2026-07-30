// ============================================================
// MOCK AI — CP2. Mô phỏng đúng các nhánh quyết định của bản thật.
//
// Được gọi từ server/explain.js khi CONFIG.USE_REAL_AI = false.
// Bật AI thật (CP3) thì file này không còn chạy nhưng vẫn giữ lại
// để đối chiếu hành vi mong muốn với hành vi model thực tế.
// ============================================================

const MockAI = {
  async route({ question, region, page, mode }) {
    await sleep(500 + Math.random() * 400); // giả lập độ trễ model

    // `grounded: false` = chưa thực sự đọc nội dung trang (từ chối / hỏi lại)
    // -> ExplainPanel KHÔNG hiện badge chế độ đọc và bằng chứng quét trang,
    // tránh khoe "đã quét trang 24" trong khi thực chất chỉ từ chối.
    // (③ ngoài phạm vi đã bị chặn ở Explain.run trước khi tới đây)

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
