# Plan de accion - Intelligent Customer Map Pins & Nearby Account Discovery

Fecha: 2026-05-27  
Fuente: `docs/Feature_ Intelligent Customer Map Pins & Nearby Account Discovery.pdf`  
Alcance de esta fase: planificacion solamente, sin implementar cambios de codigo.

## 1. Objetivo

Evolucionar el dashboard de mapa actual para que deje de ser solo una vista de ubicacion y visitas programadas, y se convierta en una superficie de decision para el agente de ventas.

La demo debe permitir:

- Ver pins interactivos de clientes/cuentas en el mapa.
- Distinguir visualmente visitas, cuentas activas, oportunidades, riesgos y cuentas ya visitadas.
- Tocar un pin para abrir una tarjeta de resumen CRM.
- Descubrir cuentas cercanas usando datos dummy locales.
- Mostrar recomendaciones/alertas simuladas basadas en proximidad, oportunidad, tareas, gaps de agenda y riesgo.
- Lanzar navegacion externa desde la tarjeta de cuenta.
- Mantener todo dentro del frontend, sin crear API ni backend.

## 2. Restricciones de demo

- No se debe crear ningun API, endpoint, backend ni integracion real con Salesforce.
- Los datos deben venir de fixtures locales en `src/data.ts` y estado en `src/store.ts`.
- La persistencia, si se necesita, debe seguir usando `localStorage`.
- El mapa debe seguir usando Leaflet/OpenStreetMap, ya que la app actual no usa Google Maps ni API keys.
- Las recomendaciones de AI deben ser simuladas mediante reglas locales, no con un modelo externo.
- Las notificaciones push reales se sustituyen por tarjetas, banners, bottom sheets o toasts in-app.
- El codigo y microcopy funcional nuevo deben mantenerse en ingles, consistente con el proyecto actual.

## 3. Requerimientos extraidos del PDF

### Experiencia principal

- El mapa es la interfaz operacional primaria.
- Debe mostrar visitas programadas, cuentas activas, oportunidades cercanas, indicadores de actividad, progreso de ruta y recomendaciones.
- El agente puede tocar pins para ver resumen CRM rapido.
- El agente puede acceder a oportunidades, tareas y acciones de navegacion desde el mapa.

### Tipos de pin

| Tipo | Significado para la demo |
| --- | --- |
| Green pin | Scheduled visit |
| Blue pin | Active nearby account |
| Yellow pin | Opportunity attention needed |
| Red pin | Escalation/risk account |
| Gray pin | Previously visited/completed |

La app actual ya colorea visitas por `Scheduled`, `InProgress`, `Questionnaire` y `Completed`; el plan debe extender ese modelo para cuentas no necesariamente agendadas y razones comerciales.

### Tarjeta de resumen al tocar pin

La tarjeta debe incluir:

- Account name.
- Customer/account type.
- Last interaction date.
- Account status.
- Distance from current location.
- Estimated driving time demo.
- Active opportunities.
- Opportunity value.
- Current sales stage.
- Risk indicators.
- Pending follow-ups.
- Overdue tasks.
- Upcoming actions.
- AI contextual insight simulado.

### Descubrimiento cercano

La demo debe recomendar cuentas cercanas cuando:

- Hay una cuenta activa cerca.
- Hay oportunidad abierta de alto valor.
- Existe tarea vencida o follow-up pendiente.
- La cuenta lleva muchos dias sin visita.
- Hay gap antes de la siguiente reunion.
- La cuenta queda sobre una ruta razonable.

Ejemplos de mensajes esperados:

- `You are 4 minutes away from Horizon Builders. There is an active opportunity worth $85,000 awaiting follow-up.`
- `You have a 30-minute gap before your next meeting. Two nearby active accounts could be visited.`
- `Nearby customer Acme Corp has not received a follow-up after the last proposal.`

## 4. Estado actual de la aplicacion

Archivos revisados:

- `src/App.tsx`: shell principal, proteccion de sesion y bottom navigation.
- `src/main.tsx`: rutas actuales.
- `src/components/MapView.tsx`: Leaflet map, marcador del agente y pins de visitas.
- `src/views/DashboardPage.tsx`: dashboard con mapa, widget de progreso, next visit y botones de ubicacion.
- `src/views/ClientsPage.tsx`: detalle CRM por cuenta.
- `src/views/SchedulePage.tsx`: visitas del dia con distancia y acciones.
- `src/store.ts`: estado central, acciones de ubicacion, geofence, visitas, cuestionario, offline y progreso.
- `src/data.ts`: datos dummy de cuentas, contactos, oportunidades, actividades y visitas.
- `src/services.ts`: distancia Haversine, formato, interpretacion dummy y speech.
- `src/types.ts`: tipos de dominio.
- `src/styles.css`: layout mobile shell, mapa, overlays, cards, pins y bottom sheets.

