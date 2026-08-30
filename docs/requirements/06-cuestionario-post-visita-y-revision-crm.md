# RQ-06 — Entrevista post-visita por IA conversacional (debrief por voz) y revisión CRM

**Estado del requerimiento:** ACTUALIZADO 2026-08-22 — el negocio confirmó, vía `docs/Script.docx`, que el debrief post-visita será una **entrevista conversacional por voz sostenida por un servicio de IA** (nombrado **"AISA"** en este guion), no el formulario guiado paso-a-paso que implementa hoy el demo. Esto resuelve a favor de "reemplazo total" la pregunta abierta que este mismo documento dejaba pendiente en su versión anterior (§9 de la revisión previa) y en RQ-05 §9.
**Estado en el demo (código, sin cambios todavía):** el cuestionario stepper (manual/voz por pregunta fija) sigue siendo la única implementación existente — ver §6. Es ahora la base de UI a **evolucionar hacia una interfaz de conversación**, no el objetivo final.
**Código relacionado (implementación actual, pendiente de migrar):** [`src/views/QuestionnairePage.tsx`](../../src/views/QuestionnairePage.tsx), [`src/components/QuestionnaireStepper.tsx`](../../src/components/QuestionnaireStepper.tsx), [`src/components/ReviewPanel.tsx`](../../src/components/ReviewPanel.tsx), [`src/views/SettingsPage.tsx`](../../src/views/SettingsPage.tsx), `services.ts` (`interpretVisitAnswers`), acciones `beginQuestionnaire`/`updateAnswer`/`nextQuestion`/`previousQuestion`/`buildReview`/`confirmReview`/`applyReview` y `addQuestion`/`updateQuestion`/`toggleQuestion`/`removeQuestion`/`moveQuestion`/`restoreDefaultQuestions` en `store.ts`.
**Fuentes de negocio:** **`docs/Script.docx`** (guion de referencia canónico, nuevo — define el comportamiento objetivo con el mayor nivel de detalle de todo el corpus de negocio), `docs/AI Assisted Customer Visit Registration.pdf` (preguntas base originales, ahora subsumidas por el guion conversacional), `docs/Ejemplo de interacción. .pdf` (guion previo, consistente en tono con el nuevo), `.claude/requirenment/solidjs-demo-execution-plan.md` (contexto de por qué el demo simplificó a formulario).

Este documento se solapa deliberadamente con RQ-05 (el guion cubre tanto el briefing pre-visita como el debrief post-visita en una sola sesión continua) — RQ-05 sigue siendo la fuente de los requerimientos de *disparo* del briefing y del modelo de datos de `AssistantNotification`/`PreMeetingBriefing`; este documento (RQ-06) es ahora la fuente de detalle de **cómo se conduce la conversación** y de qué manera se plasma en la UI de captura/revisión.

## 1. Resumen

`docs/Script.docx` narra una sesión completa de un representante ficticio (Marcus, Hilti) con una cuenta (Apex Construction): un asistente de IA llamado **AISA** primero le da un briefing hablado en el camino de ida (disparado por proximidad GPS, interrumpiendo el audio del vehículo), responde preguntas de seguimiento en vivo durante ese briefing, y después de la reunión sostiene una **entrevista conversacional de salida** en la que el representante narra libremente cómo fue la visita; AISA interpreta cada respuesta, la mapea a una acción CRM concreta, y confirma en voz alta lo que va a guardar. No hay formulario, no hay lista de preguntas fijas mostradas en pantalla — la interfaz es la conversación misma, con una visualización de estado en paralelo.

## 2. Configuración de administrador y fuentes de datos

