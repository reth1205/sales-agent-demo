# Análisis del proyecto — sales-agent-demo

Fecha del análisis: 2026-08-22
Autor: Claude Code (a petición de René Trejo)
Propósito: documento de referencia para orientar las próximas decisiones de desarrollo — arquitectura actual, qué es mock y qué es real, qué falta del MVP, y cómo se ejecuta el trabajo futuro en este repo.

---

## 1. Resumen ejecutivo

`sales-agent-demo` es una app móvil-web para representantes de ventas de campo, construida en **SolidJS + Vite + TypeScript**, envuelta con **Capacitor** para iOS/Android. Simula el flujo completo de un vendedor: ver su mapa y próxima visita, iniciar una visita, hacer la entrevista, responder un cuestionario post-visita (manual o por voz), generar una actualización de CRM, y revisar reportes de progreso propio y de equipo (vista gerente).

Hoy el proyecto está en una **transición deliberada de demo 100% mock a producto con backend real**:

- El **frontend** (`src/`) es maduro y funcionalmente rico — es donde ha vivido casi todo el esfuerzo hasta ahora (18 commits recientes, la mayoría de UI/UX, notificaciones, mapa, cuestionario).
- El **backend** (`server/`, ASP.NET Core + Postgres) existe como **scaffolding vacío**: solo un endpoint `/health`. Ningún recurso real (login, cuentas, visitas) está implementado todavía.
- Existe un **pipeline de agentes** (`.claude/`) diseñado específicamente para construir ese backend y migrar el frontend hacia él pieza por pieza, pero **aún no se ha usado para ninguna feature real** (`docs/plans/` solo tiene la plantilla, ningún plan ejecutado).

La implicación práctica: cualquier cambio de "producto" (nueva pantalla, nuevo dato, nuevo flujo) hoy se hace 100% en el frontend contra datos mock (`src/data.ts`) y `localStorage`. Cualquier cambio que implique **login real, persistencia real, o integración con Salesforce/IA real** requiere primero construir esa pieza en `server/` vía el pipeline de agentes.

---

## 2. Stack tecnológico

### Frontend (`src/`)
- **SolidJS** (UI reactiva, sin virtual DOM) + `@solidjs/router`
- **Vite** (dev server / build)
- **TypeScript** estricto (`npm run test` = `tsc -b`, no hay test runner de UI)
- **Leaflet** + OpenStreetMap para el mapa
- **lucide-solid** para iconografía
- **Capacitor** (`@capacitor/core`, `push-notifications`, `local-notifications`, `speech-recognition`, `text-to-speech`) para el wrapper nativo iOS/Android
- Web Speech API (nativa del navegador) para voz en web

### Backend (`server/`)
- **ASP.NET Core** (.NET 10, minimal APIs) — `SalesAgent.Api`
- **Postgres** vía **Dapper** (SQL parametrizado, sin ORM) — `SalesAgent.Domain`
- **DbUp** para migraciones journaled — `SalesAgent.Database`
- **xUnit + Testcontainers.PostgreSql** para tests de repositorio con Postgres real; **Microsoft.AspNetCore.Mvc.Testing** para tests de endpoint
- Explícitamente "lean": sin Native-AOT, sin multi-tenancy/RLS, sin message bus (ver `server/README.md`)

### Infraestructura / despliegue
- `vercel.json` presente → el frontend se despliega a Vercel
- `docker-compose.local.yml` → Postgres local para desarrollo del backend
- `.github/workflows/deno.yml` es boilerplate obsoleto sin relación con el stack — ignorar

---

## 3. Arquitectura del frontend

### 3.1 Flujo de datos (capas)

```
src/data.ts        →  datos estáticos mock (cuentas, contactos, oportunidades, agentes, preguntas por defecto)
src/types.ts        →  todos los tipos de dominio (consultar primero antes de tocar store/selectors/services)
src/store.ts        →  única fuente de verdad: createStore(AppState) + objeto `actions` con todas las mutaciones
src/selectors.ts     →  queries derivadas de solo-lectura sobre `state` (mapa, cobertura, riesgo, etc.)
src/services.ts      →  funciones puras sin acceso a estado: geo/distancia, formato, voz, "interpretación" de respuestas
```

