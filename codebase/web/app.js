// ============================================================
// CP2 — Prototype Mock: chọn vùng trên slide → "AI" giải thích
// TOÀN BỘ câu trả lời là mock (router phía dưới). Tại CP3, thay
// hàm routeMockAI() bằng lời gọi Gemini vision với cropDataUrl.
// ============================================================

const SLIDE_W = 960, SLIDE_H = 540;
const MIN_SEL_AREA = 2500;      // vùng chọn nhỏ hơn -> đường đi low-confidence (②)
const ZONE_HIT_RATIO = 0.25;    // >=25% vùng chọn nằm trong zone -> nhận diện được

// ---- DOM ----
const baseCanvas = document.getElementById("slide");
const overlay = document.getElementById("overlay");
const baseCtx = baseCanvas.getContext("2d");
const overlayCtx = overlay.getContext("2d");
const popover = document.getElementById("popover");
const questionInput = document.getElementById("question");
const chatBody = document.getElementById("chat-body");
const tabsEl = document.getElementById("slide-tabs");

// ---- State ----
let currentSlide = 0;
let slideImages = [];       // Image object cho từng slide
let dragging = false;
let dragStart = null;
let selection = null;       // {x, y, w, h} theo toạ độ 960x540
let busy = false;           // đang "AI trả lời" thì khoá thao tác

// ============================================================
// Khởi tạo: dựng tab + load SVG slide thành Image
// ============================================================
function init() {
  MOCK_SLIDES.forEach((s, i) => {
    const btn = document.createElement("button");
    btn.textContent = s.label;
    btn.onclick = () => switchSlide(i);
    tabsEl.appendChild(btn);

    const img = new Image();
    img.onload = () => { if (i === currentSlide) drawSlide(); };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s.svg);
    slideImages[i] = img;
  });
  updateTabs();
}

function switchSlide(i) {
  currentSlide = i;
  clearSelection();
  drawSlide();
  updateTabs();
}

function updateTabs() {
  [...tabsEl.children].forEach((b, i) =>
    b.classList.toggle("active", i === currentSlide));
}

function drawSlide() {
  baseCtx.clearRect(0, 0, SLIDE_W, SLIDE_H);
  const img = slideImages[currentSlide];
  if (img && img.complete) baseCtx.drawImage(img, 0, 0, SLIDE_W, SLIDE_H);
}

// ============================================================
// Chọn vùng (kéo chuột trên overlay)
// ============================================================
function toSlideCoords(e) {
  const r = overlay.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(SLIDE_W, (e.clientX - r.left) * SLIDE_W / r.width)),
    y: Math.max(0, Math.min(SLIDE_H, (e.clientY - r.top) * SLIDE_H / r.height)),
  };
}

overlay.addEventListener("mousedown", (e) => {
  if (busy) return;
  hidePopover();
  dragging = true;
  dragStart = toSlideCoords(e);
  selection = null;
  drawOverlay();
});

overlay.addEventListener("mousemove", (e) => {
  if (!dragging) return;
  const p = toSlideCoords(e);
  selection = normRect(dragStart, p);
  drawOverlay();
});

window.addEventListener("mouseup", (e) => {
  if (!dragging) return;
  dragging = false;
  if (selection && selection.w > 8 && selection.h > 8) {
    showPopover(e);
  } else {
    clearSelection();
  }
});

function normRect(a, b) {
  return {
    x: Math.min(a.x, b.x), y: Math.min(a.y, b.y),
    w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y),
  };
}

function drawOverlay() {
  overlayCtx.clearRect(0, 0, SLIDE_W, SLIDE_H);
  if (!selection) return;
  const { x, y, w, h } = selection;
  // làm mờ phần ngoài vùng chọn
  overlayCtx.fillStyle = "rgba(17,24,39,0.28)";
  overlayCtx.fillRect(0, 0, SLIDE_W, SLIDE_H);
  overlayCtx.clearRect(x, y, w, h);
  // viền vùng chọn
  overlayCtx.strokeStyle = "#4f46e5";
  overlayCtx.lineWidth = 2.5;
  overlayCtx.setLineDash([7, 5]);
  overlayCtx.strokeRect(x, y, w, h);
  overlayCtx.setLineDash([]);
}

function clearSelection() {
  selection = null;
  overlayCtx.clearRect(0, 0, SLIDE_W, SLIDE_H);
  hidePopover();
}

// ============================================================
// Popover đặt câu hỏi
// ============================================================
function showPopover(mouseEvent) {
  const wrap = document.getElementById("slide-wrap");
  const wr = wrap.getBoundingClientRect();
  let left = mouseEvent.clientX - wr.left + 10;
  let top = mouseEvent.clientY - wr.top + 10;
  left = Math.max(8, Math.min(left, wr.width - 310));
  top = Math.max(8, Math.min(top, wr.height - 120));
  popover.style.left = left + "px";
  popover.style.top = top + "px";
  popover.classList.add("show");
  questionInput.value = "";
  questionInput.focus();
}

function hidePopover() {
  popover.classList.remove("show");
}

document.getElementById("btn-cancel").onclick = clearSelection;
document.getElementById("btn-ask").onclick = submitAsk;
questionInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") submitAsk();
});

// ============================================================
// Crop vùng chọn thành ảnh (đây chính là input gửi AI ở CP3)
// ============================================================
function cropSelection() {
  const { x, y, w, h } = selection;
  const c = document.createElement("canvas");
  c.width = Math.round(w);
  c.height = Math.round(h);
  c.getContext("2d").drawImage(
    baseCanvas, Math.round(x), Math.round(y), Math.round(w), Math.round(h),
    0, 0, Math.round(w), Math.round(h));
  return c.toDataURL("image/png");
}

