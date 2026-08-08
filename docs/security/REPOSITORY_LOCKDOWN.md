# Repository Lockdown Policy

Status: required control-plane policy for AAA+ Engineering Empire v2.2.

## Security objective

Protect `main`, agent governance, registries/evals, CI, and the Mobile Control Plane from accidental, unauthorized, or unreviewed modification while preserving practical workflows from ChatGPT, Codex, Claude Code, GitHub, and mobile operations.

## Important limitation

GitHub permissions can authorize identities, apps, teams, branches, checks, environments, and workflows. They cannot natively express “only this exact ChatGPT conversation may edit this repository.” A conversation is not a GitHub security principal.

Therefore the enforceable design is identity + repository visibility + ruleset/branch protection + Code Owner review + CI + protected environments + least-privilege credentials.

## Required GitHub settings

Repository administrators should configure the following in GitHub Settings because repository files alone cannot enforce them:

1. Set repository visibility to **Private** when these operating assets are proprietary.
2. Protect `main` with a repository ruleset or branch protection.
3. Require a pull request before merging.
4. Require at least one approval.
5. Require Code Owner review for control-plane paths.
6. Dismiss stale approvals when new commits are pushed.
7. Require approval of the most recent reviewable push when available.
8. Require all review conversations to be resolved.
9. Require `Empire Guard / governance-and-skills` and applicable product-specific checks.
10. Block force pushes and branch deletion.
11. Apply protections to administrators / disallow bypass where supported.
12. Prefer squash merge for focused changes; disable merge methods you do not intend to use.
13. Keep GitHub App/repository access limited to the minimum repositories required.
14. Put production deploy/signing/destructive operations behind protected GitHub Environments or equivalent approval gates.

## Sensitive paths

Treat these as control-plane assets requiring owner review:

- `AGENTS.md`
- `CLAUDE.md`
- `.agents/**`
- `.claude/**`
- `.codex/**`
- `.github/**`
- `registry/**`
- `evals/**`
- `scripts/**`
- `docs/security/**`
- `docs/adr/**`
- `apps/mobile-control-plane/**`

Changes to governance, skills, agents, registries, routing, evaluations, CI, permission policy, authentication, write actions, or deployment controls must pass Empire Guard v2 and relevant project checks.

## Secrets and approval factors

Do **not** place reusable approval PINs/passwords, provider tokens, PATs, service-role keys, signing credentials, private keys, certificates, or production secrets in the repository, prompts, skills, issues, PR bodies, commit messages, or chat transcripts.

Use repository/environment secrets, OIDC/short-lived credentials, or an external secret manager where supported. A static approval code embedded in source provides no meaningful protection.

## Agent write policy

- Routine agent work occurs on short-lived branches.
- Agents may open PRs but must not self-declare owner approval.
- Read-only agents remain read-only in `registry/agents.json` and runtime/tool permissions.
- No agent may disable or weaken the rule/check/permission blocking its own change.
- Production deployment, signing, destructive migrations, secret rotation, and irreversible operations require separately protected approval.
- Mobile Control Plane write actions remain disabled by default and require explicit allowlists and confirmation.

## Recovery

If unauthorized changes or secret exposure are suspected:

1. Disable/limit the relevant GitHub App/token/session.
2. Rotate exposed secrets and invalidate sessions.
3. Preserve audit logs, Actions runs, deployment logs, and suspicious refs.
4. Revert from the last verified commit/PR.
5. Re-run Empire Guard v2 and project-specific security/release checks.
6. Review collaborators, app installations, deploy keys, Actions secrets, environments, webhooks, ruleset bypass actors, and Mobile Control Plane access.
7. Record the incident and add a regression/evaluation when the failure mode can be prevented automatically.
