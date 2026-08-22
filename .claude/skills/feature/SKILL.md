---
name: feature
description: "Punto de entrada inicial para CADA solicitud de desarrollo en SalesAgent. Detecta qué tipo de solicitud es, elige su ruta (Direct = 1 agente sin plan · Slice = builder + auditor, el predeterminado · Full = toda la cadena), ejecuta /grilling dentro de un presupuesto de preguntas acorde a la ruta, luego escribe el plan en docs/plans/YYYY-MM-DD-<AREA>-<requirement>/plan.md (Detalle · Dominio · Por qué · Vocabulario · Fases, cada fase con tareas con casillas) y lo ejecuta enviando una tarjeta de dispatch autocontenida a /rx-api-crud, /rx-api-feature, /rx-ui-crud, /rx-ui-feature, o el orquestador de Db. Los agentes trabajan desde la tarjeta, no desde el plan, y cada uno escribe su propio archivo de retroalimentación de dos secciones en la carpeta feedback/ del plan."
---

# /feature — Recepción de Solicitud, Plan y Dispatch

La puerta de entrada. Cada solicitud llega aquí primero; esta skill decide qué es realmente la solicitud, obliga a que la especificación sea precisa, persiste el plan y conduce la ejecución delegando cada tarea al skill/orquestador correcto.

## Uso

```
/feature <descripción en lenguaje natural de la solicitud>
```

---

## Etapa 0 — Detectar, clasificar y elegir la ruta

Dos preguntas independientes. **Qué** es el trabajo (qué receta) y **qué tan grande es su radio de explosión** (qué ruta). Responde ambas antes de cualquier otra cosa.

### 0a — Forma → receta

| Forma | Receta |
|---|---|
| Solo esquema DB (tabla/columna/índice/seed) | Orquestador Db (`.claude/orchestrators/db.md`) |
| Un solo recurso CRUD backend | `/rx-api-crud` |
| Actividad backend no-CRUD (comportamiento en un recurso, integración externa, cambio de endpoint) | `/rx-api-feature` |
| Una view/página UI CRUD | `/rx-ui-crud` |
| Actividad UI no-CRUD (flujo, componente compartido nuevo, cambio de store) | `/rx-ui-feature` |
| Mixed / multi-workstream (toca backend Y frontend) | un plan con múltiples fases, un dispatch cada una |
| Trabajo reactivo (un crash, rotura de env) | salir de esta pipeline — debug ad-hoc, luego reanudar |

### 0b — Radio de explosión → ruta

La ruta es **por tarea**, no por plan; un plan suele mezclarlas.

| Ruta | Test | Agentes | Dir plan | Feedback |
|---|---|---|---|---|
| **Direct** | confinado a un archivo · sin cambio de wire · sin schema · sin superficie compartida nueva · sin nueva superficie de test que un engineer razonable esperaría | 1 (el developer correspondiente) | ninguno | ninguno |
| **Slice** ← **predeterminado** | un vertical slice construido completamente dentro de contracts que ya existen | 2 (builder + auditor) | sí | 1 archivo por agente |
| **Full** | schema DB nuevo · un nuevo auth surface · una nueva integración externa (Salesforce, un LLM) · un change que toca ≥2 resources backend existentes · superficie UI compartida nueva (`src/components/` nuevo, `src/store.ts`/`src/types.ts` shape nueva, `src/api/` module nuevo, ruta nueva) | 3–5 (toda la cadena) | sí | 1 archivo por agente |

**Slice es el predeterminado. Full es la excepción que puedes nombrar.** Si no puedes señalar una fila específica del test Full, es un Slice. Los disparadores de Full están deliberadamente formados por paths para que la decisión sea mecánica, no un juicio sobre qué tan "importante" se siente el trabajo.

**La escalación es unidireccional, barata y esperada.** Una tarea Slice que descubre superficie Full HALTA, el conductor la promueve, y se reanuda con una tarjeta reemitida. La democión nunca ocurre mid-task. Escalar cuesta un dispatch; adivinar Full desde el inicio cuesta varios en cada tarea que no lo necesitaba.

El trabajo de ruta Direct se responde en la conversación, se commitea y se termina — sin directorio de plan, sin archivo de feedback, sin ceremonia. No te convenzas a ti mismo de crear un directorio de plan por un typo.

## Etapa 1 — Interrogar la especificación

Invoca la skill **`grilling`** sobre la solicitud, con un **presupuesto de preguntas definido por la ruta**:

| Ruta | Presupuesto |
|---|---|
| Direct | ninguno — solo hazlo |
| Slice | **≤5 preguntas**, y solo las que el codebase no puede responder |
| Full | todo el árbol de diseño, sin presupuesto |

