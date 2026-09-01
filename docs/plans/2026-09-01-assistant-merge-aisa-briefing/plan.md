---
status: open
created: 2026-09-01
closed:
---

# Merge pre-visit briefing into a single AISA dialog

## Detalle

Hoy el flujo de brief previo a una visita individual tiene dos pantallas separadas:

1. `ClientVisitStartDialog` (`src/components/ClientVisitStartDialog.tsx`) — se muestra al tocar el
   banner "Client brief ready" de `DefaultVisitBriefNotification` (que llama
   `actions.selectMapVisit`, único call site, confirmado por grep). Es un panel estático
   "VISIT BRIEFING": checklist de objetivos (`buildVisitObjectives`) + botones Cancel/Start. Sin
   marca ni copy de AISA, sin interacción.
2. `AisaBriefingDialog` (`src/components/AisaBriefingDialog.tsx`) — el diálogo real con persona
   AISA (prompt → summary → botones "Ask AISA" → transcript de preguntas/respuestas → end),
   verificado interactivo en vivo (Playwright, browser real: click en pregunta sugerida produce
   una respuesta distinta y relevante que se agrega al transcript). Hoy solo se monta varios pasos
   después: "Start" en el dialog #1 llama `actions.startClientDestinationDemo` (único call site,
   `ClientVisitStartDialog.tsx:23`), que corre una animación GPS simulada de ~15s con línea de voz
   y, solo al terminar, llama `actions.triggerArrivalBriefing` (construye/`upsert`ea el
   `PreMeetingBriefing` y crea una notificación `arrivalBriefing` *unread*, sin auto-abrir). El rep
   debe tocar aparte el banner de `AssistantTopNotification` para abrir
   `AssistantNotificationSheet`, que recién ahí monta `AisaBriefingDialog`.

Un usuario evaluando el producto reportó "solo es texto, no veo interacción" — diagnosticado en
vivo: lo que ve primero es la pantalla #1 (estática, sin AISA), y la interacción real (#2) está
enterrada detrás de una animación bloqueante + notificación + tap extra.

**Fuera de alcance, confirmado en grilling:** el tour autónomo `startMapDemo` (multi-parada,
`animateMapDemoStep`/`schedulePreMeetingDemo`) es un mecanismo scripted distinto — no se toca.

### Qué se entrega

- `ClientVisitStartDialog` se elimina. Su checklist de objetivos es redundante: el paso `summary`
  de `AisaBriefingDialog` ya renderiza `buildVisitObjectives` (`AisaBriefingDialog.tsx` líneas
  86-103).
- `DefaultVisitBriefNotification`, al tocar "Client brief ready", dispara una nueva acción de
  store (p. ej. `openPreVisitAisaBriefing(visitId)`) que: construye y `upsert`ea el
  `PreMeetingBriefing` usando la distancia real actual del rep (NO una posición de llegada
  simulada — `getDistanceMeters(state.location.current, account)`, el mismo cálculo que ya usa
  `triggerArrivalBriefing`), crea/abre la notificación correspondiente inmediatamente (mismo
  patrón que `triggerPostMeetingDebrief`, que ya llama `actions.openAssistantNotification` en la
  misma acción — replicar ese patrón aquí en vez de dejarla *unread*), y limpia
  `visitBriefingAccountId`. Sin animación bloqueante de por medio.
- `AisaBriefingDialog` gana un paso final opcional: en el step `ended` (o como acción disponible
  junto a "End briefing"), un CTA "Simulate approach" que dispara la misma animación de ruta
  (~15s, reutilizando el mecanismo de `startClientDestinationDemo`) como adorno visual antes de
  cerrar el sheet — **sin** volver a llamar `triggerArrivalBriefing` al terminar la animación (esa
  re-invocación es específica del flujo `startClientDestinationDemo` actual y no debe dispararse
  desde este CTA). Si el rep no lo toca, "End briefing" cierra el sheet como hoy.
