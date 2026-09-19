"""
Generates icon.png, adaptive-icon.png, and a widget-preview placeholder.
Run once locally (`python3 scripts/generate_icons.py`) and commit the output —
these are static assets, not something CI needs to regenerate.
Matches the portfolio's existing icon-generation convention (Python/Pillow).

Icon is a digital (numeral) readout, not an analog clock face — matches the
app/widget itself, which only ever shows digital time.
"""
import os

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "assets")

BG = (11, 11, 15, 255)          # #0B0B0F
ACCENT = (91, 140, 255, 255)    # #5B8CFF
WHITE = (255, 255, 255, 255)
DIM = (138, 138, 142, 255)      # #8A8A8E


def load_font(size):
    for path in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf",
    ):
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def draw_digital_face(draw, size, face_color, text_color, accent_color, transparent_bg):
    pad = size * 0.06
    card_r = size * 0.22
    if not transparent_bg:
        draw.rounded_rectangle([pad, pad, size - pad, size - pad], radius=card_r, fill=face_color)

    inner_pad = size * 0.14
    card_left, card_right = pad, size - pad

    # Small accent "AM"-style tab, top-left, just for visual interest
    tab_w, tab_h = size * 0.16, size * 0.07
    tab_x, tab_y = card_left + inner_pad, pad + size * 0.10
    draw.rounded_rectangle(
        [tab_x, tab_y, tab_x + tab_w, tab_y + tab_h], radius=tab_h / 2, fill=accent_color
    )

    # Big digital time readout, centered, sized to fit within the card padding
    time_text = "12:47"
    max_width = card_right - card_left - inner_pad * 2
    font_size = int(size * 0.30)
    font = load_font(font_size)
    bbox = draw.textbbox((0, 0), time_text, font=font)
    while (bbox[2] - bbox[0]) > max_width and font_size > 10:
        font_size -= 4
        font = load_font(font_size)
        bbox = draw.textbbox((0, 0), time_text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = (card_left + card_right) / 2 - tw / 2 - bbox[0]
    ty = size * 0.52 - th / 2 - bbox[1]
    draw.text((tx, ty), time_text, font=font, fill=text_color)

    # Thin accent underline
    line_y = size * 0.72
    draw.rounded_rectangle(
        [card_left + inner_pad, line_y, size - pad - inner_pad, line_y + size * 0.025],
        radius=size * 0.0125,
        fill=accent_color,
    )


def make_icon(size, filename, transparent_bg=False):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0) if transparent_bg else BG)
    draw = ImageDraw.Draw(img)
    draw_digital_face(
        draw,
        size,
        face_color=(28, 28, 30, 255),
        text_color=WHITE,
        accent_color=ACCENT,
        transparent_bg=transparent_bg,
    )
    img.save(os.path.join(ASSETS, filename))
    print(f"wrote {filename} ({size}x{size})")


def make_widget_preview(filename="widget-preview/worldclock.png"):
    w, h = 360, 200
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle([0, 0, w, h], radius=28, fill=(28, 28, 30, 235))

    try:
        font_label = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20)
        font_time = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 30)
        font_sub = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 14)
    except OSError:
        font_label = font_time = font_sub = ImageFont.load_default()

    rows = [
        ("India (IST)", "UTC+5:30", "14:32"),
        ("New York", "UTC-4", "05:02"),
        ("London", "UTC+1", "10:02"),
    ]
    y = 20
    for label, offset, time in rows:
        draw.text((22, y), label, font=font_label, fill=WHITE)
        draw.text((22, y + 26), offset, font=font_sub, fill=DIM)
        tw = draw.textlength(time, font=font_time)
        draw.text((w - 22 - tw, y + 6), time, font=font_time, fill=WHITE)
        y += 56

    out_path = os.path.join(ASSETS, filename)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    img.save(out_path)
    print(f"wrote {filename} ({w}x{h}) — placeholder; swap for a real screenshot once built")


if __name__ == "__main__":
    os.makedirs(ASSETS, exist_ok=True)
    make_icon(1024, "icon.png", transparent_bg=False)
    make_icon(1024, "adaptive-icon.png", transparent_bg=True)
    make_widget_preview()