Recorre el árbol una pregunta a la vez, explora el codebase en lugar de preguntar siempre que la respuesta sea discoverable, y termina con el resumen de decisiones asentadas. Ese resumen — no el transcript — alimenta la Etapa 2. Las decisiones que tocan superficie compartida (⚠ schema / nuevo auth surface / nueva integración externa) se flaggean ahora, se gatean después, y obligan la tarea a Full.

Una pregunta que podrías haber respondido con un grep es una pregunta que costó al usuario un round trip.

**El radio de explosión de un secret es el de su contenedor, no el de su field.** Cuando una decisión coloca un secret (una API key de Salesforce, una key de LLM, un signing key) en un config file, el grilling asienta cuatro cosas, no una: ubicación en reposo, redacción en lectura, semántica de carry-forward/clear en escritura, y si el file se replica en algún lugar.

## Etapa 2 — Escribir el plan

Crear el directorio del feature (append-only; nunca movido, renombrado o eliminado):

```
docs/plans/YYYY-MM-DD-<AREA>-<requirement-slug>/
├── plan.md          ← de docs/plans/_templates/plan.md
└── feedback/        ← creado vacío; el archivo de feedback de cada agente llega aquí
```

`<AREA>` es un nombre de área corto en minúsculas describiendo qué parte del producto toca
(`auth`, `accounts`, `salesforce`, `dashboard`, `cross` si es genuinamente multi-área). SalesAgent
no tiene todavía una estructura modular formal — usa el nombre que mejor describa el dominio de
negocio del feature, no un path de carpeta.

`plan.md` tiene **exactamente cinco secciones**:

- **Detalle** — el plan mismo: qué se entregará, las decisiones asentadas del grilling, y los acceptance criteria. **Cada acceptance criterion establece cómo se observa** — la superficie que un humano o un test puede vigilar. Un AC que nombra un behaviour sin nombrar su superficie no se puede convertir en un paso de manual-QA, y un AC unobservable es exactamente donde un defecto se esconde a través de varios green gates.
- **Dominio** — el área de negocio + si toca backend (`server/`), frontend (`src/`), o ambos.
- **Por qué** — el problema, la necesidad del usuario/operator, el costo de no hacerlo.
- **Vocabulario** — el ubiquitous language: cada entity/term con su nombre normalizado exacto. Cada agente DEBE usar estos nombres verbatim en code, tests, y reports.
- **Fases** — una fase = una unidad committable. Cada fase lista **tareas**; cada tarea es una unidad de dispatch con una casilla `[ ]`, un brief detallado, su executor (`/rx-api-crud` | `/rx-api-feature` | `/rx-ui-crud` | `/rx-ui-feature` | `db`), **su ruta (Slice | Full)**, un flag de contract-approval, y sus archivos de feedback esperados bajo `feedback/`.

En la ruta Slice el brief que escribes aquí ES el Feature/Design Brief — no un architect lo reescribirá — así que lleva la tabla completa de acceptance con la superficie de observación de cada criterion. Escríbelo como si el builder no tuviera nada más, porque no tiene.

Los briefs de tarea siguen las reglas de BRIEF ACCURACY en `docs/plans/_templates/plan.md` (symbols no line numbers; sets enumerados llevan su defining grep, ejecutado por ti; claims de comportamiento probe-verified o marcados `verify:`; intent sobre implementation para shared surface; re-settlement actualiza cada statement derivado en el mismo edit).

**Checkpoint (HUMAN):** presentar el plan; el usuario confirma las decisiones antes de que se escriba cualquier code.

## Etapa 3 — Ejecutar, fase por fase, tarea por tarea

Branch `feat/<slug>` (branch slug == directory slug). PARA CADA fase en orden, PARA CADA tarea:

1. **Construir la tarjeta de dispatch y pegarla inline.** Tú eres el único lector de `plan.md`. Genera la tarjeta desde la tarea per `.claude/orchestrators/README.md` §1 — LANE, PLAN-DIR, PHASE, TASK, BRIEF, las filas de Vocabulary que esta tarea realmente usa, ACCEPTANCE, CONTRACT APPROVAL, KNOWN-ACCEPTED, FEEDBACK FILE — y ponla en el prompt del agente. Los agentes no abren `plan.md`; eso mantiene un solo punto de edit y evita que los agentes implementen fielmente una sección superseded.
2. **Dispatch al executor de la tarea** con esa tarjeta. La skill executor ejecuta su orchestrator (`.claude/orchestrators/{db,api,ui}.md`) sobre la ruta de la tarjeta.
3. **Batchear la fase donde puedas.** Tareas en una fase que tocan el mismo resource/área van a UN builder, driven tarea-a-tarea por SendMessage con una tarjeta fresca cada vez (README §5). Los auditors se mantienen fresh-context por tarea.
4. **Verificar que los archivos de feedback existen** — `ls feedback/`. Cada agente escribe el suyo; tú no los lees de vuelta en tu context. Si uno falta, re-promptea a ese agente para que lo escriba.
5. **Gatear la casilla.** Cambiar `[ ]` → `[x]` SOLO cuando la tarea (a) build, (b) tests pasan, (c) el audit no tiene hallazgos CRITICAL/high-WARNING, (d) está commiteada, Y (e) existe el archivo de feedback de cada agente participante. Hasta entonces: `[in-progress]` / `[blocked: <why>]`. **Sin archivos de feedback → sin checkmark.**
6. **Un commit por fase**, green, antes de que la siguiente fase empiece.
7. **Tareas que tocan schema o un auth surface nuevo HALTAN** para `rx-api-architect` (o `rx-ui-architect`) + aprobación humana antes de ejecutar. Una tarea Slice que escala mid-flight obtiene su ruta actualizada en `plan.md` y una tarjeta reemitida — registra la promoción, es la señal de que los triggers de Stage 0 necesitan una nueva fila.

