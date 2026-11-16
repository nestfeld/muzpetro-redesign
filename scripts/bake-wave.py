"""Render the former per-line SVG motion once, into a small looping H.264 asset.

Offline dependencies: numpy, opencv-python, Pillow, imageio-ffmpeg.
Run from any directory: python scripts/bake-wave.py
The website itself needs no rendering dependencies or frame-by-frame JavaScript.
"""
from pathlib import Path
import math
import subprocess

import cv2
import imageio_ffmpeg
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
WIDTH, HEIGHT, SUPERSAMPLE = 900, 180, 2
FPS, SECONDS = 24, 8
X = np.linspace(0, 1, WIDTH, dtype=np.float32)
FADE = np.interp(X, [0, .12, .66, .8, 1], [0, 1, 1, .8, 0]).astype(np.float32)
COLORS = np.stack([
    np.interp(X, [0, .66, .8, 1], [199, 199, 232, 199]),
    np.interp(X, [0, .66, .8, 1], [37, 37, 75, 37]),
    np.interp(X, [0, .66, .8, 1], [37, 37, 64, 37]),
], axis=-1).astype(np.float32)


def bezier(a, b, c, d):
    t = np.linspace(0, 1, 60, dtype=np.float32)[:, None]
    return (1-t)**3*a + 3*(1-t)**2*t*b + 3*(1-t)*t*t*c + t**3*d


def curve(index):
    offset = index * 5
    points = [
        ((0, 105+offset/3), (85, 110-offset), (115, 20+offset), (180, 35+offset)),
        ((180, 35+offset), (245, 185-offset), (290, 100-offset/2)),
        ((290, 100-offset/2), (365, 35+offset), (450, 80+offset/3)),
        ((450, 80+offset/3), (550, 115-offset/2), (600, 15+offset), (690, 64+offset/3)),
        ((690, 64+offset/3), (810, 130-offset/2), (900, 96+offset/12)),
    ]
    segments, previous_control = [], None
    for segment in points:
        values = [np.array(value, dtype=np.float32) for value in segment]
        if len(values) == 3:
            a, c, d = values
            b = 2*a - previous_control
        else:
            a, b, c, d = values
        segments.append(bezier(a, b, c, d))
        previous_control = c
    return np.concatenate(segments)


CURVES = [curve(index) for index in range(15)]


def render_frame(seconds):
    alpha = np.zeros((HEIGHT, WIDTH), dtype=np.float32)
    drift = .5 - .5 * math.cos(2*math.pi*seconds/SECONDS)
    for index, base in enumerate(CURVES):
        # Periodic deformation and phase offsets preserve the moving-line effect.
        # Every component has the same period, making the end/start seam continuous.
        phase = 2*math.pi*(seconds/SECONDS - index*.07/SECONDS)
        center = (base.min(axis=0) + base.max(axis=0)) / 2
        shifted = base - center
        scale_y = 1 + .045*math.sin(phase)
        shifted[:, 1] *= scale_y
        shifted[:, 1] += shifted[:, 0] * .004 * math.sin(phase)
        shifted += center + np.array([
            3*math.sin(phase) - 7*drift,
            -2.5*math.sin(phase) + 3*drift,
        ], dtype=np.float32)
        mask = np.zeros((HEIGHT*SUPERSAMPLE, WIDTH*SUPERSAMPLE), dtype=np.uint8)
        cv2.polylines(mask, [np.round(shifted*SUPERSAMPLE).astype(np.int32)],
                      False, 255, 2, cv2.LINE_AA)
        mask = cv2.resize(mask, (WIDTH, HEIGHT), interpolation=cv2.INTER_AREA)
        line = mask.astype(np.float32) / 255 * (.25 + index*.035) * .75
        alpha += line * (1-alpha)
    alpha *= FADE[None, :]
    rgb = np.broadcast_to(COLORS[None, :, :], (HEIGHT, WIDTH, 3))
    matte = np.clip(255*(1-alpha[..., None]) + rgb*alpha[..., None], 0, 255).astype(np.uint8)
    return matte


def main():
    output = ROOT / 'assets' / 'sound-wave-loop.mp4'
    poster = ROOT / 'assets' / 'sound-wave-poster.png'
    command = [
        imageio_ffmpeg.get_ffmpeg_exe(), '-y', '-loglevel', 'error',
        '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{WIDTH}x{HEIGHT}',
        '-r', str(FPS), '-i', '-', '-an', '-c:v', 'libx264',
        '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart', '-metadata', 'comment=Pre-rendered MUZPETRO wave',
        str(output),
    ]
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    try:
        for frame in range(FPS*SECONDS):
            image = render_frame(frame/FPS)
            if frame == 0:
                Image.fromarray(image).save(poster, optimize=True)
            process.stdin.write(image.tobytes())
    finally:
        process.stdin.close()
    if process.wait() != 0:
        raise RuntimeError('Wave video encoding failed')
    print(f'Video: {output.name}, {output.stat().st_size:,} bytes, {SECONDS}s, {FPS} fps')
    print(f'Poster: {poster.name}, {poster.stat().st_size:,} bytes')


if __name__ == '__main__':
    main()
