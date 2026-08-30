# RQ-07 — Gamificación y progreso diario

**Estado en el demo:** Implementado con fidelidad muy alta al modelo de scoring de la fuente formal — la parte de streaks/leaderboard queda pendiente.
**Código relacionado:** [`src/components/DailyProgressWidget.tsx`](../../src/components/DailyProgressWidget.tsx), función `addProgress` en `store.ts` ([store.ts:340](../../src/store.ts#L340)), tipo `ProgressState` en `types.ts`.
**Fuentes de negocio:** `docs/Feature Sales completion activity.pdf` (formal, FR + KPIs + modelo de scoring), `docs/MVP - 06_20 Summary.pdf` (KPIs de alto nivel), `docs/MVP - Mockup.pdf`/`docs/MVP - To do list.pdf` (tono y copy de streaks).

## 1. Resumen

El representante arranca cada día en 0% de completitud diaria (`Daily Completion`) y avanza acumulando puntos por acciones de negocio clave, con hitos motivacionales y (en visión de producto completa) rachas (streaks) de días consecutivos.

## 2. Requerimientos funcionales

- **RF-GAM-01**: El progreso diario inicia en 0% cada día.
- **RF-GAM-02**: El progreso avanza en tiempo real según un modelo de puntuación fijo por actividad:

  | Actividad | Contribución |
  |---|---|
  | Llegar a visita programada | +10% |
  | Registrar visita vía IA de voz / completar cuestionario | +20% |
  | Actualizar oportunidad | +15% |
  | Agregar tarea de seguimiento | +10% |
  | Agregar capturas/adjuntos | +5% |
  | Completar todas las visitas programadas | +20% |
  | Completar resumen de fin de día | +20% |

- **RF-GAM-03**: Deben dispararse hitos (milestones) con mensaje motivacional en 25% ("Great Start!"), 50% ("You're on track!"), 75% ("Excellent field activity!"), 100% ("Daily Mission Complete!").
- **RF-GAM-04**: Debe existir feedback motivacional de IA de tono definido — profesional, de apoyo, no infantil, ligero — ej. *"Nice work documenting that customer interaction."*, *"Only one more update to complete your day."*
- **RF-GAM-05**: Deben existir sugerencias inteligentes de siguiente acción para subir el % (ej. *"Add follow-up notes to reach 80%."*).
- **RF-GAM-06**: Debe rastrearse una racha (streak) de días consecutivos con 100% de completitud / agenda ejecutada completa / sin captura CRM faltante.
- **RF-GAM-07**: El progreso histórico debe persistirse (no solo el del día actual).
- **RF-GAM-08**: El indicador de progreso debe reforzarse visualmente en el mapa (pines de cliente cambiando de color según estado: pendiente→en progreso→completado) y en un indicador circular junto al perfil del usuario.

## 3. Reglas de negocio

- Principios de diseño conductual explícitos: fomentar sin presión, evitar sensación infantil, premiar consistencia sobre competencia pura, reducir carga cognitiva, reforzar productividad visualmente — no gamificación agresiva tipo juego casual.
- El progreso debe atarse a **acciones de negocio significativas**, nunca a interacciones triviales — mitigación explícita contra que el usuario "gamee" el sistema.

## 4. Datos y entidades involucradas

`ProgressState` (`percent`, `milestones: string[]`).

## 5. Estado actual en el demo

- **El modelo de scoring está implementado con una fidelidad casi literal** a la fuente formal: `addProgress(10)` al iniciar visita (`startVisit`), `addProgress(20)` al confirmar la primera revisión de una visita (`confirmReview`), `addProgress(15)` si hay actualización de oportunidad, `addProgress(10)` si hay tareas, `addProgress(5)` si hay adjuntos — coincide con la tabla de contribución de la fuente de negocio punto por punto.
- **Los 4 milestones (25/50/75/100%) están implementados con el mismo texto exacto** de la fuente de negocio (`store.ts:343-347`) — este es, junto con RQ-06, uno de los módulos donde el demo ya replica el requerimiento de negocio casi sin brecha.
- **NO implementado**: streaks de días consecutivos como feature de negocio real (el tipo `Agent.streakDays` existe en `types.ts` y hay un valor demo "4 days", pero no hay lógica de incremento/reset diario automático verificada); sugerencias inteligentes de siguiente acción (RF-GAM-05) como mensaje explícito; feedback motivacional de IA con copy dinámico (RF-GAM-04) — el demo usa toasts genéricos, no confirmado que tengan el tono/contenido específico de la fuente.
- El refuerzo visual en mapa (RF-GAM-08) se apoya en el sistema de tipos de pin de RQ-02 — revisar si el color por avance de captura (gris/azul/verde de esta fuente) está unificado o en conflicto con el color por tipo de cuenta de RQ-02 (ver nota transversal en `00-README.md`).

## 6. Requerimientos no funcionales

- Persistencia de progreso histórico (no solo sesión actual) — el demo ya persiste en `localStorage`, suficiente para el espíritu del requerimiento aunque no sea backend real.

## 7. Fuera de alcance (explícito, "enhancements futuros" en la fuente)

- Team Leaderboards (rankings regionales, campeones semanales).
- Experience Levels (Explorer, Connector, Closer, Strategic Seller).
- AI Coaching Insights basados en patrones de completitud (ej. *"You close more opportunities when visit notes are completed within 30 minutes."*).
- Integración de recompensas/incentivos de ventas reales, badges/certificaciones.

## 8. Preguntas abiertas / decisiones pendientes

- **¿El progreso diario se resetea automáticamente a las 00:00, o requiere una acción explícita?** — el demo tiene `resetDemoActivity`/`resetApp` como acciones manuales de demo, no un reset automático por fecha; producción necesita definir esto explícitamente (probablemente un job de backend).
- Confirmar si las 5 razones de negocio para el producto en `MVP - Business Inputs.pdf` (que incluyen "código de color fire/ice" para el progreso) deben tomarse como requerimiento visual literal o son solo inspiración de tono.
