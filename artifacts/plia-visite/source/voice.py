"""Generate the French narration using the configured OpenAI key. Never logs keys."""
import concurrent.futures
import json
import os
from pathlib import Path
import subprocess
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
INSTRUCTIONS = (
    "Parle en français de France, avec une voix naturelle, chaleureuse et posée. "
    "Tu guides une personne dans une application de budget. Ton conversationnel, "
    "crédible, sans emphase publicitaire. Fais de petites pauses naturelles, avec "
    "une intonation vivante. Prononce Plia : pli-a."
)


def generate(scene):
    audio = ROOT / f"voix-{scene['id']}.wav"
    if not audio.exists():
        payload = dict(model="gpt-4o-mini-tts", voice="marin", input=scene["text"],
                       instructions=INSTRUCTIONS, response_format="wav")
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
    duration = float(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "csv=p=0", str(audio)]))
    return {**scene, "duration": duration, "audio": audio.name}


def main():
    scenes = json.loads((ROOT / "source/narration.json").read_text())
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        complete = list(pool.map(generate, scenes))
    (ROOT / "source/audio-timing.json").write_text(
        json.dumps(complete, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps([{s["id"]: s["duration"]} for s in complete]))


if __name__ == "__main__":
    main()
