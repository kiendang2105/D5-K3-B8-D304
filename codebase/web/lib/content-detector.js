// ============================================================
// ContentDetector — CLICK MỘT PHÁT là ra vùng nội dung.
//
// Học viên không phải kéo khung cho khéo: bấm vào sơ đồ thì hệ thống
// tự tìm ranh giới của chính khối đó. Đúng với chữ "AI tự nhận diện"
// trong lát cắt.
//
// Cách làm (chạy hoàn toàn trên máy học viên, không gửi đi đâu):
//   1. Thu nhỏ trang thành lưới ô 4px -> lấy độ sáng từng ô
//   2. So từng ô với ĐỘ SÁNG NỀN CỤC BỘ (làm mờ vùng xung quanh) —
//      lệch quá ngưỡng thì coi là "có mực"
//   3. Nới các ô có mực ra vài ô để chữ rời rạc dính thành khối
//   4. Loang từ ô được bấm qua các ô có mực liền nhau -> lấy hộp bao
//
// Dùng nền CỤC BỘ chứ không phải một màu nền duy nhất cho cả trang: slide
// scan có giấy ngả vàng và vệt sáng loang, so với một màu cố định thì
// hoặc bắt nhầm cả trang, hoặc bỏ sót nội dung ở vùng tối/sáng.
//
// Bấm vào chỗ trắng -> trả về null -> app đi nhánh ① "không nhận diện
// được", KHÔNG đoán bừa.
//
// Mọi toạ độ ở đây là TOẠ ĐỘ TRANG (theo page.canvas), không phải toạ
// độ hiển thị — nhờ vậy dò được cả trang đang không hiển thị.
// ============================================================

// Làm mờ hộp tách trục (ngang rồi dọc) — O(n) mỗi trục.
function boxBlur(src, cols, rows, r) {
  const tmp = new Float32Array(cols * rows);
  const out = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let s = 0, n = 0;
      for (let dx = -r; dx <= r; dx++) {
        const nx = x + dx;
        if (nx < 0 || nx >= cols) continue;
        s += src[y * cols + nx]; n++;
      }
      tmp[y * cols + x] = s / n;
    }
  }
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      let s = 0, n = 0;
      for (let dy = -r; dy <= r; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= rows) continue;
        s += tmp[ny * cols + x]; n++;
      }
      out[y * cols + x] = s / n;
    }
  }
  return out;
}

