# Orquestador de UI

Flujo para cualquier trabajo de frontend (SolidJS): una nueva view, un flujo nuevo, un cambio en superficie compartida (`src/store.ts`, `src/components/`, `src/api/`). Las recetas están en las skills (`/rx-ui-crud`, `/rx-ui-feature`); este archivo define cómo los agentes ejecutan una receta.

**El carril proviene de la tarjeta de dispatch** (Stage 0 de `/feature` lo elige; ver [README.md](README.md) §1):

| Carril | Pipeline | Cuándo |
|---|---|---|
| **Slice** ← default | `rx-ui-developer` (builder) → `rx-ui-auditor` | una view/componente construido completamente sobre superficie compartida que ya existe |
| **Full** | `rx-ui-architect` → `rx-ui-developer` → `rx-ui-auditor` | superficie nueva: un componente compartido nuevo en `src/components/` · un cambio de shape en `src/store.ts`/`src/types.ts` · un módulo nuevo en `src/api/` · una ruta nueva |

El carril Slice elimina el **dispatch** del architect, nunca el **territorio** del architect. Los límites del developer permanecen sin cambio: solo `src/views/**` y `src/components/**` (edits). Descubrir que se necesita cualquier superficie compartida HALTA la tarea y escala a Full — la misma regla de siempre, ahora como salida del carril.

## Carril Slice

```
 Stage 1  Builder         rx-ui-developer ← tarjeta de dispatch (BRIEF + ACCEPTANCE = el spec)
    │                     · src/views/** + src/components/** (edits) solo                          ▲
    │                     · ejecuta npm run build                                                    │
    │                     · ¿necesita superficie compartida? → HALT, escalar a Full                  │
 Stage 2  Auditor         rx-ui-auditor (contexto fresco, solo lectura) → reporte clasificado por severidad │
    └─►  Gate: CRITICAL / high WARNING? ── yes ──► volver a Stage 1 (max 2 ciclos) ─────────┘
                        └─ no (INFO/low registrado) ──► tarea lista → verificar archivos de feedback → marcar la casilla
```

## Carril Full

```
 Stage 0  Dispatch card   cada agente abajo recibe una tarjeta (README §1); nadie abre plan.md
    │
 Stage 1  Architect       rx-ui-architect → Design Brief
    │                     · verifica cada endpoint consumido contra las routes reales del backend
    │                     · ENVÍA cambios de superficie compartida primero (módulo src/api/, cambio
    │                       de store, componente compartido) — el developer nunca implementa
    │                       contra una superficie que aún no existe
    │                     · brief lista: lista de archivos · contratos consumidos · rutas ·
    │                       cambios de state · guardrails fuera de alcance
    │
 Stage 2  Developer       rx-ui-developer → implementa views/componentes exactamente según el brief    ▲
    │                     (src/views/** + src/components/** solo), ejecuta npm run build,             │
    │                     reporta archivos + checklist de acceptance                                  │
    │                                                                                                 │
 Stage 3  Auditor         rx-ui-auditor (contexto fresco, solo lectura) → reporte clasificado por      │
    │                     severidad: cumplimiento U-catalog (imports, reactivity SolidJS,              │
    │                     divergencia de pattern) + conformidad del spec vs la tarjeta + el brief       │
    │                                                                                                 │
    └─►  Gate: CRITICAL / high WARNING?  ── yes ──► volver a Stage 2 (max 2 ciclos) ──────────────────┘
                        └─ no (INFO/low registrado) ──► tarea lista → verificar archivos de feedback → marcar la casilla
```

## Artefactos de handoff

| Desde | Artefacto | Debe contener |
|---|---|---|
| Architect | Design Brief | resumen del feature · lista de archivos con propósito · contratos `src/api/` consumidos · superficie compartida ya enviada (lista do-NOT-touch) · rutas verbatim · cambios de state · guardrails |
| Developer | Reporte de implementación | archivos creados/editados (rutas relativas) · checklist de acceptance marcado · estado de `npm run build` · TODOs restantes esperados |
| Auditor | Reporte de auditoría | conteos de resumen · violaciones (File:line + regla citada + acción) · veredicto de conformidad del spec vs la tarjeta de dispatch (+ brief, carril Full) · veredicto bloqueante |

Solo en el carril Slice existen las dos últimas filas: la tarjeta de dispatch es el brief.

## Reglas de Gate

- El objetivo de loop-back es Developer ↔ Auditor. El architect re-ingresa solo cuando un hallazgo requiere un cambio de superficie compartida (`src/store.ts`, `src/api/`, un componente reusable nuevo) — eso es territorio del architect y modifica el brief.
- Si el developer necesita un componente compartido faltante o un cambio de store en medio: HALTA al developer, el architect lo envía, luego el developer reanuda. **En el carril Slice esto es la escalada a Full**, no una aparición del architect en medio: el conductor promueve la tarea, el architect envía la superficie, el builder reanuda con una tarjeta reemitida.
- Máx 2 ciclos de remediación, luego STOP y presentar al usuario.
- **Tests pre-existentes:** solo `rx-ui-architect` puede autorizar un rewrite de tests pre-existentes (cuando este repo tenga un test runner de UI — hoy no lo tiene; `npm run build` es typecheck+build únicamente), y solo mediante una línea explícita del brief nombrando el cambio de comportamiento.
- ¿Contrato backend inexistente o obsoleto (el endpoint no corresponde a una route real)? HALT — enrutar la brecha backend al Api orchestrator; nunca inventar endpoints.

## Protocolo compartido

Tarjetas de dispatch, contrato de feedback (`<plan-dir>/feedback/phase-NN-<task-slug>--<agent>.md`, uno por agente que ejecutó, escrito por el propio agente), gates, batching de fases y recuperación: ver [README.md](README.md) — vinculante aquí. Una copia/cambio de texto o una corrección de bug de página confinada a un módulo es el **Carril Direct** y no pasa por este orchestrador en absoluto — ver `/feature` Stage 0.
