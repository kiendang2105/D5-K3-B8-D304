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
4. **Câu hỏi tiếp nối được hội thoại** — gõ *"chi tiết hơn nữa"* thì bám đúng vùng vừa hỏi, không hỏi lại "slide nào".

**AI thật đã chạy** (`gemini-3.1-flash-lite-preview` — đúng dòng model VLearn production) — **CP3 đã đóng**. Mock vẫn giữ để đối chiếu hành vi mong muốn với hành vi model thật.

**Đã chạy 2 lượt đo với AI thật:** lượt 01 = 23/32 case · lượt 02 = **43/46 case (93%)**, 0 lần bị quota chặn. Đáp án 6 câu form CP3: [docs/cp3-form-answers.md](docs/cp3-form-answers.md).

---

## 2. Đã vào repo (đã commit)

| Commit | Nội dung | File chính |
|---|---|---|
| `eef9e2b` | Nhánh quét ảnh khi PDF không có text layer + tách lại cấu trúc module | [web/lib/pdf-source.js](codebase/web/lib/pdf-source.js) · [web/lib/config.js](codebase/web/lib/config.js) |
| `3f31b50` | Dựng cấu trúc repo nộp bài đầy đủ theo rubric | `eval/` · `validation/` · `reflection/` · `docs/` |
| `f9d3437` | Click nhận diện vùng · không rời slide đang đọc · siết giới hạn dữ liệu | [web/lib/content-detector.js](codebase/web/lib/content-detector.js) · [server/explain.js](codebase/server/explain.js) |
| `fdba6fc` | **CP3**: bộ chạy golden set tự động · AI thật không hardcode model · đo trên PDF thật | [eval/runner.html](eval/runner.html) · [eval/cases.js](eval/cases.js) · [eval/run-00-baseline-mock.md](eval/run-00-baseline-mock.md) |
| `7310b02` | CP3 đóng: AI thật đã chạy, 4 trace, run-01 có % + phân tích failure | [eval/run-01.md](eval/run-01.md) · [docs/mining-log.md](docs/mining-log.md) · [docs/mining.py](docs/mining.py) |
| `1b2f5aa` | Lượt 02: 46 case (**14 từ chatlog thật**), 43/46 đạt, đổi sang model production | [eval/run-02.md](eval/run-02.md) · [docs/cp3-form-answers.md](docs/cp3-form-answers.md) |

---

## 3. Bộ chạy golden set tự động

Nhịp lặp CP3→CP5 là *chạy trọn bộ → bảng % → sửa MỘT failure → chạy lại trọn bộ*. Làm tay 46 case mỗi lượt thì đến lượt hai là bỏ, nên có [eval/runner.html](eval/runner.html):

- **Máy chấm** phần cơ học: kích thước vùng dò, số trang gửi đi, có từ chối/hỏi lại không, chế độ đọc, ảnh có phải cả trang không.
- **Người chấm** 4 chiều G/S/H/C — runner để trống cột, hai người chấm độc lập rồi so (rubric R4).
- Toạ độ click trong [eval/cases.js](eval/cases.js) ghi theo **tỉ lệ trang `[0..1]`** để chạy lại trên máy khác ra đúng một chỗ.
- Xuất bảng markdown dán vào `run-NN.md` + `traces.json` cho `codebase/server/traces/`.

Chạy với AI thật: runner tự giãn 7s giữa các call và lùi dần thử lại 3 lần (30/60/90s) nếu gặp 429. Đo thật: `flash-latest` bị chặn **23 lần/lượt**, đổi sang `3.1-flash-lite` thì **0 lần** — và độ trễ median từ 7.182ms xuống **1.420ms** (tutor hiện tại 1.758ms).

**Bộ case đã bắt được 2 bug thật** mà chạy mock không thấy:
1. Guard ② *"vùng quá nhỏ thì hỏi lại"* chỉ cài trong nhánh mock → bật AI thật thì dải viền mảnh vẫn bị gửi đi (lượt 01, case C04).
2. *"TẠO QUIZ… TOÀN BỘ SLIDE NÀY"* — câu nguyên văn từ chatlog `C0063/T0849` — không bị guardrail chặn (lượt 02, case L12). **Case tự nghĩ không bắt được lỗi này.**

---

## 4. Data pack: đã có slide thật

