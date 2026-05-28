# Plan de accion - Sales Manager Command Center & Field Performance Analytics

Fecha: 2026-05-27  
Fuente: `docs/Feature_ Sales Manager Command Center & Field Performance Analytics.pdf`  
Alcance de esta fase: planificacion solamente, sin implementar cambios de codigo ni ejecutar la demo.

## 1. Objetivo

Crear un plan para evolucionar la vista actual de `Reporting` hacia un command center para gerente de ventas, usando exclusivamente datos dummy locales.

La experiencia debe permitir que un sales manager pueda monitorear:

- Ubicacion y estado de agentes en campo.
- Progreso diario por agente y promedio del equipo.
- Cumplimiento de visitas.
- Calidad de captura CRM.
- Tareas completadas y vencidas.
- Cobertura de cuentas.
- Riesgos operativos y de engagement.
- Recomendaciones de coaching simuladas por AI.
- Drill-down individual de cada agente.

## 2. Restricciones de demo

- No se debe crear API, backend, endpoint, data warehouse ni integracion Salesforce real.
- Toda la informacion debe vivir en `src/data.ts`, tipos locales y estado de Solid.
- Las metricas deben calcularse en frontend con funciones deterministicas.
- La "AI" debe ser simulada mediante reglas locales y textos predefinidos.
- La ubicacion de agentes debe ser mock data, no tracking real.
- Las notificaciones de manager deben ser banners, alerts o panels in-app, no push notifications reales.
- El dashboard debe conservar la sensacion de app/demo existente; puede ser mas denso, pero sin romper el mobile shell actual.
- El codigo y el microcopy funcional nuevo deben mantenerse en ingles, siguiendo el estilo actual del proyecto.

## 3. Requerimientos extraidos del PDF

### Experiencia principal

El Sales Manager Command Center debe combinar:

- Operational visibility.
- Field workforce management.
- CRM activity intelligence.
- Gamified productivity metrics.
- Territory/account performance analysis.

Debe soportar:

- Executive overview monitoring.
- Tactical operational management.
- Coaching and accountability.
- Territory optimization.

### Componentes principales

1. `Team Map View`
   - Agent locations.
   - Current visit status.
   - Assigned territories.
   - Active customer meetings.
   - Nearby opportunities.
   - Route progress.

2. `Daily Completion Dashboard`
   - Team average completion percent.
   - Individual completion percent.
   - Daily progress trends.
   - Completed visits.
   - Remaining activities.
   - CRM update compliance.

3. `Individual Agent Drill-Down`
   - Current location.
   - Schedule adherence.
   - Visits completed.
   - Route efficiency.
   - CRM completion rate.
   - Opportunity updates submitted.
   - Task completion percentage.
   - Activity timeline.

4. `Task Completion Monitoring`
   - Assigned tasks.
   - Completion rates.
   - Overdue activities.
   - Follow-up compliance.
   - SLA adherence.

5. `Account Performance Reporting`
   - Account engagement frequency.
   - Visit coverage.
   - Opportunity progression.
   - Customer inactivity risks.
   - Revenue pipeline health.

6. `AI Insights & Recommendations`
   - Coaching suggestions.
   - Risk detection.
   - Productivity optimization.
   - Manager alerts.

## 4. Estado actual de la aplicacion

Archivos revisados:

- `src/views/ReportingPage.tsx`
- `src/views/DashboardPage.tsx`
- `src/store.ts`
- `src/data.ts`
- `src/types.ts`

### Lo que ya existe

- La app ya tiene una ruta `/reporting`.
- `ReportingPage` muestra:
  - `DailyProgressWidget`.
  - Completed visits.
  - Open tasks.
  - Pending sync.
  - Streak.
  - Milestones.
  - Sync queue.
- `store.ts` ya maneja:
  - visitas,
  - tareas generadas,
  - progreso diario,
  - cola offline,
  - estado de agente unico.
- `data.ts` ya contiene:
  - un agente demo,
  - cuentas,
  - contactos,
  - oportunidades,
  - visitas,
  - actividades.
- `services.ts` ya tiene calculo de distancia y helpers base.

### Brechas frente al PDF

- La app representa solo un agente (`Sofia Rivera`), no un equipo.
- No existe rol o modo de manager.
- No existe mapa de equipo en reporting.
- No hay datos de ubicacion por agente.
- No hay scorecards por agente.
- No hay drill-down individual.
- No hay tendencias historicas daily/weekly/monthly.
- No hay metricas de route adherence, route efficiency ni on-time arrival.
- No hay analytics de cobertura de cuentas.
- No hay metricas de CRM completion por agente.
- No hay recomendaciones de coaching.
- No hay alertas de manager por missed visits, low activity, escalations o high-risk accounts.

