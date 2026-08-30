# RQ-02 — Mapa y descubrimiento de cuentas

**Estado en el demo:** Implementado con simplificaciones tecnológicas documentadas (proveedor de mapa, geofencing, geolocalización).
**Código relacionado:** [`src/components/MapView.tsx`](../../src/components/MapView.tsx), [`src/components/CustomerMapSummarySheet.tsx`](../../src/components/CustomerMapSummarySheet.tsx), [`src/components/NearbyRecommendationBanner.tsx`](../../src/components/NearbyRecommendationBanner.tsx), [`src/components/MapDemoControls.tsx`](../../src/components/MapDemoControls.tsx), [`src/components/RouteSimulationBanner.tsx`](../../src/components/RouteSimulationBanner.tsx), [`src/views/DashboardPage.tsx`](../../src/views/DashboardPage.tsx), acciones de mapa/geofence/ubicación en `store.ts` (`checkGeofences`, `requestBrowserLocation`, `useDemoLocation`, `startMapDemo`, `selectMapAccount`, `dismissRecommendation`, `toggleCoverageLayer`, etc.), `selectors.ts` (tipo de pin, riesgo de cobertura).
**Fuentes de negocio:** `docs/Main App _ Navigation.pdf`, `docs/Feature_ Intelligent Customer Map Pins & Nearby Account Discovery.pdf`, `.claude/requirenment/solidjs-demo-execution-plan.md`.

## 1. Resumen

El mapa no es solo navegación — es un espacio de trabajo activo de decisión: muestra dónde están las cuentas, cuáles necesitan atención, y sugiere proactivamente próximas paradas según proximidad, urgencia de oportunidad y riesgo de la cuenta.

## 2. Requerimientos funcionales

- **RF-MAP-01**: El mapa debe mostrar pines por cuenta/visita con **tipo visual distinguible** según categoría de negocio. *Fuente: 5 tipos — verde (visita programada), azul (cuenta activa cercana), amarillo (oportunidad que necesita atención), rojo (cuenta en riesgo/escalación), gris (previamente visitada/completada).*
- **RF-MAP-02**: Al tocar un pin, debe abrirse una **tarjeta resumen de cliente** con: información de cuenta (nombre, tipo, última interacción, estado), distancia y tiempo de viaje/ETA, snapshot de oportunidades (valor, stage, riesgo), resumen de tareas pendientes/vencidas, e insight contextual de IA opcional (ej. "no visitado en 45 días").
- **RF-MAP-03**: El sistema debe calcular y mostrar distancia y ETA desde la ubicación actual del agente a cada cuenta relevante.
- **RF-MAP-04**: El sistema debe generar **recomendaciones proactivas de cuentas cercanas** analizando continuamente ubicación, datos CRM, progresión de ruta, proximidad, urgencia de oportunidad, y actividad de cuenta. *Ejemplos de copy esperado: "You are 4 minutes away from Horizon Builders. There is an active opportunity worth $85,000 awaiting follow-up." / "You have a 30-minute gap before your next meeting. Two nearby active accounts could be visited."*
- **RF-MAP-05**: Las recomendaciones deben poder descartarse por el usuario (`dismissRecommendation`).
- **RF-MAP-06**: Debe existir una acción de "navegar" que lance direcciones hacia la cuenta seleccionada desde la tarjeta resumen.
- **RF-MAP-07**: El mapa debe actualizarse en tiempo real conforme cambia la ubicación del agente.
- **RF-MAP-08**: Debe existir un mecanismo de **detección de llegada a una visita programada** (geofencing) que dispare el flujo de inicio de visita/briefing.
- **RF-MAP-09**: Debe existir manejo explícito de permiso de ubicación denegado, con una alternativa utilizable (no debe romper el flujo).

## 3. Reglas de negocio

