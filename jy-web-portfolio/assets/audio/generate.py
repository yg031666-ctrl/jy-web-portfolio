#!/usr/bin/env python3
"""Synthesize JY Studio's original, loopable deep-house bed.

Offline authoring only: Python 3, NumPy, SciPy and ffmpeg. No samples or songs
are downloaded; none of these tools are needed by the deployed website.
"""
from pathlib import Path
import json
import math
import subprocess
import tempfile

import numpy as np
from scipy.io import wavfile
from scipy.ndimage import gaussian_filter1d
from scipy.signal import butter, sosfilt

RATE = 44100
BPM = 118
BARS = 16
BEAT = 60 / BPM
LENGTH = round(BARS * 4 * BEAT * RATE)
DURATION = LENGTH / RATE
RNG = np.random.default_rng(1182026)
HERE = Path(__file__).resolve().parent


def tone(note):
    return 440 * 2 ** ((note - 69) / 12)


def filter_audio(signal, cutoff, mode="lowpass", order=2):
    return sosfilt(butter(order, cutoff, btype=mode, fs=RATE, output="sos"), signal)


def stereo(signal, pan=0):
    angle = (pan + 1) * math.pi / 4
    return np.column_stack((signal * math.cos(angle), signal * math.sin(angle)))


def add(bus, signal, start):
    offset = round(start * RATE) % LENGTH
    # Carry releases and ambience across the loop seam, rather than truncating.
    n = min(len(signal), LENGTH - offset)
    bus[offset:offset + n] += signal[:n]
    if n < len(signal):
        bus[:len(signal) - n] += signal[n:]


def time_axis(seconds):
    return np.arange(round(seconds * RATE)) / RATE


def attack(t, seconds):
    return 1 - np.exp(-t / seconds)


def release(t, seconds, fade=.04):
    return np.minimum(1, np.maximum(0, (seconds - t) / fade))


def kick():
    t = time_axis(.52)
    # Rounded sine body with a brief swept transient and gentle tape-like drive.
    phase = 2 * np.pi * (48 * t + 82 * .027 * (1 - np.exp(-t / .027)))
    body = np.sin(phase) * attack(t, .0015) * np.exp(-t / .145)
    click = filter_audio(RNG.standard_normal(len(t)), 3100, "highpass")
    click *= np.exp(-t / .006) * attack(t, .0005) * .032
    return np.tanh((body + click) * 1.35) * .67 * release(t, .52)


def clap():
    t = time_axis(.23)
    noise = filter_audio(RNG.standard_normal(len(t)), [950, 7500], "bandpass")
    pulses = sum(np.exp(-np.maximum(t - shift, 0) / .012) * (t >= shift)
                 for shift in (0, .012, .025))
    tail = np.exp(-t / .065) * .7
    return noise * (pulses * .38 + tail) * attack(t, .0008) * release(t, .23) * .14


def hat(open_hat=False):
    seconds = .26 if open_hat else .075
    t = time_axis(seconds)
    noise = filter_audio(RNG.standard_normal(len(t)), [5500, 12000], "bandpass")
    metallic = sum(np.sin(2 * np.pi * f * t) for f in (5431, 6937, 8783)) / 3
    decay = .075 if open_hat else .022
    return (noise * .75 + metallic * .08) * attack(t, .0007) * np.exp(-t / decay) * release(t, seconds) * .1


def bass(note, seconds):
    t = time_axis(seconds)
    f = tone(note)
    voice = (np.sin(2 * np.pi * f * t) + .23 * np.sin(4 * np.pi * f * t)
             + .065 * np.sin(6 * np.pi * f * t))
    env = attack(t, .006) * (.3 + .7 * np.exp(-t / .13)) * release(t, seconds, .035)
    return np.tanh(voice * 1.15) * env * .29


def rhodes(notes, seconds=1.55):
    t = time_axis(seconds)
    out = np.zeros((len(t), 2))
    for i, note in enumerate(notes):
        frequency = tone(note)
        # Detuned, decaying tine harmonics: soft electric-piano chord color.
        for channel, detune in enumerate((-.0008, .0008)):
            f = frequency * (1 + detune)
            sine = np.sin(2 * np.pi * f * t + .45 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t / .3))
            tine = np.sin(2 * np.pi * f * 3 * t) * .08 * np.exp(-t / .18)
            voice = sine + tine
            env = attack(t, .009) * np.exp(-t / (.57 + i * .04)) * release(t, seconds, .15)
            out[:, channel] += voice * env * .045
    return out


def pad(notes):
    seconds = 4 * BEAT + .8
    t = time_axis(seconds)
    env = attack(t, .5) * release(t, seconds, .9)
    signal = np.zeros((len(t), 2))
    for note in notes:
        f = tone(note - 12)
        for ch, detune in enumerate((-.0018, .0018)):
            voice = np.sin(2 * np.pi * f * (1 + detune) * t)
            voice += .16 * np.sin(4 * np.pi * f * (1 + detune) * t)
            signal[:, ch] += voice * env * .012
    return signal


