# AI Tutor giải thích vùng slide — Nhóm B8

**Hướng:** A — VLearn · **Loại:** Tính năng mới trên VLearn

> **Lát cắt:** Học viên chọn một vùng hình ảnh trên một slide, AI Tutor tự nhận diện và giải thích riêng vùng đó theo ngữ cảnh bài học.

Khi gặp sơ đồ, biểu đồ hoặc hình minh hoạ trong slide, học viên không nhờ được AI Tutor giải thích vì tutor chưa đọc được hình ảnh và chưa nhận biết được vùng nội dung được chọn.

> 👉 **Vào nhóm giữa chừng, hoặc lâu chưa mở repo?** Đọc [STATUS.md](STATUS.md) — đang làm gì, đang dở chỗ nào, nhảy vào đâu.

## Thành viên & phân công

| Mã học viên | Họ và tên | Vai trò | Phụ trách chính |
| --- | --- | --- | --- |
| 2A202601887 | Đặng Trung Kiên | Trưởng nhóm / Product Lead | Định hướng sản phẩm, viết spec, điều phối nhóm và chuẩn bị demo |
| 2A202601905 | Hán Vũ Long | Research & Evidence | Khảo sát, mining chatlog, xây dựng pain point và user need |
| 2A202601777 | Trần Duy Hoành | Frontend & UX | Xây dựng slide viewer, chọn vùng ảnh và trải nghiệm người dùng |
| 2A202601767 | Lê Quang Đức | Backend / Agent Build | Tích hợp AI, xử lý response, lưu trace và evaluation |

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
