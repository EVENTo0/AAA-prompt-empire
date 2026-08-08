# Legacy Codex Skills Path

`/.codex/skills/` is retained only as a migration/compatibility area for artifacts created by the earlier Empire foundation.

## Current source of truth

Codex repository skills live under:

- `/.agents/skills/<skill-name>/SKILL.md`

Claude Code project mirrors live under:

- `/.claude/skills/<skill-name>/SKILL.md`

Project-scoped executable subagents are separate from skills:

- Codex: `/.codex/agents/*.toml`
- Claude Code: `/.claude/agents/*.md`

Do not add new production skills to this legacy directory. Migrate any remaining useful legacy skill behavior to the canonical `.agents/skills/` catalog and keep cross-agent mirrors synchronized through Empire Guard.
