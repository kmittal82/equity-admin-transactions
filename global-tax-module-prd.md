# PRD: Global Tax Module for Equity Administration Platform

**Author:** Kunal (Product)
**Status:** Draft v1.0
**Date:** July 2026
**Domain:** Transactions / Compliance — Tax Engine

---

## 1. Problem Statement

Equity transactions (RSU release, option exercise, ESPP purchase, sale, dividend equivalents) trigger tax withholding obligations across dozens of jurisdictions, each with distinct rate structures, progressive bands, wage-base caps, and employer-side obligations. Today, corporate issuers and their administrators must manage these rates manually or through fragmented spreadsheets, with no systematic way to (a) maintain a governed global rate library, (b) tailor rates per client, (c) reflect participant mobility with effective-dated location history, or (d) apply rates deterministically based on transaction context and year-to-date position.

The cost of not solving this: incorrect withholding (under-withholding creates issuer liability and participant penalties; over-withholding creates participant dissatisfaction and refund friction), inability to support globally mobile participants (a top-3 RFP requirement in enterprise equity deals), and dependence on manual calculations that do not scale in a multi-tenant SaaS model.

## 2. Goals

1. **Accuracy:** ≥ 99.9% of tax calculations on supported transaction types match the expected withholding per configured rules, verified against a golden test suite per jurisdiction.
2. **Coverage:** Support flat, progressive (banded), capped, and tiered rate structures across country, sub-national (state/province/canton), and local levels at GA.
3. **Mobility:** Correctly source and allocate taxable income for participants with effective-dated location changes between grant and taxable event (trailing liabilities).
4. **Tenant autonomy:** Clients can view, override, and audit their own effective rate set without affecting the platform library or other tenants; overrides deployable by client admins in < 15 minutes without a support ticket.
5. **Content currency:** Rates refreshable via bulk import and via API integration with a global tax compliance content provider (e.g., Tapestry), with full versioning and effective dating.

## 3. Non-Goals

- **Tax filing / remittance:** The module computes and records withholding; it does not remit to tax authorities or produce statutory filings (separate reporting initiative).
- **Tax advice:** The platform applies configured rates and rules; it does not determine what rates *should* be for a client. Content responsibility sits with the client and/or their content provider.
- **Payroll system of record:** We consume YTD income/taxes from payroll feeds; we do not replace payroll. Payroll remains authoritative for final reconciliation.
- **Individual tax return preparation** for participants (out of scope permanently).
- **Real-time treaty analysis:** Double-tax treaty relief is modeled only as configurable rate/exemption overrides in v1, not as automated treaty determination (P2).

## 4. Personas

| Persona | Description | Primary needs |
|---|---|---|
| **Platform Tax Content Admin** (JPMS internal) | Maintains the global rate library | Bulk import, versioning, Tapestry sync, publish workflow |
| **Client Equity Administrator** | Manages a tenant's plans | Review inherited rates, apply overrides, approve changes, run what-if |
| **Client Payroll/Tax Analyst** | Reconciles equity withholding with payroll | YTD imports, jurisdiction-level withholding output, audit trail |
| **Mobile Participant** | Employee who moved jurisdictions | Correct multi-jurisdiction withholding on release/exercise, transparent statement |
| **Implementation/Migration Analyst** | Onboards clients | Import client rate sets, demographic history, validate before go-live |

## 5. Conceptual Domain Model (Holistic View)

The module decomposes into six cooperating capability areas. Each is specified below with **Requirements** followed by **Corresponding Design**.

```
┌─────────────────────────────────────────────────────────────────┐
│                        TAX RULES ENGINE (F)                     │
│   Evaluates: event type × grant type × location history ×       │
│   rate resolution × YTD context  →  withholding result          │
└───────▲──────────────▲──────────────▲──────────────▲────────────┘
        │              │              │              │
┌───────┴──────┐ ┌─────┴───────┐ ┌────┴─────────┐ ┌──┴───────────┐
│ A. GLOBAL    │ │ D. CLIENT   │ │ E. PARTICIPANT│ │ GRANT-LEVEL  │
│ RATE LIBRARY │ │ RATE CONSOLE│ │ TAX PROFILE   │ │ RATE ASSOC.  │
│ (bands, caps,│ │ (tenant     │ │ (residency,   │ │ (per-award   │
│  eff. dates) │ │  overrides) │ │  mobility,    │ │  treatment)  │
└───▲──────▲───┘ └─────────────┘ │  YTD figures) │ └──────────────┘
    │      │                     └───────▲───────┘
┌───┴──┐ ┌─┴─────────┐           ┌───────┴────────┐
│B.BULK│ │C. TAPESTRY│           │ DEMOGRAPHIC /  │
│IMPORT│ │/COMPLIANCE│           │ PAYROLL IMPORTS│
└──────┘ │ API SYNC  │           └────────────────┘
         └───────────┘
```

**Rate resolution precedence (highest wins):**
Participant-level override → Grant-level association → Client (tenant) override → Global platform default.

---

## 6. Capability A — Global Tax Rate Repository

### 6.1 Requirements

**TAX-RR-001 (P0): Jurisdiction hierarchy.**
The system shall model jurisdictions as a hierarchy: Country → Sub-national (state/province/canton/prefecture) → Local (city/municipality). Each jurisdiction has an ISO-mapped code, name, currency, and active status.
The repository **stores** the hierarchy; it does not decide which levels apply to a given event. Which jurisdictions are in play is determined by the Jurisdiction Claim tree (TAX-JC-004/005). The library answers a lookup for one named jurisdiction at a time and never walks the tree on its own.
- *Acceptance:* Given US → California → San Francisco is configured and rates exist at each level, when the claim tree admits Federal, California and San Francisco as three separate claims, then three independent lookups are issued and each returns that jurisdiction's own rate. Given the claim tree admits only Federal and California, then no San Francisco rate is retrieved even though one is published.

**TAX-RR-002 (P0): Tax type taxonomy.**
The system shall support configurable tax types per jurisdiction: income tax withholding, social security (employee), social security (employer), Medicare/health-levy analogs, capital gains, regional/municipal surcharges, solidarity/other surtaxes, and a client-definable "custom" type (e.g., hypothetical tax for tax-equalized assignees).

Tax type is **one of the four coordinates** that identify a single rate. The full set is jurisdiction + tax type + rate flavour (TAX-RR-008) + tax year (TAX-RR-009). A Tax Treatment supplies tax type and flavour; the claim supplies jurisdiction; the event supplies tax year.
- *Acceptance:* An admin can create "Germany — Solidarity Surcharge" as a surtax computed on the income-tax amount (tax-on-tax), not on the income base.

