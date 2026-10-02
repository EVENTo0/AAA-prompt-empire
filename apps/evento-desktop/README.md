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


## Native shell v0.1

Current implementation:
- Tauri 2.12 native shell
- Rust 1.99 toolchain
- static local frontend; no CDN/runtime web dependency
- Rust-owned daemon lifecycle
- ephemeral daemon session token generated in native code
- daemon starts read-only by default
- no daemon token exposed to JavaScript
- Windows MSI/NSIS bundle targets
- Visual C++ runtime bundling enabled

### Local development

From `apps/evento-desktop`:

```powershell
npm install
npm run dev
```

Python must be available as `python` on Windows or configured with `EVENTO_PYTHON`.

### Build

```powershell
npm run build
```

The production shell packages the EVENTO daemon and committed registries as application resources.

### Security rule

Tauri owns the local daemon token. The webview receives only typed Tauri command results. When write execution is introduced into the native shell, it must use separate OS-protected credentials and the existing EVENTO write-action allowlist; do not forward raw tokens into the webview.
