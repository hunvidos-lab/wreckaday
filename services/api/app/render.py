"""Pre-rendered mock fixture artwork; never presented as live inference output."""

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
    return im


def wrap_pixels(text: str, drawing, face, max_width=960):
    lines = []
    line = ""
    for word in text.split():
        candidate = f"{line} {word}" if line else word
        if drawing.textlength(candidate, font=face) <= max_width:
            line = candidate
            continue
        if line:
            lines.append(line)
            line = ""
        for character in word:
            if drawing.textlength(line + character, font=face) > max_width:
                lines.append(line)
                line = character
            else:
                line += character
    if line:
        lines.append(line)
    return lines


def captioned(im, caption):
    im = im.copy()
    d = ImageDraw.Draw(im)
    lines = wrap_pixels(caption, d, font(54, True))
    yy = 1460 - max(0, len(lines) - 2) * 60
    d.rectangle((0, yy - 40, 1080, 1799), fill="#211e1b")
    for line in lines:
        d.text((60, yy), line, font=font(54, True), fill="#f5f1e7")
        yy += 74
    return im


def render(directory: Path, frames: list, reveal: str, output: Path):
    """Render captioned stills; the reveal is kept separately for the creator."""
    directory.mkdir(parents=True, exist_ok=True)
    for index, frame in enumerate(frames):
        with Image.open(directory / Path(frame["key"]).name) as image:
            captioned(image.convert("RGB"), frame["caption"]).save(directory / f"card-{index}.png")
