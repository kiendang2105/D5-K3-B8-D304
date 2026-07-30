# -*- coding: utf-8 -*-
"""
Mining chatlog VLearn tutor — sinh lại toàn bộ số trong docs/mining-log.md.

Chạy:  python docs/mining.py
(Cần data pack ở data/vlearn-pack/chatlog/ — không commit vào repo nộp bài.)

Nguyên tắc: chỉ ĐỌC, không sửa dữ liệu. Mọi con số in ra kèm quy tắc đếm để
người ngoài nhóm chạy lại ra cùng kết quả (yêu cầu chuẩn B, rubric R1).
"""
import csv
import io
import os
import re
import sys

CSV = os.path.join("data", "vlearn-pack", "chatlog",
                   "chat_history_anonymized_for_hackathon.csv")

# Tiền tố nền tảng chèn vào câu hỏi: (Trang N, đoạn được chọn: "...")
PREFIX = re.compile(r'^\(Trang\s*(\d+),\s*đoạn được chọn:\s*"(.*?)"\)\s*(.*)$', re.S)

# Tiêu chí LỎNG: bất kỳ từ nào gợi tới nội dung trực quan.
# Cho con số lớn nhưng lẫn nhiều "tóm tắt slide này" -> không dùng làm số công bố.
VISUAL_LOOSE = re.compile(
    r"(sơ đồ|so do|biểu đồ|bieu do|hình|hinh|ảnh|bảng|mô hình|mo hinh|flow|diagram"
    r"|chart|graph|đồ thị|do thi|lưu đồ|luu do|minh hoạ|minh hoa|slide này|trong slide"
    r"|ở slide|infographic|khung|mũi tên|mui ten|trục|truc |cột |cot )", re.I)

# Tiêu chí CHẶT: phải là danh từ chỉ ĐÚNG một đối tượng trực quan.
# Loại "slide này"/"trong slide" vì đó là yêu cầu tóm tắt cả trang.
VISUAL_TIGHT = re.compile(
    r"(sơ đồ|biểu đồ|đồ thị|lưu đồ|hình vẽ|hình ảnh|hình minh họa|hình minh hoạ"
    r"|bức hình|cái hình|hình này|hình trên|bảng này|bảng trên|mô hình này|mũi tên"
    r"|trục tung|trục hoành|diagram|flowchart|chart này|graph này|ảnh này)", re.I)

EMPTY_CITATIONS = ("[]", "")


def load_turns(path):
    """Ghép theo turn_id -> [(turn_id, dòng student, dòng tutor)]."""
    by_turn = {}
    with io.open(path, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            by_turn.setdefault(row["turn_id"], {})[row["role"]] = row
    return [(k, v["student"], v["tutor"]) for k, v in by_turn.items()
            if "student" in v and "tutor" in v]


def pct(a, b):
    return "%.1f%%" % (100.0 * a / b) if b else "—"


def main():
    if not os.path.exists(CSV):
        sys.exit("Không tìm thấy %s — cần data pack trên máy." % CSV)

    turns = load_turns(CSV)
    tutors = [t for _, _, t in turns]
    print("Turn ghép được: %d" % len(turns))

    # --- 1. Grounding ---
    empty = sum(1 for t in tutors
                if (t["citations"] or "").strip() in EMPTY_CITATIONS)
    print("\n[1] Tutor trả lời không có citations: %d/%d = %s"
          % (empty, len(tutors), pct(empty, len(tutors))))

    # --- 2. Nền tảng truyền gì ---
    with_prefix, empty_sel, sel_lens = 0, 0, []
    for _, s, _ in turns:
        m = PREFIX.match((s["content"] or "").strip())
        if not m:
            continue
        with_prefix += 1
        sel = m.group(2).strip()
        sel_lens.append(len(sel))
        if not sel:
            empty_sel += 1
    sel_lens.sort()
    print("\n[2] Turn có tiền tố '(Trang N, đoạn được chọn: ...)': %d/%d = %s"
          % (with_prefix, len(turns), pct(with_prefix, len(turns))))
    print("    Turn không có tiền tố (gõ tay): %d" % (len(turns) - with_prefix))
    print("    Đoạn chọn rỗng: %d" % empty_sel)
    if sel_lens:
        p90 = sel_lens[int(len(sel_lens) * 0.9)]
        print("    Độ dài đoạn chọn: min=%d median=%d p90=%d max=%d"
              % (sel_lens[0], sel_lens[len(sel_lens) // 2], p90, sel_lens[-1]))
        short = [n for n in sel_lens if n <= 15]
        print("    Đoạn chọn <=15 ký tự: %d/%d = %s"
              % (len(short), len(sel_lens), pct(len(short), len(sel_lens))))

    # --- 3. Câu hỏi về nội dung trực quan: lỏng vs chặt ---
    for name, rx, use_prefix_only in (
        ("LỎNG (toàn bộ content)", VISUAL_LOOSE, False),
        ("CHẶT (đoạn chọn + phần gõ thêm)", VISUAL_TIGHT, True),
    ):
        hits = []
        for tid, s, t in turns:
            m = PREFIX.match((s["content"] or "").strip())
            if use_prefix_only and m:
                text = m.group(2) + " " + m.group(3)
            else:
                text = s["content"] or ""
            if rx.search(text):
                hits.append((tid, s, t))
        nocit = [h for h in hits
                 if (h[2]["citations"] or "").strip() in EMPTY_CITATIONS]
        print("\n[3] Tiêu chí %s" % name)
        print("    Hỏi về nội dung trực quan: %d/%d = %s"
              % (len(hits), len(turns), pct(len(hits), len(turns))))
        print("    Trong đó citations rỗng: %d/%d = %s"
              % (len(nocit), len(hits), pct(len(nocit), len(hits))))
        if use_prefix_only:
            print("    Danh sách đầy đủ (mã + trang + trích ngắn):")
            for tid, s, t in hits:
                m = PREFIX.match((s["content"] or "").strip())
                page = m.group(1) if m else "?"
                snippet = " ".join(((m.group(2) if m else s["content"]) or "").split())[:60]
                print("      %s/%s tr%-3s cit=%-8s | %s"
                      % (s["conversation_id"], tid, page,
                         (t["citations"] or "[]").strip(), snippet))

    # --- 4. Bối cảnh ---
    misc = sum(1 for t in tutors if (t["misconceptions"] or "").strip() not in EMPTY_CITATIONS)
    check = sum(1 for r in tutors if (r["asked_check_question"] or "") == "True")
    moves = {}
    for t in tutors:
        moves[t["move_used"] or "-"] = moves.get(t["move_used"] or "-", 0) + 1
    print("\n[4] misconceptions từng dùng: %d/%d" % (misc, len(tutors)))
    print("    asked_check_question=True (dòng tutor): %d" % check)
    print("    move_used: %s" % ", ".join(
        "%s=%d" % kv for kv in sorted(moves.items(), key=lambda x: -x[1])))


if __name__ == "__main__":
    main()
