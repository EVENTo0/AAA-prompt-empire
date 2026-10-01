# EVENTO Desktop

EVENTO Desktop is the native operator shell for the same EVENTO Control Plane contracts used by the web/PWA.

## Principle
There is one orchestration brain. Web, desktop and future mobile operator surfaces share:
- EVENTO Memory
- EVENTO Agent Contract
- Task schema
- Evidence Pack
- Capability registry
- connector registry
- approval gates

## Target architecture
Tauri 2 native shell + local EVENTO daemon/sidecar.

The local daemon is responsible for:
- encrypted API key / connector credential storage using the OS credential store
- Git/worktree execution
- local filesystem operations
- Python tools
- Blender automation
- Unity Hub / Editor / build invocation
- Android SDK / emulator / ADB
- Xcode / Simulator on macOS
- Docker/VPS execution
- local/open-source model adapters
- optional cloud model adapters
- artifact and backup sync

## Security boundary
Raw provider tokens never enter browser JavaScript. The native shell exposes allowlisted capabilities to the UI and keeps release/payment/secret/migration permissions separate.

## Independence goal
EVENTO must keep working if Claude, Codex, or any single model provider is unavailable. Providers are replaceable capabilities behind the EVENTO Agent Contract.

## Delivery sequence
1. Shared contracts and Memory
2. Web Command Console
3. Connector registry + permissions
4. Local daemon API
5. Tauri shell
6. Git / Filesystem / Python adapters
7. Blender / Unity adapters
8. Android / iOS / desktop build adapters
9. local-model adapter
10. signed desktop installers and auto-update
