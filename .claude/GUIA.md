# Guía de uso — pipeline de agentes de SalesAgent

Esta es la puerta de entrada a todo lo que vive bajo `.claude/`: los **agentes** (`agents/`), los
**orquestadores** que los conectan (`orchestrators/`), y las **skills** que uno invoca en la
práctica (`skills/`). Si es la primera vez que trabajas con este pipeline en este repo, empieza
aquí.

## Por dónde empezar, según tu objetivo

| Si tu objetivo es... | Empieza en... |
|---|---|
| Entender qué es este proyecto y correrlo localmente (frontend y/o backend) | Root [`README.md`](../README.md) y [`CLAUDE.md`](../CLAUDE.md) |
| Agregar o cambiar una feature de producto (backend, frontend, o ambos) | §1–§2 de esta guía, luego §3–§5 como referencia de roster |
| Dar **mantenimiento al pipeline mismo** — agregar/editar un agente, una skill, o un orquestador | §9 de esta guía |
| Retomar una sesión de Claude Code en frío sobre este repo | `CLAUDE.md` raíz se carga automático → te dirige aquí |
| Eres una persona nueva en el equipo, sin contexto previo | Lee este archivo completo una vez, de arriba a abajo — es corto a propósito |

Nada de esto reemplaza el juicio de quien lo usa: cada agente y skill documenta sus propias
reglas y límites en su propio archivo. Esta guía es el mapa, no el territorio.

## 0. Cómo funciona esto realmente en Claude Code (lee esto primero)

Los archivos bajo `.claude/skills/*/SKILL.md` y `.claude/agents/*.md` **no son comandos nativos
de Claude Code** — no hay un slash-command `/feature` registrado en el sistema, y ningún
`rx-api-architect` aparece como `subagent_type` real. Son una **convención documentada**: prosa
que describe un procedimiento, escrita para que Claude (o cualquier humano) la lea y la siga.

En la práctica, esto significa:

- **Para "invocar una skill":** pídele a Claude en lenguaje natural, nombrando la skill —
  *"usa /feature para añadir login"*, o simplemente *"sigue `.claude/skills/rx-api-crud/SKILL.md`
  para el recurso Account"*. Claude abre ese `SKILL.md`, y ejecuta su procedimiento paso a paso
  usando sus herramientas normales (Read, Edit, Bash, Agent, etc.) — no hay magia adicional.
- **Para "invocar un agente":** Claude lee el `.md` correspondiente bajo `.claude/agents/` y
  adopta esa persona/esas reglas para la porción de trabajo que le toca. Dos formas de hacerlo:
  - **Inline** (misma conversación): razonable para trabajo rápido, Slice lane, o cuando el
    aislamiento de contexto no importa.
  - **Vía el tool `Agent`** con `subagent_type: general-purpose` (o `claude`), pegando el
    contenido completo del `.md` del agente como parte del prompt de dispatch — esto es
    **obligatorio** para los auditores (`rx-api-auditor`, `rx-ui-auditor`), que el propio diseño
    exige "fresh-context, solo-lectura, nunca la misma instancia que construyó el código" (ver
    `.claude/orchestrators/README.md` §4).
- **La "tarjeta de despacho"** (`LANE / PLAN-DIR / PHASE / TASK / BRIEF / VOCABULARY /
  ACCEPTANCE / ...`, definida en `orchestrators/README.md` §1) es literalmente el texto que se
  pega al inicio del prompt de cada agente dispatcheado — no es una estructura de datos que algún
  sistema procese, es contenido de prompt.

Nada de esto requiere configuración adicional: ya tienes acceso a Read/Edit/Bash/Agent en este
repo. Lo único que aporta valor es *seguir el procedimiento documentado* en vez de improvisar.

## 1. El punto de entrada: `/feature`

Para casi cualquier trabajo nuevo (backend o frontend), empieza describiendo lo que quieres y
pidiendo que se siga `.claude/skills/feature/SKILL.md`. Ese skill:

1. **Clasifica** la solicitud — qué receta (`db` / `rx-api-crud` / `rx-api-feature` / `rx-ui-crud`
   / `rx-ui-feature`) y qué carril (`Direct` / `Slice` / `Full`, ver §2 abajo).
2. **Interroga** la especificación vía la skill `grilling` (una pregunta a la vez, presupuesto
   según el carril).
3. **Escribe el plan** en `docs/plans/YYYY-MM-DD-<AREA>-<slug>/plan.md` y espera tu confirmación
   antes de escribir código.
