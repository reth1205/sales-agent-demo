---
status: closed
created: 2026-09-01
closed: 2026-09-01
---

# AISA pre-visit brief: recall from map pin + voice walkthrough

## Detalle

Dos ajustes sobre el `AisaBriefingDialog` recién fusionado
(`docs/plans/2026-09-01-assistant-merge-aisa-briefing/`):

### Ajuste 1 — Recall desde el pin del mapa

Hoy, una vez cerrado el sheet de AISA (End briefing / Simulate approach / X), no hay forma de
volver a abrirlo salvo recargar el estado de "próxima visita programada" — tocar el pin de una
cuenta en el mapa solo abre `CustomerMapSummarySheet` (resumen de cuenta), no reabre AISA.

Decisión del usuario (grilling): reusar exactamente el patrón del banner superior que ya existe
para la entrada del dashboard (`DefaultVisitBriefNotification`, "Client brief ready" → tap → abre
`AisaBriefingDialog` en el mismo tick vía `actions.openPreVisitAisaBriefing`) — "como lo hacemos al
llegar al dashboard" — pero generalizado para cualquier cuenta cuyo pin se toque, no solo la
próxima visita programada. No importa que la información mostrada sea la misma que antes de
cerrar (no se pide regenerar contenido distinto).

### Ajuste 2 — Walkthrough de voz en el brief

El cuestionario post-visita (`QuestionnaireStepper.tsx`) ya tiene un mecanismo de voz real: AISA
lee la pregunta en voz alta (`speakText`), el micrófono se abre automáticamente
(`startVoiceCapture`/`startNativeVoiceCapture`, Web Speech API en browser / `@capacitor-community/
speech-recognition` en nativo), la respuesta hablada se captura, y hay un fallback "Simulate
answer" cuando no hay reconocimiento disponible. El brief pre-visita (`AisaBriefingDialog`) hoy es
lo opuesto: el rep TOCA una pregunta sugerida (texto) y AISA "responde" con texto
(`buildBriefingFollowUpAnswer`) — cero voz.

Decisión del usuario (grilling, confirmado explícitamente tras aclarar la alternativa): se invierte
el sentido de la interacción para que combine con el mismo patrón que Parte 2 — **AISA hace la
pregunta (hablada) y el rep responde por voz** (micrófono se abre automáticamente), en vez de que
el rep pregunte y AISA responda. Las `suggestedQuestions` de `PreMeetingBriefing`
(`services.ts` línea 236-240, ya redactadas como preguntas de preparación —
p.ej. "What changed since the last conversation?") se reutilizan como los prompts que AISA voz-
pregunta al rep para que las piense/conteste en voz alta antes de entrar a la reunión, uno por uno.

### Acceptance criteria

| # | Criterio | Cómo se observa |
|---|---|---|
| 1 | Tocar el pin de una cuenta CON visita programada muestra el banner "brief ready" para ESA cuenta (no solo la próxima visita global); tocarlo abre `AisaBriefingDialog` en `prompt` en el mismo tick, reusando `openPreVisitAisaBriefing`. | Browser: click en pin de cuenta B (≠ próxima visita) → banner referencia cuenta B → tap → sheet abre con datos de cuenta B. |
| 2 | Tocar el pin de una cuenta SIN visita programada no muestra ese banner (no rompe nada nuevo). | Browser: pin de una cuenta sin `ScheduledVisit` asociada → sin banner "brief ready" nuevo. |
| 3 | Cerrar el sheet de AISA (cualquier vía) y volver a tocar el mismo pin vuelve a mostrar el banner/reabrir el brief. | Browser: cerrar → tap pin de nuevo → banner/apertura disponible otra vez. |
| 4 | Al llegar al paso `summary`/`qa`, AISA lee en voz alta cada `suggestedQuestions[i]` como un prompt de preparación (no como algo que el rep pregunta). | Browser + código: `speakText` se llama con el texto de cada `suggestedQuestions[i]`; verificar wiring, TTS real no es inspeccionable en headless — documentar como código-verificado. |
| 5 | Tras cada prompt hablado, el micrófono se abre automáticamente (mismo mecanismo que `QuestionnaireStepper`) para capturar la respuesta del rep en estado local del componente (no se persiste a `store.ts` ni `localStorage` — mismo invariante que ya documenta el doc-comment de `AisaBriefingDialog`). | Código: auto-listen wiring presente y equivalente al de `QuestionnaireStepper.tsx` líneas ~294-312; browser: en un entorno sin micrófono real, el fallback "Simulate answer"-equivalente permite avanzar sin bloquear la demo. |
| 6 | Si el reconocimiento de voz no está disponible/permiso denegado, existe un fallback (equivalente a "Simulate answer") que no bloquea completar el walkthrough. | Browser: forzar el path sin soporte de voz (mismo patrón `isVoiceDisabled`/toast de `QuestionnaireStepper`) → el rep puede seguir avanzando. |
| 7 | El rep nunca queda sin forma de avanzar entre prompts (comandos de voz next/previous/skip EN+ES vía `matchVoiceNavigationCommand`, o controles manuales explícitos — decisión del architect). | Browser: avanzar por todos los `suggestedQuestions` hasta llegar al step `ended` existente. |
| 8 | El CTA "Simulate approach" / "End briefing" al final del walkthrough sigue funcionando igual que en el plan anterior (sin regresión). | Browser: ambos caminos ejercidos, sin reabrir el sheet ni crear notificación duplicada. |
| 9 | `buildBriefingFollowUpAnswer` (`services.ts` línea 309, hoy con un único call site en `AisaBriefingDialog.tsx` línea 47) queda removida si ya no tiene consumidor, o repropósito documentado explícitamente — no se deja como código muerto silencioso. | `grep -r "buildBriefingFollowUpAnswer" src/` tras el cambio — o justificación en el Design Brief si se mantiene. |
| 10 | `npm run build` limpio. Cero errores de consola en el flujo completo (texto + fallback de voz). | Build + browser. |

