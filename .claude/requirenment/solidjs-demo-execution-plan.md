# Plan de ejecucion - Demo funcional Sales Agent Mobile App

Fecha: 2026-05-15  
Framework objetivo: SolidJS  
Alcance de esta interaccion: planificacion solamente, sin implementacion de codigo.

## 1. Objetivo del demo

Construir un demo funcional con datos dummy para una aplicacion movil de agentes de ventas que integre:

- Dashboard principal con mapa y ubicacion del agente.
- Navegacion inferior persistente: Clients, Schedule, Reporting, Settings.
- Deteccion de llegada a visitas programadas mediante geofencing para contextualizar el inicio de la visita.
- Cuestionario post-entrevista manual o asistido por voz para capturar informacion relevante del cliente.
- Captura, interpretacion simulada y revision de informacion CRM.
- Guardado simulado contra objetos tipo Salesforce.
- Experiencia de progreso diario gamificada.
- Soporte de cola offline simulada.
- Configuracion en Settings de la lista de preguntas usadas durante el cuestionario post-entrevista.

El codigo del demo debera escribirse en ingles: nombres de componentes, servicios, funciones, tipos, constantes, rutas, fixtures, stores y mensajes tecnicos internos.

## 2. Fuentes del requerimiento

Documentos revisados:

- `AI Assisted Customer Visit Registration.pdf`
- `Feature Sales completion activity.pdf`
- `Main App _ Navigation.pdf`

Requerimientos consolidados:

- La app debe iniciar en un dashboard tipo mobile despues de login.
- El mapa debe ser la interfaz principal.
- La ubicacion del agente debe mostrarse en tiempo casi real.
- La informacion CRM debe precargarse para clientes asignados al agente.
- El sitio web debe ser responsive y mobile-first, con apariencia y ergonomia de aplicacion movil.
- La app debe detectar entrada a un radio de visita programada para marcar la visita como iniciada o en progreso.
- Al finalizar la entrevista con el cliente, el agente debe poder abrir un cuestionario de cierre.
- El agente o administrador demo debe poder revisar y ajustar desde Settings las preguntas de la entrevista/cierre que se usaran en el cuestionario.
- El cuestionario de cierre debe poder responderse manualmente o mediante voz.
- El asistente de voz debe recolectar informacion post-entrevista sobre evento, oportunidad, cuenta, tareas, notas, participantes y acciones de seguimiento.
- Antes de guardar, el usuario debe revisar y editar un resumen estructurado.
- La actividad registrada debe actualizar objetos simulados: Event, Task, Opportunity, Account, Contact/Notes.
- La experiencia debe mostrar progreso diario, hitos, streaks y recomendaciones.
- La navegacion inferior debe permanecer accesible.

## 3. Decisiones para el demo

Como el demo debe usar servicios gratuitos, se propone esta aproximacion:

- El geofence no dispara la captura CRM automaticamente; solo ayuda a identificar que la visita inicio o esta en progreso.
- La captura CRM se realiza al finalizar la entrevista con el cliente mediante un cuestionario manual o por voz.
- El resultado del cuestionario se transforma en un resumen editable y despues se guarda en el CRM dummy.
- Mapa: `Leaflet` con tiles de `OpenStreetMap` para evitar costo y llaves de Google Maps. El requerimiento original menciona Google Maps como obligatorio; para demo se documentara como reemplazo gratuito con una capa `MapProvider` intercambiable.
- Geolocalizacion: Browser Geolocation API (`navigator.geolocation`) con fallback de simulacion manual.
- Geofencing: calculo local con formula Haversine contra coordenadas dummy.
- Voz a texto: Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) cuando este disponible.
- Texto a voz: Web Speech API (`speechSynthesis`).
- AI/NLP: motor local dummy basado en preguntas guiadas, keywords y reglas para mapear respuestas a campos CRM.
- Push notification real: se sustituye por prompt/toast in-app para evitar service worker y permisos avanzados en el primer demo. En este demo se usara principalmente para avisar llegada o visita en progreso, no para forzar captura inmediata.
- Salesforce: se simula con fixtures, stores y un servicio `mockCrmService`.
- Offline queue: se simula con `localStorage` o `IndexedDB` ligera.