Bên [repo đề bài](https://github.com/VinUni-AI20k/Batch03-K3-AI-Product-Hackathon/tree/main/data/vlearn-pack) vừa bổ sung `slides/`, đã tải về máy:

- `d1-slide-hackathon.pdf` — Day 1 *AI & LLM Foundation*, 29 trang
- `d2-slide-hackathon.pdf` — Day 2 *Xác định bài toán cho AI*, 29 trang

Cả hai có watermark, là bản rút gọn từ slide gốc, **một số trang giữ nguyên footer số trang gốc** để đối chiếu trích dẫn.

**Hai điều cần biết trước khi dùng để demo:**

1. **Cả 2 file đều CÓ lớp text** (kiểm bằng cách đếm khối vẽ chữ trong PDF: d1 có 645 khối `BT` / 4387 lệnh vẽ chữ, d2 có 971 / 6246). Nghĩa là mở 2 file này lên thì hệ thống chạy **chế độ đọc text**, **nhánh quét ảnh sẽ không tự kích hoạt**. Muốn demo nhánh quét trên PDF thật thì phải có trang không có text layer — hiện demo nhánh này bằng **slide 24 mock** (SVG tự dựng, cố tình không text).
2. **Footer số trang ≠ chỉ số trang trong file** — đúng cái bẫy đã lường: đọc nhầm trang thì câu trả lời sai hoàn toàn nhưng nghe vẫn trơn tru. Vì vậy mỗi câu trả lời đều kèm thumbnail trang đã đọc + nút *"Không phải trang này?"*.

ℹ️ **Cập nhật:** hai file slide này **đã được ban tổ chức commit vào repo đề bài** (commit `976c713`, merge từ `main`) — clone về là có sẵn, không phải tự tải.

⚠️ Quy định *"không commit data pack"* ([01-de-bai.md](01-de-bai.md) mục 3) vẫn áp **nếu nhóm tách repo nộp bài riêng**. Trong repo này thì ban tổ chức đã tự quyết, mình không phải làm gì.

---

## 5. Chạy thử trong 2 phút

```bash
# Cách 1 — slide mẫu, không cần cài gì, đủ demo toàn bộ đường đi
mở codebase/web/index.html bằng trình duyệt

# Cách 2 — slide thật + gọi AI thật (cần server tĩnh, chạy từ GỐC REPO)
cd <đường dẫn tới gốc repo>
python -m http.server 8765
# app:    http://localhost:8765/codebase/web/index.html
# runner: http://localhost:8765/eval/runner.html
```

Dùng `python`, **đừng dùng `npx serve`** — máy chưa cài Node thì `npx` không có. Cổng 8765 bận thì đổi số và đổi luôn trong URL. Lỗi khác: xem mục *"Chạy không được?"* trong [codebase/README.md](codebase/README.md).

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

## 5b. Nâng cấp giao tiếp agent (31/07 — CHƯA có số đo, cần lượt 04)

Sau bản phê 55 output thật của lượt 03 (27/43 lượt vẫn mở "Chào bạn," · từ chối canned lặp 6 lần · giọng tả thay giọng dạy), một đợt sửa lớn đã vào code:

| Đổi gì | Ở đâu |
|---|---|
| **Streaming thật** — chữ ra dần thay vì đợi 5–15s; đứt giữa chừng thì giữ phần đã hiện + báo "chưa trọn vẹn" | [server/explain.js](codebase/server/explain.js) (`callGeminiStream`, `progressiveParse`) · [ExplainPanel.js](codebase/web/components/ExplainPanel.js) (`renderStream/endStream`) |
| **Từ chối 3 biến thể theo bản chất** (làm hộ · logistics · đòi đọc cả tài liệu/quiz) — lý do khớp câu hỏi, mở bằng câu ghi nhận nhu cầu | `REPLIES.refusal()` trong [mock-data.js](codebase/web/lib/mock-data.js) · `isOutOfScope` trả category |
| **Sửa bug từ chối oan L14** — bỏ từ khoá trần `"điểm của"`, thay bằng regex đòi đại từ nhân xưng | [mock-data.js](codebase/web/lib/mock-data.js) (`LOGISTICS_REGEX`) |
| **Prompt v2** — cấm "Chào bạn," bằng ví dụ dương tính · từ vựng người thật · cấm "tôi/chúng ta" · giọng dạy · cấm định nghĩa rỗng · câu cầu nối sau "không đề cập" · quy tắc hội thoại nhiều lượt | [server/prompts/explain-region.md](codebase/server/prompts/explain-region.md) |
| **Máy chấm so marker `kind` thay vì so nguyên câu** — đổi lời REPLIES thoải mái không vỡ test; 429 nhận diện bằng `status` | [eval/runner.js](eval/runner.js) + 3 producer |
| **2 điều kiện test mới**: `notRefused` (bắt từ chối oan) · case **E01** (học viên than nản) | [eval/cases.js](eval/cases.js) — bộ case giờ **56** |
| `temperature: 0.2` + trần 512 token output — hai người chấm G/S/H/C mới chấm trên cùng một đáp án | [server/explain.js](codebase/server/explain.js) |

⚠️ **Runner KHÔNG stream** (gọi đường một-phát như cũ) nên số đo lượt 04 vẫn so được với lượt 03. Trace thêm `latency_first_token_ms` để đo cảm nhận chờ của app thật.

---

## 5c. Ôn tập cuối buổi — tóm tắt cả buổi + quiz (31/07 — CHƯA có số đo)

Học viên lướt hết slide trong buổi thì tutor tóm tắt lại cả buổi và ra quiz. Nguồn của bản ôn **không phải file PDF** mà là ghi chú nhặt dần từ những trang học viên đã tự mở.

| Đổi gì | Ở đâu |
|---|---|
| **Kho ghi chú theo trang đã xem** — nhặt lúc học viên lật tới trang, từ lớp text sẵn có (không gọi AI); trang đã hỏi tutor thì nâng cấp bằng chính câu trả lời | [web/lib/deck-notes.js](codebase/web/lib/deck-notes.js) (file mới) |
| **Đường dữ liệu thứ hai** `Explain.review()` + `buildDeckPayload()` — chỉ chữ, 0 ảnh, ≤240 ký tự/trang | [server/explain.js](codebase/server/explain.js) |
| **Quiz 10 câu**: 5 câu bám chỗ học viên đã hỏi trong buổi + 5 câu từ nội dung; đáp án giấu tới khi tự chọn | `parseQuiz` + `ExplainPanel.addQuiz` |
| **Băng tiến độ** "đã ghi chú N/M trang bạn đi qua" + nút ôn khi đi đủ | `App.renderCoverage` · [index.html](codebase/web/index.html) |
| **Bảng công khai riêng** cho đường ôn tập: khai đúng số trang, khai 0 ảnh, khai còn bao nhiêu trang chưa xem | `ExplainPanel.addDeckDisclosure` |
| 4 case đổi kỳ vọng (`C28` `L09` `L10` `L12`) + 3 case mới (`C29`–`C31`) — bộ case giờ **61** | [eval/cases.js](eval/cases.js), xem [golden-set.md](eval/golden-set.md) |

**Bất biến thay thế cho trần 1 trang**: không bao giờ đọc trang học viên chưa tự mở. Kiểm được bằng `onlySeenPages` / `noImages` / `quizFromSeenPages` trong máy chấm.

Đã chạy: trọn bộ 61 case ở chế độ mock — **117/117 điều kiện máy chấm đạt**, 0 lỗi JS. Đã thử đường ôn tập với **AI thật** (`gemini-3.1-flash-lite-preview`): tóm tắt 2,0s đúng bố cục và tự nói rõ trang 24 chỉ có ảnh nên không tóm được; quiz 3,0s, `parseQuiz` đọc ra 5 câu, mọi câu dẫn nguồn về trang đã xem.

⚠️ **Chưa có số chất lượng**: lượt 04 vẫn chưa chạy, và bốn chiều G/S/H/C chưa ai chấm cho đường ôn tập.

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
| **Chạy lượt 04 — trọn bộ 61 case** | Toàn bộ nâng cấp mục 5b (prompt v2, refusal variants, temp 0.2) **và 5c (ôn tập cuối buổi)** chưa có số; lượt 03 đã lỗi thời so với code hiện tại. Cần key Gemini |
| **Chấm 4 chiều G/S/H/C** trên lượt 04 | **2 người chấm độc lập rồi so** — 4/15 điểm R4. **Việc còn thiếu lớn nhất.** Chấm trên lượt 04 (temp 0.2 — hai người cùng một đáp án), đừng chấm lượt cũ |
| **Xác nhận quality bar** → spec §7 | Đề xuất **≥80% + không bịa lần nào**; nhóm phải chốt trước **23:59 N1**, sau đó không hạ được |
| ~~≥10 golden case từ chatlog thật~~ | ✅ **xong — 14 case** (L01–L14), mỗi case kèm mã hội thoại |
| **Log nguyên văn 23 người khảo sát** → [docs/survey-log.md](docs/survey-log.md) | Đang chặn 6/15 điểm R1 — có số 13/23 rồi nhưng thiếu log thì không được tính |
| **Spec §3** (giải pháp tương tự) → [spec.md](spec.md) | Mỗi người thử 1 sản phẩm, 15 phút |
| **User test + feedback log** → [validation/feedback-log.md](validation/feedback-log.md) | CP5 |

---

## 8. Ba luật không được phá

1. **Không commit API key.** Key nhập qua nút **API key** trên header, lưu trong `localStorage` của trình duyệt.
2. **Không commit data pack** (slide, chatlog, transcript) vào repo nộp bài. Trong `codebase/` chỉ dùng slide tự dựng hoặc 1–2 trang mẫu.
3. **Mỗi người phải giải thích được phần mang tên mình.** Vibe-coding rule — kiểm tại CP5.