4. **Ejecuta** fase por fase, tarea por tarea — despachando cada tarea al orquestador/skill
   correcto con una tarjeta autocontenida.
5. **Verifica en vivo** (Postgres + backend local, o `npm run dev`) antes de cerrar.
6. **Cierra el plan** y destila cualquier fricción reportada hacia `/improve`.

Ejemplo de arranque:

> "Usa /feature para agregar login con email+password. Sigue el procedimiento de
> `.claude/skills/feature/SKILL.md`."

Para trabajo trivial (un typo, un fix de una línea) no pases por `/feature` — es la **ruta
Direct**, ver §2.

## 2. Los carriles (lanes)

| Carril | Cuándo | Agentes | Carpeta de plan |
|---|---|---|---|
| **Direct** | confinado a un archivo, sin schema, sin superficie compartida nueva | 1 (el developer directo) | ninguna |
| **Slice** ← default | un vertical slice dentro de contratos que ya existen | 2 (builder → auditor) | sí |
| **Full** | schema DB nuevo · auth surface nuevo · integración externa nueva (Salesforce/LLM) · ≥2 resources backend · superficie UI compartida nueva | 3–5 (cadena completa) | sí |

La escalación Slice → Full es unidireccional y barata (nunca al revés a mitad de tarea). El
detalle completo está en `.claude/skills/feature/SKILL.md` §0b.

## 3. Roster de agentes (`.claude/agents/`)

| Agente | Rol | Dueño de | Se invoca cuando |
|---|---|---|---|
| [`rx-db-owner`](agents/rx-db-owner.md) | Único steward del schema Postgres | `server/src/SalesAgent.Database/scripts/*.sql` | Cualquier cambio de tabla/columna/índice — **siempre con gate humano** antes de escribir el archivo |
| [`rx-api-architect`](agents/rx-api-architect.md) | Stage 1 del backend — diseña, produce el Feature Brief | Estructura de `SalesAgent.Domain`/`SalesAgent.Api`, decide cuándo modularizar | Lane Full: nuevo resource area, nueva integración externa, ≥2 resources tocados |
| [`rx-api-tester`](agents/rx-api-tester.md) | Test plan (Phase A) + verificación (Phase B) | `server/tests/SalesAgent.*.Tests/` | Lane Full, entre el architect y el developer |
| [`rx-api-developer`](agents/rx-api-developer.md) | Implementa el backend | `SalesAgent.Domain`/`SalesAgent.Api` (código) | Todo trabajo backend — es el builder en Slice, el implementer en Full |
| [`rx-api-auditor`](agents/rx-api-auditor.md) | Gate final, solo lectura | Nada — solo produce el reporte | Última etapa de cada tarea backend, siempre fresh-context |
| [`rx-ui-architect`](agents/rx-ui-architect.md) | Stage 1 del frontend — diseña superficie compartida | `src/store.ts`, `src/selectors.ts`, `src/api/`, componentes compartidos | Lane Full: componente compartido nuevo, cambio de `store.ts`, módulo `src/api/` nuevo, ruta nueva |
| [`rx-ui-developer`](agents/rx-ui-developer.md) | Implementa views/componentes | `src/views/**`, `src/components/**` (edits) | Todo trabajo frontend — builder en Slice, implementer en Full |
| [`rx-ui-auditor`](agents/rx-ui-auditor.md) | Gate final, solo lectura | Nada — solo produce el reporte | Última etapa de cada tarea frontend, siempre fresh-context |

Cada `.md` de agente lleva su propio catálogo de reglas — ver el archivo cuando vayas a
dispatchearlo, no confíes solo en esta tabla.

## 4. Orquestadores (`.claude/orchestrators/`)

| Archivo | Gobierna |
|---|---|
| [`README.md`](orchestrators/README.md) | Protocolo compartido: tarjeta de despacho, feedback de dos secciones, reglas de gate (bloquea CRITICAL/high WARNING, máx 2 ciclos de remediación), rieles de seguridad de git/ediciones masivas/procesos |
| [`api.md`](orchestrators/api.md) | Pipeline backend: Slice (`rx-api-developer` → `rx-api-auditor`) vs Full (`rx-api-architect` → `rx-api-tester` → `rx-api-developer` → `rx-api-tester` → `rx-api-auditor`) |
| [`ui.md`](orchestrators/ui.md) | Pipeline frontend: Slice (`rx-ui-developer` → `rx-ui-auditor`) vs Full (`rx-ui-architect` → `rx-ui-developer` → `rx-ui-auditor`) |
| [`db.md`](orchestrators/db.md) | Pipeline de schema: `rx-db-owner` solo, con el gate humano obligatorio (proponer → confirmar → aplicar) |

