"""
Generates icon.png, adaptive-icon.png, and a widget-preview placeholder.
Run once locally (`python3 scripts/generate_icons.py`) and commit the output —
these are static assets, not something CI needs to regenerate.
Matches the portfolio's existing icon-generation convention (Python/Pillow).
"""
import math
import os

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "assets")

BG = (11, 11, 15, 255)          # #0B0B0F
ACCENT = (91, 140, 255, 255)    # #5B8CFF
WHITE = (255, 255, 255, 255)
DIM = (138, 138, 142, 255)      # #8A8A8E


def draw_clock_face(draw, cx, cy, r, face_color, hand_color, tick_color):
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=face_color)
    # Hour ticks
    for i in range(12):
        angle = math.radians(i * 30)
        outer = r * 0.92
        inner = r * (0.80 if i % 3 == 0 else 0.86)
        x1, y1 = cx + inner * math.sin(angle), cy - inner * math.cos(angle)
        x2, y2 = cx + outer * math.sin(angle), cy - outer * math.cos(angle)
        width = max(2, int(r * (0.03 if i % 3 == 0 else 0.015)))
        draw.line([x1, y1, x2, y2], fill=tick_color, width=width)
    # Hands fixed at ~10:08, a friendly "world clock" look
    hour_angle = math.radians(10 / 12 * 360)
    minute_angle = math.radians(8 / 60 * 360)
    hx, hy = cx + r * 0.5 * math.sin(hour_angle), cy - r * 0.5 * math.cos(hour_angle)
    mx, my = cx + r * 0.72 * math.sin(minute_angle), cy - r * 0.72 * math.cos(minute_angle)
    draw.line([cx, cy, hx, hy], fill=hand_color, width=max(3, int(r * 0.05)))
    draw.line([cx, cy, mx, my], fill=hand_color, width=max(2, int(r * 0.035)))
    draw.ellipse([cx - r * 0.04, cy - r * 0.04, cx + r * 0.04, cy + r * 0.04], fill=hand_color)


def make_icon(size, filename, transparent_bg=False):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0) if transparent_bg else BG)
    draw = ImageDraw.Draw(img)
    cx, cy = size / 2, size / 2
    r = size * 0.34
    draw_clock_face(draw, cx, cy, r, face_color=(28, 28, 30, 255), hand_color=WHITE, tick_color=ACCENT)
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