- **RF-ENT-01**: Un admin de ventas regional debe poder configurar qué puntos de datos AISA está obligado a cubrir en cada briefing/entrevista. El guion de referencia mandata: Contact Info, Last Contact, Recent Discussions, Open Opportunities, Open Tasks, Credit Updates, External Insights/Important Details.
- **RF-ENT-02**: El admin debe poder definir la ventana temporal de datos a resumir (el guion usa **90 días** como ejemplo configurado).
- **RF-ENT-03**: AISA debe consolidar datos de 3 categorías de fuente, cada una citada explícitamente en el discurso generado: **CRM** (Salesforce), **fuentes externas** (internet, LinkedIn), **fuentes de datos de cliente/terceros** (ejemplos citados: Dun & Bradstreet, ZoomInfo — típicamente usados para datos crediticios/firmográficos). *Esto extiende el modelo RAG ya documentado en RQ-05 (que solo mencionaba CRM + internet + LinkedIn + input de gerente/rep) con proveedores de datos de crédito/firmográficos explícitos, nuevos en el corpus de negocio.*
- **RF-ENT-04**: El sistema debe soportar **módulos de datos adicionales configurables por el admin** más allá del set mandatado — el propio guion deja como pregunta de diseño abierta cómo se fraseraría un módulo nuevo de "Competitor Activity" (actividad de la competencia) durante el debrief, confirmando que el set de tópicos no es una lista cerrada sino extensible.

## 3. Requerimientos funcionales — Briefing pre-visita (refuerza RQ-05, detalle nuevo)

- **RF-ENT-05**: El disparo de proximidad puede expresarse como **radio de distancia** (el guion usa 5 millas) además del umbral de tiempo ya documentado en RQ-05 (5 minutos) — ambos mecanismos deben soportarse; **reconciliar cuál aplica por defecto es una decisión pendiente** (ver §9).
- **RF-ENT-06**: En contexto de manejo, el audio del briefing debe poder **interrumpir el audio activo del vehículo** (radio/música) — implica integración con el sistema de audio del vehículo o al menos con el reproductor multimedia del teléfono, no solo un sonido de notificación. *Nuevo requerimiento de plataforma, cruza con RQ-10 (móvil).*
- **RF-ENT-07**: Antes de reproducir el briefing, AISA debe **pedir permiso explícito por voz** ("Would you like your account briefing?") y esperar confirmación verbal — no reproduce automáticamente sin consentimiento en el momento.
- **RF-ENT-08**: Cada afirmación del briefing debe ser **trazable a su fuente de datos** en el propio discurso generado (ej. *"(Source: Salesforce - Financial & Credit Update)..."*) — esto es un requerimiento de transparencia/auditabilidad del contenido generado por IA, no solo un detalle de guion.
- **RF-ENT-09**: Al final del resumen de cuenta, AISA debe generar automáticamente una lista de **"Call Objectives"** (objetivos de la llamada/visita) derivados de un análisis de vacíos de datos y oportunidades (*"AISA Logic - CRM Data Gap Analysis"*) — en el ejemplo, 4 objetivos: resolver un problema administrativo urgente (bloqueo de crédito), dar seguimiento a una demo de producto, identificar fecha de decisión de una oportunidad abierta, y capitalizar una señal externa (nueva contratación/proyecto ganado detectado en LinkedIn).
- **RF-ENT-10**: Durante el briefing, el representante debe poder **interrumpir con preguntas de seguimiento en lenguaje natural** (ej. *"What exactly was that overdue invoice for?"*) y AISA debe responder consultando la fuente de datos específica relevante, no solo repetir el resumen. Esto es una capacidad de **Q&A interactivo**, no una reproducción lineal de audio.
- **RF-ENT-11**: El representante debe poder cerrar el briefing con un comando de voz explícito (*"End briefing"*).

## 4. Requerimientos funcionales — Entrevista/debrief post-visita

- **RF-ENT-12**: El debrief se inicia por **invocación de voz del representante** (*"Hey AISA, can we update my account?"*) al volver al vehículo tras la reunión — complementa (no reemplaza) los disparadores por timer/geofence-exit ya documentados en RQ-05 RF-IA-07. El guion cierra con la nota explícita: *"AISA should be available to brief on any topics at any time"* — el acceso al asistente debe ser on-demand, no limitado a la ventana automática post-reunión.
- **RF-ENT-13**: AISA conduce la entrevista como una secuencia de preguntas dirigidas **derivadas de los Call Objectives generados en el briefing pre-visita** (RF-ENT-09), no de una lista estática de preguntas de configuración — el guion de entrevista de RQ-anterior (9 preguntas fijas de `AI Assisted Customer Visit Registration.pdf`) queda subsumido por este mecanismo dinámico.
- **RF-ENT-14**: Cada respuesta del representante debe interpretarse y mapearse **inmediatamente** a una acción CRM concreta, confirmada en voz en el mismo turno (no al final de toda la conversación). Ejemplos del guion:
  - Resolución de bloqueo de crédito → actualizar notas de cuenta + crear tarea de verificación de pago con fecha específica.
  - Feedback positivo de producto → crear nueva oportunidad `closed-won`.
  - Retraso de decisión con causa (ausencia del decision-maker) → mover fecha de cierre de oportunidad existente + registrar la causa en notas.
  - Nueva señal de negocio detectada (contrataciones nuevas) → crear nueva oportunidad + programar tarea de seguimiento (envío de pricing) con fecha.
