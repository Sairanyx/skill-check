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
ssh "$HOST" 'cd /opt/skill-check && docker compose build app | tail -1 && docker compose up -d app caddy | tail -2'
echo "Live: https://65.108.32.183.compute.verda.run"
