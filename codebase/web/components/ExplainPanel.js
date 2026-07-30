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
    b.textContent = mode === "scan" ? "👁 Đọc bằng quét ảnh trang" : "📄 Đọc từ text tài liệu";
    div.appendChild(b);
  },

  // Bằng chứng "mình đã quét đúng trang nào" + đường sửa nếu sai (G9/G11)
  addScanEvidence(div, { thumb, pageNum, pageCount }) {
    const box = el("div", "scan-evidence");

    const cap = el("div", "cap");
    cap.textContent = `Trang đã quét: ${pageNum}${pageCount ? " / " + pageCount : ""}`;
    box.appendChild(cap);

    if (thumb) {
      const img = el("img", "thumb");
      img.src = thumb;
      box.appendChild(img);
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
    box.appendChild(fix);

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
        await this.stream(bubble, MOCK_REPLIES.feedbackThanks);
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