- **RF-ENT-15**: Debe existir una **visualización en tiempo real del estado de cada tópico/objetivo** de la entrevista mientras se conduce, con **3 estados** (no 2): no satisfecho, parcialmente satisfecho, completamente satisfecho — representado visualmente con un indicador tipo "color wheel" o checkmark de estado. *Cita literal del guion: "they have visuals to show (show a full process) of the topic not satisfied, partially satisfied or fully satisfied, like a status complete indication, using some sort of color wheel or check mark."* Esto **reemplaza y refina** el checklist binario rojo/verde de 4 categorías fijas (Tasks/Opportunities/Schedule/Notes) documentado en RQ-05 RF-IA-12 — el nuevo modelo es de N tópicos dinámicos (uno por Call Objective) con 3 estados cada uno, no 4 categorías fijas con 2 estados.
- **RF-ENT-16**: El representante debe poder cerrar y confirmar la entrevista con un comando de voz explícito (*"Log the call"*), tras el cual el sistema confirma verbalmente qué se guardó (*"Call logged, CRM updated, and your follow-up tasks are scheduled."*).
- **RF-ENT-17**: Si el admin configura un módulo de datos adicional (ej. actividad de competencia), AISA debe poder incorporar preguntas específicas de ese módulo al flujo de entrevista sin rediseño del flujo base — el mecanismo de extensión de módulos debe ser configuración, no código nuevo por módulo.

## 5. Guion de referencia (extracto, ver `docs/Script.docx` para el texto completo)

> AISA: *"Hi Marcus, you are five miles from your 10:00 AM appointment with Apex Construction... Would you like your account briefing?"*
> Marcus: *"Yes, let's hear it."*
> AISA: *"...Important: Their account currently has a credit hold due to a 45-day overdue invoice of $4,200... I have generated four Call Objectives for this meeting: [1] Address the $4,200 past-due invoice..., [2] Get feedback on the TE 70-ATC demo, [3] Identify the final decision date for the fleet management contract, [4] Congratulate Sarah on the Riverfront project and uncover tooling needs... Do you need any additional details?"*
> Marcus: *"Yeah, AISA. What exactly was that overdue invoice for?"*
> AISA: *(consulta Invoicing/Order History) "That invoice was generated on July 5th for a bulk order of..."*
>
> — tras la reunión —
>
> Marcus: *"Hey AISA, can we update my account?"*
> AISA: *"Absolutely, Marcus. Let's debrief on Apex Construction. Did you get a chance to address the overdue $4,200 invoice?"*
> Marcus: *"Yes. Sarah said... they are cutting the check on Friday."*
> AISA: *"Great. I will update the account notes and set a task for you to verify the payment on Monday. How did she like the TE 70-ATC Combihammer demo?"*
> [...]
> Marcus: *"No, that's it. Log the call."*
> AISA: *"Call logged, CRM updated, and your follow-up tasks are scheduled. Have a safe drive to your next stop, Marcus."*

Este guion es la referencia de tono/estructura a usar para diseñar los prompts del sistema de IA real y para validar cualitativamente cualquier prototipo de conversación — de la misma forma en que `Ejemplo de interacción. .pdf` cumplió ese rol para la versión anterior de este documento.

## 6. Reglas de negocio

