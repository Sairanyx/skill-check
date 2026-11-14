#!/usr/bin/env bash
# Open SSH tunnels from your laptop to the AI models on the Verda server, for local development.
# Gemma (privacy guard + agents) → http://127.0.0.1:8001   Whisper (speech) → http://127.0.0.1:8003
set -euo pipefail
HOST="${SKILLCHECK_SERVER:-root@65.108.32.183}"
ssh -f -N -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 -o ServerAliveCountMax=3 \
  -L 8001:127.0.0.1:8000 -L 8003:127.0.0.1:8002 -L 8004:135.181.63.165:8000 "$HOST"
echo "Tunnels open: Gemma on :8001, Whisper on :8003, Mistral judge on :8004. Close them with: pkill -f '8001:127.0.0.1:8000'"
