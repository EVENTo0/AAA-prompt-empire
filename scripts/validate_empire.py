#!/usr/bin/env python3
"""Validate AAA+ Engineering Empire governance, skills, agents and hygiene.

Uses only the Python standard library so it can run in CI, cloud development
containers, or a minimal checkout without bootstrapping project dependencies.
"""
from __future__ import annotations

import re
import sys
import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKILL_ROOTS = [ROOT / ".agents" / "skills", ROOT / ".claude" / "skills"]
LEGACY_SKILL_ROOT = ROOT / ".codex" / "skills"
CODEX_AGENT_ROOT = ROOT / ".codex" / "agents"
CLAUDE_AGENT_ROOT = ROOT / ".claude" / "agents"
SKILL_NAME_RE = re.compile(r"^[a-z0-9][a-z0-9-]{0,63}$")
CLAUDE_AGENT_NAME_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
CODEX_AGENT_NAME_RE = re.compile(r"^[a-z0-9]+(?:[_-][a-z0-9]+)*$")

CORE_SKILLS = {
    "empire-orchestrator",
    "project-intake-audit",
    "stack-architecture-router",
    "vertical-slice-builder",
    "web-delivery",
    "mobile-delivery",
    "native-platform-delivery",
    "backend-data-cloud",
    "ai-agent-engineering",
    "game-xr-simulation",
    "security-privacy-audit",
    "qa-release-readiness",
    "performance-accessibility",
    "cloud-preview-phone",
    "dependency-upgrade-debug",
}

CODEX_AGENTS = {
    "code_mapper",
    "solution_architect",
    "product_ux",
    "web_builder",
    "mobile_builder",
    "native_platform",
    "backend_data",
    "ai_engineer",
    "game_simulation",
    "security_reviewer",
    "qa_verifier",
    "performance_reliability",
    "release_engineer",
    "red_team_reviewer",
}
CLAUDE_AGENTS = {name.replace("_", "-") for name in CODEX_AGENTS}

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
    lines = raw.splitlines()
    if not lines or lines[0].strip() != "---":
        return {}, [f"{path.relative_to(ROOT)}: missing YAML frontmatter"]
    try:
        end = next(i for i in range(1, len(lines)) if lines[i].strip() == "---")
    except StopIteration:
        return {}, [f"{path.relative_to(ROOT)}: unterminated YAML frontmatter"]

    meta: dict[str, str] = {}
    for line in lines[1:end]:
        if not line.strip() or line.lstrip().startswith("#") or ":" not in line:
            continue
        key, value = line.split(":", 1)
        meta[key.strip()] = value.strip().strip('"').strip("'")
    return meta, errors


def validate_skills() -> tuple[list[str], set[str], set[str]]:
    errors: list[str] = []
    canonical_names: set[str] = set()
    claude_names: set[str] = set()

    for root in SKILL_ROOTS:
        if not root.exists():
            errors.append(f"missing required skill root: {root.relative_to(ROOT)}")
            continue
        local_seen: set[str] = set()
        for path in sorted(root.glob("*/SKILL.md")):
            meta, local_errors = parse_frontmatter(path)
            errors.extend(local_errors)
            name = meta.get("name") or path.parent.name
            description = meta.get("description", "")
            if not SKILL_NAME_RE.fullmatch(name):
                errors.append(f"{path.relative_to(ROOT)}: invalid skill name {name!r}")
            if not description:
                errors.append(f"{path.relative_to(ROOT)}: description is required")
            if len(description) > 1024:
                errors.append(f"{path.relative_to(ROOT)}: description exceeds 1024 characters")
            if name in local_seen:
                errors.append(f"duplicate skill name {name!r} under {root.relative_to(ROOT)}")
            local_seen.add(name)
            if root.parent.name == ".agents":
                canonical_names.add(name)
            elif root.parent.name == ".claude":
                claude_names.add(name)

    for name in sorted(canonical_names - claude_names):
        errors.append(f"canonical skill {name!r} has no Claude project mirror")
    for name in sorted(claude_names - canonical_names):
        errors.append(f"Claude skill {name!r} has no canonical Agent Skill")
    for name in sorted(CORE_SKILLS - canonical_names):
        errors.append(f"missing required core skill: {name}")

    if LEGACY_SKILL_ROOT.exists():
        for path in LEGACY_SKILL_ROOT.glob("*/SKILL.md"):
            meta, local_errors = parse_frontmatter(path)
            errors.extend(local_errors)
            if not meta.get("name") or not meta.get("description"):
                errors.append(f"{path.relative_to(ROOT)}: legacy skill must still define name and description")
    return errors, canonical_names, claude_names


