#!/usr/bin/env python3
"""SkillCheck booth: every command.

    python run.py dev            server + frontend locally → http://localhost:5180
    python run.py deploy test    git pull, build, run on the server → https://<test domain>
    python run.py deploy prod    same, for the real site → https://<prod domain>
    python run.py logs [test|prod]
    python run.py login          once: log in to Cloudflare (browser) and create the tunnel

The site is reached through a Cloudflare tunnel (no open ports on the server),
so every domain must be in a zone of the Cloudflare account you log in to.

The only secret is GEMINI_API_KEY, read from ~/.secrets/globals.json.
"""

import json
import os
import signal
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

# ── Change these to move the site ───────────────────────────────────────────
SERVER = "root@65.108.32.183"                 # ssh target that runs the site
DOMAINS = {"prod": "skillcheck.fi", "test": "junction.monada.foundation"}
# ─────────────────────────────────────────────────────────────────────────────

ROOT = Path(__file__).resolve().parent
FRONTEND = ROOT / "frontend"
SECRETS = Path.home() / ".secrets" / "globals.json"
PORT = 8020
VITE_PORT = 5180  # also in frontend/vite.config.js
NAME = "skillcheck"   # tunnel + containers: skillcheck-prod, skillcheck-test, skillcheck-tunnel
CF_DIR = Path.home() / ".cloudflared"

# Built on the server from a tar of the source (frontend already built locally).
DOCKERFILE = f"""\
FROM rust:1-bookworm AS build
WORKDIR /src
COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /src/target/release/skillcheck-booth /app/server
COPY frontend/build /app/public
ENV PORT={PORT} DATA_DIR=/app/data
CMD ["/app/server"]
"""


def sh(*cmd, **kw):
    return subprocess.run(cmd, check=kw.pop("check", True), text=True, **kw)


def remote(script: str, **kw):
    return sh("ssh", SERVER, script, **kw)


def gemini_key() -> str:
    s = json.loads(SECRETS.read_text()) if SECRETS.exists() else {}
    return s.get("GEMINI_API_KEY") or sys.exit(f"Add GEMINI_API_KEY to {SECRETS}.")


def build_frontend() -> None:
    sh("bun", "install", cwd=FRONTEND)
    sh("bun", "run", "build", cwd=FRONTEND)


def free_ports(*ports: int) -> None:
    """Stop whatever listens on these ports, usually a dev server left over from an earlier run."""
    spec = [f"{p}/tcp" for p in ports]
    if sh("fuser", "-k", "-TERM", *spec, capture_output=True, check=False).returncode != 0:
        return  # nothing was there
    print(f"Stopped what was running on port(s) {', '.join(map(str, ports))}.")
    for _ in range(40):  # wait until they're really gone
        if sh("fuser", *spec, capture_output=True, check=False).returncode != 0:
            return
        time.sleep(0.25)
    sys.exit(f"Port(s) {', '.join(map(str, ports))} are still in use.")


def dev() -> None:
    sh("bun", "install", cwd=FRONTEND)
    free_ports(PORT, VITE_PORT)
    env = {"GEMINI_API_KEY": gemini_key(), "PORT": str(PORT), "DATA_DIR": str(ROOT / "data")}
    procs = [subprocess.Popen(["cargo", "run"], cwd=ROOT, env={**os.environ, **env}, start_new_session=True),
             subprocess.Popen(["bun", "run", "dev"], cwd=FRONTEND, stdin=subprocess.DEVNULL, start_new_session=True)]
    print(f"→ http://localhost:{VITE_PORT}")
    # Closing the terminal or a kill must still stop both, or the server keeps the port.
    for sig in (signal.SIGHUP, signal.SIGTERM):
        signal.signal(sig, lambda *_: sys.exit(0))
    try:
        while all(p.poll() is None for p in procs):
            time.sleep(0.3)
    except KeyboardInterrupt:
        pass
    finally:
        for p in procs:
            try:
                os.killpg(p.pid, signal.SIGTERM)
            except ProcessLookupError:
                pass