### Lo que ya existe y se puede reutilizar

- Mapa full-screen en dashboard con Leaflet.
- Ubicacion actual del agente en `state.location.current`.
- Calculo de distancia con `getDistanceMeters`.
- Cuentas, oportunidades, actividades, contactos y visitas dummy.
- Pins de visitas en `MapView`.
- Estados de visitas y colores basicos.
- Toasts in-app.
- Bottom navigation mobile-first.
- Boton `Simulate arrival` y geofence local.
- Persistencia local para visitas, tareas, settings, queue y progreso.

### Brechas frente al PDF

- Los pins solo representan visitas, no todas las cuentas ni cuentas cercanas no agendadas.
- No existe seleccion de pin con tarjeta CRM enriquecida.
- No hay tipos comerciales de pin como opportunity, risk o active account.
- No hay recomendaciones cercanas ni motor local de priorizacion.
- No hay tareas dummy iniciales asociadas a cuentas; solo tareas generadas despues del cuestionario.
- No hay `lastInteractionDate`, `tier`, `accountType`, `engagementRisk`, `nextAction` ni `navigationUrl`.
- No existe accion de navegacion externa desde una tarjeta.
- No existe clustering o control de densidad, aunque para demo puede resolverse con pocos datos.

## 5. Enfoque propuesto

Implementar la feature como una extension local del modelo CRM y del dashboard actual.

No crear una vista nueva en navegacion. El mapa inteligente debe vivir en `/dashboard` porque el PDF lo define como evolucion de la experiencia principal de mapa.

Crear un flujo de interaccion:

1. El usuario entra a Dashboard.
2. El mapa muestra el agente, visitas y cuentas cercanas.
3. El usuario toca un pin.
4. Aparece una bottom sheet de resumen CRM.
5. La tarjeta muestra insight, oportunidad, tareas y distancia.
6. El usuario puede simular llegada, abrir contexto, ver en Clients o lanzar navegacion.
7. Si hay recomendaciones cercanas relevantes, se muestra una alerta compacta sobre el mapa.

## 6. Cambios de datos dummy

Actualizar `src/types.ts`:

- Extender `Account` con campos demo:
  - `type`
  - `tier`
  - `lastInteractionDate`
  - `engagementRisk`
  - `nextAction`
  - `isNearbyCandidate`
  - `hasEscalation`
- Extender `Task` o crear tareas iniciales en `crm.tasks`:
  - `priority`
  - `dueDate`
  - `status`
  - `source`
- Agregar tipo nuevo:
  - `MapPinType = 'scheduledVisit' | 'activeAccount' | 'opportunity' | 'risk' | 'completed'`
  - `NearbyRecommendation`

Actualizar `src/data.ts`:

- Mantener cuentas actuales y enriquecerlas.
- Agregar 3 a 5 cuentas demo cercanas alrededor de Mexico City West, por ejemplo:
  - `Horizon Builders`
  - `Northstar Medical Supply`
  - `Urban Foods Group`
  - `Atlas Logistics`
  - `Pinnacle Retail Partners`
- Agregar oportunidades dummy para algunas cuentas nuevas.
- Agregar actividades recientes para calcular `lastInteractionDate`.
- Agregar tareas iniciales para follow-ups y overdue tasks.
- Mantener coordenadas suficientemente cercanas para que las recomendaciones se puedan demostrar sin GPS real.

## 7. Cambios de servicios/selectores

Actualizar `src/selectors.ts`:

- `getAccountContacts(accountId)`
- `getAccountOpportunity(accountId)`
- `getAccountActivities(accountId)`
- `getAccountTasks(accountId)`
- `getLastActivity(accountId)`
- `getAccountDistance(account)`
- `getNextScheduledVisit()`
- `getMapPinType(account, relatedVisit, opportunity, tasks)`
- `getNearbyAccounts(radiusMeters)`
- `getNearbyRecommendations()`

Actualizar `src/services.ts` o separar en un archivo futuro:

- `estimateDriveMinutes(distanceMeters)`: regla demo simple.
- `formatDistance(distanceMeters)`: metros/km o miles si se decide.
- `buildAccountInsight(account, opportunity, tasks, distanceMeters)`: texto tipo AI simulado.
- `scoreNearbyAccount(account, opportunity, tasks, scheduleGap)`: scoring local.
- `buildNavigationUrl(account)`: Google Maps web URL o geo URL.

La logica debe ser deterministica y basada en datos locales.