## Dominio

Frontend (`src/`). No toca `server/`. Sin cambio de schema, auth, ni integración externa.

## Por qué

Confirmado en producto: (1) una vez cerrado el brief de AISA no hay manera de volver a verlo sin
releer el estado global de "próxima visita", lo cual rompe la demo cuando el usuario explora otras
cuentas en el mapa; (2) el brief pre-visita es la única superficie de AISA que sigue siendo
tap-based mientras el resto del producto (debrief post-visita) ya demuestra una interacción de voz
real — la inconsistencia se nota y debilita la narrativa de "asistente conversacional".

## Vocabulario

| Término | Nombre normalizado | Notas |
|---|---|---|
| Banner superior reusado para recall | `DefaultVisitBriefNotification` | Ya existe; se generaliza, no se crea un componente nuevo. |
| Acción que abre el brief | `openPreVisitAisaBriefing` | Ya existe (`store.ts` línea 555), sin cambios de firma esperados en Fase 1. |
| Prompts que AISA voz-pregunta | `suggestedQuestions` (de `PreMeetingBriefing`) | Reutilizados tal cual existen hoy — no se agregan preguntas nuevas al modelo de datos salvo que el architect determine que faltan. |
| Mecanismo de voz de referencia | patrón `QuestionnaireStepper` (`speakText`/`startVoiceCapture`/`startNativeVoiceCapture`/`isVoiceDisabled`) | Ver `src/components/QuestionnaireStepper.tsx` líneas 53-245 — el architect decide si se duplica localmente en `AisaBriefingDialog.tsx` (patrón de este repo: "briefing dialogs son props-in/events-out estrictos") o si esta es la 2da ocurrencia que amerita factorizarlo. |

## Fases

### Fase 1 — Recall del brief desde el pin del mapa

- [x] **recall-brief-from-map-pin** — executor: `/rx-ui-feature` — lane: Slice
  Brief: En `src/components/DefaultVisitBriefNotification.tsx`, generalizar el banner "Client brief
  ready" para que reaccione a la cuenta seleccionada vía su pin en el mapa
  (`state.ui.selectedMapAccountId`/`state.ui.selectedMapVisitId`, poblados por
  `actions.selectMapAccount` — único call site de pin-click: `src/components/MapView.tsx` línea 94,
  `.on('click', () => actions.selectMapAccount(account.id, visit?.id))`), no solo la "próxima visita
  programada" global (`getNextScheduledVisit`, `src/selectors.ts` línea 40, actualmente la única
  fuente de `visit()` en este componente).

  Cambios concretos:
  - `visit()`: si `state.ui.selectedMapAccountId` está seteado Y existe una `ScheduledVisit` para
    esa cuenta (`state.ui.selectedMapVisitId`), usar esa visita; si no, fallback a
    `getNextScheduledVisit()` (comportamiento actual, sin regresión para el flujo del dashboard sin
    selección).
  - `shouldShow()`: hoy excluye explícitamente `!state.ui.selectedMapAccountId` — esa exclusión se
    quita (o se reemplaza) porque el propósito ahora es exactamente mostrar el banner CUANDO hay una
    cuenta seleccionada con visita. Las demás guardas existentes (`!state.ui.visitBriefingAccountId`
    — hoy siempre `undefined`, `!state.ui.activeAssistantNotificationId`, `!hasVisibleAssistantNotification()`,
    `!state.ui.mapDemo.isRunning`, `!state.ui.meetingDemo.isRunning`) se mantienen — sin ellas el
    banner podría aparecer encima de un sheet de AISA ya abierto o durante una animación de mapa.
  - `openBrief()`: sin cambios — sigue llamando `actions.openPreVisitAisaBriefing(currentVisit.id)`.
  - Copy del banner (`"CLIENT BRIEF READY" / "{account} is ready for your visit prep."`): puede
    quedar igual (genérico) o ajustarse para no sonar exclusivo de "la próxima visita" — juicio del
    developer, sin necesidad de escalar.

  No tocar `CustomerMapSummarySheet.tsx` (sigue abriendo igual, en paralelo) ni
  `state.ui.visitBriefingAccountId` (campo ya inerte, confirmado en la auditoría del plan anterior
  — no reactivarlo).

  Vocabulary rows aplicables: `DefaultVisitBriefNotification`, `openPreVisitAisaBriefing`.
  Acceptance: criterios 1-3 de la tabla arriba.
  Contract approval: no requerida.
  Known-accepted: `state.ui.visitBriefingAccountId` permanece sin uso — no es parte de esta tarea
  reactivarlo ni borrarlo.
  Feedback esperado: `feedback/phase-01-recall-brief-from-map-pin--rx-ui-developer.md`,
  `feedback/phase-01-recall-brief-from-map-pin--rx-ui-auditor.md`