def deploy(env_name: str) -> None:
    domain = DOMAINS[env_name]
    container = f"{NAME}-{env_name}"
    tunnel_id()  # fail now, before building, if Cloudflare isn't set up
    if sh("git", "remote", cwd=ROOT, capture_output=True).stdout.strip():
        sh("git", "pull", "--ff-only", cwd=ROOT)
    build_frontend()

    # Build the image on the server from exactly the files it needs.
    tar = subprocess.Popen(["tar", "-c", "Cargo.toml", "Cargo.lock", "src", "frontend/build"], cwd=ROOT, stdout=subprocess.PIPE)
    remote(f"mkdir -p /opt/{NAME} && cd /opt/{NAME} && rm -rf src frontend && tar -x && cat > Dockerfile <<'EOF'\n{DOCKERFILE}EOF\n"
           f"docker build -q -t {container} .", stdin=tar.stdout)
    tar.wait()

    # Run it (its data lives in a named volume), then point the web server at it.
    remote(f"cd /opt/{NAME} && umask 077 && printf 'GEMINI_API_KEY=%s\\n' '{gemini_key()}' > {env_name}.env\n"
           f"docker network create {NAME} 2>/dev/null; docker rm -f {container} >/dev/null 2>&1\n"
           f"docker run -d --restart unless-stopped --network {NAME} --name {container} --env-file {env_name}.env "
           f"-v {container}-data:/app/data {container} >/dev/null")
    tunnel(domain)

    for _ in range(60):
        try:
            if urllib.request.urlopen(f"https://{domain}/api/health", timeout=5).status == 200:
                print(f"Live → https://{domain}")
                return
        except Exception:
            time.sleep(2)
    sys.exit(f"https://{domain} isn't answering yet. Look with: python run.py logs {env_name}")


def tunnel_id() -> str:
    out = sh("cloudflared", "tunnel", "list", "--output", "json", capture_output=True, check=False).stdout
    tid = next((t["id"] for t in json.loads(out or "[]") if t["name"] == NAME), None)
    return tid or sys.exit("No Cloudflare tunnel yet: run  python run.py login")


def login() -> None:
    if not (CF_DIR / "cert.pem").exists():
        sh("cloudflared", "tunnel", "login")  # opens the browser: pick the zone to authorise
    out = sh("cloudflared", "tunnel", "list", "--output", "json", capture_output=True).stdout
    if not any(t["name"] == NAME for t in json.loads(out or "[]")):
        sh("cloudflared", "tunnel", "create", NAME)
    print(f"Cloudflare ready: tunnel '{NAME}'.")


def tunnel(domain: str) -> None:
    # Point the domain at the tunnel, and run the tunnel on the server. It
    # reaches the site containers over their docker network.
    tid = tunnel_id()
    sh("cloudflared", "tunnel", "route", "dns", "--overwrite-dns", tid, domain)
    sh("ssh", SERVER, f"mkdir -p /opt/{NAME}/tunnel && cat > /opt/{NAME}/tunnel/creds.json", input=(CF_DIR / f"{tid}.json").read_text())
    ingress = "".join(f"  - hostname: {d}\n    service: http://{NAME}-{e}:{PORT}\n" for e, d in DOMAINS.items())
    config = f"tunnel: {tid}\ncredentials-file: /etc/cloudflared/creds.json\ningress:\n{ingress}  - service: http_status:404\n"
    remote(f"cd /opt/{NAME}/tunnel && chmod 644 creds.json && cat > config.yml <<'EOF'\n{config}EOF\n"
           f"docker rm -f {NAME}-tunnel >/dev/null 2>&1; docker run -d --restart unless-stopped --network {NAME} --name {NAME}-tunnel "
           f"-v /opt/{NAME}/tunnel:/etc/cloudflared:ro cloudflare/cloudflared:latest tunnel --config /etc/cloudflared/config.yml run >/dev/null")


def main(argv: list[str]) -> None:
    match argv:
        case ["dev"]:
            dev()
        case ["login"]:
            login()
        case ["deploy", env_name] if env_name in DOMAINS:
            deploy(env_name)
        case ["logs", *rest]:
            remote(f"docker logs -f --tail 100 {NAME}-{rest[0] if rest else 'test'}", check=False)
        case _:
            sys.exit(__doc__)


if __name__ == "__main__":
    main(sys.argv[1:])
