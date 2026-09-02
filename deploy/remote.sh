#!/usr/bin/env bash
# Run a command on the instance without SSH, via Systems Manager.
#
#   PROFILE=myprofile ./deploy/remote.sh 'cd ~/PremierPower && ./deploy/up.sh'
#
# Uses send-command rather than start-session, so it needs no session-manager
# plugin locally — just the AWS CLI. Output is polled and printed when the
# command finishes, which suits deploys: a build on a t3.micro runs well past
# any interactive timeout.
set -euo pipefail

CMD="${1:?usage: ./deploy/remote.sh '<shell command>'}"
NAME="${NAME:-premierpower}"
TIMEOUT="${TIMEOUT:-2400}"
PROFILE="${PROFILE:-${AWS_PROFILE:-}}"
REGION="${REGION:-$(aws ${PROFILE:+--profile "$PROFILE"} configure get region 2>/dev/null || echo eu-west-1)}"
aws_() { aws ${PROFILE:+--profile "$PROFILE"} --region "$REGION" "$@"; }

IID=$(aws_ ec2 describe-instances --filters "Name=tag:Name,Values=$NAME" \
      "Name=instance-state-name,Values=running" \
      --query 'Reservations[0].Instances[0].InstanceId' --output text)
[ "$IID" != "None" ] && [ -n "$IID" ] || { echo "!! no running instance tagged $NAME" >&2; exit 1; }

# Commands run as root via SSM; the project lives in ubuntu's home and docker
# group membership belongs to ubuntu, so step into that user deliberately
# rather than relying on whatever HOME the agent happens to provide.
WRAPPED="su - ubuntu -c $(printf '%q' "$CMD")"

CID=$(aws_ ssm send-command --instance-ids "$IID" \
      --document-name AWS-RunShellScript \
      --comment "premierpower deploy" \
      --timeout-seconds "$TIMEOUT" \
      --parameters "commands=[$(printf '%s' "$WRAPPED" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')]" \
      --query 'Command.CommandId' --output text)

echo "==> command $CID on $IID"
while true; do
  st=$(aws_ ssm get-command-invocation --command-id "$CID" --instance-id "$IID" \
       --query Status --output text 2>/dev/null || echo Pending)
  case "$st" in
    Success|Failed|Cancelled|TimedOut) break ;;
    *) printf '.'; sleep 15 ;;
  esac
done
echo; echo "==> $st"
aws_ ssm get-command-invocation --command-id "$CID" --instance-id "$IID" \
  --query StandardOutputContent --output text | tail -40
ERR=$(aws_ ssm get-command-invocation --command-id "$CID" --instance-id "$IID" \
      --query StandardErrorContent --output text)
[ -n "$ERR" ] && [ "$ERR" != "None" ] && { echo "--- stderr ---"; echo "$ERR" | tail -20; }
[ "$st" = "Success" ] || exit 1
