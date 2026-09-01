---
status: open
created: 2026-09-01
closed:
---

# Diálogo interactivo AISA — pre-visita (Parte 1) y debrief post-visita (Parte 2)

## Detalle

`docs/Script.md` (transcrito de `docs/Script.docx`) describe dos conversaciones guionadas con un
asistente llamado "AISA": Parte 1, un briefing pre-visita donde AISA pregunta si el rep quiere el
resumen, lo da citando fuentes, y responde 2 preguntas de seguimiento libres antes de "End
briefing"; Parte 2, un debrief post-visita donde AISA confirma cada objetivo abierto uno por uno
en conversación (factura vencida, feedback de demo, timeline de contrato, oportunidad nueva por
señal externa) con una visualización en vivo de qué está satisfecho/parcial/sin satisfacer.

**Hallazgo clave (verificado en `git log`/lectura de código, no asumido):** el plan cerrado
`docs/plans/2026-08-30-postvisit-aisa-guided-debrief` ya reemplazó el modelo de escucha pasiva de
`QuestionnaireStepper.tsx` por una entrevista pregunta-por-pregunta impulsada por
`buildVisitObjectives`, con checklist en vivo (`objective-review-item met|partial|missed`, iconos
`CheckCircle2`/`AlertCircle`/`Circle`), voz/texto por pregunta, TTS automático (`speakText`), y
botón de respuesta simulada por objetivo (`buildSimulatedObjectiveAnswer`). Ese plan **evitó
deliberadamente** introducir la etiqueta "AISA" en copy UI-facing (ver su tabla de Vocabulario).
Este plan reintroduce la marca "AISA" a pedido explícito del usuario y cierra dos huecos reales que
quedaron tras ese trabajo:

1. **Parte 1 no existe en ningún lado.** `AssistantNotificationSheet.tsx` muestra, para
   notificaciones `arrivalBriefing`, ocho párrafos de prosa **hardcodeada** ("Sarah Johnson",
   "$95,000") que ignoran el `PreMeetingBriefing` real ya calculado por `buildPreMeetingBriefing` —
   no hay paso de "¿quieres el briefing?", ni Q&A de seguimiento, ni "End briefing".
2. **El debrief de Parte 2 ya tiene el motor pero no la voz de AISA.** `QuestionnaireStepper.tsx`
   muestra la pregunta activa como texto plano ("The assistant asks" + `question.prompt`), sin
   línea de intro conversacional ni confirmaciones de transición entre objetivos como las del
   guion ("Great, I will update the account notes... How did she like the demo?").
3. **Dos categorías de objetivo del guion no existen en el modelo de datos:** factura
   vencida/credit hold, y oportunidad detectada por señal externa (LinkedIn/noticias) — `Account`
   no tiene campos para ninguna de las dos.

### Decisiones asentadas (`/grilling`)

1. **Generalizar, no hardcodear el guion.** Los Call Objectives del guion se modelan como
   categorías genéricas reutilizables calculadas por cuenta/visita vía `buildVisitObjectives`,
   igual que el resto del modelo de objetivos. El guion es referencia de tono/estructura.
2. **Q&A de Parte 1: reutiliza `PreMeetingBriefing.suggestedQuestions`** (ya existe, 3 preguntas
   por briefing, hoy sin ningún consumidor en UI — confirmado, `grep -rn "suggestedQuestions"
   src/` solo tiene la definición en `types.ts`, el builder en `services.ts`, y el hydrate/persist
   genérico en `store.ts`; cero lecturas en `src/components/` o `src/views/`) como botones de
   pregunta sugerida. Cada botón dispara una respuesta generada por una función nueva y
   determinista (sin LLM, consistente con el resto del repo).
3. ⚠ **Nuevo componente compartido `src/components/AisaBriefingDialog.tsx`** con sus propios pasos
   (`prompt` → `summary` → `qa` → `ended`) como estado local (`createSignal`, no persistido).
   `AssistantNotificationSheet.tsx` lo monta para `arrivalBriefing`/`preMeetingBriefing` en vez de
   `briefingParagraphs()`. *Trigger Full: superficie UI compartida nueva.*
4. **Parte 2 se envuelve, no se reconstruye.** El motor de `QuestionnaireStepper.tsx` (STT/TTS,
   navegación, checklist, `objectives`/`snapshot`) no cambia de mecanismo; se le agrega copy AISA
   (intro + transición por objetivo) generada por una función nueva y determinista.
