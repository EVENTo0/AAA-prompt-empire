---
name: secure-agent-execution
description: Execute untrusted, generated, or agent-produced code through version-aware sandbox, network, secret, filesystem, approval, evidence, and teardown controls without weakening repository governance.
---

# Secure Agent Execution

## Purpose
Provide a provider-neutral execution gate for code or tools that should not run directly on a trusted host or with production credentials.

## Default contract
1. Sandbox generated/untrusted code; host execution requires explicit justification.
2. Network is deny-by-default and only task-required destinations are allowlisted.
3. Secrets are deny-by-default; inject only scoped, short-lived credentials when the task cannot proceed without them.
4. Use an ephemeral/minimal filesystem unless persistence is explicitly required and approved.
5. Destructive writes, production mutation and cross-repository writes require owner/human approval.
6. Capture command/tool, exit status, artifacts, logs, policy decisions and teardown evidence.
7. Fail closed when the requested sandbox cannot be established; never silently fall back to unsandboxed execution.

## Claude Code adapter rules
- Verify installed Claude Code version/changelog before assuming a sandbox control exists.
- Where supported, `--safe-mode` / `CLAUDE_CODE_SAFE_MODE` provides a troubleshooting baseline with customizations disabled; use it to distinguish product behavior from CLAUDE.md/plugins/skills/hooks/MCP configuration.
- Where supported, `sandbox.network.strictAllowlist` should be preferred for high-trust automation that needs explicit egress control.
- Prefer sandbox fail-closed controls where supported; do not use `--dangerously-skip-permissions` as an automation default.
- If a feature is not verified on the installed version, return `VERIFY_REQUIRED` and use the provider-neutral deny-by-default contract instead of inventing configuration.

## Optional reference backends
Vercel Sandbox is an allowed reference implementation, not a mandatory Empire dependency. When selected, prefer OIDC where available, keep Production secrets outside the sandbox, and treat preview/private-beta persistence features as non-production unless explicitly approved. AI SDK 7 `HarnessAgent` may be used as an experimental harness reference only after its Node.js 22+ and ESM requirements are satisfied.

## Output
Emit backend/harness, version/channel, network policy, secret policy, filesystem policy, approvals, commands/tools, evidence locations, teardown result, PASS/FAIL/VERIFY_REQUIRED and rollback/cleanup notes.
