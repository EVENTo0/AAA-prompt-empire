#!/usr/bin/env python3
"""Build a minimal EVENTO agent Context Pack from local memory JSON files."""
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

AUTHORITATIVE = {"verified", "active"}

def load_items(root: Path) -> list[dict]:
    items: list[dict] = []
    for p in root.rglob("*.json"):
        if p.name.endswith(".schema.json"):
            continue
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            continue
        if isinstance(data, dict) and "memory_type" in data:
            items.append(data)
        elif isinstance(data, list):
            items.extend(x for x in data if isinstance(x, dict) and "memory_type" in x)
    return items

def score(item: dict, task: str, domain: str | None, project_id: str | None) -> int:
    hay = " ".join(str(item.get(k, "")) for k in ("title","summary","rule","trigger","domain")).lower()
    s = sum(2 for token in set(task.lower().split()) if len(token) > 2 and token in hay)
    if domain and item.get("domain") == domain:
        s += 6
    if project_id and item.get("project_id") == project_id:
        s += 5
    if item.get("scope") == "evento_shared":
        s += 2
    if item.get("validation_state") in AUTHORITATIVE:
        s += 3
    return s

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("task")
    ap.add_argument("--memory-dir", default="memory/items")
    ap.add_argument("--project-id")
    ap.add_argument("--domain")
    ap.add_argument("--limit", type=int, default=8)
    ap.add_argument("--out", default=".agent/context/current-task.json")
    args = ap.parse_args()

    items = load_items(Path(args.memory_dir))
    items = [x for x in items if x.get("validation_state") in AUTHORITATIVE]
    ranked = sorted(items, key=lambda x: score(x,args.task,args.domain,args.project_id), reverse=True)

    groups = {
        "fact":"facts","decision":"decisions","rule":"rules","lesson":"lessons",
        "pattern":"patterns","anti_pattern":"anti_patterns"
    }
    pack = {
        "task": args.task,
        "project_id": args.project_id,
        "domain": args.domain,
        "facts": [], "decisions": [], "rules": [], "lessons": [], "patterns": [], "anti_patterns": [],
        "generated_at": datetime.now(timezone.utc).isoformat()
    }
    for item in ranked:
        key = groups.get(item.get("memory_type"))
        if key and len(pack[key]) < args.limit:
            pack[key].append(item)

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(pack, ensure_ascii=False, indent=2), encoding="utf-8")
    print(out)
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