## Etapa 4 — Verificación en vivo (features con superficies externas)

Levanta lo que necesites localmente: Postgres (`docker compose -f server/docker-compose.local.yml
up -d`) y el backend (`dotnet run --project server/src/SalesAgent.Api`) para cambios de API;
`npm run dev` para cambios de UI. Ejerce el happy path + key edge cases a través de las
superficies reales — cada nueva route backend con un request bien formado Y uno bad-input,
asertando status + shape de error; cada flujo de UI nuevo/cambiado recorrido en el browser cuando
es visible al usuario. Un suite de tests verde no demuestra un flujo usable ni un wire path real.

## Etapa 5 — Cerrar el plan

Cuando todas las casillas son `[x]` y la live verify pasó: cambiar frontmatter `status: closed` de `plan.md` + establecer `closed:`.

**Distilar de las tablas, no del corpus.** NO leer cada archivo de feedback — en un plan grande eso solo excede un context window. Extraer solo las proposal rows:

```sh
awk '/^## Proposed guide updates/{f=1;next} /^## /{f=0} f && /^\|/' feedback/*.md
```

Luego appendear una sección corta **Improvements** al Detail de `plan.md`: los cross-task themes que esas rows agrupan, cada uno apuntando al file real a actualizar (un skill, un agent, un orchestrator, un README). Leer un archivo de feedback completo solo cuando una row es demasiado terse para disposition. El corpus permanece en su lugar forever y `/improve` lo mines.

**Compliance de template:** cada `feedback/*.md` lleva exactamente dos secciones (`Friction` / `Proposed guide updates`) y se mantiene bajo 400 words. Un file que le falta el proposal heading es invisible al awk de arriba — back-fill el heading (con `None.` si esa es la verdad) antes de que el plan cierre.

**Closure gate — el loop debe aplicarse, no solo distilar.** Un plan NO puede cerrar mientras cualquier row de cualquier tabla de *Proposed guide updates* de un agente esté undispositioned. Cada row recibe un marker appended in place: `→ applied <sha>` o `→ rejected — <reason>` o `→ deferred to /improve`. Las rows cuyo *Why* nombra un defect o round-trip perdido que **ya ocurrió** son un hard gate: aplicar o rechazarlas ahora, en el commit final de este plan. El resto puede ser deferred, pero `/improve` debe dispositionarlas en su próximo run.

## Manejo de errores

| Situación | Acción |
|---|---|
| Una tarea necesita schema o un auth surface nuevo mid-flight | HALTA la tarea; route al orquestador Db / `rx-api-architect`; surface al usuario. |
| Audit retorna CRITICAL/high | El orchestrator loop developer↔auditor (max 2 cycles), luego surface a ti → el usuario. |
| El `FEEDBACK FILE` de la tarjeta no existe después de que el agente retorna | Re-promptearlo a escribir el file. NO puedes checkear la casilla sin ello. |
| Un agente excede context | Resume via SendMessage a su ID antes de spawnear fresh. |
| Un agente pregunta una pregunta que la tarjeta debería haber respondido | Responderla Y fixear la tarjeta en `plan.md` en el mismo turno — una tarjeta sin fix re-pregunta en el siguiente dispatch. |
| Una tarea Slice hits Full surface | Promoverla: actualizar la ruta de la tarea en `plan.md`, ejecutar la etapa architect/Db, reemitir la tarjeta. Nunca work around dentro del Slice. |
| La solicitud es pure debugging | No es un feature — manejar ad-hoc, sin directorio de plan. |

## Single source of truth

- Plan layout + templates: `docs/plans/README.md`, `docs/plans/_templates/`.
- Dispatch card, lanes, feedback contract: `.claude/orchestrators/{README,db,api,ui}.md`.
- Recipes: `/rx-api-crud`, `/rx-api-feature`, `/rx-ui-crud`, `/rx-ui-feature`.
- Backend layout: `server/README.md`. Frontend layout: root `CLAUDE.md`.
