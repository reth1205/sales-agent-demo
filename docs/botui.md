# MVP - Bot UX: traduccion y plan de implementacion

Fuente: `docs/MVP - Bot UX.pdf`

Este documento contiene la traduccion al espanol del PDF y un plan de implementacion aterrizado al proyecto actual `sales-agent-demo`.

## Traduccion del contenido

### Encabezados de la tabla

| Texto original | Traduccion |
| --- | --- |
| Item Type | Tipo de elemento |
| ID / Number | ID / numero |
| Title / Component Name | Titulo / nombre del componente |
| Focus / User Story Requirement Statement | Enfoque / declaracion del requerimiento de la historia de usuario |
| Detailed Description / Acceptance Criteria | Descripcion detallada / criterios de aceptacion |

### Historia de usuario

| Campo | Traduccion |
| --- | --- |
| Tipo de elemento | Historia de usuario |
| ID | US-AI-001 |
| Titulo / componente | Espacio de trabajo del asistente de IA para ventas en campo |
| Enfoque | Como representante de ventas en campo, quiero un asistente de IA proactivo que envie briefings contextuales antes de cada reunion y solicite debriefings de voz manos libres despues de la reunion, para entrar preparado a cada visita y registrar al instante actualizaciones completas de CRM, tareas y metricas de seguimiento sin escribir manualmente mientras conduzco. |

#### Criterios de aceptacion

1. El sistema debe disparar una notificacion push con briefing exactamente 15 minutos antes de un evento programado en calendario o ruta.
2. El briefing previo a la reunion debe agregar datos historicos de Salesforce, tareas abiertas y temas recientes del cliente en un resumen facil de escanear.
3. El sistema debe detectar automaticamente la conclusion de la reunion, ya sea mediante un temporizador de 30 minutos o un evento de salida por geocerca, y disparar una notificacion inmediata posterior a la visita.
4. La interfaz posterior a la reunion debe aceptar dictado de voz continuo en streaming para capturar el debriefing.
5. El motor NLP de IA debe extraer con precision y mapear campos de datos para: duracion de la visita, temas discutidos, actualizaciones de oportunidad, estados de tareas, acciones de seguimiento y fechas de reuniones futuras.
6. Las metricas extraidas deben sincronizarse automaticamente con registros de Salesforce y actualizar los KPIs de comportamiento del gerente.

### Epics traducidos

| Tipo | ID | Titulo / componente | Enfoque | Descripcion |
| --- | --- | --- | --- | --- |
| Epic | EPIC-01 | Infraestructura dinamica de disparadores de campo y notificaciones | Enrutamiento temporal y espacial de eventos. | Construir el motor de escucha de eventos en segundo plano que monitorea los calendarios del representante y los vectores activos de ubicacion del dispositivo. Este epic cubre disparar la alerta previa a la reunion segun el tiempo de traslado y lanzar la solicitud de briefing posterior a la reunion al salir de la geocerca o al cumplirse una ventana automatica de reunion de 30 minutos. |
| Epic | EPIC-02 | Ensamblado de briefing previo a la reunion con LLM | Agregacion de datos y sintesis de contenido. | Integrar el backend de la app con un pipeline de modelo de lenguaje grande (LLM) para generar resumenes de cliente en tiempo real. Cuando se dispare una alerta temprana, este modulo debe consultar historiales de cuentas, contactos y leads de Salesforce, aislar bloqueos abiertos o registros de conversaciones previas, y formatearlos en un brief ejecutivo hiperconciso adaptado a vistas moviles. |
| Epic | EPIC-03 | Pipeline NLP posterior a la reunion para extraccion multi-entidad | Ingestion de voz y parsing de datos estructurados. | Desarrollar el motor central de voz a texto usado para el debrief posterior a la reunion. Este pipeline debe tomar audio conversacional sin estructura, grabado por el representante, y extraer un esquema JSON estricto con datos temporales, comerciales y administrativos. |
| Epic | EPIC-04 | Optimizacion de escritura en Salesforce y sincronizacion de KPIs | Integridad de base de datos y manejo de limites de API. | Construir la capa del sistema que ejecuta los datos parseados por la IA. Debe traducir el payload JSON extraido en llamadas paralelas a la API de Salesforce para actualizar registros, marcar tareas como cerradas, generar nuevas tareas de seguimiento y registrar eventos de calendario, mientras actualiza indicadores internos de base de datos para los dashboards analiticos del gerente. |
| Epic | EPIC-05 | Espacio de trabajo de UI de voz gamificado para representantes | Interfaz movil front-end y hooks de experiencia. | Disenar la experiencia movil del asistente. Incluye construir la hoja conversacional de un solo toque, la ventana interactiva de visualizacion de transcripcion y una pantalla de confirmacion posterior al parsing donde los representantes puedan ver los campos que la IA extrajo correctamente antes de confirmar la carga a Salesforce. |

