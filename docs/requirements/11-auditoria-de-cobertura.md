# RQ-11 — Auditoría de cobertura: requerimientos vs. implementación

Fecha: 2026-08-22
Alcance: los 96 requerimientos funcionales (`RF-XX`) de los documentos 01–10 de esta carpeta, verificados contra el código real de `src/` (grep + lectura directa, no solo contra las secciones "Estado actual en el demo" ya escritas en cada documento — varias de ellas se corrigen aquí con evidencia nueva).

## Leyenda

| Símbolo | Significado |
|---|---|
| ✅ | Implementado en el demo con fidelidad razonable al requerimiento (aunque sea con datos/lógica mock) |
| 🟡 | Implementado parcialmente, con desviación respecto al requerimiento, o no verificable con certeza desde el código |
| ❌ | Ausente del código — no hay ningún rastro de la funcionalidad |

Esto audita **fidelidad de comportamiento**, no si algo "debería" ser mock o real — eso ya lo cubre cada documento de módulo. Un ✅ aquí puede seguir siendo 100% mock.

## Resumen ejecutivo

| Métrica | Valor |
|---|---|
| Total RF auditados | 96 |
| ✅ Implementado | 46 (48%) |
| 🟡 Parcial / no verificable | 19 (20%) |
| ❌ No implementado | 31 (32%) |

**Los 3 hallazgos que más vale la pena no dejar pasar:**

