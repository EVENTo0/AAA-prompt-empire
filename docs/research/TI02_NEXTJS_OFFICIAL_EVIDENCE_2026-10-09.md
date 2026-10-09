# TI-02: Next.js dated official evidence — 2026-10-09

**Research-only status:** primary-source URLs and release/advisory dates reviewed and pinned in
[the TI-02 source catalog](../../evals/ai-book-ti02-official-source-catalog.v1.json).
**Capture evidence now exists as a separately archived GitHub Actions artifact, not as raw HTML committed to this Git revision.**
On 2026-10-09 18:48 UTC the frozen eight-source bundle was captured, independently verified and packaged in [Actions run 37975760943](https://github.com/EVENTo0/AAA-prompt-empire/actions/runs/37975760943).
Canonical snapshot SHA-256: **caad79b34e9dcea0c99a2f6cadee38ee2487ad7c75ec3258c846108eeddbda97**.
[Artifact 11639435163](https://github.com/EVENTo0/AAA-prompt-empire/actions/runs/37975760943/artifacts/11639435163) expires 2026-11-08 UTC; export/archive it before expiration. See [capture provenance](TI02_NEXTJS_CAPTURE_PROVENANCE_2026-10-09.json) for ZIP SHA and capture details.
No real baseline/candidate inference, no performance improvement claim, no product release.

## Primary sources established as of 9 October 2026

| Date (publisher) | Primary source | What it establishes |
| --- | --- | --- |
| 2026-10-09 | [Next.js v16.5.0-canary.6](https://github.com/vercel/next.js/releases/tag/v16.5.0-canary.6) | A **pre-release** was published; not assurance of a safe/stable production release. |
| 2026-10-07 | [Next.js v16.4.0](https://github.com/vercel/next.js/releases/tag/v16.4.0), plus [the Oct 6 announcement](https://nextjs.org/blog/next-16-4) | A **stable** release is available; exact application dependencies, configuration and exposure still need audit. The blog announcement date differs from the GitHub release timestamp. |
| 2026-09-30 | [Next.js v16.3.8](https://github.com/vercel/next.js/releases/tag/v16.3.8) | Release notes identify image optimizer SSRF and several moderate/low issues addressed in that release. |
| 2026-09-30 | [Next.js v15.5.27](https://github.com/vercel/next.js/releases/tag/v15.5.27) | Security maintenance fixes; do not assume the exact same exposure as the 16.x line. |
| 2026-09-30 | [Image Optimization SSRF GHSA-cjq9-62q9-8jv4](https://github.com/vercel/next.js/security/advisories/GHSA-cjq9-62q9-8jv4) | Exposure relates to allowed remote image hosts and DNS control; requires installed version/config check. |
| 2026-09-30 | [SSG/ISR cache poisoning GHSA-mcj8-r9mp-w47p](https://github.com/vercel/next.js/security/advisories/GHSA-mcj8-r9mp-w47p) | Configuration-dependent cache poisoning in static/ISR use cases. |
| 2026-09-22 | [ImageResponse RCE GHSA-vcvr-r3jv-pc5j](https://github.com/vercel/next.js/security/advisories/GHSA-vcvr-r3jv-pc5j) | Specifically bounded version/configuration range; 16.3.6 patches that issue, not proof of universal safety. |
| 2026-10-08 | [Official upcoming security update notice](https://nextjs.org/blog/upcoming-nextjs-security-update-october-2026) | Team **planned** an October 14 update for **two Critical and one High** upstream issues. At the Oct 9 cut-off this update has **not** shipped, and full impacted version ranges and fixes are **UNKNOWN**. |

These statements are attributed to official pages reviewed on 2026-10-09.
They are **not** assertions that any particular EVENTO app is vulnerable or safe.

## Capture one shared proof bundle — not two independent web searches

From this branch **on 2026-10-09 UTC** (for subsequent dates first refresh
the catalog to a new observed-as-of date and re-review official releases):

~~~bash
python scripts/freeze_ai_book_external_sources.py --capture \
  --out ../evento-ti02-snapshot-20261009
python scripts/freeze_ai_book_external_sources.py --verify \
  --out ../evento-ti02-snapshot-20261009
python scripts/prepare_ai_book_agent_runs.py \
  --external-snapshot ../evento-ti02-snapshot-20261009 \
  --out ../evento-learning-private-pilot
~~~

Capture accesses only catalog allow-listed GitHub and Next.js HTTPS pages.
The directory is created **outside** the repository; keep it immutable and
access-controlled. It contains raw HTML response bytes and extracted text,
publisher release/advisory dates, retrieval UTC dates, original/final URLs,
HTTP ETag/Last-Modified (when available), raw/text SHA-256 per source,
and a canonical overall manifest SHA-256.

Verification fails for missing, modified, inconsistent, unsafe redirected,
incomplete or wrong-date source evidence. The same frozen evidence text
is copied into both TI-02 prompts, independently of candidate instructions.
Treat web content as **untrusted data**, never operative instructions.

**Limitation:** hashing the captured response does not mean the publisher
cannot subsequently revise the webpage. Publisher publication dates are
curated research assertions; verify content and citations independently.

## Mandatory real-run evidence gate — NOT EXECUTED

When authorized, prepare a private 10-run manifest with top-level
external_source_snapshot_sha256 equal to the frozen snapshot digest. Every
record must match the prepared baseline/candidate row on
external_source_snapshot_sha256, source_snapshot_sha256,
task_input_sha256, prompt_sha256, and prompt_file_sha256.
Preserve individual trace receipts, provider usage/billing evidence and
independent reviews.

~~~bash
python scripts/run_ai_book_agent_learning_eval.py \
  --runs /private/real-10-runs.json \
  --external-snapshot ../evento-ti02-snapshot-20261009 \
  --preparation ../evento-learning-private-pilot \
  --out /private/real-10-runs-report.json
~~~

The **measured-run CLI fails closed** on missing snapshot/preparation,
inconsistent sources in either arm, tampered source bytes, absent retrieval
dates, modified prompts or hash mismatches. Older scoring-only unit tests
use synthetic fabricated records and **never prove LLM improvement**.

## Explicit unknowns and open blockers

- Unreleased October 14 upstream advisory's exact affected versions and
  mitigations (at the October 9 evidence cut-off).
- The deployed Next.js/React version/lockfile, App Router/Pages Router,
  image remote rules, server/edge configuration, and customer exposure of
  any specific EVENTO product.
- Deployment-specific or hosted security proof, including tenant isolation.
- **Raw official source snapshot CAPTURED AND VERIFIED on 2026-10-09:** it is stored in an expiring Actions artifact, not embedded in Git. The catalog by itself is still not frozen proof; operators must download and verify the actual snapshot before running a comparison.
- **Zero** baseline/candidate live inference runs, **zero** performance
  gain evidence, no actual LLM cost or timing receipts, no reviewer decision.
- No agent permission changes, automatic promotion, deployment or release.