- `startClientDestinationDemo` en `store.ts` puede quedar como la función que implementa la
  animación de ruta; se decide en implementación si el CTA la reutiliza directamente (ajustándola
  para no re-invocar `triggerArrivalBriefing` cuando se llama desde este nuevo contexto) o si se
  factoriza la porción de animación pura a un helper compartido. Esa decisión de mecanismo queda
  para `rx-ui-architect`.

### Acceptance criteria

| # | Criterio | Cómo se observa |
|---|---|---|
| 1 | Tocar el banner "Client brief ready" abre `AisaBriefingDialog` directamente en su paso `prompt`, sin pasar por `ClientVisitStartDialog` ni por una animación bloqueante. | Browser: click en `.default-brief-notification .assistant-top-copy` → `.assistant-sheet .aisa-dialog` visible en el mismo tick (sin esperar ~15s). |
| 2 | El `PreMeetingBriefing` mostrado usa la distancia/posición real actual del rep, no una posición de llegada simulada. | Código: la nueva acción llama `buildPreMeetingBriefing` con `state.location.current` sin haber mutado `state.location` primero (a diferencia de `startClientDestinationDemo`, que sí lo hace). |
| 3 | `ClientVisitStartDialog.tsx` ya no existe ni se importa. | `grep -r "ClientVisitStartDialog" src/` → cero resultados. |
| 4 | Al terminar el briefing (`End briefing` o equivalente), aparece un CTA opcional "Simulate approach"; tocarlo corre la animación de ruta (~15s) y cierra el sheet al terminar; no tocarlo cierra el sheet de inmediato como hoy. | Browser: ambos caminos ejercidos; `console --errors` limpio en ambos. |
| 5 | El CTA "Simulate approach" no vuelve a crear/mostrar una notificación `arrivalBriefing` ni reabre `AisaBriefingDialog` al terminar su animación. | Browser: tras terminar la animación del CTA, `state.assistant.notifications` no gana una entrada `arrivalBriefing` nueva para ese visitId / no hay segundo sheet montado. |
| 6 | El tour `Map Demo` (`startMapDemo`) sigue funcionando igual que hoy — notificación con timer, sin apertura inmediata. | Browser: `startMapDemo` → primer stop programa `schedulePreMeetingDemo` → notificación aparece tras el timer, no antes. |
| 7 | Cero errores de consola en el flujo completo. | `console --errors` tras cada paso del recorrido en browser. |

## Dominio

Frontend (`src/`). No toca `server/`. Sin cambio de schema, auth, ni integración externa.

## Por qué

El brief de preparación de visita es la primera impresión que un evaluador tiene de AISA; hoy esa
primera impresión es una pantalla sin marca ni interacción, y la conversación real con AISA queda
escondida detrás de una animación de ~15s más una notificación con tap extra — un usuario evaluando
el producto lo reportó como "solo texto, sin interacción" sin haber llegado nunca a la pantalla
que sí lo es.

## Vocabulario

| Término | Nombre normalizado | Notas |
|---|---|---|
| Diálogo único de AISA pre-visita | `AisaBriefingDialog` | Ya existe, `src/components/AisaBriefingDialog.tsx` — no se renombra. |
| Acción que abre el brief sin animación bloqueante | `openPreVisitAisaBriefing` | Nombre sugerido; el architect puede ajustarlo si colisiona con convención existente, pero debe quedar documentado en su brief si cambia. |
| CTA de simulación de ruta al final del briefing | "Simulate approach" | Copy visible al usuario; el identificador interno lo define el architect. |
| Tour multi-parada fuera de alcance | `Map Demo` (`startMapDemo`) | No se toca en este plan. |

## Fases

### Fase 1 — Merge del pre-visit briefing