5. **Visualización de estado: reusar los iconos existentes tal cual** —
   `CheckCircle2`/`AlertCircle`/`Circle` ya satisfacen el pedido del guion ("check mark" es una de
   las dos opciones que el guion mismo ofrece). No se construye ningún "wheel" nuevo.
6. ⚠ **`buildVisitObjectives` se extiende con 2 categorías condicionales nuevas** (`billing`,
   `external-signal`) que se agregan a las 5 existentes solo cuando la cuenta tiene los datos
   correspondientes; las 5 actuales no cambian. Esto obliga a corregir
   `buildVisitObjectiveDefinitions` (`src/services.ts:291-328`), que hoy indexa
   `objectives[0]`..`objectives[4]` **posicionalmente** — con 7 objetivos posibles, pasa a lookup
   por `id`.
7. ⚠ **Nueva shape de datos en `Account`** (`src/types.ts:18-35`): `creditHold?: { amount: number;
   overdueDays: number; invoiceReason: string }` y `externalSignals?: { id: string; source: string;
   summary: string; detectedAt: string }[]`, ambos opcionales. Al menos 1 cuenta de `src/data.ts`
   se siembra con ambos para que el flujo completo (7 objetivos, Parte 1 + Parte 2) sea
   demostrable. *Trigger Full: nueva shape de tipo compartido.*
8. **"AISA" se usa como etiqueta de producto en el copy nuevo de este plan** (diálogo de Parte 1,
   líneas de transición de Parte 2) — reversa puntual, a pedido explícito del usuario, de la
   decisión del plan `2026-08-30` que evitaba esa etiqueta. No se renombra copy existente fuera de
   este alcance ("AI briefing", "assistant" genérico en otras vistas quedan igual).
9. Sin backend: 100% frontend/mock (`store.ts` + `services.ts` + `types.ts` + `data.ts`),
   confirmado — `server/src/SalesAgent.Api/Program.cs` solo registra `/health`.

### Acceptance criteria

| # | Criterio | Cómo se observa |
|---|---|---|
| AC1 | Abrir una notificación `arrivalBriefing`/`preMeetingBriefing` monta `AisaBriefingDialog` con un paso `prompt` inicial (acción explícita tipo "Yes, let's hear it") — el resumen NO aparece hasta que el usuario la toca. | Abrir la sheet para una notificación `arrivalBriefing` muestra una acción de inicio antes que cualquier texto de resumen; el resumen solo aparece tras tocarla. |
| AC2 | El resumen (`summary`) usa datos reales del `PreMeetingBriefing` ya generado (`executiveSummary`, `blockers`, `opportunitySummary`, `recentTopics`) y los Call Objectives de `buildVisitObjectives(account, opportunity)` de la cuenta/visita activa — no la prosa hardcodeada actual. | Cambiar de cuenta activa cambia el contenido del resumen (nombre, monto de oportunidad, objetivos) sin editar código; `briefingParagraphs()` deja de tener call sites (`grep -rn briefingParagraphs src/` → 0 hits tras el cambio). |
| AC3 | Botones de pregunta sugerida generados desde `briefing().suggestedQuestions`; tocar uno muestra la pregunta y una respuesta de una función nueva determinista, distinta por pregunta. | Tocar preguntas sugeridas distintas produce respuestas distintas y relacionadas (ej. la pregunta sobre la oportunidad menciona stage/probability); no es el mismo párrafo para las 3. |
| AC4 | Acción explícita "End briefing" limpia el paso conversacional (vuelve a `prompt` si se reabre) y cierra el sheet reusando `actions.dismissAssistantNotification`/`clearAssistantNotification` sin cambio de firma. | Tocar "End briefing" cierra el sheet igual que el botón X existente hoy; reabrir la misma notificación vuelve a mostrar el paso `prompt`, no el `summary` a medias. |
| AC5 | `buildVisitObjectives` agrega `billing` solo si `account.creditHold` está definido, y `external-signal` solo si `account.externalSignals` tiene ≥1 elemento; sin esos campos, el output es idéntico al actual. | Para una cuenta sin `creditHold`/`externalSignals`, `buildVisitObjectives` devuelve los mismos 5 objetivos que hoy (mismo comportamiento que ya usa `ClientVisitStartDialog.tsx`); para la cuenta demo sembrada con ambos, devuelve 7. |
| AC6 | `evaluateVisitObjectives`/`buildObjectiveInterviewQuestions`/`buildSimulatedObjectiveAnswer` soportan `billing`/`external-signal` con señales/prompt/respuesta propios; `buildVisitObjectiveDefinitions` pasa de indexar por posición a indexar por `id`. | `npm run build` pasa; simular respuesta en la pregunta de billing marca únicamente el objetivo `billing` como `met` en el checklist (no desplaza el matching de los otros 6). |
| AC7 | `QuestionnaireStepper` muestra una línea de intro AISA al iniciar el debrief y una línea de transición/confirmación AISA (nueva función determinista) tras cada respuesta, antes de avanzar — visible como texto, no solo hablada. | Responder la pregunta de "approval" y avanzar muestra brevemente una línea de confirmación relacionada con esa respuesta antes de que cambie la pregunta activa. |
| AC8 | El checklist en vivo (`objective-review-item`, iconos existentes) no cambia de mecanismo y escala a 7 objetivos sin romper layout; `ReviewPanel.tsx` sigue recibiendo el mismo `ReviewSummary` sin cambio de firma. | Con la cuenta demo de 7 objetivos, el checklist renderiza 7 filas con los mismos iconos/estados; `npm run build` pasa sin cambios de tipo en `ReviewPanel.tsx`. |
| AC9 | `ReviewPanel.tsx` actualiza únicamente el copy de confirmación final para incluir una línea estilo AISA equivalente a "Call logged, CRM updated, and your follow-up tasks are scheduled" — sin cambio de firma de `confirmWithSalesforceSimulation`/`actions.confirmReview()`. | El texto final mostrado tras completar el sync simulado incluye esa línea; `npm run build` pasa sin cambios de tipo en `ReviewPanel.tsx`. |
| AC10 | `npm run build` pasa; el flujo completo (Parte 1 y Parte 2) se recorre manualmente en `npm run dev` para la cuenta demo sembrada con `creditHold`/`externalSignals`, sin regresión de layout del phone-shell. | Verificación manual en browser: textarea/controles del debrief no quedan tapados por el bottom-nav (misma convención que `docs/plans/2026-08-30-.../plan.md` AC10 ya validó). |

