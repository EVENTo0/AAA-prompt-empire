#!/usr/bin/env python3
import argparse, datetime as dt, json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ALLOWED = {"runner", "toolchain", "model"}

def validate(path: Path, today: dt.date) -> list[str]:
    data = json.loads(path.read_text(encoding="utf-8"))
    errors, seen = [], set()
    if data.get("policy", {}).get("corePromotion") != "prohibited-by-this-change":
        errors.append("core promotion must remain prohibited")
    for item in data.get("components", []):
        ident = item.get("id")
        if not ident or ident in seen: errors.append(f"duplicate or missing component id: {ident!r}")
        seen.add(ident)
        if item.get("category") not in ALLOWED: errors.append(f"{ident}: invalid category")
        for key in ("selection", "owner", "evidence", "reviewBy"):
            if not item.get(key): errors.append(f"{ident}: missing {key}")
        try:
            if dt.date.fromisoformat(item["reviewBy"]) < today: errors.append(f"{ident}: lifecycle review expired")
        except (KeyError, ValueError): errors.append(f"{ident}: invalid reviewBy")
    if {x.get("category") for x in data.get("components", [])} != ALLOWED:
        errors.append("runner, toolchain, and model coverage are all required")
    return errors

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", type=Path, default=ROOT / "registry/runtime-lifecycle.json")
    parser.add_argument("--today", type=dt.date.fromisoformat, default=dt.date.today())
    args = parser.parse_args()
    failures = validate(args.file, args.today)
    if failures:
        print("Runtime lifecycle preflight failed:")
        print("\n".join(f"- {failure}" for failure in failures))
        raise SystemExit(1)
    print("Runtime lifecycle preflight passed.")
