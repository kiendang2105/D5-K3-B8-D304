# AI Tutor giải thích vùng slide — Nhóm [XX] · Zone B8

**Hướng:** A — VLearn · **Loại:** Tối ưu tính năng có sẵn (AI tutor)

> **Lát cắt:** Học viên chọn một vùng hình ảnh trên một slide, AI Tutor tự nhận diện và giải thích riêng vùng đó theo ngữ cảnh bài học.

Khi gặp sơ đồ, biểu đồ hoặc hình minh hoạ trong slide, học viên không nhờ được AI Tutor giải thích vì tutor chưa đọc được hình ảnh và chưa nhận biết được vùng nội dung được chọn.

> 👉 **Vào nhóm giữa chừng, hoặc lâu chưa mở repo?** Đọc [STATUS.md](STATUS.md) — đang làm gì, đang dở chỗ nào, nhảy vào đâu.

## Thành viên & phân công

> ⚠️ **Điền tên thật trước khi nộp** — R7 cho 1 điểm cho việc phân công có tên người cho từng phần. Mỗi người phải hiểu rõ phần mình phụ trách và có thể giải thích được khi được hỏi ở CP5.

| Mã HV | Tên thành viên | Vai trò | Phụ trách chính | File/area chịu trách nhiệm |
|---|---|---|---|---|
| HV01 | Đặng Trung Kiên (2A202601887) | Product Lead & Integration | Định hướng sản phẩm, viết spec, điều phối nhóm, kết nối research–kỹ thuật và tổng hợp nội dung demo | [README.md](README.md) · [spec.md](spec.md) · [STATUS.md](STATUS.md) · [reflection/dang-trung-kien.md](reflection/dang-trung-kien.md) |
| HV02 | [Tên thành viên 2] | Research & Validation | Tổng hợp khảo sát K3 AI Thực Chiến, mining chatlog, user test, feedback và đối chiếu bằng chứng với rubric | [docs/survey-log.md](docs/survey-log.md) · [docs/mining-log.md](docs/mining-log.md) · [validation/feedback-log.md](validation/feedback-log.md) · [reflection/thanh-vien-02.md](reflection/thanh-vien-02.md) |
| HV03 | [Tên thành viên 3] | Technical Build & Evaluation | Xây dựng frontend/backend, prompt, tích hợp AI thật, lưu trace và vận hành golden set qua các lượt chạy | [codebase/web/](codebase/web/) · [codebase/server/](codebase/server/) · [eval/](eval/) · [reflection/thanh-vien-03.md](reflection/thanh-vien-03.md) |

## Chạy prototype

```bash
# Cách 1 — slide mẫu, không cần cài gì
mở codebase/web/index.html bằng trình duyệt

# Cách 2 — đầy đủ (mở PDF thật + gọi AI thật) — chạy từ GỐC REPO
cd <đường dẫn tới gốc repo>
python -m http.server 8765
# app:    http://localhost:8765/codebase/web/index.html
# runner: http://localhost:8765/eval/runner.html
```

Chi tiết phần nào mock / phần nào thật: [codebase/README.md](codebase/README.md).

## Cấu trúc repo

```
├── README.md              ← file này: thành viên + phân công
├── STATUS.md              ← đang làm gì / dở chỗ nào / việc còn trống
├── spec.md                ← AI Spec (hạn cứng 23:59 N1)
├── demo-slides.pdf        ← slide 6 trang
├── codebase/              ← prototype
│   ├── web/               ← slide viewer + khoanh vùng + panel giải thích
│   └── server/            ← quyết định AI trung tâm + prompt + trace
├── eval/                  ← golden set + kết quả các lượt chạy
├── validation/            ← feedback log từ user test
├── reflection/            ← mỗi người 1 file
└── docs/                  ← canvas CP1 + log khảo sát
```

## Trạng thái theo checkpoint

| Mốc | Artifact | Trạng thái |
|---|---|---|
| CP1 · Canvas | [docs/canvas-cp1.md](docs/canvas-cp1.md) | ✅ |
| CP2 · Bấm được | [codebase/](codebase/) | ✅ flow chính bấm hết được |
| CP3 · AI thật + đo lượt đầu | `codebase/server/traces/` · [eval/run-01.md](eval/run-01.md) | ⬜ chưa bật AI thật |
| CP4 · Spec chốt | [spec.md](spec.md) | ⬜ đang viết |
| CP5 · Validation + dry run | [validation/feedback-log.md](validation/feedback-log.md) | ⬜ |
| CP6 · Demo | `demo-slides.pdf` | ⬜ |

## Bằng chứng đã có

- **Khảo sát n=23:** 13/23 (56,5%) cho biết AI Tutor chưa đọc được ảnh slide · 11/23 (47,8%) cho biết khi chọn nội dung trên slide, AI không nhận biết được phần cần giải thích. Log đầy đủ: [docs/survey-log.md](docs/survey-log.md).
- **Mining chatlog:** 46,2% lượt trả lời của tutor có `citations` rỗng (1.261 turn, 22–29/07). Xem [spec.md](spec.md) §1.

## Lưu ý dữ liệu

Repo này **không chứa data pack** của khoá. Slide mẫu trong `codebase/web/lib/mock-data.js` là SVG tự dựng. Golden set trích dẫn bằng mã đoạn (`[Txx-NNN]`, `C0xxx`) thay vì dán nguyên văn dài. Không commit API key.
