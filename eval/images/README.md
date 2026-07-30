# images/ — ảnh vùng chọn dùng làm test case

Mỗi case trong [../golden-set.md](../golden-set.md) có một ảnh vùng crop tương ứng, đặt tên theo ID case:

```
C01.png   C02.png   ...   C22.png
```

## Cách lấy ảnh crop

1. Mở prototype, khoanh đúng vùng của case.
2. Ảnh crop hiện ngay trong bong bóng tin nhắn của học viên ở panel bên phải.
3. Chuột phải → *Lưu ảnh thành…* → đặt tên `C01.png`.

Cách khác (chính xác hơn, lặp lại được): mở DevTools Console và chạy

```js
RegionSelector.selection = { x: 455, y: 95, w: 495, h: 335 };  // toạ độ của case
RegionSelector.draw();
console.log(RegionSelector.crop(RegionSelector.selection));     // copy dataURL
```

Ghi luôn toạ độ `{x, y, w, h}` vào cột "Vùng chọn" của golden set để người khác chạy lại ra đúng ảnh đó.

## Quy định dữ liệu

- Chỉ dùng ảnh từ **slide mẫu tự dựng** hoặc **slide pack được cấp** — không dùng ảnh từ nguồn ngoài, không dùng dữ liệu thật của người thật.
- Không commit nguyên slide deck của khoá vào repo. Ảnh ở đây là **vùng crop nhỏ để minh hoạ test case**, không phải bản sao tài liệu.