## Dominio

Frontend (`src/`), SolidJS. Áreas: `assistant` (notificaciones/briefing) y `postvisit`
(cuestionario). No toca `server/`.

## Por qué

El guion de referencia del cliente (`docs/Script.md`) es el diferenciador de producto que se está
vendiendo: un asistente que conversa activamente con el rep, no solo un panel de datos estático. Hoy
Parte 1 se muestra como prosa fija que ni siquiera refleja los datos de la cuenta real, y Parte 2 —
aunque ya tiene el motor de entrevista construido — no tiene ninguna "voz" de asistente, solo
preguntas neutrales. Sin este trabajo, la demo no puede mostrar la interacción conversacional que
el guion pide, que es justamente lo que distingue a AISA de un formulario con IA detrás.

## Vocabulario

| Término | Nombre normalizado | Notas |
|---|---|---|
| Persona del asistente | "AISA" (copy UI-facing) | reintroducida a pedido explícito del usuario, solo en el copy nuevo de este plan (decisión 8) |
| Objetivo de visita | `VisitObjectiveItem` / `VisitObjectiveAssessment` (`src/types.ts`) | ya existe; no se renombra |
| Generador de objetivos | `buildVisitObjectives(account, opportunity)` (`src/services.ts`) | ya existe; se extiende, no se reemplaza (decisión 6) |
| Definiciones internas de objetivo | `buildVisitObjectiveDefinitions` (`src/services.ts:291-328`) | pasa de indexar `objectives[0..4]` por posición a indexar por `id` |
| Objetivo de facturación | id `'billing'` dentro de `buildVisitObjectives` | nuevo; condicional a `account.creditHold` |
| Objetivo de señal externa | id `'external-signal'` dentro de `buildVisitObjectives` | nuevo; condicional a `account.externalSignals.length > 0` |
| Credit hold de cuenta | `Account['creditHold']` (`src/types.ts`) | nuevo campo opcional |
| Señales externas de cuenta | `Account['externalSignals']` (`src/types.ts`) | nuevo campo opcional |
| Diálogo interactivo de pre-visita | `AisaBriefingDialog` (`src/components/AisaBriefingDialog.tsx`) | nuevo componente; pasos `prompt`/`summary`/`qa`/`ended` como estado local |
| Pregunta sugerida de seguimiento | `PreMeetingBriefing['suggestedQuestions']` (`src/types.ts`) | ya existe, sin consumidor en UI hoy |
| Respuesta a pregunta de seguimiento | nueva función `buildBriefingFollowUpAnswer` (`src/services.ts`) | determinista, sin LLM, misma familia que `buildSimulatedObjectiveAnswer` |
| Copy de transición AISA en debrief | nueva función `buildDebriefTransitionCopy` (`src/services.ts`) | determinista; se muestra como texto + se habla vía `speakText` existente |
| Notificación de briefing | `AssistantNotification` con `type: 'arrivalBriefing' \| 'preMeetingBriefing'` | ya existe |
| Notificación de debrief | `AssistantNotification` con `type: 'postMeetingDebrief'` | ya existe; sin cambio de disparo |

