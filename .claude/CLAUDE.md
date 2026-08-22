<!-- CODEGRAPH_START -->
## CodeGraph

En repositorios indexados por CodeGraph (existe un directorio `.codegraph/` en la raíz del repositorio), recurre a él ANTES de grep/find o leer archivos cuando necesites entender o localizar código:

- **Herramienta MCP** (cuando disponible): `codegraph_explore` responde a la mayoría de preguntas sobre código en una llamada — el código fuente verbatim de los símbolos relevantes junto con las llamadas entre ellos, incluyendo saltos de dispatch dinámico que grep no puede seguir. Nombra un archivo o símbolo en la consulta para leer su fuente actual con números de línea. Si está listado pero diferido, cárgalo por nombre vía tool search.
- **Shell** (siempre funciona): `codegraph explore "<nombres de símbolos o pregunta>"` imprime el mismo resultado.

Si no existe un directorio `.codegraph/`, omite CodeGraph por completo — la indexación es decisión del usuario.
<!-- CODEGRAPH_END -->

### Caveats de CodeGraph en este repositorio

Verificado 2026-08-02 contra el índice en vivo (1,974 archivos, 0 errores de parseo, watcher sincroniza en <4s).

- **Las listas de llamadores para verbos CRUD repetidos son poco confiables — usa grep antes de editarlos.** 65% de las aristas de llamada apuntan a un nombre con más de una definición, y el resolver elige un candidato incorrecto en lugar de abstenerse. `CreateAsync` tiene 62 definiciones, `GetByIdAsync` 44, `InsertAsync` 23. Fallo confirmado: `EmailTemplateEndpoint.cs:105` llama a `IEmailTemplateService.CreateAsync`, pero el graph lo atribuye a `AccountArtifactService::CreateAsync` de Accounts y la arista verdadera está completamente ausente. Lo mismo aplica a `UpdateAsync`, `DeleteAsync`, `ListAsync`, `ResolveAsync`.
- **Los símbolos con nombres distintivos resuelven exactamente** — incluyendo interface→impl y saltos de render JSX. Confía en esos blast radii.
- **`.sql` y `.md` no están indexados.** Las 33 migraciones de DbUp y cada archivo `USAGE_CONTRACT.md` / `docs/plans/**` son invisibles para CodeGraph. Las preguntas sobre esquema y contratos necesitan grep o rx-db-owner.
