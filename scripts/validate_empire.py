#!/usr/bin/env python3
"""Validate AAA+ Engineering Empire governance, registries, skills, agents, routing and hygiene."""
from __future__ import annotations

import json
import re
import sys
import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CANONICAL_SKILLS = ROOT / ".agents" / "skills"
CLAUDE_SKILLS = ROOT / ".claude" / "skills"
CODEX_AGENTS = ROOT / ".codex" / "agents"
CLAUDE_AGENTS = ROOT / ".claude" / "agents"

SKILL_NAME_RE = re.compile(r"^[a-z0-9][a-z0-9-]{0,63}$")
CODEX_AGENT_NAME_RE = re.compile(r"^[a-z0-9]+(?:[_-][a-z0-9]+)*$")
CLAUDE_AGENT_NAME_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
ALLOWED_PERMISSIONS = {"read", "write_branch", "deploy_preview", "orchestrate"}

FORBIDDEN_NAMES = {".env", ".env.local", "id_rsa", "id_ed25519", "credentials.json", "service-account.json"}
SECRET_PATTERNS = [
    re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    re.compile(r"\bghp_[A-Za-z0-9]{30,}\b"),
    re.compile(r"\bgithub_pat_[A-Za-z0-9_]{30,}\b"),
    re.compile(r"\bsk-proj-[A-Za-z0-9_-]{20,}\b"),
]

REQUIRED_FILES = [
    "AGENTS.md", "CLAUDE.md", ".codex/config.toml", ".github/CODEOWNERS",
    ".github/workflows/empire-guard.yml", "docs/security/REPOSITORY_LOCKDOWN.md",
    "docs/mobile/MOBILE_FIRST_OPERATING_MODEL.md", "docs/architecture/TECHNOLOGY_RADAR.md",
    "docs/organization/AGENT_CATALOG.md", "registry/skills.json", "registry/agents.json",
    "registry/routing.json", "evals/contract-routing.json", "scripts/run_empire_evals.py",
    "docs/architecture/EVALUATED_AGENT_SYSTEM.md",
]

def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))

def parse_frontmatter(path: Path) -> tuple[dict[str, str], str, list[str]]:
    errors: list[str] = []
    raw = path.read_text(encoding="utf-8-sig")
    lines = raw.splitlines()
    if not lines or lines[0].strip() != "---":
        return {}, raw, [f"{path.relative_to(ROOT)}: missing YAML frontmatter"]
    try:
        end = next(i for i in range(1, len(lines)) if lines[i].strip() == "---")
    except StopIteration:
        return {}, raw, [f"{path.relative_to(ROOT)}: unterminated YAML frontmatter"]
    meta: dict[str, str] = {}
    for line in lines[1:end]:
        if not line.strip() or line.lstrip().startswith("#") or ":" not in line:
            continue
        key, value = line.split(":", 1)
        meta[key.strip()] = value.strip().strip('"').strip("'")
    return meta, "\n".join(lines[end + 1:]), errors

def validate_required_files() -> list[str]:
    return [f"missing required file: {p}" for p in REQUIRED_FILES if not (ROOT / p).exists()]

def collect_skills() -> tuple[list[str], dict[str, dict[str, str]]]:
    errors: list[str] = []
    found: dict[str, dict[str, str]] = {}
    for path in sorted(CANONICAL_SKILLS.glob("*/SKILL.md")):
        meta, _, local = parse_frontmatter(path)
        errors.extend(local)
        name = meta.get("name") or path.parent.name
        description = meta.get("description", "")
        if not SKILL_NAME_RE.fullmatch(name):
            errors.append(f"{path.relative_to(ROOT)}: invalid skill name {name!r}")
        if not description:
            errors.append(f"{path.relative_to(ROOT)}: description is required")
        if name in found:
            errors.append(f"duplicate canonical skill name: {name}")
        found[name] = {"description": description, "path": str(path.relative_to(ROOT))}
    return errors, found

