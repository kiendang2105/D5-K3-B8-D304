# Đang làm gì — cập nhật cho cả nhóm

*Cập nhật: 30/07/2026 · nhánh `leduc1`*

File này trả lời đúng một câu: **hiện repo đang có gì, đang dở chỗ nào, mình nhảy vào đâu.**
Phân công & checkpoint: [README.md](README.md) · Chi tiết kỹ thuật: [codebase/README.md](codebase/README.md).

---

## 1. Tóm tắt 30 giây

Prototype CP2 **bấm được toàn bộ** — mở [codebase/web/index.html](codebase/web/index.html) bằng trình duyệt là chạy, không cần cài gì.

Kể từ mốc CP2, prototype đã thêm 3 thứ **không có trong bản demo đầu**:

1. **Bấm một phát là nhận diện được vùng** — không phải kéo khung cho khéo nữa. Máy tự dò ranh giới khối nội dung tại chỗ bấm.
2. **Quét ảnh khi PDF không đọc được text** — trang nào rút text ra dưới 30 ký tự thì render trang thành ảnh cho model nhìn, thay vì trả lời chay.
3. **Giới hạn dữ liệu + bảng công khai "đã gửi đi những gì"** — mỗi câu hỏi chỉ được gửi 1 ảnh vùng đã cắt + text trong vùng, tối đa 1 trang.

**AI thật đã chạy** (Gemini `2.5-flash`) — CP3 đã mở. Mock vẫn giữ để đối chiếu hành vi mong muốn với hành vi model thật.

---

## 2. Đã vào repo (đã commit)

| Commit | Nội dung | File chính |
|---|---|---|
| `eef9e2b` | Nhánh quét ảnh khi PDF không có text layer + tách lại cấu trúc module | [web/lib/pdf-source.js](codebase/web/lib/pdf-source.js) · [web/lib/config.js](codebase/web/lib/config.js) |
| `3f31b50` | Dựng cấu trúc repo nộp bài đầy đủ theo rubric | `eval/` · `validation/` · `reflection/` · `docs/` |
| `f9d3437` | Click nhận diện vùng · không rời slide đang đọc · siết giới hạn dữ liệu | [web/lib/content-detector.js](codebase/web/lib/content-detector.js) · [server/explain.js](codebase/server/explain.js) |
| `fdba6fc` | **CP3**: bộ chạy golden set tự động · AI thật không hardcode model · đo trên PDF thật | [eval/runner.html](eval/runner.html) · [eval/cases.js](eval/cases.js) · [eval/run-00-baseline-mock.md](eval/run-00-baseline-mock.md) |

---

## 3. Bộ chạy golden set tự động

Nhịp lặp CP3→CP5 là *chạy trọn bộ → bảng % → sửa MỘT failure → chạy lại trọn bộ*. Làm tay 32 case mỗi lượt thì đến lượt hai là bỏ, nên có [eval/runner.html](eval/runner.html):

- **Máy chấm** phần cơ học: kích thước vùng dò, số trang gửi đi, có từ chối/hỏi lại không, chế độ đọc, ảnh có phải cả trang không.
- **Người chấm** 4 chiều G/S/H/C — runner để trống cột, hai người chấm độc lập rồi so (rubric R4).
- Toạ độ click trong [eval/cases.js](eval/cases.js) ghi theo **tỉ lệ trang `[0..1]`** để chạy lại trên máy khác ra đúng một chỗ.
- Xuất bảng markdown dán vào `run-NN.md` + `traces.json` cho `codebase/server/traces/`.

Chạy với AI thật: runner tự giãn 7s giữa các call và thử lại sau 30s nếu gặp 429 — đo thật thì free tier `gemini-2.5-flash` chặn ở khoảng 10 req/phút.

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

# Cách 2 — slide thật + gọi AI thật (cần server tĩnh, chạy từ GỐC REPO)
python -m http.server 8765        # hoặc: npx serve .
# app:    http://localhost:8765/codebase/web/index.html
# runner: http://localhost:8765/eval/runner.html
```

Chạy cách 2 thì header có sẵn nút **Slide buổi 1** / **Slide buổi 2** — bấm là mở luôn deck trong data pack, không phải tự chọn file.

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
| **Chấm 4 chiều G/S/H/C** cho [eval/run-01.md](eval/run-01.md) | Runner đã sinh bảng với output thật; cần **2 người chấm độc lập rồi so** — đây là 4/15 điểm R4 |
| **Quality bar bằng số** → spec §7 | **Hạn cứng 23:59 N1**, sau đó không đổi được |
| **≥10 golden case từ chatlog thật** → [eval/golden-set.md](eval/golden-set.md) | Đang 0/10; TA soát ở CP4 |
| **Log nguyên văn 23 người khảo sát** → [docs/survey-log.md](docs/survey-log.md) | Đang chặn 6/15 điểm R1 — có số 13/23 rồi nhưng thiếu log thì không được tính |
| **Spec §3** (giải pháp tương tự) → [spec.md](spec.md) | Mỗi người thử 1 sản phẩm, 15 phút |
| **User test + feedback log** → [validation/feedback-log.md](validation/feedback-log.md) | CP5 |

---

## 8. Ba luật không được phá

1. **Không commit API key.** Key nhập qua nút **API key** trên header, lưu trong `localStorage` của trình duyệt.
2. **Không commit data pack** (slide, chatlog, transcript) vào repo nộp bài. Trong `codebase/` chỉ dùng slide tự dựng hoặc 1–2 trang mẫu.
3. **Mỗi người phải giải thích được phần mang tên mình.** Vibe-coding rule — kiểm tại CP5.
