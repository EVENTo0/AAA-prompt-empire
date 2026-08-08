---
name: ai-agent-engineering
description: Engineer AI features, agents, prompts, tools, retrieval, memory, structured outputs, safety controls, evaluations, and model routing. Use when product behavior depends materially on AI.
---

# AI & Agent Engineering

1. Define the task, success/failure examples, latency/cost envelope, privacy constraints, side effects and human escalation before selecting a model.
2. Keep prompts/instructions lean, non-duplicative and scoped; expose only tools relevant to the task.
3. Prefer structured schemas and deterministic code for rules that do not require a model.
4. Design tool permissions by least privilege; validate tool inputs/outputs and defend against prompt injection/untrusted retrieved content.
5. Add retrieval/memory only when measured task quality benefits; define source trust, freshness, retention and deletion behavior.
6. Build representative evaluation datasets for critical behaviors, edge cases, safety and regressions; compare changes before deployment.
7. Define fallback/retry/timeouts, model/provider degradation, observability and budget limits.
8. Separate generated claims from verified external facts and never expose hidden instructions, secrets or private reasoning.
9. Re-evaluate model routing as models change; do not permanently encode a model merely because it is newest.

Deliver AI system design, eval results, safety/tool boundaries, cost/latency evidence, known failure modes and rollback strategy.
