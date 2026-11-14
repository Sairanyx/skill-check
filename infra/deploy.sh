#!/usr/bin/env bash
# Deploy the committed code (HEAD) to the Verda server and restart the app.
# Only committed files are shipped (git archive), so local secrets never leave your laptop.
set -euo pipefail
HOST="${SKILLCHECK_SERVER:-root@65.108.32.183}"
cd "$(git rev-parse --show-toplevel)"
echo "Deploying $(git log --oneline -1)"
git archive --format=tar HEAD | ssh "$HOST" \
  'rm -rf /opt/skill-check/app && mkdir -p /opt/skill-check/app && tar -x -C /opt/skill-check/app'
scp -q infra/docker-compose.yml infra/Caddyfile "$HOST":/opt/skill-check/
# Fail loudly if the build fails (a full disk once made deploys silently keep the old version),
# and clear the build cache afterwards: the disk is small next to the AI models.
ssh "$HOST" 'set -o pipefail; cd /opt/skill-check && docker compose build app panel 2>&1 | tail -3 && docker compose up -d app panel caddy 2>&1 | tail -2; status=$?; docker builder prune -af >/dev/null 2>&1; df -h / | tail -1 | awk "{print \"disk free: \" \$4}"; exit $status'
echo "Live: https://skillcheck.fi"
