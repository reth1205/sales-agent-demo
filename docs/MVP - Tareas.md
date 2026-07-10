# MVP - Descripción de tareas

Fuente: `docs/MVP - Tareas.pdf`

Este documento resume y traduce al español las tareas y notas del PDF. El enfoque es convertir las observaciones originales en una lista clara de trabajo para construir y dar seguimiento al MVP de la aplicación.

## Resumen del alcance

El MVP describe una aplicación para representantes de ventas en campo y gerentes. La app debe combinar CRM, calendario, mapas, geolocalización, notificaciones, asistencia con IA, captura por voz y reportes de progreso para reducir trabajo manual y mejorar la visibilidad de las visitas comerciales.

## Tareas traducidas y organizadas

### 1. Login

Implementar el flujo de inicio de sesión para que los usuarios puedan acceder a la aplicación de forma segura.

### 2. Pantalla principal

Construir la pantalla principal de la app como punto de entrada para el representante. Debe mostrar el estado del día, tareas relevantes, clientes, mapa y progreso.

### 3. Vista "Mi día" con calendario

Reemplazar la vista de agenda actual por una sección llamada "Mi día". Debe incluir una vista de calendario, visitas programadas y tareas del día.

Notas funcionales:

- La agenda actual no es suficiente.
- La experiencia debe sentirse como una planeación diaria de trabajo.
- Debe conectar con calendario y tareas del CRM.

### 4. Capacidades de IA para preguntas y palabras clave

Agregar una capacidad de IA, usando Copilot, Gemini u otro modelo equivalente, para identificar palabras clave de las visitas o cuentas.

Objetivo:

- Detectar temas importantes.
- Generar preguntas de seguimiento.
- Ayudar al representante a capturar mejor la información comercial.

### 5. Progreso de visitas completadas

Mostrar el avance de visitas completadas contra la meta esperada.

Ejemplo del PDF:

- Visitas completadas: 1 de 3.
- Meta esperada: 8.
- Si el avance es bajo, el estado debe mostrarse en rojo.

### 6. Mejorar apariencia del mapa

Actualizar el mapa para que se vea más claro, brillante y vivo.

La experiencia del mapa debe ser fácil de usar en campo y debe transmitir actividad, ubicación y prioridad de clientes.

### 7. Semáforo de estado

Usar un código de colores para comunicar desempeño:

- Rojo: el representante está en riesgo o no está cumpliendo.
- Amarillo: avance intermedio, no malo pero tampoco suficiente.
- Verde: cumplimiento adecuado.

Este patrón debe aplicarse a progreso, tareas y reportes.

### 8. Accesos desde mapa y cliente

Agregar accesos directos desde la vista de mapa y cliente.

Requerimientos:

- Mostrar íconos como Google Maps, sitio web y ubicación.
- Al tocar el cliente, abrir la ficha del cliente.
- Al tocar la ubicación, navegar al cliente en el mapa.
- Al salir del detalle, regresar al mapa.

### 9. Alertas de cuentas cercanas sin actividad

En la pantalla de inicio, mostrar una advertencia cuando existan cuentas cercanas sin actividad reciente.

Uso esperado:

- Detectar cuentas en el área.
- Revisar si no han tenido interacción por días o semanas.
- Mostrar un símbolo de precaución para que el representante pueda actuar.

### 10. Rutas y tiempos estimados

Cuando el representante esté manejando, la app debe mostrar:

- Ruta del día.
- Tiempo estimado de traslado.
- Clientes por visitar.
- Estado de avance.

Esta información debe estar visible para el representante y también para el gerente.

### 11. Vista de gerente en mapa

Construir una vista para gerente que permita ver a todos los agentes o representantes en el mapa.

Requerimientos:

- El gerente puede alejar el zoom para ver al equipo completo.
- Al seleccionar un representante, puede ver su ruta del día.
- Debe poder revisar progreso, visitas y desempeño.

### 12. Reporte gerencial del MVP

Incluir un reporte de gerente dentro del MVP.

