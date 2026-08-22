---
name: rx-ui-crud
description: "Cómo crear una page/vista CRUD en la SolidJS app de SalesAgent: la receta de 6 pasos (api client → store slice/actions → list view → form/detail view → route → nav item) ejecutada a través del orquestador Ui (rx-ui-architect → rx-ui-developer → rx-ui-auditor). El architect entrega primero el api client y el cambio de store; el developer construye las views; el auditor valida."
---

# /rx-ui-crud — Receta CRUD del SalesAgent UI

Genera la estructura completa para un recurso CRUD en la app SolidJS. Se ejecuta a través del
**orquestador Ui** (`.claude/orchestrators/ui.md`). No hay todavía un módulo canónico de
referencia (SalesAgent está migrando de datos mock a un backend real) — la primera vez que se usa
esta receta, su resultado se convierte en el ejemplo canónico para las siguientes.

## Uso

```
/rx-ui-crud <Resource> route=</path> mode=<top-level|nested>
  fields=<name (type, required), ...>
  [top-level] navLabel=<label> navIcon=<icon>
  [nested]    parent=<Parent> parentIdParam=<:paramName>
```

Si faltan inputs requeridos, pregunta. Verifica que el endpoint del backend existe
(`server/src/SalesAgent.Api/` routes) antes de escribir el brief — si no existe, HALT y enruta al
orquestador Api primero.

## La receta de 6 pasos

| # | Paso | Responsable |
|---|---|---|
| 1 | **API client** `src/api/{resource-lc}s.ts` — funciones tipadas `list/get/create/update/remove` sobre un wrapper `fetch` compartido (nunca `fetch` crudo en el módulo) | **architect** |
| 2 | **Store slice + actions** en `src/store.ts` — estado (`items`, `loading`, `error` según se necesite) + actions que llaman al api client y actualizan el store | **architect** |
| 3 | **List view** `src/views/{Resource}sPage.tsx` (o sección dentro de una view existente si el brief lo especifica) | developer |
| 4 | **Form/detail view o componente** para create/edit | developer |
| 5 | **Route** — registrada en `src/main.tsx` exactamente como el brief especifica | developer |
| 6 | **Nav item** (solo top-level) — entrada añadida a `src/components/BottomNavigation.tsx` verbatim desde el brief; modo nested no toca la navegación | developer |

## Pipeline

1. **`rx-ui-architect`** — verifica el endpoint contra las routes reales del backend, entrega
   steps 1–2 inline, produce el Design Brief (lista de archivos, contratos, ruta/nav item
   verbatim, guardrails, lista de do-not-touch).
2. **`rx-ui-developer`** — implementa steps 3–6 exactamente según el brief; self-verifica el
   acceptance checklist; ejecuta `npm run build` desde la raíz del repo.
3. **`rx-ui-auditor`** — contexto fresco; U-catalog (fetch fuera de `src/api/`, cambios de
   superficie compartida no sancionados, reactivity de SolidJS, divergencia de pattern) +
   conformance del spec vs plan/brief. Gate + loop según el orchestrator (bloquea CRITICAL/high,
   max 2 ciclos).

Obligaciones de la dispatch-card y feedback según `.claude/orchestrators/README.md` — los agentes
trabajan desde la card, nunca `plan.md`, y cada uno escribe su propio archivo de feedback de dos
secciones en la carpeta `feedback/` del plan; sin feedback → sin checkmark.

## Acceptance checklist (developer self-verifies; auditor re-verifies)

Los archivos en las rutas documentadas · ningún `fetch` crudo fuera de `src/api/` · nested:
sin nav item añadido · top-level: exactamente un nav item · la ruta coincide verbatim con el
brief · `npm run build` pasa · verificación visual en el browser cuando el cambio es visible al
usuario (un build verde no demuestra un flujo usable).

## Error handling

Falta el endpoint en el backend → HALT, enrutar al orquestador Api; nunca inventar un endpoint.
El developer necesita tocar `src/store.ts`/`src/api/` → HALT, escalar al architect. Dos loops de
verificación fallidos → surface al usuario con el diagnostic.
