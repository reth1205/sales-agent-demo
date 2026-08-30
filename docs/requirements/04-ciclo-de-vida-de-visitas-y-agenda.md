# RQ-04 — Ciclo de vida de visitas y agenda

**Estado en el demo:** Implementado con simplificación deliberada del disparo de captura (ver §5).
**Código relacionado:** [`src/views/SchedulePage.tsx`](../../src/views/SchedulePage.tsx), [`src/components/VisitActions.tsx`](../../src/components/VisitActions.tsx), [`src/components/VisitStatusPrompt.tsx`](../../src/components/VisitStatusPrompt.tsx), [`src/components/ClientVisitStartDialog.tsx`](../../src/components/ClientVisitStartDialog.tsx), [`src/components/RouteSimulationBanner.tsx`](../../src/components/RouteSimulationBanner.tsx), acciones `startVisit`/`finishInterview`/`checkGeofences` en `store.ts`.
**Fuentes de negocio:** `docs/MVP - Tareas.md` (#3, #10, #17, #18, #29, #30, #31), `.claude/requirenment/solidjs-demo-execution-plan.md`, transversal con `docs/AI Assisted Customer Visit Registration.pdf` (geofence trigger).

## 1. Resumen

Gobierna el estado de una visita programada desde que se agenda hasta que se completa y se sincroniza al CRM, y la pantalla de agenda ("Mi día") que las organiza.

## 2. Requerimientos funcionales

- **RF-VIS-01**: Cada visita programada tiene un estado explícito con transición unidireccional: `Scheduled → InProgress → InterviewFinished → Questionnaire → Completed`.
- **RF-VIS-02**: El usuario puede iniciar manualmente una visita programada (`startVisit`), o el sistema puede detectarla automáticamente por geofence (ver RQ-02).
- **RF-VIS-03**: El usuario puede marcar el fin de la entrevista/reunión (`finishInterview`), lo que habilita el cuestionario post-visita.
- **RF-VIS-04**: La agenda ("Mi día") debe mostrar: vista de calendario, visitas programadas, y tareas del día en una experiencia de planeación diaria — no una simple lista. *Fuente: `MVP - Tareas.md` #3, marcado explícitamente como insuficiente la "agenda actual" del alcance original.*
- **RF-VIS-05**: Cuando el representante está manejando/en ruta, la app debe mostrar: ruta del día, tiempo estimado de traslado, clientes por visitar, estado de avance — visible también para el gerente. *Fuente: `MVP - Tareas.md` #10, #30.*
- **RF-VIS-06**: La agenda debe conectar con clientes, tareas, y mapa como navegación integrada, no como secciones aisladas. *Fuente: `MVP - Tareas.md` #17.*
- **RF-VIS-07**: Debe existir integración de calendario real (reflejando reuniones/visitas/tareas provenientes del CRM o creadas en la app). *Fuente: `MVP - Tareas.md` #31.*
- **RF-VIS-08**: Debe existir un "modo en la ruta" que priorice mapa, próxima visita, ruta, ETA, notificaciones y captura rápida por voz cuando el representante está fuera de oficina. *Fuente: `MVP - Tareas.md` #30.*

## 3. Reglas de negocio

- Una visita solo puede avanzar de estado en la dirección `Scheduled → ... → Completed`; no hay reglas de negocio documentadas para retroceder un estado.
- El geofence detecta llegada/proximidad, pero **no obliga** a iniciar captura inmediatamente — el usuario decide.

## 4. Datos y entidades involucradas

`ScheduledVisit` (`status: VisitStatus`, `startedAt`, `finishedAt`, `durationMinutes`, `outcome`, `notes`, `pendingSync`), `VisitStatus`.

## 5. Estado actual en el demo

- La máquina de estados de 5 pasos está implementada fielmente en `store.ts`/`types.ts`.
- **Simplificación deliberada y documentada** (`.claude/requirenment/solidjs-demo-execution-plan.md`): el requerimiento formal original (`AI Assisted Customer Visit Registration.pdf`) especifica que la llegada por geofence dispara **directamente** una notificación para iniciar el registro por voz. El demo relaja esto a un flujo de dos pasos: geofence/llegada solo marca que la visita está en curso; la "entrevista" ocurre fuera de la app (conversación humana real); el usuario vuelve a la app y presiona **"Finish Interview"** para habilitar el cuestionario. **Esta es la brecha más grande a cerrar** si se quiere el flujo de voz continuo real descrito en RQ-05.
- **"Mi día" con calendario real (RF-VIS-04) NO está implementado** — `SchedulePage.tsx` es una lista de visitas con acciones de estado, no una vista de calendario. Confirmado por ausencia de cualquier referencia a "calendar"/"calendario" en el código de `src/`.
- **Integración de calendario real (RF-VIS-07) NO está implementada** — no hay conexión con ningún calendario externo (CRM o nativo del dispositivo).
- **"Modo en la ruta" (RF-VIS-08)** está parcialmente cubierto por `RouteSimulationBanner`/`MapDemoControls`, pero como simulación de demo (ver RQ-02), no como una experiencia de "modo conducción" real con notificaciones nativas.
- El simulacro de ruta (`startMapDemo`, `startClientDestinationDemo`) cubre el espíritu de "ver ruta y ETA mientras manejo" con datos ficticios.

## 6. Fuera de alcance de este módulo

- El contenido del cuestionario/entrevista en sí (RQ-06), el briefing pre-visita y debrief por voz (RQ-05).

## 7. Preguntas abiertas / decisiones pendientes

- **¿Se implementa el flujo de voz continuo real (geofence → voz automática) o se mantiene el flujo de dos pasos del demo (llegada manual → "Finish Interview" → cuestionario)?** Es una decisión de producto explícita pendiente, no solo técnica — cambia sustancialmente el diseño de UX y el backend de audio/streaming.
- **Alcance real de "Mi día" con calendario**: ¿se integra con un calendario externo (Google Calendar, Outlook) además del CRM, o solo con el calendario del CRM (Salesforce Events)? No definido en las fuentes.
- Confirmar reglas exactas de reversión/corrección de estado de visita (¿puede un representante "reabrir" una visita `Completed` por error?) — no hay ninguna mención en las fuentes de negocio ni en el código.
