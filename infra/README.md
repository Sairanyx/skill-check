# Servers: how to get in and look around

We run two things, both in Finland:

| | What | Where | How you get in |
|---|---|---|---|
| **Verda GPU server** | A computer we control: AI models, the web app, HTTPS | Helsinki (FIN-01), `65.108.32.183` | **SSH** (a terminal on that machine) |
| **Aiven Postgres** | A managed database (no machine to log into) | Google Cloud Hamina (`europe-north1`) | A **database connection** (Drizzle Studio, psql or a DB tool) |

Live site: **https://65.108.32.183.compute.verda.run**

---

## 1. SSH into the Verda server

### First time: get access
Your **public** key (`~/.ssh/id_ed25519.pub`) must be on the server. If you don't have a key: `ssh-keygen -t ed25519`.
Send the `.pub` line to Eduard. He (or anyone with access) adds it:
```bash
ssh root@65.108.32.183 'echo "ssh-ed25519 AAAA... name@laptop" >> ~/.ssh/authorized_keys'
```

### Connect
```bash
ssh root@65.108.32.183
```
If your key has a passphrase you type it once (or load it into an agent with `ssh-add`).

### Look around
```bash
cd /opt/skill-check
ls                        # docker-compose.yml, Caddyfile, .env (secrets, root only), app/ (the code)
ls app/src                # the deployed code: the same as the last deployed git commit
less app/src/lib/ai/interviewer.ts

docker compose ps         # 4 services: gemma, whisper, app, caddy (wait for "healthy")
docker compose logs -f app       # live logs of the web app (Ctrl+C to stop)
docker compose logs --tail 50 gemma
nvidia-smi                # GPU memory use (~69 GB of 80 GB: Gemma + Whisper)
ufw status                # firewall: only 22 (SSH), 80, 443 open
```

| Service | What it does | Port (inside the server only) |
|---|---|---|
| `gemma` | Gemma 4 12B on vLLM: privacy guard + the 3 agents | 127.0.0.1:8000 |
| `whisper` | Whisper large-v3-turbo on vLLM: speech to text fi/sv/en | 127.0.0.1:8002 |
| `app` | The Next.js platform (3 portals + `/api/v1`) | inside Docker network |
| `caddy` | HTTPS (Let's Encrypt certificate, automatic) | 80, 443 (public) |

The models are **not** reachable from the internet. Only the app talks to them.

### Everyday commands (on the server, in `/opt/skill-check`)
```bash
docker compose restart app         # restart the web app
docker compose up -d               # start everything that is not running
docker compose down                # stop everything (the GPU is still billed while the instance exists!)
```

---

## 2. Look at the database (Aiven)

You do not SSH into Aiven. You connect with the `DATABASE_URL` from `.env.local`.

**Easiest: Drizzle Studio (browser UI)**
```bash
cd skill-check
npm run db:studio        # opens https://local.drizzle.studio, browse every table
```

**psql (terminal)**
```bash
psql "$(grep ^DATABASE_URL .env.local | cut -d= -f2-)"
\dt                      -- list tables
select * from appointments;
select action, actor_role, at from audit_events order by at desc limit 20;
```

**Aiven console:** console.aiven.io → project → `pg-20d0a38b` (metrics, backups, users, IP allowlist).

Useful scripts:
| Command | What |
|---|---|
| `npm run db:push` | Apply changes in `src/db/schema.ts` to the database |
| `npm run db:audit` | (Re)apply the triggers that make audit records append-only |
| `npm run db:reset -- --yes` | Wipe all data (demo prep only) |
| `npm run db:seed` | Demo data: companies, needs, event, testing rooms, Aino booked now |

---

## 3. Develop locally
```bash
cp .env.example .env.local     # fill in (ask Eduard for the values, never via GitHub)
npm install
./infra/tunnel.sh              # AI models on the server → localhost:8001 / 8003
npm run dev -- -p 3100         # http://localhost:3100
```

## 4. Deploy
Commit first. Only committed code is shipped.
```bash
./infra/deploy.sh
```

## 5. How it was set up (for reference)
```bash
ufw allow 22/tcp; ufw allow 80/tcp; ufw allow 443/tcp; ufw --force enable
mkdir -p /opt/skill-check && umask 077 && nano /opt/skill-check/.env   # secrets, readable by root only
# .env on the server: VLLM_API_KEY, DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, SITE_HOST
docker compose up -d     # first start downloads the models (~25 GB)
```

## 6. Money
- Verda: **€2.18/h** while the instance exists (running or stopped). Credits are used first, automatic top-up is off.
- Aiven: about **$0.27/h** (Business-4 plan), paid from the $50 trial credits.
- **After the final ceremony on Sunday: delete the Verda instance and the Aiven service.**

## Test results (14 Nov)
- Gemma 4 12B audio refused Finnish/Swedish (synthetic voice), so Whisper does speech.
- Privacy guard on text: fi/sv/en correct in ~1 s.
- Whisper: fi/sv/en in under 2 s.