// ============================================================
// MOCK AI ROUTER — CP3 sẽ thay hàm này bằng Gemini vision call
// Trả về: { text, citation?, zone? }
// ============================================================
function routeMockAI(sel, question) {
  const q = (question || "").toLowerCase();

  // ③ Ngoài phạm vi: đòi làm hộ bài / hỏi logistics
  if (OUT_OF_SCOPE_PATTERNS.some((p) => q.includes(p))) {
    return { text: MOCK_REPLIES.outOfScope };
  }

  // ② Low-confidence: vùng chọn quá nhỏ, không chắc user muốn hỏi gì
  if (sel.w * sel.h < MIN_SEL_AREA) {
    return { text: MOCK_REPLIES.tooSmall };
  }

  // Tìm zone chồng lấn nhiều nhất với vùng chọn
  const zones = MOCK_SLIDES[currentSlide].zones;
  let best = null, bestRatio = 0;
  for (const z of zones) {
    const [zx, zy, zw, zh] = z.rect;
    const ix = Math.max(0, Math.min(sel.x + sel.w, zx + zw) - Math.max(sel.x, zx));
    const iy = Math.max(0, Math.min(sel.y + sel.h, zy + zh) - Math.max(sel.y, zy));
    const ratio = (ix * iy) / (sel.w * sel.h);
    if (ratio > bestRatio) { bestRatio = ratio; best = z; }
  }

  // ① Không có căn cứ: vùng chọn không trúng nội dung nào -> nói thật, không bịa
  if (!best || bestRatio < ZONE_HIT_RATIO) {
    return { text: MOCK_REPLIES.noContent };
  }

  return { text: best.answer, citation: best.citation, zone: best };
}

// ============================================================
// Chat rendering
// ============================================================
function clearEmptyHint() {
  const el = chatBody.querySelector(".empty-chat");
  if (el) el.remove();
}

function addUserMsg(cropUrl, question) {
  clearEmptyHint();
  const div = document.createElement("div");
  div.className = "msg user";
  const img = document.createElement("img");
  img.className = "crop";
  img.src = cropUrl;
  div.appendChild(img);
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = question || "Giải thích vùng này giúp mình";
  div.appendChild(bubble);
  chatBody.appendChild(div);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function addBotMsg() {
  const div = document.createElement("div");
  div.className = "msg bot";
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  div.appendChild(bubble);
  chatBody.appendChild(div);
  chatBody.scrollTop = chatBody.scrollHeight;
  return { div, bubble };
}

// Render đậm **text** đơn giản + stream từng từ cho giống AI thật
async function streamText(bubble, text) {
  const words = text.split(/(\s+)/);
  let acc = "";
  const cursor = '<span class="cursor-blink">▌</span>';
  for (const w of words) {
    acc += w;
    bubble.innerHTML = mdBold(acc) + cursor;
    chatBody.scrollTop = chatBody.scrollHeight;
    if (w.trim()) await sleep(22);
  }
  bubble.innerHTML = mdBold(acc);
}

function mdBold(s) {
  return s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/\*(.+?)\*/g, "<i>$1</i>");
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// Nút hành động sau câu trả lời: sửa dễ (G9) + feedback (G15)
function addActions(msgDiv, zone) {
  const actions = document.createElement("div");
  actions.className = "actions";

  if (zone) {
    const simpler = document.createElement("button");
    simpler.textContent = "🔁 Giải thích đơn giản hơn";
    simpler.onclick = async () => {
      simpler.disabled = true;
      const { bubble } = addBotMsg();
      busy = true;
      await streamText(bubble, zone.simple);
      busy = false;
    };
    actions.appendChild(simpler);
  }

  const up = document.createElement("button");
  up.textContent = "👍";
  const down = document.createElement("button");
  down.textContent = "👎 Sai chỗ nào?";
  up.onclick = () => { up.classList.add("voted"); down.disabled = true; };
  down.onclick = async () => {
    const why = prompt("Câu trả lời sai / thiếu ở đâu? (mock — sẽ log về hệ thống)");
    if (why !== null) {
      down.classList.add("voted");
      up.disabled = true;
      console.log("[MOCK feedback log]", { slide: MOCK_SLIDES[currentSlide].id, why });
      const { bubble } = addBotMsg();
      await streamText(bubble, MOCK_REPLIES.feedbackThanks);
    }
  };
  actions.appendChild(up);
  actions.appendChild(down);
  msgDiv.appendChild(actions);
}

// ============================================================
// Submit flow: crop -> user msg -> mock AI -> stream reply
// ============================================================
async function submitAsk() {
  if (!selection || busy) return;
  const question = questionInput.value.trim();
  const sel = { ...selection };
  const cropUrl = cropSelection();

  hidePopover();
  overlayCtx.clearRect(0, 0, SLIDE_W, SLIDE_H);
  selection = null;

  addUserMsg(cropUrl, question);

  busy = true;
  const reply = routeMockAI(sel, question);
  const { div, bubble } = addBotMsg();
  bubble.innerHTML = '<span class="cursor-blink">▌</span>';
  await sleep(600); // giả lập độ trễ model
  await streamText(bubble, reply.text);

  if (reply.citation) {
    const cite = document.createElement("span");
    cite.className = "citation";
    cite.textContent = "📄 " + reply.citation;
    div.appendChild(cite);
  }
  addActions(div, reply.zone || null);
  chatBody.scrollTop = chatBody.scrollHeight;
  busy = false;
}

init();
