# AAA+ Engineering Empire — Claude Code Bridge

@AGENTS.md

Claude Code must treat the imported `AGENTS.md` as the repository's governing operating contract.

## Claude-specific routing

1. Discover project skills under `.claude/skills/` and invoke only those relevant to the current task.
2. Use custom subagents under `.claude/agents/` only when delegation creates a clear correctness, speed, or isolation benefit.
3. Respect project permissions and hooks in `.claude/settings.json`; never weaken them to avoid an approval or check.
4. For workflows with material side effects (deploy, release, destructive migration, credential changes), prefer explicit user invocation/approval.
5. Keep `CLAUDE.md` concise. Procedures belong in skills; durable architecture/product facts belong in source-of-truth docs.
6. If a Claude-specific feature conflicts with the shared Agent Skills behavior, preserve the shared outcome and document the divergence.

## Canonical compatibility rule

`.agents/skills/` is the canonical cross-agent skill source for Empire. `.claude/skills/` contains Claude-compatible mirrors/adaptations. Any behaviorally material divergence must be intentional, documented, and caught by Empire Guard where possible.