### Fase 2 — AISA pregunta, el rep responde por voz

- [x] **aisa-brief-voice-walkthrough** — executor: `/rx-ui-feature` — lane: Full
  (Full porque plausiblemente crea superficie compartida nueva — un hook/helper de captura de voz,
  si el architect decide factorizar el mecanismo hoy duplicado en `QuestionnaireStepper.tsx` — y
  porque el riesgo de la superficie de voz real amerita diseño explícito antes de implementar,
  igual que el precedente de "3ª ocurrencia de un pattern compartido" que gobierna cuándo
  `rx-ui-architect` promueve algo a módulo/componente separado.)

  Brief: Invertir el sentido de la sección `qa`/`summary` de `AisaBriefingDialog.tsx` (hoy: el rep
  toca un botón de `props.briefing.suggestedQuestions` vía `askQuestion` y
  `buildBriefingFollowUpAnswer` genera el texto de respuesta de AISA — ver
  `AisaBriefingDialog.tsx` líneas 40-44, 118-133) para que en su lugar:
  1. AISA lea en voz alta (TTS, reusar `speakText`/`cancelSpeech` de `services.ts`, mismo patrón que
     `QuestionnaireStepper.tsx` línea 309 `speakText(question.prompt, 'en-US', autoStartListening)`)
     cada entrada de `props.briefing.suggestedQuestions`, una por una, como un prompt de
     preparación dirigido al rep.
  2. Tras cada línea hablada, el micrófono se abra automáticamente para capturar la respuesta del
     rep — reusar el mecanismo real de `QuestionnaireStepper.tsx` líneas 53-245
     (`startVoiceCapture`/`startNativeVoiceCapture`/`stopVoiceCapture`/`getSpeechCtor`/
     `speechSupported`/manejo de permisos nativos vía `@capacitor-community/speech-recognition`/
     `isVoiceDisabled`) — decisión del architect si se duplica localmente (documentado como el
     patrón esperado en este repo para "briefing dialogs", ver feedback del architect en
     `docs/plans/2026-09-01-assistant-merge-aisa-briefing/feedback/phase-01-merge-aisa-prevideo-briefing--rx-ui-architect.md`)
     o si esta 2ª ocurrencia amerita un helper compartido nuevo.
  3. La respuesta capturada (o su fallback "Simulate answer") se guarda en estado LOCAL del
     componente únicamente (`createSignal`, no `store.ts`, no `localStorage` — mismo invariante ya
     documentado en el doc-comment de `AisaBriefingDialog.tsx` líneas 21-25) y el walkthrough
     avanza al siguiente `suggestedQuestions[i]`.
  4. Al terminar el último prompt, se llega al step `ended` existente (sin cambios en ese step ni
     en el CTA row "Simulate approach"/"End briefing" ya construido en el plan anterior).
  5. Disposicionar `buildBriefingFollowUpAnswer` (`services.ts` línea 309): confirmado por grep que
     `AisaBriefingDialog.tsx` línea 47 es hoy su único call site. Si el nuevo flujo no la necesita,
     eliminarla; si el architect decide reusarla (p. ej. como generador del texto de fallback
     "Simulate answer"), documentar esa decisión explícitamente en el Design Brief — no dejarla
     huérfana en silencio.

  El texto de las preguntas (`suggestedQuestions`) NO cambia de contenido — se reutiliza tal cual
  ya lo genera `buildPreMeetingBriefing` (`services.ts` líneas 236-240); esta tarea es
  exclusivamente de mecánica de interacción, no de copy nuevo, salvo que el architect determine
  que el copy actual ("What changed since the last conversation?", frased como pregunta DEL rep)
  necesita un ajuste menor de redacción para sonar como AISA preguntándole AL rep — evaluar y
  decidir, documentar en el Design Brief si se toca `services.ts`.

  No se agrega un toggle Voice/Text nuevo salvo que el architect determine que es necesario para
  no bloquear la demo en un entorno sin micrófono — el fallback "Simulate answer"-equivalente es
  el requisito mínimo no negociable (criterio 6).

  Vocabulary rows aplicables: todas.
  Acceptance: criterios 4-10 de la tabla arriba.
  Contract approval: no requerida (sin schema/auth/integración externa).
  Known-accepted: el reconocimiento de voz real no es verificable en un browser headless sin
  micrófono — la verificación en vivo debe cubrir el wiring de código + el path de fallback, y
  reportar explícitamente esa limitación en vez de fingir cobertura completa (fricción ya
  documentada en el plan `2026-08-30-postvisit-aisa-guided-debrief` y en el plan anterior de este
  mismo hilo).
  Feedback esperado: `feedback/phase-02-aisa-brief-voice-walkthrough--rx-ui-architect.md`,
  `feedback/phase-02-aisa-brief-voice-walkthrough--rx-ui-developer.md`,
  `feedback/phase-02-aisa-brief-voice-walkthrough--rx-ui-auditor.md`

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
  alcance" lleva el grep que la verifica, ejecutado por el conductor antes de escribir la card.
