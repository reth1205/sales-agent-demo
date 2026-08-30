# RQ-01 — Navegación y autenticación

**Estado en el demo:** Implementado como mock (sin credenciales reales) — comportamiento de navegación y layout considerado maduro.
**Código relacionado:** [`src/views/LoginPage.tsx`](../../src/views/LoginPage.tsx), [`src/App.tsx`](../../src/App.tsx), [`src/components/BottomNavigation.tsx`](../../src/components/BottomNavigation.tsx), [`src/main.tsx`](../../src/main.tsx), acciones `login`/`logout` en `store.ts`.
**Fuentes de negocio:** `docs/Main App _ Navigation.pdf` (documento formal, FR/AC), `.claude/requirenment/solidjs-demo-execution-plan.md`.

## 1. Resumen

Épica origen (`Main App _ Navigation.pdf`): *"As a sales agent, I want to access a mobile platform that shows my current location and CRM-related information on a map so that I can efficiently manage customer visits, schedules, and sales activities during my workday."* Este módulo cubre el acceso a la app, el aterrizaje post-login, y la estructura de navegación persistente que enmarca todas las demás pantallas.

## 2. Actores

- **Representante de ventas de campo** (actor único de este módulo; el rol de gerente se cubre en RQ-08).

## 3. Requerimientos funcionales

- **RF-NAV-01**: El usuario debe autenticarse antes de acceder a cualquier pantalla de la app. *Criterio: sin sesión activa, cualquier ruta redirige a `/`.*
- **RF-NAV-02**: Tras login exitoso, el usuario aterriza en el dashboard (`/dashboard`), que muestra el mapa como área primaria. *Fuente: "the map is the default landing screen after login" (Main App & Navigation).*
- **RF-NAV-03**: El dashboard debe mostrar la ubicación actual del agente sobre un mapa interactivo con zoom/pan.
- **RF-NAV-04**: El dashboard debe pre-cargar información CRM relevante al territorio/asignaciones del agente autenticado (cuentas, visitas del día).
- **RF-NAV-05**: Debe existir una navegación inferior persistente y siempre visible con acceso a 4 secciones: **Clients, Schedule, Reporting, Settings** (más el propio Dashboard como landing). *Fuente literal del FR de navegación.*
- **RF-NAV-06**: El usuario debe poder navegar libremente entre las 4+1 secciones sin perder el estado de sesión.
- **RF-NAV-07**: Si el permiso de geolocalización es denegado, la app debe mostrar un mensaje apropiado y ofrecer un modo alterno (no debe bloquear el uso de la app). *Ver RQ-02 para el detalle del fallback de ubicación.*
- **RF-NAV-08**: Debe existir una acción de cierre de sesión (`logout`) que limpie el estado de sesión y regrese a `/`.

## 4. Reglas de negocio

- El mapa/dashboard es la pantalla de aterrizaje por defecto — no un menú, no una lista de tareas.
- Los botones de navegación deben permanecer accesibles en toda la app autenticada (nunca tapados por overlays, teclados virtuales, o contenido largo).
- Los servicios de ubicación requieren autorización explícita del usuario antes de activarse.

## 5. Datos y entidades involucradas

- Sesión/usuario autenticado (hoy: flag `session.isAuthenticated` en `store.ts`, sin modelo de usuario real).
- `Agent` (`types.ts`) — territorio, racha de días, nombre.

## 6. Estado actual en el demo

- **Login es un formulario sin validación de credenciales reales** — cualquier submit marca `session.isAuthenticated = true` para un único agente hardcodeado ("Sofia Rivera", territorio "Mexico City West"). No hay usuarios, contraseñas, ni tokens.
- La navegación inferior (`BottomNavigation.tsx`) y el shell de layout (`App.tsx`, phone-frame) **sí implementan el requerimiento de negocio con fidelidad** — 4 secciones fijas, siempre visibles salvo en `/` (login).
- El manejo de permiso de ubicación denegado existe (ver RQ-02) vía modo demo con ubicación simulada, cumpliendo el espíritu de RF-NAV-07 aunque con datos ficticios en vez de un mensaje de error puro.

## 7. Requerimientos no funcionales

- Carga del mapa en <3s en condiciones normales de red (del PDF fuente; no verificado en el demo, que corre 100% local sin red).
- UI responsive validada en breakpoints móviles estándar (360/390/430/768px y desktop) — regla explícita del plan de ejecución original del demo.

## 8. Fuera de alcance de este módulo

- Gestión detallada de clientes (RQ-03), agenda (RQ-04), reporting/KPIs (RQ-08), configuración de perfil/settings (RQ-06/09), optimización de rutas (RQ-02/04), notificaciones (RQ-10) — cada uno definido explícitamente como feature separada en el PDF fuente.

## 9. Preguntas abiertas / decisiones pendientes

- **Modelo de autenticación real**: ¿usuario/contraseña propio, SSO corporativo, o federado con el CRM (Salesforce)? No hay ninguna pista en los documentos de negocio — es la primera decisión de arquitectura que bloquea prácticamente todo backend real (login es, según el análisis de arquitectura, el candidato natural para el primer recurso de `SalesAgent.Api`).
- **Multi-agente / multi-territorio real**: el demo asume un solo agente fijo; el backend deberá soportar múltiples usuarios con territorios distintos desde el primer recurso de auth.
