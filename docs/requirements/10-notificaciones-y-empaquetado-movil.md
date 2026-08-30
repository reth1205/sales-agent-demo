# RQ-10 — Notificaciones y empaquetado móvil

**Estado en el demo:** Notificaciones in-app implementadas; puente nativo de Capacitor ya wireado para push, pendiente de backend real que lo alimente.
**Código relacionado:** [`src/mobileNotifications.ts`](../../src/mobileNotifications.ts), [`src/App.tsx`](../../src/App.tsx) (listeners), [`src/components/AssistantNotificationSheet.tsx`](../../src/components/AssistantNotificationSheet.tsx), [`src/components/AssistantTopNotification.tsx`](../../src/components/AssistantTopNotification.tsx), `capacitor.config.ts`, `android/`, `ios/`.
**Fuentes de negocio:** `docs/capacitor-mobile.md` (estado real de implementación, no requerimiento de negocio nuevo), `docs/mobile-dashboard-migration-plan.md` (recomendación de arquitectura móvil de largo plazo), `docs/MVP - Mockup.pdf` (nota transversal: *"Notifications: user configurable in admin settings, text or in-app."*).

## 1. Resumen

Cubre dos cosas relacionadas pero distintas: (a) el sistema de notificaciones (push nativo + in-app) que dispara los avisos de proximidad/briefing/debrief/mensajes de gerente de los demás módulos, y (b) el empaquetado de la app web como binario instalable iOS/Android vía Capacitor, y la decisión de si esa es la arquitectura móvil de largo plazo.

## 2. Requerimientos funcionales — Notificaciones

- **RF-NOT-01**: Las notificaciones deben ser configurables por el usuario (texto o in-app), según admin settings.
- **RF-NOT-02**: En foreground, las notificaciones deben mostrarse con la capa de toast in-app existente (no depender solo del centro de notificaciones del SO).
- **RF-NOT-03**: Al tocar una notificación, la app debe poder enrutar a una pantalla específica si el payload lo indica (ej. `data.route`).
- **RF-NOT-04**: El dispositivo debe registrarse contra push nativo (APNs en iOS, FCM en Android) y el token debe quedar disponible para que el backend lo asocie al usuario autenticado.
- **RF-NOT-05**: El backend debe poder disparar notificaciones para: llegada/visita, ruta, debrief, sincronización CRM (uniendo los disparadores de RQ-02/04/05/09 con este canal de entrega).

## 3. Reglas de negocio

- Las notificaciones son el mecanismo de entrega para: llegada al geofence (RQ-02/04), briefing pre-visita y debrief post-visita (RQ-05), mensajes de gerente convertidos en tarea (RQ-08), estado de sincronización CRM (RQ-09).
- El backend es responsable de: almacenar el token de push contra el usuario autenticado, enviar las notificaciones, rotar/eliminar tokens obsoletos. *Fuente: `docs/capacitor-mobile.md`, sección "Responsabilidad del backend".*

## 4. Datos y entidades involucradas

`AssistantNotification` (tipo, `visitId`, `accountId`, `triggerReason`, `status`) — comparte modelo con RQ-05. Token de dispositivo (no modelado aún en `types.ts` del frontend — vive en el puente nativo).

## 5. Estado actual en el demo

- **`src/mobileNotifications.ts` ya implementa** el puente completo hacia `@capacitor/push-notifications` y `@capacitor/local-notifications`: detecta si corre dentro de Capacitor, solicita permiso, registra el dispositivo, guarda/expone el token, maneja notificaciones en foreground reusando el toast in-app existente, y soporta enrutamiento por `data.route`/`data.href` del payload — es un shim "no-op-safe" en web (`Capacitor.isNativePlatform()`), por lo que en el navegador simplemente no hace nada dañino.
- **No hay backend que envíe push real** — hoy nada llama a APNs/FCM desde ningún servidor; los "avisos" que el usuario ve en el demo web son 100% notificaciones in-app/toast disparadas localmente por `store.ts`, no push real.
- Setup nativo ya documentado y presente en el repo: Android requiere `google-services.json` (Firebase) en `android/app/`; iOS requiere Xcode + Apple Developer team + capability de Push Notifications + callbacks APNs ya en `AppDelegate.swift`.
- El empaquetado Capacitor (`npm run mobile:sync`, `cap:open:android`/`cap:open:ios`) está operativo y es la vía actual de build a dispositivo — commits recientes ("actualizacion ios, android", "correccion de notificaciones", "correccion de build") muestran que este canal ha tenido mantenimiento activo reciente.

## 6. Requerimientos no funcionales

- Rotación/limpieza de tokens de dispositivo obsoletos.
- Soporte Android e iOS simultáneo (FCM + APNs, o un proveedor que cubra ambos).

## 7. Fuera de alcance de este módulo

- El contenido/lógica de negocio de cada notificación (vive en el módulo que la origina: RQ-02, RQ-04, RQ-05, RQ-08, RQ-09).

## 8. Preguntas abiertas / decisiones pendientes — la más importante de todo el set de documentos

- **¿Capacitor se mantiene como arquitectura móvil de producción, o se migra a React Native + Expo?** `docs/mobile-dashboard-migration-plan.md` recomienda explícitamente React Native+Expo como "long-term fit" (alto en cada eje: ubicación/geofencing en background, notificaciones nativas, storage offline, permisos nativos), documentando Capacitor únicamente como opción válida de "prototipo instalable rápido reusando la UI web actual", con ajuste medio en background-location/permisos avanzados frente a React Native. **Este repo ya invirtió en Capacitor** (proyectos `android/`/`ios/` activos, mantenimiento reciente) — la recomendación del documento de migración **contradice la dirección ya tomada en el código**. Esta discrepancia debe resolverse explícitamente con el negocio/arquitectura antes de invertir más en geofencing nativo en background o en push real de producción: continuar profundizando en Capacitor, o iniciar una migración a React Native+Expo aprovechando lo reutilizable de `src/types.ts`/`src/data.ts`/`src/services.ts` (explícitamente listado como reutilizable en el propio plan de migración) y descartando la capa de UI Solid/CSS/Leaflet (explícitamente listada como no reutilizable).
- Definir qué proveedor de backend push (servicio propio sobre FCM/APNs directo, o un intermediario tipo OneSignal/Firebase Cloud Messaging gestionado) usará `SalesAgent.Api`.