**TAX-RR-003 (P0): Rate structures — flat, banded, capped, tiered.**
Each tax type + jurisdiction combination shall support one of:
- **Flat rate** (e.g., 22% US federal supplemental up to threshold);
- **Progressive bands**: ordered brackets with lower bound, upper bound, rate, and optionally a fixed amount per band (cumulative method);
- **Wage-base caps**: annual income ceiling above which the tax stops (e.g., US Social Security wage base) or rate changes (e.g., US supplemental 22% → 37% above $1M);
- **Tiered/threshold rates**: rate switches at cumulative YTD thresholds;
- **Fixed-amount** components (e.g., per-event stamp duties).
- *Acceptance:* Given UK PAYE bands (personal allowance, basic, higher, additional) are configured, when supplemental income of £60,000 is processed for a participant with £40,000 YTD income, then tax is computed across the correct band boundaries, not at a single blended rate.

**TAX-RR-004 (P0): Effective dating and versioning.**
Every rate, band, and cap shall carry effective-from/effective-to dates. Historical versions are immutable once published; corrections create new versions with audit linkage.

Effective dating answers **"which version of this row was live"**, which is a separate question from **"which tax year does this event belong to"** (TAX-RR-009). Resolution uses both: `tax_year` selects the rate row, and an as-of date selects the version of that row. Restatements re-run against the as-of date of the original calculation, not today's.
- *Acceptance:* Given a rate change effective Jan 1, when a release occurs Dec 31, then the prior year's rate applies; a release on Jan 1 applies the new rate; both are reproducible after the fact.

**TAX-RR-005 (P0): Publish workflow.**
Rate changes move through Draft → In Review → Published states with maker-checker approval (the author cannot self-approve). Only Published versions are visible to tenants and used in calculations.

**TAX-RR-006 (P1): What-if / preview.**
Content admins can run a sample calculation against a Draft rate set to validate before publishing.

**TAX-RR-007 (P1): Rate library browse & compare.**
Searchable UI: filter by country, tax type, effective date; diff view between two versions of a jurisdiction's rate set.

**TAX-RR-008 (P0): Rate flavour.**
Within a single jurisdiction and tax type, several rates may coexist for different withholding methods. The repository shall carry **flavour** as a first-class dimension alongside tax type, from a governed vocabulary: `STANDARD` (the ordinary graduated method), `SUPPLEMENTAL` (the flat method many jurisdictions permit for irregular or bonus-type income), `SUPPLEMENTAL_EQUITY` (a flavour published specifically for stock awards where the jurisdiction distinguishes it), `AGGREGATE`, `FLAT_MANDATED`, `EXEMPT`, and a client-definable extension.

A Tax Treatment binds to a flavour, not to a percentage. Without this dimension a treatment can only request "income tax" and cannot express "income tax, supplemental method", which is the near-universal case for equity withholding.

Flavour is **not** a rate structure. Structure (TAX-RR-003) describes the arithmetic — flat, banded, capped. Flavour describes which published method the jurisdiction says to use. A `SUPPLEMENTAL` flavour is usually but not always `FLAT` in structure.
- *Acceptance:* Given New York publishes both a graduated income-tax table and a separate supplemental withholding rate for the same tax year, when a treatment requests `income tax + SUPPLEMENTAL`, then the supplemental row resolves and the graduated table is not returned. Given the same treatment requests `income tax + STANDARD`, then the graduated table resolves.
- *Acceptance:* Given California publishes a stock-award-specific supplemental rate distinct from its general supplemental rate, when a treatment for an RSU release requests `SUPPLEMENTAL_EQUITY`, then the stock-specific row resolves; when no `SUPPLEMENTAL_EQUITY` row exists for a jurisdiction, then resolution falls back to `SUPPLEMENTAL` and the fallback is recorded in the explanation trace.

**TAX-RR-009 (P0): Tax year assignment.**
Each rate row shall be keyed to a `tax_year` belonging to a jurisdiction's own **tax year definition** (start month/day, end month/day, label), not to the calendar year by assumption. The system shall store a tax-year calendar per jurisdiction and derive the applicable `tax_year` for an event from the taxable event date plus that jurisdiction's calendar.

This matters because jurisdictions do not share a year. The UK runs 6 April to 5 April; India 1 April to 31 March; the US calendar year. An event on 10 April 2026 falls in different tax years depending on which jurisdiction is claiming it — and a single mobile event can be claimed by several jurisdictions at once, each assigning it to a differently-labelled year.
- *Acceptance:* Given a release on 10 April 2026 claimed by both the US and the UK, when rates resolve, then the US line resolves against tax year 2026 and the UK line against tax year 2026/27, from the same event date.
- *Acceptance:* Given a jurisdiction changes its tax year definition, when a historical calculation is restated, then the definition in force at the time of the original event is used.

### 6.2 Corresponding Design

**Data model (core entities):**

```
Jurisdiction(id, parent_id, level ∈ {COUNTRY, SUBNATIONAL, LOCAL},
             level_label,  -- display only: "State"/"Province"/"Canton"/"Prefecture"
             iso_code, name, currency_code, status)
-- `level` is the single canonical definition of jurisdictional tier. Claims
-- (TAX-JC-004) and Treatment selectors reference this enum; neither defines
-- its own. "STATE" is not a level — it is a `level_label` for US SUBNATIONAL.

TaxType(id, code, name, category ∈ {INCOME_WH, SOC_SEC_EE, SOC_SEC_ER,
        HEALTH, CAP_GAINS, SURTAX, CUSTOM},
        base ∈ {TAXABLE_INCOME, TAX_AMOUNT, GAIN, FIXED},
        payer ∈ {EMPLOYEE, EMPLOYER, BOTH})

RateFlavour(id, code ∈ {STANDARD, SUPPLEMENTAL, SUPPLEMENTAL_EQUITY,
            AGGREGATE, FLAT_MANDATED, EXEMPT, CUSTOM},
            name, fallback_flavour_id (nullable), description)

TaxYearCalendar(id, jurisdiction_id, tax_year_label, starts_on, ends_on,
                effective_from, effective_to)

RateSchedule(id, jurisdiction_id, tax_type_id, flavour_id, tax_year_id,
             structure ∈ {FLAT, BANDED, CAPPED, TIERED, FIXED},
             effective_from, effective_to,
             version_no, status ∈ {DRAFT, IN_REVIEW, PUBLISHED, SUPERSEDED},
             coverage ∈ {PUBLISHED_SOURCE, AUTHORED, INFERRED, GAP},
             source ∈ {MANUAL, BULK_IMPORT, TAPESTRY}, source_ref,
             source_citation, created_by, approved_by, published_at)

-- Resolution key (unique among PUBLISHED rows):
--   (jurisdiction_id, tax_type_id, flavour_id, tax_year_id)
-- plus an as-of date selecting the version within that key.
-- All four key fields are FKs to governed entities; tax_year_id resolves
-- through TaxYearCalendar so a year label never floats free of a jurisdiction.

RateBand(id, rate_schedule_id, seq, lower_bound, upper_bound (nullable=∞),
         rate_pct, fixed_amount, ytd_basis ∈ {EVENT_INCOME, YTD_TOTAL_INCOME,
         YTD_SUPPLEMENTAL})

RateCap(id, rate_schedule_id, cap_type ∈ {WAGE_BASE, MAX_TAX}, annual_ceiling,
        above_ceiling_rate (nullable))
```