## 4. Alcance funcional del MVP

### 4.1 Login y sesion dummy

Crear una pantalla de login simple con usuario demo.

Resultado esperado:

- El usuario inicia sesion como un agente de ventas dummy.
- La app redirige al dashboard principal.
- Se carga informacion asignada al agente: clientes, visitas, oportunidades y actividades.

Datos sugeridos:

- Agent: `Sofia Rivera`
- Territory: `Mexico City West`
- Today progress: `0%`
- Streak: `4 days`

### 4.2 Dashboard con mapa

Crear una vista principal estilo mobile-first.

Elementos:

- Mapa full-screen como superficie principal.
- Marcador de ubicacion actual del agente.
- Pins de clientes/visitas programadas.
- Estados de pin:
  - Pending: gris.
  - In progress: azul.
  - Completed: verde.
- Widget compacto de progreso diario.
- Bottom navigation persistente.

Fallback:

- Si el navegador no concede ubicacion, mostrar mensaje y boton `Use demo location`.
- Permitir mover la ubicacion dummy cerca de una visita para disparar el geofence y marcar la visita como `In Progress`.

### 4.3 Clientes

Crear modulo `Clients` con datos precargados.

Elementos:

- Lista de cuentas asignadas.
- Detalle de cuenta.
- Contactos.
- Oportunidades abiertas.
- Ultimas actividades.
- Notas y attachments dummy.

Este modulo debe ser suficiente para dar contexto al asistente de voz.

### 4.4 Schedule

Crear modulo `Schedule` con visitas del dia.

Elementos:

- Lista de visitas programadas.
- Hora, cliente, direccion, distancia y estado.
- Boton para centrar visita en mapa.
- Boton para simular llegada.
- Boton para finalizar entrevista.
- Estado de visita: Scheduled, InProgress, InterviewFinished, Questionnaire, Completed.

### 4.5 Geofence y estado de visita

Implementar un servicio local `geofenceService`.

Logica:

- Cada visita tiene `latitude`, `longitude` y `radiusMeters`.
- La ubicacion del agente se compara contra visitas activas.
- Si la distancia es menor o igual al radio, se marca `InProgress`.
- La app muestra un prompt contextual:
  - `Start Visit`
  - `Open Visit Context`
  - `Dismiss`
- El agente realiza la entrevista con el cliente fuera del cuestionario.
- Al terminar la entrevista, el agente selecciona `Finish Interview` desde Schedule, mapa o detalle de visita.

El contexto de visita debe precargar:

- Customer name.
- Scheduled event.
- Account summary.
- Open opportunities.
- Previous activities.

### 4.6 Cuestionario post-entrevista manual o por voz

Crear flujo `VisitCompletionQuestionnaire`.

Estados:

- Idle.
- Manual.
- Listening.
- Processing.
- Review.
- Saved.

Modo de captura:

- `Manual questionnaire`: el agente responde campos y preguntas desde formularios tactiles.
- `Voice questionnaire`: el asistente lee las preguntas y captura respuestas por voz.
- Ambos modos deben producir el mismo modelo de datos para CRM.

Preguntas del cuestionario post-entrevista:

- `How did the meeting go?`
- `Was the customer available?`
- `How long did the visit last?`
- `Did you discuss any new sales opportunities?`
- `Was there any change in the opportunity stage?`
- `Did any account information change?`
- `Would you like me to create a follow-up task?`
- `Should I schedule another meeting?`
- `Do you want to assign any action items?`

Captura:

- Usar voz real si el navegador soporta Web Speech API.
- Permitir entrada manual como fallback.
- Mostrar transcripcion en vivo.
- Usar `speechSynthesis` para leer preguntas del asistente.
- Permitir cambiar de voz a manual si el reconocimiento falla.

### 4.7 Interpretacion dummy y mapeo CRM

Crear servicio `visitInterpreterService`.

Salida estructurada sugerida:

