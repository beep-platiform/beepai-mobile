from pathlib import Path
from PIL import Image

source = Path("assets/images/icon.png")
targets = [
    source,
    Path("assets/images/splash-icon.png"),
    Path("assets/images/favicon.png"),
    Path("assets/images/android-icon-foreground.png"),
]

with Image.open(source) as image:
    image = image.convert("RGBA")
    image.thumbnail((512, 512), Image.Resampling.LANCZOS)
    optimized = image.quantize(colors=256, method=Image.Quantize.FASTOCTREE)
    for target in targets:
        optimized.save(target, format="PNG", optimize=True)
