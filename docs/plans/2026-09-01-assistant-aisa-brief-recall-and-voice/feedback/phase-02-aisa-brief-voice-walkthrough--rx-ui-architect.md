# Feedback — phase-02 aisa-brief-voice-walkthrough (rx-ui-architect)

## Friction

- **La card pidió una decisión de factoring que la regla de "tercera repetición" no cubre.**
  El bloque de voz de `QuestionnaireStepper` (~190 líneas: plugin nativo, permisos, shim del
  Web Speech API) es la 2ª ocurrencia, así que la directiva dice duplicar. Pero duplicar
  *gestión de permisos* no es duplicar un patrón de render, y el costo de un bug divergente es
  alto. Resolví partiendo el patrón en dos: los **tipos** (shim estructural del Web Speech API)
  se promovieron a `src/types.ts` ahora — duplicación pura, cero riesgo — y la **lógica** se
  duplica simplificada, porque las dos semánticas difieren de verdad (acumulación continua hacia
  `store.answers` + comandos de navegación vs. captura one-shot hacia un signal local). La regla
  cuenta ocurrencias; debería contar *riesgo de divergencia*.

- **Refactorizar el call site existente es exactamente lo que la nota KNOWN-ACCEPTED prohíbe
  verificar.** La directiva de promoción manda refactorizar los call sites existentes, pero el
  path de voz de `QuestionnaireStepper` no es verificable en este entorno (sin micrófono). Un
  hook compartido hoy habría metido el flujo más importante de la demo en un refactor no
  verificable a cambio de nada. La directiva y la limitación de verificación se contradicen y
  ninguna de las dos lo reconoce.

- **`buildBriefingFollowUpAnswer` era texto con la voz equivocada, no código muerto.** La card
  ofrecía reusarla como fallback "Simulate answer". No sirve: genera a AISA *coacheando al rep*,
  y el fallback necesita al *rep respondiéndole a AISA*. La disposición correcta era borrarla y
  escribir `buildSimulatedBriefingReply`, con despacho **por índice posicional**, no por keyword
  — que es la causa raíz de las dos colisiones reportadas en la fase anterior.

## Proposed guide updates

| # | Target | Proposal | Status |
|---|---|---|---|
| 1 | `.claude/agents/rx-ui-architect.md` (Directiva 2) | Reformular "promover en la tercera repetición" para separar **tipos/constantes compartidos** (promover en la 2ª, es duplicación pura) de **lógica con estado** (3ª, y sólo si los call sites existentes son verificables). Añadir: si refactorizar el call site existente cae bajo una limitación KNOWN-ACCEPTED de verificación, la promoción se difiere y se documenta. | proposed |
| 2 | `.claude/agents/rx-ui-architect.md` (regla de keyword-dispatch) | Añadir la salida preferida, no sólo la verificación: cuando el texto generado se produce en **orden posicional fijo** (un array como `suggestedQuestions`), despachar por **índice**, no por `.includes()`. Elimina la clase de colisión en vez de comprobarla caso por caso. | proposed |
| 3 | `CLAUDE.md` (invariante de namespace global de keywords) | Aclarar el alcance: el invariante aplica sólo al texto que llega a `combineDebriefText`/`evaluateVisitObjectives`. El estado local del diálogo de briefing (nunca persistido) queda fuera — hoy se lee como si aplicara a todo texto generado, lo que obliga a una verificación innecesaria. | proposed |