def bell(note):
    seconds = 2.2
    t = time_axis(seconds)
    f = tone(note)
    sound = np.sin(2 * np.pi * f * t + .22 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t / .2))
    return sound * attack(t, .012) * np.exp(-t / .58) * release(t, seconds, .2) * .043


def measure(path):
    result = subprocess.run([
        "ffmpeg", "-hide_banner", "-i", str(path), "-af",
        "loudnorm=I=-17:TP=-1.8:LRA=9:print_format=json", "-f", "null", "-"
    ], capture_output=True, text=True, check=True)
    report = result.stderr[result.stderr.rfind("{"):]
    return json.JSONDecoder().raw_decode(report)[0]


def main():
    drums = np.zeros((LENGTH, 2), dtype=np.float64)
    low = np.zeros_like(drums)
    keys = np.zeros_like(drums)
    atmosphere = np.zeros_like(drums)
    # A minor 9 -> F major 9 -> D minor 9 -> E minor 11. All composed here.
    chords = ([57, 60, 64, 67, 71], [53, 57, 60, 64, 67],
              [50, 53, 57, 60, 64], [52, 55, 59, 62, 69])
    roots = (33, 29, 38, 40)
    drum_kick = kick()
    for bar in range(BARS):
        base = bar * 4 * BEAT
        harmony = (bar // 2) % 4
        for step in range(4):
            add(drums, stereo(drum_kick), base + step * BEAT)
            add(drums, stereo(hat(True), .12 if step % 2 else -.12), base + (step + .5) * BEAT)
        for beat in (1, 3):
            add(drums, stereo(clap(), -.04), base + beat * BEAT)
        # Light shuffled sixteenths give the otherwise steady pulse some swing.
        for step in (1, 3, 5, 7, 9, 11, 13, 15):
            start = (step / 4 + (.025 if step % 4 == 3 else 0)) * BEAT
            add(drums, stereo(hat(False) * (.32 if step % 4 == 1 else .48), (-1) ** step * .28), base + start)
        positions = ((0, .55, 0), (.75, .38, 0), (1.5, .38, 12),
                     (2, .55, 0), (2.75, .38, 0), (3.5, .38, 7 if bar % 2 else 0))
        for position, duration, interval in positions:
            add(low, stereo(bass(roots[harmony] + interval, duration * BEAT)), base + position * BEAT)
        for position, velocity in ((0, .85), (1.5, .62), (2.75, .77)):
            add(keys, rhodes(chords[harmony]) * velocity, base + position * BEAT)
        add(atmosphere, pad(chords[harmony]), base)
        if bar % 2:
            add(atmosphere, stereo(bell(chords[harmony][-1]), .34), base + 2.5 * BEAT)
        if bar >= 8 and bar % 2 == 0:
            add(atmosphere, stereo(bell(chords[harmony][-2] + 12) * .6, -.4), base + 1.75 * BEAT)
    # Circular, short stereo echoes/reverb preserve the repeat boundary.
    room = np.zeros_like(keys)
    for delay, level, flip in ((.19, .16, True), (.37, .10, False), (.61, .065, True), (.94, .035, False)):
        source = keys + atmosphere * .5
        if flip:
            source = source[:, ::-1]
        room += np.roll(source, round(delay * RATE), axis=0) * level
    phase = (np.arange(LENGTH) / RATE) % BEAT
    duck = .28 + .72 * (1 - np.exp(-phase / .085))
    # Smooth the sidechain edges circularly so each beat and the loop seam stay click-free.
    duck = gaussian_filter1d(duck, RATE * .003, mode="wrap")
    musical = (low + keys + atmosphere + room) * duck[:, None]
    master = drums + musical
    # A restrained soft clip is used for musical crest control, never PCM clipping.
    master = np.tanh(master * 1.25) / 1.25
    peak = np.max(np.abs(master))
    master *= .85 / peak
    seam = float(np.max(np.abs(master[0] - master[-1])))
    with tempfile.TemporaryDirectory(prefix="jy-studio-music-") as temp:
        wav = Path(temp) / "mix.wav"
        wavfile.write(wav, RATE, (master * 32767).astype(np.int16))
        stats = measure(wav)
        # A constant gain preserves the musical loop and avoids loudness pumping.
        gain = min(-17 - float(stats["input_i"]), -2 - float(stats["input_tp"]))
        target = HERE / "studio-deep-house.mp3"
        pending = HERE / ".studio-deep-house-render.mp3"
        subprocess.run([
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(wav),
            "-af", f"volume={gain:.5f}dB", "-codec:a", "libmp3lame", "-b:a", "192k",
            "-ar", str(RATE), "-write_xing", "1", "-id3v2_version", "3",
            "-metadata", "title=JY Studio — Afterglow", "-metadata", "artist=JY Studio",
            "-metadata", "comment=Original procedural instrumental; no external samples.",
            str(pending)
        ], check=True)
        final = measure(pending)
        pending.replace(target)
        print(json.dumps({"file": str(target), "bpm": BPM, "bars": BARS,
                          "duration_seconds": DURATION, "bytes": target.stat().st_size,
                          "source_boundary_jump": seam, "integrated_lufs": final["input_i"],
                          "true_peak_dbtp": final["input_tp"]}, indent=2))


if __name__ == "__main__":
    main()
