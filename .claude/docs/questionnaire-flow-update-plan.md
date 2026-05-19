# Plan de actualizacion - Flujo guiado de cuestionario post-entrevista

Fecha: 2026-05-19  
Estado: plan de actualizacion, sin implementacion aplicada en este documento.

## 1. Objetivo

Actualizar el flujo de captura post-entrevista para que el agente responda las preguntas una por una en una pantalla dedicada, con navegacion `Previous` / `Next`, soporte manual y voz por pregunta, y acceso directo desde el Dashboard.

Problema actual:

- `QuestionnairePanel` se renderiza al final de `SchedulePage`, despues de todas las visitas.
- Cuando el agente inicia la captura, las preguntas quedan hasta abajo y el flujo no se siente como una entrevista guiada.
- El cuestionario solo se inicia de forma clara desde Schedule; falta una entrada visible desde la pagina principal.

Resultado esperado:

- Al iniciar el cuestionario, la app navega a una pantalla dedicada.
- Se muestra una sola pregunta por paso.
- El agente puede responder manualmente o capturar por voz la respuesta de la pregunta actual.
- El agente puede avanzar, retroceder y generar el review al completar el escenario.
- Dashboard permite iniciar o continuar el cuestionario cuando una visita esta lista para captura.

## 2. Cambios funcionales

### 2.1 Nueva pantalla dedicada de cuestionario

Crear una ruta dedicada para el flujo:

```text
/visits/:visitId/questionnaire
```

La pantalla debe llamarse internamente `QuestionnairePage` y reemplazar el render inline actual de `QuestionnairePanel` dentro de `SchedulePage`.

Comportamiento:

- Al entrar, validar que la visita exista.
- Si la visita esta en `InterviewFinished`, iniciar el cuestionario con snapshot de preguntas activas.
- Si la visita ya esta en `Questionnaire`, continuar con el estado actual.
- Si la visita esta en `Scheduled` o `InProgress`, mostrar estado bloqueado con accion para regresar a Schedule.
- Si la visita esta en `Completed`, mostrar resumen de visita completada o accion para volver a Reporting/Schedule.

### 2.2 Flujo una pregunta a la vez

Cambiar el cuestionario de lista completa a stepper guiado:

- Mostrar contexto superior: cliente, visita, progreso `Question X of Y`.
- Mostrar solo la pregunta actual.
- Mostrar campo de respuesta manual para esa pregunta.
- Mostrar boton de voz para capturar la respuesta de esa pregunta.
- Mostrar transcripcion/valor capturado en el mismo campo.
- Botones:
  - `Previous`, deshabilitado en la primera pregunta.
  - `Next`, activo cuando hay respuesta o se permite saltar.
  - `Generate review`, solo en la ultima pregunta.
  - `Save draft` opcional si se quiere conservar respuestas parciales en memoria local.

Regla de avance recomendada:

- Permitir avanzar sin respuesta, pero mostrar un indicador `No answer captured` para conservar fluidez demo.
- El review debe usar todas las respuestas disponibles y omitir vacios.

### 2.3 Modo manual y modo voz

Mantener el selector `Manual` / `Voice`, pero aplicado a la pregunta actual:

- Manual:
  - Textarea/input visible.
  - El usuario escribe o edita la respuesta.
- Voice:
  - Boton `Listen`.
  - `speechSynthesis` lee la pregunta actual.
  - `SpeechRecognition` captura la respuesta y actualiza el campo.
  - Al terminar la captura, no avanzar automaticamente; mostrar la respuesta y dejar que el usuario presione `Next`.

Fallback:

- Si Web Speech API no existe, mostrar mensaje compacto y mantener input manual activo.

### 2.4 Entrada desde Dashboard

Agregar accion principal en el card de proxima visita del Dashboard segun estado:

- `Scheduled`: `Start Visit`.
- `InProgress`: `Finish Interview`.
- `InterviewFinished`: `Start Questionnaire`.
- `Questionnaire`: `Continue Questionnaire`.
- `Completed`: mostrar estado completado, sin accion de cuestionario.

Al seleccionar `Start Questionnaire` o `Continue Questionnaire`, navegar a:

```text
/visits/{visitId}/questionnaire
```

### 2.5 Ajustes en Schedule

Schedule debe conservar las acciones de visita, pero cambiar `Open Questionnaire` para navegar a la ruta dedicada.

Eliminar de `SchedulePage`:

- Render de `QuestionnairePanel`.
- Render de `ReviewPanel`, salvo que se decida mover el review tambien a la ruta dedicada.

Decision para implementacion:

- El review debe vivir dentro de `QuestionnairePage`, despues de `Generate review`, para que todo el cierre de entrevista este en una sola experiencia dedicada.

## 3. Cambios tecnicos propuestos

### 3.1 Rutas y componentes