**Design decisions:**
- **The four-coordinate key is the contract between the treatment layer and the library.** A Tax Treatment stores `(tax_type_id, flavour_id)` only. The claim supplies `jurisdiction_id`; the event date plus `TaxYearCalendar` supplies `tax_year`. A treatment therefore cannot be authored with the wrong jurisdiction or the wrong year, because it never holds those fields. This is what makes a January rate update a single library row change with no treatment edits.
- **Flavour fallback is explicit, not implicit.** `RateFlavour.fallback_flavour_id` lets `SUPPLEMENTAL_EQUITY` fall back to `SUPPLEMENTAL` where a jurisdiction publishes no equity-specific method. Fallback is recorded in the explanation trace so a reviewer can see that a substitution occurred rather than discovering it in a variance.
- **`coverage` is a first-class field, not a report.** `PUBLISHED_SOURCE` came from the licensed provider; `AUTHORED` was written by the content team from explicit guidance and carries `source_citation`; `INFERRED` was derived where the jurisdiction is silent; `GAP` means no rule exists and the event routes to the exception queue. `INFERRED` rows require client acknowledgement before they calculate (see Capability D) — the platform must never silently assert an inference as settled law.
- Rate schedules are **append-only versioned aggregates**. `SUPERSEDED` replaces nothing physically — this aligns with the platform's event-sourced ledger direction and guarantees calculation reproducibility for audits and restatements.
- `ytd_basis` on bands is what lets one schema express both "bracket on this event's income" and "bracket on cumulative YTD income" — the latter is required for correct progressive withholding (see Capability F).
- Surtaxes (`base = TAX_AMOUNT`) reference an ordered dependency: the engine computes base taxes first, then tax-on-tax components (topological ordering by `base`).
- All monetary bounds are stored in jurisdiction currency; FX conversion happens at calculation time using the client's configured rate source and the taxable event date.
- Publish workflow is implemented on the shared platform Approvals domain (maker-checker), not bespoke — consistent with Workflows/Approvals architecture.

---

## 7. Capability B — Bulk Import of Rates

### 7.1 Requirements

**TAX-BI-001 (P0): Template-based import.**
The system shall provide downloadable import templates (CSV and XLSX) for: jurisdictions, tax types, rate schedules with bands, and caps. Templates include a header contract version so old files fail fast with a clear message.

**TAX-BI-002 (P0): Staging + validation before commit.**
Imports land in a staging area and run a validation pass producing a row-level error/warning report: unknown jurisdiction codes, overlapping effective dates for the same jurisdiction+tax type, non-contiguous or overlapping bands, missing upper bounds where required, negative rates, currency mismatches. Nothing is committed if any **error** exists (warnings are committable with acknowledgment).
- *Acceptance:* Given a file where UK income-tax bands overlap (0–37,700 and 35,000–50,270), when validated, then the import is blocked with the offending rows and reason identified; correcting the file allows commit.

**TAX-BI-003 (P0): Import as Draft, publish via workflow.**
Committed imports create Draft rate-schedule versions that flow through the same approval workflow as manual edits (TAX-RR-005). No import can silently change Published rates.

**TAX-BI-004 (P0): Dual scope — platform and tenant.**
Bulk import operates at (a) platform library scope for the internal content team and (b) tenant scope for client-specific overrides (Capability D), with identical templates so implementation teams reuse one toolchain.

**TAX-BI-005 (P1): Delta detection.**
On import, the system flags which rows are new, changed vs. current published version, or identical (no-op), so reviewers approve only meaningful diffs.

**TAX-BI-006 (P1): Import history & rollback.**
Every import batch is retained with file hash, user, timestamp, and outcome; a batch of Draft versions can be discarded in one action prior to publish.

### 7.2 Corresponding Design

- **Pipeline:** Upload → virus scan → parse (schema-versioned) → stage (tenant-isolated staging tables keyed by `import_batch_id`) → validation engine (rule set shared with API sync, Capability C) → reviewer UI (diff view) → commit → Draft `RateSchedule` versions → Approvals → Publish event.
- **Validation engine is a shared service** — the same invariant checks (band contiguity, date overlap, cap sanity) run for bulk files, UI edits, and Tapestry sync payloads. One rulebook, three entry points; this prevents the classic drift where the API path accepts what the file path rejects.
- **Idempotency:** batch commits are idempotent on `(tenant_id, file_hash)` to protect against double-submits.
- **Performance target:** 50,000 rate rows validated in < 60s; async processing with progress + email/notification on completion.
- Emits `TaxRateImportCommitted` and `TaxRateSchedulePublished` domain events to the platform event bus (consumed by audit, cache invalidation, and downstream recalculation candidates job).

---

## 8. Capability C — Global Tax Compliance Platform Integration (e.g., Tapestry)

### 8.1 Requirements

**TAX-CP-001 (P0): Provider-agnostic connector framework.**
The system shall integrate with external global tax compliance content providers through a provider-agnostic adapter interface; Tapestry is the first implementation. Adding a second provider must not require engine changes.

**TAX-CP-002 (P0): Rate content sync.**
The connector shall pull jurisdiction rate content (rates, bands, caps, effective dates, and provider metadata/citations) on a schedule (daily default) and on demand. Synced content lands as Draft versions attributed `source = TAPESTRY` with the provider's reference ID, then follows the standard review/publish workflow. Clients may configure **auto-publish** for provider updates (opt-in, with notification) or manual review (default).
- *Acceptance:* Given Tapestry publishes a change to Ireland USC bands effective next Jan 1, when the nightly sync runs, then a Draft version appears in the review queue with a diff against current published, provider citation attached.