- `eventUpdate`: outcome, duration, notes.
- `opportunityUpdate`: stage, amount, probability, nextSteps.
- `accountUpdate`: risks, stakeholders, status.
- `tasks`: follow-up actions, due dates, owner.
- `attachments`: screenshots o evidencias dummy.

La interpretacion puede usar reglas simples:

- Palabras como `budget`, `timeline`, `proposal`, `next week` actualizan Opportunity.
- Palabras como `risk`, `escalation`, `new stakeholder` actualizan Account.
- Frases como `follow up`, `send`, `call`, `schedule` crean Task.

### 4.8 Review summary

Antes de guardar, mostrar una pantalla editable.

Secciones:

- Extracted notes.
- Updated fields.
- Suggested CRM updates.
- New tasks/events.
- Attachments.

Acciones:

- Editar campos.
- Eliminar sugerencias.
- Agregar nota manual.
- Confirm submission.

### 4.9 Guardado simulado y offline queue

Crear `mockCrmService`.

Comportamiento online:

- Actualizar stores locales.
- Cambiar visita a `Completed`.
- Incrementar progreso diario.
- Mostrar confirmacion.

Comportamiento offline:

- Si `networkStatusService` esta en offline, guardar payload en cola.
- Mostrar `Pending sync`.
- Al volver online, sincronizar automaticamente.

### 4.10 Progreso diario gamificado

Crear `dailyCompletionService`.

Modelo inicial:

| Accion | Contribucion |
| --- | ---: |
| Start scheduled visit | 10% |
| Complete post-interview questionnaire | 20% |
| Update opportunity | 15% |
| Add follow-up task | 10% |
| Add screenshots/attachments | 5% |
| Complete all scheduled visits | 20% |
| End-of-day summary completion | 20% |

Hitos:

- 25%: `Great Start!`
- 50%: `You are on track!`
- 75%: `Excellent field activity!`
- 100%: `Daily Mission Complete!`

UI:

- Barra de progreso persistente.
- Ring de progreso en perfil o dashboard.
- Animacion ligera al subir porcentaje.
- Mensajes profesionales, no infantiles.
- Recomendacion inteligente: `Add follow-up notes to reach 80%`.

### 4.11 Responsividad y apariencia de aplicacion movil

Aunque el entregable sera un sitio web, la experiencia debe asemejar una aplicacion movil.

Principios:

- Diseno mobile-first desde la primera fase.
- Layout optimizado para pantallas de telefono.
- Bottom navigation fija y siempre visible.
- Superficies tactiles con tamanos comodos para uso con pulgar.
- Mapa como area principal en dashboard, sin composicion tipo landing page.
- Modales, prompts y panels deben comportarse como bottom sheets o overlays propios de mobile apps.
- En desktop, centrar la experiencia en un contenedor tipo dispositivo o usar una vista responsive limitada para conservar la sensacion de app movil.
- Evitar tablas anchas; preferir cards compactas, listas y detalles expandibles.
- Validar breakpoints minimos: 360px, 390px, 430px, 768px y desktop.
- Mantener textos, botones y navegacion sin overlaps ni cortes.

Criterios visuales:

- En mobile, la app debe ocupar toda la pantalla disponible.
- En desktop, debe seguir viendose como una mobile web app y no como un dashboard de escritorio tradicional.
- La navegacion principal debe poder usarse sin teclado.
- Los flujos principales deben completarse con una sola mano.

### 4.12 Settings y configuracion de preguntas de entrevista

Crear modulo `Settings` con una seccion para administrar la lista de preguntas usadas en el cuestionario post-entrevista.

Objetivo:

- Permitir que el demo muestre que el flujo de entrevista puede adaptarse sin cambiar codigo.
- Centralizar las preguntas que consumen el modo manual y el asistente de voz.
- Mantener una configuracion simple, persistida localmente, adecuada para demo.

Elementos:

- Seccion `Interview questions`.
- Lista ordenada de preguntas activas.
- Switch para activar/desactivar una pregunta.
- Acciones para agregar, editar y eliminar preguntas dummy.
- Control para reordenar preguntas o moverlas arriba/abajo.
- Boton `Restore defaults` para volver a la lista base.
- Indicador de cuantas preguntas activas se usaran en el cuestionario.

Reglas:

- Las preguntas deben guardarse en ingles, igual que el codigo y microcopy funcional del demo.
- El cuestionario manual y el asistente de voz deben leer la misma fuente de preguntas configuradas.
- Las preguntas desactivadas no deben aparecer durante la captura.
- Debe existir al menos una pregunta activa; si el usuario intenta desactivar todas, mostrar validacion.
- Los cambios pueden persistirse en `localStorage` para mantener el demo ligero.

Preguntas default:

- `How did the meeting go?`
- `Was the customer available?`
- `How long did the visit last?`
- `Did you discuss any new sales opportunities?`
- `Was there any change in the opportunity stage?`
- `Did any account information change?`
- `Would you like me to create a follow-up task?`
- `Should I schedule another meeting?`
- `Do you want to assign any action items?`

UX esperada:

- En Settings, el agente puede ajustar la lista antes de iniciar el flujo de visita.
- Al abrir `VisitCompletionQuestionnaire`, el flujo toma un snapshot de las preguntas activas para evitar cambios a mitad de captura.
- En modo voz, `speechSynthesis` lee las preguntas activas en el orden configurado.
- En modo manual, el formulario renderiza los mismos prompts con campos de respuesta.

## 5. Arquitectura propuesta

Estructura sugerida:

```text
src/
  app/
    App.tsx
    routes.tsx
  components/
    BottomNavigation.tsx
    DailyProgressWidget.tsx
    MapView.tsx
    VisitStatusPrompt.tsx
    VoiceAssistantPanel.tsx
    ManualQuestionnaire.tsx
    InterviewQuestionsSettings.tsx
    ReviewSummary.tsx
  pages/
    LoginPage.tsx
    DashboardPage.tsx
    ClientsPage.tsx
    SchedulePage.tsx
    ReportingPage.tsx
    SettingsPage.tsx
  services/
    geolocationService.ts
    geofenceService.ts
    speechRecognitionService.ts
    speechSynthesisService.ts
    visitInterpreterService.ts
    mockCrmService.ts
    dailyCompletionService.ts
    offlineQueueService.ts
    interviewQuestionService.ts
  stores/
    sessionStore.ts
    crmStore.ts
    locationStore.ts
    visitStore.ts
    progressStore.ts
    settingsStore.ts
  data/
    agents.ts
    accounts.ts
    contacts.ts
    opportunities.ts
    visits.ts
    activities.ts
    interviewQuestions.ts
  types/
    crm.ts
    location.ts
    visit.ts
    progress.ts
    settings.ts
```

Librerias sugeridas:

- SolidJS.
- Solid Router.
- Leaflet.
- TypeScript.
- CSS Modules o styles por componente.
- LocalStorage/IndexedDB para persistencia demo.

## 6. Modelo de datos dummy

Entidades minimas:

- `Agent`
- `Account`
- `Contact`
- `Opportunity`
- `ScheduledVisit`
- `ActivityEvent`
- `Task`
- `Attachment`
- `DailyCompletion`
- `OfflineQueueItem`
- `InterviewQuestion`
- `InterviewQuestionSettings`

Modelo sugerido para preguntas de entrevista:

```ts
type InterviewQuestion = {
  id: string;
  prompt: string;
  isActive: boolean;
  order: number;
  category: 'meeting' | 'opportunity' | 'account' | 'followUp';
  answerType: 'text' | 'yesNo' | 'duration';
};
```

Ejemplo de visitas:

- Acme Corporation - visita activa cerca de una ubicacion demo.
- Globex Manufacturing - visita pendiente.
- Initech Solutions - visita completada.

Coordenadas demo:

- Usar coordenadas de una zona urbana conocida para que el mapa sea visualmente claro.
- Incluir una ubicacion default del agente cercana a la primera visita para facilitar el geofence.

