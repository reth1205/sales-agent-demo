# Documentos de requerimientos — sales-agent-demo

Fecha: 2026-08-22
Autor: Claude Code, a petición de René Trejo.

## Propósito

Esta carpeta contiene los **requerimientos funcionales del producto**, derivados de dos fuentes exclusivamente:

1. **El comportamiento real del proyecto web SolidJS** (`src/`) — qué existe hoy, cómo se comporta, qué decisiones de negocio quedaron codificadas en `store.ts`/`services.ts`/`types.ts`/las vistas.
2. **Los documentos originales de negocio en `docs/`** (los PDFs de especificación de features, notas de brainstorm, mockups, y el plan de ejecución original del demo).

**No** se basan en el estado del backend (`server/`) ni en el pipeline de agentes (`.claude/`) — esos son *consumidores* de estos documentos, no fuentes. La idea explícita es que estos documentos de requerimientos sirvan de **entrada** para el trabajo de migración a backend real y para el rediseño de frontend que venga después (vía `/feature`, `rx-api-architect`, `rx-ui-architect`, etc.), reemplazando la necesidad de releer los PDFs originales o de inferir requerimientos únicamente del código.

Para el análisis de arquitectura/estado técnico del repo (qué stack, qué está wireado, deuda técnica), ver [`docs/ANALISIS-PROYECTO.md`](../ANALISIS-PROYECTO.md) — ese documento es complementario a estos, no lo repite.

## Cómo se escribió cada documento

Cada documento de módulo combina:

- **Requerimiento de negocio** — tomado literalmente o parafraseado de los PDFs/`.md` fuente en `docs/`, citando el documento de origen.
- **Estado actual en el demo** — qué de ese requerimiento ya está implementado en `src/`, con qué simplificación respecto al requerimiento real, y por qué (casi siempre documentado ya en `.claude/requirenment/solidjs-demo-execution-plan.md`, el plan original del demo).
- **Brecha para producción real** — qué falta para que ese requerimiento deje de ser mock.

Formato de cada requerimiento funcional: `RF-<módulo>-<n>`, con una frase de criterio de aceptación. Los requerimientos no son exhaustivos al nivel de un caso de prueba — son la unidad que un Feature Brief (`rx-api-architect`/`rx-ui-architect`) debe poder tomar y descomponer en tareas.

## Índice de módulos

| # | Documento | Cubre |
|---|---|---|
| 01 | [Navegación y autenticación](01-navegacion-y-autenticacion.md) | Login, shell de la app, dashboard como landing, navegación inferior |
| 02 | [Mapa y descubrimiento de cuentas](02-mapa-y-descubrimiento-de-cuentas.md) | Pines de mapa, tarjeta resumen de cliente, recomendaciones de proximidad, geofencing |
| 03 | [CRM — cuentas, contactos, oportunidades, tareas](03-crm-cuentas-contactos-oportunidades-tareas.md) | Ficha de cliente, datos CRM base, réplica de Salesforce |
| 04 | [Ciclo de vida de visitas y agenda](04-ciclo-de-vida-de-visitas-y-agenda.md) | `ScheduledVisit`, estados de visita, pantalla de agenda, simulación de ruta |
| 05 | [Asistente IA — briefing y debrief por voz](05-asistente-ia-briefing-y-debrief-por-voz.md) | Pre-meeting briefing, debrief post-reunión, conversación "Sandy", extracción NLP |
| 06 | [Entrevista post-visita por IA conversacional y revisión CRM](06-cuestionario-post-visita-y-revision-crm.md) | Debrief por voz conducido por IA (guion `Script.docx`), reemplaza el cuestionario estructurado del demo |
| 07 | [Gamificación y progreso diario](07-gamificacion-y-progreso-diario.md) | % de completitud diaria, milestones, streaks |
| 08 | [Manager Command Center y reporting](08-manager-command-center-y-reporting.md) | Mapa de equipo, drill-down por agente, insights, KPIs, reportes |
| 09 | [Salesforce writeback, sincronización y modo offline](09-salesforce-writeback-sincronizacion-y-modo-offline.md) | Escritura a CRM, cola offline, reconciliación |
| 10 | [Notificaciones y empaquetado móvil](10-notificaciones-y-empaquetado-movil.md) | Push/local notifications, Capacitor, tokens de dispositivo |
| 11 | [Auditoría de cobertura](11-auditoria-de-cobertura.md) | Verificación RF-XX por RF-XX contra el código real — qué está hecho, parcial, o ausente |

