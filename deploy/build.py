#!/usr/bin/env python3
"""
Dựng thư mục `dist/` để deploy lên Cloudflare Pages.

VÌ SAO PHẢI CÓ BƯỚC NÀY, KHÔNG DEPLOY THẲNG GỐC REPO:
repo có track data pack của khoá (chatlog học viên, transcript, slide bài
giảng). Cloudflare Pages phục vụ NGUYÊN thư mục output — trỏ vào gốc repo
là mọi file đó thành link tải công khai, vi phạm quy định bảo mật dữ liệu
được cấp (01-de-bai.md mục 3).

Script này đi theo hướng ngược lại: DANH SÁCH TRẮNG. Chỉ những gì khai
trong ALLOW mới được copy; thêm file mới vào repo cũng không tự lọt ra.

Chạy:  python deploy/build.py
Ra:    dist/   (web/ + server/ + _redirects + _headers)
"""

import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"

# --- Danh sách trắng: (nguồn tính từ gốc repo, đích trong dist) ---
ALLOW = [
    ("codebase/web", "web"),
    ("codebase/server/explain.js", "server/explain.js"),
    ("codebase/server/prompts", "server/prompts"),
]

# Không bao giờ được copy, kể cả nằm trong thư mục đã cho phép.
DENY_NAMES = {".env", ".DS_Store", "node_modules"}
DENY_SUFFIX = {".env"}

# Đường dẫn tuyệt đối cấm xuất hiện trong dist — chốt chặn cuối, kiểm lại
# sau khi copy xong thay vì tin là mình khai đúng.
FORBIDDEN_DIRS = ["data", "eval", "docs", "validation", "reflection",
                  "codebase/server/traces"]


def keep(path: Path) -> bool:
    if path.name in DENY_NAMES:
        return False
    if path.suffix in DENY_SUFFIX:
        return False
    return True


def copy_tree(src: Path, dst: Path) -> int:
    n = 0
    for item in sorted(src.rglob("*")):
        if not item.is_file() or not keep(item):
            continue
        if any(p in DENY_NAMES for p in item.relative_to(src).parts):
            continue
        target = dst / item.relative_to(src)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(item, target)
        n += 1
    return n


def main() -> int:
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir(parents=True)

    total = 0
    for src_rel, dst_rel in ALLOW:
        src = ROOT / src_rel
        dst = DIST / dst_rel
        if not src.exists():
            print(f"THIEU: {src_rel} — bo qua")
            continue
        if src.is_file():
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)
            total += 1
        else:
            total += copy_tree(src, dst)

    # Vào "/" thì mở thẳng app, khỏi phải gõ đường dẫn dài.
    (DIST / "_redirects").write_text("/    /web/index.html    302\n", encoding="utf-8")

    # noindex: đây là prototype của bài tập, không phải sản phẩm công bố —
    # không để nó nằm trong kết quả tìm kiếm.
    (DIST / "_headers").write_text(
        "/*\n"
        "  X-Robots-Tag: noindex, nofollow\n"
        "  X-Content-Type-Options: nosniff\n"
        "  Referrer-Policy: no-referrer\n"
        "\n"
        "/web/vendor/*\n"
        "  Cache-Control: public, max-age=604800\n",
        encoding="utf-8",
    )

    # --- Chốt chặn: soát lại dist thay vì tin vào danh sách trắng ---
    leaked = []
    for f in DIST.rglob("*"):
        if not f.is_file():
            continue
        rel = f.relative_to(DIST).as_posix()
        if rel.endswith(".pdf") or rel.endswith(".csv"):
            leaked.append(rel)
        if "traces" in rel:
            leaked.append(rel)

    size = sum(f.stat().st_size for f in DIST.rglob("*") if f.is_file())
    print(f"dist/: {total + 2} file · {size / 1024:.0f} KB")
    print("Da loai: " + " · ".join(FORBIDDEN_DIRS))

    if leaked:
        print("\nDUNG LAI — co file khong duoc phep trong dist:")
        for r in leaked:
            print("  " + r)
        return 1

    print("Khong co PDF / CSV / trace nao trong dist.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
