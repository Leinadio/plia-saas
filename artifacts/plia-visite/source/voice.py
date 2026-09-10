"""Generate the French narration using the configured OpenAI key. Never logs keys."""
import concurrent.futures
import hashlib
import json
import os
from pathlib import Path
import subprocess
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
SETTINGS = json.loads((ROOT / "source/voice-settings.json").read_text())
MANIFEST = ROOT / "source/voice-manifest.json"
CACHE = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}


def generate(scene):
    audio = ROOT / f"voix-{scene['id']}.wav"
    payload = {**SETTINGS, "input": scene["text"], "response_format": "wav"}
    fingerprint = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
    if not audio.exists() or CACHE.get(scene["id"]) != fingerprint:
        request = urllib.request.Request(
            "https://api.openai.com/v1/audio/speech",
            data=json.dumps(payload).encode(),
            headers={"Authorization": "Bearer " + os.environ["OPENAI_API_KEY"],
                     "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(request, timeout=90) as response:
                data = response.read()
        except urllib.error.HTTPError as error:
            raise RuntimeError(f"Speech request failed: HTTP {error.code}") from None
        if not data.startswith(b"RIFF"):
            raise RuntimeError("Speech response is not WAV audio")
        audio.write_bytes(data)
    CACHE[scene["id"]] = fingerprint
    duration = float(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "csv=p=0", str(audio)]))
    return {**scene, "duration": duration, "audio": audio.name}


def main():
    scenes = json.loads((ROOT / "source/narration.json").read_text())
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        complete = list(pool.map(generate, scenes))
    MANIFEST.write_text(json.dumps(CACHE, indent=2) + "\n")
    (ROOT / "source/audio-timing.json").write_text(
        json.dumps(complete, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps([{s["id"]: s["duration"]} for s in complete]))


if __name__ == "__main__":
    main()
