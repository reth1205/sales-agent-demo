# Plan de accion - AI Customer Briefing & Proximity-Based Voice Insights

Fecha: 2026-05-27  
Fuente: `docs/Feature_ AI Customer Briefing & Proximity-Based Voice Insights.pdf`  
Alcance de esta fase: planificacion solamente, sin implementar cambios de codigo ni ejecutar la demo.

## 1. Objetivo

Crear un plan para incorporar briefings inteligentes de cliente antes de una visita, usando solo datos dummy locales.

La demo debe permitir que el agente:

- Reciba una alerta contextual cuando se acerca a una visita programada.
- Abra un briefing compacto con informacion critica del cliente.
- Escuche el briefing mediante voz usando `speechSynthesis`.
- Acceda manualmente al briefing desde Dashboard, Schedule, Clients y, en una fase futura, desde pins del mapa.
- Vea tareas pendientes, oportunidades, historial reciente, riesgos y datos faltantes.
- Obtenga sugerencias de foco para la conversacion antes de entrar a la reunion.

## 2. Restricciones de demo

- No se debe crear API, backend, endpoint, integracion real con Salesforce ni AI externa.
- Los datos deben venir de fixtures locales en `src/data.ts` y del estado en `src/store.ts`.
- La generacion del briefing debe ser deterministica y basada en reglas locales.
- La voz debe reutilizar Web Speech API con `speechSynthesis`; no se requiere servicio de texto a voz externo.
- Las push notifications reales se sustituyen por bottom sheets, banners o toasts in-app.
- La deteccion por proximidad debe reutilizar geofence/distancia local ya existente.
- Offline cached briefings puede simularse guardando briefings generados en estado o `localStorage`, si aporta a la demo.
- El codigo y microcopy funcional nuevo deben mantenerse en ingles, consistente con el proyecto actual.

## 3. Requerimientos extraidos del PDF

### Experiencia principal

El sistema debe monitorear:

- Customer visit schedules.
- User GPS location.
- Route progression.
- CRM account context.

Cuando el agente se acerca a un destino o selecciona manualmente una cuenta:

- Se genera un AI briefing.
- Se dispara una notificacion.
- El usuario puede escuchar el briefing por voz.
- El usuario puede ver un panel legible con el resumen.

### Trigger por proximidad

Cuando el agente esta dentro de un umbral configurable:

- Default del PDF: 5 minutos de driving distance.
- Para demo: convertirlo a una distancia local aproximada, por ejemplo 700-900 metros, o estimar minutos desde `getDistanceMeters`.

La alerta esperada:

`You are approaching Acme Corporation. Would you like to hear your AI customer briefing?`

Opciones:

- `Play Briefing`
- `View Summary`
- `Dismiss`

### Trigger manual

El agente debe poder abrir el briefing desde:

- Customer pin on the map.
- Account menu.
- My Day section.

Para esta app:

- Customer pin corresponde a `MapView`.
- Account menu corresponde a `ClientsPage`.
- My Day section puede mapearse a `DashboardPage` y `SchedulePage`, ya que no existe una vista llamada My Day.

### Contenido del briefing

El briefing debe consolidar:

- CRM records.
- Opportunities.
- Tasks.
- Activities.
- Notes.
- Prior meetings.
- Follow-up actions.
- Account updates.

Secciones esperadas:

1. Customer overview.
2. Summary of last interactions.
3. Missing or pending tasks.
4. Opportunity overview.
5. Missing CRM information.
6. AI suggested focus areas.

### Voice playback

La narracion debe ser:

- Conversational.
- Professional.
- Concise.
- Focused on actionable insights.
- Avoid reading unnecessary CRM fields.

Ejemplo esperado:

`You are visiting Acme Corporation. Last interaction included discussion around Project Delta pricing. There is one overdue follow-up task and two active opportunities totaling two hundred thousand dollars.`

## 4. Estado actual de la aplicacion

Archivos revisados:

- `src/components/VisitContext.tsx`
- `src/components/QuestionnaireStepper.tsx`
- `src/components/MapView.tsx`
- `src/components/VisitStatusPrompt.tsx`
- `src/views/DashboardPage.tsx`
- `src/views/SchedulePage.tsx`
- `src/views/ClientsPage.tsx`
- `src/store.ts`
- `src/data.ts`
- `src/services.ts`
- `src/selectors.ts`
- `src/types.ts`

### Lo que ya existe

- `DashboardPage` muestra mapa, siguiente visita y botones de ubicacion.
- `MapView` renderiza agente y visitas usando Leaflet.
- `VisitStatusPrompt` ya aparece al entrar en radio de visita.
- `SchedulePage` lista visitas con distancia y contexto.
- `VisitContext` muestra resumen de cuenta y oportunidad abierta.
- `ClientsPage` muestra cuenta, contactos, oportunidad y actividad reciente.
- `QuestionnaireStepper` ya usa Web Speech API para voz en el flujo post-entrevista.
- `services.ts` ya tiene:
  - `getDistanceMeters`
  - `formatCurrency`
  - `speakText`
- `store.ts` ya tiene:
  - `checkGeofences`
  - `activeVisitPromptId`
  - location demo/live
  - estado de visitas
  - toasts

### Brechas frente al PDF

- No existe briefing previo a la visita.
- La alerta por proximidad solo ofrece `Start Visit`, no `Play Briefing` ni `View Summary`.
- No hay generacion de resumen AI local.
- No hay deteccion de missing CRM information.
- No hay tareas dummy iniciales para mostrar pending/overdue actions.
- No hay configuracion de trigger distance ni de notificaciones.
- No hay panel de briefing reutilizable desde Dashboard, Schedule o Clients.
- `speakText` es simple y no maneja pause/replay/stop.
- El flujo de voz actual esta enfocado en cuestionario post-entrevista, no en briefing previo.

## 5. Enfoque propuesto

Implementar la feature como una capa de briefing previa a visita, integrada en el flujo actual.

La experiencia futura:

1. El agente inicia sesion y ve Dashboard.
2. Usa ubicacion demo o live.
3. Si se acerca a una visita programada, `checkGeofences` tambien evalua briefing proximity.
4. Aparece una bottom sheet:
   - account name,
   - short reason,
   - `Play Briefing`,
   - `View Summary`,
   - `Dismiss`.
5. Si el usuario reproduce, la app lee un texto conciso con `speechSynthesis`.
6. Si el usuario abre summary, aparece `CustomerBriefingPanel`.
7. Desde Schedule o Clients, el usuario puede abrir manualmente el mismo briefing.

## 6. Modelo de datos propuesto

### Extender `Account`

Agregar campos demo:

```ts
type Account = {
  // existing fields...
  tier?: 'Enterprise' | 'Strategic' | 'Growth' | 'Standard';
  lastVisitDate?: string;
  primaryContactId?: string;
  crmHealth?: 'Complete' | 'NeedsUpdate' | 'MissingInfo';
  engagementScore?: number;
};
```

### Extender `Task`

Agregar campos opcionales:

```ts
type Task = {
  // existing fields...
  priority?: 'Low' | 'Medium' | 'High';
  source?: 'Briefing' | 'Questionnaire' | 'CRM';
  completedAt?: string;
};
```

### Nuevos tipos

```ts
export type CustomerBriefing = {
  accountId: string;
  visitId?: string;
  generatedAt: string;
  overview: string;
  lastInteractionSummary: string;
  pendingTasks: string[];
  opportunitySummary: string;
  missingInfoWarnings: string[];
  suggestedFocusAreas: string[];
  voiceScript: string;
};

export type BriefingTrigger = {
  visitId: string;
  accountId: string;
  distanceMeters: number;
  estimatedDriveMinutes: number;
  status: 'Ready' | 'Dismissed' | 'Played' | 'Viewed';
};

export type BriefingSettings = {
  notificationsEnabled: boolean;
  voicePlaybackEnabled: boolean;
  triggerDistanceMeters: number;
};
```

## 7. Datos dummy necesarios

Actualizar `src/data.ts`:

- Enriquecer cuentas actuales:
  - tier,
  - lastVisitDate,
  - primaryContactId,
  - crmHealth,
  - engagementScore.
