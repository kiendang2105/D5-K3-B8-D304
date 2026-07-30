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

  clearEmpty() {
    const el = this.body.querySelector(".empty-chat");
    if (el) el.remove();
  },

  scroll() {
    this.body.scrollTop = this.body.scrollHeight;
  },

  // ---- tin nhắn của học viên ----
  addUser({ cropImage, question }) {
    this.clearEmpty();
    const div = el("div", "msg user");
    if (cropImage) {
      const img = el("img", "crop");
      img.src = cropImage;
      div.appendChild(img);
    }
    const bubble = el("div", "bubble");
    bubble.textContent = question || "Giải thích vùng này giúp mình";
    div.appendChild(bubble);
    this.body.appendChild(div);
    this.scroll();
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
    const box = el("details", "disclosure");
    const sum = el("summary");
    sum.textContent = `🔒 Đã gửi đi: 1 ảnh vùng ${d.imageW}×${d.imageH}px` +
      (d.textChars ? ` + ${d.textChars} ký tự text` : "");
    box.appendChild(sum);

    const ul = el("ul");
    const rows = [
      `Trang gửi đi: <b>duy nhất trang ${d.pageNum}</b> (trần cứng: 1 trang/câu hỏi)`,
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
      const li = el("li");
      li.innerHTML = r;
      ul.appendChild(li);
    }
    box.appendChild(ul);
    div.appendChild(box);
  },

  addCitation(div, citation) {
    const cite = el("span", "citation");
    cite.textContent = "📄 " + citation;
    div.appendChild(cite);
  },

  // Nút hành động: sửa dễ (G9) + mời feedback chi tiết (G15)
  addActions(div, zone) {
    const actions = el("div", "actions");

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
