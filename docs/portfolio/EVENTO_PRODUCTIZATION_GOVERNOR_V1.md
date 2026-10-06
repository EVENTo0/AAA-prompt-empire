# EVENTO Productization Governor v1.0

Status: APPROVED / mandatory Master Gate for EVENTO Ready Projects and Sellable Packages.

## Objective
Convert a real, evidenced project into a customer-owned deliverable without weakening EVENTO core/control-plane systems.

Default lifecycle:
AUDITING → BLOCKED_P0 → FIXING → TECHNICALLY_COMPLETE → SECURITY_VERIFIED → DEPLOYABLE → PRODUCTIZED → CUSTOMER_ISOLATED → HANDOFF_READY → COMMERCIAL_READY → SELLABLE → CATALOG_PUBLISHED

No project may be marked SELLABLE unless:
1. P0 count is zero.
2. Every mandatory gate passes with current evidence.
3. Readiness score is at least 90/100.
4. Product identity, licensing, deployment, customer isolation, handoff and support boundaries are explicit.
5. The package can be delivered without exposing or transferring EVENTO private control-plane assets.

## Laws
- Finish > Start
- Reuse > Rebuild
- Merge Before Build
- Security Before Sale
- Evidence Before Claim
- Customer Ownership After Delivery

Default commercial lifecycle:
Build → Customize → Deploy → Handoff → Customer Owns & Operates.

EVENTO does not operate the customer's daily business after handoff. Allowed post-sale work is limited by default to Add-ons, Plugins, Upgrades, Integrations, Technical Support, Design and Marketing unless another model is explicitly approved.

## Protected classes
- COMPANY_CORE: revenue/acquisition/customer SaaS infrastructure required by EVENTO.
- INTERNAL_CONTROL_PLANE: founder/orchestration/engineering/agent infrastructure.
- SHARED_CAPABILITY: reusable private capability used to build other products.
- SHARED_DATA: source/evidence datasets used by customer products.

Protected classes are audited as dependencies but are not extracted into Ready Projects merely because they are technically reusable.

## Sellable classes
- WEBSITE_PACKAGE
- SAAS_PACKAGE
- MOBILE_APP_PACKAGE
- GAME_PACKAGE
- XR_EXPERIENCE_PACKAGE
- PLUGIN_ADDON_PACKAGE
- AI_TOOL_PACKAGE
- DATA_CONTENT_PACKAGE
- DESIGN_ASSET_PACKAGE
- PHYSICAL_DIGITAL_PACKAGE

## Mandatory flow
Audit → Classification → Duplicate/Merge Check → Gap Analysis → Fix P0 → Tests → Security → Deployment Readiness → Productization → Customer Isolation → Handoff → Commercial Readiness → Sales Package → Catalog Readiness.

## P0 blockers
A P0 blocks sale regardless of score:
- failing mandatory CI/security/release gate;
- known unpatched high/critical product security exposure;
- exposed secrets/customer data or unsafe privilege boundary;
- missing customer/tenant isolation for a multi-customer/stateful product;
- no reproducible deploy/build/release path required by the product model;
- customer handoff would retain required EVENTO private credentials/control-plane access;
- unknown/incompatible license or delivery rights for required code/content/assets;
- unresolved canonical duplicate where ownership/source-of-truth is ambiguous;
- unmitigated high-risk safety/regulatory claim for medical, financial, security or physical-engineering products;
- stateful delivery without a tested backup/rollback/migration path where data loss or cross-tenant impact is material.

## P1 blockers
A P1 blocks professional handoff/catalog publication unless explicitly waived:
- incomplete admin/operator documentation;
- incomplete customer setup/handover checklist;
- missing pricing/SKU/license terms;
- missing demo/preview/sales assets;
- missing support/warranty/upgrade boundaries;
- missing domain/hosting ownership plan;
- missing accessibility/localization/device/browser evidence applicable to target market;
- non-critical debt that makes delivery repeatability uncertain.

## Readiness score /100
- Technical: 20
- Security: 15
- Deployment: 10
- UX: 10
- Documentation: 10
- Isolation: 10
- Productization: 10
- Commercial: 10
- Licensing: 5

Bands:
- 90–100: SELLABLE only if all mandatory gates pass and P0=0.
- 80–89: NEAR_SELLABLE.
- 65–79: NEEDS_DEVELOPMENT.
- 50–64: MAJOR_GAPS.
- <50: NOT_READY.

## Manifest contract
Every sellable candidate carries EVENTO Product Manifest + Readiness Schema v1 and records:
- identity/type/category/commercial model;
- canonical repository/ref and duplicate/merge decision;
- target segment, repeatable core, configurable options, exclusions and demo data;
- technical/test/security evidence;
- domain/hosting/deployment/release path;
- customer dashboard and isolation boundary;
- customer-owned domain/data/secrets/admin credentials after delivery;
- private EVENTO dependencies that must never be transferred;
- handoff, backup/rollback, acceptance and warranty/support boundary;
- license/source register;
- pricing/SKU, preview/sales assets and upgrade path;
- score, P0/P1, lifecycle state and exactly one NEXT ACTION.

Evidence must cite a commit, PR, workflow/run, deployment, test report, security review, device result, or equivalent verifiable artifact. Green unit tests alone are not completion evidence.
