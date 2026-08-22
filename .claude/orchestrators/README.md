# Orquestadores

Un orquestador define **cómo los agentes trabajan juntos** en una tarea de un plan de función. Las
habilidades (`/feature`, `/rx-api-crud`, `/rx-api-feature`, `/rx-ui-crud`, `/rx-ui-feature`)
seleccionan el orquestador; el orquestador define la secuencia de agentes, los artefactos de
transferencia, las barreras y el contrato de retroalimentación.

| Orquestador | Carril | Pipeline |
|---|---|---|
| [db.md](db.md) | cualquier | `rx-db-owner` (proponer → confirmar usuario → aplicar) |
| [api.md](api.md) | Fragmento | `rx-api-developer` (constructor, posee sus propias pruebas) → `rx-api-auditor` |
| [api.md](api.md) | Completo | `rx-api-architect` → `rx-api-tester` → `rx-api-developer` → `rx-api-auditor` |
| [ui.md](ui.md) | Fragmento | `rx-ui-developer` (constructor) → `rx-ui-auditor` |
| [ui.md](ui.md) | Completo | `rx-ui-architect` → `rx-ui-developer` → `rx-ui-auditor` |

El **carril** es elegido por el conductor en el Escenario 0 de `/feature` y nombrado en la
tarjeta de despacho. El trabajo de carril directo ejecuta un solo agente sin directorio de plan
ni archivo de retroalimentación.

## Protocolo compartido (vinculante para cada orquestador)

### 1. Cada agente recibe una tarjeta de despacho — los agentes NO leen `plan.md`

El conductor pega la **tarjeta de despacho** de la tarea en línea dentro del prompt del agente. La
tarjeta se genera a partir de `plan.md` en el momento del despacho, por lo que `plan.md` se
mantiene como el único punto de edición y la re-validación se propaga por construcción. Un agente
despachado no abre `plan.md`; si la tarjeta es insuficiente, eso es un defecto en la tarjeta —
indíquelo y pida, no vaya a leer alrededor.

La tarjeta contiene exactamente:

```
LANE: Direct | Slice | Full          PLAN-DIR: docs/plans/YYYY-MM-DD-<MODULE>-<slug>/
PHASE: NN                            TASK: <task-slug>
BRIEF:            <the task's Brief, verbatim from plan.md>
VOCABULARY:       <only the rows this task uses — exact names, binding in code/tests/reports>
ACCEPTANCE:       <the acceptance criteria + how each is observed>
CONTRACT APPROVAL: none | ⚠ REQUIRED (schema / new auth surface / new external integration)
KNOWN-ACCEPTED:   <settled findings the auditor must not re-litigate; "none" if none>
FEEDBACK FILE:    <plan-dir>/feedback/phase-NN-<task-slug>--<agent>.md
```

El `PLAN-DIR` está allí para que el agente escriba su archivo de retroalimentación y encuentre
artefactos hermanos — no como una invitación a leer el plan. Los nombres de vocabulario en la
tarjeta son vinculantes verbatim.

### 2. Transferencias mediadas por artefactos

La salida de cada etapa es un artefacto escrito que la siguiente etapa recibe verbatim en su
prompt (Carril Completo: brief → plan de pruebas → informe de implementación → informe de
auditoría; Carril Fragmento: la tarjeta de despacho ES el brief, por lo que la única transferencia
es informe de implementación → informe de auditoría). Nunca lleve estado solo en conversación.
Espere a que cada etapa complete antes de iniciar la siguiente.

Reglas del mensaje de despacho (cada una de estas ha costado un viaje de ida y vuelta cuando se
saltaron):

- **Verifique que los artefactos reclamados existen** antes de despachar — "el brief contiene
  §1–§N" puede ser falso; abra el archivo, no confíe en el resumen.
- **Las resoluciones pre-validadas a las preguntas abiertas del tester van DENTRO del despacho
  del desarrollador** (repetidamente el contenido de despacho de mayor impacto).
- Los conteos de pruebas esperados como un cuádruple sumatorio (`pre-existing pass/fail + new`)
  o un delta explícito — nunca un total desnudo; cada falla pre-existente nombrada lleva una
  causa raíz de una línea, y las fallas dependientes del entorno se expresan de forma condicional
  ("red WHEN <env gap>"), nunca como un plano "pre-existing red".
