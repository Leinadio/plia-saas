"""Generate the temporary local narration and its editable timing sheet (macOS)."""
from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parent.parent


def run(args):
    subprocess.run(args, check=True)


def stamp(seconds):
    ms = round(seconds * 1000)
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


def main():
    (ROOT / "work").mkdir(exist_ok=True)
    scenes = json.loads((ROOT / "source/scenes.json").read_text())
    time = 0
    captions = []
    for i, scene in enumerate(scenes):
        scene["start"] = round(time, 3)
        scene["captions"] = []
        for j, line in enumerate(scene["lines"]):
            stem = f"{i:02d}-{j:02d}"
            txt = ROOT / "work" / f"{stem}.txt"
            aiff = ROOT / "work" / f"{stem}.aiff"
            wav = ROOT / "work" / f"{stem}.wav"
            txt.write_text(line)
            run(["say", "-v", "Thomas", "-r", "145", "-f", str(txt), "-o", str(aiff)])
            run(["ffmpeg", "-v", "error", "-y", "-i", str(aiff), "-af",
                 "atempo=0.90,apad=pad_dur=0.45", "-ar", "48000", "-ac", "1", str(wav)])
            duration = float(subprocess.check_output([
                "ffprobe", "-v", "error", "-show_entries", "format=duration",
                "-of", "csv=p=0", str(wav)]))
            caption = {"text": line, "start": round(time, 3),
                       "end": round(time + duration, 3), "audio": f"work/{stem}.wav"}
            scene["captions"].append(caption)
            captions.append(caption)
            time += duration
        scene["end"] = round(time, 3)
    (ROOT / "source/timeline.json").write_text(json.dumps(
        {"duration": round(time, 3), "fps": 30, "scenes": scenes}, ensure_ascii=False, indent=2) + "\n")
    (ROOT / "plia-demo.srt").write_text("\n".join(
        f"{i+1}\n{stamp(c['start'])} --> {stamp(c['end'])}\n{c['text']}\n"
        for i, c in enumerate(captions)))
    (ROOT / "work/audio.txt").write_text("".join(
        f"file '{Path(c['audio']).name}'\n" for c in captions))
    run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i",
         str(ROOT / "work/audio.txt"), "-af", "loudnorm=I=-16:TP=-1.5:LRA=9",
         str(ROOT / "work/narration.wav")])
    print(f"Temporary narration: {time:.2f} seconds")


if __name__ == "__main__":
    main()
