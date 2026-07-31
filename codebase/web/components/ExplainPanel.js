// ============================================================
// CHAT PANEL — render hội thoại.
// Ngoài bong bóng chat còn hiển thị các "bằng chứng" để học viên
// tự kiểm tra AI (HAX G11) và sửa khi AI hiểu sai (G9):
//   - badge chế độ đọc: 📄 đọc text  /  👁 quét ảnh trang
//   - thumbnail TRANG ĐÃ QUÉT + nút "Không phải trang này?"
//   - chip trích dẫn trang
// ============================================================

const ExplainPanel = {
  body: null,
  onFixPage: null, // callback(pageNum) khi user báo quét nhầm trang

  init() {
    this.body = document.getElementById("chat-body");
  },

  // Đổi tài liệu thì xoá sạch hội thoại và dựng lại trạng thái mở đầu.
  // Trước đây mỗi lần mở một PDF lại NỐI THÊM một dòng thông báo, đổi qua
  // lại bốn lần là bốn dòng chồng nhau; mà hội thoại về tài liệu cũ cũng
  // chẳng còn nghĩa gì khi đã sang tài liệu khác.
  // Trạng thái mở đầu = tutor chào một câu, kèm vài câu hỏi bấm được.
  //
  // Bản trước là một khối thông tin khô: tên file, số trang, ba gạch đầu dòng
  // hướng dẫn — mà hướng dẫn đó đã có nguyên một dòng ngay trên slide rồi.
  // Một màn hình nói cùng một việc hai lần.
  //
  // Lời chào này là của GIAO DIỆN, không phải model sinh ra: không tốn lời gọi
  // AI, không gửi gì ra ngoài, và hiện ra tức thì. Prompt vẫn cấm model chào
  // trong câu trả lời — bấm vào sơ đồ mà bị chào lại là phiền.
  resetFor(source, page, suggestions, onPick) {
    this.body.innerHTML = "";

    const div = el("div", "msg bot greet");
    const bubble = el("div", "bubble");
    bubble.innerHTML = mdBold(
      "Xin chào! Mình là **VLearn Tutor** 👋\n" +
      "Mình có thể giúp gì cho bạn về slide này?");
    div.appendChild(bubble);

    if (source) {
      const meta = el("div", "greet-doc");
      meta.textContent = `${source.name} · ${source.pageCount} trang` +
        (page ? ` · đang ở trang ${page.num}` : "");
      div.appendChild(meta);
    }

    if (suggestions && suggestions.length) {
      this.addSuggestions(div, suggestions, onPick);
    }

    this.body.appendChild(div);
    this.scroll();
  },

  // Hội thoại bắt đầu thì bỏ chip gợi ý mở đầu, nhưng GIỮ lời chào lại —
  // như mọi khung chat, câu chào là tin nhắn đầu tiên chứ không phải một
  // trạng thái rỗng bị thay thế. Chip thì đã dùng xong, để lại là gợi ý cũ
  // nằm lẫn giữa dòng hội thoại.
  clearEmpty() {
    const old = this.body.querySelector(".empty-chat");
    if (old) old.remove();
    const chips = this.body.querySelector(".msg.bot.greet .suggestions");
    if (chips) chips.remove();
  },

  scroll() {
    this.body.scrollTop = this.body.scrollHeight;
  },

  // ---- tin nhắn của học viên ----
  // `excerpt` là đoạn text nằm trong vùng đã chọn. Tutor thật của VLearn gửi
  // kèm đúng thứ này: 99,3% câu hỏi trong chatlog mang tiền tố
  // `(Trang N, đoạn được chọn: "...")`. Hiện lại nó để học viên thấy chính xác
  // phần nào đang được hỏi, thay vì chỉ thấy một ảnh cắt.
  // Vẽ lại hội thoại đã lưu (ConversationStore) khi mở lại tài liệu.
  // Bắt buộc phải có: agent nhớ mà khung chat trống thì học viên thấy nó
  // nhắc tới thứ "chưa từng nói", tưởng máy bịa. Nhớ thì phải cho thấy.
  replay(turns) {
    if (!turns || !turns.length) return;

    const sep = el("div", "sys-note");
    sep.textContent = `⤴ ${turns.length} lượt đã lưu trước đó`;
    this.body.appendChild(sep);

    for (const t of turns) {
      const u = el("div", "msg user");
      if (t.page != null) {
        const tag = el("div", "user-page");
        tag.textContent = `trang ${t.page}`;
        u.appendChild(tag);
      }
      const ub = el("div", "bubble");
      ub.textContent = t.question;
      u.appendChild(ub);
      this.body.appendChild(u);

      const b = el("div", "msg bot");
      const bb = el("div", "bubble");
      bb.innerHTML = mdBold(t.answer || "");
      b.appendChild(bb);
      // Ảnh vùng không được lưu (chỉ lưu chữ) — nói rõ thay vì để trống
      // khiến người xem tưởng lượt đó không có ảnh nào được gửi.
      this.body.appendChild(b);
    }

    const now = el("div", "sys-note");
    now.textContent = "— tiếp tục —";
    this.body.appendChild(now);
    this.scroll();
  },

  addUser({ cropImage, question, excerpt, pageNum }) {
    this.clearEmpty();
    const div = el("div", "msg user");

    if (cropImage) {
      const img = el("img", "crop");
      img.src = cropImage;
      div.appendChild(img);
    }

    if (excerpt) {
      const q = el("div", "excerpt");
      const cap = el("span", "cap");
      cap.textContent = pageNum ? `Trang ${pageNum} · đoạn đã chọn` : "Đoạn đã chọn";
      q.appendChild(cap);
      const t = el("span", "txt");
      t.textContent = excerpt.length > 160 ? excerpt.slice(0, 160) + "…" : excerpt;
      q.appendChild(t);
      div.appendChild(q);
    }

    const bubble = el("div", "bubble");
    bubble.textContent = question || "Giải thích vùng này giúp mình";
    div.appendChild(bubble);
    this.body.appendChild(div);
    this.scroll();
  },

  // Chấm gõ trong lúc chờ model. Con trỏ nhấp nháy trước đây trông như
  // ô nhập bị treo chứ không như ai đó đang soạn câu trả lời.
  addTyping() {
    const div = el("div", "msg bot typing");
    const b = el("div", "bubble");
    b.innerHTML = '<span class="dots"><i></i><i></i><i></i></span>';
    div.appendChild(b);
    this.body.appendChild(div);
    this.scroll();
    return div;
  },

  // ---- tin nhắn của tutor ----
  addBot() {
    const div = el("div", "msg bot");
    const bubble = el("div", "bubble");
    div.appendChild(bubble);
    this.body.appendChild(div);
    this.scroll();
    return { div, bubble };
  },

  // Dòng trạng thái khi hệ thống đang quét trang (không phải câu trả lời)
  addSystemNote(text) {
    this.clearEmpty();
    const div = el("div", "sys-note");
    div.innerHTML = mdBold(text);
    this.body.appendChild(div);
    this.scroll();
    return div;
  },

  async stream(bubble, text) {
    const words = text.split(/(\s+)/);
    let acc = "";
    for (const w of words) {
      acc += w;
      bubble.innerHTML = mdBold(acc) + '<span class="cursor-blink">▌</span>';
      this.scroll();
      if (w.trim()) await sleep(18);
    }
    bubble.innerHTML = mdBold(acc);
  },

  // ---- Stream THẬT từ model (khác stream() ở trên: chữ đến đâu vẽ đến đó) ----
  //
  // live = { div, bubble, outsideBody } — App tạo từ addBot() ở CHUNK ĐẦU,
  // outsideBody khởi tạo null. progressiveParse giấu marker đang gõ dở nên
  // không bao giờ thấy "GỢI Ý:" hay "[NGOÀI TÀI LI" nhấp nháy rồi biến mất.
  renderStream(live, raw) {
    const CUR = '<span class="cursor-blink">▌</span>';
    const p = Explain.progressiveParse(raw);
    live.bubble.innerHTML = mdBold(p.main) + (p.outside === null ? CUR : "");
    if (p.outside !== null) {
      // Nhãn [NGOÀI TÀI LIỆU] xuất hiện giữa stream: tạo hộp MỘT lần,
      // chữ chảy tiếp vào đó, con trỏ ▌ chuyển theo phần đang mọc
      if (!live.outsideBody) live.outsideBody = this.addOutsideDoc(live.div, "");
      live.outsideBody.innerHTML = mdBold(p.outside) + CUR;
    }
    this.scroll();
  },

  // Vẽ lại lần cuối theo parseAnswer toàn văn — nguồn chân lý duy nhất.
  // progressiveParse xấp xỉ parseAnswer nên lần vẽ này hầu như trùng khớp.
  endStream(live, reply) {
    live.bubble.innerHTML = mdBold(reply.text || "");
    if (!reply.text) live.bubble.remove();
    if (reply.outsideDoc) {
      if (!live.outsideBody) live.outsideBody = this.addOutsideDoc(live.div, "");
      live.outsideBody.innerHTML = mdBold(reply.outsideDoc);
    } else if (live.outsideBody) {
      // Nhãn "giả" giữa stream mà bản parse cuối không công nhận -> gỡ hộp
      live.outsideBody.closest(".outside-doc").remove();
      live.outsideBody = null;
    }
    this.scroll();
  },

  // Phần kiến thức chung — TÁCH KHỎI bong bóng chính, không trộn vào.
  // Học viên phải thấy ngay câu nào dựa vào slide, câu nào không. Trộn hai
  // loại là đúng cái lỗi lớp ① mà sản phẩm phải tránh.
  addOutsideDoc(div, text) {
    const box = el("div", "outside-doc");
    const cap = el("div", "cap");
    cap.textContent = "💡 Ngoài tài liệu — kiến thức chung, KHÔNG có trong slide này";
    box.appendChild(cap);
    const body = el("div", "body");
    body.innerHTML = mdBold(text);
    box.appendChild(body);
    div.appendChild(box);
    return body;
  },

  // Gợi ý câu hỏi tiếp. Trường `follow_ups` của tutor hiện tại chưa dùng lần
  // nào (0/1.261 turn theo DATA_DICTIONARY) — đây là chỗ lấp.
  addSuggestions(div, list, onPick) {
    if (!list || !list.length) return;
    const box = el("div", "suggestions");
    const cap = el("span", "cap");
    cap.textContent = "Hỏi tiếp:";
    box.appendChild(cap);
    for (const q of list) {
      const b = el("button");
      b.textContent = q;
      b.onclick = () => onPick(q);
      box.appendChild(b);
    }
    div.appendChild(box);
  },

  // Badge chế độ đọc — cho học viên biết câu trả lời đến từ đâu (G2)
  addModeBadge(div, mode) {
    const b = el("span", "mode-badge " + (mode === "scan" ? "scan" : "text"));
    b.textContent = mode === "scan" ? "👁 Đọc bằng quét ảnh vùng" : "📄 Đọc từ text trong vùng";
    div.appendChild(b);
  },

  // Bằng chứng "mình đã đọc đúng trang nào" + đường sửa nếu sai (G9/G11)
  addScanEvidence(div, { thumb, pageNum, pageCount, offScreen, onGoTo }) {
    const box = el("div", "scan-evidence");

    const cap = el("div", "cap");
    cap.textContent = `Trang đã đọc: ${pageNum}${pageCount ? " / " + pageCount : ""}`;
    box.appendChild(cap);

    if (thumb) {
      const img = el("img", "thumb");
      img.src = thumb;
      box.appendChild(img);
    }

    const row = el("div", "ev-actions");

    // Trang được đọc không phải trang đang xem -> để học viên tự quyết
    // có chuyển sang hay không, thay vì kéo họ đi
    if (offScreen && onGoTo) {
      const go = el("button", "fix-page");
      go.textContent = `↪ Đi tới slide ${pageNum}`;
      go.onclick = () => onGoTo();
      row.appendChild(go);
    }

    const fix = el("button", "fix-page");
    fix.textContent = "Không phải trang này?";
    fix.onclick = () => {
      const v = prompt(
        "Bạn muốn mình đọc trang số mấy?\n(Lưu ý: số in trên slide có thể lệch với số trang trong file PDF)",
        String(pageNum)
      );
      const n = parseInt(v, 10);
      if (n && this.onFixPage) this.onFixPage(n);
    };
    row.appendChild(fix);

    box.appendChild(row);
    div.appendChild(box);
  },

  // Công khai chính xác cái gì đã rời khỏi máy học viên.
  // Ràng buộc của tính năng: AI Tutor không được đọc/chuyển đi cả tài liệu.
  addDisclosure(div, d) {
    // Ôn tập có trần dữ liệu khác hẳn (nhiều trang, nhưng chỉ ghi chú và
    // chỉ trang đã xem) nên phải khai bằng bảng khác. Dùng chung bảng cũ
    // là khai sai: nó ghi cứng "duy nhất trang N".
    if (d.kind === "deck-review") return this.addDeckDisclosure(div, d);

    const box = el("details", "disclosure");
    const sum = el("summary");
    sum.textContent = `🔒 Đã gửi đi: 1 ảnh vùng ${d.imageW}×${d.imageH}px` +
      (d.textChars ? ` + ${d.textChars} ký tự text` : "");
    box.appendChild(sum);

    const ul = el("ul");
    const rows = [
      `Trang gửi đi: <b>duy nhất trang ${d.pageNum}</b> (trần cứng: 1 trang/câu hỏi)`,
      d.historyTurns
        ? `Hội thoại trước: <b>${d.historyTurns} lượt</b> (${d.historyChars} ký tự) — chỉ chữ, ` +
          "chỉ của đúng trang này; không có ảnh hay nội dung tài liệu mới nào"
        : null,
      // Dàn ý các lượt ở trang khác. Khai riêng chứ không gộp vào dòng trên:
      // hai thứ có mức độ lộ dữ liệu KHÁC nhau, gộp lại là nói dối bằng cách
      // nói thiếu.
      d.historyOutline
        ? (d.historyOutlineMode === "full"
            ? `Lượt ở trang khác: <b>${d.historyOutline} lượt kèm CẢ câu trả lời</b> ` +
              `(${d.historyOutlineChars} ký tự) — chế độ <b>full</b>, có nội dung trang khác`
            : `Lượt ở trang khác: <b>${d.historyOutline} câu hỏi của bạn</b> ` +
              `(${d.historyOutlineChars} ký tự) — <b>chỉ câu hỏi</b>, không kèm câu trả lời ` +
              "nên không có nội dung trang khác đi kèm")
        : null,
      d.wholePage
        ? `Ảnh: <b>cả phần có nội dung của trang</b> — ${d.imageW}×${d.imageH}px. ` +
          "Vì bạn hỏi cả slide; muốn gửi ít hơn thì bấm vào đúng phần cần hỏi."
        : `Ảnh: <b>chỉ vùng đã chọn</b> — ${d.imageW}×${d.imageH}px, ≈${d.regionPctOfPage}% diện tích trang`,
      d.textChars
        ? `Text: <b>${d.textChars} ký tự</b> từ ${d.textItems} đoạn nằm trong vùng chọn`
        : "Text: <b>không gửi</b> (trang không có lớp text)",
      "Tên file, tổng số trang, nội dung các trang khác: <b>không gửi</b>",
    ];
    for (const r of rows) {
      if (!r) continue; // dòng lịch sử chỉ hiện khi thực sự có gửi
      const li = el("li");
      li.innerHTML = r;
      ul.appendChild(li);
    }
    box.appendChild(ul);
    div.appendChild(box);
  },

  // Bảng công khai của ĐƯỜNG ÔN TẬP. Khác bảng trên ở đúng thứ phải khác:
  // đường này nhắc tới nhiều trang, nên nói thẳng ra là nhiều trang — và
  // nói bù lại nó bị chặn ở đâu (chỉ trang đã xem, chỉ ghi chú, không ảnh).
  // Khai "vẫn 1 trang" ở đây là nói dối.
  addDeckDisclosure(div, d) {
    const box = el("details", "disclosure deck");
    const sum = el("summary");
    sum.textContent =
      `🔒 Đã gửi đi: ghi chú ${d.pages} trang (${d.noteChars} ký tự) · 0 ảnh`;
    box.appendChild(sum);

    const nums = (d.pageNums || []).join(", ");
    const chuaXem = d.coverageTotal - d.coverageSeen;
    const ul = el("ul");
    const rows = [
      `Trang gửi đi: <b>${d.pages} trang</b> — ${nums}. Đúng những trang <b>bạn đã tự mở</b>.`,
      chuaXem > 0
        ? `Trang bạn chưa mở: <b>${chuaXem} trang — KHÔNG gửi</b>, và tutor cũng chưa từng đọc.`
        : "Bạn đã đi qua <b>cả tài liệu</b>, nên bản ôn phủ trọn buổi học.",
      `Dạng dữ liệu: <b>ghi chú đã rút gọn</b> (tối đa ${CONFIG.DECK_NOTE_CHARS} ký tự/trang), ` +
        "không phải text thô của trang.",
      "Ảnh: <b>0</b>. Đường ôn tập không gửi ảnh trang nào.",
      d.askedQuestions
        ? `Câu hỏi của bạn trong buổi: <b>${d.askedQuestions} câu</b> (${d.askedChars} ký tự) — ` +
          "lời của chính bạn, dùng để ra 5 câu quiz về chỗ bạn từng vướng."
        : null,
      "Tên file, trang chưa xem, ảnh trang: <b>không gửi</b>",
    ];
    for (const r of rows) {
      if (!r) continue;
      const li = el("li");
      li.innerHTML = r;
      ul.appendChild(li);
    }
    box.appendChild(ul);
    div.appendChild(box);
  },

  // ---- Quiz ----
  // Đáp án PHẢI giấu cho tới khi học viên tự chọn xong. Đổ cả câu hỏi lẫn
  // đáp án ra một khối markdown thì mắt đọc luôn dòng dưới — bài quiz mất
  // sạch tác dụng, thành một bản tóm tắt dài dòng.
  addQuiz(div, items) {
    const box = el("div", "quiz");

    const cap = el("div", "quiz-cap");
    const n1 = items.filter((q) => q.group === 1).length;
    // Nói số câu THẬT SỰ có, không nói "10 câu" rồi hiện 6. Ghi chú ít thì
    // ra ít câu là đúng — bịa cho đủ số mới là hỏng.
    cap.innerHTML = mdBold(
      `**${items.length} câu ôn tập** — ${n1} câu bám những chỗ bạn đã hỏi trong buổi, ` +
      `${items.length - n1} câu từ nội dung buổi học.` +
      (items.length < CONFIG.DECK_QUIZ_TOTAL
        ? `\nÍt hơn ${CONFIG.DECK_QUIZ_TOTAL} câu vì ghi chú buổi này chỉ đủ cho ngần đó — ` +
          "mở thêm trang rồi tạo lại sẽ được nhiều hơn."
        : ""));
    box.appendChild(cap);

    let lastGroup = null;
    for (const q of items) {
      if (q.group !== lastGroup) {
        lastGroup = q.group;
        const h = el("div", "quiz-group");
        h.textContent = q.group === 1
          ? "① Từ những câu bạn đã hỏi" : "② Từ nội dung buổi học";
        box.appendChild(h);
      }

      const card = el("div", "quiz-item");
      const head = el("div", "quiz-q");
      head.textContent = `${q.n}. ${q.question}`;
      card.appendChild(head);

      const opts = el("div", "quiz-opts");
      const buttons = [];
      for (const o of q.options) {
        const b = el("button");
        b.textContent = `${o.key}. ${o.text}`;
        b.onclick = () => {
          if (card.classList.contains("done")) return;
          card.classList.add("done");
          for (const other of buttons) {
            other.disabled = true;
            if (other.dataset.key === q.answer) other.classList.add("right");
          }
          if (o.key !== q.answer) b.classList.add("wrong");
          reveal.hidden = false;
        };
        b.dataset.key = o.key;
        buttons.push(b);
        opts.appendChild(b);
      }
      card.appendChild(opts);

      const reveal = el("div", "quiz-why");
      reveal.hidden = true;
      reveal.innerHTML = mdBold(
        `**Đáp án: ${q.answer}**${q.why ? " — " + q.why : ""}` +
        (q.page ? `  ·  *trang ${q.page}*` : ""));
      card.appendChild(reveal);

      box.appendChild(card);
    }

    div.appendChild(box);
  },

  addCitation(div, citation) {
    const cite = el("span", "citation");
    cite.textContent = "📄 " + citation;
    div.appendChild(cite);
  },

  // Nút hành động: sửa dễ (G9) + mời feedback chi tiết (G15)
  // onShowRegion: nháy sáng vùng đã đọc trên slide để đối chiếu (G11)
  addActions(div, zone, onShowRegion) {
    const actions = el("div", "actions");

    if (onShowRegion) {
      const show = el("button");
      show.textContent = "◎ Vùng này ở đâu?";
      show.onclick = () => onShowRegion();
      actions.appendChild(show);
    }

    if (zone) {
      const simpler = el("button");
      simpler.textContent = "🔁 Giải thích đơn giản hơn";
      simpler.onclick = async () => {
        simpler.disabled = true;
        const { bubble } = this.addBot();
        await this.stream(bubble, zone.simple);
      };
      actions.appendChild(simpler);
    }

    const up = el("button");
    up.textContent = "👍";
    const down = el("button");
    down.textContent = "👎 Sai chỗ nào?";
    up.onclick = () => { up.classList.add("voted"); down.disabled = true; };
    down.onclick = async () => {
      const why = prompt("Câu trả lời sai / thiếu ở đâu? (mock — sẽ log về hệ thống)");
      if (why !== null) {
        down.classList.add("voted");
        up.disabled = true;
        console.log("[MOCK feedback log]", { why });
        const { bubble } = this.addBot();
        await this.stream(bubble, REPLIES.feedbackThanks);
      }
    };
    actions.appendChild(up);
    actions.appendChild(down);
    div.appendChild(actions);
  },
};

// ---- helpers ----

function el(tag, cls) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  return e;
}

function mdBold(s) {
  return s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/\*(.+?)\*/g, "<i>$1</i>");
}