### Detalle del esquema esperado para EPIC-03

El pipeline NLP posterior a la reunion debe extraer:

- Datos temporales: duracion fisica de la reunion, cruzada contra datos de geocerca.
- Datos comerciales: oportunidades identificadas o modificadas.
- Datos administrativos: items de accion completados, checklists de tareas actualizadas y reuniones futuras solicitadas.

## Estado actual del proyecto

La app ya cuenta con una base importante para esta historia:

- `src/views/DashboardPage.tsx`: home basado en mapa, recomendaciones cercanas y ficha inferior de cuenta.
- `src/components/CustomerMapSummarySheet.tsx`: resumen de cuenta, distancia, tiempo estimado, riesgo, acciones de visita y navegacion.
- `src/views/SchedulePage.tsx`: lista de visitas del dia y acciones para iniciar/finalizar visita.
- `src/views/QuestionnairePage.tsx` y `src/components/QuestionnaireStepper.tsx`: captura posterior a entrevista con modo manual/voz, dictado, comandos de voz y simulacion de revision IA.
- `src/components/ReviewPanel.tsx`: confirmacion de datos y simulacion de sincronizacion con Salesforce.
- `src/views/ReportingPage.tsx` y componentes gerenciales: command center, equipo, cuentas, insights y cola de sincronizacion.
- `src/store.ts` y `src/services.ts`: estado global, geocercas, calculos de distancia, interpretacion basica de respuestas y acciones de sincronizacion.

La brecha principal es convertir el flujo actual de cuestionario y mapa en un asistente proactivo completo: notificaciones previas, briefing generado, deteccion formal de fin de reunion, extraccion JSON mas estricta, writeback modelado y KPIs gerenciales derivados.

## Plan de implementacion paso a paso

### 1. Modelar los datos del asistente

Modificar `src/types.ts` para agregar tipos explicitos:

- `AssistantNotification`: tipo, visita, cuenta, momento de disparo, estado leido/descartado.
- `PreMeetingBriefing`: resumen ejecutivo, temas recientes, tareas abiertas, riesgos, oportunidades, contactos sugeridos y preguntas recomendadas.
- `PostMeetingExtraction`: duracion, temas discutidos, cambios de oportunidad, tareas completadas, nuevas tareas, proxima reunion y confianza por campo.
- `SalesforceWritebackStatus`: pendiente, sincronizando, exitoso, error, reintento.
- `BehaviorKpiUpdate`: duracion real, calidad de captura, tareas cerradas, tareas creadas, puntualidad y completitud CRM.

Actualizar `src/store.ts` para incluir `assistant.notifications`, `assistant.briefings`, `assistant.extractions` y `assistant.writebacks`.

### 2. Crear datos demo para briefings previos

Modificar `src/data.ts` para enriquecer cuentas, contactos, oportunidades y actividades con informacion que alimente el briefing:

- Temas recientes por cliente.
- Bloqueos abiertos.
- Ultimas decisiones o riesgos.
- Preguntas sugeridas.
- Tareas abiertas por prioridad.
- Datos de CRM/Salesforce simulados para Account, Contact y Lead.

Esto permitira que EPIC-02 se vea completo aun sin backend real.

