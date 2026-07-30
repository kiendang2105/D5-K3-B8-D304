#!/usr/bin/env python3
"""
Server tĩnh để chạy thử tại chỗ.

Khác `python -m http.server` đúng một điểm, nhưng là điểm quan trọng khi đang
sửa code liên tục: **tắt cache**. Trình duyệt giữ JS cũ trong memory cache và
không hỏi lại server, nên sửa xong tải lại trang vẫn thấy hành vi cũ, rất dễ
tưởng là code không chạy.

Chạy:  python deploy/devserver.py [cổng]
Mặc định cổng 8080, phục vụ từ gốc repo.

  App:    http://localhost:8080/codebase/web/index.html
  Runner: http://localhost:8080/eval/runner.html

Dừng: Ctrl+C

Đây là server CHO MÁY MÌNH, không phải để deploy. Bản deploy dùng
`deploy/build.py` dựng `dist/` theo danh sách trắng.
"""

import http.server
import sys
from pathlib import Path

# Console Windows mặc định là cp1252, in tiếng Việt là crash ngay dòng đầu.
# Ép UTF-8 trước khi in bất cứ thứ gì.
for stream in (sys.stdout, sys.stderr):
    try:
        stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

ROOT = Path(__file__).resolve().parent.parent
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=str(ROOT), **k)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):
        # Chỉ in lỗi, không in mọi request cho đỡ rác terminal
        if args and str(args[1]).startswith(("4", "5")):
            sys.stderr.write("%s %s\n" % (args[1], args[0]))


if __name__ == "__main__":
    print("Phục vụ %s tại http://localhost:%d" % (ROOT, PORT))
    print("  App:    http://localhost:%d/codebase/web/index.html" % PORT)
    print("  Runner: http://localhost:%d/eval/runner.html" % PORT)
    print("Cache đã tắt. Ctrl+C để dừng.")
    try:
        http.server.ThreadingHTTPServer(("127.0.0.1", PORT), NoCacheHandler).serve_forever()
    except KeyboardInterrupt:
        print("\nĐã dừng.")
