# RQ-08 — Manager Command Center y reporting

**Estado en el demo:** UI de manager implementada con datos mock ricos; ninguno de los cálculos es real (no hay agregación real de datos de campo).
**Código relacionado:** [`src/views/ReportingPage.tsx`](../../src/views/ReportingPage.tsx), [`src/components/TeamMapPanel.tsx`](../../src/components/TeamMapPanel.tsx), [`src/components/AgentStatusList.tsx`](../../src/components/AgentStatusList.tsx), [`src/components/AgentDrillDownSheet.tsx`](../../src/components/AgentDrillDownSheet.tsx), [`src/components/ManagerKpiStrip.tsx`](../../src/components/ManagerKpiStrip.tsx), [`src/components/ManagerInsightsPanel.tsx`](../../src/components/ManagerInsightsPanel.tsx), [`src/components/PerformanceTrendPanel.tsx`](../../src/components/PerformanceTrendPanel.tsx), [`src/components/AccountCoveragePanel.tsx`](../../src/components/AccountCoveragePanel.tsx), acciones `selectManagerAgent`/`setReportingTab`/`dismissManagerInsight`/`toggleCoverageLayer` en `store.ts`.
**Fuentes de negocio:** `docs/Feature_ Sales Manager Command Center & Field Performance Analytics.pdf` (formal, el documento más completo de todos), `docs/MVP - Manager View.pdf` (informal, muy denso, con notas de implementación reales de Dev/PO), `docs/MVP - Tareas.md` (#11, #12, #13, #25, #27, #28).

## 1. Resumen

Vista de gerente tipo "torre de control": mapa en vivo del equipo, completitud diaria por agente, drill-down individual, monitoreo de tareas, reporte de cobertura de cuentas, e insights/recomendaciones generadas por IA para coaching y detección de riesgo.

## 2. Requerimientos funcionales

- **RF-MGR-01**: **Vista de mapa de equipo** — ubicaciones en vivo de todos los agentes, estado de visita, territorios, reuniones activas, oportunidades cercanas, progreso de ruta. Estados de agente por color: verde (a tiempo/productivo), amarillo (en riesgo/retrasado), rojo (visitas perdidas/baja completitud), azul (en reunión con cliente), gris (offline/inactivo).
- **RF-MGR-02**: Click en el ícono de un agente muestra resumen rápido, actividad en vivo, progresión de ruta, engagement actual.
- **RF-MGR-03**: **Dashboard de completitud diaria** — % promedio de equipo, % individual por agente, tendencias diarias, visitas completadas, actividades restantes, cumplimiento de actualización CRM.
- **RF-MGR-04**: **Drill-down individual por agente** — ubicación actual, cumplimiento de agenda, visitas completadas, eficiencia de ruta, % completitud CRM, actualizaciones de oportunidad enviadas, % completitud de tareas, timeline de actividad (visitas, resúmenes IA, interacciones, follow-ups, reuniones perdidas/retrasadas).
- **RF-MGR-05**: **Monitoreo de completitud de tareas** — tareas asignadas, tasas de completitud, actividades vencidas, cumplimiento de follow-up, adherencia SLA.
- **RF-MGR-06**: **Reporte de desempeño de cuentas** — frecuencia de engagement, cobertura de visitas, progresión de oportunidad, riesgo de inactividad, salud de pipeline.
- **RF-MGR-07**: **Insights de IA** para el gerente en 3 categorías: sugerencias de coaching (ej. *"Ruben has missed two visits this week due to route inefficiencies."*), detección de riesgo (bajo engagement, follow-ups perdidos, oportunidades estancadas, negligencia de territorio, baja adopción CRM), optimización de productividad (reasignación de territorio, mejoras de ruta).
- **RF-MGR-08**: Análisis histórico diario/semanal/mensual de las métricas anteriores.
- **RF-MGR-09**: Notificaciones al gerente por visitas perdidas, baja actividad, escalaciones, cuentas de alto riesgo.
- **RF-MGR-10**: El gerente puede enviar mensajes/notas al representante antes de una visita (ej. *"Hoy verás esta cuenta, por favor obtén una actualización sobre el tema X"*), que se reflejan en el overview del día del representante y pueden convertirse en tarea. *Fuente cruzada con RQ-05/RQ-04.*
- **RF-MGR-11**: Debe existir un **Agent Performance Scorecard** compuesto y ponderado: Visit completion 25%, CRM updates 20%, Opportunity movement 25%, Task completion 15%, Customer coverage 15%.
- **RF-MGR-12**: Debe soportarse zoom del mapa desde "todo el equipo" hasta un agente individual con su ruta del día. *Fuente: `MVP - Tareas.md` #11.*

## 3. Reglas de negocio

- Código de color de reporte gerencial de completitud: **rojo** = no se ingresaron datos, **verde** = se completaron tareas y datos requeridos (regla distinta del código de color de estado de agente de RF-MGR-01 — son dos escalas de color con propósito distinto, no unificar sin decisión de diseño).
- Los reportes deben mostrar: % tareas completadas por representante, avance semanal, ruta realizada, clientes visitados, millaje/recorrido, estado de captura de datos. *Fuente: `MVP - Tareas.md` #12.*
- UX esperada explícitamente como **desktop-first**, con soporte tablet y vistas rápidas móviles — a diferencia del resto de la app, que es mobile-first. *Nota de arquitectura relevante para cuando se diseñe el frontend de esta vista fuera del "phone shell" actual.*
- 5 reportes adicionales sugeridos con métricas propias (ver PDF fuente para detalle completo): Team Productivity Dashboard, Account Coverage Report, Opportunity Execution Report, Territory Efficiency Report, CRM Adoption Score.

## 4. Datos y entidades involucradas

`FieldAgent` (extiende `Agent` con `status: AgentStatus`, `completionPercent`, `crmCompletionRate`, `routeEfficiency`, `onTimeArrivalRate`, `productiveHours`), `AgentPerformanceSnapshot`, `ManagerInsight` (`severity`, `category`, `recommendedAction`), `HistoricalTrendPoint`, `AccountCoverageMetric`, `TerritoryMetric`, `ReportingTab`.

## 5. Estado actual en el demo

- Esta es la vista con **más volumen de tipos y componentes dedicados** de todo el frontend (7 componentes + 4 tabs de reporting) — el modelo de datos (`types.ts` §"vista de gerente") ya cubre prácticamente todas las entidades que pide la fuente formal.
- Todo el contenido es **generado a partir de `data.ts` estático** — no hay agregación real de eventos de campo (no hay verdaderas "visitas completadas por 12 agentes" siendo sumadas; son números fijos).
- El **Agent Performance Scorecard ponderado (RF-MGR-11)** no está confirmado como cálculo explícito en el código — si `AgentPerformanceSnapshot` no aplica los pesos 25/20/25/15/15 exactos, es una brecha a cerrar antes de considerar esto "hecho" incluso en mock.
- El mensaje in-app gerente→representante (RF-MGR-10) tiene su contraparte de UI en el lado del representante (asistente/notificaciones, RQ-05/RQ-10), pero no hay una superficie de UI dedicada en `ReportingPage` para que el gerente *redacte* ese mensaje — solo se documenta el flujo de "recepción", no el de "envío".
- La UX desktop-first pedida por la fuente convive dentro del mismo "phone shell" que el resto de la app — vale la pena revisar si esto es una decisión consciente para el demo o una brecha a resolver en el rediseño real.

## 6. Requerimientos no funcionales

- Refresco del mapa de equipo en tiempo real, <10s.
- Manejo seguro de ubicación de empleados; permisos de visibilidad basados en rol.
- Escalabilidad de analítica histórica.

## 7. Fuera de alcance (explícito, "enhancements futuros")

- AI Sales Coaching Assistant dedicado, Forecast Intelligence predictivo, Comparative Benchmarking entre regiones/equipos/periodos, Smart Manager Alerts avanzadas.
- Heatmap de penetración de territorio (`MVP - Manager View.pdf` #5) y Collateral Delivery Tracker (#6) — marcados como features individuales adicionales, no confirmadas como parte del MVP.

## 8. Preguntas abiertas / decisiones pendientes

- **Percepción de vigilancia excesiva del empleado** — riesgo explícitamente documentado en la fuente formal; el negocio debe definir una política de uso transparente antes de habilitar tracking de ubicación en tiempo real de representantes en producción. Esto es una decisión de negocio/legal, no técnica.
- **¿Cuáles de los 6 reportes adicionales de `MVP - Manager View.pdf`** (Voice-to-Data Transcription Pipeline, Predictive Warm-Stop Routing, Gamified Streaks Dashboard, Geofenced Check-in Auditor, Territory Heatmapping, Collateral Delivery Tracker) **entran al alcance real de producto**, y cuáles quedan como visión de largo plazo? Ese documento mezcla ideas ya cubiertas por otros módulos (streaks→RQ-07, geofence→RQ-02/04) con ideas completamente nuevas (heatmapping, collateral tracking) — requiere priorización explícita del Product Owner antes de convertirse en Feature Briefs.
- Definir explícitamente el rol/permiso de "gerente" en el modelo de autenticación (RQ-01) — hoy no existe ningún concepto de rol en el demo, solo un agente de campo fijo.