### 3. Implementar el motor de eventos temporal y espacial

Modificar `src/services.ts` y `src/store.ts`:

- Crear `shouldTriggerPreMeetingBriefing(visit, currentTime, location)` con regla de 15 minutos antes del evento.
- Crear `shouldTriggerPostMeetingDebrief(visit, location, elapsedMinutes)` con reglas de salida de geocerca y temporizador de 30 minutos.
- Agregar una configuracion demo para presentaciones breves, por ejemplo `assistant.demoTimeScale`, que permita comprimir los 15 y 30 minutos reales a segundos.
- Para la presentacion, simular el briefing previo de 15 minutos con un disparador de 10 a 15 segundos antes de la visita seleccionada.
- Para la presentacion, simular el debrief posterior de 30 minutos con un disparador de 20 a 30 segundos despues de iniciar o finalizar la visita.
- Extender `actions.checkGeofences()` para detectar llegada, salida y cambio de estado de visita.
- Agregar acciones `triggerPreMeetingBriefing`, `triggerPostMeetingDebrief`, `dismissAssistantNotification` y `openAssistantNotification`.

En modo demo, usar la ruta animada actual de `MapDemoControls` y `focusVisitLocation` para simular los disparadores. La regla de negocio debe conservar los valores reales de 15 y 30 minutos, pero la UI de demo debe mostrar una etiqueta clara como "Demo: 15 min simulados en 15 seg" para evitar confusiones durante la presentacion.

Configuracion sugerida:

```ts
const assistantTiming = {
  production: {
    preMeetingLeadMinutes: 15,
    postMeetingWindowMinutes: 30,
  },
  demo: {
    preMeetingLeadSeconds: 15,
    postMeetingWindowSeconds: 30,
  },
};
```

### 4. Construir el briefing previo a la reunion

Crear un componente nuevo, por ejemplo `src/components/PreMeetingBriefingSheet.tsx`, y montarlo en `DashboardPage.tsx` o dentro de `CustomerMapSummarySheet.tsx`.

Debe mostrar:

- Nombre de cuenta, hora de visita y ETA.
- Resumen ejecutivo hiperconciso.
- Tareas abiertas.
- Temas recientes.
- Riesgos y oportunidades.
- Preguntas sugeridas por IA.
- Acciones rapidas: iniciar visita, navegar, abrir cuenta, descartar.

La funcion de armado inicial puede vivir en `src/services.ts` como `buildPreMeetingBriefing(account, contacts, opportunity, tasks, activities)`.

### 5. Convertir el cuestionario en debrief conversacional

Modificar `src/components/QuestionnaireStepper.tsx`:

- Cambiar el copy de "Questionnaire" a "Debrief" o "Asistente".
- Mantener modo manual y voz, pero presentar el flujo como conversacion de un solo toque.
- Agregar indicadores de streaming: escuchando, transcribiendo, detectando entidades, listo para revisar.
- Guardar transcripcion continua en estado, no solo respuestas por pregunta.
- Permitir que las preguntas configuradas funcionen como prompts de seguimiento cuando falten datos.

Modificar `src/views/QuestionnairePage.tsx` para alinear titulo y subtitulo con el nuevo flujo posterior a visita.

### 6. Reemplazar la interpretacion basica por un esquema JSON estricto

Modificar `src/services.ts`:

- Reemplazar o complementar `interpretVisitAnswers` con `extractPostMeetingEntities`.
- Devolver un objeto `PostMeetingExtraction` con campos normalizados.
- Mapear duracion de visita, temas discutidos, oportunidad, tareas, estados, follow-ups y proxima reunion.
- Agregar `confidence` por campo y una lista `missingFields` para pedir seguimiento.

Modificar `ReviewPanel.tsx` para mostrar secciones editables por entidad extraida, no solo outcome/duracion/notas.

### 7. Modelar writeback a Salesforce y calendario

Modificar `src/store.ts`:

- Agregar acciones `buildSalesforcePayload`, `submitSalesforceWriteback`, `retryWriteback` y `markWritebackSynced`.
- Mantener compatibilidad con `offlineMode` y `queue`.
- Registrar cada actualizacion como evento auditable.

