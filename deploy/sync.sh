#!/usr/bin/env bash
# Ship the working tree to the instance over SSH.
#
#   ./deploy/sync.sh <ip> [key]
#
# Used instead of `git clone` because the repository is private: cloning on the
# server would mean putting a GitHub token with write scope onto a public-facing
# box, and a pitch site is not worth that. Nothing leaves this machine except
# the code itself.
#
# The file list comes from `git ls-files`, so it is exactly what is committed —
# .env, node_modules, the 25MB Photo folder and every other ignored path are
# excluded by construction rather than by a hand-maintained list that drifts.
set -euo pipefail

IP="${1:?usage: ./deploy/sync.sh <ip> [key]}"
KEY="${2:-$HOME/.ssh/premierpower.pem}"
DEST="${DEST:-/home/ubuntu/PremierPower}"

cd "$(dirname "$0")/.."
[ -f "$KEY" ] || { echo "!! key not found: $KEY" >&2; exit 1; }

echo "==> Syncing $(git ls-files | wc -l) tracked files to $IP"
ssh -i "$KEY" -o StrictHostKeyChecking=accept-new "ubuntu@$IP" "mkdir -p $DEST"

git ls-files -z | rsync -az --delete-excluded --files-from=- --from0 \
  -e "ssh -i $KEY -o StrictHostKeyChecking=accept-new" \
  ./ "ubuntu@$IP:$DEST/"

ssh -i "$KEY" "ubuntu@$IP" "chmod +x $DEST/deploy/*.sh"
echo "==> Done. The server's .env is untouched — it is not tracked."