**TAX-CP-003 (P1): Compliance alerts passthrough.**
Where the provider exposes regulatory alerts/achievability guidance tied to jurisdictions (e.g., new reporting obligations for equity income), surface these as informational notices in the client console linked to affected jurisdictions.

**TAX-CP-004 (P1): Coverage mapping report.**
Report showing, per client, which of their active participant jurisdictions are covered by provider content vs. manually maintained vs. uncovered.

**TAX-CP-005 (P2): Bi-directional attestation.**
Push back to the provider (where supported) a record of which content versions the client has adopted, supporting compliance attestation trails.

### 8.2 Corresponding Design

- **Adapter pattern:** `TaxContentProvider` interface (`fetchJurisdictions()`, `fetchRateSchedules(jurisdiction, asOf)`, `fetchAlerts()`, provider auth/config). `TapestryAdapter` implements it; provider payloads are normalized into the internal canonical rate schema before touching staging.
- **Sync service** is a scheduled worker per tenant-scope subscription: platform-level subscription feeds the global library; a tenant-level subscription (if a client licenses provider content directly) feeds tenant Draft overrides. Entitlement checks ensure a tenant only receives content their license covers.
- **Same staging + validation path as bulk import** (Capability B) — provider content is not trusted blindly; it must pass the identical invariant checks.
- **Reconciliation job:** nightly comparison of published platform rates vs. provider current content; drift beyond tolerance raises a review task.
- **Failure handling:** sync failures degrade gracefully (last published rates remain in force); stale-content warning surfaces in the console if provider content is > N days old (configurable).
- **Security:** provider credentials in the platform secrets manager; per-tenant data isolation maintained — provider responses are never shared across tenants when the subscription is tenant-scoped.

---

## 9. Capability D — Multi-Tenant Client Rate Console & Overrides

### 9.1 Requirements

**TAX-CL-001 (P0): Inheritance model.**
Every tenant automatically inherits the Published global rate library. The client console shall display the tenant's **effective rate set** — global defaults merged with any tenant overrides — clearly badging each rate's origin (Global / Client Override / Provider).

**TAX-CL-002 (P0): Override at any granularity.**
Client admins (with permission) can override at: entire jurisdiction, tax type, rate schedule, individual band, or cap level. Overrides are effective-dated and versioned identically to global rates. An override shadows the global rate for that tenant only; other tenants are unaffected.
- *Acceptance:* Given the global library has Canada federal withholding at X%, when Client A overrides to Y% effective a given date, then Client A calculations use Y% from that date, Client B continues on X%, and the console shows Client A's Canada rate badged "Client Override" with a link to the shadowed global value.

**TAX-CL-003 (P0): Override governance.**
Overrides require maker-checker approval within the tenant (configurable: some clients may allow single-approver). Every override records reason text and optional attachment (e.g., client tax advisor memo).

**TAX-CL-004 (P0): Revert to global.**
A tenant can end-date an override to fall back to the global rate, prospectively, without deleting history.

**TAX-CL-005 (P1): Divergence report.**
Report listing all tenant overrides, the global value shadowed, delta, and age — supporting periodic review ("are these still intentional?"). Flag overrides shadowing a global rate that has since changed.

**TAX-CL-006 (P1): Tenant-defined custom tax types.**
Tenants can define custom tax components not present globally (e.g., hypothetical tax for equalized assignees, client-specific levies), scoped strictly to the tenant.

**TAX-CL-007 (P2): Sandbox tenant rate sets.**
A tenant "sandbox" rate environment for testing upcoming changes against sample transactions before promoting.

### 9.2 Corresponding Design

- **Resolution is layered, not copied:** the tenant effective rate set is computed at read time as `overlay(tenant_overrides, global_published)` and **materialized into a per-tenant cache** keyed by `(tenant, jurisdiction, tax_type, as_of_date)`; cache invalidated by publish events from either layer. This avoids fork-and-drift (copying global rates into each tenant, then losing updates) — the historical failure mode of competitor systems.
- `TenantRateOverride(id, tenant_id, target_scope ∈ {JURISDICTION, TAX_TYPE, SCHEDULE, BAND, CAP}, target_ref, override_payload, effective_from/to, version, status, reason, approved_by)` — same versioning semantics as `RateSchedule`.
- **Row-level tenant isolation** enforced at the data layer (tenant_id discriminator + policy) and service layer (tenant context propagation); overrides are unqueryable cross-tenant by construction.
- **Precedence within tenant layer:** most specific scope wins (Band override > Schedule > Tax type > Jurisdiction).
- Console UI = effective-set grid with origin badges, inline diff to global, effective-date timeline per rate, and an approval inbox integrated with the platform Approvals domain.

---

## 10. Capability E — Participant Tax Profile: Demographics, Mobility, YTD

### 10.1 Requirements

**TAX-PP-001 (P0): Effective-dated demographic tax levers.**
Demographic import (HRIS feed and file) shall carry, per participant, effective-dated values for: residence country, work country, work sub-national location (state/province), local jurisdiction where relevant, tax residency status/certificate flags, expatriate/assignee status, and payroll entity/country. Each value change creates a new effective-dated segment; history is never overwritten.
- *Acceptance:* Given a participant's import shows work location US-CA until Mar 31 and UK from Apr 1, when the profile is viewed, then both segments appear with correct dates, and the Apr 1+ segment drives UK treatment for events on/after that date.

**TAX-PP-002 (P0): Location history integrity.**
Validation on import: no overlapping segments per dimension, no gaps unless explicitly flagged, retro changes (corrections to past segments) require elevated permission and trigger a **recalculation-candidate flag** on any transactions whose tax was computed using the corrected segment.

**TAX-PP-003 (P0): YTD income and YTD taxes paid ingestion.**
Payroll feed/file shall provide, per participant per jurisdiction per tax type, YTD taxable income and YTD tax withheld, with an as-of date and tax-year identifier (supporting non-calendar tax years, e.g., UK 6-Apr year). The engine shall additionally self-accrue YTD amounts from equity transactions it processes, and reconcile: **external payroll YTD (when fresh) takes precedence; platform-accrued equity YTD fills the gap between payroll as-of date and event date.**
- *Acceptance:* Given payroll YTD as of last month-end shows income just below a Social Security wage base, and an intervening platform-processed release added income crossing the base, when a new exercise occurs, then the engine computes remaining cap headroom using payroll YTD + platform-accrued interim amounts, and caps the tax accordingly.

