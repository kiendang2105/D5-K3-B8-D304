// ============================================================
// RegionSelector — kéo-thả chọn vùng trên slide, cắt ra base64.
//
// Toạ độ vùng chọn dùng hệ hiển thị 960x540 (khớp với `zones` khai
// trong mock-data.js). Nhưng khi CẮT thì cắt từ canvas gốc của trang
// qua SlideViewer.fit — ảnh gửi model vì thế nét hơn nhiều so với
// cắt từ ảnh đã thu nhỏ để hiển thị.
// ============================================================

const RegionSelector = {
  overlay: null,
  ctx: null,
  selection: null,   // { x, y, w, h } theo hệ 960x540
  dragging: false,
  dragStart: null,
  locked: false,     // khoá khi AI đang trả lời
  onSelected: null,  // callback(rect, mouseEvent)

  init() {
    this.overlay = document.getElementById("overlay");
    this.ctx = this.overlay.getContext("2d");
    this.overlay.addEventListener("mousedown", (e) => this.onDown(e));
    this.overlay.addEventListener("mousemove", (e) => this.onMove(e));
    window.addEventListener("mouseup", (e) => this.onUp(e));
  },

  // ---- kéo chuột ----

  toSlideCoords(e) {
    const r = this.overlay.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(CONFIG.SLIDE_W, ((e.clientX - r.left) * CONFIG.SLIDE_W) / r.width)),
      y: Math.max(0, Math.min(CONFIG.SLIDE_H, ((e.clientY - r.top) * CONFIG.SLIDE_H) / r.height)),
    };
  },

  onDown(e) {
    if (this.locked) return;
    this.dragging = true;
    this.dragStart = this.toSlideCoords(e);
    this.selection = null;
    this.draw();
  },

  onMove(e) {
    if (!this.dragging) return;
    const p = this.toSlideCoords(e);
    const a = this.dragStart;
    this.selection = {
      x: Math.min(a.x, p.x), y: Math.min(a.y, p.y),
      w: Math.abs(a.x - p.x), h: Math.abs(a.y - p.y),
    };
    this.draw();
  },

  onUp(e) {
    if (!this.dragging) return;
    this.dragging = false;
    if (this.selection && this.selection.w > 6 && this.selection.h > 6) {
      if (this.onSelected) this.onSelected(this.selection, e);
    } else {
      this.clear();
    }
  },

  // ---- vẽ ----

  draw() {
    const { SLIDE_W, SLIDE_H } = CONFIG;
    this.ctx.clearRect(0, 0, SLIDE_W, SLIDE_H);
    if (!this.selection) return;
    const { x, y, w, h } = this.selection;
    this.ctx.fillStyle = "rgba(17,24,39,0.30)";
    this.ctx.fillRect(0, 0, SLIDE_W, SLIDE_H);
    this.ctx.clearRect(x, y, w, h);
    this.ctx.strokeStyle = "#4f46e5";
    this.ctx.lineWidth = 2.5;
    this.ctx.setLineDash([7, 5]);
    this.ctx.strokeRect(x, y, w, h);
    this.ctx.setLineDash([]);
  },

  clear() {
    this.selection = null;
    if (this.ctx) this.ctx.clearRect(0, 0, CONFIG.SLIDE_W, CONFIG.SLIDE_H);
  },

  // Chọn trọn trang — dùng khi user hỏi "giải thích slide N" qua chat.
  // Khoanh cả trang chỉ là một trường hợp của khoanh vùng, nên lát cắt
  // "chọn một vùng · giải thích vùng đó" vẫn giữ nguyên.
  selectWholePage() {
    const f = SlideViewer.fit;
    if (!f) return null;
    this.selection = { x: f.ox, y: f.oy, w: f.w, h: f.h };
    this.draw();
    return this.selection;
  },

  // ---- cắt ảnh ----

  // Cắt vùng chọn từ canvas GỐC của trang, trả về dataURL PNG.
  crop(sel) {
    const page = SlideViewer.page;
    const f = SlideViewer.fit;
    if (!page || !f) return null;

    // hiển thị -> toạ độ trang
    let sx = (sel.x - f.ox) / f.scale;
    let sy = (sel.y - f.oy) / f.scale;
    let sw = sel.w / f.scale;
    let sh = sel.h / f.scale;

    // cắt bỏ phần lem ra ngoài trang (vùng letterbox)
    sx = Math.max(0, sx); sy = Math.max(0, sy);
    sw = Math.min(sw, page.width - sx);
    sh = Math.min(sh, page.height - sy);
    if (sw <= 1 || sh <= 1) return null;

    const c = document.createElement("canvas");
    c.width = Math.round(sw);
    c.height = Math.round(sh);
    c.getContext("2d").drawImage(
      page.canvas, Math.round(sx), Math.round(sy), Math.round(sw), Math.round(sh),
      0, 0, Math.round(sw), Math.round(sh));
    return c.toDataURL("image/png");
  },
};
