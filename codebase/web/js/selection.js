// ============================================================
// KHUNG SLIDE + KHOANH VÙNG
// - Vẽ trang hiện tại vào canvas 960x540 (letterbox giữ tỉ lệ)
// - Cho user kéo chuột khoanh vùng
// - Cắt vùng đó ra ảnh Ở ĐỘ PHÂN GIẢI GỐC của trang (không phải
//   độ phân giải hiển thị) -> ảnh gửi cho model nét hơn hẳn.
//
// Toạ độ vùng chọn dùng hệ hiển thị 960x540 để khớp với `zones`
// khai trong mock-data.js.
// ============================================================

const Slide = {
  base: null,
  overlay: null,
  baseCtx: null,
  overlayCtx: null,
  page: null,
  fit: null, // {ox, oy, w, h, scale} — ánh xạ trang -> khung hiển thị
  selection: null,
  dragging: false,
  dragStart: null,
  onSelected: null, // callback(rect, mouseEvent)

  init() {
    this.base = document.getElementById("slide");
    this.overlay = document.getElementById("overlay");
    this.baseCtx = this.base.getContext("2d");
    this.overlayCtx = this.overlay.getContext("2d");

    this.overlay.addEventListener("mousedown", (e) => this.onDown(e));
    this.overlay.addEventListener("mousemove", (e) => this.onMove(e));
    window.addEventListener("mouseup", (e) => this.onUp(e));
  },

  setPage(page) {
    this.page = page;
    this.clearSelection();
    this.draw();
  },

  // ---- vẽ ----

  draw() {
    const { SLIDE_W, SLIDE_H } = CONFIG;
    this.baseCtx.fillStyle = "#1f2937";
    this.baseCtx.fillRect(0, 0, SLIDE_W, SLIDE_H);
    if (!this.page) return;

    const { width: pw, height: ph, canvas } = this.page;
    const scale = Math.min(SLIDE_W / pw, SLIDE_H / ph);
    const w = pw * scale, h = ph * scale;
    this.fit = { ox: (SLIDE_W - w) / 2, oy: (SLIDE_H - h) / 2, w, h, scale };
    this.baseCtx.drawImage(canvas, this.fit.ox, this.fit.oy, w, h);
  },

  drawOverlay() {
    const { SLIDE_W, SLIDE_H } = CONFIG;
    this.overlayCtx.clearRect(0, 0, SLIDE_W, SLIDE_H);
    if (!this.selection) return;
    const { x, y, w, h } = this.selection;
    this.overlayCtx.fillStyle = "rgba(17,24,39,0.30)";
    this.overlayCtx.fillRect(0, 0, SLIDE_W, SLIDE_H);
    this.overlayCtx.clearRect(x, y, w, h);
    this.overlayCtx.strokeStyle = "#4f46e5";
    this.overlayCtx.lineWidth = 2.5;
    this.overlayCtx.setLineDash([7, 5]);
    this.overlayCtx.strokeRect(x, y, w, h);
    this.overlayCtx.setLineDash([]);
  },

  clearSelection() {
    this.selection = null;
    if (this.overlayCtx) {
      this.overlayCtx.clearRect(0, 0, CONFIG.SLIDE_W, CONFIG.SLIDE_H);
    }
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
    this.drawOverlay();
  },

  onMove(e) {
    if (!this.dragging) return;
    const p = this.toSlideCoords(e);
    const a = this.dragStart;
    this.selection = {
      x: Math.min(a.x, p.x), y: Math.min(a.y, p.y),
      w: Math.abs(a.x - p.x), h: Math.abs(a.y - p.y),
    };
    this.drawOverlay();
  },

  onUp(e) {
    if (!this.dragging) return;
    this.dragging = false;
    if (this.selection && this.selection.w > 6 && this.selection.h > 6) {
      if (this.onSelected) this.onSelected(this.selection, e);
    } else {
      this.clearSelection();
    }
  },

  // Chọn trọn trang — dùng khi user hỏi bằng chat "giải thích slide N".
  // Khoanh cả trang chỉ là một trường hợp của khoanh vùng, nên lát cắt
  // "chọn một vùng -> giải thích vùng đó" vẫn giữ nguyên.
  selectWholePage() {
    if (!this.fit) return null;
    this.selection = { x: this.fit.ox, y: this.fit.oy, w: this.fit.w, h: this.fit.h };
    this.drawOverlay();
    return this.selection;
  },

  // ---- cắt ảnh ----

  // Cắt vùng chọn từ canvas GỐC của trang (nét), trả về dataURL PNG.
  crop(sel) {
    if (!this.page || !this.fit) return null;
    const f = this.fit;
    // hiển thị -> toạ độ trang
    let sx = (sel.x - f.ox) / f.scale;
    let sy = (sel.y - f.oy) / f.scale;
    let sw = sel.w / f.scale;
    let sh = sel.h / f.scale;
    // cắt phần lem ra ngoài trang (letterbox)
    sx = Math.max(0, sx); sy = Math.max(0, sy);
    sw = Math.min(sw, this.page.width - sx);
    sh = Math.min(sh, this.page.height - sy);
    if (sw <= 1 || sh <= 1) return null;

    const c = document.createElement("canvas");
    c.width = Math.round(sw);
    c.height = Math.round(sh);
    c.getContext("2d").drawImage(
      this.page.canvas, Math.round(sx), Math.round(sy), Math.round(sw), Math.round(sh),
      0, 0, Math.round(sw), Math.round(sh));
    return c.toDataURL("image/png");
  },

  // Ảnh thu nhỏ của TRỌN trang — dùng làm bằng chứng "mình đã quét trang nào"
  pageThumb(maxW = 240) {
    if (!this.page) return null;
    const s = Math.min(maxW / this.page.width, 1);
    const c = document.createElement("canvas");
    c.width = Math.round(this.page.width * s);
    c.height = Math.round(this.page.height * s);
    c.getContext("2d").drawImage(this.page.canvas, 0, 0, c.width, c.height);
    return c.toDataURL("image/png");
  },

  // Ảnh trọn trang ở độ phân giải gốc — payload gửi vision khi quét
  pageImage() {
    return this.page ? this.page.canvas.toDataURL("image/png") : null;
  },
};