- Incluya **listas de conocidos-aceptados / no-reportar** para que los auditores no re-litiguen
  hallazgos resueltos.
- Los despachos de remediación llevan la salida de la prueba INCLUYENDO las líneas de control, y
  declaran qué OBSERVAR, no qué costura usar; los despachos de re-auditoría declaran que un
  veredicto limpio es aceptable.
- **Cite, nunca transcriba.** Cuando un artefacto lleva algo que otro artefacto posee —
  una expresión de código, un comando, un mensaje orientado al operador, el texto exacto de una
  regla — reproduzca lo verbatim en un bloque encerrado (o enlace el archivo propietario); nunca
  reformule su comportamiento en prosa o una tabla. Corolarios: un comando citado en un brief se
  escribe en su forma **ejecutable, citada**, porque los agentes downstream lo copian-pegan
  verbatim; y la herramienta Read **silenciosamente comprime archivos largos, omitiendo palabras
  sin marcar la omisión** — una cita tomada de un archivo largo se confirma con un `grep -c
  '<substring>$'` anclado antes de enviar. Cuando una regla ya existe en algún lugar canónico,
  ENLÁCELA en vez de reformularla.
- Los auditores de contexto fresco obtienen su propio subdirectorio scratchpad — uno encontró el
  corpus de prueba de un agente hermano y lo auditó por error.

### 3. Cada agente ESCRIBE su propio archivo de retroalimentación y devuelve un recibo

El agente que hizo el trabajo escribe el archivo mismo, con la herramienta Write, en la ruta
`FEEDBACK FILE` de su tarjeta de despacho:

```
<plan-dir>/feedback/phase-NN-<task-slug>--<agent>.md
```

(template: `docs/plans/_templates/feedback.md`). Tiene exactamente **dos** secciones y un límite
de **400 palabras**:

```
## Friction
{first-hand: what fought back, what was ambiguous, what the card got wrong or omitted,
 what a future run of this flow would trip on. ≤10 lines. Prose, not headings.}
## Proposed guide updates
{table — file path | change | why. EMPTY IS NORMAL AND CORRECT. Only write a row that is
 concrete, reviewable, and aimed at a real file someone reads before doing this work again.}
```

NO reafirme lo que construyó — el diff y el informe de implementación ya lo llevan.

**El mensaje final es un recibo, no la retroalimentación.** ≤120 palabras, y lleva solo:

```
FEEDBACK: <path written>        VERDICT: ready-for-audit | clean | blocking | blocked
TESTS:    <pre-existing pass/fail + new pass/fail>   (or n/a)
BLOCKING: <one line each, or "none">
```

Todo lo demás que la siguiente etapa necesita está en el artefacto de transferencia (§2), no en
el recibo.

**Sin archivo de retroalimentación → sin marca de verificación.** La casilla de verificación del
plan en `[ ]` → `[x]` solo cuando (a) compila, (b) las pruebas pasan, (c) la auditoría no tiene
hallazgos bloqueantes, (d) está comprometida, Y (e) los archivos de retroalimentación para cada
agente que ejecutó existen bajo `feedback/`. El conductor verifica la existencia (`ls`), y no
lee los archivos de vuelta en su propio contexto — el cierre lee solo las tablas `Proposed guide
updates` (Escenario 5 de `/feature`).

### 4. Reglas de barrera

- Los hallazgos del auditor se clasifican CRITICAL / WARNING (high|low) / INFO. **Bloquee en
  CRITICAL y high WARNING**; registre INFO/low y llévelos hacia adelante — nunca consumen un
  ciclo de remediación.
- La remediación vuelve al desarrollador, luego se re-audita. **Máximo 2 ciclos**, luego STOP y
  presente los hallazgos pendientes al usuario (pueden eximir).
- Cualquier cosa que toque un esquema de base de datos, o un nuevo auth surface, SE DETIENE para
  aprobación del arquitecto + humano antes de proceder.
- Los auditores son **contexto-fresco y solo-lectura** — nunca la misma instancia de agente que
  construyó el código, y no modifican nada.

### 5. Recuperación de agentes