1. **El Agent Performance Scorecard del gerente (RF-MGR-11) no usa la fórmula que pide el requerimiento.** El código (`calculateCompositePerformanceScore`, [`services.ts:74-84`](../../src/services.ts#L74)) pondera `completionPercent*0.3 + crmCompletionRate*0.25 + routeEfficiency*0.2 + taskCompletion*0.15 + scheduleAdherence*0.1`. El requerimiento de negocio pide `Visit completion 25% + CRM updates 20% + Opportunity movement 25% + Task completion 15% + Customer coverage 15%`. Son **dimensiones distintas y pesos distintos** — si este número ya se usa para conversaciones de coaching con el equipo, hoy no está midiendo lo que el negocio especificó.
2. **RQ-06 (entrevista por IA) tiene 15 de 17 requerimientos en ❌ absoluto** — es, correctamente, la brecha más grande del proyecto (es un requerimiento nuevo, no una regresión). Pero dos piezas de infraestructura ya existen y son directamente reutilizables: el evaluador de 3 estados (`evaluateVisitObjectives`, ver hallazgo de RQ-06 abajo) y el reconocimiento de comandos de voz de la navegación del cuestionario — ver §RQ-06.
3. **El mapa no tiene ubicación en tiempo real (RF-MAP-07)** — `requestBrowserLocation` usa `navigator.geolocation.getCurrentPosition` (una sola lectura), no `watchPosition`. La posición del agente en el mapa no se actualiza continuamente salvo por las simulaciones de demo (`animateMapDemoStep`); en uso real (permiso otorgado, sin demo activa), el pin del usuario queda estático tras la primera lectura.

## RQ-01 — Navegación y autenticación (8 RF: 7 ✅ · 1 🟡 · 0 ❌)

| RF | Estado | Evidencia / nota |
|---|---|---|
| NAV-01 | ✅ | `<Show when={isAuthenticated \|\| isLogin()} fallback={<Navigate href="/" />}>` en `App.tsx:67` |
| NAV-02 | ✅ | Login navega a `/dashboard` |
| NAV-03 | ✅ | `MapView` en `DashboardPage` |
| NAV-04 | ✅ | `data.ts` precargado en `crm` slice |
| NAV-05 | ✅ | `BottomNavigation.tsx` — 4 secciones fijas |
| NAV-06 | ✅ | Router persiste sesión entre rutas |
| NAV-07 | 🟡 | Se resuelve con `useDemoLocation` (fallback funcional), no con un mensaje de error explícito — cumple el espíritu, no la letra |
| NAV-08 | ✅ | `logout()` en `store.ts:428` |

## RQ-02 — Mapa y descubrimiento de cuentas (9 RF: 8 ✅ · 1 🟡 · 0 ❌)

| RF | Estado | Evidencia / nota |
|---|---|---|
| MAP-01 | ✅ | `getMapPinType` (`selectors.ts:46-57`) implementa los 5 tipos exactos de la fuente |
| MAP-02 | ✅ | `CustomerMapSummarySheet.tsx` |
| MAP-03 | ✅ | Distancia/ETA en `getNearbyAccounts`/servicios de formato |
| MAP-04 | ✅ | `NearbyRecommendation` con las 5 razones (`highValue`/`overdueTask`/`inactiveAccount`/`scheduleGap`/`risk`) coinciden con `types.ts` |
| MAP-05 | ✅ | `dismissRecommendation` en `store.ts` |
| MAP-06 | ✅ | `openNavigation` en `store.ts` |
| MAP-07 | 🟡 | **Hallazgo**: `requestBrowserLocation` usa `getCurrentPosition` (lectura única), no `watchPosition` — no hay actualización continua real, solo simulada por demo |
| MAP-08 | ✅ | `checkGeofences` (Haversine) |
| MAP-09 | ✅ | Fallback a `useDemoLocation` si `navigator.geolocation` no existe o el permiso es denegado |

## RQ-03 — CRM: cuentas, contactos, oportunidades, tareas (8 RF: 6 ✅ · 1 🟡 · 1 ❌)

| RF | Estado | Evidencia / nota |
|---|---|---|
| CRM-01 | ✅ | `ClientsPage.tsx` renderiza ficha completa |
| CRM-02 | ✅ | `Contact` en `types.ts`/`data.ts` |
| CRM-03 | ✅ | `Opportunity` |
| CRM-04 | ✅ | `ActivityEvent` |
| CRM-05 | ✅ | `Task` |
| CRM-06 | ❌ | **Confirmado por grep**: no hay ningún patrón de expandir/colapsar (`expand`/`collapse`/`isOpen`) en `ClientsPage.tsx` — la ficha se muestra plana |
| CRM-07 | ✅ | `CustomerMapSummarySheet.tsx:39-40` — `selectClient` + `navigate('/clients')` |
| CRM-08 | 🟡 | Solo 1 de los 3 orígenes de actividad tiene análogo (confirmar visita → nota/tarea vía cuestionario); no hay integración de calendario CRM ni creación de cita en-app que empuje actividad |

## RQ-04 — Ciclo de vida de visitas y agenda (8 RF: 3 ✅ · 3 🟡 · 2 ❌)

| RF | Estado | Evidencia / nota |
|---|---|---|
| VIS-01 | ✅ | Máquina de estados de 5 pasos en `types.ts`/`store.ts` |
| VIS-02 | ✅ | `startVisit` + `checkGeofences` |
| VIS-03 | ✅ | `finishInterview` |
| VIS-04 | ❌ | Sin vista de calendario — `SchedulePage.tsx` es lista plana |
| VIS-05 | 🟡 | Cubierto parcialmente por `RouteSimulationBanner`/`MapDemoControls`, solo en modo simulación, no como vista permanente |
| VIS-06 | 🟡 | Navegación entre secciones existe, pero no confirmada como "integración" real (ej. tareas no cross-linkeadas desde agenda) |
| VIS-07 | ❌ | Sin integración de calendario externo/CRM |
| VIS-08 | 🟡 | Aproximado por simulación de ruta, no un "modo conducción" dedicado |

## RQ-05 — Asistente IA: briefing y debrief por voz (14 RF: 5 ✅ · 4 🟡 · 5 ❌)

| RF | Estado | Evidencia / nota |
|---|---|---|
| IA-01 | ✅ | Timer de proximidad (`triggerArrivalBriefing`/`triggerDestinationEta`), comprimido en demo |
| IA-02 | 🟡 | Toast/tarjeta sí; TTS (`speakText`) existe pero no confirmado cableado a los 4 canales completos |
| IA-03 | 🟡 | `PreMeetingBriefing` en `types.ts` cubre la mayoría de los 6 campos; contenido es texto plantilla, no las 6 secciones estructuradas explícitas |
| IA-04 | ❌ | Sin controles de pausar/repetir/deshabilitar/configurar distancia — no encontrados en el código |
| IA-05 | ❌ | Sin lógica de priorización explícita del contenido (orden fijo de plantilla, no ponderado) |
| IA-06 | 🟡 | Tono mock razonable, no verificable contra el estándar de calidad del requerimiento |
| IA-07 | ✅ | `triggerPostMeetingDebrief` + timer/geofence-exit |
| IA-08 | ✅ | **Hallazgo positivo**: `QuestionCategory` (`types.ts:8`) = `'meeting'\|'opportunity'\|'account'\|'followUp'` — coincide casi exactamente con los 4 bloques de negocio (Event/Opportunity/Account/Follow-Up) |
| IA-09 | ❌ | `interpretVisitAnswers` es reglas/keywords sobre respuestas a preguntas fijas, no NLP de conversación libre |
| IA-10 | ✅ | `ReviewPanel.tsx` — edición antes de confirmar |
| IA-11 | ❌ | No hay mecanismo de "una pregunta de seguimiento dirigida" ante información incompleta |
| IA-12 | 🟡 | `evaluateVisitObjectives` (`services.ts:329-355`) ya implementa un checklist de **3 estados** (`met`/`partial`/`missed`) por objetivo — más rico que el "4 categorías fijas rojo/verde" del requerimiento original, pero no confirmado que cubra exactamente Tasks/Opportunities/Schedule/Notes |
| IA-13 | ✅ | Cola offline simulada (`queue` slice) |
| IA-14 | ❌ | **Confirmado por grep**: sin UI de adjuntar capturas/attachments en `ReviewPanel.tsx` — el campo `attachments: string[]` existe en `types.ts` pero no hay forma de poblarlo desde la UI |

## RQ-06 — Entrevista post-visita por IA conversacional (17 RF: 0 ✅ · 2 🟡 · 15 ❌)

Es un requerimiento nuevo (confirmado 2026-08-22 vía `docs/Script.docx`) que reemplaza al cuestionario estructurado — el ❌ generalizado es el estado esperado, no una regresión. Lo único que vale la pena rescatar para no "reinventar la rueda" al planear la migración:

| RF | Estado | Evidencia / nota |
|---|---|---|
| ENT-01 a ENT-09 | ❌ | Sin rastro — configuración de admin, módulos de datos, fuentes externas, Call Objectives: nada existe |
| ENT-10, ENT-11 | ❌ | Sin Q&A interactivo ni comando de voz "End briefing" |
| ENT-12 | ❌ | Sin invocación on-demand por voz ("Hey AISA...") |
| ENT-13, ENT-14 | ❌ | Sin generación dinámica de preguntas ni mapeo inmediato conversación→CRM |
| ENT-15 | 🟡 | **Infraestructura reutilizable ya existe**: `evaluateVisitObjectives`/`VisitObjectiveAssessment` (ver RQ-05 IA-12) ya modela exactamente el patrón de 3 estados por objetivo que pide este requerimiento — falta generalizarlo a Call Objectives dinámicos y darle la UI de "color wheel/checkmark" en tiempo real que pide el guion |
| ENT-16 | 🟡 | El patrón de comandos de voz para cerrar un flujo ya existe (`finish`/`finalizar`/`generar revision` en `QuestionnaireStepper`) — reutilizable como base para "Log the call", falta el comando específico y la confirmación hablada de cierre |
| ENT-17 | ❌ | Sin mecanismo de módulos configurables |

## RQ-07 — Gamificación y progreso diario (8 RF: 4 ✅ · 1 🟡 · 3 ❌)

| RF | Estado | Evidencia / nota |
|---|---|---|
| GAM-01 | ✅ | `initialProgress = { percent: 0, ... }` |
| GAM-02 | ✅ | **Confirmado exacto**: `addProgress(10)` inicio visita, `+20` primera revisión confirmada, `+15` oportunidad, `+10` tareas, `+5` adjuntos (`store.ts:964,1046,1113-1115`) — coincide con la tabla de negocio punto por punto |
| GAM-03 | ✅ | **Confirmado exacto**: milestones 25/50/75/100% con el mismo texto literal (`store.ts:343-347`) |
| GAM-04 | ❌ | **Confirmado por grep**: todos los toasts de `store.ts` son mensajes operativos ("Saved to pending sync queue.", "CRM updated successfully."), ninguno tiene el tono motivacional específico del requerimiento |
| GAM-05 | ❌ | Sin sugerencias de "próxima acción para subir %" |
| GAM-06 | ❌ | **Confirmado por grep**: `streakDays` es un número estático en `data.ts`, sin ninguna lógica de incremento/reset — no es una feature funcionando, es un valor de adorno |
| GAM-07 | ✅ | Persistido en `localStorage` (`sales-demo-*`) |
| GAM-08 | 🟡 | El refuerzo visual en mapa existe pero usa el esquema de color de RQ-02 (por tipo de cuenta), no un esquema dedicado de "pendiente→en progreso→completado"; indicador circular junto al perfil no confirmado |

## RQ-08 — Manager Command Center y reporting (12 RF: 6 ✅ · 4 🟡 · 2 ❌)

| RF | Estado | Evidencia / nota |
|---|---|---|
| MGR-01 | ✅ | `TeamMapPanel.tsx` + `AgentStatus` (5 estados) |
| MGR-02 | ✅ | `AgentDrillDownSheet.tsx` |
| MGR-03 | ✅ | `ManagerKpiStrip.tsx` |
| MGR-04 | ✅ | Campos de `AgentDrillDownSheet.tsx:42-43` (`crmCompletionRate`, `routeEfficiency`, etc.) coinciden con el detalle pedido |
| MGR-05 | 🟡 | Monitoreo de tareas parcial; adherencia SLA no confirmada como métrica explícita |
| MGR-06 | ✅ | `AccountCoveragePanel.tsx` + `AccountCoverageMetric` |
| MGR-07 | ✅ | `ManagerInsightsPanel.tsx` + `ManagerInsight.category` (coaching/risk/productivity/coverage/crm) |
| MGR-08 | 🟡 | `PerformanceTrendPanel.tsx` + `HistoricalTrendPoint` dan tendencia, pero no confirmado el toggle diario/semanal/mensual explícito |
| MGR-09 | ❌ | `ManagerInsight` es un panel pasivo de lectura, no hay notificaciones push/toast dirigidas al gerente |
| MGR-10 | ❌ | **Confirmado por grep**: no existe ninguna superficie de UI para que el gerente *redacte* un mensaje/nota hacia el representante — solo se documenta (en otros módulos) cómo se recibiría, nunca cómo se envía |
| MGR-11 | 🟡 | **Hallazgo — ver Resumen ejecutivo #1**: `calculateCompositePerformanceScore` usa una fórmula y pesos distintos a los especificados por el requerimiento |
| MGR-12 | 🟡 | Zoom de mapa genérico (Leaflet) existe; "zoom a agente individual + ver su ruta del día" no confirmado como interacción dedicada |

## RQ-09 — Salesforce writeback, sincronización y modo offline (7 RF: 4 ✅ · 1 🟡 · 2 ❌)

| RF | Estado | Evidencia / nota |
|---|---|---|
| SYN-01 | ✅ | `confirmReview`/`applyReview` aplican inmediato si no offline |
| SYN-02 | ✅ | Cola local si `toggleOfflineMode` activo |
| SYN-03 | ✅ | `syncQueue` action |
| SYN-04 | ✅ | `SalesforceWritebackStatus.steps` modela los 5 pasos |
| SYN-05 | 🟡 | `status: 'retry'` existe en el tipo, lógica de reintento real no confirmada |
| SYN-06 | ❌ | Sin worker async — no aplica todavía porque no hay pipeline de audio real |
| SYN-07 | ❌ | Sin umbral de confianza NLP — no aplica todavía por la misma razón |

## RQ-10 — Notificaciones y empaquetado móvil (5 RF: 3 ✅ · 1 🟡 · 1 ❌)

| RF | Estado | Evidencia / nota |
|---|---|---|
| NOT-01 | 🟡 | No se confirmó una preferencia de usuario explícita "texto vs. in-app" — existe el toggle de modo offline, no el de canal de notificación |
| NOT-02 | ✅ | `mobileNotifications.ts` reusa el toast in-app en foreground |
| NOT-03 | ✅ | Enrutamiento por `data.route`/`data.href` |
| NOT-04 | ✅ | Registro de dispositivo + token expuesto para backend |
| NOT-05 | ❌ | No hay backend (`SalesAgent.Api` es solo `/health`) que pueda disparar nada — confirmado en `docs/ANALISIS-PROYECTO.md` |

## Qué hacer con esto

- **Antes de cualquier `/feature` de backend que dependa de un número "ya validado" en el frontend** (en particular el Agent Performance Scorecard de RQ-08), confirmar con negocio si la fórmula real del código o la del requerimiento formal es la que se quiere migrar — no asumir que el código actual es la especificación correcta solo porque ya corre.
- **RQ-07 (gamificación) tiene la brecha más barata de cerrar de todo el proyecto**: GAM-04/05/06 son lógica de frontend pura (sin backend), y el modelo de datos ya existe (`Agent.streakDays`, milestones) — candidato natural a una tarea Slice corta si se quiere mostrar avance rápido sin tocar el backend.
- **RQ-06 no es una lista de pendientes plana** — ENT-15 y ENT-16 tienen puntos de partida reales en el código (`evaluateVisitObjectives`, comandos de voz del stepper). Vale la pena que el Feature Brief de `rx-ui-architect` referencie esas dos piezas explícitamente para no reconstruirlas desde cero.
- **RF-MAP-07 (ubicación en tiempo real)** es un gap silencioso — nada en la demo lo expone visualmente como roto porque las simulaciones de demo lo enmascaran. Vale la pena una nota explícita en cualquier plan que toque geolocalización real.