El reporte debe mostrar:

- Porcentaje de tareas completadas por representante.
- Avance semanal.
- Ruta realizada.
- Clientes visitados.
- Millaje o recorrido.
- Estado de captura de datos.

Código de color sugerido:

- Rojo: no se ingresaron datos.
- Verde: se completaron tareas y datos requeridos.

### 13. Revisión de ruta y progreso

Permitir revisar cómo va cada representante según su ruta y avance.

La app debe responder preguntas como:

- ¿Qué clientes ya visitó?
- ¿Qué visitas faltan?
- ¿Está cumpliendo su plan del día?
- ¿Está capturando la información necesaria?

### 14. Alta de prospectos fuera del CRM

Agregar una historia futura para que el representante pueda crear una cuenta prospecto que aún no existe en el CRM.

Flujo esperado:

- El representante identifica una cuenta nueva.
- La IA recolecta la información necesaria.
- La app confirma los datos.
- La información se envía al CRM para crear la cuenta.

Nota: el PDF indica que esto no necesariamente es parte del MVP inicial, pero sí es una capacidad deseada para una fase posterior.

### 15. Menú desplegable de clientes

Crear un menú desplegable para seleccionar clientes.

Al seleccionar un cliente, debe abrirse la información completa y permitir colapsar o expandir secciones.

### 16. Replicar vista de cliente desde Salesforce

La ficha de cliente debe replicar la forma en que Salesforce presenta la información del cliente.

Datos esperados:

- Nombre de cuenta.
- Contactos.
- Dirección.
- Teléfono.
- Oportunidades.
- Tareas abiertas.
- Actividad reciente.
- Balance y límite de crédito, si aplica.

### 17. Lista de clientes y agenda

La sección de agenda debe tener acceso a la lista de clientes.

La navegación debe conectar:

- Clientes.
- Mis tareas.
- Mi día.
- Lista de pendientes por cliente.
- Mapa.

### 18. Cambiar "Clientes" por "Mis tareas" y "Mi día"

Reorganizar la navegación para que la experiencia se enfoque en el trabajo diario.

Propuesta:

- "Mis tareas".
- "Mi día".
- "Pendientes por cliente".

Esto debe satisfacer los flujos de mapa y planeación diaria.

### 19. Vista tipo Life360 para cuentas y tareas

Inspirarse en Life360 para mostrar cuentas, clientes, oportunidades y tareas abiertas.

Idea funcional:

- Mostrar nombres de cuentas o clientes.
- Mostrar tareas abiertas.
- Mostrar oportunidades en azul u otro color distintivo.
- Conectar esta información con el mapa y el plan del día.

### 20. Ficha de cuenta desde Home

En la pantalla inicial, el usuario debe poder ver cuentas y abrir una cuenta específica.

Flujo:

1. Ver cuentas en Home.
2. Tocar una cuenta.
3. Ver briefing de la cuenta.
4. Profundizar para ver más información.

### 21. Filtros en página de cuentas

Agregar filtros para buscar cuentas por proximidad y propiedad.

Filtros sugeridos:

- Buscar cuentas a 15 millas.
- Buscar todas las cuentas.
- Ver mis cuentas.
- Ver cuentas de otros representantes.

La app debe usar geolocalización para generar un briefing del día y permitir buscar cualquier cuenta.

### 22. Briefing automático por cercanía

La IA debe detectar cuando el usuario está cerca de un cliente y ofrecer un briefing de la cuenta.

El briefing debe incluir:

- Información del cliente.
- Datos pendientes.
- Temas relevantes.
- Sugerencias de qué preguntar o actualizar.

### 23. Opciones cercanas detectadas por agente

Mostrar opciones cercanas y hacer que la app funcione como un agente que detecta oportunidades alrededor del usuario.

Esto se conecta con:

- Mapa.
- Geolocalización.
- Actividad reciente.
- Cuentas sin visitar.
- Oportunidades cercanas.

### 24. Gestión ágil de tareas

