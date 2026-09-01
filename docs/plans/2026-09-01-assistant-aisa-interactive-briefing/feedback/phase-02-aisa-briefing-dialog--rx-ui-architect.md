# Feedback — phase-02 aisa-briefing-dialog — rx-ui-architect

## Friction

- La tarjeta dejó a mi criterio si `buildBriefingFollowUpAnswer` la escribía yo o el developer.
  La escribí yo: es el único contrato que el componente consume, y dejarla al developer
  habría significado entregar un componente que no compila hasta que él la escriba —
  exactamente lo que la regla de "el developer nunca codea contra superficie que no existe"
  prohíbe. La ambigüedad de la tarjeta costó una decisión que el lane Full ya tiene resuelta.
- La tarjeta cita `briefing().suggestedQuestions` con textos que no describe, y las 3 preguntas
  generadas en `buildPreMeetingBriefing` son plantillas interpoladas (contienen el nombre de la
  oportunidad, el `status`, el `nextAction`). Hacer match exacto por string sería frágil, así que
  `buildBriefingFollowUpAnswer` clasifica por palabra clave con un fallback determinista. Vale la
  pena que el plan lo sepa: agregar una 4ª pregunta sugerida sin una rama de keyword la manda al
  fallback genérico.
- `Account.externalSignals` no tiene campo `headline` (es `summary`); la tarjeta no lo dice y lo
  descubrí compilando. Fase 1 documentó el campo en `types.ts` con comentario, lo cual ayudó.
- Divergencia documentada (la tarjeta pedía documentarla): el eyebrow `AI briefing` del header
  de `AssistantNotificationSheet` SÍ debe pasar a `AISA briefing`. Dejar dos etiquetas de marca
  distintas a 40px de distancia en el mismo sheet contradice la decisión de branding del plan.
  Está en el brief como edición explícita del developer.
- `styles.css` no aparece en el scope declarado de ningún agente del orquestador Ui. Entregué
  las reglas `.aisa-*` yo mismo porque un componente compartido sin estilos no es entregable,
  pero la ambigüedad de propiedad es real y se repetirá.

## Corrección post-auditoría (WARNING high, aceptado)

El auditor tuvo razón: el branch de oportunidad matcheaba `'stage'|'opportunity'|'commercial'|
'pipeline'`, palabras que no aparecen en la pregunta real generada
(`Is ${opportunity.name} still in ${opportunity.stage}?`), así que era dead code y caía al
fallback. Corregido matcheando `'still in'`, `'commercial opportunity'`, `'pipeline'`, y
—guardados por `opportunity !== undefined`— `opportunity.name`/`opportunity.stage` en minúsculas.

Al verificar el fix contra `src/data.ts` aparecieron **dos colisiones que el fix ingenuo habría
introducido**, ambas corregidas:

1. `opportunity.stage.toLowerCase()` colisiona con las otras dos preguntas: acct-urban-foods
   tiene stage `Pricing` y `nextAction: 'Recover pricing discussion'`; acct-pinnacle tiene stage
   `Evaluation` y `status: 'Competitive evaluation'`. Solución: el branch de oportunidad ahora es
   el ÚLTIMO antes del fallback, para que los branches más específicos reclamen primero.
2. El branch de next-action matcheaba `'follow-up'` a secas, lo que se tragaba la pregunta 1 de
   acct-urban-foods (`status: 'Needs follow-up'`) — dos preguntas con la misma respuesta,
   rompiendo AC3. Estrechado a `'next action'` / `'follow-up should be created'` /
   `'after this visit'`.

Verificado con un script de ruteo sobre las 8 cuentas reales + el caso sin oportunidad: las 3
preguntas sugeridas caen en 3 branches distintos, cero fallbacks. `npm run build` verde. Firma
sin cambios; sigue determinista y sin LLM. `AisaBriefingDialog.tsx` y
`AssistantNotificationSheet.tsx` no se tocaron.

**Nota INFO del auditor sobre el paso `'ended'`:** fue intencional y lo dejo como está. El paso
existe en el union type porque el Vocabulary de la tarjeta lo nombra, y su render es una red de
seguridad si algún consumidor futuro mantiene el diálogo montado tras `onEndBriefing`. Con el
padre actual el sheet se desmonta en el mismo tick, que es el comportamiento deseado: retrasar
`onEndBriefing` para mostrar una despedida metería un timer en un componente que hoy no tiene
ninguno, y el remount ya satisface AC4.

## Proposed guide updates

| Archivo | Cambio propuesto | Disposición |
|---|---|---|
| `.claude/agents/rx-ui-architect.md` | Añadir `src/styles.css` al scope del architect **para las clases que introducen sus componentes nuevos**; el developer sigue siendo dueño de las clases page-level. Hoy el archivo no le pertenece a nadie. | deferred to /improve — clarificación de scope, sin defecto asociado |
| `.claude/orchestrators/ui.md` | En lane Full, regla explícita: toda función pura nueva de `src/services.ts` que un componente compartido nuevo consuma la entrega el architect junto al componente, no el developer. Elimina la decisión caso-por-caso. | deferred to /improve — clarificación de scope, sin defecto asociado |
| `.claude/skills/feature/SKILL.md` | Las tarjetas de dispatch que citan un campo de un tipo deben citar el nombre real del campo verificado contra `src/types.ts` (aquí: `summary`, no `headline`). | rejected — verificado contra las tarjetas de dispatch reales de este plan (Fase 1 y Fase 2): ninguna cita `headline`, ambas usan `summary` correctamente desde el primer draft. No se pudo confirmar el incidente que motiva la fila. |
| `.claude/agents/rx-ui-architect.md` | Regla nueva en "Self-verification": una función de despacho por keyword debe verificarse contra los **strings reales que produce el generador**, no contra las palabras que el autor imagina. Si el input es texto generado por plantilla, enumerar los inputs reales desde `src/data.ts` y confirmar que cada uno cae en un branch distinto. Mi defecto original y las dos colisiones subsecuentes salen todos de saltarme ese paso. | → applied 0ac9364 |
