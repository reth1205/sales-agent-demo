---
status: closed
created: 2026-08-30
closed: 2026-08-30
---

# Entrevista post-visita conducida por script AI (guided debrief)

## Detalle

Hoy la página de postvisita (`/visits/:visitId/questionnaire`) usa un modelo de "escucha
pasiva": el representante graba (o simula) un único monólogo libre y, al terminar, un solo botón
dispara un análisis de IA que evalúa todo el texto de una vez contra 5 objetivos de la visita
(`VisitObjectiveAssessment`), mostrados únicamente en el `ReviewPanel` final. Este plan reemplaza
ese modelo por uno conducido por un script AI simulado que hace las preguntas una por una,
inspirado en `docs/Script.docx` Parte 2 (Post-Meeting Debrief): el asistente pregunta sobre cada
objetivo abierto, el representante responde, y hay un checklist visual en vivo (no
satisfecho/parcial/satisfecho) que se va actualizando durante la entrevista, no solo al final.

Alcance: **solo `src/` (SolidJS)**. Sin tocar `server/`, sin iniciar migración de módulos — sigue
siendo mock/simulado, igual que hoy.

### Decisiones asentadas (`/grilling`)

1. **Fuente de las preguntas: los 5 objetivos de visita fijos**, no las preguntas configurables de
   Settings. El script de preguntas se genera desde el mismo helper que ya usa
   `ClientVisitStartDialog.tsx` para mostrar el brief de objetivos antes de iniciar la visita:
   `buildVisitObjectives(account, opportunity)` (en `src/services.ts`). El panel de Settings >
   "Interview questions" (`InterviewQuestionsSettings` en `src/components/SettingsPanels.tsx`)
   queda tal cual, desconectado de este flujo — fuera de alcance, se revisita en un feature aparte.
2. **AISA habla cada pregunta automáticamente** vía `speakText` (mismo patrón ya usado en
   `store.ts` para narración manos-libres: `announceMapDemo`, `triggerArrivalBriefing` /
   `startClientDestinationDemo` vía `cancelSpeech`/`pauseSpeech`/`resumeSpeech`), además de
   mostrarla como texto. Se cancela con `cancelSpeech` al cambiar de pregunta o salir de la vista.
3. **Navegación secuencial con retroceso permitido**: avanza automáticamente tras cada respuesta,
   pero el representante puede volver a una pregunta anterior para corregir/ampliar, reusando las
   acciones ya existentes y sin call sites hoy `actions.nextQuestion` / `actions.previousQuestion`
   / `actions.goToQuestion` (`src/store.ts`).
4. **`state.questionnaire.mode` ('manual'|'voice') controla el método de respuesta por
   pregunta** (texto vs. voz), no la voz de salida de AISA (que siempre habla la pregunta activa,
   decisión 2). Hoy `actions.setQuestionnaireMode` existe en `store.ts` pero no tiene ningún call
   site en la UI — este plan le agrega el control visible que falta.
5. **AISA siempre pregunta los 5 objetivos en el mismo orden fijo**, sin saltarse ninguno aunque
   una respuesta anterior ya lo haya dejado en estado `met` (el checklist en vivo ya refleja eso;
   no hay lógica de "auto-skip").

### Acceptance criteria (cada uno con su superficie de observación)