def validate_codex_agents() -> list[str]:
    errors: list[str] = []
    if not CODEX_AGENT_ROOT.exists():
        return ["missing .codex/agents"]
    found: set[str] = set()
    for path in sorted(CODEX_AGENT_ROOT.glob("*.toml")):
        try:
            data = tomllib.loads(path.read_text(encoding="utf-8"))
        except (tomllib.TOMLDecodeError, OSError) as exc:
            errors.append(f"{path.relative_to(ROOT)}: invalid TOML: {exc}")
            continue
        name = data.get("name", "")
        description = data.get("description", "")
        instructions = data.get("developer_instructions", "")
        if not CODEX_AGENT_NAME_RE.fullmatch(name):
            errors.append(f"{path.relative_to(ROOT)}: invalid Codex agent name {name!r}")
        if not description:
            errors.append(f"{path.relative_to(ROOT)}: description is required")
        if not instructions:
            errors.append(f"{path.relative_to(ROOT)}: developer_instructions is required")
        found.add(name)
    for name in sorted(CODEX_AGENTS - found):
        errors.append(f"missing required Codex agent: {name}")
    return errors


def validate_claude_agents(claude_skills: set[str]) -> list[str]:
    errors: list[str] = []
    if not CLAUDE_AGENT_ROOT.exists():
        return ["missing .claude/agents"]
    found: set[str] = set()
    for path in sorted(CLAUDE_AGENT_ROOT.glob("*.md")):
        meta, local_errors = parse_frontmatter(path)
        errors.extend(local_errors)
        name = meta.get("name", "")
        description = meta.get("description", "")
        if not CLAUDE_AGENT_NAME_RE.fullmatch(name):
            errors.append(f"{path.relative_to(ROOT)}: Claude agent name must use lowercase letters/numbers and hyphens: {name!r}")
        if not description:
            errors.append(f"{path.relative_to(ROOT)}: description is required")
        if meta.get("model") not in (None, "", "inherit"):
            errors.append(f"{path.relative_to(ROOT)}: Empire agents should inherit the session model unless an evaluated exception is documented")
        for skill in [s.strip() for s in meta.get("skills", "").split(",") if s.strip()]:
            if skill not in claude_skills:
                errors.append(f"{path.relative_to(ROOT)}: references missing Claude skill {skill!r}")
        found.add(name)
    for name in sorted(CLAUDE_AGENTS - found):
        errors.append(f"missing required Claude agent: {name}")
    return errors


def validate_required_files() -> list[str]:
    required = [
        "AGENTS.md",
        "CLAUDE.md",
        ".codex/config.toml",
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
    skill_errors, _canonical, claude_skills = validate_skills()
    errors = (
        validate_required_files()
        + skill_errors
        + validate_codex_agents()
        + validate_claude_agents(claude_skills)
        + validate_secret_hygiene()
    )
    if errors:
        print("EMPIRE GUARD: FAILED")
        for error in errors:
            print(f"- {error}")
        return 1
    print("EMPIRE GUARD: PASSED")
    print(f"Validated {len(CORE_SKILLS)} mirrored core skills, {len(CODEX_AGENTS)} Codex agents, {len(CLAUDE_AGENTS)} Claude agents, governance files, and basic secret hygiene.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