Las skills (§5) son las "recetas" — definen *qué* checklist ejecutar. Los orquestadores definen
*cómo* los agentes se coordinan para ejecutarla. `/feature` decide cuál orquestador entra en
juego por tarea.

## 5. Roster de skills (`.claude/skills/`)

| Skill | Para qué | Invócala directo, o casi siempre vía `/feature`? |
|---|---|---|
| [`feature`](skills/feature/SKILL.md) | Punto de entrada — clasifica, interroga, planea, despacha | Directo — es el punto de partida de casi todo |
| [`grilling`](skills/grilling/SKILL.md) | Entrevista de diseño, una pregunta a la vez | Invocada por `feature` — rara vez sola |
| [`rx-api-crud`](skills/rx-api-crud/SKILL.md) | Receta de 10 pasos para un recurso CRUD backend | Vía `/feature`, o directo si ya sabes exactamente el shape |
| [`rx-api-feature`](skills/rx-api-feature/SKILL.md) | Comportamiento no-CRUD, integración externa, cambio de auth | Vía `/feature` |
| [`rx-ui-crud`](skills/rx-ui-crud/SKILL.md) | Receta de 6 pasos para una page/vista CRUD | Vía `/feature`, o directo |
| [`rx-ui-feature`](skills/rx-ui-feature/SKILL.md) | Flujo multi-paso, componente compartido, cambio de store | Vía `/feature` |
| [`recreate-db`](skills/recreate-db/SKILL.md) | Borra y recrea Postgres local desde cero | Directo, cuando la DB local queda en mal estado |
| [`rename-sweep`](skills/rename-sweep/SKILL.md) | Renombrado/movimiento/eliminación masivo sin corrupción | Directo, cuando necesites renombrar algo repo-wide (así se hizo el rename `rm-` → `rx-`) |
| [`improve`](skills/improve/SKILL.md) | Mina `docs/plans/*/feedback/` y aplica mejoras pendientes | Directo, periódicamente — o cuando `/feature` te lo señale al cerrar un plan |

## 6. Ejemplo completo — agregar un recurso CRUD backend

```
Usuario: "Usa /feature para agregar un recurso Account (CRM) con name, salesforce_id opcional,
          y status. Sigue .claude/skills/feature/SKILL.md."
```

Lo que debería pasar:

1. Claude clasifica: forma = "recurso CRUD backend" → `/rx-api-crud`; carril = **Full** (schema
   nuevo es un trigger Full automático).
2. `grilling` hace ≤5–∞ preguntas (sin presupuesto en Full) sobre el shape exacto, unicidad,
   nullability, si requiere auth (probablemente `anonymous` hasta que exista login).
3. Se escribe `docs/plans/2026-08-21-accounts-add-account-resource/plan.md` — tú lo confirmas.
4. Dispatch: `rx-api-architect` (Feature Brief) → primero dispara el orquestador **Db**
   (`rx-db-owner` propone el SQL, **tú apruebas explícitamente**, se aplica) → `rx-api-tester`
   Phase A (test plan) → `rx-api-developer` (implementa) → `rx-api-tester` Phase B (verifica,
   dos runs verdes) → `rx-api-auditor` (fresh-context, reporte).
5. Verificación en vivo: `dotnet run --project server/src/SalesAgent.Api`, smoke del endpoint
   nuevo.
6. Plan cerrado; cualquier fricción reportada queda para `/improve`.

## 7. Reglas que nunca se saltan

- **Ningún agente excepto `rx-db-owner` toca un `*.sql`** bajo
  `server/src/SalesAgent.Database/scripts/`. Cualquier otro agente que lo necesite escala.
- **Ningún schema se escribe sin tu aprobación explícita** — silencio no cuenta como aprobación
  (`orchestrators/db.md`).
- **Los tests pre-existentes son sagrados** — un test verde que se rompe significa que el código
  está mal, no el test. Solo `rx-api-architect`/`rx-ui-architect` pueden sancionar una reescritura,
  y solo cuando el brief lo listó explícitamente.
- **SQL siempre parameterizado** (Dapper) — nunca string-concatenado.
- **Los auditores son de solo lectura y fresh-context** — nunca la misma instancia que construyó
  el código, y nunca arreglan nada ellos mismos.
- **Máximo 2 ciclos de remediación** por hallazgo de auditoría, luego se presenta al usuario.
- Rieles de git/ediciones masivas/procesos: ver `orchestrators/README.md` §7 (nunca `git stash`
  a secas, nunca `sed -i` en loop, matar solo procesos que esta sesión inició).

