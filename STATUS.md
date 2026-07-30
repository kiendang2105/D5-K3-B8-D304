# Đang làm gì — cập nhật cho cả nhóm

*Cập nhật: 30/07/2026 · nhánh `leduc`*

File này trả lời đúng một câu: **hiện repo đang có gì, đang dở chỗ nào, mình nhảy vào đâu.**
Phân công & checkpoint: [README.md](README.md) · Chi tiết kỹ thuật: [codebase/README.md](codebase/README.md).

---

## 1. Tóm tắt 30 giây

Prototype CP2 **bấm được toàn bộ** — mở [codebase/web/index.html](codebase/web/index.html) bằng trình duyệt là chạy, không cần cài gì.

Kể từ mốc CP2, prototype đã thêm 3 thứ **không có trong bản demo đầu**:

1. **Bấm một phát là nhận diện được vùng** — không phải kéo khung cho khéo nữa. Máy tự dò ranh giới khối nội dung tại chỗ bấm.
2. **Quét ảnh khi PDF không đọc được text** — trang nào rút text ra dưới 30 ký tự thì render trang thành ảnh cho model nhìn, thay vì trả lời chay.
3. **Giới hạn dữ liệu + bảng công khai "đã gửi đi những gì"** — mỗi câu hỏi chỉ được gửi 1 ảnh vùng đã cắt + text trong vùng, tối đa 1 trang.

Phần **đoạn văn giải thích vẫn là MOCK** — đúng mốc CP2. Bật AI thật là việc của CP3, hàm gọi đã viết sẵn.

---

## 2. Đã vào repo (đã commit)

| Commit | Nội dung | File chính |
|---|---|---|
| `eef9e2b` | Nhánh quét ảnh khi PDF không có text layer + tách lại cấu trúc module | [web/lib/pdf-source.js](codebase/web/lib/pdf-source.js) · [web/lib/config.js](codebase/web/lib/config.js) |
| `3f31b50` | Dựng cấu trúc repo nộp bài đầy đủ theo rubric | `eval/` · `validation/` · `reflection/` · `docs/` |
| `f9d3437` | Click nhận diện vùng · không rời slide đang đọc · siết giới hạn dữ liệu | [web/lib/content-detector.js](codebase/web/lib/content-detector.js) · [server/explain.js](codebase/server/explain.js) |

---

## 3. Đang dở trên máy — **chưa commit**

| File | Đang làm gì dở |
|---|---|
| [codebase/web/lib/config.js](codebase/web/lib/config.js) | Bỏ hardcode tên model Gemini → sau khi nhập key thì gọi `ListModels` tự chọn model dùng được (`GEMINI_PREFER`). Tránh 404 giữa lúc demo vì đoán sai tên model. |
| [codebase/server/explain.js](codebase/server/explain.js) | Phần tự chọn model + đường gọi thật đi kèm |
| [codebase/web/app.js](codebase/web/app.js) | Nối nút **API key** vào luồng trên |
| [codebase/web/lib/pdf-source.js](codebase/web/lib/pdf-source.js) | Chỉnh theo |
| `eval/cases.js` *(file mới)* | Golden set **dạng máy đọc được** — toạ độ click ghi theo tỉ lệ trang `[0..1]` để người khác chạy lại trên máy khác vẫn trúng đúng một chỗ. Bản người đọc vẫn là [eval/golden-set.md](eval/golden-set.md). |

> Ai định sửa 4 file này thì nhắn trước trong nhóm, tránh đụng nhau.

---

## 4. Data pack: đã có slide thật

