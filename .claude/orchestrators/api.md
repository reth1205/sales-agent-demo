# Orquestador de API

Flujo para cualquier trabajo de backend (.NET): un recurso CRUD, una funcionalidad sobre un recurso existente, una integración externa (Salesforce, un LLM). Las recetas viven en las skills (`/rx-api-crud`, `/rx-api-feature`); este archivo define cómo los agentes ejecutan una receta.

**El lane proviene de la dispatch card** (`/feature` Stage 0 lo elige; ver
[README.md](README.md) §1):

| Lane | Pipeline | Cuándo |
|---|---|---|
| **Slice** ← default | `rx-api-developer` (builder, author de sus propias tests) → `rx-api-auditor` | un vertical slice dentro de contracts que ya existen |
| **Full** | `rx-api-architect` → `rx-api-tester` (A) → `rx-api-developer` → `rx-api-tester` (B) → `rx-api-auditor` | schema nuevo · nuevo auth surface · nuevo resource area · una integración externa nueva (Salesforce, un LLM) · un change que toca ≥2 resources existentes |

Slice es el default porque el valor del architect es el juicio de architecture-fit sobre *new*
surface, y el Phase-A skeleton existe para evitar que un developer ratifique sus propios bugs en un
*nuevo* auth surface o integración externa. Ninguno de los dos se aplica cuando la tarea es "add a filter param to an existing list
endpoint" — ahí, la tabla ACCEPTANCE de la card es la test matrix y el auditor es el gate.

## Slice lane

```
 Stage 1  Builder         rx-api-developer ← dispatch card (BRIEF + ACCEPTANCE = the spec)
    │                     · implements the slice AND authors its tests against ACCEPTANCE
    │                     · runs build, full suite (two consecutive green runs) + local smoke     ▲
    │                       for any new route                                                     │
    │                     · schema / new auth surface / new external integration discovered?      │
    │                       → HALT and escalate to Full. Never a workaround.                      │
 Stage 2  Auditor         rx-api-auditor (fresh context, read-only) → severity-classified          │
    │                     report: spec conformance vs the card + judgement-shaped C-catalog       │
    └─►  Gate: CRITICAL / high WARNING? ── yes ──► loop back to Stage 1 (max 2 cycles) ────────────┘
                        └─ no (INFO/low logged) ──► task done → verify feedback files → check the box
```

La escalación es one-way y cheap. La demotion (Full → Slice) nunca ocurre mid-task.

## Full lane

```
 Stage 0  Dispatch card   every agent below receives a card (README §1); nobody opens plan.md
    │
 Stage 1  Architect       rx-api-architect → Feature Brief (or audit rubric for verify-only runs)
    │                     · design review contra el estado actual de server/src/
    │                     · schema needed? → dispatch the Db orchestrator NOW and wait for it
    │
 Stage 2  Tester (A)      rx-api-tester → test plan + compile-only skeleton tests
    │                     the plan is the acceptance target the developer implements against
    │
 Stage 3  Developer       rx-api-developer → implements against brief + test plan, fills the
    │                     skeletons' production surface, runs build + full test suite              ▲
    │                     (two consecutive non-overlapping green runs) + local smoke for any       │
    │                     new route                                                                │
    │                                                                                              │
 Stage 4  Auditor         rx-api-auditor (fresh context, read-only) → severity-classified          │
    │                     report: contract compliance (C-catalog) + spec conformance vs the card   │
    │                                                                                              │
    └─►  Gate: CRITICAL / high WARNING?  ── yes ──► loop back to Stage 3 (max 2 cycles) ────────────┘
                        └─ no (INFO/low logged) ──► task done → verify feedback files → check the box
```

## Handoff artifacts (cada uno alimentado verbatim en el prompt del siguiente stage)

| From | Artifact | Debe contener |
|---|---|---|
| Architect | Feature Brief | intent · resource(s) · API surface table · validation rules with exact error codes · repository/service/endpoint contracts · DI lifetimes · integraciones externas (credential handling) · behavior-changes whitelist (empty = no pre-existing test changes) · acceptance gate |
| Tester (A) | Test Plan | test matrix per tier (validator/repository/service/endpoint) · skeleton file paths · pre-existing tests in scope · open questions |
| Developer | Implementation report | files created/changed · build status · exact test counts per suite · local-smoke result · "ready for audit" (never "done") |
| Auditor | Audit report | summary counts · violations (File:line + contract quote + action) · spec-conformance verdict vs the dispatch card · doc drift · blocking-on-merge verdict |

En el Slice lane solo existen las dos últimas filas: la dispatch card es el brief, y su
tabla ACCEPTANCE es el test plan.

## Gate rules

- **El auditor es el final gate.** El developer nunca declara done; la tarea está done cuando la
  audit no tiene blocking findings Y la suite está green en dos consecutive runs.
- El loop-back target es Developer ↔ Auditor solo. El architect re-enter solo si la remediation
  necesita un schema change o un brief amendment — eso HALTS para human approval (vía el Db
  orchestrator).
- Un finding que requiere un schema change se routes al **Db orchestrator**, nunca al developer.
- Max 2 remediation cycles, luego STOP y surface al user.
- **Test discipline:** los pre-existing tests son sagrados **en ambos lanes**. Solo el architect puede
  autorizar un rewrite de un pre-existing test, y solo cuando el brief explicitamente listó el
  behavior change. En el Slice lane el builder author de tests para su own new surface only —
  tocar un pre-existing test escalates to Full.
- **Brief beats skeleton** (Full lane). Cuando un assertion de un Phase-A skeleton contradice una
  tabla en el Feature Brief, **la tabla del brief es normativa** en Stage 3.
- **Card beats habit** (Slice lane). Cuando la tabla ACCEPTANCE de la card contradice lo que los
  siblings del resource hacen, la card es normativa — flag the divergence en el implementation
  report en lugar de seguir silently the local pattern.
- **Local smoke es requerido** para cualquier new route (incluyendo validation-error paths):
  ejerce el route corriendo contra `dotnet run --project server/src/SalesAgent.Api` local.

## Shared protocol

Dispatch cards, feedback contract (`<plan-dir>/feedback/phase-NN-<task-slug>--<agent>.md`, uno
per agent que ran, escrito por el agent mismo), gates, phase batching, y recovery: ver
[README.md](README.md) — binding aquí. Work below the Slice threshold (un typo, un comment, un
one-line fix con zero reasonable test surface) es el **Direct lane** y no entra en este
orchestrator en absoluto — ver `/feature` Stage 0.
