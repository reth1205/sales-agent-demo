# Feedback — phase-01 aisa-objective-data-model — rx-ui-architect

## Friction

- La dispatch card fue suficiente: brief, Vocabulary, AC y guardrails completos, y los line
  anchors citados (`types.ts:18-35`, `services.ts:255-289/291-328/400-421/439-453`) coincidían
  exactamente con el árbol. No hubo que abrir `plan.md`.
- Fricción real: la card no menciona el riesgo de **colisión de keywords entre objetivos**, que
  es el punto donde este cambio puede romper AC6 en silencio. La keyword "expansión" que la card
  sugiere para `external-signal` colisiona con el nombre de la oportunidad sembrada de la misma
  cuenta demo (`opp-6 Multi-site Expansion`), que `buildSimulatedObjectiveAnswer` interpola en la
  respuesta simulada de `opportunity`. Sembrar la cuenta que la card pide y usar la keyword que
  la card pide habría producido cross-matching. Lo resolví en el brief (keyword set sin
  "expansión"/"opening"), pero es el tipo de detalle que la card debería anticipar cuando el
  matching es por substring global sobre texto concatenado.
- `src/data.ts` no está en el scope listado de `rx-ui-architect` en su agent file, pero el
  dispatch me lo asignó explícitamente (correctamente: es el seed que acompaña el cambio de
  shape). El scope del agent y la práctica divergen.
- No hay test runner: la verificación de AC5/AC6 es `npm run build` más razonamiento manual sobre
  substrings. Eso empuja la carga de corrección a la revisión del auditor.

## Proposed guide updates

| # | Archivo | Cambio propuesto | Estado |
|---|---|---|---|
| 1 | `.claude/agents/rx-ui-architect.md` | Agregar `src/data.ts` al Alcance del architect, acotado a "seed rows que acompañan un cambio de shape en `src/types.ts`" — hoy el agent file no lo lista pero el orquestador se lo asigna. | proposed |
| 2 | `.claude/orchestrators/ui.md` | En las reglas de precisión del brief: cuando una feature agrega entradas a una tabla de matching por keyword/substring, el brief DEBE incluir un paso de verificación de colisión (grep de cada keyword nueva contra los prompts, respuestas simuladas y datos demo interpolados existentes). | proposed |
| 3 | `CLAUDE.md` (raíz) | Documentar el invariante de `src/services.ts`: `combineDebriefText` pliega el prompt de cada pregunta respondida en el texto evaluado por `evaluateVisitObjectives`, así que prompts, respuestas simuladas y strings de datos interpolados comparten un namespace global de keywords. Hoy solo vive en un doc comment de `services.ts`. | proposed |
