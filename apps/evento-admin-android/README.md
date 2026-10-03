# EVENTO Admin Android

Native Android companion for EVENTO.

The APK is an operator surface for portfolio visibility and safe remote planning. It is intentionally not a direct tunnel into the workstation.

Current v0.1 capabilities:
- HTTPS-only connection to the EVENTO Control Plane;
- project/portfolio overview;
- PLAN / VERIFY / PREVIEW requests;
- Android Keystore-backed storage for endpoint and mobile-admin bearer token;
- no repository writes;
- no production release;
- no direct Unity, Blender, filesystem or workstation control.

Desktop-only execution continues through EVENTO Desktop Operator Mode.

Build baseline:
- Android Gradle Plugin 9.4.0
- Gradle 9.6.0
- JDK 17
- compileSdk / targetSdk 36
- minSdk 26

Server secret:

EVENTO_ADMIN_MOBILE_TOKEN=

Generate a unique high-entropy value. Do not reuse the web control-plane access key.