Bên [repo đề bài](https://github.com/VinUni-AI20k/Batch03-K3-AI-Product-Hackathon/tree/main/data/vlearn-pack) vừa bổ sung `slides/`, đã tải về máy:

- `d1-slide-hackathon.pdf` — Day 1 *AI & LLM Foundation*, 29 trang
- `d2-slide-hackathon.pdf` — Day 2 *Xác định bài toán cho AI*, 29 trang

Cả hai có watermark, là bản rút gọn từ slide gốc, **một số trang giữ nguyên footer số trang gốc** để đối chiếu trích dẫn.

**Hai điều cần biết trước khi dùng để demo:**

1. **Cả 2 file đều CÓ lớp text** (kiểm bằng cách đếm khối vẽ chữ trong PDF: d1 có 645 khối `BT` / 4387 lệnh vẽ chữ, d2 có 971 / 6246). Nghĩa là mở 2 file này lên thì hệ thống chạy **chế độ đọc text**, **nhánh quét ảnh sẽ không tự kích hoạt**. Muốn demo nhánh quét trên PDF thật thì phải có trang không có text layer — hiện demo nhánh này bằng **slide 24 mock** (SVG tự dựng, cố tình không text).
2. **Footer số trang ≠ chỉ số trang trong file** — đúng cái bẫy đã lường: đọc nhầm trang thì câu trả lời sai hoàn toàn nhưng nghe vẫn trơn tru. Vì vậy mỗi câu trả lời đều kèm thumbnail trang đã đọc + nút *"Không phải trang này?"*.

⚠️ **Không `git add` thư mục `slides/`** — data được cấp thuộc quy định bảo mật, không commit vào repo nộp bài ([01-de-bai.md](01-de-bai.md) mục 3).

---

## 5. Chạy thử trong 2 phút

```bash
# Cách 1 — slide mẫu, không cần cài gì, đủ demo toàn bộ đường đi
mở codebase/web/index.html bằng trình duyệt

# Cách 2 — mở PDF thật + gọi AI thật (cần server tĩnh)
npx serve codebase        # serve từ codebase/, KHÔNG phải codebase/web/
# rồi mở http://localhost:3000/web/index.html
```

Bấm thử theo thứ tự này là thấy hết:

| Bấm gì / gõ gì | Ra gì |
|---|---|
| Slide 12 → **bấm một phát** vào sơ đồ | Tự khoanh trọn sơ đồ → giải thích + trích dẫn `[T02-118]` |
| Slide 24 (băng vàng) → bấm vào ô ① | Đọc bằng **quét ảnh** → trả lời + thumbnail trang |
| Đang ở slide 12, gõ `giải thích slide 24` | Trả lời về slide 24 nhưng **màn hình vẫn ở 12**, kèm nút "↪ Đi tới slide 24" |
| Mở `🔒 Đã gửi đi…` dưới câu trả lời | Liệt kê đúng: 1 ảnh vùng + text trong vùng + 1 trang |
| Bấm vào chỗ trống hẳn | Nói rõ không nhận diện được, **không đoán** |
| Gõ `làm hộ bài tập này` | Từ chối, và **không có dữ liệu nào rời máy** |

---

## 6. Sửa phần nào thì mở file nào

| Muốn đổi | File |
|---|---|
| Ngưỡng quyết định (bao nhiêu ký tự thì coi là không có text, vùng nhỏ cỡ nào thì hỏi lại…) | [web/lib/config.js](codebase/web/lib/config.js) — **mọi ngưỡng nằm đúng một chỗ** |
| Câu chữ AI trả lời (bản mock) | [web/lib/mock-data.js](codebase/web/lib/mock-data.js) · [web/lib/mock-ai.js](codebase/web/lib/mock-ai.js) |
| Prompt gửi cho model | [server/prompts/explain-region.md](codebase/server/prompts/explain-region.md) — tách riêng, sửa không cần đụng code |
| Dữ liệu nào được phép gửi đi | `Explain.buildPayload()` trong [server/explain.js](codebase/server/explain.js) — **chỗ duy nhất** dữ liệu rời khỏi máy |
| Thuật toán dò vùng khi click | [web/lib/content-detector.js](codebase/web/lib/content-detector.js) |
| Giao diện chat, badge, bằng chứng | [web/components/ExplainPanel.js](codebase/web/components/ExplainPanel.js) |

---

## 7. Việc đang trống — cần người nhận

| Việc | Vì sao gấp |
|---|---|
| **Điền bảng phân công** trong [README.md](README.md) | R7 cho 1 điểm cho việc có tên người cho từng phần; CP5 sẽ hỏi từng người về phần mang tên mình |
| **CP3 — bật AI thật + lưu trace** | Hàm `Explain.callGemini()` đã viết sẵn, chỉ cần key + chạy và lưu log vào `codebase/server/traces/` |
| **Chạy golden set lượt 1** → [eval/run-01.md](eval/run-01.md) | Cần 2 người chấm độc lập 4 chiều G/S/H/C rồi so |
| **Spec §3–§6** → [spec.md](spec.md) | Hạn cứng |
| **User test + feedback log** → [validation/feedback-log.md](validation/feedback-log.md) | CP5 |

---

## 8. Ba luật không được phá

1. **Không commit API key.** Key nhập qua nút **API key** trên header, lưu trong `localStorage` của trình duyệt.
2. **Không commit data pack** (slide, chatlog, transcript) vào repo nộp bài. Trong `codebase/` chỉ dùng slide tự dựng hoặc 1–2 trang mẫu.
3. **Mỗi người phải giải thích được phần mang tên mình.** Vibe-coding rule — kiểm tại CP5.
