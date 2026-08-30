# RQ-03 — CRM: cuentas, contactos, oportunidades, tareas

**Estado en el demo:** Datos íntegramente estáticos en `src/data.ts`; sin persistencia ni integración real.
**Código relacionado:** [`src/views/ClientsPage.tsx`](../../src/views/ClientsPage.tsx), [`src/data.ts`](../../src/data.ts), [`src/types.ts`](../../src/types.ts) (`Account`, `Contact`, `Opportunity`, `ActivityEvent`, `Task`).
**Fuentes de negocio:** `docs/MVP - Business Inputs.pdf` (brainstorm informal, sin FR formales), `docs/MVP - Tareas.md` (#16, #21, #33, #34, #35).

## 1. Resumen

Este módulo es la base de datos de negocio que todo lo demás consume: la información de cuenta, contacto, oportunidad y tarea que el representante necesita antes, durante y después de una visita. El requerimiento explícito es que la ficha de cliente **replique la forma en que Salesforce presenta la información**, no que se invente un modelo propio.

## 2. Requerimientos funcionales

- **RF-CRM-01**: Debe existir una ficha de cuenta con: nombre, dirección, contactos clave, oportunidades, tareas abiertas, actividad reciente. *Fuente: "MVP - Tareas.md" #16, calcada de Salesforce.*
- **RF-CRM-02**: Cada `Account` debe soportar contactos múltiples (`Contact`), con rol, teléfono, email.
- **RF-CRM-03**: Cada `Account` debe soportar oportunidades múltiples (`Opportunity`) con nombre, stage, monto, probabilidad, próximo paso.
- **RF-CRM-04**: Cada `Account` debe soportar un historial de actividad (`ActivityEvent`) con fecha y notas.
- **RF-CRM-05**: Cada `Account` debe soportar tareas asociadas (`Task`) con dueño, fecha límite, estado, prioridad.
- **RF-CRM-06**: La ficha de cliente debe permitir expandir/colapsar secciones (menú desplegable de cliente) — *Fuente: "MVP - Tareas.md" #15.*
- **RF-CRM-07**: Debe existir un mecanismo para navegar de "cuenta en el mapa" a "ficha completa de cuenta" y viceversa (comparte contrato con RQ-02).
- **RF-CRM-08**: La creación de actividad debe poder originarse de 3 fuentes distintas: eventos empujados desde el calendario del CRM, actividad espontánea por mapeo de ubicación→cliente, y citas creadas manualmente en la app que se empujan de vuelta al CRM. *Fuente: `MVP - Business Inputs.pdf`.*

## 3. Reglas de negocio

- El CRM de referencia/objetivo es **Salesforce** (mencionado también como alternativa: Hubspot, SugarCRM) — el modelo de datos y la UI de ficha de cliente deben espejar sus campos y estructura, no inventar un shape propio.
- Filtros de descubrimiento de cuentas esperados (`MVP - Tareas.md` #21): por proximidad (radio configurable, ej. 15 millas), "todas las cuentas", "mis cuentas", "cuentas de otros representantes".
- Balance y límite de crédito deben mostrarse **cuando estén disponibles** desde CRM/ERP — es un campo condicional, no obligatorio (`MVP - Tareas.md` #35).

## 4. Datos y entidades involucradas

`Account`, `Contact`, `Opportunity`, `ActivityEvent`, `Task` (todos en `types.ts`). Campo mencionado en la fuente de negocio pero **ausente hoy del modelo**: `creditLimit`/balance de cuenta (solo en `MVP - Business Inputs.pdf`, no en los documentos formales ni en `types.ts`).

## 5. Estado actual en el demo

- Todos los datos de `Account`/`Contact`/`Opportunity`/`ActivityEvent`/`Task` son objetos estáticos definidos en `src/data.ts` — no hay backend, no hay persistencia entre sesiones más allá de lo que el usuario modifica localmente vía el flujo de cuestionario (que sí persiste en `localStorage`, ver RQ-06).
- `ClientsPage.tsx` renderiza la ficha de cliente con la información disponible; **no confirmado si ya implementa expandir/colapsar por sección** (RF-CRM-06) — revisar contra el mockup antes de dar por cumplido este punto al planear la migración.
- **No implementado**: filtros de descubrimiento por radio/propiedad de cuenta (RF de `MVP - Tareas.md` #21), campos de balance/límite de crédito, integración ERP.
- El campo `tier` (`Strategic`/`Enterprise`/`Growth`/`Core`) y `engagementRisk` en `Account` ya existen en `types.ts` — son campos que las fuentes de negocio piden indirectamente (para priorización de mapa y manager insights) y que el demo ya modela, aunque no vengan de un CRM real.

## 6. Fuera de alcance de este módulo

- Alta de prospectos nuevos fuera del CRM (marcado explícitamente en `MVP - Tareas.md` #14 como *"no necesariamente parte del MVP inicial... capacidad deseada para fase posterior"*) — no incluir en el primer alcance de backend salvo decisión explícita en contrario.
- Integración ERP real (balance, crédito, estado administrativo) — `MVP - Tareas.md` lo deja en "pendientes de definición".

## 7. Preguntas abiertas / decisiones pendientes

- **¿Se integra directamente contra Salesforce (lectura/escritura real vía API) o se modela un CRM propio en Postgres que luego sincroniza con Salesforce?** Esta es la decisión de arquitectura más grande de todo el backend — condiciona el diseño de entidades en `SalesAgent.Domain`. Los documentos de negocio asumen Salesforce como fuente de verdad; el `server/README.md` actual no lo menciona todavía.
- **¿Se incluye `creditLimit`/balance en el modelo de datos real?** — solo mencionado en una fuente informal; confirmar con negocio antes de comprometerlo a un esquema.
- Confirmar si "menú desplegable con expandir/colapsar" (RF-CRM-06) ya está resuelto en el demo o si es trabajo pendiente de UI — no verificado línea por línea en este análisis.
