# Deploy lên Cloudflare Pages

## Nguyên tắc: KHÔNG deploy thẳng gốc repo

Cloudflare Pages phục vụ **nguyên** thư mục output. Repo này có track data pack
của khoá:

| File | Kích thước |
|---|---|
| `data/vlearn-pack/chatlog/chat_history_anonymized_for_hackathon.csv` | 1,9 MB — 1.261 lượt chat của học viên |
| `data/vlearn-pack/transcript/transcript-0*.md` | 6 file, ~610 KB |
| `data/vlearn-pack/slides/d*-slide-hackathon.pdf` | 12 MB slide bài giảng |
| `codebase/server/traces/*.json` | log request/response AI, có câu hỏi nguyên văn từ chatlog |

Trỏ output vào gốc repo là mọi file trên thành **link tải công khai**, ai có URL
cũng lấy được — vi phạm quy định bảo mật dữ liệu được cấp
([01-de-bai.md](../01-de-bai.md) mục 3).

Vì vậy có bước build: [`deploy/build.py`](build.py) dựng `dist/` theo **danh
sách trắng** — chỉ thứ khai trong `ALLOW` mới được copy, thêm file mới vào repo
cũng không tự lọt ra. Cuối script còn soát lại `dist/` và **thoát mã lỗi** nếu
thấy bất kỳ `.pdf`, `.csv` hay file trace nào.

```bash
python deploy/build.py
# dist/: 17 file · 1519 KB
# Khong co PDF / CSV / trace nao trong dist.
```

`dist/` đã nằm trong `.gitignore` — không commit, sinh lại khi cần.

## Cách 1 — nối GitHub, không cần cài gì *(khuyến nghị)*

Máy đang dùng **chưa có Node.js** nên không chạy được `wrangler`. Đường này làm
hết trên trình duyệt:

1. Commit & push nhánh hiện tại lên GitHub.
2. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** →
   **Create** → **Pages** → **Connect to Git** → chọn repo.
3. Điền đúng 3 ô:

   | Ô | Giá trị |
   |---|---|
   | Framework preset | `None` |
   | Build command | `python deploy/build.py` |
   | Build output directory | `dist` |

4. **Save and Deploy.** Ra URL dạng `https://<tên-project>.pages.dev`.

Mỗi lần push là Cloudflare tự build lại — bước lọc chạy lại theo, không có
đường nào để data pack lọt ra.

## Cách 2 — wrangler CLI

Cần cài [Node.js](https://nodejs.org) trước (máy hiện chưa có).

```bash
python deploy/build.py
npx wrangler pages deploy dist --project-name=vlearn-tutor-b8
```

Lần đầu `wrangler` mở trình duyệt để đăng nhập Cloudflare.

## Bản deploy chạy được tới đâu

| Phần | Trên `.pages.dev` |
|---|---|
| Slide mẫu (mock) + click nhận diện vùng + nhánh quét ảnh | ✅ chạy đủ |
| Mở PDF của chính người dùng (nút *Mở PDF khác…*) | ✅ file nằm trong trình duyệt, không upload đi đâu |
| Nút **Slide buổi 1 / buổi 2** | ❌ 404 — slide khoá cố tình không deploy. App báo rõ lý do thay vì lỗi im lặng |
| Gọi AI thật | ✅ nếu người xem tự nhập key của họ (nút **API key**, lưu ở `localStorage` trình duyệt họ) |
| Runner golden set (`eval/`) | ❌ không deploy — là artifact chấm điểm, chạy ở máy |

## Trước khi đưa link cho người ngoài

- [ ] Mở URL ở cửa sổ ẩn danh, thử tải
      `/data/vlearn-pack/chatlog/chat_history_anonymized_for_hackathon.csv`
      → phải ra **404**.
- [ ] Thử `/server/traces/traces-run03.json` → phải ra **404**.
- [ ] Kiểm không có API key nào trong `dist/` (key chỉ sống ở `localStorage`,
      không bao giờ vào file).
