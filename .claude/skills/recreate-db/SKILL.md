---
name: recreate-db
description: >
  Eliminar y recrear la base de datos Postgres local de SalesAgent desde cero ejecutando el
  runner de DbUp en modo RESET_DB. Replays todos los scripts de esquema + datos semilla en
  orden contra una base de datos fresca. No toca ningún otro servicio Docker. Usa cuando el
  usuario dice "recreate the database", "reset the db", "wipe the database", "fresh database",
  "drop and recreate db", o "/recreate-db".
---

# /recreate-db

Eliminar y recrear la base de datos Postgres local de SalesAgent y replay todos los scripts de
migración DbUp desde cero.

## Prerrequisitos (verificar primero; detente y avisa al usuario si alguno falla)

1. **Postgres corriendo.** Si no está arriba: `docker compose -f server/docker-compose.local.yml
   up -d` desde la raíz del repo.
2. **`dotnet` disponible:** `dotnet --version`.

## Ejecutar el reset de la base de datos

```bash
cd server/src/SalesAgent.Database
RESET_DB=1 dotnet run
```

`RESET_DB=1` activa el runner para eliminar y recrear la base de datos vía Npgsql, luego ejecuta
todos los scripts DbUp en `scripts/` en orden numérico. La salida de éxito termina con exit code 0
y un mensaje confirmando cuántos scripts corrieron.

## Verificar

```bash
docker compose -f server/docker-compose.local.yml exec -T postgres \
  psql -U postgres -d salesagent -c "\dt"
docker compose -f server/docker-compose.local.yml exec -T postgres \
  psql -U postgres -d salesagent -c "SELECT scriptname FROM schemaversions ORDER BY applied DESC LIMIT 5;"
```

O, si el backend está corriendo: `curl -sf http://localhost:5287/health` (puerto del profile
`http` en `server/src/SalesAgent.Api/Properties/launchSettings.json`).

## Notas

- **Omitir `RESET_DB=1`** para ejecutar una migración normal (solo aplica nuevos scripts, nunca
  elimina datos).
- Esto borra todos los datos locales — cualquier dato semilla de dev se reaplica automáticamente
  vía los scripts de seed, pero cualquier dato creado manualmente en la sesión se pierde.