Mostrar las tareas de forma más ágil y accionable.

La lista debe ayudar al representante a saber:

- Qué debe hacer.
- Qué ya completó.
- Qué falta por cliente.
- Qué requiere seguimiento.

### 25. Información previa del gerente antes de visita

Permitir que el gerente agregue información previa a una visita de cliente.

La información debe mostrarse en el overview del día para que el representante llegue preparado.

Ejemplo:

- "Hoy verás esta cuenta. Por favor obtén una actualización sobre el tema X."

### 26. Conversación posterior a reunión

Después de una reunión, la app debe preguntar cómo fue la visita mediante una conversación secuencial.

Requerimientos:

- Preguntar "¿Cómo fue la reunión?".
- Capturar respuesta por voz o texto.
- Si falta información, hacer preguntas de seguimiento.
- Convertir la conversación en datos estructurados para el CRM.

### 27. Reporte de equipo dinámico

Construir un reporte de equipo que muestre el ritmo de trabajo y cumplimiento.

Idea mencionada:

- Usar una visualización tipo tortuga/conejo para representar ritmo.
- Comparar cadencia planeada vs. completitud real.
- Permitir tocar para ver logros.

### 28. Drill-down por representante

Desde el reporte o mapa, permitir tocar a un representante y profundizar en su detalle.

Debe mostrar:

- Ruta.
- Visitas.
- Tareas.
- Logros.
- Avance.
- Alertas.

### 29. Planeación de reuniones

Agregar capacidad para planear reuniones desde la app.

Debe conectarse con calendario, clientes, tareas y rutas.

### 30. Modo "en la ruta"

Agregar una experiencia para cuando el representante está trabajando fuera de oficina.

Debe priorizar:

- Mapa.
- Próxima visita.
- Ruta.
- Tiempo estimado.
- Notificaciones.
- Captura rápida por voz.

### 31. Integración con calendario

Integrar calendario como parte central de la experiencia "Mi día".

El calendario debe reflejar reuniones, visitas y tareas provenientes del CRM o creadas en la app.

### 32. Integración ERP

Considerar integración con ERP para datos comerciales adicionales.

Datos posibles:

- Balance.
- Límite de crédito.
- Información financiera de cuenta.
- Estado administrativo.

### 33. Información básica de oportunidad

La oportunidad no necesita ser sofisticada en el MVP, pero debe mostrar información mínima útil.

Campos sugeridos:

- Nombre de oportunidad.
- Etapa.
- Valor, si existe.
- Próxima acción.
- Cuenta relacionada.

### 34. Datos básicos de cuenta

Mostrar datos básicos de cuenta:

- Teléfono.
- Contacto.
- Dirección.
- Nombre de cuenta.
- Información comercial relevante.

### 35. Balance y límite de crédito

Mostrar balance y límite de crédito cuando estén disponibles desde CRM o ERP.

Estos datos ayudan al representante a prepararse antes de una visita y a tomar mejores decisiones comerciales.

## Pendientes de definición

- Confirmar qué información exacta se tomará de Salesforce o del CRM seleccionado.
- Definir qué datos vendrán de ERP y si entran en el MVP.
- Definir reglas de semáforo para rojo, amarillo y verde.
- Definir metas diarias y semanales por representante.
- Definir qué parte del alta de prospectos queda para MVP y qué parte queda para fase 2.
- Diseñar mockups finales de Home, Mi día, mapa, cuenta, briefing, bot y vista gerente.
- Definir KPIs mínimos para el reporte gerencial.

## Resultado esperado del MVP

Al finalizar el MVP, la app debe permitir que un representante:

- Vea su día organizado.
- Navegue por clientes y rutas.
- Reciba briefings inteligentes.
- Capture resultados de visita por conversación.
- Actualice tareas y datos del CRM con menos esfuerzo manual.

Y debe permitir que un gerente:

- Vea al equipo en mapa.
- Revise rutas y progreso.
- Detecte representantes o cuentas en riesgo.
- Reciba reportes de completitud y actividad.
