# Plan de despliegue - Sales Agent Demo en Vercel

Fecha: 2026-05-19  
Aplicacion: SolidJS + Vite + TypeScript  
Estrategia recomendada: Vercel con despliegue automatico desde repositorio Git.

## 1. Opinion y recomendacion

Vercel es una buena opcion para este demo porque la aplicacion es un frontend estatico generado por Vite, sin backend propio ni variables sensibles obligatorias. El flujo Git + Vercel permite:

- Despliegue automatico en cada push.
- Preview deployments por rama o pull request.
- Produccion al hacer merge a la rama principal.
- Rollback rapido desde el dashboard.
- Configuracion minima para Vite.

Para este proyecto, la recomendacion es usar Vercel conectado a GitHub o GitLab, con `main` como rama de produccion y previews automaticos para ramas de trabajo.

## 2. Estado actual del proyecto

El proyecto ya tiene los elementos necesarios:

- `package.json`
- `package-lock.json`
- `vite.config.ts`
- `index.html`
- `src/`
- Script de build:

```bash
npm run build
```

La salida de build de Vite es:

```text
dist
```

No se requieren variables de entorno para el demo actual.

## 3. Preparacion del repositorio Git

### 3.1 Inicializar Git si todavia no existe

```bash
git init
git add .
git commit -m "Initial SolidJS sales agent demo"
```

### 3.2 Confirmar `.gitignore`

El repo debe excluir:

```text
node_modules/
dist/
.artifacts/
*.tsbuildinfo
.env
.env.local
```

### 3.3 Crear repositorio remoto

Crear un repo en GitHub, GitLab o Bitbucket. Recomendado para este proyecto:

```text
GitHub
```

Ejemplo:

```bash
git branch -M main
git remote add origin <repo-url>
git push -u origin main
```

## 4. Configuracion en Vercel

### 4.1 Importar proyecto

1. Entrar a Vercel.
2. Seleccionar `Add New Project`.
3. Importar el repositorio Git.
4. Seleccionar el repo `sales-agent-demo`.

### 4.2 Build settings

Configuracion recomendada:

| Campo | Valor |
| --- | --- |
| Framework Preset | `Vite` |
| Install Command | `npm install` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Root Directory | `./` |
| Node.js Version | Usar version estable soportada por Vercel |

No agregar `vercel.json` inicialmente. Vercel detecta Vite y puede configurar build/output automaticamente. Agregar `vercel.json` solo si se necesita fijar reglas explicitas.

### 4.3 SPA fallback

Como la app usa rutas client-side (`@solidjs/router`), las rutas como:

```text
/dashboard
/schedule
/visits/:visitId/questionnaire
```

deben resolver correctamente al recargar. Si Vercel no aplica fallback automaticamente para Vite, agregar:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Archivo:

```text
vercel.json
```

Decision recomendada:

- Primer deploy sin `vercel.json`.
- Si al recargar `/dashboard` o `/visits/visit-1/questionnaire` aparece 404, agregar `vercel.json` con rewrites.

## 5. Flujo de despliegue automatico

### Produccion

- Rama: `main`.
- Cada merge o push a `main` genera despliegue de produccion.
- URL esperada:

```text
https://<project-name>.vercel.app
```

### Preview

- Cada rama o pull request genera una URL de preview.
- Usar previews para validar cambios de UI antes de mergear a `main`.

### Flujo recomendado de trabajo

```text
feature branch -> pull request -> Vercel Preview -> review -> merge to main -> Production Deployment
```

## 6. Checklist previo al primer deploy

Ejecutar localmente:

```bash
npm install
npm run build
```

Validar:

- Login carga correctamente.
- Dashboard carga mapa.
- Schedule muestra visitas.
- `/visits/visit-1/questionnaire` funciona despues de iniciar cuestionario.
- Settings permite editar preguntas.
- Reporting carga sin errores.

Revisar que no se suba:

- `node_modules/`
- `dist/`
- `.artifacts/`
- `.env`

## 7. Checklist posterior al deploy

En la URL de Vercel:

- Abrir `/`.
- Iniciar sesion dummy.
- Navegar a Dashboard, Clients, Schedule, Reporting y Settings.
- Probar recarga directa en:
  - `/dashboard`
  - `/schedule`
  - `/settings`
  - `/visits/visit-1/questionnaire`
- Confirmar que Leaflet/OpenStreetMap carga tiles.
- Confirmar que el flujo `Start Visit -> Finish Interview -> Questionnaire -> Review -> Confirm submission` funciona.
- Confirmar que Settings persiste preguntas en `localStorage`.
- Confirmar que offline mode guarda elementos en pending sync.

## 8. Riesgos y mitigaciones

| Riesgo | Mitigacion |
| --- | --- |
| 404 al recargar rutas client-side | Agregar `vercel.json` con rewrite a `index.html` |
| Web Speech API no disponible en algunos navegadores | Mantener fallback manual |
| Permisos de ubicacion denegados | Usar `Use demo location` |
| Tiles de OpenStreetMap lentos o bloqueados | Mantener demo funcional con estados/listas aunque el mapa tarde |
| Datos guardados en `localStorage` no compartidos entre dispositivos | Documentarlo como limitacion del demo |

## 9. Comandos utiles

Build local:

```bash
npm run build
```

Preview local del build:

```bash
npm run preview
```

Deploy manual opcional con Vercel CLI:

```bash
npm i -g vercel
vercel
vercel --prod
```

El flujo recomendado sigue siendo Git automatico, no CLI manual.

## 10. Fuentes oficiales consultadas

- Vercel Git deployments: https://vercel.com/docs/deployments/git
- Vercel deployment methods: https://vercel.com/docs/deployments/deployment-methods
- Vercel build configuration: https://vercel.com/docs/deployments/configure-a-build
- Vercel builds: https://vercel.com/docs/builds