## 5. Enfoque propuesto para la demo

Implementar el command center como una version enriquecida de `/reporting`, no como una app separada.

Motivo:

- La ruta `Reporting` ya existe en bottom navigation.
- El PDF describe reporting/analytics y monitoreo ejecutivo.
- Para la demo, evitar agregar otra navegacion mantiene el alcance controlado.

La vista futura de `ReportingPage` debe cambiar de "reporte individual del agente" a "manager command center" con tabs o secciones:

- `Overview`
- `Team`
- `Accounts`
- `Insights`

En mobile shell, se recomienda usar tabs horizontales o segmented control para evitar una pantalla demasiado larga.

## 6. Datos dummy necesarios

### Nuevos tipos sugeridos en `src/types.ts`

Agregar:

```ts
export type AgentStatus = 'OnSchedule' | 'AtRisk' | 'Missed' | 'InMeeting' | 'Offline';

export type FieldAgent = Agent & {
  avatarInitials: string;
  status: AgentStatus;
  latitude: number;
  longitude: number;
  currentCustomer?: string;
  completionPercent: number;
  crmCompletionRate: number;
  routeEfficiency: number;
  onTimeArrivalRate: number;
  productiveHours: number;
};

export type AgentPerformanceSnapshot = {
  agentId: string;
  visitsCompleted: number;
  visitsScheduled: number;
  opportunityUpdates: number;
  followUpTasksCompleted: number;
  followUpTasksOpen: number;
  overdueTasks: number;
  averageResponseHours: number;
  crmUpdatesSubmitted: number;
  missedVisits: number;
};

export type ManagerInsight = {
  id: string;
  agentId?: string;
  accountId?: string;
  severity: 'info' | 'warning' | 'critical';
  category: 'coaching' | 'risk' | 'productivity' | 'coverage' | 'crm';
  title: string;
  message: string;
  recommendedAction: string;
};

export type HistoricalTrendPoint = {
  date: string;
  teamCompletion: number;
  crmCompletion: number;
  visitsCompleted: number;
  tasksCompleted: number;
};
```

### Nuevos fixtures sugeridos en `src/data.ts`

Agregar:

- `fieldAgents`: 4 a 5 agentes demo.
  - `Sofia Rivera`
  - `Ruben Ortega`
  - `Maria Santos`
  - `John Miller`
  - `Elena Vega`
- `agentPerformanceSnapshots`: resumen por agente.
- `managerInsights`: recomendaciones y alertas simuladas.
- `historicalTrends`: 7 dias de tendencias.
- `accountCoverageMetrics`: cuentas visitadas, inactivas, riesgo y pipeline.
- `territoryMetrics`: visitas por zona, travel ratio y eficiencia.

Los datos deben ser suficientemente variados para mostrar estados:

- Un agente productivo/on schedule.
- Un agente en riesgo.
- Un agente con missed visits.
- Un agente en customer meeting.
- Un agente offline.

## 7. Selectores y servicios de analytics

Crear o extender `src/selectors.ts` con:

- `getTeamAverageCompletion()`
- `getAgentPerformance(agentId)`
- `getSelectedAgent(agentId)`
- `getAgentStatusColor(status)`
- `getTeamTotals()`
- `getAgentsByRisk()`
- `getManagerAlerts()`
- `getAccountCoverageSummary()`
- `getCrmAdoptionScore()`
- `getTaskCompletionSummary()`
- `getOpportunityExecutionSummary()`

Crear helpers en `src/services.ts` o un nuevo `src/analytics.ts`:

- `calculateCompositePerformanceScore(snapshot)`
- `calculateTaskCompletionRate(snapshot)`
- `calculateScheduleAdherence(snapshot)`
- `calculateCoverageRisk(accountMetrics)`
- `buildCoachingInsight(agent, snapshot)`
- `formatPercent(value)`
- `formatHours(value)`

La logica debe ser simple y explicable para demo.

## 8. Cambios de estado

Actualizar `src/store.ts`:

- Agregar datos manager al estado:
  - `manager.agents`
  - `manager.performance`
  - `manager.insights`
  - `manager.trends`
  - `manager.accountCoverage`
- Agregar UI:
  - `selectedManagerAgentId?: string`
  - `reportingTab: 'overview' | 'team' | 'accounts' | 'insights'`
  - `dismissedManagerInsightIds: string[]`
- Agregar acciones:
  - `selectManagerAgent(agentId)`
  - `setReportingTab(tab)`
  - `dismissManagerInsight(insightId)`

No es necesario persistir todo en `localStorage`; para demo basta con estado inicial local. Solo podria persistirse el tab seleccionado o insights descartados si aporta a la experiencia.

## 9. Componentes propuestos

### `src/views/ReportingPage.tsx`