- Para un AC frasado como "en modo/estado X, ocurre Y automáticamente", el brief exige verificar
  explícitamente que el guard/efecto LEE esa señal de modo/estado — no solo que cancela/limpia
  correctamente.
- Cuando una feature agrega entradas a una tabla de matching por keyword/substring sobre texto
  generado, el brief exige un paso explícito de verificación de colisión: enumerar los inputs
  reales desde `src/data.ts` y confirmar que cada uno cae en el branch correcto.

## Improvements (llenado en Etapa 5 de `/feature`, al cerrar)

**Fase 1** (Slice): auditoría limpia (0 CRITICAL/WARNING, 1 INFO no bloqueante sobre superposición
UX entre el nuevo banner y `CustomerMapSummarySheet`, fuera de alcance de la card). El developer
detectó y corrigió en la misma tarea una afirmación incorrecta de la card ("`visitBriefingAccountId`
está inerte") — verificado empíricamente que en realidad `selectMapAccount` lo activa en cada tap
de pin real; el auditor confirmó la corrección de forma independiente.

**Fase 2** (Full): auditoría con 0 CRITICAL, 1 WARNING low (el comando de voz "finish"/"finalizar"
saltaba al último prompt en vez de terminar el walkthrough — no bloqueante porque los controles
manuales Previous/Next/Skip siempre cubrían "nunca stuck"), 1 INFO. El conductor aplicó el fix de
una línea directamente (`handleVoiceCommand`, `setReachedEnd(true)`) en vez de correr un ciclo de
remediación completo, dado el tamaño trivial del cambio — verificado con `npm run build`.

Disposición de las 5 filas de *Proposed guide updates* del corpus de este plan (ver los archivos
`feedback/*.md` para el detalle completo de cada una):
- **Aplicada**: catálogo de `rx-ui-auditor` gana la fila S2 ("comando de voz que no cumple su
  label") citando el defecto real de "finish" como caso de ejemplo — la única fila cuyo *Why*
  nombraba un defecto que efectivamente llegó a shippear en el diff antes de la auditoría.
- **Diferidas a `/improve`** (las 4 restantes, ninguna nombra un defecto shippeado — fricción de
  proceso o sugerencias de ergonomía de card): verificar mutadores reales antes de confiar en un
  campo "inerte" en una guarda; notar que el dataset demo empareja cada cuenta con una visita;
  recomendar un booleano dedicado de "fin de secuencia" en flujos multi-step de estado local;
  citar rangos de línea cuando una card referencia "mismo patrón que `<file>`".

### Verificación en vivo (Etapa 4)

Fase 1: Playwright headless — tap en pin de cuenta con visita → banner "Client brief ready" para
esa cuenta → tap → `AisaBriefingDialog` abre en `prompt` en el mismo tick; visita `Completed`
(proxy de "sin visita") → sin banner; cerrar sheet → re-tap del mismo pin → banner reaparece.
`npm run build` limpio.

Fase 2: Playwright headless — recorrido completo del path de fallback: Simulate answer (prompt 0)
→ Skip (prompt 1) → Previous/Next → Simulate answer (prompt 2, último) → transcript correcto
(prompt 1 correctamente omitido por Skip) → CTA row sin regresión → End briefing cierra limpio.
Cero errores de consola. El path de micrófono real no es verificable sin hardware — code-wired,
reportado como limitación conocida, no como cobertura completa.