Los componentes importan `state`/`actions` directamente desde `./store` — no hay prop-drilling ni context providers (salvo `VisitContext`). Este es el patrón establecido del repo, no un antipatrón a corregir.

`src/store.ts` (1,326 líneas) es el archivo más grande y crítico del proyecto: contiene ~60 acciones que cubren sesión, ubicación, CRM, visitas, cuestionario, cola offline, notificaciones del asistente IA, simulación de mapa/geofencing, y reporting de gerente. Persiste slices seleccionados a `localStorage` bajo llaves `sales-demo-*`.

### 3.2 Estructura de UI

- `src/main.tsx` — registra rutas, monta `App` como raíz del router
- `src/App.tsx` — shell autenticado únicamente (phone-frame, bottom nav, toast, listeners de notificaciones móviles); **no contiene lógica de páginas** pese a que el `CLAUDE.md` histórico decía lo contrario — la lógica real vive en `src/views/*`
- `src/views/*.tsx` — un archivo por ruta: `LoginPage`, `DashboardPage`, `ClientsPage`, `SchedulePage`, `QuestionnairePage`, `ReportingPage`, `SettingsPage`
- `src/components/*.tsx` — 24 componentes de presentación/feature (mapa, stepper de cuestionario, panel de revisión, paneles de gerente, hojas de notificación, banners de simulación, etc.)
- `src/styles.css` — hoja global única, incluye el "phone shell" (`.app-frame`, `.phone-shell`, `.app-page`, `.bottom-nav`). Los overlays del mapa y el bottom nav usan posicionamiento absoluto contra este shell — **cualquier cambio de layout debe verificar** que el nav no tape controles y que el textarea del cuestionario siga alcanzable.

### 3.3 Rutas

| Ruta | Vista | Propósito |
|---|---|---|
| `/` | `LoginPage` | login (mock) |
| `/dashboard` | `DashboardPage` | mapa + próxima visita |
| `/clients` | `ClientsPage` | detalle CRM (cuentas, contactos, oportunidades, actividad) |
| `/schedule` | `SchedulePage` | lista de visitas y acciones de estado |
| `/visits/:visitId/questionnaire` | `QuestionnairePage` | entrevista post-visita, manual o voz |
| `/reporting` | `ReportingPage` | progreso propio, vistas de gerente/equipo, insights |
| `/settings` | `SettingsPage` | configuración de preguntas + modo offline |

### 3.4 Modelo de dominio (`src/types.ts`, 333 líneas)

Áreas cubiertas por los tipos, que reflejan directamente el alcance funcional actual:

- **CRM básico**: `Account`, `Contact`, `Opportunity`, `ActivityEvent`, `Task`
- **Visitas**: `ScheduledVisit` (con `VisitStatus`: Scheduled → InProgress → InterviewFinished → Questionnaire → Completed)
- **Cuestionario**: `InterviewQuestion`, `AnswerType`, `ReviewSummary`
- **Asistente IA (simulado)**: `AssistantNotification`, `PreMeetingBriefing`, `PostMeetingExtraction`, `ExtractionConfidence`, `VisitObjectiveAssessment`
- **Salesforce writeback (simulado)**: `SalesforceWritebackStatus`, `SalesforceWritebackStep`
- **KPIs de comportamiento**: `BehaviorKpiUpdate`
- **Mapa**: `MapPinType`, `NearbyRecommendation`, `MapDemoStep`
- **Vista de gerente**: `FieldAgent`, `AgentStatus`, `AgentPerformanceSnapshot`, `ManagerInsight`, `HistoricalTrendPoint`, `AccountCoverageMetric`, `TerritoryMetric`, `ReportingTab`