Convertirlo en contenedor del command center.

Debe incluir:

- Header `Command Center`.
- Segmented control de tabs.
- KPI summary del equipo.
- Render condicional de secciones.
- Mantener acceso a sync queue o moverla a una seccion secundaria si sigue siendo relevante.

### Nuevo `src/components/ManagerKpiStrip.tsx`

KPIs principales:

- Team completion.
- Visits completed.
- CRM completion.
- Overdue tasks.
- At-risk agents.
- Pipeline touched.

### Nuevo `src/components/TeamMapPanel.tsx`

Para demo puede usar dos opciones:

1. Reutilizar Leaflet con pins de agentes dentro de un panel.
2. Crear una lista/mapa simplificado si se quiere controlar el alcance visual.

Recomendacion: usar Leaflet, ya que el proyecto ya lo tiene instalado y `MapView` existe.

Debe mostrar:

- Marker por agente.
- Color por `AgentStatus`.
- Popup o seleccion al tocar agente.
- Leyenda compacta.

### Nuevo `src/components/AgentStatusList.tsx`

Lista compacta de agentes con:

- Nombre.
- Estado.
- Completion percent.
- CRM completion.
- Visits completed.
- Indicador visual de riesgo.

### Nuevo `src/components/AgentDrillDownSheet.tsx`

Panel/bottom sheet al seleccionar agente.

Contenido:

- Agent summary.
- Current location/customer.
- Performance score.
- Schedule adherence.
- CRM completion.
- Route efficiency.
- Opportunity updates.
- Task completion.
- Activity timeline.
- Coaching suggestion.

### Nuevo `src/components/ManagerInsightsPanel.tsx`

Lista de insights y alertas:

- Severity.
- Category.
- Message.
- Recommended action.
- Related agent/account.
- Dismiss action.

### Nuevo `src/components/AccountCoveragePanel.tsx`

Resumen de cobertura:

- Accounts visited this week.
- Accounts not visited in X days.
- Engagement frequency.
- Account risk score.
- Pipeline health.

### Nuevo `src/components/PerformanceTrendPanel.tsx`

Tendencias sin libreria de charts adicional:

- Mini bar chart con CSS.
- Trendline simple con divs o barras.
- Daily/weekly/monthly selector demo si se requiere.

Evitar agregar librerias de graficas para mantener el demo ligero.

## 10. UX propuesta

La experiencia debe sentirse:

- Ejecutiva.
- Operacional.
- Data-rich pero legible.
- Accionable.
- Orientada a coaching.

### Estructura recomendada de `/reporting`

1. Header:
   - `Command Center`
   - Subtitle: `Team visibility and field performance`

2. KPI strip:
   - `Team completion`
   - `CRM completion`
   - `At risk`
   - `Overdue`

3. Tabs:
   - `Overview`
   - `Team`
   - `Accounts`
   - `Insights`

4. Overview:
   - Team map compact.
   - Performance trend.
   - Top manager alert.
   - Leaderboard mini.

5. Team:
   - Agent list.
   - Drill-down sheet.
   - Completion bars.

6. Accounts:
   - Coverage metrics.
   - Inactive accounts.
   - Pipeline health.

7. Insights:
   - Coaching suggestions.
   - Risk alerts.
   - Productivity recommendations.

## 11. Plan por fases

### Fase 1 - Modelo y fixtures manager

Objetivo: preparar datos dummy de equipo sin tocar interacciones complejas.

Tareas:

- Extender `src/types.ts`.
- Agregar `fieldAgents`, `agentPerformanceSnapshots`, `managerInsights`, `historicalTrends` y `accountCoverageMetrics` en `src/data.ts`.
- Conectar datos al estado en `src/store.ts`.
- Agregar selectores basicos de analytics.

Criterios de salida:

- Hay datos de 4 a 5 agentes.
- Cada agente tiene status, ubicacion y metricas.
- Existen insights variados para coaching, riesgo, productividad y CRM.

### Fase 2 - Reporting como command center

Objetivo: reemplazar la vista simple de reporting por una estructura de manager.

Tareas:

- Actualizar `ReportingPage`.
- Crear `ManagerKpiStrip`.
- Crear tabs o segmented control.
- Mantener layout mobile-first y compatibilidad con bottom navigation.

Criterios de salida:

- `/reporting` muestra KPIs de equipo.
- La pantalla ya comunica que es una vista de manager.
- No se pierden metricas relevantes actuales; pueden integrarse como parte del overview.

### Fase 3 - Team map y agent status

Objetivo: cubrir visibilidad operacional en campo.

Tareas:

- Crear `TeamMapPanel` con Leaflet o mapa simplificado.
- Mostrar markers por agente.
- Aplicar colores por status:
  - Green: On schedule/productive.
  - Yellow: At risk/delayed.
  - Red: Missed visits/low completion.
  - Blue: Currently in customer meeting.
  - Gray: Offline/inactive.
- Crear `AgentStatusList`.
- Seleccionar agente desde marker o lista.

Criterios de salida:

- El manager puede ver agentes activos en mapa.
- El manager puede seleccionar un agente.
- El color del status es claro.

### Fase 4 - Drill-down individual

Objetivo: permitir analisis por agente.

Tareas:

- Crear `AgentDrillDownSheet`.
- Mostrar metricas individuales.
- Agregar activity timeline dummy.
- Agregar coaching suggestion relacionado.
- Permitir cerrar/cambiar agente seleccionado.

Criterios de salida:

- Al seleccionar agente, se abre detalle con metricas y actividad.
- El detalle muestra visitas, CRM, tareas, route efficiency y coaching.

### Fase 5 - Account coverage y task analytics

Objetivo: cubrir reportes de engagement y cumplimiento.

Tareas:

- Crear `AccountCoveragePanel`.
- Mostrar cuentas visitadas esta semana.
- Mostrar cuentas no visitadas en X dias.
- Mostrar risk score demo.
- Mostrar pipeline health.
- Agregar resumen de task completion y overdue activities.

Criterios de salida:

- El manager puede ver cobertura de cuentas.
- El manager puede identificar cuentas inactivas o en riesgo.
- Hay visibilidad de tareas vencidas y follow-up compliance.

### Fase 6 - Insights y tendencias

Objetivo: completar la parte de analytics y AI simulada.

Tareas:

- Crear `ManagerInsightsPanel`.
- Crear `PerformanceTrendPanel`.
- Mostrar recomendaciones accionables.
- Permitir descartar insights.
- Agregar mini tendencias daily/weekly/monthly con datos locales.

Criterios de salida:

- Hay recomendaciones tipo coaching y riesgo.
- Las tendencias historicas son visibles.
- No se requiere ninguna llamada externa.

### Fase 7 - Pulido y QA manual

Objetivo: preparar la feature para demo.

Tareas:

- Revisar 360px, 390px, 430px y desktop shell.
- Validar que tabs, panels y bottom sheets no choquen con bottom nav.
- Validar textos largos en cards y metric tiles.
- Ejecutar build solo en fase de implementacion futura, no en esta fase de plan.
- Preparar un guion de demo si se solicita.

Criterios de salida:

- La vista es densa pero legible.
- No hay overflow horizontal.
- Los indicadores visuales son consistentes.

## 12. Criterios de aceptacion

- AC1: Al abrir `/reporting`, el manager ve un command center con metricas de equipo.
- AC2: El dashboard muestra agentes activos con estados visuales.
- AC3: El manager puede seleccionar un agente y ver su drill-down.
- AC4: Cada agente muestra completion, CRM completion, visitas, tareas y route efficiency.
- AC5: El dashboard muestra task completion y overdue activity metrics.
- AC6: El dashboard muestra account coverage y cuentas en riesgo/inactivas.
- AC7: El dashboard muestra insights simulados de coaching, riesgo y productividad.
- AC8: El dashboard muestra tendencias historicas dummy.
- AC9: Todo funciona con datos locales sin APIs.
- AC10: La vista conserva una experiencia responsive compatible con la app actual.

## 13. Riesgos y mitigaciones

| Riesgo | Mitigacion |
| --- | --- |
| La vista se vuelve demasiado densa para mobile | Usar tabs, cards compactas y drill-down sheets |
| El usuario espera datos en tiempo real | Aclarar con datos dummy y simular estados "live" localmente |
| Leaflet dentro de Reporting aumenta complejidad | Reutilizar patrones de `MapView`; si se complica, usar mapa simplificado en MVP |
| AI parece real aunque es simulada | Mostrar insights deterministico-locales con razones visibles |
| Las metricas no se sienten coherentes | Definir snapshots por agente y calcular tasas desde esos mismos datos |
| Se mezcla reporting de agente con manager | Renombrar encabezado y reorganizar la pantalla como command center |

## 14. Orden recomendado de implementacion

1. Tipos y fixtures de manager.
2. Selectores y calculos de analytics.
3. `ReportingPage` con tabs y KPI strip.
4. Team map/lista de agentes.
5. Drill-down individual.
6. Account coverage y task analytics.
7. Insights y tendencias.
8. Pulido responsive.

## 15. Fuera de alcance para esta demo

- Tracking GPS real de empleados.
- Permisos/roles reales.
- Push notifications reales.
- Data warehouse.
- Integracion CRM/Salesforce real.
- AI analytics real.
- Route optimization real.
- Benchmarking regional real.
- Forecast intelligence real.

