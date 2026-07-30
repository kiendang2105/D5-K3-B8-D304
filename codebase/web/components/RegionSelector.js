// ============================================================
// RegionSelector — hai cách chọn vùng trên slide:
//
//   CLICK  → ContentDetector tự dò ranh giới khối nội dung tại chỗ bấm
//   KÉO    → học viên tự khoanh khung khi muốn chọn khác ý máy
//
// Click là đường chính (đúng chữ "AI tự nhận diện" trong lát cắt); kéo
// giữ lại làm đường sửa khi máy dò không đúng ý (HAX G9).
//
// Toạ độ:
//   - Chuột và khung vẽ dùng hệ HIỂN THỊ 960x540
//   - Vùng trả về cho tầng AI dùng toạ độ TRANG (theo page.canvas)
//   SlideViewer.fit là phép đổi giữa hai hệ.
// ============================================================

const RegionSelector = {
  overlay: null,
  ctx: null,
  selection: null,   // { x, y, w, h } — toạ độ HIỂN THỊ, để vẽ
  regionPage: null,  // { x, y, w, h } — toạ độ TRANG, để gửi đi
  dragging: false,
  dragStart: null,
  locked: false,
  onSelected: null,  // callback(mouseEvent) khi đã có vùng chọn
  onEmptyClick: null, // callback(mouseEvent) khi bấm vào chỗ trống

  init() {
    this.overlay = document.getElementById("overlay");
    this.ctx = this.overlay.getContext("2d");
    this.overlay.addEventListener("mousedown", (e) => this.onDown(e));
    this.overlay.addEventListener("mousemove", (e) => this.onMove(e));
    window.addEventListener("mouseup", (e) => this.onUp(e));
  },

  // ---- đổi hệ toạ độ ----

  toDisplay(e) {
    const r = this.overlay.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(CONFIG.SLIDE_W, ((e.clientX - r.left) * CONFIG.SLIDE_W) / r.width)),
      y: Math.max(0, Math.min(CONFIG.SLIDE_H, ((e.clientY - r.top) * CONFIG.SLIDE_H) / r.height)),
    };
  },

  displayToPage(pt) {
    const f = SlideViewer.fit;
    if (!f) return null;
    return { x: (pt.x - f.ox) / f.scale, y: (pt.y - f.oy) / f.scale };
  },

  pageRectToDisplay(rect) {
    const f = SlideViewer.fit;
    if (!f) return null;
    return {
      x: f.ox + rect.x * f.scale, y: f.oy + rect.y * f.scale,
      w: rect.w * f.scale, h: rect.h * f.scale,
    };
  },

  displayRectToPage(rect) {
    const f = SlideViewer.fit;
    const page = SlideViewer.page;
    if (!f || !page) return null;
    let x = Math.max(0, (rect.x - f.ox) / f.scale);
    let y = Math.max(0, (rect.y - f.oy) / f.scale);
    const w = Math.min(rect.w / f.scale, page.width - x);
    const h = Math.min(rect.h / f.scale, page.height - y);
    return { x, y, w, h };
  },

  // ---- chuột ----

  onDown(e) {
    if (this.locked) return;
    this.dragging = true;
    this.dragStart = this.toDisplay(e);
    this.selection = null;
    this.regionPage = null;
    this.draw();
  },

  onMove(e) {
    if (!this.dragging) return;
    const p = this.toDisplay(e);
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

    const moved = this.selection
      ? Math.max(this.selection.w, this.selection.h)
      : 0;

    if (moved < CONFIG.CLICK_SLOP_PX) {
      // --- CLICK: để máy tự dò khối nội dung ---
      this.selection = null;
      const pt = this.displayToPage(this.dragStart);
      const page = SlideViewer.page;
      if (!pt || !page) return this.clear();

      const rect = ContentDetector.detectAt(page, pt.x, pt.y);
      if (!rect) {
        // Bấm vào chỗ trống -> KHÔNG đoán, đi nhánh ①
        this.clear();
        if (this.onEmptyClick) this.onEmptyClick(e);
        return;
      }
      this.setPageRegion(rect);
      if (this.onSelected) this.onSelected(e);
      return;
    }

    // --- KÉO: dùng đúng khung học viên khoanh ---
    this.regionPage = this.displayRectToPage(this.selection);
    this.draw();
    if (this.onSelected) this.onSelected(e);
  },

  // Đặt vùng chọn bằng toạ độ TRANG (dùng cho click-dò và chọn cả trang)
  setPageRegion(rect) {
    this.regionPage = rect;
    this.selection = this.pageRectToDisplay(rect);
    this.draw();
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
    this.regionPage = null;
    if (this.ctx) this.ctx.clearRect(0, 0, CONFIG.SLIDE_W, CONFIG.SLIDE_H);
  },

  // Chọn trọn phần CÓ NỘI DUNG của trang (bỏ lề trống) — dùng khi học
  // viên hỏi cả một slide. Bỏ lề để không gửi đi phần trắng vô ích.
  selectWholePage() {
    const page = SlideViewer.page;
    if (!page) return null;
    const rect = ContentDetector.contentBounds(page);
    rect.wholePage = true;
    this.setPageRegion(rect);
    return rect;
  },
};
