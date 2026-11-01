"""Original procedural fixture artwork; never presented as inference output."""

import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

FONT = Path(__file__).parent / "fonts" / "DejaVuSans.ttf"
BOLD = Path(__file__).parent / "fonts" / "DejaVuSans-Bold.ttf"


def font(size, bold=False):
    return ImageFont.truetype(str(BOLD if bold else FONT), size)


def fixture(index: int):
    im = Image.new("RGB", (1080, 1920), "#1d2525")
    d = ImageDraw.Draw(im)
    # Editorial architectural illustration: the same room and cast in all three beats.
    for y in range(1920):
        t = y / 1920
        d.line((0, y, 1080, y), fill=(int(36 + 45 * t), int(48 + 38 * t), int(46 + 27 * t)))
    d.polygon([(0, 340), (760, 460), (760, 1420), (0, 1580)], fill="#c9bca3")
    d.polygon([(760, 460), (1080, 245), (1080, 1510), (760, 1420)], fill="#8f9687")
    d.polygon([(0, 1580), (760, 1420), (1080, 1510), (1080, 1920), (0, 1920)], fill="#594b3c")
    for n in range(9):
        d.line((0, 1580 + n * 70, 1080, 1490 + n * 90), fill="#71604d", width=3)
    d.rectangle((75, 590, 340, 1140), fill="#566b68", outline="#eee1c8", width=15)
    d.line((207, 590, 207, 1140), fill="#eee1c8", width=9)
    d.line((75, 880, 340, 880), fill="#eee1c8", width=9)
    d.ellipse((130, 665, 265, 800), fill="#d7d8ba")
    d.rectangle((825, 570, 1000, 1370), fill="#303c38", outline="#c5b69a", width=12)
    d.rounded_rectangle((40, 1290, 450, 1570), 35, fill="#a4523b")
    d.rounded_rectangle((25, 1360, 470, 1550), 30, fill="#b96448")
    d.rectangle((48, 1540, 70, 1610), fill="#282a28")
    d.rectangle((420, 1540, 442, 1610), fill="#282a28")

    # Tall adult fiancée and shorter adult partner, rendered as deliberate silhouettes.
    def person(x, y, height, coat, tilt=0):
        head = int(height * 0.105)
        d.ellipse((x - head // 2 + tilt, y, x + head // 2 + tilt, y + head * 1.25), fill="#e1b997")
        d.pieslice(
            (x - head // 2 - 7 + tilt, y - 9, x + head // 2 + 9 + tilt, y + head * 1.3),
            180,
            355,
            fill="#382b27",
        )
        d.polygon(
            [
                (x - 55, y + head),
                (x + 55, y + head),
                (x + 85, y + height * 0.72),
                (x - 80, y + height * 0.72),
            ],
            fill=coat,
        )
        d.line((x - 30, y + height * 0.69, x - 35, y + height), fill="#202b2b", width=36)
        d.line((x + 30, y + height * 0.69, x + 40, y + height), fill="#202b2b", width=36)
        d.line((x - 50, y + head + 30, x - 105, y + height * 0.53), fill=coat, width=30)
        d.line((x + 50, y + head + 30, x + 100, y + height * 0.53), fill=coat, width=30)

    if index == 0:
        person(685, 640, 980, "#202c30")
        person(490, 1040, 590, "#cd793c")
    elif index == 1:
        person(685, 610, 1000, "#202c30", -28)
        person(475, 1020, 600, "#cd793c")
        d.rounded_rectangle((790, 1390, 940, 1640), 16, fill="#bd834b", outline="#e2be7e", width=5)
        d.rectangle((835, 1320, 890, 1390), outline="#d2bf9e", width=10)
        d.rectangle((740, 1460, 830, 1610), fill="#c8b18e")
    else:
        d.polygon([(450, 390), (780, 440), (850, 200), (530, 180)], fill="#dde2c7")
        d.line((450, 390, 780, 440, 850, 200), fill="#292f2d", width=14)
        person(665, 350, 1260, "#202c30")
        person(440, 1030, 590, "#cd793c")
        d.line((920, 1100, 800, 1650), fill="#c39153", width=20)
        d.line((990, 1100, 1010, 1650), fill="#c39153", width=20)
        for n in range(6):
            yy = 1130 + n * 85
            d.line((915 - n * 18, yy, 990 + n * 3, yy), fill="#c39153", width=13)
    d.rounded_rectangle((54, 64, 700, 125), 12, fill="#151b1b")
    d.text((76, 77), "MOCK FIXTURE / ORIGINAL ILLUSTRATION", font=font(24), fill="#dbe795")
    watermark(d)
    return im


def watermark(d):
    d.rectangle((0, 1800, 1080, 1920), fill="#121818")
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
    d.rectangle((0, yy - 40, 1080, 1800), fill="#151b1b")
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
    end = Image.new("RGB", (1080, 1920), "#141a19")
    d = ImageDraw.Draw(end)
    d.text((65, 430), "WRECKDAY", font=font(100, True), fill="#d5ec7b")
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
