#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path

TYPE_BY_SUFFIX = {
    ".apk": "apk",
    ".aab": "aab",
    ".msi": "msi",
    ".exe": "nsis",
}

def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--platform", choices=("android", "windows"), required=True)
    parser.add_argument("--workflow", required=True)
    parser.add_argument("--verification-method", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("artifacts", nargs="+")
    args = parser.parse_args()

    source_sha = os.environ.get("GITHUB_SHA", "").strip().lower()
    run_id = os.environ.get("GITHUB_RUN_ID", "").strip()
    if len(source_sha) != 40 or any(ch not in "0123456789abcdef" for ch in source_sha):
        raise SystemExit("GITHUB_SHA must be a 40-character commit SHA")
    if not run_id:
        raise SystemExit("GITHUB_RUN_ID is required")

    records = []
    for raw in args.artifacts:
        path = Path(raw)
        if not path.is_file():
            raise SystemExit(f"artifact missing: {path}")
        artifact_type = TYPE_BY_SUFFIX.get(path.suffix.lower())
        if artifact_type is None:
            raise SystemExit(f"unsupported signed artifact type: {path}")
        if args.platform == "android" and artifact_type not in {"apk", "aab"}:
            raise SystemExit(f"invalid Android artifact type: {artifact_type}")
        if args.platform == "windows" and artifact_type not in {"msi", "nsis"}:
            raise SystemExit(f"invalid Windows artifact type: {artifact_type}")
        records.append({
            "path": path.name,
            "artifact_type": artifact_type,
            "bytes": path.stat().st_size,
            "sha256": sha256(path),
            "signed": True,
        })

    evidence = {
        "version": 1,
        "platform": args.platform,
        "source_sha": source_sha,
        "workflow": args.workflow,
        "run_id": run_id,
        "verified": True,
        "release_authority": False,
        "verification_method": args.verification_method,
        "artifacts": records,
    }

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(evidence, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(out)
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