- **Lógica de priorización de recomendaciones** (fuente formal): valor de oportunidad, tier de cuenta, fecha de última interacción, timing de renovación, escalaciones de soporte abiertas, gaps de reunión, eficiencia de ruta, riesgo de engagement.
- El proveedor de mapas requerido por el negocio es **Google Maps** — obligatorio según `Main App & Navigation.pdf`.
- Clustering inteligente de pines cercanos recomendado para evitar saturación visual del mapa (mitigación de riesgo documentada).
- Radios de geofence deben ser ajustables (mitigación de riesgo por imprecisión GPS).

## 4. Datos y entidades involucradas

`Account` (con `latitude`/`longitude`, `isNearbyCandidate`, `hasEscalation`, `engagementRisk`, `tier`), `NearbyRecommendation` (`reason`, `score`, `distanceMeters`, `etaMinutes`), `MapPinType`, `ScheduledVisit` (`radiusMeters`), `LocationPoint`, `AccountCoverageMetric` (para la capa de cobertura del mapa, compartida con RQ-08).

## 5. Estado actual en el demo

- **Proveedor de mapa**: Leaflet + OpenStreetMap en lugar de Google Maps, detrás de una capa intercambiable — decisión documentada explícitamente como temporal para evitar costo/API key de Google Maps.
- **Geolocalización**: Browser Geolocation API (`requestBrowserLocation`), con **fallback de ubicación simulada** (`useDemoLocation`) cuando el permiso es denegado o no disponible — cumple RF-MAP-09 con datos ficticios.
- **Geofencing**: cálculo local con fórmula de Haversine contra coordenadas dummy de las visitas (`checkGeofences`, radios de 450–500 m en `data.ts`), no un servicio de geofencing nativo (Core Location / Google Location Services). Suficiente para demo web, **insuficiente para producción móvil real** — geofencing en background con app cerrada requiere las APIs nativas mencionadas en `docs/mobile-dashboard-migration-plan.md`.
- **Recomendaciones de cuentas cercanas**: implementadas con lógica determinística en el store/selectors (no un motor de scoring real), mostradas vía `NearbyRecommendationBanner`.
- **Simulación de ruta y llegada**: `MapDemoControls`/`startMapDemo`/`animateMapDemoStep` permiten simular el desplazamiento del agente hacia una cuenta para demostrar el flujo sin moverse físicamente — es una herramienta de demo, no una feature de producto.
- **Tarjeta resumen de cliente** (`CustomerMapSummarySheet`) y selección de pin (`selectMapAccount`/`selectMapVisit`) ya cubren el flujo de interacción de RF-MAP-02 con datos mock.

## 6. Requerimientos no funcionales

- Actualización de mapa en near-real-time.
- Optimización de batería para geofencing en background (crítico para producción móvil, no aplicable al demo web).
- Transmisión de datos CRM encriptada.

## 7. Fuera de alcance de este módulo

- Vista de mapa del gerente con todos los agentes (es RQ-08).
- Heatmap de territorio/penetración de mercado (marcado como "enhancement futuro" en la fuente, no MVP).
- AI Opportunity Scoring, sugerencias por voz proactivas ("enhancements futuros" explícitos, no requeridos para el MVP).

## 8. Preguntas abiertas / decisiones pendientes

- **¿Se mantiene Google Maps como requisito de negocio, o se acepta Leaflet/OSM (o Mapbox) para producción?** — impacta presupuesto (`MVP - Business Topics.pdf` cotiza Google Maps API con $200/mes gratis) y el stack móvil (`react-native-maps` vs. SDK de Google Maps nativo).
- **Geofencing en background real**: requiere decidir arquitectura móvil (ver RQ-10) antes de poder implementarlo — no es solo un cambio de backend.
- Reconciliar el sistema de color de pin de este documento (por tipo de cuenta/pin) con el de RQ-07 (por estado de progreso/captura) si el diseño final quiere un único lenguaje visual — hoy son dos sistemas de color con propósitos distintos en las fuentes originales.
