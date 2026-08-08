---
name: security-privacy-audit
description: Threat-model and review application, infrastructure, AI, mobile, web, data, dependency, and deployment changes for exploitable security/privacy risks. Use before release or when trust boundaries change.
---

# Security & Privacy Audit

1. Identify assets, actors, trust boundaries, entry points, privileged actions, external integrations and data sensitivity.
2. Review authentication, authorization, session/token handling, secret storage, input/output validation, injection paths, file/media handling, SSRF/redirect/network risks and abuse controls as applicable.
3. Check dependency/supply-chain changes, CI permissions, third-party Actions/services and build/release credentials.
4. Verify least privilege for agents, services, databases, cloud roles and mobile/web clients.
5. Minimize personal/sensitive data; define purpose, retention, deletion, logging/redaction and access controls.
6. For AI, review prompt injection, tool abuse, data leakage, unsafe side effects and untrusted retrieval.
7. Test the highest-risk hypotheses with safe reproducible checks; distinguish confirmed vulnerabilities from theoretical concerns.
8. Never print or copy real secrets into reports. If exposure is suspected, recommend rotation and containment.

Rank findings by exploitability and impact, include affected path, evidence, remediation, residual risk and verification status. Do not certify security from a single scanner or checklist.
