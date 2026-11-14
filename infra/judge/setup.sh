#!/usr/bin/env bash
# Set up the judge server: ./infra/judge/setup.sh <judge-ip>
# Works even when the judge has no internet of its own (as with our Verda Spot instances):
#   1. a temporary download proxy on the main server, tunnelled to the judge
#   2. the judge pulls vLLM and downloads Mistral through it, once
#   3. Mistral starts offline, reachable on port 8000 only from the main server, with a random API key
# Prints the settings to add to the main server .env (and .env.local).
set -euo pipefail
JUDGE="$1"; MAIN="${SKILLCHECK_SERVER:-root@65.108.32.183}"; MAIN_IP="${MAIN#root@}"
j() { ssh -o StrictHostKeyChecking=accept-new -J "$MAIN" "root@$JUDGE" "$@"; }
cd "$(git rev-parse --show-toplevel)"

# 1. Download proxy on the main server (localhost only), tunnelled to the judge's 127.0.0.1:3128
ssh -A "$MAIN" "docker start dl-proxy >/dev/null 2>&1 || docker run -d --name dl-proxy --network host --restart unless-stopped ubuntu/squid:latest >/dev/null
  pgrep -f 'R 3128:127.0.0.1:3128 root@$JUDGE' >/dev/null || ssh -o StrictHostKeyChecking=accept-new -f -N -o ServerAliveInterval=30 -R 3128:127.0.0.1:3128 root@$JUDGE"

# 2. Docker on the judge uses the proxy, then pull + download
j "mkdir -p /etc/systemd/system/docker.service.d /opt/judge
  printf '[Service]\nEnvironment=HTTP_PROXY=http://127.0.0.1:3128\nEnvironment=HTTPS_PROXY=http://127.0.0.1:3128\n' > /etc/systemd/system/docker.service.d/proxy.conf
  systemctl daemon-reload && systemctl restart docker
  docker pull -q vllm/vllm-openai:v0.33.0
  docker volume create judge_hf-cache >/dev/null
  docker run --rm --network host --entrypoint python3 -e HTTPS_PROXY=http://127.0.0.1:3128 -e HTTP_PROXY=http://127.0.0.1:3128 \
    -e HF_HUB_ENABLE_HF_TRANSFER=0 -e HF_HUB_DISABLE_XET=1 -v judge_hf-cache:/root/.cache/huggingface vllm/vllm-openai:v0.33.0 \
    -c \"from huggingface_hub import snapshot_download as s; s('mistralai/Mistral-Small-3.2-24B-Instruct-2506', allow_patterns=['consolidated.safetensors','params.json','tekken.json','*.json','*.txt'])\""

# 3. Firewall + start Mistral offline
KEY=$(j 'test -f /opt/judge/.env && grep ^VLLM_API_KEY /opt/judge/.env | cut -d= -f2 || openssl rand -hex 32')
j "printf 'VLLM_API_KEY=%s\n' '$KEY' > /opt/judge/.env && chmod 600 /opt/judge/.env"
scp -q -o StrictHostKeyChecking=accept-new -J "$MAIN" infra/judge/docker-compose.yml "root@$JUDGE":/opt/judge/
j "ufw allow 22/tcp >/dev/null; ufw --force enable >/dev/null
  iptables -C DOCKER-USER -p tcp --dport 8000 ! -s $MAIN_IP -j DROP 2>/dev/null || iptables -I DOCKER-USER -p tcp --dport 8000 ! -s $MAIN_IP -j DROP
  cd /opt/judge && docker compose -p judge up -d"

echo
echo "Mistral is starting (~3 min). Add to the main server .env:"
echo "MISTRAL_BASE_URL=http://$JUDGE:8000/v1"
echo "MISTRAL_API_KEY=$KEY"
echo "JUDGES=gemma,mistral"