Este es un modelo notablemente más rico que lo que expone hoy `server/README.md` como plan mínimo — es decir, **el frontend ya modela mucho de lo que el backend eventualmente tendrá que servir**. Al diseñar cada nuevo recurso backend, este archivo es la especificación de facto del shape esperado.

---

## 4. Arquitectura del backend

`server/` sigue una separación clásica de 3 proyectos:

```
SalesAgent.Api/       composición — Program.cs, minimal API endpoints, OpenAPI
SalesAgent.Domain/    entities, models, repositories, services, validators (todo vacío salvo .gitkeep)
SalesAgent.Database/  runner DbUp + scripts/ de migración (vacío)
```

**Estado real verificado:** no hay ninguna entidad, repositorio, servicio, validador ni migración todavía — solo carpetas con `.gitkeep`. El único endpoint que existe es `/health`. Los tests (`HealthEndpointTests.cs`, `PostgresFixture.cs`) son scaffolding de arnés, no cobertura de features.

Convenciones ya fijadas (de `server/README.md` y `.claude/agents/rx-api-architect.md`):
- SQL siempre parametrizado vía Dapper, nunca concatenado
- Migraciones (`*.sql`) son territorio exclusivo de `rx-db-owner`, con aprobación humana explícita obligatoria antes de escribir cada archivo
- Validación vive en la capa de servicio, nunca en repositorios ni endpoints
- Sin multi-tenancy/RLS por ahora — una sola credencial de aplicación

El frontend consumirá esto vía módulos tipados en `src/api/` (uno por recurso) — ese directorio **todavía no existe**; lo crea `rx-ui-architect` cuando el primer recurso backend esté listo.

---

## 5. Qué es mock hoy y qué será real

| Área | Estado actual | Pasa a real cuando... |
|---|---|---|
| Login/sesión | flag booleano en `store.ts`, sin credenciales reales | exista el recurso de auth en `SalesAgent.Api` |
| Cuentas/contactos/oportunidades/actividad | estático en `src/data.ts` | exista el recurso Account/Contact/Opportunity en el backend |
| Persistencia de visitas, cuestionario, cola offline | `localStorage` (`sales-demo-*`) | exista persistencia real vía API |
| "IA" (briefings, extracción post-visita, sugerencias) | lógica determinística mock en `services.ts`/`store.ts` | se integre un LLM real desde el backend |
| Salesforce writeback | simulado con estados falsos (`pending`→`syncing`→`synced`) | exista integración real con Salesforce |
| Modo offline / sync | cola simulada en el slice `queue`, `syncQueue` en `store.ts` no habla con ninguna red real | se decida diseñar sync real (no hay indicio de que esto esté planeado a corto plazo) |

Regla operativa (ya documentada en el `CLAUDE.md` raíz): **antes de asumir que algo es mock o real, revisar `server/src/SalesAgent.Api/` para confirmar qué está efectivamente wireado.** Hoy la respuesta es "nada" — así que todo lo de arriba sigue siendo mock sin excepción.

---

## 6. Flujos principales de usuario

**Representante de campo:**
1. Login (mock, usuario fijo "Sofia Rivera")
2. Dashboard: mapa + próxima visita
3. Iniciar visita programada
4. Finalizar entrevista
5. Cuestionario disponible (manual o voz, comandos EN/ES)
6. Generar resumen de revisión (`interpretVisitAnswers` en `services.ts`)
7. Confirmar → aplica a CRM inmediatamente o encola si está offline
8. Reporting refleja progreso, tareas y estado de sync

**Gerente** (vía `/reporting`, tabs `overview`/`team`/`accounts`/`insights`):
- Mapa de equipo con todos los agentes
- Drill-down por representante (ruta, visitas, tareas, alertas)
- Insights automáticos (`ManagerInsight`: coaching/risk/productivity/coverage/crm)
- Métricas de cobertura de cuentas y tendencia histórica

---

