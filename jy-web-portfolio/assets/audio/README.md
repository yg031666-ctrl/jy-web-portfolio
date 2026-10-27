# JY Studio — Afterglow

An original instrumental deep-house bed synthesized for this website. The notes,
sounds, drum envelopes and arrangement are defined in `generate.py`; no external
recordings, sample packs, existing songs or music services are used.

- 118 BPM, 16 bars, approximately 32.54 seconds
- Stereo MP3, 44.1 kHz, 192 kbps; approximately 783 KB
- Warm electric-piano-style minor/major ninth chords, rounded bass,
  four-on-the-floor kick, shuffled hats, clap and subtle stereo ambience
- Measured encoded loudness: −17.26 LUFS integrated; −5.86 dBTP true peak

`studio-deep-house.mp3` is the ready-to-serve asset. The website does not need
Python, audio synthesis libraries or an external audio connection.

## Reproduce the asset

For offline authoring, use Python 3 with NumPy and SciPy, plus an `ffmpeg` build
with `libmp3lame`:

```sh
python3 assets/audio/generate.py
```

The deterministic generator carries instrument releases and short reverberation
across the repeat boundary. It smooths the beat ducking envelope, applies a fixed
loudness gain and writes MP3 gapless metadata. The decoded result contains
1,435,119 samples per channel. Rendering completes in a sibling temporary file
before the final asset is replaced atomically.

The MP3 is suitable for a looping background player. Sample-accurate repeat
behavior ultimately depends on the browser's audio implementation.
