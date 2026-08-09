"""Temporary cleanup: strip stray </content> markers from all .py files in ml/."""
from pathlib import Path

root = Path(__file__).resolve().parent
changed = []
for py in root.rglob("*.py"):
    if py.name in {"cleanup.py", "fix_indent.py"}:
        continue
    lines = py.read_text(encoding="utf-8").splitlines(keepends=True)
    kept = [l for l in lines if l.strip() != "</content>"]
    if len(kept) != len(lines):
        py.write_text("".join(kept), encoding="utf-8")
        changed.append(str(py))
print("Stripped </content> from:", changed if changed else "nothing")