- Toda afirmación generada por IA debe ser trazable a una fuente de datos citada (RF-ENT-08) — regla de transparencia/auditabilidad, no solo de UX.
- Los "Call Objectives" no son una lista fija — se derivan por sesión, por cuenta, de un análisis de vacíos de datos y oportunidades (RF-ENT-09), y son la estructura organizadora tanto del briefing como de la entrevista de salida.
- Ninguna respuesta del representante se pierde por no encajar en una pregunta predefinida — el modelo de interacción es de conversación libre interpretada, con confirmación verbal inmediata por turno, no un formulario con validación de campo.
- El representante siempre tiene la última palabra antes de cerrar: el comando "Log the call" es el equivalente conversacional de "confirmar revisión" (RQ-anterior RF-CUE-08) — la confirmación humana explícita antes de escribir al CRM se mantiene como regla no-negociable, solo cambia el medio (voz en vez de tap en un botón de revisión).
- El asistente debe estar disponible "en cualquier momento para cualquier tema" (RF-ENT-12) — rompe el modelo anterior de "solo se habilita en `InterviewFinished`" (RQ-anterior RF-CUE-01); la disponibilidad on-demand es ahora un requerimiento explícito, aunque el disparo automático post-reunión (RQ-05 RF-IA-07) se mantiene como complemento, no como única vía de entrada.

## 7. Datos y entidades involucradas (nuevas o extendidas respecto a `types.ts` actual)

- Extensión de `Account`: dato de **crédito/estado financiero** (credit hold, monto vencido, antigüedad de la mora) — no existe hoy ningún campo equivalente en `types.ts`; converge con la pregunta abierta de "límite de crédito" ya señalada en RQ-03 §7, y ahora con más urgencia porque el guion lo trata como bloqueante de negocio ("credit hold"), no solo informativo.
- Nuevo concepto **`CallObjective`** (o equivalente): id, descripción, origen (gap analysis / oportunidad / señal externa), estado (`unsatisfied`/`partial`/`satisfied`), evidencia — reemplaza/generaliza `VisitObjectiveAssessment` ya existente en `types.ts`, que hoy es binario (`met`/`partial`/`missed`, 3 estados que de hecho ya calzan bien con el guion — **verificar si basta con reutilizar `VisitObjectiveAssessment` en vez de crear un tipo nuevo**).
- Nuevo concepto de **fuente citada** por afirmación generada (para RF-ENT-08) — no modelado hoy.
- Nuevo concepto de **módulo de datos configurable por admin** (RF-ENT-01/04/17) — no modelado hoy; se relaciona con, pero no es equivalente a, `InterviewQuestion`/configuración de preguntas actual (que es por representante, no por admin/módulo).
- `PostMeetingExtraction`/`ExtractionConfidence` (ya definidos en RQ-05) siguen siendo el destino final de la interpretación, pero el mecanismo de llegar ahí cambia de "responder N preguntas fijas" a "conversación libre estructurada por Call Objectives".

## 8. Estado actual en el demo — brecha frente al nuevo requerimiento

- El demo implementa hoy exactamente el modelo que este documento **reemplaza**: preguntas fijas (`InterviewQuestion`), un paso a la vez (`QuestionnaireStepper`), interpretación por reglas/keywords (`interpretVisitAnswers`), confirmación por tap en `ReviewPanel`. Ninguno de los RF-ENT-01 a RF-ENT-17 está implementado.
- **No hay conversación libre, no hay Call Objectives dinámicos, no hay citación de fuente, no hay visualización de 3 estados, no hay invocación por voz on-demand ("Hey AISA"), no hay comandos de cierre por voz ("End briefing"/"Log the call"), no hay integración de audio de vehículo, no hay datos de crédito, no hay fuentes externas (LinkedIn/D&B/ZoomInfo) conectadas.**
- Lo único directamente reutilizable del demo actual hacia este nuevo requerimiento: el modelo de estado de visita (`VisitStatus`, RQ-04) como contexto de cuándo el debrief es relevante; `VisitObjectiveAssessment` (candidato a convertirse en el tipo de "Call Objective"); el patrón de captura offline con cola (RQ-09), que sigue aplicando igual sin importar si la interfaz es formulario o voz; el motor de Web Speech API ya integrado (aunque probablemente insuficiente para una conversación de IA en tiempo real con function-calling hacia el CRM, que requiere un pipeline de voz más sofisticado que reconocimiento simple de comandos).
- La configuración de preguntas por representante (`SettingsPage`, RQ-anterior RF-CUE-09) probablemente deja de tener sentido tal como está — el nuevo modelo de configuración es a nivel **admin/módulo**, no de lista de preguntas por usuario. Decidir si esa pantalla se retira, se transforma en "gestión de módulos" (visión admin), o coexiste como fallback manual (ver §9).

