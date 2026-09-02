#!/usr/bin/env bash
# Remove everything aws-provision.sh created, so the bill goes to zero.
#
#   ./deploy/aws-teardown.sh
#
# DESTRUCTIVE. It terminates the instance and deletes its disk, which takes the
# database with it. Take a backup first if the CMS content matters:
#
#   scp -i ~/.ssh/premierpower.pem \
#       ubuntu@<ip>:~/PremierPower/deploy/backups/*.gz .
set -euo pipefail

NAME="${NAME:-premierpower}"
PROFILE="${PROFILE:-${AWS_PROFILE:-}}"
REGION="${REGION:-$(aws ${PROFILE:+--profile "$PROFILE"} configure get region 2>/dev/null || echo eu-west-1)}"
KEY_FILE="${KEY_FILE:-$HOME/.ssh/${NAME}.pem}"

say() { printf '\n\033[1;32m==>\033[0m %s\n' "$*"; }
die() { printf '\033[1;31m !! \033[0m%s\n' "$*" >&2; exit 1; }
aws_() { aws ${PROFILE:+--profile "$PROFILE"} --region "$REGION" "$@"; }

command -v aws >/dev/null || die "AWS CLI not installed."
aws_ sts get-caller-identity >/dev/null 2>&1 || die "AWS CLI has no working credentials for profile ${PROFILE:-default}."

IID=$(aws_ ec2 describe-instances \
      --filters "Name=tag:Name,Values=$NAME" "Name=instance-state-name,Values=pending,running,stopped,stopping" \
      --query 'Reservations[0].Instances[0].InstanceId' --output text 2>/dev/null || echo None)
EIP=$(aws_ ec2 describe-addresses --filters "Name=tag:Name,Values=$NAME" \
      --query 'Addresses[0].PublicIp' --output text 2>/dev/null || echo None)

cat <<PLAN

  Region    $REGION
  Instance  ${IID}      <- terminated, root volume deleted
  Elastic   ${EIP}      <- released
  Sec group $NAME       <- deleted
  Key pair  $NAME       <- deleted from AWS ($KEY_FILE left on disk)

  The database lives on that instance. Terminating it destroys the CMS
  content. Back it up first if you need it.

PLAN
read -r -p "Type the word 'destroy' to proceed: " ok
[ "$ok" = "destroy" ] || die "Nothing removed."

if [ "$IID" != "None" ] && [ -n "$IID" ]; then
  say "Terminating $IID"
  aws_ ec2 terminate-instances --instance-ids "$IID" >/dev/null
  aws_ ec2 wait instance-terminated --instance-ids "$IID"
fi

if [ "$EIP" != "None" ] && [ -n "$EIP" ]; then
  ALLOC=$(aws_ ec2 describe-addresses --filters "Name=tag:Name,Values=$NAME" --query 'Addresses[0].AllocationId' --output text)
  say "Releasing $EIP"
  # An unattached Elastic IP is billed hourly, so this is the one step that
  # actually has to happen.
  aws_ ec2 release-address --allocation-id "$ALLOC" 2>/dev/null || true
fi

say "Deleting the security group"
# The group cannot go until the instance's network interface is really gone,
# which lags termination by a few seconds.
for _ in $(seq 1 12); do
  aws_ ec2 delete-security-group --group-name "$NAME" 2>/dev/null && break
  sleep 5
done

say "Deleting the key pair"
aws_ ec2 delete-key-pair --key-name "$NAME" 2>/dev/null || true

say "Done. Confirm nothing is left:"
echo "    aws --region $REGION ec2 describe-instances --filters Name=tag:Name,Values=$NAME --query 'Reservations[].Instances[].State.Name'"
echo "    aws --region $REGION ec2 describe-addresses --filters Name=tag:Name,Values=$NAME"
echo
echo "  $KEY_FILE was left on disk; delete it yourself if you want it gone."
