// ============================================================
// NGUỒN SLIDE — hai cài đặt cùng một giao diện:
//   MockSource : 3 slide SVG dựng sẵn (chạy được không cần mạng)
//   PdfSource  : file PDF thật do user mở (pdf.js)
//
// Cả hai trả về "page" cùng hình dạng:
//   { num, label, canvas, width, height, hasText, text, textLen }
//
// `hasText` là TRỌNG TÂM của tính năng quét ảnh: trang nào rút text
// ra dưới CONFIG.MIN_TEXT_CHARS ký tự thì coi là PDF không đọc được
// -> hệ thống chuyển sang gửi ẢNH TRANG cho model nhìn.
// ============================================================

// ---------- tiện ích ----------

function loadScriptOnce(url) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = url;
    s.onload = resolve;
    s.onerror = () => reject(new Error("Không nạp được " + url));
    document.head.appendChild(s);
  });
}

function svgToCanvas(svg, width) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const h = Math.round((width * CONFIG.SLIDE_H) / CONFIG.SLIDE_W);
      const c = document.createElement("canvas");
      c.width = width;
      c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, width, h);
      resolve(c);
    };
    img.onerror = reject;
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  });
}

// ---------- Nguồn mock ----------

class MockSource {
  constructor() {
    this.kind = "mock";
    this.name = "Slide mẫu (mock)";
    this.cache = new Map();
  }

  get pageCount() {
    return MOCK_SLIDES.length;
  }

  // Mock đánh số trang theo số in trên slide (12/18/24) để mô phỏng đúng
  // cái bẫy "số trang trên slide ≠ chỉ số trang trong file".
  pageLabels() {
    return MOCK_SLIDES.map((s) => ({ index: s.num, label: s.label }));
  }

  hasPage(num) {
    return MOCK_SLIDES.some((s) => s.num === num);
  }

  rangeText() {
    return "các slide " + MOCK_SLIDES.map((s) => s.num).join(", ");
  }

  async getPage(num) {
    if (this.cache.has(num)) return this.cache.get(num);
    const slide = MOCK_SLIDES.find((s) => s.num === num);
    if (!slide) return null;

    const canvas = await svgToCanvas(slide.svg, CONFIG.SCAN_MAX_WIDTH);
    // Mock text layer: slide "scan" cố tình trả về rỗng
    const text = slide.hasText ? slide.label + " — nội dung text giả lập" : "";
    const page = {
      num: slide.num,
      label: slide.label,
      canvas,
      width: canvas.width,
      height: canvas.height,
      hasText: slide.hasText,
      text,
      textLen: text.length,
      zones: slide.zones,
    };
    this.cache.set(num, page);
    return page;
  }
}

// ---------- Nguồn PDF thật ----------

class PdfSource {
  constructor(pdf, name) {
    this.kind = "pdf";
    this.name = name;
    this.pdf = pdf;
    this.cache = new Map();
  }

  static async open(file) {
    if (!window.pdfjsLib) {
      await loadScriptOnce(CONFIG.PDFJS_URL);
      // Worker cross-origin có thể bị chặn; pdf.js tự lùi về fake worker
      // (chạy trên main thread) — chậm hơn chút nhưng vẫn đúng kết quả.
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = CONFIG.PDFJS_WORKER_URL;
    }
    const buf = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
    return new PdfSource(pdf, file.name);
  }

  get pageCount() {
    return this.pdf.numPages;
  }

  pageLabels() {
    return Array.from({ length: this.pdf.numPages }, (_, i) => ({
      index: i + 1,
      label: "Trang " + (i + 1),
    }));
  }

  hasPage(num) {
    return num >= 1 && num <= this.pdf.numPages;
  }

  rangeText() {
    return `trang 1–${this.pdf.numPages}`;
  }

  async getPage(num) {
    if (this.cache.has(num)) return this.cache.get(num);
    if (!this.hasPage(num)) return null;

    const p = await this.pdf.getPage(num);

    // (1) Thử rút text — đây là phép đo quyết định chế độ đọc
    const tc = await p.getTextContent();
    const text = tc.items.map((i) => i.str).join(" ").replace(/\s+/g, " ").trim();
    const hasText = text.length >= CONFIG.MIN_TEXT_CHARS;

    // (2) Render trang thành ảnh (dùng cho hiển thị + cho vision khi scan)
    const base = p.getViewport({ scale: 1 });
    const scale = Math.min(CONFIG.SCAN_MAX_WIDTH / base.width, 3);
    const viewport = p.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    await p.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;

    const page = {
      num,
      label: "Trang " + num,
      canvas,
      width: canvas.width,
      height: canvas.height,
      hasText,
      text,
      textLen: text.length,
      zones: null, // PDF thật không có zone khai sẵn -> mock trả lời chung
    };
    this.cache.set(num, page);
    return page;
  }
}