Modificar `ReviewPanel.tsx`:

- Mostrar pasos separados: Account, Opportunity, Task, Calendar Event y KPI Sync.
- Incluir errores simulados y reintento cuando `offlineMode` este activo.

### 8. Actualizar KPIs gerenciales

Modificar `src/selectors.ts`, `src/services.ts` y componentes de reporting:

- Calcular calidad de captura CRM desde los campos extraidos.
- Calcular puntualidad de visita usando hora programada, llegada y salida.
- Agregar metrica de tareas cerradas y tareas creadas por debrief.
- Mostrar en `ReportingPage.tsx` y/o `AgentDrillDownSheet.tsx` el impacto del asistente: visitas con briefing, debriefs completados, sincronizaciones exitosas y pendientes.

### 9. Ajustar navegacion y textos de producto

Modificar:

- `src/components/BottomNavigation.tsx`: evaluar cambiar `Schedule` por `My Day` y `Clients` por `Accounts` o por los nombres definidos en el MVP.
- `src/views/SchedulePage.tsx`: renombrar cabecera a "My Day" y mostrar briefing pendiente junto a cada visita.
- `src/views/ClientsPage.tsx`: agregar acceso a briefing y actividad reciente.
- `src/components/Header.tsx`: revisar subtitulos para que reflejen el asistente proactivo.

Este paso tambien puede incluir traduccion de UI a espanol si el MVP debe presentarse en espanol.

### 10. Agregar estados visuales y accesibilidad movil

Modificar `src/styles.css` y componentes nuevos:

- Estado de notificacion previa.
- Estado de debrief posterior.
- Indicadores de confianza de extraccion.
- Semaforo de completitud: rojo, amarillo, verde.
- Estados vacios, loading, error y offline.
- Botones con iconos de `lucide-solid` para microfono, confirmar, navegar, Salesforce, calendario y reintentar.

Validar que no haya textos que se monten sobre el mapa o sobre la hoja inferior en viewport movil.

### 11. Persistencia local y reseteo de demo

Modificar `src/store.ts`:

- Agregar keys de `localStorage` para notificaciones, briefings, extracciones y writebacks.
- Incluir estos datos en `resetDemoActivity()` y `resetApp()`.
- Evitar que una notificacion descartada reaparezca inmediatamente en la demo.

### 12. Pruebas y verificacion

Ejecutar:

```bash
npm run build
```

Verificar manualmente en la app:

1. Login y llegada al mapa.
2. Simulacion de ruta hasta una visita.
3. Disparo de briefing previo usando tiempo comprimido: 15 minutos reales simulados en 10 a 15 segundos.
4. Inicio y fin de visita.
5. Disparo de debrief posterior usando tiempo comprimido: 30 minutos reales simulados en 20 a 30 segundos.
6. Captura por voz o manual.
7. Revision de entidades extraidas.
8. Confirmacion de writeback.
9. Actualizacion en reporte gerencial y cola offline.

## Orden sugerido de entrega

1. Base de datos y tipos del asistente.
2. Briefing previo con datos demo.
3. Disparadores de geocerca y tiempo en modo demo.
4. Debrief conversacional y transcripcion continua.
5. Extraccion JSON y pantalla de confirmacion.
6. Writeback simulado con cola offline.
7. KPIs gerenciales y pulido visual.

## Riesgos y decisiones pendientes

- Definir si la UI final se mantendra en ingles o se traducira por completo al espanol.
- Confirmar proveedor real de LLM y si la extraccion sera backend, edge function o cliente demo.
- Confirmar si Salesforce sera integracion real en MVP o simulacion visual.
- Definir permisos reales de geolocalizacion y notificaciones push.
- Definir reglas exactas para salida de geocerca cuando el usuario no conceda ubicacion.
- Definir esquema JSON contractual antes de conectar APIs reales.
- Definir los valores exactos de compresion temporal para demo, recomendados: 15 segundos para el briefing previo y 30 segundos para el debrief posterior.
