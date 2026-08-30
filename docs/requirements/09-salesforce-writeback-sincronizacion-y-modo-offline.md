# RQ-09 — Salesforce writeback, sincronización y modo offline

**Estado en el demo:** Enteramente simulado — no existe ninguna conexión de red real detrás de este módulo.
**Código relacionado:** slice `queue` y `assistant.writebacks` en `store.ts`, acción `syncQueue` ([store.ts:1143](../../src/store.ts#L1143)), toggle `toggleOfflineMode`, tipos `OfflineQueueItem`/`SalesforceWritebackStatus`/`SalesforceWritebackStep` en `types.ts`, [`src/views/SettingsPage.tsx`](../../src/views/SettingsPage.tsx) (toggle de modo offline).
**Fuentes de negocio:** `docs/AI Assisted Customer Visit Registration.pdf` (FR de offline queue), `docs/MVP - Manager View.pdf` (#1, notas de arquitectura de pipeline de voz), `docs/mobile-dashboard-migration-plan.md` (reglas de arquitectura backend-first para writeback).

## 1. Resumen

Cubre cómo los datos capturados en campo (revisión de visita, extracción de debrief) se escriben de vuelta al CRM (Salesforce), y qué pasa cuando no hay conectividad al momento de la captura.

## 2. Requerimientos funcionales

- **RF-SYN-01**: Si hay conectividad al confirmar una revisión de visita, los cambios se aplican inmediatamente al CRM.
- **RF-SYN-02**: Si no hay conectividad (o el modo offline está activo), los cambios se encolan localmente para sincronización posterior, sin pérdida de datos ni bloqueo del flujo del usuario.
- **RF-SYN-03**: Debe existir una acción explícita o automática de sincronización de la cola cuando se recupera conectividad.
- **RF-SYN-04**: El writeback a Salesforce debe reportar estado por pasos — al menos: account, opportunity, tasks, calendar, kpi — cada uno con estado propio (`pending`/`syncing`/`synced`/`error`).
- **RF-SYN-05**: Un writeback fallido debe soportar reintento (`status: 'retry'`), no solo éxito/error binario.
- **RF-SYN-06**: El pipeline de audio/voz (cuando se implemente la captura real de RQ-05) debe procesarse en un worker asíncrono de cola (no bloqueante en el hilo principal de la app), dado el volumen y la naturaleza intermitente de datos celulares en campo. *Fuente: nota de Dev en `MVP - Manager View.pdf` #1 — sugiere cola async (ej. AWS SQS) + Whisper API como referencia de patrón, no como decisión de proveedor.*
- **RF-SYN-07**: Debe existir un umbral de confianza NLP (sugerido: 85%) bajo el cual el sistema fuerza una notificación de "Review & Confirm" antes de escribir al CRM, en vez de escribir automáticamente.

## 3. Reglas de negocio

- **Regla de arquitectura no-negociable**: todo writeback a Salesforce/CRM pasa por el backend — nunca se escribe directamente desde el cliente móvil, con logs de auditoría y semántica de reintento. *Fuente: `docs/mobile-dashboard-migration-plan.md`, consistente con la regla equivalente de RQ-05 sobre el modelo de IA.*
- El writeback nunca ocurre sin que el usuario haya confirmado el resumen de revisión (comparte esta regla con RQ-06 RF-CUE-07/08).
- Sincronización a Salesforce debe apuntar a >99% de confiabilidad (no-funcional, de `AI Assisted Customer Visit Registration.pdf`).

## 4. Datos y entidades involucradas

`OfflineQueueItem` (`createdAt`, `visitId`, `summary: ReviewSummary`), `SalesforceWritebackStatus` (`status`, `steps: SalesforceWritebackStep[]`, `errorMessage`), `SalesforceWritebackStep` (`id: 'account'|'opportunity'|'tasks'|'calendar'|'kpi'`, `status`).

## 5. Estado actual en el demo

- El modelo de datos de writeback (`SalesforceWritebackStatus`/`Step`) ya está definido en `types.ts` con exactamente los 5 pasos esperados, y hay simulación de estados (`pending`→`syncing`→`synced`) — es fidelidad de modelo, no de integración real.
- **No existe ninguna conexión real a Salesforce** — todo el "CRM" es `data.ts` en memoria/`localStorage`. No hay API de Salesforce, no hay autenticación OAuth contra un org de Salesforce, no hay mapeo real de objetos.
- La cola offline (`queue` slice, `syncQueue`) es simulada con `localStorage` — no hay una capa de red real detrás; "sincronizar" en el demo es una operación local instantánea, no una llamada de red con reintentos reales.
- El toggle de "modo offline" en Settings es manual (el usuario simula estar offline), no una detección real de conectividad de red.
- No hay ningún worker de cola async de audio, ni umbral de confianza NLP real (RF-SYN-06/07) — dependen enteramente de que RQ-05 tenga una integración de voz/IA real primero.

## 6. Requerimientos no funcionales

- Confiabilidad de sincronización >99%.
- Auditabilidad de cada escritura (quién, cuándo, qué cambió) — implícito en "logs de auditoría" de la regla de arquitectura backend-first.

## 7. Fuera de alcance de este módulo

- El contenido/origen de lo que se sincroniza (RQ-06 para el resumen de revisión, RQ-05 para la extracción de voz).

## 8. Preguntas abiertas / decisiones pendientes

- **¿Integración directa con Salesforce API (REST/Bulk API, OAuth) o vía una capa intermedia propia (Postgres como sistema de registro con sync periódica a Salesforce)?** Decisión de arquitectura central — condiciona todo el diseño de `SalesAgent.Domain` para este módulo. Depende directamente de la decisión equivalente en RQ-03.
- **Proveedor real de cola/worker asíncrono** para el pipeline de audio (si se implementa voz real) — la fuente solo sugiere un patrón (AWS SQS + Whisper), no es una decisión tomada para este stack (que hoy es ASP.NET Core + Postgres, sin AWS).
- Definir semántica exacta de conflicto: ¿qué pasa si el mismo campo de una cuenta cambió en Salesforce y en la cola local mientras el dispositivo estaba offline? No hay ninguna mención de resolución de conflictos en las fuentes de negocio — es una decisión técnica que el equipo de backend deberá proponer y validar con negocio.