| # | Criterio | Cómo se observa |
|---|---|---|
| AC1 | La página de postvisita presenta las preguntas una a la vez, generadas desde `buildVisitObjectives(account, opportunity)` — mismos 5 objetivos que `ClientVisitStartDialog` ya muestra al iniciar la visita — en lugar del panel de escucha pasiva libre. | Al entrar a `/visits/:visitId/questionnaire` con una visita en estado `Questionnaire`, se ve una pregunta activa cuyo texto corresponde a uno de los 5 objetivos (approval/opportunity/timeline/stakeholders/follow-up), no un botón genérico de "Start listening". |
| AC2 | Checklist visual persistente de los 5 objetivos con su estado (`met`/`partial`/`missed`), mismos íconos que ya usa `ReviewPanel.tsx` (`CheckCircle2`/`AlertCircle`/`Circle`), visible durante toda la entrevista y actualizado en vivo tras cada respuesta — no solo en el `ReviewPanel` final. | Responder una pregunta que menciona señales de OTRO objetivo (ej. mencionar "timeline" mientras se responde la pregunta de aprobación) actualiza el ícono de ese otro objetivo en el checklist antes de que le toque su turno. |
| AC3 | El representante puede avanzar (Next) y retroceder (Previous) entre las 5 preguntas sin perder respuestas ya capturadas. | Retroceder a una pregunta ya respondida conserva el texto capturado y permite editarlo; avanzar de nuevo no lo borra. |
| AC4 | `state.questionnaire.mode` controla, por pregunta, si la respuesta se captura por texto (textarea) o por voz (reusando el mecanismo de grabación ya existente: Web Speech API / Capacitor `SpeechRecognition` en `QuestionnaireStepper.tsx`), con un control de UI visible para alternar el modo. | Cambiar el toggle manual/voz cambia el tipo de input mostrado para la pregunta activa; `actions.setQuestionnaireMode` pasa a tener al menos un call site en la UI. |
| AC5 | En modo `voice`, la pregunta activa se reproduce por audio automáticamente vía `speakText` al activarse, y se cancela con `cancelSpeech` al cambiar de pregunta o desmontar la vista. | En modo voz, avanzar a la siguiente pregunta se escucha sin solaparse con el audio de la pregunta anterior; salir de la página detiene el audio. |
| AC6 | Botón de respuesta simulada por pregunta (reemplaza el único botón "Simulate meeting audio" que hoy llena un transcript genérico) que inserta una respuesta de demo coherente con el objetivo de la pregunta activa. | Usar el botón de simulación en la pregunta de "aprobación" produce una respuesta relacionada con budget/aprobación; usarlo en la de "timeline" produce una relacionada con rollout/implementación — no el mismo párrafo genérico en las 5. |
| AC7 | El representante puede finalizar el debrief en cualquier momento (no solo tras la pregunta 5) con una acción de "Finish"/"End debrief" que dispara la animación de "AI checking objectives" ya existente (`aiReviewSteps` en `QuestionnaireStepper.tsx`) y llama `actions.buildReview()` sin cambio de firma. | Finalizar tras responder solo 2 de 5 preguntas genera un `ReviewSummary` con objetivos `partial`/`missed` para los no cubiertos — mismo comportamiento tolerante que `ReviewPanel.tsx` ya soporta hoy. |
| AC8 | `ReviewPanel.tsx` no cambia de contrato — sigue recibiendo el mismo `ReviewSummary` (`interpretVisitAnswers`/`evaluateVisitObjectives` sin cambio de firma pública). | `npm run build` pasa sin cambios de tipo en `ReviewPanel.tsx`; el archivo puede quedar sin diff. |
| AC9 | `InterviewQuestionsSettings` (`src/components/SettingsPanels.tsx`) sigue compilando sin cambios de comportamiento — documentado como desconectado del nuevo flujo, no eliminado ni re-cableado. | `npm run build` pasa; `SettingsPanels.tsx` sin diff funcional. |
| AC10 | Se preservan los comandos de voz EN/ES ya reconocidos (`next`/`siguiente`, `previous`/`anterior`, `finish`/`finalizar`) y el layout del phone-shell (textarea/controles alcanzables bajo el bottom nav, ver `src/styles.css` `.app-page`/`.bottom-nav`). | Navegar por voz en español avanza/retrocede igual que en inglés; el textarea de respuesta manual no queda tapado por el bottom nav en el viewport móvil del demo. |

## Dominio

Frontend (`src/`), SolidJS. Área: flujo de entrevista post-visita / "postvisit". No toca
`server/`.

## Por qué

