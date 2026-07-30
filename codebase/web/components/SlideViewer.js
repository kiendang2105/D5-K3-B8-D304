// ============================================================
// SlideViewer — render trang hiện tại vào canvas 960x540.
//
// Trang có thể là slide mock (SVG) hoặc trang PDF thật; cả hai đều
// đến dưới dạng canvas ở ĐỘ PHÂN GIẢI GỐC. SlideViewer vẽ nó vào
// khung hiển thị theo kiểu letterbox (giữ tỉ lệ, chèn viền).
//
// `fit` là phép ánh xạ giữa hai hệ toạ độ:
//   trang (gốc, nét)  <->  khung hiển thị 960x540 (nơi user khoanh vùng)
// RegionSelector dùng `fit` để cắt vùng chọn ra ở độ phân giải gốc.
// ============================================================

const SlideViewer = {
  canvas: null,
  ctx: null,
  page: null, // { num, label, canvas, width, height, hasText, text, textLen, zones }
  fit: null,  // { ox, oy, w, h, scale }

  init() {
    this.canvas = document.getElementById("slide");
    this.ctx = this.canvas.getContext("2d");
  },

  setPage(page) {
    this.page = page;
    this.draw();
  },

  draw() {
    const { SLIDE_W, SLIDE_H } = CONFIG;
    this.ctx.fillStyle = "#1f2937";
    this.ctx.fillRect(0, 0, SLIDE_W, SLIDE_H);
    if (!this.page) return;

    const { width: pw, height: ph, canvas } = this.page;
    const scale = Math.min(SLIDE_W / pw, SLIDE_H / ph);
    const w = pw * scale, h = ph * scale;
    this.fit = { ox: (SLIDE_W - w) / 2, oy: (SLIDE_H - h) / 2, w, h, scale };
    this.ctx.drawImage(canvas, this.fit.ox, this.fit.oy, w, h);
  },

  // Ảnh thu nhỏ của TRỌN trang — bằng chứng "mình đã quét trang nào"
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
