# AAA+ Engineering Empire — Technology Radar

This is a **routing radar**, not a frozen list of mandatory versions. Before using a fast-moving tool, verify its current stable/recommended release and platform requirements from primary documentation.

## Adopt as operating principles

- repository-first agent instructions and repeatable Agent Skills;
- branch/PR/check-based change control;
- typed interfaces/contracts where supported;
- automated tests chosen by risk;
- reproducible builds and dependency lockfiles;
- secrets outside source control;
- preview environments for user-facing work;
- observability and rollback for deployed systems;
- accessibility and internationalization as product concerns;
- infrastructure/configuration as code where it improves reproducibility;
- physical-device validation for mobile claims;
- evaluations/regression sets for AI behavior;
- evidence-backed completion status.

## Evaluate by project

### Web
- React/Next.js and alternatives;
- server-rendered, static, SPA, edge, PWA, or hybrid delivery;
- WordPress/Gutenberg when explicitly required by a project;
- browser automation and visual regression tools.

### Cross-platform mobile
- React Native + Expo ecosystem;
- Flutter;
- Kotlin Multiplatform/Compose Multiplatform;
- web/PWA when native distribution is unnecessary.

### Native Android
- Kotlin;
- Jetpack Compose;
- Android Studio/Gradle toolchain;
- platform APIs, profiling, testing, and Play distribution tooling.

### Apple platforms
- Swift;
- SwiftUI/UIKit as justified;
- Xcode toolchain, simulators, signing, TestFlight/App Store workflows;
- platform frameworks and accessibility tooling.

### Backend/data
- managed PostgreSQL/Supabase when suitable;
- serverless/edge functions when workload characteristics fit;
- containerized services when control/portability needs justify them;
- queues, realtime, object storage, vector/search systems by requirements.

### AI
- current supported frontier/reasoning/coding models selected through evaluations;
- model routing/fallbacks when reliability or cost requires them;
- tool use/MCP or provider-native tool integrations where justified;
- structured outputs and schema validation;
- retrieval only when it improves measured task outcomes;
- prompt/agent evaluations and safety tests.

### Games, 3D, XR
- Unity, Unreal, Godot, native/browser engines, or specialized frameworks selected by target platforms, graphics requirements, licensing, team workflow, build infrastructure, and performance evidence.

### Cloud/previews
- GitHub Actions and cloud development environments;
- preview deployments via the project's hosting platform;
- hosted build services for Android/iOS when they preserve signing/security requirements;
- device farms/streaming where physical device coverage is otherwise unavailable.

## Trial / caution

Use only with explicit justification and rollback:
- preview/beta SDKs in production paths;
- newly released architecture-critical frameworks without migration evidence;
- agent-generated database migrations without review and recovery plan;
- unpinned third-party Actions in sensitive pipelines;
- opaque “one-click” deployment services that require broad repository or cloud permissions;
- AI agents with write/deploy permissions but no evaluation, audit trail, or approval gates.

## Avoid

- hard-coded secrets;
- “latest” version numbers embedded as permanent policy;
- one framework mandated for all project types;
- direct production edits as a normal workflow;
- claiming mobile compatibility from browser screenshots alone;
- claiming security from static analysis alone;
- claiming AI quality from a handful of successful prompts;
- free-tier assumptions without checking current quotas/expiry/terms.

## Refresh trigger

Review this radar when:
- a new project starts;
- a major platform/SDK/store requirement changes;
- a dependency reaches deprecation/EOL;
- a security advisory materially affects a preferred tool;
- build/preview cost or availability changes;
- recurring failures show that a default strategy is no longer effective.