## 9. Requerimientos no funcionales

- Latencia de respuesta conversacional (turno de ida y vuelta) suficientemente baja para sostener una conversación natural mientras el usuario conduce — el guion no da un número, pero el caso de uso (manejando) lo exige implícitamente; usar como referencia los <2s de transcripción ya documentados en RQ-05.
- Seguridad manos-libres: toda la interacción de este módulo ocurre mientras el representante conduce — ninguna acción debe requerir mirar/tocar la pantalla para completarse (implica que "Log the call"/"End briefing" y las respuestas a Call Objectives deben ser 100% viables por voz).
- Trazabilidad/auditoría de fuente por afirmación (RF-ENT-08) — implica que el backend debe persistir de dónde vino cada dato usado en una afirmación generada, no solo el resultado final.

## 10. Fuera de alcance de este módulo

- El diseño exacto del prompt/modelo de IA subyacente (proveedor, arquitectura de function-calling contra Salesforce) — es decisión de arquitectura de RQ-05/backend, no de este documento de requerimiento de producto.
- Integración real con Dun & Bradstreet/ZoomInfo/LinkedIn — el guion las cita como fuente esperada, pero no define contratos ni costos; ver pregunta abierta.

## 11. Preguntas abiertas / decisiones pendientes

- **RESUELTA por `Script.docx`**: la pregunta que este documento y RQ-05 dejaban abierta ("¿se reemplaza el cuestionario estructurado por conversación libre?") — la respuesta de negocio es **sí, reemplazo total**, con el cuestionario stepper actual quedando como implementación obsoleta a migrar, no como fallback permanente de producto. (Sigue siendo válido preguntar si conviene un **fallback técnico temporal** por manual/texto para cuando el reconocimiento de voz falla — eso es una decisión de robustez de ingeniería, no de producto.)
- **Nombre del asistente**: este guion usa **"AISA"**; los documentos de mockup anteriores (`MVP - Business Inputs.pdf`, `MVP - Mockup.pdf`) usan **"Sandy"**. Hay ahora dos nombres en conflicto directo en el corpus de negocio — se necesita una decisión de marca explícita antes de comprometer el nombre en cualquier copy de producto o en el propio código (ej. nombre de servicio backend, strings de UI).
- **Reconciliar el umbral de disparo del briefing**: RQ-05 documenta 5 minutos (tiempo); este guion usa 5 millas (distancia). ¿Son dos configuraciones válidas simultáneas (el admin elige unidad), o hay que definir una sola?
- **Integración de audio de vehículo (RF-ENT-06)**: ¿se espera integración real con Android Auto/Apple CarPlay, o "interrumpir la radio" es simplemente reproducir audio a volumen alto vía el propio teléfono/bluetooth del coche? Cambia sustancialmente el esfuerzo de ingeniería móvil (cruza con RQ-10).
- **Fuentes de datos de crédito/firmográficas (Dun & Bradstreet, ZoomInfo)**: ¿son integraciones reales contempladas para el producto, o solo color de guion para ilustrar el concepto de "fuentes externas"? Tiene implicación de costo/contrato si son reales.
- **Mecanismo de configuración de módulos por admin (RF-ENT-01/04/17)**: no hay ninguna pista de UI o de modelo de datos para esto en ningún documento — es una superficie de producto nueva (probablemente una vista de administración que hoy no existe en absoluto en `src/views/`) que requiere su propio diseño antes de poder planearse como Feature Brief.
- **¿Qué pasa con la pantalla de configuración de preguntas actual (`SettingsPage`)?** — candidata a desaparecer, transformarse en gestión de módulos de admin, o quedar como ajuste de accesibilidad/fallback manual. Requiere decisión de producto explícita, no asumir ninguna de las tres opciones.
- Confirmar si el **checklist de 3 estados (RF-ENT-15)** debe aplicarse también al lado del gerente en RQ-08 (Manager Command Center), dado que ese módulo ya tiene su propio código de color rojo/verde de completitud — evaluar si conviene unificar el lenguaje visual entre ambos.
