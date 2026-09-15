#!/usr/bin/env python3
"""Build HALVETH Brightcast 001 from original vector-like graphics and local TTS.

The builder deliberately imports no television footage, actor stills, logos or
commercial music. It renders abstract frames with Pillow, speaks the bound
German script through the installed Windows voice, and assembles a 1080p H.264
YouTube master with FFmpeg.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import random
import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps


BUILD_VERSION = "1.0.0"
FPS = 30
WIDTH = 1920
HEIGHT = 1080


def run(command: list[str], *, cwd: Path | None = None) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(command, cwd=cwd, text=True, capture_output=True)
    if result.returncode:
        print(result.stdout)
        print(result.stderr, file=sys.stderr)
        raise RuntimeError(f"Command failed ({result.returncode}): {' '.join(command)}")
    return result


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    candidates = {
        "regular": ["segoeui.ttf", "arial.ttf"],
        "semibold": ["seguisb.ttf", "segoeuib.ttf", "arialbd.ttf"],
        "bold": ["segoeuib.ttf", "arialbd.ttf"],
    }[name]
    for candidate in candidates:
        path = Path("C:/Windows/Fonts") / candidate
        if path.exists():
            return ImageFont.truetype(str(path), size=size)
    return ImageFont.load_default(size=size)


def rgb(value: str) -> tuple[int, int, int]:
    value = value.lstrip("#")
    return tuple(int(value[index:index + 2], 16) for index in (0, 2, 4))


def blend(left: tuple[int, int, int], right: tuple[int, int, int], amount: float) -> tuple[int, int, int]:
    return tuple(round(a + (b - a) * amount) for a, b in zip(left, right))


def wrap(draw: ImageDraw.ImageDraw, text: str, face: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = word if not current else f"{current} {word}"
        width = draw.textbbox((0, 0), candidate, font=face)[2]
        if width <= max_width or not current:
            current = candidate
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def fitted_lines(draw: ImageDraw.ImageDraw, text: str, max_width: int, max_lines: int, start_size: int) -> tuple[ImageFont.FreeTypeFont, list[str]]:
    for size in range(start_size, 43, -2):
        face = font("bold", size)
        lines = wrap(draw, text, face, max_width)
        if len(lines) <= max_lines:
            return face, lines
    face = font("bold", 44)
    return face, wrap(draw, text, face, max_width)[:max_lines]


def background(accent: str, seed: int) -> Image.Image:
    random.seed(seed)
    base = Image.new("RGB", (WIDTH, HEIGHT), "#030612")
    gradient = Image.linear_gradient("L").resize((WIDTH, HEIGHT))
    colorized = ImageOps.colorize(gradient, black="#030612", white="#111a32")
    base = Image.blend(base, colorized, 0.62)

    glow = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow, "RGBA")
    ar, ag, ab = rgb(accent)
    for _ in range(8):
        x = random.randint(650, WIDTH + 120)
        y = random.randint(-100, HEIGHT + 100)
        radius = random.randint(160, 480)
        alpha = random.randint(18, 42)
        gdraw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=(ar, ag, ab, alpha))
    glow = glow.filter(ImageFilter.GaussianBlur(120))
    base = Image.alpha_composite(base.convert("RGBA"), glow)

    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay, "RGBA")
    for _ in range(68):
        x = random.randint(0, WIDTH)
        y = random.randint(0, HEIGHT)
        radius = random.choice([1, 1, 2, 3])
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=(255, 255, 255, random.randint(30, 120)))
    for offset in range(-500, 1700, 190):
        draw.line((920 + offset, 0, 1920 + offset, 1080), fill=(ar, ag, ab, 16), width=2)
    return Image.alpha_composite(base, overlay)


def draw_star(draw: ImageDraw.ImageDraw, center: tuple[int, int], radius: int, accent: str, points: int = 10) -> None:
    cx, cy = center
    coords = []
    for index in range(points * 2):
        angle = -math.pi / 2 + index * math.pi / points
        current = radius if index % 2 == 0 else radius * 0.34
        coords.append((cx + math.cos(angle) * current, cy + math.sin(angle) * current))
    draw.polygon(coords, fill=(*rgb(accent), 34), outline=(*rgb(accent), 230), width=5)
    for ring in (radius + 70, radius + 145):
        draw.ellipse((cx - ring, cy - ring, cx + ring, cy + ring), outline=(*rgb(accent), 64), width=3)


def draw_symbol(draw: ImageDraw.ImageDraw, symbol: str, accent: str) -> None:
    c = (*rgb(accent), 220)
    faint = (*rgb(accent), 64)
    cx, cy = 1450, 550
    if symbol in {"STAR", "ENERGY", "HALVETH"}:
        draw_star(draw, (cx, cy), 170 if symbol != "HALVETH" else 150, accent)
        if symbol == "ENERGY":
            for angle in range(0, 360, 30):
                a = math.radians(angle)
                draw.line((cx + math.cos(a) * 230, cy + math.sin(a) * 230, cx + math.cos(a) * 340, cy + math.sin(a) * 340), fill=c, width=4)
        if symbol == "HALVETH":
            draw.text((cx, cy), "H", font=font("bold", 170), anchor="mm", fill=(5, 8, 18, 255))
    elif symbol == "COLLISION":
        draw.ellipse((1070, 260, 1510, 700), outline=(255, 77, 95, 220), width=9)
        draw.ellipse((1390, 390, 1790, 790), outline=(111, 177, 255, 220), width=9)
        draw.line((1130, 830, 1740, 220), fill=c, width=6)
        draw.line((1130, 220, 1740, 830), fill=c, width=6)
    elif symbol == "BROKEN_LOOP":
        draw.arc((1110, 210, 1790, 890), 25, 318, fill=c, width=22)
        draw.polygon([(1744, 351), (1794, 248), (1679, 276)], fill=c)
        draw.line((1260, 360, 1650, 745), fill=(255, 82, 96, 220), width=22)
    elif symbol == "WITNESS":
        draw.ellipse((1120, 340, 1780, 760), outline=c, width=8)
        draw.ellipse((1330, 420, 1570, 660), outline=c, width=8)
        draw.ellipse((1410, 500, 1490, 580), fill=c)
        draw.line((1200, 835, 1700, 835), fill=faint, width=4)
        draw.text((1450, 815), "SOURCE PRESERVED", font=font("semibold", 28), anchor="ms", fill=c)
    elif symbol == "LAB":
        draw.rounded_rectangle((1200, 235, 1700, 845), 34, outline=c, width=8)
        draw.line((1310, 235, 1310, 845), fill=faint, width=5)
        draw.line((1590, 235, 1590, 845), fill=faint, width=5)
        draw.ellipse((1330, 355, 1570, 595), outline=c, width=7)
        draw.line((1450, 595, 1450, 735), fill=c, width=7)
    elif symbol == "THREE_ROUTES":
        draw.line((1110, 550, 1370, 550), fill=c, width=16)
        draw.line((1370, 550, 1740, 250), fill=(255, 80, 96, 210), width=14)
        draw.line((1370, 550, 1740, 550), fill=(*rgb(accent), 245), width=20)
        draw.line((1370, 550, 1740, 850), fill=(112, 176, 255, 210), width=14)
        for x, y in [(1740, 250), (1740, 550), (1740, 850)]:
            draw.ellipse((x - 28, y - 28, x + 28, y + 28), fill=c)
    elif symbol in {"BRANCH", "TIMELINE"}:
        draw.line((1110, 720, 1390, 550), fill=c, width=12)
        draw.line((1390, 550, 1760, 250), fill=c, width=12)
        draw.line((1390, 550, 1760, 550), fill=(*rgb(accent), 250), width=20)
        draw.line((1390, 550, 1760, 850), fill=c, width=12)
        draw.ellipse((1357, 517, 1423, 583), fill=(*rgb(accent), 255))
        if symbol == "TIMELINE":
            draw.text((1570, 520), "STORY BRANCH", font=font("semibold", 30), anchor="ms", fill=c)
    elif symbol == "SCALES":
        draw.line((1450, 250, 1450, 810), fill=c, width=12)
        draw.line((1200, 370, 1700, 370), fill=c, width=10)
        for x in (1230, 1670):
            draw.line((x, 370, x - 100 if x < cx else x + 100, 650), fill=faint, width=5)
            draw.arc((x - 180, 565, x + 180, 760), 0, 180, fill=c, width=8)
        draw.ellipse((1340, 790, 1560, 850), fill=faint)
    elif symbol == "PRISM":
        draw.polygon([(1450, 230), (1120, 820), (1780, 820)], outline=c, fill=(*rgb(accent), 26))
        colors = [(255, 80, 112, 200), (255, 202, 95, 200), (108, 241, 218, 200), (132, 149, 255, 200)]
        for index, color in enumerate(colors):
            draw.line((1450, 525, 1820, 430 + index * 100), fill=color, width=9)


def render_scene(scene: dict, index: int, count: int, output: Path) -> None:
    image = background(scene["accent"], 4000 + index)
    draw = ImageDraw.Draw(image, "RGBA")
    accent = scene["accent"]

    draw.rounded_rectangle((92, 72, 720, 126), 27, fill=(4, 7, 16, 220), outline=(*rgb(accent), 180), width=2)
    draw.text((116, 99), scene["kicker"], font=font("semibold", 27), anchor="lm", fill=(*rgb(accent), 255))
    draw.rounded_rectangle((1510, 72, 1828, 126), 27, fill=(255, 83, 102, 34), outline=(255, 101, 120, 120), width=2)
    draw.text((1669, 99), "SPOILER · FINALE", font=font("semibold", 24), anchor="mm", fill=(255, 193, 201, 255))

    title_face, title_lines = fitted_lines(draw, scene["title"], 920, 4, 86)
    y = 270
    line_height = title_face.size * 1.05
    for line in title_lines:
        draw.text((100, y), line, font=title_face, fill=(246, 248, 255, 255), stroke_width=1, stroke_fill=(3, 6, 18, 220))
        y += line_height
    y += 26
    short_face = font("regular", 39)
    for line in wrap(draw, scene["shortText"], short_face, 860):
        draw.text((104, y), line, font=short_face, fill=(195, 205, 230, 255))
        y += 50

    draw_symbol(draw, scene["symbol"], accent)

    draw.line((100, 944, 1820, 944), fill=(255, 255, 255, 35), width=2)
    draw.text((100, 990), "JURI / HALVETH", font=font("bold", 29), anchor="lm", fill=(239, 242, 255, 240))
    draw.text((340, 990), "BRIGHTCAST · ORIGINAL VIDEO ESSAY", font=font("regular", 22), anchor="lm", fill=(152, 165, 194, 240))
    dot_start = 1430
    for position in range(count):
        x = dot_start + position * 30
        color = (*rgb(accent), 255) if position == index else (255, 255, 255, 50)
        draw.ellipse((x - 5, 985, x + 5, 995), fill=color)
    draw.text((1820, 990), f"{index + 1:02d}/{count:02d}", font=font("semibold", 23), anchor="rm", fill=(199, 209, 230, 240))
    image.convert("RGB").save(output, quality=96)


def render_thumbnail(output: Path) -> None:
    image = background("#fff08b", 9001)
    draw = ImageDraw.Draw(image, "RGBA")
    draw.rounded_rectangle((86, 74, 520, 135), 30, fill=(255, 240, 139, 38), outline=(255, 240, 139, 150), width=2)
    draw.text((111, 104), "HALVETH BRIGHTCAST", font=font("bold", 30), anchor="lm", fill=(4, 7, 16, 255))
    draw.text((92, 295), "STARLIGHT", font=font("bold", 126), fill=(248, 250, 255, 255))
    draw.text((98, 445), "DER DRITTE WEG", font=font("bold", 75), fill=(255, 240, 139, 255))
    draw.rounded_rectangle((98, 590, 940, 716), 30, fill=(3, 6, 18, 160), outline=(255, 255, 255, 60), width=2)
    draw.text((132, 653), "HERRSCHAFT  ×  VERNICHTUNG  ×  VERANTWORTUNG", font=font("semibold", 29), anchor="lm", fill=(223, 229, 244, 255))
    draw_star(draw, (1470, 520), 215, "#fff08b")
    draw.line((1120, 850, 1760, 850), fill=(143, 255, 224, 210), width=8)
    draw.text((1440, 905), "WAS, WENN LICHT NICHT DIE EIGENTLICHE KRAFT WAR?", font=font("semibold", 26), anchor="mm", fill=(176, 255, 230, 255))
    image.convert("RGB").save(output.with_suffix(".png"), quality=96)
    image.convert("RGB").save(output, "WEBP", quality=91, method=6)


def synthesize(text: str, text_path: Path, wav_path: Path) -> None:
    text_path.write_text(text, encoding="utf-8")
    safe_text = str(text_path).replace("'", "''")
    safe_wav = str(wav_path).replace("'", "''")
    script = (
        "Add-Type -AssemblyName System.Speech; "
        "$s=New-Object System.Speech.Synthesis.SpeechSynthesizer; "
        "$s.SelectVoice('Microsoft Stefan Desktop'); $s.Rate=0; $s.Volume=100; "
        f"$t=Get-Content -Raw -Encoding UTF8 -LiteralPath '{safe_text}'; "
        f"$s.SetOutputToWaveFile('{safe_wav}'); $s.Speak($t); $s.Dispose()"
    )
    run(["powershell", "-NoProfile", "-Command", script])


def audio_duration(wav_path: Path) -> float:
    result = run([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", str(wav_path)
    ])
    return float(result.stdout.strip())


def timestamp(seconds: float, comma: bool = True) -> str:
    millis = round(seconds * 1000)
    hours, millis = divmod(millis, 3_600_000)
    minutes, millis = divmod(millis, 60_000)
    whole, millis = divmod(millis, 1000)
    sep = "," if comma else "."
    return f"{hours:02d}:{minutes:02d}:{whole:02d}{sep}{millis:03d}"


def write_captions(scenes: list[dict], timings: list[dict], output_dir: Path) -> None:
    for field, suffix in [("narrationDe", "de"), ("subtitleEn", "en")]:
        srt: list[str] = []
        vtt: list[str] = ["WEBVTT", ""]
        for number, (scene, timing) in enumerate(zip(scenes, timings), 1):
            start = timing["start"] + 0.2
            end = timing["start"] + timing["speechDuration"] + 0.45
            text = scene[field]
            srt.extend([str(number), f"{timestamp(start)} --> {timestamp(end)}", text, ""])
            vtt.extend([f"{timestamp(start, comma=False)} --> {timestamp(end, comma=False)}", text, ""])
        (output_dir / f"halveth-brightcast-001-starlight-{suffix}.srt").write_text("\n".join(srt), encoding="utf-8")
        (output_dir / f"halveth-brightcast-001-starlight-{suffix}.vtt").write_text("\n".join(vtt), encoding="utf-8")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def render_video(storyboard: dict, output_dir: Path) -> tuple[Path, list[dict]]:
    work = output_dir / "work"
    if work.exists():
        shutil.rmtree(work)
    frames = work / "frames"
    speech = work / "speech"
    segments = work / "segments"
    for folder in (frames, speech, segments):
        folder.mkdir(parents=True, exist_ok=True)

    scenes = storyboard["scenes"]
    timings: list[dict] = []
    current = 0.0
    segment_paths: list[Path] = []

    for index, scene in enumerate(scenes):
        frame_path = frames / f"scene-{index:02d}.png"
        text_path = speech / f"scene-{index:02d}.txt"
        wav_path = speech / f"scene-{index:02d}.wav"
        render_scene(scene, index, len(scenes), frame_path)
        synthesize(scene["narrationDe"], text_path, wav_path)
        spoken = audio_duration(wav_path)
        duration = max(spoken + 1.25, 9.0)
        timing = {
            "sceneId": scene["id"],
            "start": round(current, 3),
            "duration": round(duration, 3),
            "speechDuration": round(spoken, 3),
        }
        timings.append(timing)
        current += duration

        frames_count = math.ceil(duration * FPS)
        fade_out = max(0.0, duration - 0.45)
        video_filter = (
            "[0:v]scale=2048:1152,"
            "zoompan=z='min(zoom+0.000075,1.032)':"
            "x='iw/2-(iw/zoom/2)+sin(on/75)*3':"
            "y='ih/2-(ih/zoom/2)':"
            f"d={frames_count}:s=1920x1080:fps={FPS},"
            "format=yuv420p,"
            "fade=t=in:st=0:d=0.35,"
            f"fade=t=out:st={fade_out:.3f}:d=0.45[v];"
            "[1:a]aresample=48000,"
            f"apad=pad_dur={duration:.3f},atrim=end={duration:.3f},"
            "afade=t=in:st=0:d=0.12,"
            f"afade=t=out:st={fade_out:.3f}:d=0.45[a]"
        )
        segment_path = segments / f"scene-{index:02d}.mp4"
        run([
            "ffmpeg", "-y", "-loglevel", "error", "-loop", "1", "-i", str(frame_path),
            "-i", str(wav_path), "-filter_complex", video_filter,
            "-map", "[v]", "-map", "[a]", "-t", f"{duration:.3f}",
            "-c:v", "libx264", "-preset", "medium", "-crf", "19",
            "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart",
            str(segment_path)
        ])
        segment_paths.append(segment_path)

    concat_file = work / "concat.txt"
    concat_file.write_text("\n".join(f"file '{str(path).replace('\\', '/')}'" for path in segment_paths), encoding="utf-8")
    narration_master = work / "narration-master.mp4"
    run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(concat_file), "-c", "copy", str(narration_master)])

    final_path = output_dir / "halveth-brightcast-001-starlight-third-route-de-1080p.mp4"
    total = sum(item["duration"] for item in timings)
    bed = f"aevalsrc=0.10*sin(2*PI*55*t)+0.035*sin(2*PI*82.41*t)+0.025*sin(2*PI*110*t):s=48000:d={total:.3f}"
    mix = (
        "[0:a]volume=1.0[narration];"
        "[1:a]lowpass=f=780,tremolo=f=0.10:d=0.18,volume=0.22,"
        "afade=t=in:st=0:d=2,"
        f"afade=t=out:st={max(0, total - 3):.3f}:d=3[bed];"
        "[narration][bed]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.92[a]"
    )
    run([
        "ffmpeg", "-y", "-loglevel", "error", "-i", str(narration_master),
        "-f", "lavfi", "-i", bed, "-filter_complex", mix,
        "-map", "0:v:0", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
        "-movflags", "+faststart", str(final_path)
    ])
    return final_path, timings


def write_qa_artifacts(output_dir: Path) -> None:
    """Refresh review stills from the exact frames used by the final render."""
    selected = [0, 3, 6, 11]
    review_images: list[Image.Image] = []
    for number, scene_index in enumerate(selected, 1):
        source = output_dir / "work" / "frames" / f"scene-{scene_index:02d}.png"
        destination = output_dir / f"qa-{number:02d}.png"
        shutil.copy2(source, destination)
        with Image.open(source) as image:
            review_images.append(
                image.convert("RGB").resize((960, 540), Image.Resampling.LANCZOS)
            )

    sheet = Image.new("RGB", (1920, 1080), rgb("#040710"))
    for image, position in zip(review_images, [(0, 0), (960, 0), (0, 540), (960, 540)]):
        sheet.paste(image, position)
    sheet.save(output_dir / "qa-contact-sheet.jpg", quality=92, optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--storyboard", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--site-assets", type=Path)
    args = parser.parse_args()

    branch = Path(__file__).resolve().parents[1]
    storyboard_path = args.storyboard or branch / "storyboard.json"
    output_dir = (args.output or branch / "generated").resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    storyboard = json.loads(storyboard_path.read_text(encoding="utf-8"))

    thumbnail = output_dir / "halveth-brightcast-001-starlight-thumbnail.webp"
    render_thumbnail(thumbnail)
    video, timings = render_video(storyboard, output_dir)
    write_qa_artifacts(output_dir)
    write_captions(storyboard["scenes"], timings, output_dir)
    (output_dir / "scene-timings.json").write_text(json.dumps(timings, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    probe = json.loads(run([
        "ffprobe", "-v", "error", "-show_entries", "format=duration,size,bit_rate:stream=codec_name,width,height,r_frame_rate",
        "-of", "json", str(video)
    ]).stdout)
    manifest_path = output_dir / "halveth-brightcast-001-manifest.json"
    generated = sorted(
        path for path in output_dir.iterdir()
        if path.is_file() and path != manifest_path
    )
    manifest = {
        "schema": "halveth.brightcast.build-manifest.v1",
        "buildVersion": BUILD_VERSION,
        "storyboardId": storyboard["id"],
        "videoProfile": "YOUTUBE_1080P_H264_AAC_16_9",
        "visualSource": "ORIGINAL_PILLOW_VECTOR_LIKE_RENDER",
        "speechSource": "MICROSOFT_STEFAN_DESKTOP_LOCAL_TTS",
        "musicSource": "ORIGINAL_FFMPEG_SYNTHESIZED_TONE_BED",
        "thirdPartyAudiovisualAssets": [],
        "probe": probe,
        "sceneTimings": timings,
        "files": [{"name": path.name, "bytes": path.stat().st_size, "sha256": sha256(path)} for path in generated],
    }
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    if args.site_assets:
        destination = args.site_assets.resolve()
        destination.mkdir(parents=True, exist_ok=True)
        keep = [video, thumbnail, thumbnail.with_suffix(".png"), manifest_path]
        keep += list(output_dir.glob("*.srt")) + list(output_dir.glob("*.vtt"))
        for source in keep:
            shutil.copy2(source, destination / source.name)

    print(json.dumps({
        "video": str(video),
        "durationSeconds": round(sum(item["duration"] for item in timings), 3),
        "scenes": len(timings),
        "manifest": str(manifest_path),
        "siteAssets": str(args.site_assets.resolve()) if args.site_assets else None,
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