El material de referencia del cliente (`docs/Script.docx`, guion piloto de AISA) describe el
debrief post-reunión como una conversación dirigida por el asistente — pregunta por objetivo
abierto, respuesta, actualización visual en vivo del estado de cada tema ("not satisfied /
partially satisfied / fully satisfied", con checkmarks o un "color wheel") — no como una grabación
libre analizada al final. El modelo actual de escucha pasiva no comunica visualmente el progreso
mientras ocurre la conversación, que es justamente lo que el guion pide como diferenciador del
producto. Este plan lo implementa a nivel demo/mock (coherente con la fase actual del proyecto),
sin esperar a la migración de backend.

## Vocabulario

| Término | Nombre normalizado | Notas |
|---|---|---|
| Objetivo de visita | `VisitObjectiveItem` / `VisitObjectiveAssessment` (`src/types.ts`) | ya existe; no se renombra |
| Estado de un objetivo | `VisitObjectiveStatus`: `met` \| `partial` \| `missed` | ya existe; se usa igual en el checklist en vivo y en `ReviewPanel` |
| Generador de objetivos | `buildVisitObjectives(account, opportunity)` (`src/services.ts`) | ya existe; fuente única de las preguntas del script |
| Evaluador de objetivos | `evaluateVisitObjectives(combinedText, account, opportunity)` (`src/services.ts`) | ya existe; se reusa para el checklist en vivo, no solo al final |
| Script de preguntas | nuevo helper en `src/services.ts` que mapea `buildVisitObjectives` a un `InterviewQuestion[]` con `prompt` en lenguaje natural | nombre exacto lo decide el architect; NO reintroducir las preguntas configurables de Settings |
| Snapshot de preguntas activas | `state.questionnaire.snapshot: InterviewQuestion[]` (`src/store.ts`) | mismo campo/tipo de hoy; cambia solo cómo se llena en `beginQuestionnaire` |
| Modo de respuesta | `state.questionnaire.mode: 'manual' \| 'voice'` | redefinido: ya no es "autostart de voz", es método de respuesta por pregunta (decisión 4) |
| Asistente AI (persona) | mantener el copy actual de la app ("assistant"/"AI"), NO introducir la etiqueta "AISA" en UI-facing text salvo que el usuario lo pida explícitamente | el nombre "AISA" es del guion de referencia, no confirmado como naming de producto |

Cada agente dispatcheado en este plan usa estos nombres verbatim en code, tests, y reports.

## Fases

### Fase 1 — Entrevista post-visita conducida por script AI

- [x] **postvisit-guided-debrief** — executor: `/rx-ui-feature` — lane: Full
  Brief: Rediseñar el flujo de `src/views/QuestionnairePage.tsx` +
  `src/components/QuestionnaireStepper.tsx` para que la entrevista post-visita sea conducida
  pregunta-por-pregunta por un script AI simulado, en vez del modelo actual de escucha pasiva de
  un solo transcript libre. Implementar exactamente las 5 decisiones asentadas y los 10 acceptance
  criteria de la sección Detalle arriba (se citan verbatim en la tarjeta de dispatch). Superficie
  compartida que este task necesita y que el architect debe enviar antes de que el developer
  edite views/componentes: (a) un helper en `src/services.ts` que genere el script de preguntas
  desde `buildVisitObjectives` con `prompt` en lenguaje natural por objetivo, con forma compatible
  con `InterviewQuestion` (para que `interpretVisitAnswers`/`combineDebriefText` sigan funcionando
  sin cambio de firma); (b) el cambio en el cuerpo de `actions.beginQuestionnaire` en
  `src/store.ts` para llenar `state.questionnaire.snapshot` desde ese helper en vez de
  `getActiveQuestions(state.settings.questions)`; (c) una forma de recomputar
  `evaluateVisitObjectives` en vivo desde `state.questionnaire.answers` sin esperar a
  `buildReview()` (exportar `combineDebriefText` o equivalente, decisión del architect). No se
  toca el tipo `AppState['questionnaire']` (mismo shape que hoy) ni la firma pública de
  `interpretVisitAnswers`/`evaluateVisitObjectives`/`buildVisitObjectives`. No se toca
  `ReviewPanel.tsx` ni `SettingsPanels.tsx` (AC8, AC9). Preservar comandos de voz EN/ES y layout
  del phone-shell (AC10).
  Acceptance: AC1–AC10 de la tabla en Detalle, cada uno con su superficie de observación ya
  especificada ahí.
  Feedback esperado: `feedback/phase-01-postvisit-guided-debrief--rx-ui-architect.md`,
  `feedback/phase-01-postvisit-guided-debrief--rx-ui-developer.md`,
  `feedback/phase-01-postvisit-guided-debrief--rx-ui-auditor.md`

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

Dos temas cruzaron las 4 fases de feedback (architect, developer, auditor ciclo 1, auditor ciclo 2),
ambos sobre la misma falla raíz: la dispatch card afirmó o esperó comportamiento sin que el
conductor lo verificara con la misma disciplina que ya aplica a las claims negativas.

1. **Claims positivas sobre comportamiento existente sin grep de respaldo.** La card de este plan
   afirmó que los comandos de voz EN/ES "ya" existían — no existían (grep cero hits), y el
   architect tuvo que gastar una ronda de verificación completa antes de poder continuar. Aplicado:
   `docs/plans/_templates/plan.md` § Reglas de BRIEF ACCURACY ahora exige el mismo grep-antes-de-
   escribir para claims positivas que ya exigía para las negativas.
2. **ACs "en modo X, ocurre Y automáticamente" sin instrucción de verificar el guard.** AC5 pedía
   narración solo en modo voz; el developer implementó cancelación/limpieza correctas pero disparó
   la narración en ambos modos — solo lo atrapó la auditoría, costando un ciclo de remediación.
   Aplicado: `docs/plans/_templates/plan.md` § Reglas de BRIEF ACCURACY ahora exige verificar
   explícitamente que el guard lee la señal de modo/estado nombrada, no solo su comportamiento de
   cancelación.

Diferido a `/improve` (no es hard-gate — preventivo, ningún defecto llegó a producción): agregar a
"Self-verification" de `rx-ui-architect` un chequeo para texto generado que entra a un matcher de
keywords existente (evitar auto-disparo), propuesto en el feedback del architect.