**TAX-PP-004 (P0): Participant-level rate overrides.**
Support participant-specific rate instructions with effective dates: elected supplemental withholding rate (where legally permitted, with jurisdiction-configurable floor/ceiling), exemption certificates (e.g., social security certificate of coverage/A1 → suppress a tax type), treaty-based flat overrides, and fixed additional withholding.

**TAX-PP-005 (P1): Mobility segment audit view.**
A per-participant "tax timeline" showing location segments, rate overrides, YTD snapshots, and taxable events plotted together — the first artifact support teams reach for on any withholding query.

**TAX-PP-006 (P1): Missing-data guardrails.**
If a taxable event occurs for a participant with no valid location segment on the event date, the engine shall (configurable per client): block the transaction, or apply a client-designated default jurisdiction with a prominent exception flag routed to a work queue.

### 10.2 Corresponding Design

```
ParticipantTaxProfile(participant_id, tenant_id)
LocationSegment(id, participant_id, dimension ∈ {RESIDENCE, WORK_COUNTRY,
    WORK_SUBNATIONAL, WORK_LOCAL, PAYROLL_ENTITY}, jurisdiction_id,
    effective_from, effective_to, source ∈ {HRIS, FILE, MANUAL}, import_batch_id)
ParticipantRateOverride(id, participant_id, tax_type_id, jurisdiction_id,
    override_kind ∈ {ELECTED_RATE, EXEMPT_CERT, TREATY_RATE, ADDL_FIXED},
    value, cert_ref, effective_from/to, status)
YtdSnapshot(id, participant_id, jurisdiction_id, tax_type_id, tax_year_id,
    ytd_income, ytd_tax_withheld, as_of_date, source ∈ {PAYROLL, PLATFORM_ACCRUED})
TaxYear(id, jurisdiction_id, start_month_day, end_month_day)
```

- **Bitemporal storage** for location segments (valid time + system/knowledge time): we can answer both "where was she on Mar 1" and "what did we *believe* on Mar 1 when we calculated," which is exactly what audit and restatement require after retro HR corrections.
- Demographic ingestion extends the existing **External Connections / HRIS integration** pipeline — same connector, new tax-lever field mappings and segment-building logic; no parallel import stack.
- **Recalculation-candidate service:** subscribes to `LocationSegmentCorrected` and `YtdSnapshotRestated` events, matches affected transactions, and queues them for review/recalc — deliberately human-in-the-loop in v1 (auto-recalc is P2).
- YTD reconciliation logic lives in one service (`YtdPositionService`) that returns a single authoritative "position as of event date" = latest payroll snapshot ⊕ platform-accrued deltas after snapshot as-of; every engine component queries this rather than raw snapshots.

---

## 11. Capability F — Tax Rules Engine

### 11.1 Requirements

**TAX-RE-001 (P0): Rule dimensions.**
A tax rule shall be definable over the following match dimensions (any combination; unspecified = wildcard):
- **Event/transaction type:** grant, vest/release, exercise (and exercise style: cash, cashless, net), sale (with holding-period qualification, e.g., ISO qualifying vs. disqualifying, ESPP qualifying vs. disqualifying), ESPP purchase, dividend/dividend-equivalent, expiration/cancellation, mobility-triggered exit charge.
- **Grant/award type:** RSU, RSA (incl. 83(b) status), NSO, ISO, ESPP (423 vs. non-423), PSU, SAR, warrant, cash-settled variants.
- **Jurisdiction(s):** matched from participant location segments (residence and/or work, configurable per rule).
- **Participant attributes:** assignee status, exemption certificates, director/officer flag.
- **Grant-level attributes:** plan, sub-plan, grant agreement tax treatment code (see TAX-RE-004).

**TAX-RE-002 (P0): Rule outcomes.**
A matched rule determines: (a) is the event taxable in this jurisdiction; (b) the taxable base definition (spread at exercise, FMV at release, discount + gain components for ESPP, gain over basis for sale); (c) which tax types apply; (d) the sourcing/allocation method for mobile participants; (e) the rate resolution path (per precedence); (f) withholding settlement method eligibility (net share settlement, sell-to-cover, cash).

**TAX-RE-003 (P0): Mobility sourcing & trailing liability.**
For participants with location changes between a rule-defined **sourcing start** (typically grant date or vesting start) and the taxable event, the engine shall allocate the taxable base across jurisdictions using configurable methods per jurisdiction pair: time-based apportionment on calendar days or workdays over the sourcing period (OECD-style), full source-country taxation, or residence-only. Each allocated portion is then taxed under that jurisdiction's applicable rates — producing **multi-jurisdiction withholding on a single event**.
- *Acceptance:* Given an RSU granted while working in Germany, with a move to the US 18 months into a 36-month vest, when the release occurs, then (under time-apportionment config) 50% of release income sources to Germany and 50% to the US, each side computed with its own tax types, bands, and YTD context, and the result itemizes both.

**TAX-RE-004 (P0): Grant-level rate/treatment association.**
A grant (or grant tranche) can carry a tax treatment association that pins or adjusts behavior for that award: a designated rate schedule, a fixed override rate, a sourcing-method override, or an exempt flag — taking precedence over client defaults per the precedence model. Set at grant creation, by amendment (with approval), or in bulk.
- *Acceptance:* Given a legacy converted grant flagged with a fixed 47% withholding association, when it releases, then 47% is applied for the associated tax type regardless of the client's banded schedule, and the calculation record cites the grant-level association as the rate source.

**TAX-RE-005 (P0): YTD-aware progressive and capped computation.**
Where a rate schedule's bands use `ytd_basis = YTD_TOTAL_INCOME` (or supplemental), the engine shall place the event's taxable income **on top of** the participant's YTD position (per TAX-PP-003) to select bands and compute marginal amounts; wage-base caps shall consume remaining headroom only.
- *Acceptance:* Given US YTD supplemental wages of $950,000 (22% tier) and a $200,000 release, when computed, then $50,000 is withheld at 22% and $150,000 at 37% (threshold crossover mid-event), itemized per tier.

