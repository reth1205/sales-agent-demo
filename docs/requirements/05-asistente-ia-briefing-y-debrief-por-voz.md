# RQ-05 — Asistente IA: briefing pre-visita y debrief post-visita por voz

**Estado en el demo:** Toda la "IA" es lógica determinística/mock; el flujo conversacional real de voz continua NO está implementado (existe como cuestionario estructurado, ver RQ-06).
**Código relacionado:** [`src/components/DefaultVisitBriefNotification.tsx`](../../src/components/DefaultVisitBriefNotification.tsx), [`src/components/AssistantNotificationSheet.tsx`](../../src/components/AssistantNotificationSheet.tsx), [`src/components/AssistantTopNotification.tsx`](../../src/components/AssistantTopNotification.tsx), [`src/components/MeetingSimulationBanner.tsx`](../../src/components/MeetingSimulationBanner.tsx), acciones `triggerDestinationEta`/`triggerArrivalBriefing`/`triggerPreMeetingBriefing`/`triggerPostMeetingDebrief`/`schedulePreMeetingDemo`/`schedulePostMeetingDemo`/`reconcileMeetingDemoProgress` en `store.ts`, tipos `AssistantNotification`/`PreMeetingBriefing`/`PostMeetingExtraction`/`ExtractionConfidence` en `types.ts`.
**Fuentes de negocio:** `docs/AI Assisted Customer Visit Registration.pdf` (formal, FR1–FR9 + AC), `docs/Feature_ AI Customer Briefing & Proximity-Based Voice Insights.pdf` (formal, FR + AC), `docs/Ejemplo de interacción. .pdf` (guion de conversación real), `docs/MVP - Bot UX.pdf` + `docs/botui.md` (epics EPIC-01 a EPIC-05, US-AI-001), `docs/MVP - Mockup.pdf` (mockups "Sandy"), **`docs/Script.docx`** (guion canónico más reciente y detallado — ver RQ-06).

Este es el módulo con más volumen y densidad de requerimiento de negocio de todo el proyecto — es también el que tiene la brecha de implementación más grande frente al demo actual.

> **Actualización 2026-08-22**: `docs/Script.docx` (nuevo) profundiza y en varios puntos reemplaza el detalle de este módulo — confirma que el debrief post-visita es una entrevista conversacional completa (no un cuestionario de preguntas fijas), añade un mecanismo de Q&A interactivo durante el briefing, "Call Objectives" generados dinámicamente, citación de fuente por afirmación, un umbral de disparo alterno por distancia (5 millas) además del de tiempo (5 minutos) de este documento, y la posibilidad de interrumpir el audio del vehículo. El detalle completo de estos puntos y sus preguntas abiertas vive ahora en **[RQ-06](06-cuestionario-post-visita-y-revision-crm.md)**, que es el documento que absorbe el guion — este documento (RQ-05) se mantiene como referencia del modelo de disparo/notificación (`AssistantNotification`) y del contrato de datos original, pero RQ-06 tiene precedencia en cualquier punto donde ambos documentos difieran.

## 1. Resumen

Un asistente de IA (llamado **"Sandy"** en los documentos de mockup/negocio informal) que: (a) antes de la visita, entrega proactivamente un briefing de contexto de cuenta por voz o tarjeta; (b) después de la visita, sostiene una conversación de voz continua tipo debrief que extrae datos estructurados y los escribe al CRM sin que el representante llene un formulario.

## 2. Requerimientos funcionales — Briefing pre-visita

