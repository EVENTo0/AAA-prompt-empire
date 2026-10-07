#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path

ALLOWED = {
    "android": {"apk", "aab"},
    "windows": {"msi", "nsis"},
}

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("evidence")
    args = parser.parse_args()

    path = Path(args.evidence)
    data = json.loads(path.read_text(encoding="utf-8"))

    errors: list[str] = []
    if data.get("version") != 1:
        errors.append("version must be 1")
    platform = data.get("platform")
    if platform not in ALLOWED:
        errors.append("invalid platform")
    if data.get("verified") is not True:
        errors.append("verified must be true")
    if data.get("release_authority") is not False:
        errors.append("signing evidence must not grant release authority")
    source_sha = data.get("source_sha", "")
    if len(source_sha) != 40 or any(ch not in "0123456789abcdef" for ch in source_sha):
        errors.append("invalid source_sha")
    artifacts = data.get("artifacts", [])
    if not artifacts:
        errors.append("artifacts missing")
    for item in artifacts:
        if item.get("artifact_type") not in ALLOWED.get(platform, set()):
            errors.append(f"invalid artifact type: {item.get('artifact_type')}")
        if item.get("signed") is not True:
            errors.append("artifact must be signed")
        digest = item.get("sha256", "")
        if len(digest) != 64 or any(ch not in "0123456789abcdef" for ch in digest):
            errors.append(f"invalid sha256 for {item.get('path')}")
        if not isinstance(item.get("bytes"), int) or item.get("bytes", 0) <= 0:
            errors.append(f"invalid byte size for {item.get('path')}")

    if platform == "android":
        types = {x.get("artifact_type") for x in artifacts}
        if not {"apk", "aab"} <= types:
            errors.append("Android evidence must include signed APK and AAB")
    if platform == "windows":
        types = {x.get("artifact_type") for x in artifacts}
        if not {"msi", "nsis"} <= types:
            errors.append("Windows evidence must include signed MSI and NSIS")

    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        return 1
    print("EVENTO SIGNING EVIDENCE: PASSED")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
