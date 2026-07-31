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

    // ② vùng quá nhỏ và ③ ngoài phạm vi đã được Explain.run chặn TRƯỚC khi
    // tới đây — guard là hành vi sản phẩm, phải áp cho cả AI thật, không
    // được nằm riêng trong nhánh mock (bài học từ case C04, lượt chạy 01).

    // PDF thật: chưa có zone khai sẵn -> trả lời mock nêu rõ chế độ đọc
    if (!page.zones) {
      return {
        text: REPLIES.realPdfPlaceholder(page.num, mode),
        citation: `Trang ${page.num}${mode === "scan" ? " (quét ảnh)" : ""}`,
        mode,
      };
    }

    // Slide mock: tìm zone chồng lấn nhiều nhất với vùng chọn
    const best = this.hitZone(region, page.zones);

    // ① Không có căn cứ: không trúng nội dung nào -> nói thật, không bịa
    if (!best) return { text: REPLIES.noContent, kind: "noContent", mode, grounded: false };

    // Mô phỏng nhánh "câu hỏi khái niệm tài liệu không nói" — nhãn tách bạch
    // giữa nội dung slide và kiến thức chung.
    const q = (question || "").toLowerCase();
    const outside = OUTSIDE_DOC_HINTS.find((h) => q.includes(h.k));

    return {
      text: best.answer,
      outsideDoc: outside ? outside.a : null,
      suggestions: best.suggestions || null,
      citation: best.citation,
      mode, zone: best,
    };
  },

  // --- Ôn tập cuối buổi, bản mock ---
  //
  // Bản thật để model viết; ở đây ghép máy móc từ đúng bộ ghi chú được đưa
  // vào. Cố ý KHÔNG viết sẵn một bản tóm tắt đẹp: mock phải phản ánh đúng
  // thứ đường thật có trong tay, nếu không thì demo trông ngon hơn sản phẩm.
  //
  // Chỗ này cũng là bằng chứng kiểm được: mock không hề biết tài liệu nào,
  // nó chỉ có `notes` và `asked` — đúng những gì rời khỏi máy.
  async review({ intent, notes, asked, coverage }) {
    await sleep(700 + Math.random() * 500);

    const readable = notes.filter((n) => n.source !== "image");
    const label = (n) => n.title || (n.gist || "").split(/[.;]/)[0].slice(0, 60) || `trang ${n.page}`;

    if (intent === "summary") {
      const ideas = readable.slice(0, 5)
        .map((n) => `- **${label(n)}** (trang ${n.page}) — ${(n.gist || "").slice(0, 110)}…`)
        .join("\n");

      const hot = this._hotPages(asked);
      const lines = [
        "*(CP2 — bản ghép mock, chưa gọi AI thật)*",
        "",
        "**Ý chính của buổi**",
        ideas || "- (chưa có trang nào đọc được text)",
        "",
        "**Mạch nối**",
        `Buổi này đi từ ${label(readable[0] || {})} tới ${label(readable[readable.length - 1] || {})}` +
          `, qua ${readable.length} trang bạn đã mở.`,
      ];
      if (hot.length) {
        lines.push("", "**Chỗ nên xem lại**",
          hot.map((p) => `- Trang ${p.page} — bạn đã hỏi ${p.n} lần ở đây`).join("\n"));
      }
      if (coverage && !coverage.full) {
        lines.push("", `⚠ Bạn mới xem ${coverage.seen}/${coverage.total} trang — ` +
          `bản ôn này chỉ phủ phần đó, chưa gồm trang ${(coverage.missing || []).join(", ")}.`);
      }
      return { text: lines.join("\n") };
    }

    // quiz: 5 câu bám câu học viên đã hỏi + 5 câu bám nội dung
    const quiz = [];
    const askedList = (asked || []).slice(-CONFIG.DECK_QUIZ_FROM_HISTORY);
    for (const a of askedList) {
      const n = notes.find((x) => x.page === a.page) || readable[0] || { page: a.page };
      quiz.push(this._mockItem(quiz.length + 1, 1,
        `Bạn từng hỏi "${a.question}" ở trang ${a.page}. Ý chính của phần đó là gì?`,
        label(n), n.page));
    }
    // Nhóm chia theo NGUỒN của câu, không theo vị trí. Chia theo vị trí
    // ("5 câu đầu là nhóm 1") thì buổi nào học viên mới hỏi 1 câu sẽ có 4
    // câu lấy từ nội dung bị dán nhãn "bám chỗ bạn đã hỏi" — chú thích nói
    // sai về chính dữ liệu của nó.
    for (const n of readable) {
      if (quiz.length >= CONFIG.DECK_QUIZ_TOTAL) break;
      quiz.push(this._mockItem(quiz.length + 1, 2,
        `Trang ${n.page} nói về điều gì?`, label(n), n.page));
    }
    return { quiz, text: "", mock: true };
  },

  _hotPages(asked) {
    const by = {};
    for (const a of asked || []) by[a.page] = (by[a.page] || 0) + 1;
    return Object.entries(by).map(([page, n]) => ({ page: Number(page), n }))
      .filter((x) => x.n >= 2).sort((a, b) => b.n - a.n).slice(0, 3);
  },

  _mockItem(n, group, question, right, page) {
    const wrong = ["Một khái niệm không xuất hiện trong buổi này",
                   "Cách cấu hình môi trường chạy", "Quy trình nộp bài của khoá"];
    return {
      n, group, question,
      options: [
        { key: "A", text: right },
        { key: "B", text: wrong[0] },
        { key: "C", text: wrong[1] },
        { key: "D", text: wrong[2] },
      ],
      answer: "A",
      why: "(mock) đáp án lấy thẳng từ ghi chú của trang, chưa qua model.",
      page,
    };
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
