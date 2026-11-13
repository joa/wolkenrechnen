"""Generate the Wolkenrechnen Open Graph card at 1200 × 630 pixels."""

from pathlib import Path
import math

from PIL import Image, ImageDraw, ImageFilter, ImageFont


SCALE = 2
WIDTH, HEIGHT = 1200, 630
OUT = Path(__file__).resolve().parents[1] / "og-image.png"
FONT_DIR = Path("C:/Windows/Fonts")
REGULAR = FONT_DIR / "segoeui.ttf"
SEMIBOLD = FONT_DIR / "seguisb.ttf"
BOLD = FONT_DIR / "segoeuib.ttf"


def q(value):
    return round(value * SCALE)


def font(path, size):
    return ImageFont.truetype(str(path), q(size))


def cloud_layer(size, boxes, fill, shadow=True):
    mask = Image.new("L", (q(WIDTH), q(HEIGHT)), 0)
    md = ImageDraw.Draw(mask)
    for x, y, w, h in boxes:
        md.ellipse((q(x), q(y), q(x + w), q(y + h)), fill=255)
    if shadow:
        shadow_mask = mask.filter(ImageFilter.GaussianBlur(q(16)))
        shadow_image = Image.new("RGBA", mask.size, (95, 117, 167, 0))
        shadow_image.putalpha(shadow_mask.point(lambda px: round(px * 0.19)))
        canvas.alpha_composite(shadow_image, (0, q(9)))
    cloud = Image.new("RGBA", mask.size, fill)
    cloud.putalpha(mask)
    canvas.alpha_composite(cloud)


canvas = Image.new("RGBA", (q(WIDTH), q(HEIGHT)))
pixels = canvas.load()
top = (232, 242, 255)
bottom = (250, 248, 242)
for y in range(q(HEIGHT)):
    t = y / (q(HEIGHT) - 1)
    color = tuple(round(a * (1 - t) + b * t) for a, b in zip(top, bottom)) + (255,)
    for x in range(q(WIDTH)):
        pixels[x, y] = color

# A warm sun glow and soft sky haze.
glow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
gd = ImageDraw.Draw(glow)
gd.ellipse((q(820), q(-80), q(1280), q(380)), fill=(255, 226, 171, 100))
glow = glow.filter(ImageFilter.GaussianBlur(q(90)))
canvas.alpha_composite(glow)

# The rainbow sits behind the hero cloud, with the same gentle colors as the app scene.
rainbow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
rd = ImageDraw.Draw(rainbow)
rainbow_colors = ["#f4aebf", "#ffd0a9", "#f4dfa1", "#aad4c4", "#94afe6"]
for index, color in enumerate(rainbow_colors):
    inset = index * 28
    rd.arc((q(596 + inset), q(92 + inset), q(1186 - inset), q(682 - inset)), 180, 360, fill=color, width=q(22))
canvas.alpha_composite(rainbow.filter(ImageFilter.GaussianBlur(q(1.5))))

# Distant, translucent cloud banks.
cloud_layer(canvas.size, [(690, 478, 340, 95), (780, 444, 210, 105), (1020, 492, 270, 100)], (255, 255, 255, 135), False)
cloud_layer(canvas.size, [(-80, 548, 310, 115), (72, 521, 225, 140), (220, 554, 270, 120)], (226, 235, 253, 190), False)
cloud_layer(canvas.size, [(932, 555, 300, 130), (1050, 520, 260, 140), (1160, 562, 240, 100)], (224, 234, 252, 215), False)

draw = ImageDraw.Draw(canvas)

# Sun, its halo, and a few small sparkles.
draw.ellipse((q(1040), q(48), q(1124), q(132)), fill="#ffe6b3")
draw.ellipse((q(1057), q(65), q(1107), q(115)), fill="#fff1cf")


def sparkle(cx, cy, radius, color):
    points = []
    for index in range(8):
        angle = -math.pi / 2 + index * math.pi / 4
        r = radius if index % 2 == 0 else radius * 0.2
        points.append((q(cx + math.cos(angle) * r), q(cy + math.sin(angle) * r)))
    draw.polygon(points, fill=color)


sparkle(690, 145, 13, "#8b83ca")
sparkle(1122, 245, 12, "#6d79bb")
sparkle(1035, 360, 9, "#7f87c9")
sparkle(590, 410, 8, "#a4a6d9")
draw.ellipse((q(744), q(218), q(754), q(228)), fill="#94afe6")
draw.ellipse((q(1084), q(300), q(1092), q(308)), fill="#f4aebf")

# Floating cloud near the sun.
cloud_layer(canvas.size, [(880, 164, 92, 42), (895, 142, 45, 48), (924, 151, 48, 42)], (255, 255, 255, 235))

# Wordmark and app descriptor.
draw.rounded_rectangle((q(76), q(66), q(126), q(116)), radius=q(15), fill="#e1eaff")
cloud_layer(canvas.size, [(84, 91, 32, 13), (90, 82, 16, 17), (102, 85, 16, 15)], "#ffffff", False)
draw.arc((q(84), q(88), q(116), q(108)), 0, 180, fill="#293c76", width=q(2))
draw.text((q(142), q(66)), "Wolkenrechnen", font=font(BOLD, 30), fill="#242842")
draw.text((q(144), q(101)), "DER 1×1-TRAINER", font=font(SEMIBOLD, 12), fill="#596486", spacing=q(2))

# Main message, with a small purple accent rule.
draw.rounded_rectangle((q(80), q(226), q(88), q(390)), radius=q(4), fill="#7776d5")
draw.text((q(112), q(215)), "Das kleine", font=font(BOLD, 70), fill="#242842", stroke_width=q(1), stroke_fill="#242842")
draw.text((q(112), q(292)), "Einmaleins.", font=font(BOLD, 70), fill="#4c51ae", stroke_width=q(1), stroke_fill="#4c51ae")
draw.text((q(115), q(392)), "Spielerisch üben. Sicher werden.", font=font(REGULAR, 25), fill="#545b71")

# A soft shadow behind the equation cloud, then its layered puffy silhouette.
cloud_layer(canvas.size, [(698, 398, 380, 124), (758, 332, 230, 170), (871, 350, 235, 145), (1011, 408, 154, 106)], (255, 255, 255, 250))
draw = ImageDraw.Draw(canvas)
draw.text((q(890), q(394)), "HEUTE GESCHAFFT", font=font(SEMIBOLD, 14), fill="#7776d5", anchor="mm")
draw.text((q(890), q(455)), "7 × 8 = 56", font=font(BOLD, 54), fill="#303e79", anchor="mm", stroke_width=q(1), stroke_fill="#303e79")

# Final tiny glints on the cloud to make the scene feel bright and finished.
sparkle(754, 352, 9, "#d5a4d0")
sparkle(1034, 359, 8, "#a6b7e5")

canvas.convert("RGB").resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS).save(OUT, "PNG", optimize=True)
print(OUT)