## 7. Plan de ejecucion por fases

### Fase 1 - Bootstrap y base visual

Objetivo: preparar la app SolidJS y su shell mobile-first.

Tareas:

- Crear proyecto SolidJS con TypeScript.
- Definir rutas principales.
- Crear layout mobile-first con bottom navigation.
- Definir breakpoints responsive y shell visual tipo mobile app.
- Crear tema visual profesional para sales/CRM.
- Cargar fixtures dummy.
- Implementar login dummy.

Criterios de salida:

- Login redirige a dashboard.
- Bottom navigation cambia entre pantallas.
- Datos dummy se cargan en memoria.
- La UI se visualiza como aplicacion movil en anchos de 360px a 430px y conserva una presentacion tipo app en desktop.

### Fase 2 - Dashboard de mapa y ubicacion

Objetivo: implementar la experiencia principal del mapa.

Tareas:

- Integrar Leaflet/OpenStreetMap.
- Crear `MapView`.
- Mostrar ubicacion real o dummy del agente.
- Mostrar pins de visitas/clientes.
- Manejar permiso denegado.
- Agregar control para `Use demo location`.

Criterios de salida:

- El dashboard muestra mapa interactivo.
- Se ve el agente y al menos tres clientes.
- La app funciona aunque el usuario niegue permisos.

### Fase 3 - Schedule, clientes y contexto CRM

Objetivo: completar la informacion base para el flujo de visita.

Tareas:

- Implementar `ClientsPage`.
- Implementar `SchedulePage`.
- Crear detalle basico de cuenta y oportunidad.
- Conectar visitas con cuentas, contactos y oportunidades.
- Permitir centrar mapa desde una visita.
- Crear base de `SettingsPage` con seccion inicial para preguntas de entrevista.
- Cargar preguntas default desde fixtures.
- Persistir cambios simples de preguntas en estado local o `localStorage`.

Criterios de salida:

- La app muestra clientes asignados.
- La app muestra visitas del dia.
- Cada visita tiene contexto CRM asociado.
- Settings muestra la lista de preguntas configurables para el cuestionario.

### Fase 4 - Geofence y estado de entrevista

Objetivo: detectar llegada a visita programada y controlar el estado previo al cuestionario.

Tareas:

- Implementar `geolocationService`.
- Implementar `geofenceService`.
- Calcular distancia con Haversine.
- Detectar entrada al radio.
- Mostrar `VisitStatusPrompt`.
- Permitir simular llegada desde Schedule.
- Permitir marcar `Finish Interview` para habilitar el cuestionario de cierre.

Criterios de salida:

- Al entrar al geofence, la visita cambia a `InProgress`.
- El usuario puede abrir contexto de la visita o descartar el prompt.
- El cuestionario solo se inicia despues de marcar la entrevista como finalizada.

### Fase 5 - Cuestionario manual y asistente de voz

Objetivo: crear el flujo de captura post-entrevista en modo manual y modo voz.

Tareas:

- Crear `speechRecognitionService` con Web Speech API.
- Crear fallback manual para navegadores no soportados.
- Crear `speechSynthesisService`.
- Implementar cuestionario manual.
- Implementar panel de preguntas guiadas por voz.
- Mostrar transcripcion y respuestas capturadas.
- Consumir preguntas activas desde la configuracion de Settings.
- Tomar snapshot de preguntas activas al iniciar el cuestionario.

Criterios de salida:

- El usuario puede responder el cuestionario de cierre por voz o manualmente.
- El asistente avanza por preguntas en modo voz.
- Las respuestas quedan guardadas en estado temporal.
- Las preguntas usadas por voz y manual coinciden con la lista activa configurada en Settings.

### Fase 6 - Interpretacion dummy y review summary

Objetivo: convertir la conversacion en actualizaciones CRM simuladas.

Tareas:

- Implementar `visitInterpreterService`.
- Mapear respuestas a Event, Opportunity, Account y Task.
- Crear pantalla `ReviewSummary`.
- Permitir edicion y eliminacion de sugerencias.
- Agregar attachment dummy o subida local opcional.

