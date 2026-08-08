# Empire Registries

These JSON files are the machine-readable control plane for AAA+ Engineering Empire v2.2.

- `skills.json` registers every canonical skill, adapter path, dependencies, platforms, permission ceiling, and evaluation suite.
- `agents.json` registers executable Codex/Claude agents, posture, attached skills, permissions, and self-approval policy.
- `routing.json` defines deterministic baseline routing contracts used by the evaluation harness.

The registries do not replace `AGENTS.md` or skill instructions. They make key invariants testable by `Empire Guard v2`.

Rules:
1. No executable skill or agent may exist outside the corresponding registry.
2. Read-only agents must remain read-only.
3. Agents may not self-approve.
4. Routing entries must reference registered skills and agents only.
5. Claude skill adapters must point to canonical `.agents/skills/*/SKILL.md` and keep matching descriptions.
6. Changes to these registries are governance changes and require Empire Guard.
