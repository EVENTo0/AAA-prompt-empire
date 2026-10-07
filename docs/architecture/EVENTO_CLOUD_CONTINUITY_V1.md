# EVENTO Cloud Continuity v1

The owner has no PC. Remote Desktop Commander and editor execution are deferred. Source development, isolated cloud tests, source/reference work, catalog development and agent handoff continue now.

## Canonical state

`registry/evento-continuity.v1.json` records 34 owned repositories and 8 separately tracked source projects/ideas. Each repository is pinned to a read head. Current workflow results are observations, not a replacement for product acceptance. Productization scores and P0 lists are explicitly `SOURCE_REPORTED` and point to the manifest PR head that was read. An absent workflow is `UNVERIFIED`; a newer cancelled/failing run is never replaced by an older green run.

The dashboard's `data/evento-continuity.v1.json` is an exact build-time mirror. The validator and contract test reject drift. The view prominently displays its observation timestamp and does not silently relabel cached evidence as live.

## Phone flow

Select project → select Codex/Claude Code/Antigravity → prepare next task → copy prompt or download Task + Context → execute on an authorized isolated workspace → return Evidence Pack → independently verify → checkpoint → one next action.

The context compiler is pure and grants no execution rights. Existing execution routes, allowed actions, auth, Memory tables and release policies are unchanged. The panel is mounted only after the existing authenticated page guard and stores no client-side credentials. Runner attachment, hosted authentication/tenant proof, device acceptance and signing remain separate open gates.

## Private draft journal

The authenticated `GET/POST /api/evento/continuity/drafts` bridge lets the operator persist the prepared Task/Context/prompt to a private owner GitHub repository. `CONTROL_PLANE_ENABLE_WRITES=true`, `EVENTO_CONTINUITY_DRAFTS_ENABLED=true`, a dedicated server-only `EVENTO_CONTINUITY_GITHUB_TOKEN` and explicit `EVENTO_CONTINUITY_TASK_REPOSITORY` are all required. Defaults remain disabled. Scope this separate token to repository metadata read and Issues read/write on the private journal only. The general dashboard/action `GITHUB_TOKEN` is never a fallback; existing environments must add the dedicated credential before enabling drafts. The endpoint checks the repository's actual `private` flag and exact full name before writing; there is no public fallback or default destination.

The browser sends only canonical project/adapter/task IDs and explicit save confirmation. The server regenerates the handoff from its source snapshot; it rejects arbitrary objectives, targets, release flags, extra fields, oversized bodies, unknown adapters/projects and cross-origin requests. The issue title is `[EVENTO CONTINUITY][DRAFT]`, the task remains `planning`, and execution remains `handoff-only`. Existing approved-task runners cannot mistake this title/envelope for execution approval. This is a draft journal, not a new execution engine or customer database.

Recent repeated saves reuse an exact matching draft among the newest 100 issues; same-instance concurrent saves are coalesced. This is not distributed exactly-once delivery: separate server instances or older issues outside that window can duplicate a draft. After an ambiguous provider failure, inspect the journal by task ID before retrying. No automatic POST retries occur. Supabase authoritative memory, hosted wiring and real device/browser acceptance remain separate gates.

Verify auth/origin/default-deny, privacy denial, canonical persistence, retry/conflict/concurrency and sanitized failure responses using `tests/continuity-drafts.test.mjs`. Tests inject provider transport. After building, `python tests/continuity-http-smoke.py` starts a temporary real Next production server with ephemeral auth secrets, proves login/401/403 and disabled writes over HTTP, and always stops its own server. CI runs this smoke after the build. Actual hosted private-repository write proof must be obtained after approved environment configuration. The standalone phone snapshot stays export-only until the authenticated app is hosted; its publication does not enable this endpoint.

## Authority

Acquisition: Evento-project-development-v1. Customer SaaS/bookings/invoices: Evento-One. Mobile: versioned interface. Engineering and memory: AAA-prompt-empire. Founder orchestration: Evento-octa-v10. Unity/source packs are hashed versioned inputs, never payment/customer truth.

Protected core/control-plane/shared capabilities are not extracted for sale. Customer delivery uses Build → Customize → Deploy → Handoff → Customer Owns & Operates. No daily customer business operation is added.

## State and recovery discipline

Every finished increment retains task, context, evidence, source ref, artifact hashes, remaining gates, and one next action. Runtime results are `DEFERRED` when tools/licensing/GPU/device are absent. Prepared scripts do not promote a project to PASS or SELLABLE.

Git source remains in GitHub. A separate owner-held continuation pack contains the retrieved Library source archives, their SHA-256 ledger, portable runners, release checklists and generated catalog; it does not claim to back up all repositories, conversation histories or hosted database rows. Full Git mirrors and hosted DB/storage/auth exports require their own documented backup and restore proof.

## Verification and handoff

Run `python scripts/validate_evento_continuity.py`, Empire Guard/evals, and the Mobile Control Plane contracts/typecheck/build. Review the focused PR before merge; keep PR #29 Governor, #30 pilot evidence, and #31 signing evidence independent. No production migration, credential binding, arbitrary remote shell, store publication or protected release is performed here.
