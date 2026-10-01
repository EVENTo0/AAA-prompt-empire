# Mobile Control Plane Next.js security patch — 2026-09-29

## Scope and reason

Base: `main` at `7f187177f2ca08029f61ed26af405b1b5456b242`.
Branch: `security/control-plane-next-16-3-6-20260929`.

The app pins Next.js 16.2.12, within the affected `>=16.2.0 <16.3.6` range in the [official September 22 security advisory](https://nextjs.org/blog/nextjs-security-update-september-22-2026). The critical issue concerns Node.js `ImageResponse` in `next/og`; no direct usage was found in the app, components, or libraries. This patch removes the affected framework version without claiming demonstrated exploitability in this application.

Pin `next` to 16.3.6 and add a normally generated npm lockfile. React, application code, authentication rules, write permissions, registry authority, and workflow versions are unchanged. This PR is independent of Registry PR #26. It does not fix the separately tracked main-branch Actions debt.

## Verification

Environment: Node 24.19.0, npm, Python 3.12.14, Linux. No provider credentials were used for runtime verification.

- `npm ci --ignore-scripts`: PASS using the new lockfile.
- `npm run check`: PASS; 7 existing contracts, TypeScript, and production build on Next.js 16.3.6.
- `python scripts/validate_empire.py`: PASS; 27 skills and 22 agents.
- `python scripts/run_empire_evals.py`: PASS; 18 cases.
- Manifest and lock agree on Next 16.3.6; all resolved registry URLs use registry.npmjs.org.
- Local production-server HTTP smoke: 10/10 PASS. A fresh synthetic operator key/session secret was generated in memory, provider credentials were empty, writes were explicitly disabled, and the server was terminated after the test.

| Runtime scenario | Result |
| --- | --- |
| Anonymous registry request | 401 |
| Anonymous action request | 401 |
| Incorrect access key | 401 |
| Correct synthetic operator key | 200 |
| Session cookie protection | Secure, HttpOnly, SameSite=Strict |
| Authenticated registry request | 200; expected baseline project count |
| Registry caching | no-store, private |
| Tampered session | 401 |
| Authenticated write with action confirmation | 403; disabled before provider call |
| Logout endpoint | 200 |

These are local runtime checks of the Empire control plane. They are not OCTA's Supabase authenticated negative-account test, hosted tenant proof, or an assertion of production readiness. Registry PR #26 has a different base/data snapshot and 13 contracts; this independent main-based patch correctly runs the existing 7 contracts.

## Remaining gate and rollback

Keep Draft until current-head CI and owner release review. No merge, deployment, production database change, live payment, secret change, or Core promotion occurred. Reverting this commit restores the old dependency/lock state for diagnosis but would restore the affected version; use a controlled forward fix for release.

The [September 30 advance notice](https://nextjs.org/blog/upcoming-nextjs-security-release-september-2026) lists planned 16.3.7/15.5.27 releases. They were not yet available at this verification date. Recheck official release notes and rerun the same gates once available; do not pin an unreleased version or claim those later vulnerabilities are covered by 16.3.6.