**TAX-RE-011 (P0 — promoted from P2): Composable taxable base definitions.**
The taxable base for each event/grant combination shall be a first-class, configurable, versioned object — an expression over named inputs (FMV at event, strike/purchase price, share count, gain over basis, prior-taxed amount) rather than a formula hard-coded in engine code. Base definitions are effective-dated, approval-gated, and independently unit-testable.
- *Acceptance:* Given an option-exercise base defined as `(fmv − strike) × shares` and an RSU-release base defined as `fmv × shares`, when each event is processed, then the correct base object is applied, and each base can be validated in isolation with a fixture without running a full calculation.

**TAX-RE-012 (P0 — promoted from P2): Conditional predicates on rules.**
A rule shall carry zero or more conditions evaluated against the event context; the rule fires only if all conditions pass. Conditions may also select which base definition or rate path applies. Supported predicate operands in Phase 1: holding period, YTD income/tax thresholds, disposition qualification (qualifying/disqualifying), boolean participant flags, and date comparisons. Predicates are drawn from a constrained, safe operand/operator set — not free-form code.
- *Acceptance:* Given an ESPP disposition rule with condition `holding_period ≥ qualifying_threshold`, when a qualifying disposition is processed, then the qualifying base definition and rate path are selected; a disqualifying disposition on the same grant selects the alternate base — with no separate rule duplication.

**TAX-RE-013 (P0): Effective-dated, versioned rule logic.**
The rule set itself (match criteria, conditions, outcome mappings) shall be effective-dated and versioned with the same rigor as rate schedules — a rule change effective for events after a given date does not retroactively alter prior calculations. Calculations pin the rule version in force on the taxable event date.

**TAX-RE-006 (P0): Deterministic precedence & explainability.**
Rate resolution follows: Participant override → Grant-level association → Tenant override → Global default. Every calculation shall persist a full **explanation trace**: rule matched, location segments used, sourcing allocation, rate source at each step (with version IDs), YTD inputs, band-by-band math, caps applied, FX rates used. Trace is retrievable via UI and API.

**TAX-RE-007 (P0): Rule lifecycle & simulation.**
Rules are tenant-scoped (with a platform default rule pack as a starting template), versioned, effective-dated, approval-gated, and testable via a simulation mode: run a hypothetical or historical transaction against draft rules and diff the outcome vs. current.

**TAX-RE-008 (P1): Conflict detection.**
On rule save, detect overlapping rules with identical specificity matching the same event context; block ambiguity or require explicit priority ordering.

**TAX-RE-009 (P1): Employer-side taxes.**
Compute employer social costs (payer = EMPLOYER) alongside employee withholding for accrual/reporting, excluded from participant net settlement.

**TAX-RE-010 (P2): Automated treaty relief** as a first-class construct (de minimis day-count thresholds promoted to P1 under TAX-JC-002).

---

### 11.1a Two-Layer Restructure: Claims and Treatments

*Added following grammar stress testing. Scenarios involving mobile participants with partial exemptions, multi-component dispositions, and historical-value bases each broke a single-rule model in the same direction: one rule was attempting to answer "where," "how much," and "at what rate" simultaneously. The engine is therefore restructured into two cooperating layers. Naming: the authoring construct is a **Tax Treatment**; the jurisdiction-determination construct is a **Jurisdiction Claim**.*

**TAX-JC-001 (P0): Jurisdiction Claim as a first-class construct.**
Jurisdiction determination shall be modeled separately from tax treatment. A Claim states that a jurisdiction has a taxing right over an award, and carries: the **sourcing period anchors** (configurable start and end — e.g., grant→vest, offer→vest, hire date→vest, grant→release), the **sourcing method** (time apportionment on calendar or workdays, full source-country, residence-only), and the **split basis** with co-claiming jurisdictions. Claims are configured per jurisdiction or jurisdiction pair, effective-dated and versioned, and evaluated **before** any Treatment fires.
- *Acceptance:* Given a participant who worked in Germany then the US across a 36-month vest, when a release occurs, then the Claim layer produces two claims (DE 50%, US 50%) and the engine instantiates the applicable Treatment once per claim — each Treatment evaluation seeing exactly one jurisdiction.

**TAX-JC-002 (P1): Claim-level conditions.**
A Claim may carry conditions evaluated before the claim is admitted: workday or presence-day thresholds (de minimis), treaty presence tests, and employment-status tests. A failed condition means the jurisdiction has no claim and no Treatment is evaluated for it.
- *Acceptance:* Given a de minimis threshold of 183 workdays configured on a jurisdiction, when a participant accrued 40 workdays there during the sourcing period, then no claim arises for that jurisdiction and the base is reallocated among remaining claimants per the configured split basis.

**TAX-JC-003 (P1): Relative jurisdiction values.**
Jurisdiction slots shall accept relative references — "home country," "payroll entity country," "country of residence at grant" — in addition to named jurisdictions, resolved from the participant profile at evaluation time. Required for hypothetical tax on tax-equalized assignees.

**TAX-JC-004 (P1): Sub-national (hierarchical) claims — US first.**
Claims shall be modelable at sub-national levels (state, and where relevant locality/municipality) that nest inside a country claim, because sub-national jurisdictions may assert their own sourcing rules that diverge from the federal split. A country claim and its sub-national claims are evaluated together for one event; the sub-national claim may use a different sourcing method, sourcing period, or allocation percentage than its parent, and its admitted share is independent of the country-level share.

Rationale (US): Several US states source equity compensation differently from the IRS. New York in particular applies a workday-allocation approach that can pull a departed employee's later vesting/exercise income back to NY even when federal sourcing would not; other states (e.g., states with no personal income tax) assert no claim at all. A single country-level US claim therefore cannot represent state taxation correctly.

- *Acceptance (resident, single state):* Given a participant who worked only in Texas (no state income tax) across the vesting period, when a release occurs, then the US federal claim is admitted at 100% and no state claim is admitted, so no state withholding is produced.
- *Acceptance (mover, divergent state sourcing):* Given a participant who worked in New York for the first half of the vesting period and California for the second half, when a release occurs, then (a) the federal claim is admitted at 100%, (b) a New York state claim and a California state claim are each admitted per their own state sourcing rules, and (c) each state claim resolves its own rate path and YTD context independently — producing federal, NY, and CA lines from one event.
- *Acceptance (trailing NY):* Given a participant who worked in New York at grant but relocated to Florida before vesting, when a release occurs, then a New York state claim may still be admitted for the NY-sourced portion under NY workday allocation, even though the participant's residence at vest is a no-tax state.

