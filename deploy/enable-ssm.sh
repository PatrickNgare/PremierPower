#!/usr/bin/env bash
# Make the instance reachable without inbound SSH.
#
#   PROFILE=myprofile ./deploy/enable-ssm.sh
#
# Why: SSH depends on the operator's network permitting outbound port 22, and
# many mobile carriers and office networks do not. The symptom is a connection
# timeout that looks exactly like a wrong security-group rule, so it sends you
# chasing the firewall you control instead of the one you do not.
#
# Systems Manager talks to the instance over the AWS API on 443, which is
# already open to anything that can reach the console. Nothing is opened
# inbound — SSM is strictly better than an SSH rule, not an addition to it.
set -euo pipefail

NAME="${NAME:-premierpower}"
ROLE="${ROLE:-${NAME}-ssm}"
PROFILE="${PROFILE:-${AWS_PROFILE:-}}"
REGION="${REGION:-$(aws ${PROFILE:+--profile "$PROFILE"} configure get region 2>/dev/null || echo eu-west-1)}"
aws_() { aws ${PROFILE:+--profile "$PROFILE"} --region "$REGION" "$@"; }

say() { printf '\n\033[1;32m==>\033[0m %s\n' "$*"; }
die() { printf '\033[1;31m !! \033[0m%s\n' "$*" >&2; exit 1; }

IID=$(aws_ ec2 describe-instances --filters "Name=tag:Name,Values=$NAME" \
      "Name=instance-state-name,Values=running" \
      --query 'Reservations[0].Instances[0].InstanceId' --output text)
[ "$IID" != "None" ] && [ -n "$IID" ] || die "No running instance tagged $NAME in $REGION."

if aws_ iam get-role --role-name "$ROLE" >/dev/null 2>&1; then
  say "Role $ROLE exists"
else
  say "Creating role $ROLE"
  aws_ iam create-role --role-name "$ROLE" --assume-role-policy-document \
    '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ec2.amazonaws.com"},"Action":"sts:AssumeRole"}]}' >/dev/null
fi

# The managed policy is exactly the SSM agent's needs and nothing more.
aws_ iam attach-role-policy --role-name "$ROLE" \
  --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore >/dev/null 2>&1 || true

if ! aws_ iam get-instance-profile --instance-profile-name "$ROLE" >/dev/null 2>&1; then
  say "Creating instance profile"
  aws_ iam create-instance-profile --instance-profile-name "$ROLE" >/dev/null
  aws_ iam add-role-to-instance-profile --instance-profile-name "$ROLE" --role-name "$ROLE" >/dev/null
  # IAM is eventually consistent; associating too soon fails with a role that
  # "does not exist" seconds after it was created.
  sleep 12
fi

CURRENT=$(aws_ ec2 describe-instances --instance-ids "$IID" \
          --query 'Reservations[0].Instances[0].IamInstanceProfile.Arn' --output text 2>/dev/null || echo None)
if [ "$CURRENT" = "None" ] || [ -z "$CURRENT" ]; then
  say "Attaching the profile to $IID"
  aws_ ec2 associate-iam-instance-profile --instance-id "$IID" \
    --iam-instance-profile "Name=$ROLE" >/dev/null
else
  say "Instance already has a profile: $CURRENT"
fi

say "Waiting for the SSM agent to register (up to 3 minutes)"
for i in $(seq 1 18); do
  s=$(aws_ ssm describe-instance-information \
      --filters "Key=InstanceIds,Values=$IID" \
      --query 'InstanceInformationList[0].PingStatus' --output text 2>/dev/null || echo None)
  [ "$s" = "Online" ] && { echo "  registered after $((i*10))s"; break; }
  sleep 10
  [ "$i" = 18 ] && die "Agent never registered. On Ubuntu it ships as a snap: check 'snap services amazon-ssm-agent'."
done

cat <<NEXT

  Deploys no longer need SSH. Run commands with:
      PROFILE=$PROFILE ./deploy/remote.sh 'cd ~/PremierPower && ./deploy/up.sh'

  The inbound SSH rule can now be removed entirely:
      aws ${PROFILE:+--profile $PROFILE} --region $REGION ec2 revoke-security-group-ingress \\
        --group-name $NAME --protocol tcp --port 22 --cidr <the-cidr>
NEXT