## Notas transversales (aplican a más de un módulo)

- **Nombre del asistente de IA — conflicto activo, sin resolver**: los documentos de mockup/negocio informal (`MVP - Business Inputs.pdf`, `MVP - Mockup.pdf`) lo llaman **"Sandy"**; el guion más reciente y más detallado (`docs/Script.docx`, 2026-08-22) lo llama **"AISA"**. Los documentos formales tipo especificación nunca le dan nombre propio. **Decisión pendiente**: el producto final necesita un nombre de marca único para el asistente — no asumir ninguno de los dos sin confirmación de negocio. Ver [RQ-06 §11](06-cuestionario-post-visita-y-revision-crm.md).
- **Dos capas de fuente de negocio**: (a) documentos formales con FR/Acceptance-Criteria/Non-functional/Out-of-scope (los que dan forma 1:1 a un Feature Brief de backend), y (b) documentos de brainstorm/mockup que aportan tono, copy exacto de conversación, nombres de pantalla y detalles de UX no presentes en los formales (streaks, "Manager Pulse", checklist rojo/verde, RAG con fuentes CRM+internet+LinkedIn+manager input+rep input). Cada documento de módulo indica de cuál capa viene cada requerimiento.
- **Inconsistencia de colores de pin/estado entre documentos fuente**: `Feature Sales completion activity.pdf` usa Gris=Pendiente/Azul=En progreso/Verde=Completado para pines de progreso; `Feature_ Intelligent Customer Map Pins...pdf` usa Verde=Visita programada/Azul=Cuenta activa cercana/Amarillo=Oportunidad/Rojo=Riesgo/Gris=Completada para pines de mapa. Son dos sistemas de color para dos propósitos distintos (progreso de captura vs. tipo de pin) — cada documento de módulo lo reconcilia por separado, pero vale la pena que quien apruebe el diseño final confirme que no se espera un único código de color universal.
- **CRM objetivo real**: Salesforce, en todos los documentos formales. El stack de infraestructura sugerido en `MVP - Business Topics.pdf` (Supabase/Firebase, OpenAI/Anthropic, Codemagic/Bitrise) es de una sesión de brainstorm de presupuesto, **no coincide** con el stack que ya eligió este repo (ASP.NET Core + Postgres + Capacitor) — se documenta la discrepancia en cada módulo relevante, sin asumir que hay que migrar de stack.
- **Límite de crédito ("credit limit") como campo de Account**: solo aparece en `MVP - Business Inputs.pdf`, ausente en los documentos formales y en `types.ts` actual. Pendiente de decisión explícita — ver [documento 03](03-crm-cuentas-contactos-oportunidades-tareas.md).
- **Proveedor de mapas**: el requerimiento formal (`Main App _ Navigation.pdf`) exige Google Maps; el demo usa Leaflet/OpenStreetMap detrás de una capa `MapProvider` intercambiable (decisión documentada como temporal en `.claude/requirenment/solidjs-demo-execution-plan.md`). Ver [documento 02](02-mapa-y-descubrimiento-de-cuentas.md).
- **El modelo de IA nunca debe llamarse directo desde el cliente móvil** — regla explícita de `docs/mobile-dashboard-migration-plan.md`: todo brief/debrief IA y todo writeback a CRM pasa por el backend, con logs de auditoría y semántica de reintento. Esto aplica de lleno al diseño de `SalesAgent.Api` cuando se construyan los recursos de asistente IA (documento 05) y writeback (documento 09).
- **Arquitectura móvil de largo plazo recomendada por `docs/mobile-dashboard-migration-plan.md` es React Native + Expo**, no Capacitor — Capacitor se documenta ahí como válido solo para prototipo instalable de corto plazo. Esta es una decisión de arquitectura que **no está tomada** para este repo (que ya invirtió en Capacitor) — se deja consignada en el documento 10 para que el negocio la revise, no se asume una migración de framework.