- [ ] **merge-aisa-prevideo-briefing** — executor: `/rx-ui-feature` — lane: Full
  (escalado desde Slice: la tarea requiere una acción nueva en `src/store.ts` — cambio de shape,
  territorio exclusivo del architect por `.claude/orchestrators/ui.md` — no confinada a
  `src/views/**`/`src/components/**`.)
  Brief: Eliminar `ClientVisitStartDialog` (`src/components/ClientVisitStartDialog.tsx`, único
  consumidor `src/views/DashboardPage.tsx` línea 4/38, confirmado por grep) y reemplazar su punto
  de entrada. `DefaultVisitBriefNotification.tsx` línea 27 hoy llama `actions.selectMapVisit`
  (único call site en el repo, confirmado por grep) para abrir el dialog #1; debe en su lugar
  llamar una nueva acción de store que:
    (a) construya el `PreMeetingBriefing` vía `buildPreMeetingBriefing` (mismo shape que ya usa
        `triggerArrivalBriefing`, `store.ts` línea 509-527) usando `state.location.current` SIN
        mutar la posición primero (a diferencia de `startClientDestinationDemo`, que sí la muta
        antes de calcular),
    (b) haga `upsertBriefing` + cree/abra la notificación correspondiente en el mismo tick — seguir
        el patrón de `triggerPostMeetingDebrief` (`store.ts` línea 546-565), que ya llama
        `actions.openAssistantNotification(notificationId)` inline, en vez del patrón actual de
        `triggerArrivalBriefing` que deja la notificación *unread* sin auto-abrir,
    (c) limpie `visitBriefingAccountId`.
  El resultado: tocar "Client brief ready" monta `AssistantNotificationSheet` →
  `AisaBriefingDialog` en su paso `prompt` en el mismo tick, sin animación de por medio.

  Agregar a `AisaBriefingDialog` un CTA opcional "Simulate approach" disponible junto a / en
  reemplazo del botón "End briefing" (decisión de layout exacta del architect) que dispare la
  animación de ruta ya implementada en `actions.startClientDestinationDemo` (`store.ts` línea
  742-813) — reutilizándola o factorizando su porción de animación pura, decisión del architect —
  pero SIN que al completarse vuelva a llamar `actions.triggerArrivalBriefing` (línea 808 de la
  función actual): esa re-invocación es específica de la ruta de entrada vieja y no aplica cuando
  el CTA se dispara desde un briefing que el rep ya vio. Si el rep no toca el CTA, el sheet cierra
  igual que hoy (`onEndBriefing` → `actions.clearAssistantNotification`).

  No tocar `startMapDemo` / `animateMapDemoStep` / `applyMapDemoStep` / `schedulePreMeetingDemo` —
  el tour Map Demo queda con su comportamiento actual (notificación con timer, sin apertura
  inmediata), confirmado como fuera de alcance en grilling.

  Vocabulary rows aplicables: `AisaBriefingDialog`, `openPreVisitAisaBriefing`,
  "Simulate approach", `Map Demo`.
  Acceptance: criterios 1-7 de la tabla arriba, con su superficie de observación.
  Contract approval: no requerida (sin schema/auth/integración externa) — el architect diseña el
  cambio de `store.ts` (Full por shape change, no por schema/auth), sin aprobación humana
  adicional más allá del checkpoint de este plan.
  Known-accepted: `ClientVisitStartDialog.tsx` se borra por completo, no se deja como código
  muerto ni se re-exporta.
  Feedback esperado: `feedback/phase-01-merge-aisa-prevideo-briefing--rx-ui-architect.md`,
  `feedback/phase-01-merge-aisa-prevideo-briefing--rx-ui-developer.md`,
  `feedback/phase-01-merge-aisa-prevideo-briefing--rx-ui-auditor.md`

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
  alcance" lleva el grep que la verifica, ejecutado por el conductor antes de escribir la card —
  igual que ya se exige para las claims negativas.
- Para un AC frasado como "en modo/estado X, ocurre Y automáticamente", el brief exige verificar
  explícitamente que el guard/efecto LEE esa señal de modo/estado — no solo que cancela/limpia
  correctamente.
- Cuando una feature agrega entradas a una tabla de matching por keyword/substring sobre texto
  generado, el brief exige un paso explícito de verificación de colisión: enumerar los inputs
  reales desde `src/data.ts` y confirmar que cada uno cae en el branch correcto.

## Improvements (llenado en Etapa 5 de `/feature`, al cerrar)

<pendiente al cierre>
