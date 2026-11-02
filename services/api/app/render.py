"""Pre-rendered mock fixture artwork; never presented as live inference output."""

import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

FONT = Path(__file__).parent / "fonts" / "DejaVuSans.ttf"
BOLD = Path(__file__).parent / "fonts" / "DejaVuSans-Bold.ttf"


def font(size, bold=False):
    return ImageFont.truetype(str(BOLD if bold else FONT), size)


def fixture(index: int):
    """Use one clearly labeled static sample for all three mock frames."""
    if index not in (0, 1, 2):
        raise ValueError("Invalid fixture index")
    source = Path(__file__).parent / "assets" / "editorial-sample.png"
    with Image.open(source) as image:
        im = ImageOps.fit(image.convert("RGB"), (1080, 1920), method=Image.Resampling.LANCZOS)
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, 1080, 75), fill="#141311")
    d.text((50, 22), "PRE-RENDERED SAMPLE  /  MOCK", font=font(25), fill="#f2ebe0")
    watermark(d)
    return im


def watermark(d):
    d.rectangle((0, 1800, 1080, 1920), fill="#141311")
    d.text((55, 1840), "AI FICTION  •  WRECKDAY", font=font(32, True), fill="#e8eadf")


def wrap_pixels(text: str, drawing, face, max_width=960):
    lines = []
    line = ""
    for character in " ".join(text.split()):
        if drawing.textlength(line + character, font=face) > max_width:
            lines.append(line.rstrip())
            line = character.lstrip()
        else:
            line += character
    if line:
        lines.append(line.rstrip())
    return lines


def captioned(im, caption):
    im = im.copy()
    d = ImageDraw.Draw(im)
    lines = wrap_pixels(caption, d, font(54, True))
    yy = 1460 - max(0, len(lines) - 2) * 60
    d.rectangle((0, yy - 40, 1080, 1800), fill="#211e1b")
    for line in lines:
        d.text((60, yy), line, font=font(54, True), fill="#f5f1e7")
        yy += 74
    watermark(d)
    return im


def render(directory: Path, frames: list, reveal: str, output: Path):
    directory.mkdir(parents=True, exist_ok=True)
    inputs = []
    for index, frame in enumerate(frames):
        im = Image.open(directory / Path(frame["key"]).name).convert("RGB")
        card = directory / f"card-{index}.png"
        captioned(im, frame["caption"]).save(card)
        inputs.append(card)
    end = Image.new("RGB", (1080, 1920), "#141311")
    d = ImageDraw.Draw(end)
    d.text((65, 430), "WRECKDAY", font=font(100, True), fill="#d1a095")
    d.text((70, 590), "FICTION. WITH CONSEQUENCES.", font=font(29), fill="#f5f1e7")
    yy = 850
    for line in wrap_pixels(reveal, d, font(51, True)):
        d.text((70, yy), line, font=font(51, True), fill="#f5f1e7")
        yy += 75
    watermark(d)
    end_path = directory / "reveal.png"
    end.save(end_path)
    inputs.append(end_path)
    # Each slide has a subtle deterministic pan, no generated video or audio.
    clips = []
    for index, slide in enumerate(inputs):
        clip = directory / f"clip-{index}.mp4"
        duration = 2 if index == 3 else 3
        subprocess.run(
            [
                "ffmpeg",
                "-hide_banner",
                "-loglevel",
                "error",
                "-y",
                "-loop",
                "1",
                "-i",
                str(slide),
                "-vf",
                "scale=1080:1920,zoompan=z='min(zoom+0.00025,1.025)':d=1:s=1080x1920:fps=24,format=yuv420p",
                "-t",
                str(duration),
                "-an",
                "-c:v",
                "libx264",
                "-preset",
                "ultrafast",
                "-crf",
                "23",
                "-threads",
                "2",
                str(clip),
            ],
            check=True,
            timeout=100,
        )
        clips.append(clip)
    listing = directory / "concat.txt"
    listing.write_text("\n".join(f"file '{clip.resolve()}'" for clip in clips))
    subprocess.run(
        [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(listing),
            "-c",
            "copy",
            "-movflags",
            "+faststart",
            str(output),
        ],
        check=True,
        timeout=60,
    )
    for clip in clips:
        clip.unlink(missing_ok=True)
    listing.unlink(missing_ok=True)
