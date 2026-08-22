---
name: rx-api-feature
description: "Cómo resolver una actividad no-CRUD en el backend de SalesAgent: un comportamiento sobre un recurso existente, una regla de negocio, una integración externa (Salesforce, un LLM), o un cambio de endpoint. Ejecutado a través del orquestador Api (rx-api-architect → rx-api-tester → rx-api-developer → rx-api-auditor) con necesidades de esquema dirigidas al orquestador Db primero."
---

# /rx-api-feature — Receta de Actividad API SalesAgent

Para trabajo de backend que NO es un recurso CRUD simple (eso es `/rx-api-crud`): agregar
comportamiento a un recurso existente, un endpoint computado/agregado, una integración con un
servicio externo (Salesforce, un LLM para generación de contenido), o un cambio de auth. Ejecutado
a través del **orquestador Api** (`.claude/orchestrators/api.md`).

## Usage

```
/rx-api-feature <descripción en lenguaje natural de la actividad, nombrando el/los recurso(s)>
```

Cuando se despacha desde `/feature`, la **dispatch card** es la especificación — su tabla BRIEF y
ACCEPTANCE, y los nombres de su Vocabulary verbatim. No abrir `plan.md`.

## Fase 0 — Dar forma a la actividad

Clasificar antes de despachar (esto determina lo que el brief del architect debe contener):

| Forma de la actividad | El brief debe además cubrir |
|---|---|
| Comportamiento sobre un recurso existente | reglas de validación afectadas + códigos de error exactos, whitelist de cambios de comportamiento (¡tests pre-existentes!) |
| Nuevo endpoint / forma de query | shape exacto de la query SQL (siempre parameterizada) |
| **Integración externa (Salesforce, un LLM)** | dónde vive el credential, dónde viaja, qué pasa en timeout/fallo/rate-limit del proveedor, y si la llamada es síncrona en el request path o diferida |
| Cambio de auth (login, sesión, tokens) | shape exacto del token/cookie, dónde vive el signing key en cada entorno (dev/CI/producción), y el failure mode (401 vs 403 vs enumeration) |
| Cambio de esquema embebido en cualquiera de los anteriores | **Orquestador Db PRIMERO** (rx-db-owner + gate humano); todo lo demás espera la migración aplicada |

## Pipeline

1. **`rx-api-architect`** — revisión de architecture-fit contra el estado actual de `server/src/`;
   Feature Brief con las secciones shape-specific anteriores.
2. **`rx-api-tester` (Fase A)** — test matrix + skeletons.
3. **`rx-api-developer`** — implementa contra brief + plan. Cambios de comportamiento sobre
   features pre-existentes ocurren SOLO si están whitelisted en el brief (tests se actualizan en
   el mismo commit, referenciando la línea del brief).
4. **`rx-api-tester` (Fase B)** — full suite dos veces (non-overlapping), plus local smoke de
   cada nueva/cambiada ruta incluyendo error/validation responses.
5. **`rx-api-auditor`** — fresh context; C-catalog + spec conformance vs plan/brief. Gate + loop
   per the orchestrator.

Obligaciones de dispatch-card y feedback según `.claude/orchestrators/README.md` — los agents
trabajan desde la card, nunca desde `plan.md`, y cada escribe su propio archivo de feedback de dos
secciones en la carpeta `feedback/` del plan; no feedback → no checkmark.

## Scratch probes — establecer hechos antes de que entren en un brief

Un hecho disputado o asumido sobre comportamiento de runtime (especialmente de un proveedor
externo: shape exacto de la respuesta de Salesforce, comportamiento de rate-limit de un LLM,
formato de error) recibe un probe, no un párrafo: un script/proyecto console desechable que hace
la llamada real y captura el payload verbatim. El output del probe — incluyendo sus control lines
— va al brief/dispatch verbatim. Nunca adivines un shape de respuesta externa desde su
documentación sin verificarlo contra una llamada real cuando sea posible.

## Hard rules

- Ningún agent excepto `rx-db-owner` toca un `*.sql` bajo `SalesAgent.Database/scripts/`.
- Los tests pre-existentes son sagrados; rewrites necesitan la línea explícita de behavior-change
  del brief.
- SQL siempre parameterizado.
- Un credential de servicio externo nunca se hardcodea — vive en configuración/secret store, y el
  brief documenta las tres preguntas (dónde vive, dónde viaja, cómo se configura por entorno).
- Las lanes aplican (`/feature` Stage 0b): un vertical slice dentro de contratos existentes es
  **Slice** (builder → auditor); un fix de zero-test-surface es **Direct** (un developer, sin
  plan dir).
