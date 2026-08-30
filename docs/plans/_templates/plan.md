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
- Toda afirmación POSITIVA sobre comportamiento EXISTENTE que entre en ACCEPTANCE o en "Fuera de
  alcance" ("ya reconocidos", "ya existe", "hoy funciona") lleva el grep que la verifica,
  ejecutado por el conductor antes de escribir la card — igual que ya se exige para las claims
  negativas ("cero call sites, confirmado por grep"). Una card afirmó comandos de voz EN/ES "ya
  reconocidos" que no existían en el repo (grep cero hits); le costó al architect downstream una
  ronda de verificación completa antes de poder continuar (`docs/plans/2026-08-30-postvisit-aisa-guided-debrief/feedback/phase-01-postvisit-guided-debrief--rx-ui-architect.md`).
- Para un AC frasado como "en modo/estado X, ocurre Y automáticamente", el brief exige verificar
  explícitamente que el guard/efecto LEE esa señal de modo/estado — no solo que cancela/limpia
  correctamente. Un efecto puede cumplir "sin solape, se limpia al desmontar" y aun así dispararse
  incondicionalmente en todos los modos. Un AC de este tipo pidió narración solo en modo voz; el
  efecto canceló/limpió audio correctamente pero disparó la narración en ambos modos — detectado
  recién en auditoría, requirió un ciclo de remediación
  (`docs/plans/2026-08-30-postvisit-aisa-guided-debrief/feedback/phase-01-postvisit-guided-debrief--rx-ui-auditor.md`).

## Improvements (llenado en Etapa 5 de `/feature`, al cerrar)

<Cross-task themes destilados de `feedback/*/Proposed guide updates`, cada uno apuntando al
archivo real que se actualizó o se va a actualizar.>
