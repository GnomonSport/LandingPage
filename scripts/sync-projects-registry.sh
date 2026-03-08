#!/bin/sh
# Zweck: Manuelle Synchronisierung der Projektdefinitionen nach projects/registry.js.
# Quelle: projects/*/meta.js

set -eu

ROOT_DIR=$(pwd)
PROJECTS_DIR="$ROOT_DIR/projects"
REGISTRY_PATH="$PROJECTS_DIR/registry.js"
TMP_FILE=$(mktemp)

printf '%s\n' '/**' > "$TMP_FILE"
printf '%s\n' ' * Zweck: Zentrale Projektdefinitionen (generiert).' >> "$TMP_FILE"
printf '%s\n' ' * Quelle: Projekte mit meta.js; Änderungen an dieser Datei werden beim Sync überschrieben.' >> "$TMP_FILE"
printf '%s\n' ' */' >> "$TMP_FILE"
printf '\n' >> "$TMP_FILE"
printf '%s\n' 'export const projectRegistry = [' >> "$TMP_FILE"

COUNT=0
LANDING_COUNT=0
ROUTES=""

for DIR in "$PROJECTS_DIR"/*; do
  [ -d "$DIR" ] || continue

  ID=$(basename "$DIR")
  case "$ID" in
    .* ) continue ;;
  esac

  META_PATH="$DIR/meta.js"
  [ -f "$META_PATH" ] || continue

  ROUTE=$(sed -En "s/^[[:space:]]*route:[[:space:]]*'([^']*)'.*/\\1/p" "$META_PATH" | head -n1)
  LANDING=$(sed -En "s/^[[:space:]]*isLanding:[[:space:]]*(true|false).*/\\1/p" "$META_PATH" | head -n1)
  TITLE=$(sed -En "s/^[[:space:]]*title:[[:space:]]*'([^']*)'.*/\\1/p" "$META_PATH" | head -n1)

  if [ -z "$ROUTE" ]; then
    echo "Missing route in $META_PATH" >&2
    rm -f "$TMP_FILE"
    exit 1
  fi

  if [ -z "$LANDING" ]; then
    echo "Missing isLanding in $META_PATH" >&2
    rm -f "$TMP_FILE"
    exit 1
  fi

  if [ -z "$TITLE" ]; then
    TITLE="$ID"
  fi

  printf '%s\n' "$ROUTES" | grep -qx "$ROUTE" && {
    echo "Duplicate route detected: $ROUTE" >&2
    rm -f "$TMP_FILE"
    exit 1
  }
  ROUTES=$(printf '%s\n%s' "$ROUTES" "$ROUTE")

  [ "$LANDING" = "true" ] && LANDING_COUNT=$((LANDING_COUNT + 1))

  printf '%s\n' '  {' >> "$TMP_FILE"
  printf "    id: '%s',\n" "$ID" >> "$TMP_FILE"
  printf "    route: '%s',\n" "$ROUTE" >> "$TMP_FILE"
  printf "    isLanding: %s,\n" "$LANDING" >> "$TMP_FILE"
  printf "    title: '%s',\n" "$TITLE" >> "$TMP_FILE"
  printf "    loader: () => import('./%s/index.js'),\n" "$ID" >> "$TMP_FILE"
  printf '%s\n' '  },' >> "$TMP_FILE"

  COUNT=$((COUNT + 1))
done

if [ "$LANDING_COUNT" -ne 1 ]; then
  echo "Exactly one landing project required, found: $LANDING_COUNT" >&2
  rm -f "$TMP_FILE"
  exit 1
fi

printf '%s\n' '];' >> "$TMP_FILE"
printf '\n' >> "$TMP_FILE"
printf '%s\n' 'export function getProjectRegistry() {' >> "$TMP_FILE"
printf '%s\n' '  return projectRegistry;' >> "$TMP_FILE"
printf '%s\n' '}' >> "$TMP_FILE"

mv "$TMP_FILE" "$REGISTRY_PATH"
echo "Synced $COUNT project(s) -> projects/registry.js"