def validate_claude_skill_adapters(canonical: dict[str, dict[str, str]]) -> list[str]:
    errors: list[str] = []
    seen: set[str] = set()
    for path in sorted(CLAUDE_SKILLS.glob("*/SKILL.md")):
        meta, body, local = parse_frontmatter(path)
        errors.extend(local)
        name = meta.get("name") or path.parent.name
        seen.add(name)
        if name not in canonical:
            errors.append(f"{path.relative_to(ROOT)}: no canonical Agent Skill exists for {name!r}")
            continue
        if meta.get("description", "") != canonical[name]["description"]:
            errors.append(f"{path.relative_to(ROOT)}: description drift from canonical skill {name!r}")
        canonical_ref = f"../../../.agents/skills/{name}/SKILL.md"
        if canonical_ref not in body:
            errors.append(f"{path.relative_to(ROOT)}: adapter must reference canonical path {canonical_ref}")
    for name in sorted(set(canonical) - seen):
        errors.append(f"canonical skill {name!r} has no Claude adapter")
    return errors

def validate_skill_registry(canonical: dict[str, dict[str, str]]) -> tuple[list[str], dict[str, dict]]:
    errors: list[str] = []
    data = read_json(ROOT / "registry/skills.json")
    reg: dict[str, dict] = {}
    for item in data.get("skills", []):
        sid = item.get("id", "")
        if sid in reg:
            errors.append(f"registry/skills.json: duplicate skill id {sid!r}")
        reg[sid] = item
        if item.get("status") != "active":
            errors.append(f"registry/skills.json: {sid} must be active or removed from required registry")
        if item.get("canonical_path") != f".agents/skills/{sid}/SKILL.md":
            errors.append(f"registry/skills.json: bad canonical_path for {sid}")
        if item.get("claude_path") != f".claude/skills/{sid}/SKILL.md":
            errors.append(f"registry/skills.json: bad claude_path for {sid}")
        if item.get("max_permission") not in ALLOWED_PERMISSIONS:
            errors.append(f"registry/skills.json: invalid max_permission for {sid}")
    if set(reg) != set(canonical):
        errors.append("registry/skills.json: registry/canonical set mismatch: "
                      f"missing={sorted(set(canonical)-set(reg))}, extra={sorted(set(reg)-set(canonical))}")
    for sid, item in reg.items():
        for dep in item.get("dependencies", []):
            if dep not in reg:
                errors.append(f"registry/skills.json: {sid} references missing dependency {dep}")
            if dep == sid:
                errors.append(f"registry/skills.json: {sid} cannot depend on itself")

    visiting: set[str] = set()
    visited: set[str] = set()
    def dfs(node: str, chain: list[str]):
        if node in visiting:
            errors.append("registry/skills.json: dependency cycle: " + " -> ".join(chain + [node]))
            return
        if node in visited:
            return
        visiting.add(node)
        for dep in reg.get(node, {}).get("dependencies", []):
            if dep in reg:
                dfs(dep, chain + [node])
        visiting.remove(node)
        visited.add(node)
    for sid in reg:
        dfs(sid, [])
    return errors, reg