## 8. Dónde está cada cosa

```
.claude/
├── GUIA.md                 ← este archivo
├── CLAUDE.md               (nota sobre CodeGraph — no relacionado con este pipeline)
├── agents/                 8 personas de agente (rx-*.md)
├── orchestrators/          4 docs de coordinación (README, api, ui, db)
├── skills/                 9 recetas invocables (feature, grilling, improve, recreate-db,
│                            rename-sweep, rx-api-crud, rx-api-feature, rx-ui-crud, rx-ui-feature)
├── docs/                   planning docs de la era pre-backend (no relacionados con agentes)
└── requirenment/           doc de ejecución original del demo SolidJS

docs/plans/                 un directorio por feature (creado por /feature), + _templates/
server/                     backend .NET — ver server/README.md
src/                        frontend SolidJS — ver CLAUDE.md (raíz del repo)
```

## 9. Dar mantenimiento al pipeline mismo

Esto es para cuando el trabajo no es "usar el pipeline para construir una feature", sino
"cambiar cómo funciona el pipeline" — agregar un agente, ajustar una skill, o corregir una
convención que resultó no encajar con la realidad del proyecto.

- **Agregar un agente nuevo:** crea `.claude/agents/rx-<nombre>.md` siguiendo la forma de un
  sibling existente (frontmatter `name`/`description`/`model`/`effort`/`color`/`memory` +
  protocolo de dispatch-card + alcance + reglas + reporting). Regístralo en el orquestador que lo
  va a dispatchear (`api.md`, `ui.md`, o `db.md`) y en la tabla de §3 de esta guía.
- **Agregar o editar una skill:** crea/edita `.claude/skills/<nombre>/SKILL.md`. Si es una receta
  nueva (equivalente a `rx-api-crud`/`rx-ui-crud`), regístrala en la tabla de rutas §0a de
  `skills/feature/SKILL.md` y en la tabla de §5 de esta guía.
- **Renombrar algo repo-wide:** usa la skill `rename-sweep` — nunca `sed`/`perl` en un loop de
  shell. El precedente real es el rename `rm-` → `rx-` de todo el roster de agentes/skills: grep
  primero para derivar la lista exacta de archivos, lista de sustitución machine-readable,
  aplicación por script, verificación por grep posterior a cero coincidencias del nombre viejo.
- **Corregir una convención que no encaja con la realidad:** ese es el trabajo de la skill
  `improve` — mina `docs/plans/*/feedback/*.md` en busca de filas `Proposed guide updates` sin
  aplicar, y las aplica a los archivos reales (agentes, skills, orquestadores). No edites un
  agente "porque sí" a mitad de una feature — deja que la fricción se acumule en el feedback y
  se resuelva ahí, salvo que el cambio sea urgente y obvio.
- **Esta guía no se auto-actualiza.** Si agregas, renombras, o eliminas un agente o una skill,
  actualiza las tablas de §3/§4/§5 en el mismo cambio — un roster desactualizado es peor que
  ninguno, porque alguien confía en él.
- **Antes de auditar todo el pipeline de punta a punta** (post-rename, post-refactor grande),
  usa el mismo método que se usó para validar este framework: grep de cross-referencias entre
  agentes/orquestadores/skills, verificación de numeración de catálogos (C1–C11, U1–U8, listas de
  pasos), y confirmación de que cada path mencionado existe de verdad. No hay una skill dedicada
  para esto todavía — es una auditoría manual, ad-hoc.

## 10. Qué NO existe todavía

- **Ningún recurso real backend está construido** — `SalesAgent.Domain`/`SalesAgent.Api` son
  scaffolding vacío (solo `/health`). El primer `/feature` real (probablemente login) es lo que
  llena esto.
- **No hay test runner de UI** en este repo — `npm run build` es solo typecheck+build. Si un
  brief pide tests de UI, es una decisión a escalar al architect (agregar un runner), no algo que
  se inventa sobre la marcha.
- **Docker no fue verificado en esta máquina** durante el scaffold — `recreate-db` y el
  docker-compose local están escritos pero no probados end-to-end aquí.
- **Sin multi-tenancy/RLS** — hay un solo rol de aplicación conectando a Postgres. Si el producto
  llega a necesitar aislamiento real entre organizaciones de venta (no confundir con "cuentas de
  cliente" CRM), es una decisión de arquitectura nueva a escalar al usuario primero.
