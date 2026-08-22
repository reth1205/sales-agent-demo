---
name: rx-api-crud
description: "Cómo crear (o auditar) un recurso CRUD en el backend de SalesAgent: la lista de verificación de 10 elementos (migration → entity/model → validator → repository → service → endpoint → routes → DI → tests → local smoke) ejecutada a través del orquestador Api (rx-api-architect → rx-api-tester → rx-api-developer → rx-api-auditor, o solo developer→auditor en Slice lane). Solo backend."
---

# /rx-api-crud — Receta CRUD de la API SalesAgent

Crea un recurso CRUD completo en `server/src/SalesAgent.Domain` + `server/src/SalesAgent.Api`
(o audita uno existente — misma lista de verificación, verificar en lugar de construir).
Ejecutada a través del **orquestador Api** (`.claude/orchestrators/api.md`).

## Uso

```
/rx-api-crud <Resource>
  table: <table>                    e.g. account
  fields: name (string, required, max 100), salesforce_id (string, optional, unique), ...
  route: /api/<resource-lc-plural>  (default si se omite)
  auth: required|anonymous          (default required una vez exista login; hasta entonces anonymous)
```

`/rx-api-crud audit <Resource> [focus: <areas>]` ejecuta la misma lista de verificación en modo
verificación (el spec se descubre a partir del código existente por parte del architect; el
developer solo ejecuta en los bucles de retroalimentación de remediación).

## Fase 0 — Confirmar el spec

Repite el modo + spec resueltos de vuelta (resource, table, route, auth, tabla de campos) y espera
confirmación. Si se despliega desde `/feature`, la **tarjeta de despacho** es el spec — confirma
contra su BRIEF y Vocabulary en lugar de volver a preguntar. Si falta cualquier input requerido,
pregunta.

## La lista de verificación de 10 elementos

| # | Item | Capa |
|---|---|---|
| 1 | **Migration** `NNN_<table>.sql`, idempotente, up + down — **autorada y aplicada por `rx-db-owner` (orquestador Db, puerta humana) ANTES de cualquier otra cosa** | `SalesAgent.Database/scripts/` |
| 2 | **Entity + Model** `{Resource}Entity` / `{Resource}Model` — clave `long`, columnas de audit (`created_at/by`, `updated_at/by`) | `SalesAgent.Domain/Entities`, `Models` |
| 3 | **Validator + error codes** — `{Resource}Validator` con una regla por constraint del brief, códigos exactos | `SalesAgent.Domain/Validators` |
| 4 | **Repository** — Dapper, SQL parameterizado siempre, un método por operación (`GetByIdAsync`, `ListAsync`, `CreateAsync`, `UpdateAsync` → `null` en zero-rows, `DeleteAsync`) | `SalesAgent.Domain/Repositories` |
| 5 | **Service** — reglas de negocio del brief; `DeleteAsync` resuelve 404 cuando el recurso no existe | `SalesAgent.Domain/Services` |
| 6 | **Endpoint + routes** — minimal-API, `/api/{resource-lc-plural}`, shape de error consistente | `SalesAgent.Api/Endpoints`, `Routes` |
| 7 | **DI lifetimes** — repository/service/endpoint `Scoped`, validator `Singleton` | `Program.cs` / extensión DI |
| 8 | **Auth placement** (si el resource requiere autenticación) — check en el nivel de endpoint/middleware, nunca hand-rolled en el service | `SalesAgent.Api` |
| 9 | **Tests por capa** — Validator / Repository (Postgres real) / Service / Endpoint según el plan del tester | `SalesAgent.*.Tests` |
| 10 | **Local smoke — REQUERIDO antes del sign-off** — contra `dotnet run --project server/src/SalesAgent.Api` local: cada verbo + una solicitud de bad-input por cada verbo que toma body, asertando status + shape de error. | stack local en ejecución |

## Pipeline

Ejecuta el orquestador Api con esta lista de verificación como la receta. **Un nuevo recurso CRUD
es casi siempre `LANE: Full`** — item 1 es un cambio de schema, que es un trigger Full por sí
mismo. Un recurso cuya tabla ya existe y cuya slice no añade auth surface nuevo ejecuta Slice
(pasos 1 y 4 colapsan en el builder).

1. **`rx-api-architect`** — desde la tarjeta de despacho + el estado actual de `server/src/`,
   produce el Feature Brief organizado por item de lista de verificación. Schema (item 1) →
   despliega el **Db orchestrator** primero y espera.
2. **`rx-api-tester` (Phase A)** — matriz de tests + skeletons de compile-only para item 9.
3. **`rx-api-developer`** — implementa items 2–8 en orden (nunca autoriza item 1; nunca edita
   tests en Full lane), construye después de cada paso, ejecuta la suite, reporta conteos exactos.
   *(Slice lane: también autoriza item 9 contra la tabla ACCEPTANCE de la tarjeta, y ejecuta item 10.)*
4. **`rx-api-tester` (Phase B)** — assertions reales, suite completa dos veces (runs
   no-overlapping), local smoke (item 10).
5. **`rx-api-auditor`** — contexto fresco; C-catalog + conformance de spec vs la tarjeta (+ brief
   en Full). Gate + reglas de loop según el orquestador (bloquea CRITICAL/high, max 2 ciclos).

Obligaciones de tarjeta de despacho y feedback por `.claude/orchestrators/README.md` — los agentes
trabajan desde la tarjeta, nunca `plan.md`, y cada uno escribe su propio archivo de feedback de
dos secciones en la carpeta `feedback/` del plan; no feedback → no checkmark.

## Convenciones clave (no desviarse)

- PKs `long` / `BIGINT`. SQL siempre parameterizado (Dapper), nunca string-concatenated.
- Validation vive en el service layer, nunca en repository o endpoint.
- `UpdateAsync` retorna `null` en zero-rows (nunca throw); el endpoint traduce eso a 404.
- Sin multi-tenancy/RLS todavía — no inventes account-scoping a menos que el brief lo pida
  explícitamente como una feature nueva (eso sería `LANE: Full` con una decisión de arquitectura
  a escalar al usuario primero).