- **RF-IA-01**: El sistema debe monitorear proximidad a la cuenta y disparar el briefing cuando el agente está a una distancia/tiempo umbral configurable (**default 5 minutos** en modo automático, ajustable por admin/usuario).
- **RF-IA-02**: El briefing debe poder entregarse por 4 canales: notificación push, tarjeta resumen legible, reproducción de voz IA (text-to-speech) mientras se aproxima, o acceso manual desde el pin/menú/"My Day".
- **RF-IA-03**: El briefing debe incluir 6 secciones: (1) Customer Overview (nombre, status, tier, última visita, contacto primario), (2) resumen de últimas interacciones, (3) tareas pendientes/vencidas, (4) resumen de oportunidades activas (valor/stage/riesgo), (5) información CRM faltante/desactualizada detectada por IA, (6) áreas de foco sugeridas accionables.
- **RF-IA-04**: El usuario debe poder controlar la reproducción: pausar, repetir, deshabilitar notificaciones, configurar distancia de disparo.
- **RF-IA-05**: La lógica de priorización del contenido del briefing debe seguir el orden: action items inmediatos → oportunidades de alto valor → riesgos/escalaciones → información CRM faltante → resúmenes de interacción reciente → talking points sugeridos.
- **RF-IA-06**: El tono de voz del briefing debe ser conversacional/profesional y priorizar insight accionable sobre lectura literal de campos CRM. *Ejemplo real de copy esperado (`Ejemplo de interacción.pdf`): "You're arriving at Acme Manufacturing in 3 minutes. You have one active opportunity worth $185,000 that is currently in the Proposal stage..."*

## 3. Requerimientos funcionales — Registro/debrief post-visita por voz

- **RF-IA-07**: Al detectar fin de reunión (timer configurable — real: **30 minutos**; o salida de geofence), el sistema ofrece iniciar un debrief conversacional de voz.
- **RF-IA-08**: La conversación debe recolectarse agrupada en 4 bloques de preguntas de negocio: **Event Information** (cómo fue la reunión, disponibilidad del cliente, duración, éxito percibido), **Opportunity Information** (nuevas oportunidades, cambio de stage, presupuesto/timeline, monto/probabilidad), **Account Information** (cambios de cuenta, nuevos stakeholders, riesgos/escalaciones), **Follow-Up Actions** (crear tarea, agendar reunión, asignar action items).
- **RF-IA-09**: La IA debe interpretar la conversación libre (no un formulario de campos) y mapearla a objetos estructurados: Event, Task, Opportunity, Account Notes, Follow-Up Activities, Contact Updates.
- **RF-IA-10**: Debe existir una pantalla de resumen para revisión antes de guardar — el usuario puede editar o eliminar entradas antes de confirmar (nunca se escribe al CRM sin paso de confirmación humana).
- **RF-IA-11**: Si la conversación deja información incompleta, la IA debe hacer **una pregunta de seguimiento dirigida** (no relanzar todo el cuestionario) y, si el dato sigue faltando, marcarlo como pendiente sin bloquear el guardado. *Regla de negocio extraída del guion de `Ejemplo de interacción.pdf`, Escenario 2: cuando falta un dato no se exige confirmación explícita del usuario, solo se marca en rojo con una nota de la IA sobre qué queda pendiente.*
- **RF-IA-12**: Debe mantenerse un checklist visual de captura con (al menos) 4 categorías — **Tasks, Opportunities, Schedule, Notes/Summary** — cada una en verde (completo) o rojo (pendiente).
- **RF-IA-13**: Debe soportarse captura offline con cola de sincronización posterior si no hay conectividad (comparte contrato con RQ-09).
- **RF-IA-14**: Debe soportarse adjuntar capturas de pantalla/attachments al registro de visita.

## 4. Reglas de negocio

- **Timing real de producción**: 15 minutos antes para el pre-briefing, 30 minutos (o señal de geofence-exit) para disparar el post-debrief — valores explícitos documentados en `botui.md`/`US-AI-001`.
- El asistente de IA usa un patrón **RAG (Retrieval-Augmented Generation)** con fuentes explícitas: CRM, internet, LinkedIn, input del gerente, input del representante. *Fuente: anotación de wireframe en `MVP - Mockup.pdf`.*
- El asistente puede detectar y marcar cautelas automáticas espejando el CRM (ej. "sin actividad en 2 semanas") además de las que ya trae Salesforce — *"We shall be able to mirror CRM and add a flag of our own."*
- Si el representante va tarde a una cita, el sistema debe poder notificar automáticamente al cliente ("el representante lleva 5 minutos de retraso"), con el umbral configurable por el negocio, no fijo — usa la Maps API para el cálculo.
- El gerente puede inyectar una nota/tarea ad-hoc mientras el representante está en tránsito hacia una cuenta, y el representante la recibe como notificación in-app que se auto-convierte en tarea (flujo cruzado con RQ-08).
- **Regla de arquitectura no-negociable** (`docs/mobile-dashboard-migration-plan.md`): el modelo de IA nunca se invoca directamente desde el cliente móvil — todo pasa por el backend, con logs de auditoría y semántica de reintento.