Actualizar `src/main.tsx`:

- Agregar ruta `/visits/:visitId/questionnaire`.

Actualizar `src/App.tsx`:

- Crear/exportar `QuestionnairePage`.
- Convertir `QuestionnairePanel` en componente de step actual o reemplazarlo por `QuestionnaireStepper`.
- Mover `ReviewPanel` para que se renderice dentro de `QuestionnairePage`.
- Ajustar `VisitActions` para navegar a la nueva ruta.
- Ajustar `DashboardPage` para mostrar accion contextual de cuestionario.

Componentes sugeridos:

- `QuestionnairePage`
- `QuestionnaireStepper`
- `QuestionnaireQuestionCard`
- `QuestionnaireReviewPanel`

Para mantener el cambio acotado, pueden vivir inicialmente en `src/App.tsx`; luego se podran extraer a archivos separados.

### 3.2 Store y acciones

Extender acciones actuales en `src/store.ts`:

- `beginQuestionnaire(visitId, mode)` se mantiene, pero debe ser idempotente:
  - Si ya existe `questionnaire.visitId === visitId` y hay snapshot, no borrar respuestas al navegar de nuevo.
  - Si es una visita diferente, crear snapshot nuevo y limpiar respuestas.
- Agregar `previousQuestion()`.
- Agregar `goToQuestion(index)`.
- Cambiar `nextVoiceQuestion()` por `nextQuestion()` o mantener alias.
- Agregar helper derivado o funcion:
  - `canOpenQuestionnaire(visitStatus)`.
  - `getQuestionnaireProgress()`.

Reglas:

- No perder respuestas al cambiar de manual a voz.
- No perder respuestas al navegar fuera y volver mientras la app siga abierta.
- `Generate review` debe usar el snapshot fijo, no la configuracion actual de Settings.

### 3.3 UX y estilos

Agregar estilos en `src/styles.css`:

- Layout de pantalla dedicada con header fijo/compacto.
- Stepper/progress bar de preguntas.
- Card grande para la pregunta actual.
- Controles inferiores tipo mobile action bar.
- Estados responsive para 360px, 390px, 430px, 768px y desktop.

Criterios visuales:

- La pregunta actual debe aparecer en el primer viewport, no debajo de la lista de visitas.
- Los botones `Previous`, `Next` y `Generate review` deben quedar visibles sin provocar overlap con bottom nav.
- En desktop se mantiene contenedor tipo mobile app.

## 4. Escenarios de prueba

### Flujo principal desde Schedule

1. Login.
2. Abrir Schedule.
3. `Start Visit`.
4. `Finish Interview`.
5. `Open Questionnaire`.
6. Confirmar navegacion a `/visits/:visitId/questionnaire`.
7. Responder pregunta 1 manualmente.
8. Presionar `Next`.
9. Confirmar que aparece pregunta 2.
10. Retroceder con `Previous` y confirmar que la respuesta de pregunta 1 se conserva.
11. Completar o saltar hasta la ultima pregunta.
12. Presionar `Generate review`.
13. Editar review.
14. Confirmar submission.
15. Confirmar visita `Completed` y progreso actualizado.

### Flujo desde Dashboard

1. En Dashboard, usar visita en estado `InterviewFinished`.
2. Presionar `Start Questionnaire`.
3. Confirmar que abre la pantalla dedicada.
4. Capturar respuestas y generar review.

### Voz con fallback

1. Activar modo `Voice`.
2. Si el navegador soporta Web Speech API, presionar `Listen`.
3. Confirmar que se lee la pregunta actual y se captura la respuesta en el campo.
4. Si no hay soporte, confirmar mensaje de fallback y captura manual disponible.

### Settings + snapshot

1. Modificar preguntas en Settings.
2. Iniciar cuestionario.
3. Confirmar que usa preguntas activas configuradas.
4. Cambiar Settings durante el flujo.
5. Volver al cuestionario y confirmar que mantiene el snapshot original.

## 5. Criterios de aceptacion

- El cuestionario ya no aparece al final de Schedule.
- La captura post-entrevista ocurre en pantalla dedicada.
- Se muestra una sola pregunta por vez.
- Hay navegacion `Previous` / `Next`.
- Manual y voz actualizan la misma respuesta de la pregunta actual.
- Dashboard permite iniciar o continuar el cuestionario cuando el estado de visita lo permite.
- El review y guardado siguen funcionando igual que antes.
- El build `npm run build` pasa.
- Validacion visual confirma que no hay solapes en mobile ni desktop.

## 6. Fuera de alcance para esta actualizacion

- Integracion real con Salesforce.
- AI/NLP real.
- Persistencia remota de respuestas parciales.
- Redisenar completo de Settings o Reporting.
- Cambiar el modelo de preguntas configurable ya existente, salvo lo necesario para el stepper.
