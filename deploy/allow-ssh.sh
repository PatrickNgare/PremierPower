#!/usr/bin/env bash
# Re-point the SSH rule at wherever you are now.
#
#   PROFILE=patrickngare ./deploy/allow-ssh.sh
#
# SSH is restricted to a single address, which is right — but home and mobile
# connections change address regularly, and the symptom is an unhelpful
# "Connection timed out" long after the change. This swaps the rule rather than
# accumulating stale ones, so the group never quietly grows a list of addresses
# that used to be yours.
set -euo pipefail

NAME="${NAME:-premierpower}"
PROFILE="${PROFILE:-${AWS_PROFILE:-}}"
REGION="${REGION:-$(aws ${PROFILE:+--profile "$PROFILE"} configure get region 2>/dev/null || echo eu-west-1)}"
aws_() { aws ${PROFILE:+--profile "$PROFILE"} --region "$REGION" "$@"; }

NOW=$(curl -fsS --max-time 15 https://checkip.amazonaws.com | tr -d '\n')
[ -n "$NOW" ] || { echo "!! could not determine your public IP" >&2; exit 1; }

SG=$(aws_ ec2 describe-security-groups --filters "Name=group-name,Values=$NAME" \
      --query 'SecurityGroups[0].GroupId' --output text)
[ "$SG" != "None" ] || { echo "!! security group '$NAME' not found in $REGION" >&2; exit 1; }

OLD=$(aws_ ec2 describe-security-groups --group-ids "$SG" \
      --query 'SecurityGroups[0].IpPermissions[?FromPort==`22`].IpRanges[].CidrIp' --output text)

for cidr in $OLD; do
  [ "$cidr" = "$NOW/32" ] && continue
  aws_ ec2 revoke-security-group-ingress --group-id "$SG" --protocol tcp --port 22 --cidr "$cidr" >/dev/null 2>&1 \
    && echo "  revoked $cidr"
done

if echo "$OLD" | grep -q "$NOW/32"; then
  echo "  $NOW/32 already allowed"
else
  aws_ ec2 authorize-security-group-ingress --group-id "$SG" --protocol tcp --port 22 --cidr "$NOW/32" >/dev/null
  echo "  allowed $NOW/32"
fi
