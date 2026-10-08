# EVENTO continuity journal — isolated hosted proof gate

Status: **P0 / UNVERIFIED**. This document is an operator checklist, not evidence of hosted persistence.

## Preconditions (fail closed)

- Designate a **new private** owner repository, for example `EVENTo0/evento-continuity-journal`. Do not use the public Empire repository or repurpose a product/client repository. Confirm GitHub Issues is enabled.
- Create a **fine-grained personal access token** whose resource owner can access that repository, selecting **only** that repository, with `Metadata: read` and `Issues: read and write`. Confirm token expiration, repository access, and organization approval if required. Never paste the token in issues, PR comments, logs, bundles, client-side settings or source files.
- Scope the following variables **to a protected isolated Preview deployment** only: `EVENTO_CONTINUITY_TASK_REPOSITORY=EVENTo0/<approved-private-repository>`, `EVENTO_CONTINUITY_GITHUB_TOKEN` (sensitive, server-only), `CONTROL_PLANE_ENABLE_WRITES=true`, `EVENTO_CONTINUITY_DRAFTS_ENABLED=true`. Protect Preview using the existing operator authentication; never set these flags for production.
- Explicitly verify `EVENTO_REMOTE_TASKS_ENABLED=false` and all separate execution, migration, signing and release routes remain disabled. A draft has `planning` state and `handoff-only` execution authority.
- Redeploy the isolated Preview **after** Preview environment-variable changes, verifying the deployment SHA/branch. An older ready deployment does not inherit newly configured variables.

## Safe, authorized proof

1. From the authenticated Preview session, `GET /api/evento/continuity/drafts` must report `configured: true`, `enabled: true`, `execution: handoff-only`. It must not expose the token.
2. Prepare a canonical Task/Context/prompt in the UI for a non-sensitive fixture project, and explicitly confirm saving. Capture the chosen `taskId` for this controlled exercise.
3. POST through the existing UI. Record **201**, the returned **issue number** and canonical private issue URL. If there is a timeout or ambiguous provider response, inspect GitHub Issues by the exact task ID **before retrying**.
4. Independently read that issue in GitHub (with authorized operator access). Assert exact issue title `[EVENTO CONTINUITY][DRAFT] <taskId>`, parse its JSON body and verify `evento_continuity_draft_version=1`, `state=planning`, `task.status=planning`, `execution=handoff-only`, and full Task/Context/prompt agreement with the handoff. Preserve source ref and commit SHA. **A POST response alone is insufficient proof.**
5. Re-submit the exact same canonical request with the same `taskId` and assert **200**, `reused=true` and the *same issue number*. Confirm no additional issue was created.
6. Send the same `taskId` with a different canonical project selection and assert **409**, without writing another issue. Check public-repository, cross-origin and unauthorized requests continue to fail closed.
7. Store a sanitized evidence receipt (private issue URL or a redacted reference, task ID, Preview deployment ID/commit, UTC time, POST/read-back/reuse/conflict status, issue counts and tester identity). **Do not write secrets or the full private draft payload into public PR comments.**
8. Turn both Preview write flags back to **false** immediately after verification and redeploy the protected Preview. Confirm authenticated GET reports `enabled: false`.

## Failure triage

- `configured: false`: missing/invalid dedicated token or repository full name in the **deployed** Preview. The generic `GITHUB_TOKEN` is intentionally not accepted.
- 401 from GitHub: dedicated credential expired/invalid or inaccessible; do not fallback to the dashboard token.
- 403 from GitHub: check fine-grained repository selection, Issues permissions, repository/organization policy, required approval, and whether Issues is enabled. A **Vercel Blob 403** is unrelated to this GitHub Issues backend.
- 404 from GitHub: incorrect owner/repository name, absent access, or hidden private repository. Do not automatically switch destination.
- 409 from the app: non-private/wrong destination or a task ID already bound to different content; do not overwrite.
- 5xx/network/ambiguous issue creation: query private Issues for the exact task ID before retrying, to avoid duplicate records.
- The current implementation examines only the newest 100 issues and coalesces requests within one server instance. It **does not** guarantee distributed exactly-once delivery; do not claim that property.

## Gate result

Until the protected Preview has a dedicated private repository, an independently verified issue read-back and an idempotency receipt, leave `HOSTED_PERSISTENCE=P0_OPEN`. No PR merge, production deployment, runner enablement or commercial readiness assertion follows automatically.
