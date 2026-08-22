#!/bin/bash
# translate-md-es.sh
# Translates all .md files from rm-heimdall/.claude to Spanish
# Processes one file at a time to avoid saturating the local model

SOURCE_ROOT="C:/Users/renet/Documents/dev/rm-heimdall/.claude"
DEST_ROOT="C:/Users/renet/Documents/dev/.claude"

# Create destination directory structure
mkdir -p "$DEST_ROOT"

# Get list of all .md files
mapfile -t FILES < <(find "$SOURCE_ROOT" -name "*.md" 2>/dev/null)

TOTAL=${#FILES[@]}
COUNT=0

echo "=== Translation Started ==="
echo "Source: $SOURCE_ROOT"
echo "Destination: $DEST_ROOT"
echo "Total files: $TOTAL"
echo ""

for src_path in "${FILES[@]}"; do
  COUNT=$((COUNT + 1))
  relative_path="${src_path#$SOURCE_ROOT/}"
  dest_path="$DEST_ROOT/$relative_path"
  dest_dir="$(dirname "$dest_path")"

  echo "[$COUNT/$TOTAL] Processing: $relative_path"

  # Create destination directory
  mkdir -p "$dest_dir"

  # Read file content
  if [ ! -f "$src_path" ] || [ ! -s "$src_path" ]; then
    echo "  SKIP: empty or unreadable"
    continue
  fi

  content=$(cat "$src_path")

  # Translate using Claude Code via CLI
  # We pipe the content to a prompt that instructs translation
  translated=$(cat <<'PROMPT_EOF' | claude -p
You are a translator working in a local model environment. Translate the following markdown file to Spanish.

RULES:
1. DO NOT translate technical content: code blocks, YAML frontmatter, JSON, command names, file paths, URLs, code identifiers, function names, class names, variable names, API endpoints, HTTP methods, database terms (SQL, PostgreSQL, RLS, JSONB, etc.), framework names, tool names, or any technical jargon that would lose meaning in Spanish.
2. DO translate: headings (if they contain prose), descriptions, instructions, explanations, comments, documentation text, any natural language prose.
3. Preserve ALL markdown formatting exactly (headers, lists, code blocks, links, etc.).
4. Preserve ALL code blocks exactly - do not modify anything inside triple backticks.
5. Preserve ALL YAML frontmatter exactly.
6. Maintain good prose quality in Spanish.
7. Do NOT ask questions - make reasonable decisions autonomously.
8. Output ONLY the translated markdown content, nothing else. No explanations, no preamble, no markdown code fence around the output.

Here is the file content:

---
PROMPT_EOF
  echo "$content"
  cat <<'SUFFIX_EOF'
---

Return only the translated markdown:
SUFFIX_EOF
  )

  if [ -z "$translated" ]; then
    echo "  ERROR: no translation returned"
    continue
  fi

  # Write translated content
  echo "$translated" > "$dest_path"
  echo "  DONE: written to $relative_path"
done

echo ""
echo "=== Translation Complete ==="
echo "Processed $COUNT files"
