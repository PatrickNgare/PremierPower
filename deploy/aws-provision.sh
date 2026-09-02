#!/usr/bin/env bash
# Provision the whole thing on AWS, end to end.
#
#   aws configure                 # once — your keys never leave your machine
#   ./deploy/aws-provision.sh
#
# Uses the default credentials profile. To use a named one:
#
#   PROFILE=myprofile ./deploy/aws-provision.sh
#
# Creates: a key pair, a security group, an Elastic IP and one EC2 instance,
# then installs Docker and this repository on it. Idempotent — re-running finds
# what already exists instead of making a second one.
#
# It stops short of starting the site, because that needs secrets (.env) that
# must be written on the box and never committed or passed on a command line.
set -euo pipefail

NAME="${NAME:-premierpower}"
PROFILE="${PROFILE:-${AWS_PROFILE:-}}"
REGION="${REGION:-$(aws ${PROFILE:+--profile "$PROFILE"} configure get region 2>/dev/null || echo eu-west-1)}"
TYPE="${TYPE:-t3.micro}"
DISK="${DISK:-20}"
KEY_FILE="${KEY_FILE:-$HOME/.ssh/${NAME}.pem}"
REPO="${REPO:-https://github.com/PatrickNgare/PremierPower.git}"

say()  { printf '\n\033[1;32m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m !! \033[0m%s\n' "$*"; }
die()  { printf '\033[1;31m !! \033[0m%s\n' "$*" >&2; exit 1; }
aws_() { aws ${PROFILE:+--profile "$PROFILE"} --region "$REGION" "$@"; }

command -v aws >/dev/null || die "AWS CLI not installed. See DEPLOY.md."
if ! aws_ sts get-caller-identity >/dev/null 2>&1; then
  echo "AWS CLI has no working credentials for profile '"'"'${PROFILE:-default}'"'"'." >&2
  echo >&2
  echo "Profiles this machine knows about:" >&2
  aws configure list-profiles 2>/dev/null | sed '"'"'s/^/  /'"'"' >&2 || true
  echo >&2
  echo "Either run:  aws configure" >&2
  echo "or pick one: PROFILE=<name> $0" >&2
  exit 1
fi

ACCOUNT=$(aws_ sts get-caller-identity --query Account --output text)
MYIP=$(curl -fsS --max-time 10 https://checkip.amazonaws.com | tr -d '\n')
[ -n "$MYIP" ] || die "Could not determine your public IP for the SSH rule."

cat <<PLAN

  Account   $ACCOUNT
  Region    $REGION
  Instance  $TYPE, ${DISK}GB gp3, Ubuntu 24.04
  SSH from  $MYIP/32   (only this address)
  Open      80, 443 to the world; 22 to you

  Free tier covers 750 instance-hours a month. Outside it this is roughly
  \$8-9/month. Set a billing alarm before you leave: Billing -> Budgets.

PLAN
read -r -p "Create these resources? [y/N] " ok
[ "$ok" = "y" ] || [ "$ok" = "Y" ] || die "Nothing created."

# ── key pair ────────────────────────────────────────────────────────────────
if aws_ ec2 describe-key-pairs --key-names "$NAME" >/dev/null 2>&1; then
  say "Key pair '$NAME' exists"
  [ -f "$KEY_FILE" ] || die "Key pair exists in AWS but $KEY_FILE is missing. Delete the pair in the console and re-run, or restore the file."
else
  say "Creating key pair -> $KEY_FILE"
  mkdir -p "$(dirname "$KEY_FILE")"
  aws_ ec2 create-key-pair --key-name "$NAME" \
    --query KeyMaterial --output text > "$KEY_FILE"
  chmod 600 "$KEY_FILE"
fi

# ── security group ──────────────────────────────────────────────────────────
VPC=$(aws_ ec2 describe-vpcs --filters Name=is-default,Values=true --query 'Vpcs[0].VpcId' --output text)
[ "$VPC" != "None" ] || die "No default VPC in $REGION."

SG=$(aws_ ec2 describe-security-groups --filters "Name=group-name,Values=$NAME" \
      --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null || echo None)
if [ "$SG" = "None" ]; then
  say "Creating security group"
  SG=$(aws_ ec2 create-security-group --group-name "$NAME" \
        --description "PremierPower site" --vpc-id "$VPC" --query GroupId --output text)
else
  say "Security group exists ($SG)"
fi

# Each rule is added independently; an existing one is not an error worth stopping for.
for rule in "80:0.0.0.0/0" "443:0.0.0.0/0" "22:$MYIP/32"; do
  port="${rule%%:*}"; cidr="${rule#*:}"
  aws_ ec2 authorize-security-group-ingress --group-id "$SG" \
    --protocol tcp --port "$port" --cidr "$cidr" >/dev/null 2>&1 \
    && echo "    opened $port from $cidr" \
    || echo "    $port from $cidr already present"
done
warn "Postgres (5440) and the API (8010) are deliberately NOT opened. They bind"
warn "to loopback on the instance; Caddy is the only public listener."

# ── instance ────────────────────────────────────────────────────────────────
IID=$(aws_ ec2 describe-instances \
      --filters "Name=tag:Name,Values=$NAME" "Name=instance-state-name,Values=pending,running,stopped" \
      --query 'Reservations[0].Instances[0].InstanceId' --output text 2>/dev/null || echo None)

if [ "$IID" = "None" ] || [ -z "$IID" ]; then
  # Canonical publishes the current AMI id as a public SSM parameter, which
  # avoids hardcoding an id that goes stale every few weeks.
  AMI=$(aws_ ssm get-parameters \
        --names /aws/service/canonical/ubuntu/server/24.04/stable/current/amd64/hvm/ebs-gp3/ami-id \
        --query 'Parameters[0].Value' --output text)
  [ -n "$AMI" ] && [ "$AMI" != "None" ] || die "Could not resolve the Ubuntu 24.04 AMI in $REGION."
  say "Launching $TYPE from $AMI"
  IID=$(aws_ ec2 run-instances \
        --image-id "$AMI" --instance-type "$TYPE" --key-name "$NAME" \
        --security-group-ids "$SG" \
        --block-device-mappings "DeviceName=/dev/sda1,Ebs={VolumeSize=$DISK,VolumeType=gp3,DeleteOnTermination=true}" \
        --metadata-options "HttpTokens=required" \
        --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$NAME}]" \
        --query 'Instances[0].InstanceId' --output text)
  say "Waiting for $IID to run"
  aws_ ec2 wait instance-running --instance-ids "$IID"
