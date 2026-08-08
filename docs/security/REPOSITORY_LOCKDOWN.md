# Repository Lockdown Policy

Status: required control-plane policy for AAA+ Engineering Empire.

## Security objective

Protect `main` and the Empire control plane from accidental, unauthorized, or unreviewed modification while preserving a practical workflow from ChatGPT/Codex/Claude Code and GitHub.

## Important limitation

GitHub permissions can authorize identities, apps, teams, branches, checks, and workflows. They cannot natively express “only this exact ChatGPT conversation may edit this repository.” A conversation is not a GitHub security principal.

Therefore the enforceable design is identity + branch/ruleset + owner review + CI + secrets/approval controls.

## Required GitHub settings

Repository administrators should configure the following in GitHub Settings because repository files alone cannot enforce them:

1. Set repository visibility to **Private**.
2. Protect `main` with a repository ruleset or branch protection.
3. Require a pull request before merging.
4. Require at least one approval.
5. Require Code Owner review for control-plane paths.
6. Dismiss stale approvals when new commits are pushed.
7. Require approval of the most recent reviewable push when available.
8. Require all review conversations to be resolved.
9. Require the `Empire Guard / governance-and-skills` status check.
10. Block force pushes and branch deletion.
11. Apply protections to administrators / disallow bypass where the account plan and ruleset support it.
12. Prefer squash merge for focused changes; disable merge methods you do not intend to use.
13. Keep GitHub App/repository access limited to the minimum repositories required.

## Sensitive paths

Treat these as control-plane assets:

- `AGENTS.md`
- `CLAUDE.md`
- `.agents/**`
- `.claude/**`
- `.codex/**` during migration
- `.github/**`
- `docs/security/**`
- `docs/adr/**`
- `scripts/**`

Changes to these paths require owner review and Empire Guard.

## Secrets and approval code

Do **not** place a reusable approval PIN/password in the repository, prompt, skill, CLAUDE.md, AGENTS.md, issue, PR body, commit message, or chat transcript.

If an additional approval factor is desired, implement it as a GitHub Environment secret/protected environment or external secret-manager approval workflow, so the secret value is never committed and is not exposed to agents. A static code embedded in the repository provides no meaningful protection.

## Agent write policy

- Routine agent work occurs on a short-lived branch.
- Agents may open PRs but must not self-declare owner approval.
- No agent may disable or weaken the rule/check that is blocking its own change.
- Production deployment, signing, destructive migrations, secret rotation, or irreversible operations require a separately protected environment or explicit owner action.

## Recovery

If unauthorized changes are suspected:

1. Disable/limit the relevant GitHub App/token.
2. Rotate exposed secrets.
3. Preserve audit logs and suspicious refs.
4. Revert from the last verified commit/PR.
5. Re-run Empire Guard and project-specific security checks.
6. Review repository collaborators, app installations, deploy keys, Actions secrets, environments, webhooks, and ruleset bypass actors.
