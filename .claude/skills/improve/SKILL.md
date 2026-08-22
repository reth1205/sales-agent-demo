---
name: improve
description: "Explorar el corpus docs/plans/*/feedback/ en busca de filas 'Proposed guide updates' sin disposicionar y temas recurrentes de fricción, agruparlos, aplicar las actualizaciones aceptadas a los archivos reales (skills, agents, orchestrators, server/README.md, root CLAUDE.md), y marcar cada fila extraída como applied/rejected en su lugar. El brazo de aplicación del ciclo de mejora continua; la puerta de cierre Stage-5 de /feature pospone filas no críticas aquí. Usar cuando el usuario diga 'run the improve loop', 'apply the feedback', 'process the retro backlog', o '/improve'."
---

# /improve — aplicar el corpus de feedback

El ciclo `/feature` genera datos de fricción de primera mano (`docs/plans/*/feedback/*.md`, con una
tabla `Proposed guide updates` al final). Esta skill convierte esos datos en cambios aplicados.

**El modo de fallo que esta skill existe para prevenir: una mejora destilada, escrita y nunca
aplicada.** Distilar sin aplicar deja la misma fricción repitiéndose en cada plan siguiente.

## Usage

```
/improve                 # procesar todo sin disposicionar desde la última ejecución
/improve <plan-dir>      # procesar solo el feedback de un plan (ej. después de Close deferred rows)
/improve dry-run         # agrupar + reportar, no aplicar nada
```

## Procedure

1. **Collect — tables first, prose only if needed.** Extraer cada fila de propuesta sin leer
   archivos completos:

   ```sh
   awk '/^## Proposed guide updates/{f=1} /^## [^P]/{f=0} f && /^\|/ {print FILENAME": "$0}' \
     docs/plans/*/feedback/*.md
   ```

   Undispositioned = una fila que no termina en `→ applied <sha>` / `→ rejected — <reason>`; un
   marcador `→ deferred to /improve` cuenta como undispositioned — es la cola de esta skill. Solo
   después escanear la prosa libre (`## Friction`) para temas con ≥2 archivos independientes que
   nunca hicieron una fila de tabla. Para un backlog grande, desplegar subagents por fragmentos de
   fecha; cada uno debe cubrir cada archivo en su fragmento, no muestrear.
2. **Cluster.** Fusionar filas que proponen el mismo cambio al mismo destino; llevar el conteo de
   proponentes independientes y las citas. Un cluster = una unidad revisable.
3. **Verify against current state.** Leer el archivo destino primero — el corpus puede abarcar
   semanas y algunas filas ya pueden estar aplicadas (o el destino fue reescrito desde). Marcar
   esas `→ applied <sha>` con el commit que las implementó; nunca re-aplicar.
4. **Triage.** Apply: clusters con ≥2 proponentes independientes, o 1 proponente + un costo pagado
   nombrado (defect, lost round-trip, shipped bug). Reject (con razón, por escrito): contradice
   una convención vinculante, superseded, o wrong (las filas son leads, no truth — verificar claims
   antes de codificarlas en una guide). Preguntar al usuario solo por clusters que cambian un
   contract vinculante o un orchestrator gate.
5. **Apply.** Editar los archivos reales (`.claude/skills/*`, `.claude/agents/*`,
   `.claude/orchestrators/*`, `server/README.md`, root `CLAUDE.md`,
   `docs/plans/_templates/*`). El diff más corto que implementa la regla donde su audiencia la lee —
   una regla en un feedback file es invisible; una regla en la definición del agent es enforced.
6. **Disposition in place.** Append el marcador a cada fila extraída en su feedback file
   (`→ applied <sha>` / `→ rejected — <reason>`). Esto es lo que hace la próxima ejecución
   incremental — sin ledger separado.
7. **Report.** Clusters aplicados (archivo destino + cambio de una línea), rechazados (por qué), preguntas
   diferidas para el usuario. Commit como `docs(improve): apply feedback corpus <date-range>`.

## Rules

- Las filas de feedback son **leads agent-authored, no verified truth** — una fila que afirma un hecho de código
  (un port, una signature, un library behavior) recibe la misma verificación que cualquier claim breve
  antes de aterrizar en un doc durable.
- Nunca editar las secciones de feedback themselves — solo append disposition markers. Los planes
  cerrados permanecen inmutables aparte de eso.
- Code fixes proposed in feedback (scripts, component bugs, flaky tests) are NOT applied here —
  list them in the report as candidate tasks; they go through the normal orchestrators.
- Keep target docs lean: fold a new rule into the existing section that owns the topic;
  never append a "lessons learned" tail section.