Cada agente dispatcheado en este plan usa estos nombres verbatim en code, tests, y reports.

## Fases

### Fase 1 — Modelo de datos y objetivos condicionales

- [x] **aisa-objective-data-model** — executor: `/rx-ui-feature` — lane: Full
  Brief: Agregar a `Account` (`src/types.ts:18-35`) los campos opcionales `creditHold?: { amount:
  number; overdueDays: number; invoiceReason: string }` y `externalSignals?: { id: string; source:
  string; summary: string; detectedAt: string }[]`. Sembrar al menos 1 cuenta en `src/data.ts` con
  ambos campos poblados (valores coherentes con el resto de esa cuenta demo). Extender
  `buildVisitObjectives` (`src/services.ts:255-289`) para agregar un objetivo `billing` cuando
  `account.creditHold` esté definido, y un objetivo `external-signal` cuando
  `account.externalSignals` tenga ≥1 elemento — los 5 objetivos existentes (`approval`,
  `opportunity`, `timeline`, `stakeholders`, `follow-up`) no cambian de id/label/detail. Corregir
  `buildVisitObjectiveDefinitions` (`src/services.ts:291-328`) que hoy asume exactamente 5
  objetivos e indexa `objectives[0]`..`objectives[4]` posicionalmente — cambiar a lookup por `id`
  (ej. `objectives.find((o) => o.id === 'approval')`) y agregar las entradas `requiredSignals`/
  `partialEvidence`/`missedEvidence` para `billing` (señales tipo factura/overdue/credit hold/pago)
  y `external-signal` (señales tipo LinkedIn/contratación/expansión/licitación). Agregar entradas
  para `billing`/`external-signal` en `objectiveQuestionCopy` (`src/services.ts:400-421`, prompt +
  `category`, siguiendo la nota de la doc comment sobre no incluir las keywords de matching en el
  prompt) y en el mapa `simulated` de `buildSimulatedObjectiveAnswer`
  (`src/services.ts:439-453`). No tocar la firma pública de `buildVisitObjectives`,
  `evaluateVisitObjectives`, `buildObjectiveInterviewQuestions`, ni `buildSimulatedObjectiveAnswer`
  — mismo tipo de retorno, mismos parámetros.
  Acceptance: AC5, AC6 (tabla en Detalle).
  Feedback esperado: `feedback/phase-01-aisa-objective-data-model--rx-ui-architect.md`,
  `feedback/phase-01-aisa-objective-data-model--rx-ui-developer.md`,
  `feedback/phase-01-aisa-objective-data-model--rx-ui-auditor.md`

---

### Fase 2 — Diálogo interactivo AISA de pre-visita (Parte 1)

