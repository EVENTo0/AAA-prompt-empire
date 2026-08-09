# AAA+ Game Studio — Short Prompt

Use this prompt in Codex, Claude Code, Kimi, or another capable repository agent after the project repository is opened:

```text
Read AGENTS.md and the project source-of-truth docs first.
Use the game-studio-director workflow.

Project: <PROJECT_NAME>
Goal: build the next smallest complete commercial-quality playable milestone.

First verify the repository, current build/demo, tests, Git state, dependencies, secrets, asset licenses, target platforms, and known failures. Do not rewrite working systems before verification.

Then choose only the specialists needed, implement on a reviewable branch, test the change, produce a playable/preview/build path, update project memory, and report VERIFIED / UNVERIFIED / BLOCKED evidence.

Prioritize: core fun → vertical slice → save/recovery → art/audio target → web demo/site → multiplayer → XR → mobile → release.
Never claim completion, hardware verification, store readiness, security, or deployment without current evidence.
Stop at the current milestone boundary and recommend the single highest-value next milestone.
```

For OCTORIMAL, replace `<PROJECT_NAME>` with `OCTORIMAL: Sands of the First Tide` and read `templates/game-studio/OCTORIMAL_PROJECT_BRIEF.md` when bootstrapping a dedicated repository.