**TAX-JC-005 (P1): State sourcing method library and residency vs. work-state distinction.**
The claim layer shall support, per US state, a configurable sourcing method — including workday allocation over a defined grant-to-vest (or grant-to-exercise) period, full taxation by state of residence at vest, and allocation by state of residence over the period — and shall distinguish **work state** from **state of residence**, since some states tax on residence and others on where the work was performed. Double-claim situations (a residence state and a work state both asserting) shall be representable, with the treatment layer responsible for any resident-credit mechanics.

- *Acceptance:* Given a participant resident in New Jersey but working in New York during the period, when a release occurs, then both a NY work-state claim and an NJ residence-state claim can be admitted, each with its configured sourcing method, and both surface as separate lines for the treatment layer to handle (including any NJ credit-for-taxes-paid treatment).

**TAX-JC-006 (P2): International sub-national extension.**
The same hierarchical-claim mechanism shall extend to non-US sub-national jurisdictions where equity income is sourced below the country level (e.g., Canadian provinces, Swiss cantons, Japanese prefectures, Spanish autonomous communities). US state support (TAX-JC-004/005) is the reference implementation; international sub-national jurisdictions are configured on the same model without engine changes.


**TAX-RE-014 (P0): Explicit taxability outcome.**
A Treatment shall declare taxability as an explicit three-state outcome: **withhold**, **report only** (a reporting obligation with no withholding), or **not taxable here**. Taxability shall not be implicit in whether a Treatment matched.
- *Acceptance:* Given an RSA with a valid 83(b) election, when the vest event occurs, then the matched Treatment returns "not taxable here" with the election cited in the trace, and no withholding instruction is generated; the grant event carries the taxable Treatment instead.

**TAX-RE-015 (P0): Repeatable treatment components.**
A single Treatment shall emit one or more **components**, each with its own base definition, rate path, tax type, and payer — for one event in one jurisdiction. Supersedes the earlier one-base-one-rate outcome shape.
- *Acceptance:* Given a qualifying ESPP disposition in the US, when processed, then a single Treatment emits an ordinary-income component (lesser of grant-date discount or actual gain) and a capital-gain component (remainder), each at its own rate, itemized separately in the result and trace.

**TAX-RE-016 (P0): Prior-event operands and prior-taxed tracking.**
Base definitions shall be able to reference values from prior transactions on the same grant (e.g., market value at a previous exercise, purchase price at an earlier ESPP purchase) and the cumulative **amount previously taxed** per jurisdiction and tax type. The engine shall net previously-taxed amounts to prevent the same income being taxed twice across events.
- *Acceptance:* Given an ISO exercised two years ago and now sold in a disqualifying disposition, when processed, then the ordinary-income base resolves to the spread measured at the original exercise (not at sale), and any amount already taxed on that grant in that jurisdiction is netted from the base.

**TAX-RE-017 (P0): Payer dimension and payroll-entity jurisdiction.**
Every component shall declare a payer (employee or employer). Employer-side charges shall resolve their jurisdiction from the **payroll entity** rather than from the participant's tax jurisdiction, as these can differ. Employer components are excluded from participant net settlement and routed to accrual/reporting outputs.
- *Acceptance:* Given a participant taxed in France whose payroll entity is in Ireland, when a release occurs, then employee income tax resolves against France and employer social charges resolve against Ireland, each itemized with its own jurisdiction and payer.

**TAX-RE-018 (P0): Employment status as a rule dimension.**
Participant employment status (active / terminated / former) with leaver date shall be available as a Claim condition and a Treatment match dimension, sourced from the demographic feed as effective-dated segments. Required for trailing liabilities where a reporting obligation outlives the withholding obligation.
- *Acceptance:* Given a former employee exercising an NSO with a German trailing liability and no active German payroll, when processed, then the Treatment returns "report only" for Germany, produces the reportable amount, and generates no withholding instruction.

**TAX-RE-019 (P0): Tax-year assignment per jurisdiction.**
The engine shall determine, per claiming jurisdiction, which tax year an event's income falls into, using that jurisdiction's tax-year definition. YTD position, band placement, and cap headroom shall be evaluated within the correct year per jurisdiction.
- *Acceptance:* Given a release on 3 April for a participant with UK and US claims, when processed, then the UK portion is assigned to the tax year ending 5 April and the US portion to the calendar year, each using its own YTD context.

**TAX-RE-020 (P1): Grant-date snapshots.**
Values frozen at grant (FMV at grant, ESPP offering-date price and discount percentage, strike) shall be retained as an immutable snapshot on the grant and addressable by base definitions, independent of any prior transaction.

### 11.2 Corresponding Design

**Calculation flow (per taxable event):**

```
1. EVENT CONTEXT ASSEMBLY
   transaction(event type, dates, shares, FMV/price) + grant(type, dates,
   grant-date snapshot, treatment assoc.) + participant profile (location
   segments, employment status, overrides) + prior events on the grant
2. CLAIM EVALUATION            ← Layer 1 · "Where"
   for each candidate jurisdiction: sourcing period anchors → segment
   overlap → claim conditions (de minimis, presence, employment) →
   admitted claims + allocation split
3. TAX-YEAR ASSIGNMENT
   per admitted claim, map event date to that jurisdiction's tax year
4. TREATMENT MATCH             ← Layer 2 · runs once per claim
   most-specific tenant Treatment (fallback: platform pack) → taxability
   state (withhold / report-only / not taxable) → component list
5. PER COMPONENT: BASE RESOLUTION
   base definition (current-event, prior-event, or grant-snapshot
   operands) → allocated by claim split → net prior-taxed amount
6. PER COMPONENT: RATE RESOLUTION
   participant override → grant association → tenant override → global
   (payer determines jurisdiction: participant tax juris. for employee,
   payroll entity juris. for employer)
7. YTD POSITION FETCH  (per jurisdiction × tax type × assigned tax year)
8. COMPUTE
   band placement on YTD basis → marginal amounts → caps/headroom →
   surtax (tax-on-tax) pass → FX to settlement currency
9. RESULT + TRACE
   TaxCalculationResult (immutable, version-pinned inputs) → withholding
   instruction (withhold state only) / reportable record (report-only
   state) → settlement → platform-accrued YTD update → ledger events
```

