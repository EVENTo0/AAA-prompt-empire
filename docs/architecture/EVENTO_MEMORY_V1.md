# EVENTO Memory Architecture v1

Status: Proposed implementation on branch `feat/evento-memory-v1`

## Goal
Make every EVENTO project leave behind reusable, evidence-backed knowledge so later projects start from accumulated learning instead of repeating the same checks.

## Core rule
Every completed task should produce at least one of:
1. Product output
2. Verified knowledge
3. Reusable capability

## Memory layers
- Task memory: run-specific observations and evidence
- Project memory: facts, decisions, lessons, risks for one project
- Domain memory: reusable knowledge for Unity, Blender, Supabase, mobile, web, etc.
- EVENTO shared memory: proven cross-project rules and patterns

## Memory classes
- fact
- decision
- lesson
- pattern
- anti_pattern
- rule
- source_claim
- asset_knowledge

## Promotion lifecycle
OBSERVED -> PROPOSED -> SUPPORTED -> VERIFIED -> ACTIVE
and later DEPRECATED or SUPERSEDED.

Only VERIFIED/ACTIVE items may be injected as authoritative context.

## Agent execution contract
Before work:
1. Read project facts.
2. Read relevant decisions.
3. Search lessons by domain/task.
4. Load reusable patterns.
5. Load anti-patterns.
6. Build a minimal Context Pack.
7. Plan, then execute.

After work:
1. Attach test/build evidence.
2. Record new lessons.
3. Propose reusable patterns.
4. Mark failed approaches as anti-pattern candidates.
5. Never self-promote critical knowledge to VERIFIED without independent evidence/review.

## Context Pack
Agents should not receive the whole memory store. A context compiler selects only the most relevant facts, decisions, rules, lessons and anti-patterns for the current task.

## Evidence
Every reusable rule should point to one or more evidence items:
- source URL/document
- commit/PR
- CI run
- test result
- build artifact
- validated data record

## Example
A repeated Unity mobile failure becomes:
observation -> lesson -> reusable rule -> automated validator/test.

## Security
- No secrets in memory text.
- Store secret references, never raw tokens.
- RLS required for shared database tables.
- Public clients receive only explicitly published knowledge.

## Integration targets
- GitHub: source/history/review
- Supabase: structured memory + retrieval metadata
- Claude Code / Codex / Antigravity / OpenHands / Cline: Context Pack consumers
- Unity / Blender / Web / Mobile pipelines: producers and consumers of verified memory
