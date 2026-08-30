## Friction

Ninguna. El ciclo de re-auditoría fue trivial de ejecutar: la card apuntó exactamente al commit
(`53314e9`) y a la línea a verificar, y `git diff 8971558..53314e9 -- src/` deja ver en una sola
pantalla que el fix es un diff de 4 líneas dentro del mismo `createEffect` ya auditado en ciclo 1
— cero superficie nueva que re-litigar. El único paso manual fue confirmar con `Read` que
`stopVoiceCapture()`/`cancelSpeech()` (líneas 278-279) siguen fuera del `if` y `speakText`
(líneas 280-282) quedó envuelto en `state.questionnaire.mode === 'voice'`, tal como el mensaje
de commit reclama — el código coincide con el claim, sin sorpresas.

## Proposed guide updates

Ninguna. El protocolo de dispatch card con `KNOWN-ACCEPTED` + foco de ciclo acotado
("verifica específicamente que el fix de AC5 es correcto y completo") funcionó exactamente como
está documentado — no generó trabajo de re-auditoría redundante sobre AC1–AC4/AC6–AC10.

---

## Resultado de la verificación (para el registro)

1. `speakText(question.prompt, 'en-US')` (línea 281) — gated correctamente tras
   `if (state.questionnaire.mode === 'voice')` (línea 280). ✔
2. `stopVoiceCapture()` (línea 278) y `cancelSpeech()` (línea 279) — incondicionales, antes del
   gate, dentro del mismo effect. ✔
3. `git show 53314e9 -- src/components/QuestionnaireStepper.tsx` — único cambio de producción:
   +2/-1 líneas exactamente el gate descrito arriba. Sin otros archivos de código tocados en el
   commit (solo 2 archivos de feedback markdown adicionales). ✔
4. `npm run build` — verde (`tsc -b && vite build`, 2040 módulos, sin errores, 3.21s). ✔
5. `git diff 8971558..53314e9 -- src/` — confirma que el alcance real del cambio es exactamente
   esas 4 líneas; AC1–AC4/AC6–AC10 y guardrails de superficie compartida no pudieron haberse
   roto porque nada más en `src/` cambió. `git status --porcelain` — limpio, sin untracked. ✔

No hay hallazgos nuevos. WARNING bajo del ciclo 1 (checklist como botones) permanece aceptado,
no re-litigado.
