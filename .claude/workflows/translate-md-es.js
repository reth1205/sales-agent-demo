export const meta = {
  name: 'translate-md-es',
  description: 'Translate all .md files from rm-heimdall/.claude to Spanish',
  phases: [{ title: 'Translate all files' }],
}

const SOURCE_ROOT = 'C:/Users/renet/Documents/dev/rm-heimdall/.claude'
const DEST_ROOT = 'C:/Users/renet/Documents/dev/.claude'

// Get the list of md files
const { stdout: findStdout } = await $exec('find "' + SOURCE_ROOT + '" -name "*.md"')
const files = findStdout.trim().split('\n').filter(Boolean)

log(`Found ${files.length} markdown files to translate`)

// Process each file sequentially (one at a time to avoid saturating calls)
for (const srcPath of files) {
  const relativePath = srcPath.replace(SOURCE_ROOT + '/', '')
  const destPath = DEST_ROOT + '/' + relativePath

  log(`Translating: ${relativePath}`)

  // Read the source file content
  const { stdout: fileContent } = await $exec('cat "' + srcPath + '"')
  if (!fileContent || !fileContent.trim()) {
    log(`  SKIP: empty or unreadable`)
    continue
  }

  // Translate content to Spanish via agent
  const translated = await agent(
    `You are a translator working in a local model environment. Translate the following markdown file to Spanish.

RULES:
1. DO NOT translate technical content: code blocks, YAML frontmatter, JSON, command names, file paths, URLs, code identifiers, function names, class names, variable names, API endpoints, HTTP methods, database terms (SQL, PostgreSQL, RLS, JSONB, etc.), framework names, tool names, or any technical jargon that would lose meaning in Spanish.
2. DO translate: headings (if they contain prose), descriptions, instructions, explanations, comments, documentation text, any natural language prose.
3. Preserve ALL markdown formatting exactly (headers, lists, code blocks, links, etc.).
4. Preserve ALL code blocks exactly - do not modify anything inside triple backticks.
5. Preserve ALL YAML frontmatter exactly.
6. Maintain good prose quality in Spanish.
7. Do NOT ask questions - make reasonable decisions autonomously.
8. Output ONLY the translated markdown content, nothing else. No explanations, no preamble.

Here is the file content:

---
${fileContent}
---

Return only the translated markdown:`,
    {
      phase: 'Translate all files',
    }
  )

  if (!translated || !translated.trim()) {
    log(`  ERROR: no translation returned`)
    continue
  }

  // Write the translated file (create dirs first)
  await $exec('mkdir -p "' + destPath.replace(/\\/g, '/').replace(/[^/]+$/, '') + '"')
  await $exec('echo "' + translated.replace(/"/g, '\\"') + '" > "' + destPath + '"')
  log(`  DONE: written to ${relativePath}`)
}

log(`Translation complete. Processed ${files.length} files.`)