Criterios de salida:

- La app genera un resumen estructurado.
- El usuario puede modificarlo antes de guardar.

### Fase 7 - Guardado, offline queue y progreso diario

Objetivo: cerrar el ciclo funcional del demo.

Tareas:

- Implementar `mockCrmService`.
- Actualizar stores locales al guardar.
- Implementar `offlineQueueService`.
- Implementar `dailyCompletionService`.
- Mostrar milestones y recomendaciones.
- Cambiar pins y visitas a `Completed`.

Criterios de salida:

- Guardar actualiza datos CRM dummy.
- El progreso diario aumenta.
- Los estados de mapa y schedule cambian.
- Offline queue simula sincronizacion pendiente.

### Fase 8 - Pulido, QA y demo script

Objetivo: preparar el demo para presentacion.

Tareas:

- Revisar responsive mobile y desktop estrecho.
- Validar apariencia mobile app en desktop mediante contenedor centrado o ancho maximo controlado.
- Validar estados de permiso de ubicacion y microfono.
- Validar navegador sin Web Speech API.
- Agregar microcopy final.
- Crear guion de demo paso a paso.
- Ejecutar pruebas manuales de flujo completo.

Criterios de salida:

- Demo end-to-end funcional.
- Flujo feliz documentado.
- Casos fallback demostrables.
- Responsividad validada en breakpoints mobile y desktop.

## 8. Criterios de aceptacion del demo

- El usuario puede iniciar sesion con un agente dummy.
- El dashboard muestra mapa, ubicacion y clientes asignados.
- La navegacion inferior permite abrir Clients, Schedule, Reporting y Settings.
- Settings permite administrar la lista de preguntas de entrevista/cierre usadas por el cuestionario.
- La app detecta o simula llegada a una visita y la marca como `InProgress`.
- El agente puede finalizar la entrevista y abrir el cuestionario de cierre.
- El cuestionario captura respuestas por voz o de forma manual.
- La app genera un resumen editable.
- La confirmacion actualiza objetos CRM dummy.
- La visita cambia a completada.
- El progreso diario sube y muestra hitos.
- La app muestra comportamiento offline simulado.
- La interfaz es responsive y asemeja una aplicacion movil tanto en telefono como en navegador desktop.
- Todo el codigo implementado en fases futuras debera estar en ingles.

## 9. Riesgos y mitigaciones

| Riesgo | Mitigacion |
| --- | --- |
| Web Speech API no soportada en todos los navegadores | Fallback manual obligatorio |
| Permisos de ubicacion denegados | Modo demo con ubicacion simulada |
| Google Maps del requerimiento implica costo/API key | Usar Leaflet/OSM en demo y aislar provider |
| Interpretacion AI podria esperarse real | Documentar motor dummy y preparar interfaz reemplazable |
| Geofence en navegador puede ser inconsistente | Agregar boton de simulacion de llegada y permitir iniciar visita manualmente |
| El usuario podria iniciar captura antes de terminar la entrevista | Bloquear o desalentar el cuestionario hasta estado `InterviewFinished` |
| Cambios en preguntas durante una captura podrian generar inconsistencias | Tomar snapshot de preguntas activas al iniciar el cuestionario |
| Notificaciones push requieren configuracion extra | Usar prompt/toast in-app en MVP |

## 10. Entregables esperados al finalizar implementacion

- App SolidJS ejecutable localmente.
- Datos dummy incluidos en `src/data`.
- Demo mobile-first.
- Experiencia responsive con apariencia de mobile app.
- Servicios gratuitos de geolocalizacion y voz.
- Flujo end-to-end de entrevista finalizada y cuestionario guardado en CRM dummy.
- Settings con preguntas de entrevista configurables y persistencia local.
- Progreso diario gamificado.
- README con instrucciones de ejecucion.
- Guion de demo funcional.

## 11. Siguiente paso recomendado

En la siguiente interaccion se puede iniciar la Fase 1: crear el proyecto SolidJS, definir la estructura base, fixtures dummy y layout principal mobile-first.
