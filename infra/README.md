# Server guide: Verda A100 in Helsinki

Everything AI-related that touches raw candidate data runs on **one Verda GPU server in Helsinki (FIN-01)**:

| Service | What it does | Port (only inside the server) |
|---|---|---|
| `gemma` | Gemma 4 12B on vLLM: **privacy guard**, replaces names, employers, schools, places, contacts with tags | `127.0.0.1:8000` |
| `whisper` | Whisper large-v3-turbo on vLLM: **speech → text** (fi/sv/en) | `127.0.0.1:8002` |

Both speak the OpenAI-compatible API and need the `VLLM_API_KEY` (stored in `/opt/skill-check/.env` on the server and in the private `.env` on your laptop). Neither port is open to the internet.

## 1. Connect
Your SSH key has a passphrase. Load it once per session into an agent:
```bash
ssh-agent -a ~/.ssh/claude-agent.sock -t 12h          # start a key-holder that forgets after 12 h
export SSH_AUTH_SOCK=~/.ssh/claude-agent.sock
ssh-add ~/.ssh/id_ed25519                             # type your passphrase
ssh root@65.108.32.183
```
(For a normal terminal session, `ssh root@65.108.32.183` and typing the passphrase works too.)

## 2. What was set up (and why)
```bash
ufw allow 22/tcp; ufw allow 80/tcp; ufw allow 443/tcp; ufw --force enable   # firewall: only SSH + web
mkdir -p /opt/skill-check                                                    # config lives here
echo "VLLM_API_KEY=<random>" > /opt/skill-check/.env                          # secret for the model APIs
scp infra/docker-compose.yml root@65.108.32.183:/opt/skill-check/            # from your laptop
cd /opt/skill-check && docker compose up -d                                  # start everything
```
The first start downloads the models (~25 GB) into a Docker volume; later restarts take ~1–2 min.

## 3. Everyday commands (on the server, in /opt/skill-check)
```bash
docker compose ps                    # status (wait for "healthy")
docker compose logs -f gemma         # live logs (Ctrl+C to stop watching)
docker compose restart whisper       # restart one service
docker compose down                  # stop everything (GPU still billed while instance exists!)
nvidia-smi                           # GPU memory / usage
```

## 4. Use the models from your laptop (SSH tunnel)
```bash
ssh -N -L 8001:127.0.0.1:8000 -L 8003:127.0.0.1:8002 root@65.108.32.183
# now http://127.0.0.1:8001 = Gemma, http://127.0.0.1:8003 = Whisper (on your laptop)
VLLM_API_KEY=... python3 infra/test_guard.py http://127.0.0.1:8001 clip.wav:fi
```

## 5. Money
- €2.18/h while the instance exists (running **or stopped**: storage + reserved GPU).
- Credits are used first; automatic top-up is OFF.
- **After the final ceremony on Sunday: Verda console → Instances → skill-check → Actions → Delete.**

## Test results (14 Nov, 05:40)
- Gemma 4 12B audio: refused Finnish/Swedish (synthetic espeak voice) → Whisper added for speech.
- Gemma guard on text: fi/sv/en all correct in ~1 s (names, employers, schools, places, age, nationality, phone, email replaced; skills and numbers kept).
