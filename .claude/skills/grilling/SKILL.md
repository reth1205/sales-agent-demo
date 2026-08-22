---
name: grilling
description: "Entrevista implacable de diseño: recorre cada rama del árbol de diseño, resolviendo dependencias entre decisiones una por una, haciendo UNA pregunta a la vez con una respuesta recomendada, hasta alcanzar un entendimiento compartido. Explora el codebase en lugar de preguntar cuando el código puede responder. Termina con un resumen de decisiones tomadas — el artefacto que el caller (un humano o el /feature skill) lleva al plan."
---

# /grilling — Entrevista de Diseño

Entrevíame implacablemente sobre cada aspecto de este plan hasta alcanzar un entendimiento
común. Recorre cada rama del árbol de diseño, resolviendo dependencias entre
decisiones una por una. Para cada pregunta, proporciona tu respuesta recomendada.

Haz las preguntas **una a la vez**, esperando feedback sobre cada pregunta antes de continuar.
Hacer múltiples preguntas a la vez es desorientador.

Si una pregunta puede ser respondida explorando el codebase, explora el codebase en su lugar.

Cuando el requisito dice "mirror feature X", abre la fuente real de X durante el grilling y
registra el MECHANISM en las decisiones tomadas, no solo el archivo ("AccountName = DB read view,
see migration 013" — no "join in the repository"). Un mecanismo mal descrito cambia silenciosamente
el contract class de la tarea (el plan de print-layout llamó a un view-sourced field un "code join" y
una tarea "apps-layer-only" se convirtió en un schema change a mitad del vuelo).

Cuando no queden preguntas materiales, cierra con un **resumen de decisiones tomadas**: una línea por
decisión (qué se decidió + el rationale que lo decide), en el orden que el plan las necesitará.
Este resumen es el artefacto que el caller (un humano o un *-feature conductor) lleva al
plan — el transcript no lo es.

## Operating notes

- **Fundamenta cada pregunta en cómo el código se COMPORTA REALMENTE.** Antes de preguntar, verifica la
  superficie real (la fuente del módulo/view relevante, `server/src/SalesAgent.Api/` routes, las
  migrations bajo `server/src/SalesAgent.Database/scripts/`). La pregunta valiosa es la bifurcación
  donde el requisito colisiona con el comportamiento existente — expone la colisión, declara tu
  recomendación y por qué, luego pregunta.
- **Resuelve en orden de dependencia.** Decide primero las cosas en que dependen las decisiones posteriores (domain
  ownership → data shape → security model → API surface → UI shape). Si una respuesta invalida
  una decisión anterior, dilo y re-solúbvala explícitamente.
- **Marca decisiones que tocan contratos.** Cualquier decisión que implique un cambio de DB schema,
  un nuevo auth surface, o una nueva integración externa (Salesforce, un LLM) recibe un marcador ⚠
  en el resumen de decisiones tomadas — estas necesitarán approval de architect + humano downstream.
- **Usa el AskUserQuestion tool** para cada pregunta cuando esté disponible: la opción recomendada
  primero, etiquetada "(Recommended)".
- **No grill lo obvio.** Una pregunta cuya respuesta es convencional o verificable en el
  codebase es respondida por ti, no preguntada — declara la assumption en el resumen en su lugar.
- **No entra un hecho sin verificar en una decisión tomada.** "Tomada" cierra la decisión, no su
  claim de soporte: un claim de third-party/security ("the SDK's default protects us"), un count,
  o un claim de status-code/exception se investiga durante el grilling o se registra con un
  marcador explícito `UNVERIFIED` que el plan debe resolver. Un claim incorrecto sobre un SDK-default sobrevivió
  un plan entero y cuatro stages dependieron de él.
- **Las views obtienen su mounting route.** Cuando una decisión nombra un archivo de screen/tab/view, registra
  la mounting route en la misma frase — una vez un brief designó como home una view nunca-importada para
  una warning operator-facing, y todos los gates se mantuvieron verdes.

## Output shape

```
## Settled decisions — <requirement>
1. <decision> — <deciding rationale>
2. <decision> — <deciding rationale>
3. ⚠ <contract-touching decision> — <rationale> (needs architect + human approval)
...
Assumptions taken without asking: <list, each with the evidence>
Open risks: <anything deliberately left unresolved, and why>
```