## 7. El pipeline de agentes (`.claude/`) — cómo se construirá lo que falta

Ya existe un roster completo de 8 agentes + 3 orquestadores + 9 skills diseñado para construir el backend y migrar el frontend de forma controlada. Puntos clave para planear trabajo futuro:

- **Punto de entrada:** skill `feature` (`/feature`) — clasifica la solicitud, decide el carril (Direct / Slice / Full), entrevista vía `grilling`, escribe el plan en `docs/plans/YYYY-MM-DD-<AREA>-<slug>/plan.md`, despacha a los orquestadores correctos.
- **Carriles:** Direct (1 archivo, sin schema) · Slice (default, builder+auditor) · Full (schema nuevo, auth, integración externa, ≥2 recursos, superficie UI compartida nueva).
- **Reglas que nunca se saltan:** solo `rx-db-owner` toca `*.sql`, y siempre con aprobación humana explícita; tests pre-existentes son intocables salvo sanción explícita del architect; SQL siempre parametrizado; auditores siempre fresh-context y solo-lectura.
- **Estado real:** el pipeline está completamente armado pero **sin usar** — `docs/plans/` no tiene ningún plan ejecutado todavía, solo la plantilla. El primer uso real (probablemente login, según sugiere el propio `GUIA.md`) es lo que va a validar el pipeline end-to-end por primera vez.

Para trabajo futuro de backend o de superficie compartida de frontend (nuevo componente reusable, cambio de shape de `store.ts`, nuevo módulo `src/api/`), la vía correcta es pasar por `/feature`, no editar directamente — así lo especifica la guía del repo (`.claude/GUIA.md`).

---

## 8. Brecha frente al MVP deseado

`docs/MVP - Tareas.md` (traducción del PDF de requerimientos original) describe 35 capacidades objetivo. Cruzando ese documento contra el código actual:

**Ya implementado (aunque en mock):**
- Login, dashboard con mapa y próxima visita, semáforo de estado (riesgo/progreso), accesos cliente↔mapa, alertas de cuentas cercanas sin actividad (`NearbyRecommendationBanner`), briefing automático por cercanía (simulado), conversación post-reunión estructurada (cuestionario + voz), vista de gerente en mapa con drill-down, reporte gerencial con % completitud/cobertura/riesgo, gestión de tareas, ficha de cliente con contactos/oportunidades/actividad.

**Explícitamente NO implementado todavía (verificado por ausencia en el código):**
- **Vista "Mi día" con calendario real** — `SchedulePage` es una lista de visitas, no una vista de calendario; no hay integración de calendario en el repo.
- **Alta de prospectos fuera del CRM** — el propio PDF lo marca como fase posterior, no MVP. Sin rastro en el código.
- **Integración ERP** (balance, límite de crédito) — no existe ningún campo `balance`/`creditLimit` en `types.ts` ni `data.ts`.
- **Menú desplegable de clientes** con expandir/colapsar secciones — no confirmado en `ClientsPage`, revisar si vale la pena antes de asumir.
- **IA real** (Copilot/Gemini/LLM) para palabras clave y preguntas de seguimiento — hoy es lógica determinística mock (`services.ts`), no un modelo real.
- **Reglas de semáforo, metas diarias/semanales definidas** — el propio PDF las deja como "pendientes de definición"; el código tiene un mecanismo de progreso pero sin que conste que las reglas de umbral estén validadas con negocio.

Esta lista es el mejor punto de partida para priorizar el roadmap: la mayoría de lo pendiente no es "construir la UI" (ya existe la mayoría de las pantallas) sino **conectar IA real y backend real** a superficies que hoy ya simulan el comportamiento esperado.

---

## 9. Riesgos y deuda técnica conocida

