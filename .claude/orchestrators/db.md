# Orquestador de Base de Datos — `rx-db-owner`

Flujo para cualquier trabajo de esquema de base de datos: nuevas tablas, columnas, índices, FKs, restricciones, filas de datos iniciales, o mantenimiento del journal de migración DbUp. Agente único, pero con un **gate humano obligatorio** — ningún archivo de esquema se escribe antes de que el usuario apruebe explícitamente el SQL.

```
 Stage 0  Dispatch card      rx-db-owner recibe una card (README §1); no abre plan.md
    │
 Stage 1  Proposal           rx-db-owner redacta la migración POR ESCRITO (SQL exacto, up + down,
    │                        rationale, índices, impacto en el journal de DbUp) — NO escribe archivo aún
    │
 Stage 2  HUMAN GATE         presentar la propuesta al usuario; esperar aprobación explícita
    │                        ("looks good" / "go ahead"). El silencio NO es consentimiento.
    │
 Stage 3  Apply              rx-db-owner escribe la migración bajo
    │                        server/src/SalesAgent.Database/scripts/, la aplica en el stack local,
    │                        y verifica que se ejecutó (el journal de DbUp muestra que el script corrió)
    │
 Stage 4  Handoff + feedback rx-db-owner reporta la forma del esquema aplicado (tabla, columnas, tipos,
                              índices) para la api pipeline, y escribe su archivo de feedback →
                              <plan-dir>/feedback/phase-NN-<task-slug>--rx-db-owner.md
```

## Reglas

- El db-owner es el **único** agente que puede crear, editar, renombrar o eliminar un archivo `*.sql`
  bajo `server/src/SalesAgent.Database/scripts/`. Cualquier otro agente que necesite esquema
  escala aquí — rechazar cualquier diff de otro agente que contenga un cambio en `*.sql`.
- **Disciplina del journal DbUp:** los scripts se ejecutan una vez y quedan registrados. Un script ya ejecutado
  nunca se modifica para cambiar el schema liberado — los cambios siempre reciben un NUEVO script numerado.
- Cuando este orchestrator corre como un stage dentro de una tarea Api-pipeline, completa **antes**
  que `rx-api-developer` comience: el plan del tester y la implementación del developer siempre corren
  contra un esquema ya aplicado, nunca uno pendiente.
- Después de una migración que toque una entidad mapeada por el api-developer, el handoff del
  db-owner marca explícitamente qué entidades necesitan regeneración/verificación (el developer
  es dueño de eso).

## Protocolo compartido

Dispatch cards, feedback contract, gates, y recovery: ver [README.md](README.md) — vinculante aquí.
