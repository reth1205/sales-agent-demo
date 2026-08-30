# Feedback — phase-01 postvisit-guided-debrief — rx-ui-architect

## Friction

1. **La card afirma un hecho falso sobre el código (AC10 + "Fuera de alcance").** Dice
   "preservar los comandos de voz EN/ES ya reconocidos (`next`/`siguiente`, `previous`/`anterior`,
   `finish`/`finalizar` — ver `QuestionnaireStepper.tsx` y `src/services.ts` para dónde viven hoy)".
   No existen: `grep -rn "siguiente\|anterior\|finalizar" src/` devuelve **cero** hits en todo
   `src/`. El stepper actual es un panel de escucha pasiva sin ninguna navegación por voz. Un
   developer que tome AC10 al pie de la letra buscaría código inexistente y podría reportar la task
   como "preservado" sin implementar nada. Lo resolví shippeando `matchVoiceNavigationCommand` en
   `src/services.ts` como superficie NUEVA y reformulando AC10 en el brief como "implementar", pero
   el costo fue una ronda de verificación que la card debió haber hecho.

2. **`state.questionnaire.mode` nunca fue leído por la UI, tampoco `nextVoiceQuestion`.** La card
   detectó lo primero (`setQuestionnaireMode` sin call sites) pero no lo segundo:
   `actions.nextVoiceQuestion()` (`src/store.ts`) es un alias de una línea de `nextQuestion()` sin
   ningún call site. Queda como dead code después de esta fase; nadie lo tiene asignado.

3. **Trampa no anticipada por la card:** `combineDebriefText` concatena `prompt + answer` de cada
   pregunta RESPONDIDA, y `evaluateVisitObjectives` hace matching por keywords sobre ese texto. Si
   los prompts generados desde los objetivos contienen las palabras señal ("budget", "approval",
   "rollout"...), cada objetivo se marca `met` por el texto de su propia pregunta, con cualquier
   respuesta basura. La card pedía prompts "en lenguaje natural por objetivo (ej. objetivo
   'approval' → una pregunta hablable sobre aprobación de presupuesto)" — exactamente el redactado
   que rompe el checklist. Requirió redactar los 5 prompts evitando deliberadamente las señales.

## Proposed guide updates

| Guía | Cambio propuesto | Estado |
|---|---|---|
| `.claude/skills/feature` (redacción de la card) | Toda afirmación sobre comportamiento existente que entre en ACCEPTANCE ("ya reconocidos", "ya existe", "hoy funciona") debe llevar el grep que la verifica, ejecutado por el conductor. Las claims *negativas* de esta card ("cero call sites, confirmado por grep") sí venían verificadas; las positivas no. | proposed |
| `.claude/agents/rx-ui-architect.md` | Agregar a "Self-verification": cuando el brief hace que texto generado por código entre a un matcher de keywords existente, verificar que el texto generado no dispare el matcher por sí solo. | proposed |
