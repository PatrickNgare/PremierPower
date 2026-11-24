#!/usr/bin/env bash
# First-run setup for a fresh Ubuntu 24.04 server (1GB RAM is enough).
#
#   curl -fsSL https://raw.githubusercontent.com/PatrickNgare/PremierPower/master/deploy/bootstrap.sh | bash
#
# Idempotent: safe to re-run. It installs Docker, adds swap, and clones the
# repository. It deliberately does NOT start anything — .env has to be written
# first, and that needs secrets this script must never contain.
set -euo pipefail

REPO="${REPO:-https://github.com/PatrickNgare/PremierPower.git}"
DIR="${DIR:-$HOME/PremierPower}"

say() { printf '\n\033[1;32m==>\033[0m %s\n' "$*"; }

# ── swap ────────────────────────────────────────────────────────────────────
# A small server has 1GB of RAM. `npm ci && vite build` inside Docker
# peaks well above that and the build is killed with an unhelpful exit 137.
# Swap is slow but the build only runs at deploy time, so slow is fine.
if ! swapon --show | grep -q /swapfile; then
  say "Adding 2GB swap (a 1GB server cannot build the frontend without it)"
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile >/dev/null
  sudo swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
  # Prefer RAM; only reach for swap under real pressure.
  sudo sysctl -q vm.swappiness=10
  grep -q '^vm.swappiness' /etc/sysctl.conf || echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf >/dev/null
else
  say "Swap already present — skipping"
fi

# ── docker ──────────────────────────────────────────────────────────────────
if ! command -v docker >/dev/null 2>&1; then
  say "Installing Docker Engine and the compose plugin"
  sudo apt-get update -qq
  sudo apt-get install -y -qq ca-certificates curl git
  sudo install -m 0755 -d /etc/apt/keyrings
  sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  sudo chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
  sudo apt-get update -qq
  sudo apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  sudo usermod -aG docker "$USER"
  sudo systemctl enable --now docker
else
  say "Docker already installed — skipping"
fi

# ── the repository ──────────────────────────────────────────────────────────
if [ -d "$DIR/.git" ]; then
  say "Repository present — fetching latest"
  git -C "$DIR" pull --ff-only
else
  say "Cloning $REPO"
  git clone --depth 1 "$REPO" "$DIR"
fi

cat <<'NEXT'

────────────────────────────────────────────────────────────────────────
Bootstrap done. Docker group membership needs a new login:

    exit    # then ssh back in

Then write the environment file and start it:

    cd ~/PremierPower
    cp .env.example .env
    nano .env               # see DEPLOY.md for exactly what to set
    ./deploy/up.sh

────────────────────────────────────────────────────────────────────────
NEXT
