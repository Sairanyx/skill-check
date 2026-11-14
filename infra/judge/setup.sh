#!/usr/bin/env bash
# One-time setup of the judge server. Usage: ./infra/judge/setup.sh <ip>
# Creates a random API key, starts Mistral behind HTTPS, opens only SSH + HTTPS in the firewall.
# Prints the two settings to add to the main server's .env (and .env.local).
set -euo pipefail
IP="$1"; HOST="root@$IP"; SITE="$IP.compute.verda.run"
# Optional: JUMP=root@<main-server-ip> if the judge is not reachable directly from your network.
ssh() { command ssh -o StrictHostKeyChecking=accept-new ${JUMP:+-J "$JUMP"} "$@"; }
scp() { command scp -o StrictHostKeyChecking=accept-new ${JUMP:+-J "$JUMP"} "$@"; }
cd "$(git rev-parse --show-toplevel)"
KEY=$(ssh "$HOST" 'test -f /opt/judge/.env && grep ^VLLM_API_KEY /opt/judge/.env | cut -d= -f2 || openssl rand -hex 32')
ssh "$HOST" "mkdir -p /opt/judge && printf 'VLLM_API_KEY=%s\nSITE_HOST=%s\n' '$KEY' '$SITE' > /opt/judge/.env && chmod 600 /opt/judge/.env"
scp -q infra/judge/docker-compose.yml infra/judge/Caddyfile "$HOST":/opt/judge/
ssh "$HOST" 'ufw allow 22/tcp >/dev/null; ufw allow 80/tcp >/dev/null; ufw allow 443/tcp >/dev/null; ufw --force enable >/dev/null; cd /opt/judge && docker compose up -d'
echo
echo "Started. The model download takes ~10 min. Then add to the main server .env and .env.local:"
echo "MISTRAL_BASE_URL=https://$SITE/v1"
echo "MISTRAL_API_KEY=$KEY"
echo "JUDGES=gemma,mistral"