def validate_agent_registry(skill_reg: dict[str, dict]) -> tuple[list[str], dict[str, dict]]:
    errors: list[str] = []
    data = read_json(ROOT / "registry/agents.json")
    reg: dict[str, dict] = {}
    disk_codex: set[str] = set()
    for path in sorted(CODEX_AGENTS.glob("*.toml")):
        try:
            agent = tomllib.loads(path.read_text(encoding="utf-8"))
        except (tomllib.TOMLDecodeError, OSError) as exc:
            errors.append(f"{path.relative_to(ROOT)}: invalid TOML: {exc}")
            continue
        name = agent.get("name", "")
        if not CODEX_AGENT_NAME_RE.fullmatch(name):
            errors.append(f"{path.relative_to(ROOT)}: invalid Codex agent name {name!r}")
        disk_codex.add(name)

    disk_claude: set[str] = set()
    for path in sorted(CLAUDE_AGENTS.glob("*.md")):
        meta, _, local = parse_frontmatter(path)
        errors.extend(local)
        name = meta.get("name", "")
        if not CLAUDE_AGENT_NAME_RE.fullmatch(name):
            errors.append(f"{path.relative_to(ROOT)}: invalid Claude agent name {name!r}")
        disk_claude.add(name.replace("-", "_"))

    for item in data.get("agents", []):
        aid = item.get("id", "")
        if aid in reg:
            errors.append(f"registry/agents.json: duplicate agent id {aid!r}")
        reg[aid] = item
        perms = set(item.get("permissions", []))
        if not perms <= ALLOWED_PERMISSIONS:
            errors.append(f"registry/agents.json: invalid permissions for {aid}: {sorted(perms-ALLOWED_PERMISSIONS)}")
        if item.get("posture") == "read_only" and perms != {"read"}:
            errors.append(f"registry/agents.json: read_only agent {aid} must have only read permission")
        if item.get("may_self_approve") is not False:
            errors.append(f"registry/agents.json: {aid} may_self_approve must be false")
        for skill in item.get("skills", []):
            if skill not in skill_reg:
                errors.append(f"registry/agents.json: {aid} references missing skill {skill}")
        if item.get("codex_path") != f".codex/agents/{aid}.toml":
            errors.append(f"registry/agents.json: bad codex_path for {aid}")
        if item.get("claude_path") != f".claude/agents/{aid.replace('_','-')}.md":
            errors.append(f"registry/agents.json: bad claude_path for {aid}")

    if set(reg) != disk_codex:
        errors.append(f"registry/agents.json: registry/Codex set mismatch: missing={sorted(disk_codex-set(reg))}, extra={sorted(set(reg)-disk_codex)}")
    if set(reg) != disk_claude:
        errors.append(f"registry/agents.json: registry/Claude set mismatch: missing={sorted(disk_claude-set(reg))}, extra={sorted(set(reg)-disk_claude)}")
    return errors, reg

def validate_routing(skill_reg: dict[str, dict], agent_reg: dict[str, dict]) -> list[str]:
    errors: list[str] = []
    data = read_json(ROOT / "registry/routing.json")
    ids: set[str] = set()
    for route in data.get("routes", []):
        rid = route.get("id", "")
        if rid in ids:
            errors.append(f"registry/routing.json: duplicate route id {rid!r}")
        ids.add(rid)
        if not route.get("tags"):
            errors.append(f"registry/routing.json: route {rid} has no tags")
        for skill in route.get("required_skills", []):
            if skill not in skill_reg:
                errors.append(f"registry/routing.json: route {rid} references missing skill {skill}")
        for agent in route.get("preferred_agents", []):
            if agent not in agent_reg:
                errors.append(f"registry/routing.json: route {rid} references missing agent {agent}")
        for perm in route.get("forbidden_permissions", []):
            if perm not in ALLOWED_PERMISSIONS:
                errors.append(f"registry/routing.json: route {rid} has invalid forbidden permission {perm}")
    return errors

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
        text = path.read_text(encoding="utf-8", errors="ignore")
        for pattern in SECRET_PATTERNS:
            if pattern.search(text):
                errors.append(f"possible secret/private key in {path.relative_to(ROOT)}")
    return errors

def main() -> int:
    errors = validate_required_files()
    skill_errors, canonical = collect_skills()
    errors.extend(skill_errors)
    errors.extend(validate_claude_skill_adapters(canonical))
    registry_errors, skill_reg = validate_skill_registry(canonical)
    errors.extend(registry_errors)
    agent_errors, agent_reg = validate_agent_registry(skill_reg)
    errors.extend(agent_errors)
    errors.extend(validate_routing(skill_reg, agent_reg))
    errors.extend(validate_secret_hygiene())

    if errors:
        print("EMPIRE GUARD V2: FAILED")
        for error in errors:
            print(f"- {error}")
        return 1
    print("EMPIRE GUARD V2: PASSED")
    print(f"Validated {len(skill_reg)} registered skills, {len(agent_reg)} registered agents, Claude adapter parity, dependency graph, routing registry, permissions, governance files, and basic secret hygiene.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
