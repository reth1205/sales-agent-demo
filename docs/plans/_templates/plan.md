---
status: open
created: YYYY-MM-DD
closed:
---

# <Requirement título corto>

## Detalle

<Qué se entregará. Las decisiones asentadas durante `/grilling`. Los acceptance criteria — cada
uno con la superficie donde se observa (un endpoint, una view, un test, un log).>

## Dominio

<El área de negocio. ¿Toca `server/` (backend), `src/` (frontend), o ambos?>

## Por qué

<El problema, la necesidad del usuario/operator, el costo de no hacerlo.>

## Vocabulario

| Término | Nombre normalizado | Notas |
|---|---|---|
| | | |

Cada agente dispatcheado en este plan usa estos nombres verbatim en code, tests, y reports.

## Fases

### Fase 1 — <nombre>

- [ ] **<task-slug>** — executor: `/rx-api-crud` | `/rx-api-feature` | `/rx-ui-crud` | `/rx-ui-feature` | `db` — lane: Slice | Full
  Brief: <el brief completo que la tarjeta de dispatch llevará verbatim>
  Acceptance: <criterios + cómo se observa cada uno>
  Feedback esperado: `feedback/phase-01-<task-slug>--<agent>.md` (uno por agente que ejecute)

---

## Reglas de BRIEF ACCURACY (vinculante para cada brief de tarea arriba)

- Cita symbols, nunca `file.ext:NN` (los line anchors se pudren dentro del mismo commit que los agrega).
- Todo set enumerado (call sites, consumers, archivos afectados) lleva el grep que lo define —
  ejecútalo tú mismo antes de escribir el número en el brief.
- Un claim sobre comportamiento runtime exacto es probe-verified, o se frasea como intent
  ("debería surfacear como…") con un marcador `verify:`.
- Para superficie compartida nueva, especifica el OUTCOME, no el mecanismo.
- Un re-settlement (una decisión que cambia mid-plan) actualiza cada statement derivado de ella
  en el mismo edit — nunca deja una tabla desactualizada apuntando a la decisión vieja.

## Improvements (llenado en Etapa 5 de `/feature`, al cerrar)

<Cross-task themes destilados de `feedback/*/Proposed guide updates`, cada uno apuntando al
archivo real que se actualizó o se va a actualizar.>
