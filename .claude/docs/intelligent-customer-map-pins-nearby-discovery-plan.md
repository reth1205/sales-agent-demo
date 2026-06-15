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
- Simular una interaccion realista sobre el mapa para presentar como trabajaria la app en campo.
- Lanzar navegacion externa desde la tarjeta de cuenta.
- Permitir reset completo de la demo desde Settings para volver al estado inicial de la app.
- Mantener todo dentro del frontend, sin crear API ni backend.

## 2. Restricciones de demo

- No se debe crear ningun API, endpoint, backend ni integracion real con Salesforce.
- Los datos deben venir de fixtures locales en `src/data.ts` y estado en `src/store.ts`.
- La persistencia, si se necesita, debe seguir usando `localStorage`.
- El mapa debe seguir usando Leaflet/OpenStreetMap, ya que la app actual no usa Google Maps ni API keys.
- Las recomendaciones de AI deben ser simuladas mediante reglas locales, no con un modelo externo.
- Las notificaciones push reales se sustituyen por tarjetas, banners, bottom sheets o toasts in-app.
- La interaccion simulada del mapa debe ser un guion local deterministico, controlado por la UI, sin GPS real ni timers obligatorios.
- El reset completo debe limpiar/restaurar estado local persistido en `localStorage` y volver a cargar defaults de fixtures locales.
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
- No existe modo de demo guiada que simule el comportamiento del agente moviendose e interactuando con pins en el mapa.
- Settings solo contempla limpieza parcial de actividad demo; no hay reset completo de toda la app y persistencia local.

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

Crear tambien un flujo de demo guiada:

1. El usuario activa `Run map demo` desde el dashboard.
2. La ubicacion demo del agente se mueve por pasos entre cuentas cercanas.
3. Cada paso enfoca el mapa, resalta un pin y abre la tarjeta CRM correspondiente.
4. La app muestra una recomendacion contextual como si el agente estuviera en campo.
5. El usuario puede pausar, avanzar manualmente o cerrar la demo.
6. La demo nunca debe depender de geolocation real ni modificar datos irreversibles.

Crear un flujo de reset:

1. El usuario entra a Settings.
2. En la seccion de demo controls, el usuario elige `Reset app`.
3. La app pide confirmacion clara porque se perderan visitas, tareas, queue, progreso, settings y selecciones locales.
4. Al confirmar, se limpian las claves de `localStorage` usadas por la app y se rehidrata el estado inicial.
5. Se muestra un toast de exito y la app queda lista para repetir la demo desde cero.

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
  - `MapDemoStep`

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
- `buildMapDemoSteps(accounts, visits, recommendations)`: secuencia deterministica para presentar el flujo realista.

La logica debe ser deterministica y basada en datos locales.

## 8. Cambios de estado

Actualizar `src/store.ts`:

- Agregar estado UI:
  - `selectedMapAccountId?: string`
  - `selectedMapVisitId?: string`
  - `activeRecommendationId?: string`
  - `dismissedRecommendationIds: string[]`
  - `mapDemo: { isRunning: boolean; currentStepIndex: number; steps: MapDemoStep[] }`
- Agregar acciones:
  - `selectMapAccount(accountId)`
  - `selectMapVisit(visitId)`
  - `clearMapSelection()`
  - `dismissRecommendation(recommendationId)`
  - `focusAccountLocation(accountId)`
  - `startMapDemo()`
  - `advanceMapDemoStep()`
  - `pauseMapDemo()`
  - `stopMapDemo()`
  - `openNavigation(accountId)`
  - `resetApp()`

Mantener todo local. `openNavigation` puede usar `window.open(buildNavigationUrl(account), '_blank')`.

`resetApp` debe restaurar el estado inicial completo, limpiar las claves persistidas de esta demo y evitar dejar referencias colgantes como seleccion de cuenta, recomendacion activa o pasos de demo corriendo.

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
- Agregar control compacto para ejecutar demo guiada del mapa: start, pause/continue, next y close.
- Ajustar overlays para no tapar bottom nav ni visit card.
- El card de `Next visit` debe convivir con la seleccion de pin; si hay pin seleccionado, la summary sheet toma prioridad.

### Nuevo `src/components/MapDemoControls.tsx`

Controles discretos para simular una jornada realista sobre el mapa.

Contenido:

- Boton `Run map demo`.
- Estado del paso actual, por ejemplo `Step 2 of 5`.
- Acciones:
  - `Pause`
  - `Next`
  - `Close`

Comportamiento:

- Al iniciar, centra el mapa en el agente y luego en una cuenta cercana.
- Al avanzar, selecciona pins, muestra la summary sheet y activa recomendaciones relevantes.
- Debe poder funcionar manualmente aunque se eviten timers automaticos para mantener la demo controlada.

### `src/views/ClientsPage.tsx`

Opcional pero recomendado:

- Leer query param o estado UI para abrir una cuenta seleccionada desde mapa.
- Si se evita query param por simplicidad, solo navegar a `/clients` y dejar seleccionado el primer cliente no es ideal.
- Mejor opcion: usar `state.ui.selectedClientId` o `selectedMapAccountId` como seleccion inicial.

