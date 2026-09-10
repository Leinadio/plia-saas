"""Align generated narration to the real recording and export the guided tour."""
from fractions import Fraction
import json
from pathlib import Path
import subprocess
import textwrap

ROOT = Path(__file__).resolve().parent.parent


def run(args):
    subprocess.run(args, check=True)


def stamp(seconds):
    ms = round(seconds * 1000)
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


def main():
    timing = json.loads((ROOT / "source/recording-timing.json").read_text())
    raw = ROOT / "work/recording.webm"
    fps = float(Fraction(subprocess.check_output([
        "ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
        "stream=r_frame_rate", "-of", "csv=p=0", str(raw)]).decode().strip()))
    pixels = subprocess.check_output([
        "ffmpeg", "-v", "error", "-i", str(raw), "-vf", "crop=2:2:0:0,scale=1:1",
        "-pix_fmt", "rgb24", "-f", "rawvideo", "pipe:1"])
    marked = [i // 3 for i in range(0, len(pixels), 3)
              if pixels[i] > 200 and pixels[i+1] < 80 and pixels[i+2] > 180]
    if not marked:
        raise RuntimeError("Recording start marker not found; refusing an unaligned export")
    offset = (max(marked) + 1) / fps
    inputs, filters, labels = [], [], []
    for i, chapter in enumerate(timing["chapters"]):
        inputs += ["-i", str(ROOT / chapter["audio"])]
        delay = round(chapter["audioStart"] * 1000)
        filters.append(f"[{i}:a]aresample=48000,adelay={delay}:all=1[a{i}]")
        labels.append(f"[a{i}]")
    filters.append("".join(labels) + f"amix=inputs={len(labels)}:normalize=0,"
                   f"apad,atrim=duration={timing['duration']},"
                   "loudnorm=I=-16:TP=-1.5:LRA=9,aresample=48000[out]")
    narration = ROOT / "work/narration.wav"
    run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(filters),
         "-map", "[out]", str(narration)])
    # Keep the voice forward; the original music gently ducks during speech.
    music = ROOT / "musique-originale.wav"
    if not music.exists():
        raise RuntimeError("Run source/music.py before exporting the narrated soundtrack")
    mixed = ROOT / "work/mix.wav"
    run(["ffmpeg", "-v", "error", "-y", "-i", str(narration), "-i", str(music),
         "-filter_complex",
         "[0:a]aformat=channel_layouts=stereo,asplit=2[voice][control];"
         "[1:a]loudnorm=I=-29:TP=-6:LRA=7,aresample=48000[music];"
         "[music][control]sidechaincompress=threshold=0.025:ratio=3:attack=80:release=600[bed];"
         "[voice][bed]amix=inputs=2:normalize=0,"
         "loudnorm=I=-16:TP=-1.5:LRA=9,aresample=48000[out]",
         "-map", "[out]", "-t", str(timing["duration"]), str(mixed)])
    subtitles = ROOT / "plia-visite.srt"
    subtitles.write_text("\n".join(
        f"{i+1}\n{stamp(c['audioStart'])} --> {stamp(c['audioStart']+c['duration'])}\n"
        + "\n".join(textwrap.wrap(c["text"], width=72)) + "\n"
        for i, c in enumerate(timing["chapters"])))
    output = ROOT / "plia-visite-guidee.mp4"
    run(["ffmpeg", "-v", "error", "-y", "-ss", str(offset), "-i", str(raw),
         "-i", str(mixed), "-i", str(subtitles), "-map", "0:v:0", "-map", "1:a:0",
         "-map", "2:0", "-vf", "scale=1920:1080:flags=lanczos", "-c:v", "libx264",
         "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "aac",
         "-ar", "48000", "-b:a", "192k", "-c:s", "mov_text", "-disposition:s:0", "0",
         "-metadata:s:s:0", "language=fra", "-t", str(timing["duration"]),
         "-movflags", "+faststart", "-metadata", "title=Plia — visite guidée",
         "-metadata", "comment=Capture continue des composants de démonstration Plia. Voix générée par IA (OpenAI Cedar). Musique originale de synthèse. Données fictives.",
         str(output)])
    report = {"duration": timing["duration"], "recordingOffset": offset,
              "sourceFps": fps, "file": output.name, "bytes": output.stat().st_size,
              "voice": "OpenAI Cedar", "music": music.name,
              "mix": "Stereo, speech ducking, target -16 LUFS / -1.5 dBTP"}
    (ROOT / "source/export.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report))


if __name__ == "__main__":
    main()