else
  say "Instance exists ($IID)"
  state=$(aws_ ec2 describe-instances --instance-ids "$IID" --query 'Reservations[0].Instances[0].State.Name' --output text)
  if [ "$state" = "stopped" ]; then
    say "Starting it"
    aws_ ec2 start-instances --instance-ids "$IID" >/dev/null
    aws_ ec2 wait instance-running --instance-ids "$IID"
  fi
fi

# ── elastic ip ──────────────────────────────────────────────────────────────
# Without one the public address changes on every stop/start and DNS goes stale.
EIP=$(aws_ ec2 describe-addresses --filters "Name=tag:Name,Values=$NAME" \
      --query 'Addresses[0].PublicIp' --output text 2>/dev/null || echo None)
if [ "$EIP" = "None" ] || [ -z "$EIP" ]; then
  say "Allocating an Elastic IP"
  ALLOC=$(aws_ ec2 allocate-address --domain vpc \
          --tag-specifications "ResourceType=elastic-ip,Tags=[{Key=Name,Value=$NAME}]" \
          --query AllocationId --output text)
  EIP=$(aws_ ec2 describe-addresses --allocation-ids "$ALLOC" --query 'Addresses[0].PublicIp' --output text)
else
  ALLOC=$(aws_ ec2 describe-addresses --filters "Name=tag:Name,Values=$NAME" --query 'Addresses[0].AllocationId' --output text)
fi
aws_ ec2 associate-address --instance-id "$IID" --allocation-id "$ALLOC" >/dev/null
say "Public address: $EIP"

# ── bootstrap over ssh ──────────────────────────────────────────────────────
say "Waiting for SSH (can take a minute on first boot)"
for i in $(seq 1 40); do
  ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=5 -i "$KEY_FILE" \
      "ubuntu@$EIP" true 2>/dev/null && break
  sleep 10
  [ "$i" = 40 ] && die "SSH never came up. Check the security group allows $MYIP/32 on 22."
done

say "Installing Docker, swap and the repository"
ssh -o StrictHostKeyChecking=accept-new -i "$KEY_FILE" "ubuntu@$EIP" \
  "REPO='$REPO' bash -s" < "$(dirname "$0")/bootstrap.sh"

cat <<NEXT

────────────────────────────────────────────────────────────────────────
  Instance   $IID
  Address    $EIP
  SSH        ssh -i $KEY_FILE ubuntu@$EIP

  1. Point your domain at $EIP
       duckdns.org -> your subdomain -> IP = $EIP
       confirm with:  dig +short <your-domain>

  2. Configure and start:
       ssh -i $KEY_FILE ubuntu@$EIP
       cd ~/PremierPower && cp .env.example .env && nano .env
       ./deploy/up.sh

     DEPLOY.md section 4 lists exactly what to set.

  To stop paying for this entirely:
       ./deploy/aws-teardown.sh
────────────────────────────────────────────────────────────────────────
NEXT