## 5. Datos y entidades involucradas

`AssistantNotification` (`type`, `triggerReason`, `status`), `PreMeetingBriefing` (`etaMinutes`, `executiveSummary`, `recentTopics`, `openTaskIds`, `blockers`, `suggestedQuestions`, `keyContactIds`, `riskLevel`), `PostMeetingExtraction` (`durationMinutes`, `topicsDiscussed`, `opportunityUpdate`, `completedTaskIds`, `followUpActions`, `missingFields`, `confidence: ExtractionConfidence`), `VisitObjectiveAssessment`.

## 6. Estado actual en el demo

- **El flujo de disparo por proximidad/timer sí está implementado**, con notificaciones simuladas (`triggerDestinationEta`, `triggerArrivalBriefing`, `triggerPreMeetingBriefing`, `triggerPostMeetingDebrief`) y compresión de tiempos de demo: **15 minutos reales → 15 segundos en demo** y **30 minutos reales → 30 segundos en demo** (`assistantTiming.demo.preMeetingLeadSeconds`/`postMeetingWindowSeconds` en `store.ts`), con etiqueta visible de que es simulación.
- **El contenido del briefing es texto generado por lógica local determinística**, no un LLM real ni RAG real — no hay integración con CRM externo, internet, ni LinkedIn.
- **La "conversación de voz continua" descrita en las fuentes NO existe como tal** — lo que existe es el cuestionario estructurado post-visita (RQ-06), que es la aproximación de demo al debrief: preguntas fijas con opción de responder por voz (Web Speech API) o texto, no una conversación libre interpretada por NLP real.
- **La extracción NLP de conversación libre → 6 campos estructurados (RF-IA-09) NO está implementada** — el mapeo hoy es de "respuesta a pregunta fija" → campo, vía `interpretVisitAnswers` en `services.ts` (reglas/keywords, no un modelo de lenguaje).
- El checklist rojo/verde por categoría (RF-IA-12) tiene una aproximación en `ReviewPanel`/`ReviewSummary.objectiveChecklist`, pero no confirmado que cubra exactamente las 4 categorías del guion de negocio (Tasks/Opportunities/Schedule/Notes) — revisar antes de dar por cumplido.
- El writeback a Salesforce es 100% simulado (ver RQ-09).

## 7. Requerimientos no funcionales

- Transcripción de voz <2s; generación de briefing <5s; arranque de voz <2s (todos de la fuente formal, no verificados en el demo web).
- Sincronización a Salesforce >99% de confiabilidad.
- Procesamiento de voz/CRM encriptado; cumplimiento GDPR/seguridad de datos de voz.
- Optimización de batería para geofencing en background (móvil real).

## 8. Fuera de alcance (explícito en las fuentes)

- Recomendaciones de venta generadas por IA, scoring predictivo de oportunidades, cierre automático de oportunidades, autenticación biométrica de voz, análisis de sentimiento en tiempo real — todos marcados "fuera de alcance" en `AI Assisted Customer Visit Registration.pdf`.
- AI Conversation Coaching, Smart Follow-Up Generation, Sentiment Analysis — marcados "enhancement futuro" en `Feature_ AI Customer Briefing...pdf`.

## 9. Preguntas abiertas / decisiones pendientes

- **Proveedor de LLM/voz real**: no definido en ningún documento formal; `MVP - Business Topics.pdf` sugiere OpenAI/Anthropic como opción de presupuesto, sin decisión.
- **¿El flujo de producción reemplaza por completo el cuestionario estructurado de RQ-06 por conversación de voz libre, o coexisten ambos (voz libre con fallback a preguntas guiadas si la IA no logra extraer suficiente información)?** Es la decisión de UX/producto más grande pendiente de este módulo — condiciona si RQ-06 se reescribe o se mantiene como fallback permanente.
- **Definición exacta del esquema JSON de extracción** antes de integrar cualquier LLM real — mencionado como pendiente explícito en `botui.md`.
- Confirmar si "Sandy" es el nombre de marca final del asistente.
- Confirmar idioma final de la interacción de voz (el demo ya soporta comandos EN/ES para navegación, pero el contenido de negocio fuente está mayormente en inglés).