const ContentDetector = {
  _cache: new WeakMap(),

  // --- Lưới "có mực / không mực" của một trang ---
  inkMap(page) {
    if (this._cache.has(page)) return this._cache.get(page);

    const cell = CONFIG.DETECT_CELL_PX;
    const cols = Math.max(1, Math.round(page.width / cell));
    const rows = Math.max(1, Math.round(page.height / cell));

    const c = document.createElement("canvas");
    c.width = cols;
    c.height = rows;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(page.canvas, 0, 0, cols, rows);
    const px = ctx.getImageData(0, 0, cols, rows).data;

    // Độ sáng từng ô
    const lum = new Float32Array(cols * rows);
    for (let i = 0; i < cols * rows; i++) {
      lum[i] = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
    }

    // Độ sáng nền cục bộ = làm mờ hộp bán kính DETECT_BG_RADIUS
    const bg = boxBlur(lum, cols, rows, CONFIG.DETECT_BG_RADIUS);

    // Ô lệch nền cục bộ quá ngưỡng = có nội dung
    const ink = new Uint8Array(cols * rows);
    for (let i = 0; i < cols * rows; i++) {
      ink[i] = Math.abs(lum[i] - bg[i]) > CONFIG.DETECT_INK_THRESHOLD ? 1 : 0;
    }

    // Nới ra để chữ/dòng rời rạc dính thành một khối
    const grown = this.dilate(ink, cols, rows, CONFIG.DETECT_DILATE);

    const map = { cols, rows, cell, ink, grown };
    this._cache.set(page, map);
    return map;
  },

  dilate(src, cols, rows, r) {
    if (r <= 0) return src;
    const out = new Uint8Array(cols * rows);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (!src[y * cols + x]) continue;
        for (let dy = -r; dy <= r; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= rows) continue;
          for (let dx = -r; dx <= r; dx++) {
            const nx = x + dx;
            if (nx < 0 || nx >= cols) continue;
            out[ny * cols + nx] = 1;
          }
        }
      }
    }
    return out;
  },

  // --- Dò khối nội dung tại một điểm (toạ độ TRANG) ---
  // Trả về { x, y, w, h } theo toạ độ trang, hoặc null nếu bấm vào chỗ trống.
  detectAt(page, pageX, pageY) {
    const m = this.inkMap(page);
    let cx = Math.floor(pageX / m.cell);
    let cy = Math.floor(pageY / m.cell);
    if (cx < 0 || cy < 0 || cx >= m.cols || cy >= m.rows) return null;

    // Bấm vào khoảng trống giữa hai dòng chữ trong cùng một hộp là chuyện
    // thường. Hút về khối gần nhất trong bán kính DETECT_SNAP_CELLS thay vì
    // bắt học viên bấm chính xác vào nét chữ.
    if (!m.grown[cy * m.cols + cx]) {
      const snap = this.nearestInk(m, cx, cy);
      if (!snap) return null; // thật sự là chỗ trống -> đi nhánh ①
      cx = snap.x; cy = snap.y;
    }

    // Loang 4 hướng trong vùng đã nới
    const seen = new Uint8Array(m.cols * m.rows);
    const stack = [cy * m.cols + cx];
    seen[stack[0]] = 1;
    let minX = cx, maxX = cx, minY = cy, maxY = cy, count = 0;

    while (stack.length) {
      const i = stack.pop();
      const x = i % m.cols, y = (i - x) / m.cols;
      count++;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;

      const nb = [
        x > 0 ? i - 1 : -1,
        x < m.cols - 1 ? i + 1 : -1,
        y > 0 ? i - m.cols : -1,
        y < m.rows - 1 ? i + m.cols : -1,
      ];
      for (const j of nb) {
        if (j >= 0 && !seen[j] && m.grown[j]) { seen[j] = 1; stack.push(j); }
      }
    }

    // Khối phủ gần hết trang -> coi như dò không có ý nghĩa, trả cả trang
    if (count / (m.cols * m.rows) > CONFIG.DETECT_MAX_COVERAGE) {
      return { x: 0, y: 0, w: page.width, h: page.height, wholePage: true };
    }

    const pad = CONFIG.DETECT_PAD_PX;
    const x0 = Math.max(0, minX * m.cell - pad);
    const y0 = Math.max(0, minY * m.cell - pad);
    const x1 = Math.min(page.width, (maxX + 1) * m.cell + pad);
    const y1 = Math.min(page.height, (maxY + 1) * m.cell + pad);
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  },

  // Tìm ô có nội dung gần nhất, quét theo vành tăng dần
  nearestInk(m, cx, cy) {
    for (let r = 1; r <= CONFIG.DETECT_SNAP_CELLS; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; // chỉ vành ngoài
          const x = cx + dx, y = cy + dy;
          if (x < 0 || y < 0 || x >= m.cols || y >= m.rows) continue;
          if (m.grown[y * m.cols + x]) return { x, y };
        }
      }
    }
    return null;
  },

  // Hộp bao toàn bộ nội dung của trang (bỏ lề trắng) — dùng khi học viên
  // hỏi về cả một slide, để không gửi phần lề trống đi.
  contentBounds(page) {
    const m = this.inkMap(page);
    let minX = m.cols, maxX = -1, minY = m.rows, maxY = -1;
    for (let y = 0; y < m.rows; y++) {
      for (let x = 0; x < m.cols; x++) {
        if (!m.ink[y * m.cols + x]) continue;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
    if (maxX < 0) return { x: 0, y: 0, w: page.width, h: page.height };
    const pad = CONFIG.DETECT_PAD_PX;
    const x0 = Math.max(0, minX * m.cell - pad);
    const y0 = Math.max(0, minY * m.cell - pad);
    const x1 = Math.min(page.width, (maxX + 1) * m.cell + pad);
    const y1 = Math.min(page.height, (maxY + 1) * m.cell + pad);
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  },

  // Cắt một vùng (toạ độ TRANG) ra ảnh PNG — chạy được cả với trang
  // đang không hiển thị.
  cropPage(page, rect) {
    const sx = Math.max(0, Math.round(rect.x));
    const sy = Math.max(0, Math.round(rect.y));
    const sw = Math.min(Math.round(rect.w), page.width - sx);
    const sh = Math.min(Math.round(rect.h), page.height - sy);
    if (sw <= 1 || sh <= 1) return null;

    const c = document.createElement("canvas");
    c.width = sw;
    c.height = sh;
    c.getContext("2d").drawImage(page.canvas, sx, sy, sw, sh, 0, 0, sw, sh);
    return c.toDataURL("image/png");
  },
};