Si un agente excede el contexto o se estanca, reanúmelos vía SendMessage a su ID antes de
generar uno nuevo. Si el `FEEDBACK FILE` nombrado en su tarjeta no existe después de que devuelve,
vuelvalo a prompt para escribir el archivo — no lo reconstruya usted mismo a menos que el agente
sea irrecuperable.

**Agrupe una fase en un agente.** Cuando varias tareas en la misma fase tocan el mismo
área, despache UN constructor para la fase y conduzca sus tareas restantes con SendMessage
(tarjeta fresca por tarea). El costo de arranque se paga una vez por fase en lugar de una vez por
tarea, y el agente mantiene el mapa que ya construyó. Los auditores están exentos — se mantienen
contexto-fresco por tarea, que es el punto entero de ellos.

Fallo conocido de generación: un agente rm-* a veces devuelve boilerplate de 0-tool-use en el
primer despacho. Reanude vía SendMessage con una instrucción explícita "haz el trabajo
directamente" — NO ejecute la etapa del agente usted mismo (un auditor silenciosamente no-op una
vez dejó la barrera final al orquestador), y nunca trate el retorno vacío como un veredicto
limpio.

### 6. Estado del stack local

Este proyecto (sales-agent-demo) tiene, por ahora, un stack local mucho más simple que el
proyecto del que se importó este framework de agentes: el frontend es `npm install && npm run
dev` sin secretos, y el backend nuevo (`server/`) necesita solo Postgres local (`docker compose
-f server/docker-compose.local.yml up -d`) y ningún certificado o servicio adicional. No hay
todavía gotchas de entorno específicas registradas aquí. **Cuando el stack local crezca en
complejidad real (secretos gitignored, servicios adicionales, un worktree que los necesite)**,
documente los gotchas concretos en esta sección — no invente contenido genérico por adelantado.

### 6b. Revisión posterior — skills no adaptados todavía

`dev/.claude/skills/` (un nivel arriba de este repo, la plantilla maestra compartida entre
proyectos) conserva, intactas, cinco skills que este proyecto no adaptó porque sus precondiciones
no existen aquí todavía: `live-smoke`, `module`, `reset-local-stack`, `rm-rclp-element`,
`sync-openapi`. No están copiadas en este repo — revisa esa carpeta como referencia si en algún
momento hace falta construir una versión lean de alguna:

| Skill original | Cuándo revisitarla |
|---|---|
| `live-smoke` | Cuando exista un host desplegado (no solo local) que valga la pena smoke-testear con un procedimiento dedicado. |
| `module` | Si el backend crece a un modular-monolith real con quads por módulo (hoy `SalesAgent.Domain`/`SalesAgent.Api` son proyectos únicos). |
| `reset-local-stack` | Si el stack local crece más allá de solo Postgres (más servicios, certificados, secretos). |
| `rm-rclp-element` | Solo si el producto llega a necesitar un subsistema de renderizado de layouts/documentos comparable — no hay señal de eso hoy. |
| `sync-openapi` | Cuando el backend publique un spec OpenAPI committed y el frontend adopte un cliente generado desde él. |

### 7. Railes de seguridad (vinculantes para cada agente)

- **git:** nunca bare `git stash` (siempre pathspec-scoped — un bare stash puede revertir una
  fase entera sin comprometer); nunca `git checkout -- <file>` para deshacer trabajo sin
  comprometer que puede necesitar aún (revierta con ediciones inversas); nunca `git commit -a`
  (comprometa la lista de archivos del plan; diff la lista de archivos del working-tree contra
  el scope del plan primero); afirme branch + worktree root antes de cualquier commit — use
  `git -C <root>` / rutas absolutas, nunca bare `cd`.
- **Ediciones masivas:** renombramientos/reemplazos multi-file corren desde un script driven por
  una lista old→new machine-readable, verificado reconstruyendo desde `git show HEAD` y
  byte-diffing — nunca shell-looped `sed -i`/`perl -pi` con `|| true`.
- **Procesos & data:** mate solo PIDs trazables a un comando QUE emitió esta sesión; park-don't-delete
  operator/demo data cuando sea posible (favorece un sentinel sobre row deletion).
- **Agentes paralelos:** cuando agentes comparten un checkout, commits por-agent (autoría debe
  ser rastreable); prefiera worktrees por-tarea.
