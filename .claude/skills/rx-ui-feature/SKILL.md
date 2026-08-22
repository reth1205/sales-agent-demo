---
name: rx-ui-feature
description: "Cómo resolver una actividad no-CRUD en el SalesAgent UI: un flujo multi-paso, un cambio de comportamiento en una view existente, un componente compartido nuevo en src/components/, un cambio de shape en src/store.ts, o un módulo nuevo en src/api/. Ejecutado a través del orquestador Ui (rx-ui-architect → rx-ui-developer → rx-ui-auditor), con el trabajo de superficie compartida entregado por el architect antes de que el developer comience."
---

# /rx-ui-feature — Receta de Actividad del SalesAgent UI

Para trabajo frontend que NO es una page CRUD simple (esa es `/rx-ui-crud`): un flujo multi-paso,
un cambio de comportamiento en una view existente, un componente compartido nuevo, un cambio de
shape en `src/store.ts`, o un módulo nuevo en `src/api/`. Ejecutado a través del **orquestador
Ui** (`.claude/orchestrators/ui.md`).

## Uso

```
/rx-ui-feature <descripción en lenguaje natural, nombrando la(s) view(s)/componente(s)>
```

Cuando se despacha desde `/feature`, la **tarjeta de despacho** es la especificación — su tabla
BRIEF y ACCEPTANCE, y sus nombres del Vocabulary verbatim. No abrir `plan.md`.

## Fase 0 — Dar forma a la actividad

Clasificar antes de despachar — la división decide quién hace qué:

| Forma de la actividad | Responsabilidad |
|---|---|
| Cambio de comportamiento/flujo dentro de `src/views/**` o `src/components/**` existentes | developer implementa; brief del architect aún define archivos + guardrails |
| Componente compartido nuevo en `src/components/` (genuinamente reusable, no ligado a una view) | **architect lo entrega primero**, refactorizando call sites existentes si es una promoción de tercera repetición |
| Cambio de shape en `src/store.ts` / `src/types.ts` | solo architect |
| Módulo nuevo en `src/api/` | solo architect |
| Ruta nueva | architect la especifica en el brief; developer la registra en `src/main.tsx` |
| Brecha en backend (endpoint faltante) | HALT — enrutar la brecha al orquestador Api; nunca inventar endpoints |
| Copia/texto o corrección de bug a nivel de view | **Vía directa** — un developer, sin directorio de plan (`/feature` Stage 0b) |

## Pipeline

Cada fila en la tabla anterior que dice "solo architect" es un disparador de **`LANE: Full`**; una
tarea que no necesita ninguno de ellos es una **Slice** y salta el paso 1 (la tarjeta lleva el
brief).

1. **`rx-ui-architect`** — desde la tarjeta de despacho; verifica cada endpoint tocado contra las
   routes reales del backend; entrega todo trabajo de superficie compartida; produce el Design
   Brief: lista de archivos con propósito, contratos `src/api/` consumidos, rutas verbatim,
   guardrails explícitos de out-of-scope.
2. **`rx-ui-developer`** — implementa exactamente según el brief dentro de `src/views/**` +
   `src/components/**` (+ registro de ruta en `src/main.tsx` si el brief lo especifica);
   disciplina SolidJS (sin props destructuradas, `<For>`/`<Show>`, sin patrones de React);
   `npm run build`.
3. **`rx-ui-auditor`** — contexto fresco; U-catalog + conformidad de spec vs plan/brief. Gate +
   loop según el orquestador (bloquear CRITICAL/high, max 2 ciclos).

Obligaciones de la tarjeta de despacho y feedback por `.claude/orchestrators/README.md` — los
agentes trabajan desde la tarjeta, nunca `plan.md`, y cada escribe su propio archivo de feedback
de dos secciones en la carpeta `feedback/` del plan; sin feedback → sin checkmark.

## Reglas estrictas

- El developer nunca toca `src/store.ts`, `src/api/*`, `src/types.ts` (tipos compartidos), o crea
  un componente compartido nuevo — esos cambios son del architect y ocurren ANTES de que el
  developer ejecute.
- Views/componentes permanecen consistentes con el patrón existente (state vía `store`/
  `selectors`, presentación vía `components/`).
- Verificar visualmente cuando el cambio es visible al usuario: correr `npm run dev` y recorrer el
  flujo en el browser antes de declarar done — un build verde no demuestra un flujo usable.
- Sin librería de caching nueva (Dexie/IndexedDB u otra) sin sign-off del architect — extiende el
  patrón `state.queue` + `actions.syncQueue` existente.
