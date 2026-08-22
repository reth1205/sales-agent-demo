# docs/plans/

Cada feature no-trivial (ruta Slice o Full — ver `.claude/skills/feature/SKILL.md`) obtiene un
directorio aquí, creado por la skill `/feature`:

```
docs/plans/YYYY-MM-DD-<AREA>-<requirement-slug>/
├── plan.md          ← de _templates/plan.md
└── feedback/        ← un archivo por agente que ejecutó una tarea del plan
```

Los directorios son **append-only**: nunca movidos, renombrados, o eliminados una vez creados.
Un plan cerrado (`status: closed` en el frontmatter de `plan.md`) permanece como registro
histórico y como corpus para la skill `/improve`.

- Plantillas: `_templates/plan.md`, `_templates/feedback.md`.
- Protocolo de dispatch card / feedback: `.claude/orchestrators/README.md`.
- Cómo se crea y ejecuta un plan: `.claude/skills/feature/SKILL.md`.
- Cómo se mina el corpus de feedback acumulado: `.claude/skills/improve/SKILL.md`.