- **No hay test runner de UI** — `npm run test` es solo `tsc -b`. Cualquier regresión de comportamiento (no de tipos) requiere prueba manual en navegador. Si un cambio futuro lo amerita, agregar un runner es una decisión de arquitectura a escalar al `rx-ui-architect`, no algo a improvisar.
- **`store.ts` es un archivo de 1,326 líneas y punto de contención único** — toda mutación de estado pasa por ahí. Cambios de shape deben pasar por `rx-ui-architect` (así lo exige la convención del pipeline) para evitar colisiones de diseño.
- **El layout del "phone shell" es frágil ante cambios de overflow/scroll** — overlays de mapa y bottom nav dependen de posicionamiento absoluto; ya hubo al menos un ciclo de corrección específico para que el textarea del cuestionario no quedara tapado (ver commits recientes "actualizacion de cuestionario", "correccion de notificaciones").
- **Docker/Postgres local no fue verificado end-to-end** según el propio `GUIA.md` — antes de empezar a construir el primer recurso backend real, vale la pena confirmar que `docker compose -f server/docker-compose.local.yml up -d` funciona en esta máquina.
- **El modo offline es enteramente simulado** — no hay una capa de red real detrás de `queue`/`syncQueue`; si el producto necesita sync real eventualmente, es un diseño nuevo, no una extensión trivial de lo existente.
- **Sin multi-tenancy** en el backend por diseño explícito — si en algún momento se necesita aislar múltiples organizaciones de venta (no cuentas CRM), es una decisión de arquitectura a escalar primero, no un default.

---

## 10. Recomendaciones para los próximos cambios

1. **Antes de tocar `src/store.ts` o crear un componente compartido nuevo**, pasar por `/feature` (carril mínimo Slice) en vez de editar directo — es la convención ya establecida en este repo, no una sugerencia externa.
2. **El primer trabajo de backend real debería ser login/auth**, porque casi todo lo demás (persistencia de cuentas, visitas, writeback) depende de tener una sesión real que sustituya el flag booleano actual.
3. **Usar `types.ts` como contrato de referencia** al diseñar cada recurso backend — el frontend ya tiene el shape de dominio pensado; el trabajo del `rx-api-architect` es mapear eso a entidades Postgres, no re-diseñarlo desde cero.
4. **Verificar Docker/Postgres local antes de la primera migración real** — es un paso barato que evita descubrir el problema a mitad de un `/feature` en carril Full.
5. **Tratar `docs/MVP - Tareas.md` §"Pendientes de definición"** (reglas de semáforo, metas diarias/semanales, alcance exacto de datos de Salesforce/ERP) como preguntas de negocio a resolver con el usuario/stakeholder antes de que un plan de `/feature` las dé por sentado — son decisiones de producto, no técnicas.
6. **Cualquier feature que toque IA real** (briefings, extracción, keywords) debe decidir explícitamente qué proveedor/modelo se usa antes de escribir el Feature Brief — hoy no hay ninguna integración LLM real en el repo, todo es lógica mock.

---

## Apéndice — mapa de archivos clave

| Archivo | Rol |
|---|---|
| [src/store.ts](../src/store.ts) | estado + todas las acciones |
| [src/types.ts](../src/types.ts) | contrato de dominio completo |
| [src/selectors.ts](../src/selectors.ts) | queries derivadas |
| [src/services.ts](../src/services.ts) | lógica pura (geo, voz, interpretación mock) |
| [src/data.ts](../src/data.ts) | datos mock |
| [src/App.tsx](../src/App.tsx) | shell autenticado (no lógica de página) |
| [src/views/](../src/views/) | una vista por ruta |
| [src/components/](../src/components/) | componentes de presentación/feature |
| [server/README.md](../server/README.md) | referencia completa de comandos/convenciones backend |
| [.claude/GUIA.md](../.claude/GUIA.md) | cómo usar el pipeline de agentes para trabajo futuro |
| [docs/MVP - Tareas.md](../docs/MVP%20-%20Tareas.md) | requerimientos originales de negocio, traducidos |
| [docs/plans/](../docs/plans/) | historial de features ejecutadas vía `/feature` (vacío por ahora) |