## 8. Cambios de estado

Actualizar `src/store.ts`:

- Agregar estado UI:
  - `selectedMapAccountId?: string`
  - `selectedMapVisitId?: string`
  - `activeRecommendationId?: string`
  - `dismissedRecommendationIds: string[]`
- Agregar acciones:
  - `selectMapAccount(accountId)`
  - `selectMapVisit(visitId)`
  - `clearMapSelection()`
  - `dismissRecommendation(recommendationId)`
  - `focusAccountLocation(accountId)`
  - `openNavigation(accountId)`

Mantener todo local. `openNavigation` puede usar `window.open(buildNavigationUrl(account), '_blank')`.

## 9. Cambios de componentes

### `src/components/MapView.tsx`

Objetivo: renderizar pins inteligentes e interactivos.

Cambios:

- Renderizar un pin por cuenta, no solo por visita.
- Asociar cuenta con visita si existe.
- Asignar clase CSS segun `MapPinType`.
- Agregar `click` handler para seleccionar cuenta/visita.
- Mantener marcador del agente.
- Evitar duplicar pins cuando una cuenta ya tiene visita: el pin debe representar la cuenta con prioridad visual de visita.
- Mantener `markerLayer.clearLayers()` por simplicidad demo.

### Nuevo `src/components/CustomerMapSummarySheet.tsx`

Bottom sheet que aparece al seleccionar un pin.

Contenido:

- Header con nombre, tipo/tier y estado.
- Distancia y ETA demo.
- Insight AI simulado.
- Opportunity snapshot.
- Pending tasks.
- Recent activity.
- Risk indicators.
- Acciones:
  - `Navigate`
  - `View Client`
  - `Simulate arrival` si tiene visita
  - `Start Visit` si la visita esta scheduled
  - `Close`

### Nuevo `src/components/NearbyRecommendationBanner.tsx`

Banner o mini bottom sheet sobre el mapa.

Contenido:

- Mensaje recomendado.
- Cuenta relacionada.
- Razon: high value, overdue follow-up, inactive account, schedule gap.
- Acciones:
  - `View`
  - `Navigate`
  - `Dismiss`

### `src/views/DashboardPage.tsx`

Cambios:

- Mantener `MapView`.
- Agregar `CustomerMapSummarySheet`.
- Agregar `NearbyRecommendationBanner`.
- Ajustar overlays para no tapar bottom nav ni visit card.
- El card de `Next visit` debe convivir con la seleccion de pin; si hay pin seleccionado, la summary sheet toma prioridad.

### `src/views/ClientsPage.tsx`

Opcional pero recomendado:

- Leer query param o estado UI para abrir una cuenta seleccionada desde mapa.
- Si se evita query param por simplicidad, solo navegar a `/clients` y dejar seleccionado el primer cliente no es ideal.
- Mejor opcion: usar `state.ui.selectedClientId` o `selectedMapAccountId` como seleccion inicial.

## 10. Cambios CSS

Actualizar `src/styles.css`:

- Nuevas clases de pins:
  - `.account-marker.scheduled`
  - `.account-marker.active`
  - `.account-marker.opportunity`
  - `.account-marker.risk`
  - `.account-marker.completed`
- Estilo de pulso sutil para recomendacion activa.
- Estilos de bottom sheet de resumen:
  - altura maxima controlada
  - scroll interno si hay mucho contenido
  - no cubrir bottom nav
  - botones compactos
- Estilos de recommendation banner:
  - profesional, discreto, dismissible
  - no saturar el mapa
- Leyenda compacta opcional de pins.

## 11. Plan por fases

### Fase 1 - Modelo y datos demo

Objetivo: preparar la informacion necesaria sin tocar UI compleja.

Tareas:

- Extender tipos en `src/types.ts`.
- Enriquecer cuentas existentes.
- Agregar cuentas cercanas dummy.
- Agregar oportunidades, actividades y tareas iniciales.
- Agregar helpers/selectores para relaciones CRM.

Criterios de salida:

- La app compila con el nuevo modelo.
- Hay suficientes cuentas para demostrar discovery.
- Cada recomendacion posible tiene datos que la soportan.

### Fase 2 - Pin intelligence en el mapa

Objetivo: mostrar pins de cuentas con estado comercial.

Tareas:

- Actualizar `MapView` para renderizar cuentas.
- Calcular tipo de pin localmente.
- Mantener interaccion de visitas programadas.
- Agregar click de pin para seleccionar cuenta.
- Ajustar estilos de markers.

Criterios de salida:

- El mapa muestra visitas y cuentas no agendadas.
- Los colores comunican scheduled, active, opportunity, risk y completed.
- Tocar un pin actualiza estado seleccionado.