- [x] **aisa-briefing-dialog** — executor: `/rx-ui-feature` — lane: Full
  Brief: Crear `src/components/AisaBriefingDialog.tsx`, un componente con estado local
  (`createSignal`, no persistido en `store.ts`/`localStorage`) que modela 4 pasos: `prompt`
  (mensaje inicial + acción para iniciar, ej. "Yes, let's hear it"), `summary` (resumen generado
  desde el `PreMeetingBriefing` de `state.assistant.briefings` para la visita activa —
  `executiveSummary`, `blockers`, `opportunitySummary`, `recentTopics` — más la lista de Call
  Objectives de `buildVisitObjectives(account, opportunity)`), `qa` (botones generados desde
  `briefing().suggestedQuestions`; tocar uno muestra la pregunta y una respuesta de una función
  nueva `buildBriefingFollowUpAnswer(question, briefing, account, opportunity)` en
  `src/services.ts`, determinista, sin LLM, con texto distinto por pregunta), y `ended` (acción
  "End briefing" que llama `actions.clearAssistantNotification()` o
  `actions.dismissAssistantNotification(id)` — mismas acciones que ya usa el botón X de
  `AssistantNotificationSheet.tsx:62-64`, sin cambio de firma). Cablear en
  `AssistantNotificationSheet.tsx`: reemplazar el bloque `Show when={isBriefing() && briefing()}`
  (líneas 71-80) que hoy renderiza `briefingParagraphs()` por `<AisaBriefingDialog
  notification={active()} briefing={briefing()!} account={account()} opportunity={...} />` (props
  exactas a definir por el developer); eliminar `briefingParagraphs()` (líneas 25-37) por completo,
  no dejarla sin call sites. Usar "AISA" como etiqueta del asistente en el copy nuevo de este
  componente (decisión 8 del plan), sin renombrar el eyebrow "AI briefing" existente en el header
  del sheet salvo que el developer determine que el nuevo componente reemplaza también esa
  etiqueta (documentar la decisión en su feedback si difiere).
  Acceptance: AC1, AC2, AC3, AC4 (tabla en Detalle).
  Feedback esperado: `feedback/phase-02-aisa-briefing-dialog--rx-ui-architect.md`,
  `feedback/phase-02-aisa-briefing-dialog--rx-ui-developer.md`,
  `feedback/phase-02-aisa-briefing-dialog--rx-ui-auditor.md`

---

### Fase 3 — Copy AISA en el debrief post-visita (Parte 2) y cierre

- [ ] **aisa-debrief-copy** — executor: `/rx-ui-feature` — lane: Slice
  Brief: En `src/services.ts`, agregar una función nueva `buildDebriefTransitionCopy(objectiveId:
  string, account: Account, opportunity: Opportunity | undefined): string` que devuelve una línea
  de confirmación estilo AISA por objetivo (ej. para `approval`: algo equivalente a "Great, I will
  update the account notes... how did the rest of the conversation go?" adaptado al objetivo
  siguiente), determinista, sin LLM, siguiendo el mismo patrón de `objectiveQuestionCopy`/
  `buildSimulatedObjectiveAnswer`; debe cubrir los 7 ids posibles (`approval`, `opportunity`,
  `timeline`, `stakeholders`, `follow-up`, `billing`, `external-signal`). En
  `QuestionnaireStepper.tsx`: mostrar una línea de intro AISA (nuevo bloque de texto, ej. "Hey
  AISA, can we update my account?" / respuesta de apertura) antes de la primera pregunta cuando
  `activeIndex() === 0`, y mostrar `buildDebriefTransitionCopy` para el objetivo recién respondido
  como texto visible (no solo hablado) en el momento de avanzar (`handleNext`/`actions.nextQuestion`),
  antes de que cambie `activeQuestion()` — el mecanismo exacto (toast, bloque temporal, área
  dedicada) lo decide el developer; debe ser observable sin depender de audio. No modificar el
  mecanismo de STT/TTS/navegación/checklist existente (`speakText`, `matchVoiceNavigationCommand`,
  `objective-review-item`) — solo agregar texto. En `ReviewPanel.tsx`, actualizar el copy de
  confirmación final (`confirmWithSalesforceSimulation` o el texto que se muestra tras completar el
  sync simulado — developer localiza el texto exacto) para incluir una línea equivalente a "Call
  logged, CRM updated, and your follow-up tasks are scheduled" — cambio de texto únicamente, sin
  tocar la firma de `confirmWithSalesforceSimulation`/`actions.confirmReview()` ni el tipo
  `ReviewSummary`.
  Acceptance: AC7, AC8, AC9, AC10 (tabla en Detalle).
  Feedback esperado: `feedback/phase-03-aisa-debrief-copy--rx-ui-developer.md`,
  `feedback/phase-03-aisa-debrief-copy--rx-ui-auditor.md`

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

## Improvements (llenado en Etapa 5 de `/feature`, al cerrar)

<Cross-task themes destilados de `feedback/*/Proposed guide updates`, cada uno apuntando al
archivo real que se actualizó o se va a actualizar.>