**Architecture decisions:**
- **Engine is a pure, stateless calculation service**: `calculate(EventContext) → TaxCalculationResult`. All state (rates, segments, YTD) enters via the context assembled by an orchestrator. This is what makes the 64-test golden-suite approach scale — every scenario is a context-in/result-out fixture, and simulation mode is the same call with hypothetical context.
- **Rules as data, not code:** rules stored as structured match-criteria + outcome documents evaluated by a specificity-ranked matcher (most bound dimensions wins; ties broken by explicit priority).
- **Composable base as a mini-expression tree:** each base definition is a small serialized expression over a fixed operand set (`fmv`, `strike`, `purchase`, `shares`, `gain`, `prior_taxed`) with `+ − ×` and `max/min` operators — enough to express every equity base without a general-purpose language. Evaluated by a pure interpreter; every base is a testable fixture. This is the construct that turns "add a new taxable event" from an engine change into a data change.
- **Predicate layer, constrained by design:** conditions compile to a safe boolean AST over a whitelisted operand/operator set (no loops, no I/O, no arbitrary expressions), keeping the "rules as data" safety guarantee while unlocking the "if this, then that" flexibility clients actually need. This deliberately supersedes the earlier plan to defer all computed logic to P2 — the minimum predicate set is required for correct qualifying/disqualifying and threshold behavior at GA.
- **RESOLVED — compose vs. compete:** settled by grammar stress testing (qualifying ESPP disposition). **Composition happens *within* a Treatment via repeatable component lines (TAX-RE-015); a single Treatment still wins per claim.** One event in one jurisdiction can emit an ordinary-income component and a capital-gain component from one Treatment, rather than requiring multiple Treatments to layer. Surtaxes continue to resolve via the existing `base = TAX_AMOUNT` dependency ordering. This preserves the "one Treatment, readable as one sentence" authoring model while covering multi-component cases.
- **Immutability + event sourcing alignment:** `TaxCalculationResult` is an immutable record referencing exact version IDs of every input (rate schedule versions, rule version, segment IDs, YTD snapshot IDs). Recalculation after a correction produces a *new* result linked to the old — fits the event-sourced transaction ledger direction and gives restatement lineage for free.
- **Multi-jurisdiction result shape:** result = list of `JurisdictionTaxLine(jurisdiction, tax_type, taxable_base_allocated, band_details[], tax_amount, payer, rate_source, capped_flag)` — the statement, payroll export, and GL accrual all render from this one shape.
- **Performance:** effective rate set and rule pack are cached per tenant (invalidated on publish events); target p95 < 500ms per single-event calculation, batch vesting runs of 100k participants overnight via horizontally scaled workers.
- **Failure containment:** any unresolvable input (missing segment, stale YTD beyond tolerance, no matching rule) produces a typed exception outcome routed to the client exception work queue per TAX-PP-006 config — never a silent zero-tax event.

---

## 12. Cross-Cutting Requirements

**TAX-XC-001 (P0): Auditability.** Every create/update/approve/publish across all six capabilities writes to the platform audit log (who, what, when, before/after, reason). Calculation traces retained ≥ 7 years (configurable per client retention policy).

**TAX-XC-002 (P0): Tenant isolation.** No tenant may read or infer another tenant's overrides, rules, participants, or calculations. Enforced at data, service, and API layers; verified by automated isolation tests in CI.

**TAX-XC-003 (P0): API parity.** All capabilities (rate CRUD, imports, overrides, profile queries, calculation, trace retrieval, simulation) exposed via the platform API with the same permissions model as the UI.

**TAX-XC-004 (P0): Permissions.** Distinct permission sets: Platform Tax Content Admin, Client Tax Config Admin, Client Tax Approver, Client Tax Viewer, Payroll Integration (machine). Grant-level associations require an equity-admin + tax-config combined permission.

**TAX-XC-005 (P1): Notifications.** Configurable notifications on: provider content updates, override approvals pending, exception queue items, stale YTD/payroll feed, rate divergence flags.

**TAX-XC-006 (P1): Observability.** Calculation volume, exception rates, engine latency, sync health dashboards for internal operations.

---

## 13. Phasing

**Phase 1 — Foundation (MVP):**
Global rate repository (flat + banded + capped), bulk import with staging/validation, tenant inheritance + overrides with approvals, demographic tax-lever import with effective-dated segments, YTD ingestion, engine v1 covering release/exercise/sale/ESPP purchase for RSU/RSA/NSO/ISO/ESPP with single-jurisdiction resolution + YTD-aware bands/caps, full explanation trace.

**Phase 2 — Mobility & Content:**
Tapestry connector + sync workflow, mobility sourcing/trailing liability (time apportionment), multi-jurisdiction results, grant-level associations in bulk, participant rate overrides/certificates, divergence & coverage reports, simulation mode.

**Phase 3 — Scale & Sophistication:**
Employer-side taxes and GL accrual outputs, retro-correction recalculation workflow, custom tenant tax types, sandbox rate sets, conflict detection, second content provider, treaty/de-minimis constructs (P2s).

Sequencing rationale: Phase 1 is the smallest set that produces *defensibly correct* withholding for domestic participants — the core problem. Mobility (the hardest and most differentiating capability) lands second, once the rate/YTD substrate it depends on is hardened.

## 14. Success Metrics

**Leading:** % of client jurisdictions on governed rates (vs. manual/spreadsheet) — target 90% within 60 days of migration; import validation error rate trend; time-to-publish a rate change (target < 1 business day incl. approval); exception-queue rate < 0.5% of taxable events.
**Lagging:** withholding correction/adjustment rate (target < 0.1% of events per quarter); support tickets tagged "tax calc" (target −70% vs. baseline); enterprise RFP win-rate movement on deals scoring global mobility; audit findings related to tax withholding = zero.

## 15. Open Questions

1. **(Legal/Compliance — blocking):** Content liability model — where the platform ships global default rates, what disclaimer/attestation must clients accept? Does auto-publish of provider content shift liability?
2. **(Engineering — blocking):** Taxable event date basis — trade date vs. settlement date default, and is per-client configurability needed in Phase 1 or acceptable as fixed?
3. **(Product/Partnerships — blocking for Phase 2):** Tapestry commercial + API terms — is content licensed platform-wide or per client? This determines the subscription/entitlement design in Capability C.
4. **(Engineering — non-blocking):** FX rate source and timing convention per jurisdiction (some require official central-bank rates on specific dates) — Phase 1 single source with override, or configurable matrix?
5. **(Data — non-blocking):** Payroll YTD feed freshness SLA per client — what staleness tolerance triggers the exception path vs. proceeding with platform-accrued only?
6. **(Product — non-blocking):** Do we need participant-facing tax estimate previews (pre-release "what will I net") in Phase 2, or is that a separate participant-experience initiative?
7. **(Compliance — non-blocking):** Retention/localization requirements for calculation traces containing income data in specific jurisdictions (data residency implications)?