- Agregar actividades mas descriptivas para briefing.
- Agregar tareas iniciales, no solo tareas generadas por cuestionario:
  - overdue quote follow-up,
  - updated contract pending,
  - technical demo overdue,
  - missing meeting notes.
- Agregar riesgos por cuenta:
  - escalation,
  - stalled opportunity,
  - budget/timeline concern.
- Mantener oportunidades actuales, pero agregar campos opcionales en demo si se requieren:
  - riskLevel,
  - lastUpdatedAt,
  - stalledDays.

Ejemplo de datos para demostrar:

- `Acme Corporation`: oportunidad en discovery, follow-up pendiente, ultima visita hace 12 dias.
- `Globex Manufacturing`: riesgo por budget/CFO, escalacion o propuesta vencida.
- `Initech Solutions`: cliente activo con oportunidad ganada, pero faltan notas recientes.

## 8. Servicios y selectores

### `src/selectors.ts`

Agregar:

- `getAccountContacts(accountId)`
- `getPrimaryContact(accountId)`
- `getAccountActivities(accountId)`
- `getAccountTasks(accountId)`
- `getOverdueAccountTasks(accountId)`
- `getAccountOpportunity(accountId)`
- `getVisitByAccount(accountId)`
- `getBriefingCandidateVisit()`
- `getMissingCrmInfo(accountId)`

### `src/services.ts` o nuevo `src/briefingService.ts`

Agregar logica local:

- `estimateDriveMinutes(distanceMeters)`
- `getDaysSince(date)`
- `buildCustomerBriefing(account, context)`
- `buildBriefingVoiceScript(briefing)`
- `detectMissingCrmInformation(account, contact, activities, opportunity)`
- `getSuggestedFocusAreas(account, opportunity, tasks, activities)`
- `shouldTriggerBriefing(distanceMeters, settings)`

Reglas sugeridas:

- Priorizar tareas vencidas.
- Priorizar oportunidades de mayor valor.
- Incluir riesgos y escalaciones.
- Si no hay actividad reciente en mas de X dias, mostrar warning.
- Si no hay telefono/email de contacto, mostrar missing info.
- Si oportunidad no se actualizo recientemente, mostrar focus area.

## 9. Cambios de estado

Actualizar `src/store.ts`:

Agregar:

```ts
briefing: {
  activeVisitId?: string;
  activeAccountId?: string;
  current?: CustomerBriefing;
  dismissedVisitIds: string[];
  playedBriefingIds: string[];
  isVoicePlaying: boolean;
  settings: BriefingSettings;
}
```

Agregar acciones:

- `checkBriefingProximity()`
- `openBriefingForVisit(visitId)`
- `openBriefingForAccount(accountId)`
- `generateBriefing(accountId, visitId?)`
- `dismissBriefing(visitId?)`
- `playBriefing()`
- `pauseBriefing()`
- `replayBriefing()`
- `stopBriefing()`
- `updateBriefingSettings(settings)`

Integracion con flujo actual:

- `requestBrowserLocation`, `useDemoLocation` y `focusVisitLocation` deben llamar a `checkBriefingProximity`.
- `checkGeofences` puede mantenerse para start visit, pero debe separarse logicamente de briefing para que no se mezclen prompts.

## 10. Componentes propuestos

### Nuevo `src/components/BriefingPrompt.tsx`

Bottom sheet de alerta por proximidad.

Contenido:

- Account name.
- Mensaje corto: `You are approaching Acme Corporation. Your briefing is ready.`
- ETA demo.
- Acciones:
  - `Play Briefing`
  - `View Summary`
  - `Dismiss`

Debe convivir con `VisitStatusPrompt`. Recomendacion:

- Si ambos aplican, mostrar primero briefing.
- Dentro del panel de briefing incluir accion secundaria `Start Visit` cuando este dentro del radio.

### Nuevo `src/components/CustomerBriefingPanel.tsx`

Panel reutilizable para Dashboard, Schedule y Clients.

Secciones:

- Customer overview.
- Last interactions.
- Pending tasks.
- Opportunity overview.
- Missing CRM information.
- Suggested focus areas.
- Voice controls.

Acciones:

- `Play`
- `Pause`
- `Replay`
- `Close`
- `Start Visit` si viene desde visita programada.

### Nuevo `src/components/BriefingVoiceControls.tsx`

Control compacto para playback:

- Play.
- Pause/Stop.
- Replay.
- Estado: `Playing`, `Paused`, `Ready`.

Debe encapsular `speechSynthesis` para no duplicar logica.

### Actualizar `src/components/VisitContext.tsx`

Agregar boton:

- `Open briefing`

O incluir una mini linea:

- `Briefing ready: 2 focus areas`

### Actualizar `src/components/VisitStatusPrompt.tsx`

Agregar awareness de briefing o coordinar con `BriefingPrompt`.

No saturar la pantalla con dos bottom sheets al mismo tiempo.

### Actualizar `src/views/DashboardPage.tsx`

Agregar:

- `BriefingPrompt`
- `CustomerBriefingPanel`
- Accion `Briefing` en next visit card si aplica.

### Actualizar `src/views/SchedulePage.tsx`

Agregar boton por visita:

- `Briefing`

Debe abrir el mismo `CustomerBriefingPanel`.

### Actualizar `src/views/ClientsPage.tsx`

Agregar boton en detalle de cuenta:

- `Briefing`

Debe funcionar aunque la cuenta no tenga visita programada.

### Actualizar `src/views/SettingsPage.tsx`

Agregar seccion simple:

- `Briefing notifications`
- Toggle enable/disable.
- Toggle voice playback default.
- Trigger distance control con opciones:
  - 400m
  - 700m
  - 1000m

Esto cubre FR9 de user control sin complicar la demo.

## 11. UX propuesta

La experiencia debe sentirse:

- Rapida.
- Helpful.
- Ejecutiva.
- Contextual.
- No intrusiva.
- Voice-first friendly.

Principios:

- Mostrar maximo 1 alerta de briefing a la vez.
- El briefing debe ser escaneable en menos de 30 segundos.
- La voz debe leer solo el `voiceScript`, no todos los campos.
- Las alertas se pueden descartar.
- El usuario siempre puede abrir manualmente el resumen.

## 12. Plan por fases

### Fase 1 - Datos y modelo de briefing

Objetivo: preparar la informacion necesaria para generar briefings locales.

Tareas:

- Extender tipos en `src/types.ts`.
- Enriquecer cuentas existentes en `src/data.ts`.
- Agregar tareas dummy iniciales.
- Agregar campos de CRM health, tier y last visit.
- Crear tipos `CustomerBriefing`, `BriefingSettings` y `BriefingTrigger`.

Criterios de salida:

- Hay datos suficientes para mostrar overview, tareas, oportunidades, missing info y focus areas.
- No se requiere API.

### Fase 2 - Generador local de briefing

Objetivo: simular AI briefing con reglas deterministicas.

Tareas:

- Crear helpers/selectores de account context.
- Crear `buildCustomerBriefing`.
- Crear `detectMissingCrmInformation`.
- Crear `buildBriefingVoiceScript`.
- Crear `estimateDriveMinutes`.

Criterios de salida:

- Para cada cuenta se puede generar un briefing consistente.
- El voice script es conciso y accionable.

### Fase 3 - Estado y trigger por proximidad

Objetivo: conectar briefing al flujo de ubicacion actual.

Tareas:

- Agregar estado `briefing` en `store.ts`.
- Agregar `checkBriefingProximity`.
- Llamar esta accion desde cambios de ubicacion demo/live.
- Respetar settings de notifications y trigger distance.
- Evitar repetir alertas descartadas.

Criterios de salida:

- Al simular llegada o usar demo location, la app puede detectar un briefing disponible.
- La alerta no aparece repetidamente despues de dismiss.

### Fase 4 - Prompt y panel visual

Objetivo: crear la experiencia visible del briefing.

Tareas:

- Crear `BriefingPrompt`.
- Crear `CustomerBriefingPanel`.
- Integrar ambos en `DashboardPage`.
- Coordinar con `VisitStatusPrompt`.
- Agregar estilos en `styles.css`.

Criterios de salida:

- La alerta muestra `Play Briefing`, `View Summary` y `Dismiss`.
- El panel muestra todas las secciones requeridas.
- El layout funciona en mobile shell.

### Fase 5 - Voice playback

Objetivo: reproducir el briefing por voz.

Tareas:

- Crear `BriefingVoiceControls`.
- Reutilizar `speechSynthesis`.
- Agregar play, stop/pause simulado y replay.
- Cancelar voz al cerrar panel o cambiar de cuenta.

Criterios de salida:

- `Play Briefing` lee el resumen.
- `Replay` vuelve a leerlo.
- `Stop` cancela la narracion.

### Fase 6 - Acceso manual desde Schedule y Clients

Objetivo: cubrir FR5 de acceso manual.

Tareas:

- Agregar boton `Briefing` en cada visita de `SchedulePage`.
- Agregar boton `Briefing` en detalle de `ClientsPage`.
- Preparar `MapView` para abrir briefing desde pins cuando exista seleccion de pins en el plan de mapa inteligente.

Criterios de salida:

- El agente puede abrir briefing aunque no haya trigger por proximidad.
- El mismo panel se reutiliza en todas las entradas.

### Fase 7 - Settings y pulido

Objetivo: cubrir control de usuario y preparar demo.

Tareas:

- Agregar seccion de settings para briefing.
- Permitir habilitar/deshabilitar alertas.
- Permitir configurar distancia de trigger.
- Revisar responsive y convivencia con bottom nav.
- En fase futura de implementacion, ejecutar build; no hacerlo en esta fase de plan.

Criterios de salida:

- El usuario puede controlar alertas y trigger distance.
- La experiencia es no intrusiva y consistente.

## 13. Criterios de aceptacion

- AC1: Al acercarse a una visita programada, se muestra una alerta de briefing.
- AC2: La alerta ofrece `Play Briefing`, `View Summary` y `Dismiss`.
- AC3: `Play Briefing` lee el resumen con voz del navegador.
- AC4: El panel de resumen muestra interacciones recientes, tareas, oportunidades y account updates.
- AC5: El panel muestra warnings de CRM incompleto o desactualizado.
- AC6: El panel muestra focus areas sugeridas.
- AC7: El agente puede abrir briefing manualmente desde Schedule.
- AC8: El agente puede abrir briefing manualmente desde Clients.
- AC9: El sistema permite desactivar notificaciones y ajustar distancia de trigger.
- AC10: Todo funciona con datos locales, sin APIs ni servicios externos.

## 14. Riesgos y mitigaciones

| Riesgo | Mitigacion |
| --- | --- |
| Dos prompts compiten en dashboard | Priorizar `BriefingPrompt` y ofrecer `Start Visit` dentro del panel si aplica |
| El briefing se siente largo | Crear `voiceScript` separado y limitarlo a 2-4 frases |
| La deteccion por minutos de manejo requiere API de rutas | Simular con distancia y `estimateDriveMinutes` local |
| Voz no disponible en navegador | Mostrar panel legible como fallback |
| Datos CRM faltantes no son evidentes | Crear fixtures con campos incompletos intencionales |
| Alertas repetitivas molestan | Guardar dismissed visit ids y agregar settings |

## 15. Orden recomendado de implementacion

1. Tipos y datos dummy.
2. Selectores de contexto CRM.
3. Servicio local de briefing.
4. Estado y acciones de briefing.
5. Prompt de proximidad.
6. Panel de resumen.
7. Voice controls.
8. Acceso manual desde Schedule y Clients.
9. Settings de briefing.
10. QA responsive y flujo de demo.

## 16. Fuera de alcance para esta demo

- AI/RAG real.
- Salesforce real.
- Emails o notas reales.
- Push notifications reales.
- Route engine real.
- GPS monitoring continuo de bajo consumo.
- Encriptacion/seguridad CRM real.
- Voice commands para crear tareas desde el briefing.
- Sentiment analysis real.

