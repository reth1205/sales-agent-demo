---
name: rename-sweep
description: "Procedimiento seguro para renombrados masivos, movimientos y eliminaciones de conceptos en todo el repositorio (renombrado de identificadores, paquetes/aplicaciones, eliminación de campos/wire, movimientos de directorios). Reemplazo basado en scripts desde una lista de sustitución legible por máquina, verificaciones con grep antes y después, y validación por reconstrucción — nunca sed/perl en bucles de shell. Usar al renombrar un paquete/aplicación/módulo, eliminar un campo o concepto en todo el repositorio, mover un árbol de directorios, o cuando el usuario diga 'rename sweep', 'bulk rename', o '/rename-sweep'."
---

# /rename-sweep — renombrado masivo / movimiento / eliminación, sin corrupción

Dos desastres documentados motivan esta habilidad: un `perl -pi` en bucle de shell corrompió cada literal `--` en 26 archivos movidos (520 invocaciones con `2>/dev/null || true`; el grep del patrón antiguo dio un falso all-clear), y los greps con alcance de keyword repetidamente subestimaron el blast radius (plantillas YAML enviadas aún vinculando un campo wire eliminado).

## 1. La verificación con grep viene PRIMERO y define el trabajo

- Deriva la lista de archivos desde un grep en vivo de **tokens** (stem sin mayúsculas/minúsculas), nunca desde una lista de archivos escrita a mano o memoria. El comando grep va en el plan/breve — ES la especificación.
- Grep TODOS los tipos de archivo: `.cs`/`.jsx` más plantillas YAML, JSON i18n, docs/`.mdx`, workflows, archivos compose, lockfiles, READMEs. La peor falta fue código no fuente (`publish-content/templates/`).
- Para eliminaciones, también grep lo que la búsqueda por keyword pasa por alto: la **arity/forma** del constructor antiguo (`new TypeName(` con el conteo de parámetros antiguo) y **assertiones de ausencia** (`Assert.False(x.TryGetProperty("oldField"…)`) — ninguno contiene el stem del nombre eliminado de forma obvia.
- Valores de env: separa origen vs path — los archivos env cargan solo orígenes; grep los envs cambiados para fragmentos de path como auto-verificación.

## 2. Aplicar por script, nunca por bucle de shell

- Construye una **lista de sustitución legible por máquina** (JSON/TSV: old → new, opcionalmente por-glob), revisada antes de cualquier escritura. Dos agentes armando manualmente la misma lista de forma independiente es la señal de que debería haber sido un artifact.
- Aplica con un pequeño script Python/Node que lee la lista y edita archivos en memoria — nunca `for f in …; do sed -i/perl -pi … done` con args posicionales en pares, y NUNCA con `2>/dev/null || true` (esa combinación corrompió silenciosamente 26 archivos).
- `git mv` para movimientos (los renombrados en staged fueron la única razón por la que la corrupción fue recuperable).
- Trampas de dual-package: cuando el mismo nombre existe en dos paths (`webcheckin` × 2), acota cada sustitución por glob de directorio.

## 3. Verificar por reconstrucción, no por grep-del-old

- Grep-del-old-pattern no demuestra nada (pasó en los archivos corrompidos). En cambio:
  reconstruye el contenido esperado desde `git show HEAD:<oldpath>` + la lista de sustitución y **byte-diff** contra el working tree; investiga cada mismatch.
- Luego las verificaciones reales, temprano: `dotnet build server/SalesAgent.slnx` (el único
  enumerator confiable de C#), `npm run build` desde la raíz del repo (type-check vía `tsc -b` +
  bundle vía Vite).
- Lockfiles (`package-lock.json`, `packages.lock.json`): espera drift transitivo tras un rename de
  paquete — regenera, verifica solo deps directas; no edites manualmente.
- Vuelve a leer archivos de prose editados para detectar frases auto-contradictorias tras la sustitución ("the X formerly known as X").

## 4. Disciplina de alcance

- Correcciones "While-I'm-here" (un puerto incorrecto, un link stale) son entradas separadas en la lista que el usuario aprueba, nunca modificaciones silenciosas.
- Hits cross-boundary (archivos C# coincidados durante un rename de UI) requieren una regla explícita del orchestrator — no edites silenciosamente fuera del territorio de tu dispatch.
- Archivos de docs/plans/memory que describen el nombre antiguo: haz sweep también o registra por qué no.
