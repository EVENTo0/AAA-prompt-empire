# EVENTO AI Reading & Agent Learning — Source Evidence Pack v1

**Review date:** 2026-10-08  
**Status:** RESEARCH / PROPOSED — NOT VERIFIED AGENT BEHAVIOR  
**Owner:** EVENTO / AAA+ Engineering Empire  
**Applies to:** EVENTO Memory v1, EVENTO Agent Contract v1, agent evaluation, productization, cost governance.

> This is an original research synthesis of lawfully accessible source material. It is **not a reproduction of the books**, a claim to have read every page, or permission to train models on protected texts. Book-cover imagery from social media is not treated as bibliographic proof; use publisher and author records.

## Access and provenance inventory

| ID | Work / year | Primary sources used | Material inspected by 2026-10-08 | Whole book read? |
|---|---|---|---|---|
| BK-01 | Ethan Mollick, *Co-Intelligence: Living and Working with AI* (2024) | [Publisher](https://www.penguinrandomhouse.com/books/741805/co-intelligence-by-ethan-mollick/), [publisher-sanctioned excerpt](https://penguinrandomhousehighereducation.com/2024/05/21/an-excerpt-from-co-intelligence/), [author articles](https://www.oneusefulthing.org/p/doing-stuff-with-ai-opinionated-midyear) | Official description, excerpt, related author guidance | No — excerpts only |
| BK-02 | Kai-Fu Lee, *AI Superpowers* (2018) | [Author book site](https://www.aisuperpowers.com/about-the-book), [publisher record](https://books.google.com/books/about/AI_Superpowers.html?id=KdVHDwAAQBAJ), [published book excerpt](https://www.wired.com/story/why-china-can-do-ai-more-quickly-and-effectively-than-the-us) | Author overview and excerpt summary | No — selected material only |
| BK-03 | Mustafa Suleyman with Michael Bhaskar, *The Coming Wave* (2023) | [Publisher + sample access](https://www.penguinrandomhouse.com/books/722674/the-coming-wave-by-mustafa-suleyman-with-michael-bhaskar/9780593593967/) | Publisher description and sample availability | No |
| BK-04 | Max Tegmark, *Life 3.0: Being Human in the Age of Artificial Intelligence* (2017) | [Publisher + sample access](https://www.penguinrandomhouse.com/books/530584/life-30-by-max-tegmark/9781101970317/) | Publisher description and sample availability | No |
| BK-05 | Brian Christian, *The Alignment Problem: Machine Learning and Human Values* (2020) | [Author's book site](https://brianchristian.org/the-alignment-problem/) | Author description and documented examples | No |
| BK-06 | Ajay Agrawal, Joshua Gans, Avi Goldfarb, *Prediction Machines* (2018; revised 2022) | [Authors' site](https://www.predictionmachines.ai/), [revised publisher edition](https://store.hbr.org/product/prediction-machines-updated-and-expanded-the-simple-economics-of-artificial-intelligence/10598), [authors' HBR article](https://hbr.org/2023/06/how-large-language-models-reflect-human-judgment) | Author/publisher overview and related published article | No |
| BK-07 | Ian Goodfellow, Yoshua Bengio, Aaron Courville, *Deep Learning* (MIT Press, 2016) | [Official free-to-read HTML textbook](https://www.deeplearningbook.org/), [Table of contents](https://www.deeplearningbook.org/contents/TOC.html), [Chapter 11: Practical Methodology](https://www.deeplearningbook.org/contents/guidelines.html) | Online availability and actual text of Chapter 11 (goals, metrics, baselines, instrumentation, iteration and abstention/coverage) | No — one chapter inspected, not entire textbook |

**Licensing note:** *Deep Learning* is explicitly free to read online, but the authors say the publisher contract disallows distribution of easily copied full-book electronic formats. Accessible does not mean redistributable or suitable for bulk embedding/training. Do not copy full text into EVENTO repositories, datasets, model training sets, or RAG stores absent explicit permission.

## Source-grounded themes vs EVENTO engineering proposals

Each pair distinguishes **theme** (supported by an accessible source) from **proposed EVENTO application** (a design hypothesis, not a result).

### BK-01 — Co-Intelligence
- **Theme:** Experiment with AI as a collaborator while retaining human judgment and verifying consequential claims; author guidance emphasizes hands-on experimentation.
- **Proposal:** Add a bounded **try → inspect → compare → accept/reject** workflow for the task router. Distinguish AI drafting from independent checking, and log whether the trial meaningfully improved the output.
- **Candidate evaluation:** Compare original vs AI-assisted task result on quality, time and correction count. Do not assume that involving more agents creates higher quality.

### BK-02 — AI Superpowers
- **Theme:** Competition and deployment depend on execution, practical applications, data and commercial adoption; historical arguments and projections reflect the 2018 context.
- **Proposal:** Prioritize local UAE/Arabic/English real-world pilots, fast feedback and product-market fit over accumulating general-purpose agent counts.
- **Caveat:** Do not treat 2018 geopolitical forecasts as current 2026 facts; refresh all market claims separately.

### BK-03 — The Coming Wave
- **Theme:** Rapidly spreading powerful technologies introduce control, governance and containment challenges.
- **Proposal:** Formalize agent capability boundaries: read, write, deploy, payment, credential and production-release actions require separately authorized gates. Record rollback capability and kill-switch tests.
- **Candidate evaluation:** Simulated unauthorized action attempts must be denied with evidence; fail closed on ambiguous scopes.

### BK-04 — Life 3.0
- **Theme:** AI's development raises long-horizon questions about societal goals, control and future scenarios.
- **Proposal:** Introduce quarterly scenario tests for EVENTO's autonomous execution: agent mistake, provider loss, customer-data isolation failure, and excessive operating expense.
- **Caveat:** Future scenarios are deliberative tools, not empirical forecasts.

### BK-05 — The Alignment Problem
- **Theme:** Optimizing an imperfect objective or learned proxy can create undesirable outcomes and reproduce data bias.
- **Proposal:** For each agent, specify the intended goal, measurable proxy, undesired shortcut, negative test and accountable review role. Test tenant isolation and permission boundaries rather than treating task-completion percentage as success.
- **Candidate evaluation:** Task "passes" only if quality and safety constraints both hold. Include bias/fairness audit where decisions affect people.

### BK-06 — Prediction Machines
- **Theme:** AI reduces the cost of prediction; choosing an action requires values, consequences and judgment beyond prediction alone.
- **Proposal:** Split **predict/estimate** from **decide/authorize/act** in the control plane. For revenue/product decisions, display assumptions, uncertainty, costs and human-defined acceptance thresholds.
- **Candidate evaluation:** A recommendation without decision context must not trigger purchases, invoices, deployments or customer handoff.

### BK-07 — Deep Learning, Chapter 11 (direct reading)
- **Directly observed methodology:** set application-driven performance/error goals; establish an end-to-end baseline; instrument/diagnose bottlenecks; iterate on evidence. The chapter also discusses precision/recall, asymmetric error costs and abstaining when system confidence is too low.
- **Proposal:** Treat each new agent prompt or model change like an experiment. Use a representative fixed evaluation set; measure accuracy/false positives/coverage/cost/latency; compare against baseline; promote only if key gates pass.
- **Scope caveat:** This 2016 book gives enduring ML methodology but predates contemporary LLM agents. Tool-use permissions, prompt injection, modern inference economics and multimodal agent safety require current primary technical documentation, not an extrapolation from this textbook alone.

## Proposed EVENTO Agent Learning Loop (not yet integrated)

`research source → citation/provenance → source claim → implementation hypothesis → evaluation case → independent review → verified pattern → controlled rollout`

1. **Source ingestion:** keep only metadata, permitted excerpts, link and original EVENTO notes; track `source_id`, edition, date, license/access, retrieval time and scope.
2. **Knowledge classes:** distinguish `source_claim`, `lesson`, `pattern`, `anti_pattern`, `rule`. Initial lifecycle for all items here is **PROPOSED**; this PR does not auto-promote them.
3. **Retrieval:** select relevant, small, citation-backed Context Packs per task. Do not blindly attach all seven books to every agent.
4. **Independent evaluation:** measure real baseline against proposed changes in a sandboxed task; neither a compelling book nor green formatting checks certify operational improvement.
5. **Review and promotion:** adopt only verified, general, low-cost and secure improvements in Empire; port into Core only if proven reusable. No self-approval by implementation agents.

## Initial regression/evaluation backlog (not executed)

| ID | Target | Proposed acceptance metric | Required proof |
|---|---|---|---|
| EVT-LIT-01 | Evidence and citation integrity | 0 invented citations in a curated factual-answer regression set | Cases + source references + independent review |
| EVT-LIT-02 | Safe delegated action | 0 unauthorized writes/deploys/payments across negative permission cases | Policy checks and denied-action logs |
| EVT-LIT-03 | Evidence-before-claim | 0 claims of release/customer isolation without proper hosted evidence | Negative acceptance fixtures |
| EVT-LIT-04 | Economic value | Improvement in `accepted_tasks / total_cost` without declining quality | Paired baseline and experiment measurements |
| EVT-LIT-05 | Robust fallbacks | Correct refusal/escalation at undefined scope or low confidence | Decision logs and reviewer audit |
| EVT-LIT-06 | Customer relevance | Arabic/English UX task quality measured with locale-specific checks | UAE pilot task set + human acceptance |
| EVT-LIT-07 | Context compression | Context Pack relevance with no missing mandatory safety rule | Retrieval fixtures and safety audit |

### Baseline data to collect before activation

- Accepted task rate; task correctness; relevant error types; evidence completeness.
- Unauthorized action count; tenant boundary failures; prompt-injection resilience.
- Tokens/cost per accepted task, latency and reviewer time.
- Context Pack source coverage and source-age warnings.

**No metrics have yet been measured for this reading pack. Do not mark this work as agent performance improvement.**

## EVENTO routing map

- **AAA-prompt-empire:** research register, eval experiments and independently reviewed reusable patterns.
- **AAA-prompt Core:** future promotion only after repeated proof and low-cost reuse.
- **EVENTO Memory v1:** `source_claim` and `lesson` candidates with citation and status PROPOSED; no automatic authoritative injection.
- **EVENTO Agent Contract v1:** link proposed cases to PLAN / VERIFY / LEARN steps and protected action boundaries.
- **EVENTO ONE, mobile and project acquisition site:** use only adapted local tests and customer-isolation evidence; no production change from this PR.
- **EVENTO Productization Governor:** these books do not alter P0 gates, readiness scores, SELLABLE classification or release evidence.

## Next smallest valuable step

Pick one repeatable task from the current Empire agent workflow; collect a baseline run and exact cost; apply BK-07 evaluation method plus BK-05 negative safety checks; produce a reviewed, comparable result. Only then propose a reusable prompt/policy change.

**Evidence standard:** book source ≠ running test ≠ production proof. Keep all three separate.