### Fase 3 - Summary sheet CRM

Objetivo: mostrar el contexto requerido por el PDF al tocar un pin.

Tareas:

- Crear `CustomerMapSummarySheet`.
- Mostrar datos de cuenta, oportunidad, tareas, actividad, distancia y ETA.
- Crear insight AI simulado.
- Agregar acciones de cierre, navegacion, ver cliente y visita.
- Integrar en `DashboardPage`.

Criterios de salida:

- Tocar un pin abre una tarjeta contextual.
- La tarjeta no rompe el layout mobile.
- Las acciones principales funcionan con datos locales.

### Fase 4 - Nearby recommendations

Objetivo: simular recomendaciones inteligentes cercanas.

Tareas:

- Crear scoring local con distancia, oportunidad, tareas, riesgo e inactividad.
- Crear `NearbyRecommendationBanner`.
- Mostrar la recomendacion prioritaria.
- Permitir abrir detalle o descartarla.
- Recalcular cuando cambia la ubicacion demo o estado de visitas.

Criterios de salida:

- Usar `Use demo location` o `Simulate arrival` puede activar recomendaciones.
- El usuario puede ver o descartar la recomendacion.
- No se muestran demasiadas alertas al mismo tiempo.

### Fase 5 - Navegacion externa y flujo con Clients

Objetivo: cerrar acciones desde el mapa.

Tareas:

- Implementar URL de navegacion web maps con coordenadas.
- Agregar accion `Navigate`.
- Permitir ir desde summary sheet a `/clients` con la cuenta correcta seleccionada.
- Evaluar si `ClientsPage` debe leer seleccion desde store o query param.

Criterios de salida:

- El agente puede abrir navegacion externa.
- El agente puede saltar al detalle del cliente desde el mapa.

### Fase 6 - Pulido demo y QA

Objetivo: dejar la experiencia lista para presentacion.

Tareas:

- Revisar responsive en 360px, 390px, 430px y desktop shell.
- Validar que bottom nav no cubra summary sheets ni banners.
- Validar estados sin geolocation real.
- Validar estados completed, risk y opportunity.
- Ejecutar `npm run build`.
- Crear mini guion de demo si se requiere.

Criterios de salida:

- Demo end-to-end estable.
- Sin dependencias externas nuevas obligatorias.
- Sin APIs ni llaves.

## 12. Criterios de aceptacion

- AC1: Al cargar el dashboard, el mapa muestra pins interactivos de clientes/cuentas.
- AC2: Los pins usan estados visuales para scheduled visit, active account, opportunity, risk y completed.
- AC3: Al tocar un pin, se abre una tarjeta con cuenta, distancia, oportunidades y tareas.
- AC4: Las oportunidades activas de la cuenta son visibles desde la tarjeta.
- AC5: La demo muestra al menos una recomendacion cercana basada en datos locales.
- AC6: La recomendacion puede abrir la cuenta relacionada o descartarse.
- AC7: El usuario puede lanzar navegacion externa hacia la cuenta seleccionada.
- AC8: Los cambios de estado de visitas actualizan el mapa sin recargar la app.
- AC9: Todo funciona con datos dummy locales y sin API.
- AC10: La experiencia sigue siendo mobile-first y no se siente saturada.

## 13. Riesgos y mitigaciones

| Riesgo | Mitigacion |
| --- | --- |
| Mapa saturado con demasiados pins | Limitar cuentas demo y usar prioridad visual; clustering queda fuera de MVP |
| Recomendaciones parecen aleatorias | Mostrar razon visible: distance, opportunity, overdue task, inactive account |
| Navegacion externa depende del entorno | Usar URL web de Google Maps con coordenadas como fallback universal |
| Datos nuevos rompen flujo actual de visitas | Mantener visitas existentes y asociar pins por `accountId` |
| Bottom sheets cubren controles importantes | Reusar patrones actuales de `.bottom-sheet` y probar alturas mobile |
| AI esperado como real | Documentar que es motor local deterministic para demo |

## 14. Orden recomendado de implementacion

1. Tipos y datos demo.
2. Selectores/helper de pins, distancia e insights.
3. Pins interactivos en `MapView`.
4. Summary sheet.
5. Recommendation banner.
6. Navegacion externa y salto a Clients.
7. CSS responsive y QA.

## 15. Fuera de alcance para esta demo

- API real de Salesforce.
- Google Maps SDK o API key.
- Push notifications reales.
- AI real o llamadas a modelos.
- Route optimization real.
- Clustering avanzado para territorios grandes.
- Geolocation polling continuo de bajo consumo.
- Seguridad de CRM real.