### `src/views/SettingsPage.tsx` y `src/components/SettingsPanels.tsx`

Cambios:

- Extender `DemoCleanupSettings` o crear un panel de reset completo.
- Mantener la limpieza parcial existente como opcion de bajo riesgo si sigue siendo util.
- Agregar accion `Reset app` con confirmacion.
- Explicar en microcopy funcional que el reset restaura la demo completa al estado inicial.
- Despues del reset, limpiar selecciones UI, queue offline, progreso, visitas modificadas, tareas generadas, preguntas custom y preferencias persistidas.

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
- Estilos de controles de demo sobre mapa:
  - posicion compacta y accesible
  - no cubrir pins principales, summary sheet ni bottom nav
  - botones con estados disabled cuando no hay paso siguiente
- Estilos para confirmacion de reset completo:
  - accion destructiva claramente diferenciada
  - texto breve y legible en mobile

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

### Fase 6 - Simulacion guiada de interaccion en mapa

Objetivo: permitir presentar la app como si el agente estuviera trabajando en campo.

Tareas:

- Definir pasos demo deterministas con cuentas, ubicaciones, recomendaciones y pins destacados.
- Agregar estado y acciones para iniciar, pausar, avanzar y cerrar la demo guiada.
- Actualizar `MapView` para enfocar ubicaciones/pins segun el paso activo.
- Crear `MapDemoControls` o integrar controles compactos en el overlay del dashboard.
- Al avanzar de paso, abrir la tarjeta CRM y recommendation banner correspondiente.
- Evitar modificaciones irreversibles de visitas/tareas salvo que el usuario ejecute explicitamente una accion como `Simulate arrival`.

Criterios de salida:

- La demo puede mostrar una secuencia de trabajo realista sin GPS real.
- El presentador puede controlar manualmente el ritmo de la simulacion.
- La simulacion se puede cerrar y el mapa vuelve a su comportamiento normal.

### Fase 7 - Reset completo desde Settings

Objetivo: poder repetir la demo desde cero sin limpiar el navegador manualmente.

Tareas:

- Implementar accion `resetApp()` en `src/store.ts`.
- Centralizar o listar las claves de `localStorage` usadas por la app.
- Agregar boton destructivo `Reset app` en Settings con confirmacion.
- Restaurar defaults de visitas, tareas, settings, queue, progreso y estado UI.
- Mostrar toast de confirmacion despues del reset.
- Validar que la app queda en el mismo estado que una primera carga.

Criterios de salida:

- Settings permite resetear toda la app.
- El reset limpia persistencia local y estado en memoria.
- La demo se puede ejecutar nuevamente sin datos residuales.

### Fase 8 - Pulido demo y QA

Objetivo: dejar la experiencia lista para presentacion.

Tareas:

- Revisar responsive en 360px, 390px, 430px y desktop shell.
- Validar que bottom nav no cubra summary sheets ni banners.
- Validar estados sin geolocation real.
- Validar estados completed, risk y opportunity.
- Validar inicio, pausa, avance y cierre de la demo guiada de mapa.
- Validar reset completo desde Settings y posterior re-ejecucion de la demo.
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
- AC11: El dashboard permite ejecutar una demo guiada que simula la interaccion realista del agente con el mapa.
- AC12: La demo guiada puede avanzar por pasos, seleccionar pins, mostrar summary sheets y activar recomendaciones sin GPS real.
- AC13: Settings incluye una accion de reset completo con confirmacion.
- AC14: El reset completo restaura estado inicial y limpia persistencia local de la app.

## 13. Riesgos y mitigaciones

| Riesgo | Mitigacion |
| --- | --- |
| Mapa saturado con demasiados pins | Limitar cuentas demo y usar prioridad visual; clustering queda fuera de MVP |
| Recomendaciones parecen aleatorias | Mostrar razon visible: distance, opportunity, overdue task, inactive account |
| Navegacion externa depende del entorno | Usar URL web de Google Maps con coordenadas como fallback universal |
| Datos nuevos rompen flujo actual de visitas | Mantener visitas existentes y asociar pins por `accountId` |
| Bottom sheets cubren controles importantes | Reusar patrones actuales de `.bottom-sheet` y probar alturas mobile |
| AI esperado como real | Documentar que es motor local deterministic para demo |
| Simulacion guiada parece automatizacion fragil | Permitir avance manual por pasos y mantener datos deterministicos |
| Reset completo borra mas de lo esperado | Limitarse a claves de `localStorage` propias de la demo y pedir confirmacion |

## 14. Orden recomendado de implementacion

1. Tipos y datos demo.
2. Selectores/helper de pins, distancia e insights.
3. Pins interactivos en `MapView`.
4. Summary sheet.
5. Recommendation banner.
6. Navegacion externa y salto a Clients.
7. Demo guiada de interaccion en mapa.
8. Reset completo desde Settings.
9. CSS responsive y QA.

## 15. Fuera de alcance para esta demo

- API real de Salesforce.
- Google Maps SDK o API key.
- Push notifications reales.
- AI real o llamadas a modelos.
- Route optimization real.
- Clustering avanzado para territorios grandes.
- Geolocation polling continuo de bajo consumo.
- Seguridad de CRM real.
