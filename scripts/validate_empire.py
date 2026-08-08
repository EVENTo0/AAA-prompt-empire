#!/usr/bin/env python3
"""Validate AAA+ Engineering Empire governance and Agent Skill metadata.

Uses only the Python standard library so it can run in CI, Codespaces, or a
minimal development container without bootstrapping project dependencies.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKILL_ROOTS = [ROOT / ".agents" / "skills", ROOT / ".claude" / "skills"]
LEGACY_ROOT = ROOT / ".codex" / "skills"
NAME_RE = re.compile(r"^[a-z0-9][a-z0-9-]{0,63}$")
FORBIDDEN_NAMES = {
    ".env",
    ".env.local",
    "id_rsa",
    "id_ed25519",
    "credentials.json",
    "service-account.json",
}
SECRET_PATTERNS = [
    re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    re.compile(r"\bghp_[A-Za-z0-9]{30,}\b"),
    re.compile(r"\bgithub_pat_[A-Za-z0-9_]{30,}\b"),
    re.compile(r"\bsk-proj-[A-Za-z0-9_-]{20,}\b"),
]


def parse_frontmatter(path: Path) -> tuple[dict[str, str], list[str]]:
    errors: list[str] = []
    raw = path.read_text(encoding="utf-8-sig")
    if raw.startswith("\ufeff"):
        errors.append(f"{path}: UTF-8 BOM is not allowed")
    lines = raw.splitlines()
    if not lines or lines[0].strip() != "---":
        return {}, [f"{path}: missing YAML frontmatter"]
    try:
        end = next(i for i in range(1, len(lines)) if lines[i].strip() == "---")
    except StopIteration:
        return {}, [f"{path}: unterminated YAML frontmatter"]

    meta: dict[str, str] = {}
    for line in lines[1:end]:
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        value = value.strip().strip('"').strip("'")
        meta[key.strip()] = value
    return meta, errors


def validate_skills() -> list[str]:
    errors: list[str] = []
    seen: dict[str, Path] = {}
    canonical_names: set[str] = set()
    claude_names: set[str] = set()

    for root in SKILL_ROOTS:
        if not root.exists():
            errors.append(f"missing required skill root: {root.relative_to(ROOT)}")
            continue
        for path in sorted(root.glob("*/SKILL.md")):
            meta, local_errors = parse_frontmatter(path)
            errors.extend(local_errors)
            name = meta.get("name") or path.parent.name
            description = meta.get("description", "")
            if not NAME_RE.fullmatch(name):
                errors.append(f"{path}: invalid skill name {name!r}")
            if not description:
                errors.append(f"{path}: description is required")
            if len(description) > 1024:
                errors.append(f"{path}: description exceeds 1024 characters")
            if name in seen and seen[name].parents[1] == path.parents[1]:
                errors.append(f"duplicate skill name {name!r}: {seen[name]} and {path}")
            seen[name] = path
            if root.name == "skills" and root.parent.name == ".agents":
                canonical_names.add(name)
            elif root.parent.name == ".claude":
                claude_names.add(name)

    missing_claude = canonical_names - claude_names
    missing_canonical = claude_names - canonical_names
    for name in sorted(missing_claude):
        errors.append(f"canonical skill {name!r} has no Claude project mirror")
    for name in sorted(missing_canonical):
        errors.append(f"Claude skill {name!r} has no canonical Agent Skill")

    if LEGACY_ROOT.exists():
        for path in LEGACY_ROOT.glob("*/SKILL.md"):
            # Legacy content is tolerated during migration but must still be valid.
            meta, local_errors = parse_frontmatter(path)
            errors.extend(local_errors)
            if len(meta.get("description", "")) > 1024:
                errors.append(f"{path}: legacy description exceeds 1024 characters")
    return errors


def validate_required_files() -> list[str]:
    required = [
        "AGENTS.md",
        "CLAUDE.md",
        ".github/CODEOWNERS",
        ".github/workflows/empire-guard.yml",
        "docs/security/REPOSITORY_LOCKDOWN.md",
        "docs/mobile/MOBILE_FIRST_OPERATING_MODEL.md",
        "docs/architecture/TECHNOLOGY_RADAR.md",
        "docs/organization/AGENT_CATALOG.md",
    ]
    return [f"missing required file: {path}" for path in required if not (ROOT / path).exists()]


def validate_secret_hygiene() -> list[str]:
    errors: list[str] = []
    ignored_dirs = {".git", "node_modules", ".next", "dist", "build", ".venv", "venv"}
    for path in ROOT.rglob("*"):
        if not path.is_file() or any(part in ignored_dirs for part in path.parts):
            continue
        if path.name in FORBIDDEN_NAMES:
            errors.append(f"forbidden secret-like file committed: {path.relative_to(ROOT)}")
            continue
        if path.stat().st_size > 1_000_000:
            continue
        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        for pattern in SECRET_PATTERNS:
            if pattern.search(text):
                errors.append(f"possible secret/private key in {path.relative_to(ROOT)}")
    return errors


def main() -> int:
    errors = validate_required_files() + validate_skills() + validate_secret_hygiene()
    if errors:
        print("EMPIRE GUARD: FAILED")
        for error in errors:
            print(f"- {error}")
        return 1
    print("EMPIRE GUARD: PASSED")
    print("Governance files, skill metadata, mirror coverage, and basic secret hygiene validated.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
