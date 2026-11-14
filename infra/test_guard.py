"""Smoke test for the Gemma "listener + guard" on Verda.

Usage (with an SSH tunnel: ssh -N -L 8001:127.0.0.1:8000 root@<verda-ip>):
    VLLM_API_KEY=... python3 infra/test_guard.py http://127.0.0.1:8001 clip_fi.wav:fi clip_sv.wav:sv ...

Step 1: speech -> text in the original language (Gemma 4 official ASR prompt).
Step 2: pseudonymise: replace personal details with tags, keep everything else verbatim.
"""

from __future__ import annotations

import base64
import json
import os
import sys
import time
import urllib.request

LANG = {"fi": "Finnish", "sv": "Swedish", "en": "English"}

ASR_PROMPT = (
    "Transcribe the following speech segment in {lang} into {lang} text.\n"
    "Follow these specific instructions for formatting the answer:\n"
    "* Only output the transcription, with no newlines.\n"
    "* When transcribing numbers, write the digits, i.e. write 1.7 and not one point seven, "
    "and write 3 instead of three."
)

GUARD_SYSTEM = (
    "You are a privacy filter for a recruitment skill check. Rewrite the user's text so that it "
    "contains no personal or identifying details, and change NOTHING else (same language, same "
    "wording, same technical content, same skills and numbers about work done).\n"
    "Replace with tags:\n"
    "- person names -> [NAME]\n"
    "- employers, companies, clients -> [EMPLOYER]\n"
    "- schools, universities -> [SCHOOL]\n"
    "- cities, countries, addresses, places -> [PLACE]\n"
    "- nationality or ethnicity -> [NATIONALITY]\n"
    "- emails, phone numbers, URLs, social handles -> [CONTACT]\n"
    "- age, gender, religion, health, family status -> [PERSONAL]\n"
    "Keep technologies, tools, methods and quantities (e.g. Python, Kubernetes, 30%) unchanged.\n"
    "Output only the rewritten text."
)


def chat(base: str, key: str, messages: list, max_tokens: int = 400) -> tuple[str, float]:
    body = json.dumps(
        {"model": "gemma-4-12b", "messages": messages, "max_tokens": max_tokens, "temperature": 0.0}
    ).encode()
    req = urllib.request.Request(
        f"{base}/v1/chat/completions",
        data=body,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"},
    )
    t = time.time()
    with urllib.request.urlopen(req, timeout=120) as r:
        out = json.load(r)
    return out["choices"][0]["message"]["content"].strip(), time.time() - t


def main() -> None:
    base, key = sys.argv[1], os.environ["VLLM_API_KEY"]
    for arg in sys.argv[2:]:
        path, code = arg.rsplit(":", 1)
        audio_b64 = base64.b64encode(open(path, "rb").read()).decode()
        text, t1 = chat(
            base,
            key,
            [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": ASR_PROMPT.format(lang=LANG[code])},
                        {"type": "input_audio", "input_audio": {"data": audio_b64, "format": "wav"}},
                    ],
                }
            ],
        )
        clean, t2 = chat(
            base, key, [{"role": "system", "content": GUARD_SYSTEM}, {"role": "user", "content": text}]
        )
        print(f"\n=== {path} ({LANG[code]}) ===")
        print(f"heard  ({t1:.1f}s): {text}")
        print(f"clean  ({t2:.1f}s): {clean}")


if __name__ == "__main__":
    main()
