"""Render an original, sample-free warm keyboard accompaniment for this tour.

Requires NumPy. No external recording, melody or artist imitation is used.
"""
import json
from pathlib import Path
import wave

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
RATE = 48000
BPM = 88
BEAT = 60 / BPM
RNG = np.random.default_rng(20260911)


def tone(midi, duration, instrument):
    t = np.arange(round(duration * RATE)) / RATE
    frequency = 440 * 2 ** ((midi - 69) / 12)
    if instrument == "keys":
        # Rounded tine piano: the upper partials decay sooner than the body.
        y = sum(amplitude * np.sin(2 * np.pi * frequency * harmonic * t)
                * np.exp(-t / decay)
                for harmonic, amplitude, decay in [(1, 1, 1.35), (2, .22, .65),
                                                   (3, .075, .28), (4, .025, .15)])
        y *= 1 - np.exp(-t / .012)
    elif instrument == "pad":
        y = sum(np.sin(2 * np.pi * frequency * detune * t + phase)
                for detune, phase in [(1, 0), (.9985, .4), (1.0015, -.4)]) / 3
        y += .08 * np.sin(4 * np.pi * frequency * t)
        y *= np.minimum(t / .8, 1) * np.minimum((duration - t) / 1.3, 1)
    else:
        y = (np.sin(2 * np.pi * frequency * t)
             + .12 * np.sin(4 * np.pi * frequency * t))
        y *= (1 - np.exp(-t / .03)) * np.exp(-t / .6)
    y *= np.minimum((duration - t) / .05, 1)
    return y


def main():
    duration = json.loads((ROOT / "source/recording-timing.json").read_text())["duration"]
    mix = np.zeros((round((duration + 5) * RATE), 2), dtype=np.float64)

    def add(start, samples, gain, pan=0):
        offset = max(0, round(start * RATE))
        count = min(len(samples), len(mix) - offset)
        if count <= 0:
            return
        angle = (pan + 1) * np.pi / 4
        mix[offset:offset + count] += (samples[:count] * gain)[:, None] * [np.cos(angle), np.sin(angle)]

    # Cmaj9, Am9, Fmaj9, G6/9. Two bars per harmony, resolving on C.
    chords = [(36, [55, 59, 62, 64]), (33, [55, 59, 60, 64]),
              (29, [53, 57, 60, 64]), (31, [55, 57, 59, 62])]
    motif = [[76, 74, 71], [72, 71, 67], [69, 72, 76], [74, 71, 69]]
    bars = int(np.ceil(duration / (4 * BEAT)))
    for bar in range(bars):
        start = bar * 4 * BEAT
        harmony = (bar // 2) % 4
        bass, notes = chords[harmony]
        if duration - start < 5:
            bass, notes = chords[0]
        if bar % 2 == 0:
            for index, note in enumerate(notes):
                add(start, tone(note, 8 * BEAT + 1.3, "pad"), .025,
                    (index - 1.5) / 2)
        for beat, index in [(0, 0), (.75, 2), (1.5, 1), (2.75, 3), (3.5, 2)]:
            add(start + beat * BEAT + RNG.uniform(0, .018),
                tone(notes[index], 3.5, "keys"), RNG.uniform(.13, .17), -.18)
        for beat in [0, 2.5]:
            add(start + beat * BEAT, tone(bass, 1.8, "bass"), .095)
        if bar % 2 == 1:
            for beat, note in zip([.5, 1.75, 3], motif[harmony]):
                add(start + beat * BEAT, tone(note, 2.8, "keys"), .047, .3)
        # Restrained brushed pulse, introduced after the opening.
        if bar >= 2:
            for beat in [0, 2]:
                t = np.arange(round(.24 * RATE)) / RATE
                kick = np.sin(2 * np.pi * (48 * t + 20 * .022 * (1 - np.exp(-t / .022))))
                add(start + beat * BEAT, kick * np.exp(-t / .06) * (1 - np.exp(-t / .003)), .04)
            for beat in np.arange(.5, 4, .5):
                t = np.arange(round(.09 * RATE)) / RATE
                noise = RNG.normal(size=len(t))
                brushed = np.convolve(noise, [1, 2, 3, 2, 1], mode="same") / 9
                add(start + beat * BEAT, brushed * np.exp(-t / .023)
                    * (1 - np.exp(-t / .002)), .018 if beat % 1 else .01, .4)

    dry = mix.copy()
    for seconds, gain in [(.087, .16), (.139, .12), (.231, .1), (.373, .07), (.619, .04)]:
        offset = round(seconds * RATE)
        mix[offset:] += dry[:-offset, ::-1] * gain
    mix = mix[:round(duration * RATE)]
    t = np.arange(len(mix)) / RATE
    fade = np.minimum(t / 1.5, 1) * np.minimum((duration - t) / 2.2, 1)
    mix *= fade[:, None]
    mix *= .8 / max(np.max(np.abs(mix)), .001)
    target = ROOT / "musique-originale.wav"
    with wave.open(str(target), "wb") as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(RATE)
        wav.writeframes((mix * 32767).astype("<i2").tobytes())
    print(json.dumps({"file": target.name, "duration": duration, "bpm": BPM,
                      "origin": "Original synthesis; no third-party samples"}))


if __name__ == "__main__":
    main()
