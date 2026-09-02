#!/usr/bin/env bash
# Ship tracked files to the instance without SSH, over Systems Manager.
#
#   PROFILE=myprofile ./deploy/push.sh            # everything tracked
#   PROFILE=myprofile ./deploy/push.sh c973e40    # only what changed since a ref
#
# deploy/sync.sh is still the better tool when it works — rsync only moves what
# differs and has no size ceiling. This exists because that needs outbound port
# 22, which some networks block outright, and the failure looks exactly like a
# wrong security-group rule. SSM reaches the instance over the AWS API on 443,
# so it works wherever the console does.
#
# The payload rides inside the command document, which is capped, so a full
# push of this repo will not fit. Pass a ref and send a delta.
set -euo pipefail

FROM="${1:-}"
NAME="${NAME:-premierpower}"
DEST="${DEST:-/home/ubuntu/PremierPower}"
PROFILE="${PROFILE:-${AWS_PROFILE:-}}"
REGION="${REGION:-$(aws ${PROFILE:+--profile "$PROFILE"} configure get region 2>/dev/null || echo eu-west-1)}"
aws_() { aws ${PROFILE:+--profile "$PROFILE"} --region "$REGION" "$@"; }

cd "$(dirname "$0")/.."
TAR=$(mktemp /tmp/pp-push-XXXXXX.tgz)
trap 'rm -f "$TAR"' EXIT

if [ -n "$FROM" ]; then
  mapfile -t FILES < <(git diff --name-only "$FROM"..HEAD)
  # A file deleted since that ref cannot be tarred; skip it and say so.
  KEEP=(); for f in "${FILES[@]}"; do [ -f "$f" ] && KEEP+=("$f") || echo "  skipping deleted: $f"; done
  [ ${#KEEP[@]} -gt 0 ] || { echo "Nothing to send since $FROM."; exit 0; }
  printf '%s\n' "${KEEP[@]}" | tar czf "$TAR" -T -
  echo "==> ${#KEEP[@]} file(s) changed since $FROM"
else
  git ls-files -z | tar czf "$TAR" --null -T -
  echo "==> all tracked files"
fi

B64=$(base64 -w0 "$TAR")
SIZE=${#B64}
echo "==> payload ${SIZE} chars"
# The service caps the whole document; leave room for the surrounding shell.
[ "$SIZE" -lt 90000 ] || {
  echo "!! payload too large for a single command. Pass a git ref to send a delta," >&2
  echo "   or use deploy/sync.sh from a network that permits outbound SSH." >&2
  exit 1
}

IID=$(aws_ ec2 describe-instances --filters "Name=tag:Name,Values=$NAME" \
      "Name=instance-state-name,Values=running" \
      --query 'Reservations[0].Instances[0].InstanceId' --output text)
[ "$IID" != "None" ] && [ -n "$IID" ] || { echo "!! no running instance tagged $NAME" >&2; exit 1; }

# Written to a file first, then unpacked: a pipe straight from echo loses the
# tail of a large payload on some shells.
read -r -d '' SCRIPT <<EOF || true
set -e
mkdir -p $DEST
printf '%s' '$B64' > /tmp/pp-push.b64
base64 -d /tmp/pp-push.b64 > /tmp/pp-push.tgz
tar xzf /tmp/pp-push.tgz -C $DEST
chown -R ubuntu:ubuntu $DEST
chmod +x $DEST/deploy/*.sh
rm -f /tmp/pp-push.b64 /tmp/pp-push.tgz
echo "unpacked into $DEST"
EOF

# Parameters go in as a JSON file, not the "key=[value]" shorthand. The
# shorthand does not decode JSON escapes, so a multi-line script arrives as one
# mangled line and dash fails on the first token it cannot read.
PARAMS=$(mktemp /tmp/pp-params-XXXXXX.json)
trap 'rm -f "$TAR" "$PARAMS"' EXIT
python3 - "$SCRIPT" > "$PARAMS" <<'PY'
import json, sys
json.dump({"commands": [sys.argv[1]]}, sys.stdout)
PY

CID=$(aws_ ssm send-command --instance-ids "$IID" \
      --document-name AWS-RunShellScript --comment "premierpower push" \
      --timeout-seconds 600 \
      --parameters "file://$PARAMS" \
      --query 'Command.CommandId' --output text)

echo "==> command $CID"
while true; do
  st=$(aws_ ssm get-command-invocation --command-id "$CID" --instance-id "$IID" \
       --query Status --output text 2>/dev/null || echo Pending)
  case "$st" in Success|Failed|Cancelled|TimedOut) break ;; *) printf '.'; sleep 8 ;; esac
done
echo; echo "==> $st"
aws_ ssm get-command-invocation --command-id "$CID" --instance-id "$IID" \
  --query StandardOutputContent --output text | tail -5
[ "$st" = "Success" ] || {
  aws_ ssm get-command-invocation --command-id "$CID" --instance-id "$IID" \
    --query StandardErrorContent --output text | tail -10
  exit 1
}
