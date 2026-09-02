#!/bin/sh
# Nightly database dump, kept for a week.
#
# A file rather than an inline compose command on purpose: in a YAML folded
# block (`>`), lines indented deeper than the first keep their newlines, so a
# shell pipeline written across several lines arrives at sh with a leading "|"
# and dies on "syntax error: unexpected |".
set -eu

DIR=/backups
KEEP_DAYS=7

mkdir -p "$DIR"
while true; do
  STAMP=$(date +%Y-%m-%d)
  if pg_dump -h db -U "${POSTGRES_USER:-premierpower}" -d "${POSTGRES_DB:-premierpower}" \
       | gzip > "$DIR/$STAMP.sql.gz.tmp"; then
    # Rename only on success, so a failed dump never overwrites a good one
    # with a truncated file.
    mv "$DIR/$STAMP.sql.gz.tmp" "$DIR/$STAMP.sql.gz"
    echo "backup ok: $STAMP ($(du -h "$DIR/$STAMP.sql.gz" | cut -f1))"
  else
    rm -f "$DIR/$STAMP.sql.gz.tmp"
    echo "backup FAILED: $STAMP" >&2
  fi
  find "$DIR" -name '*.sql.gz' -mtime "+$KEEP_DAYS" -delete
  sleep 86400
done
