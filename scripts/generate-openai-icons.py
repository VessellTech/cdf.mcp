from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
SOURCE = ASSETS / "logo-blue.png"

OUTPUTS = {
    ASSETS / "openai-plugin-directory-icon-256.png": 256,
    ASSETS / "chatgpt-composer-icon-48.png": 48,
}


def resize_square(source: Path, output: Path, size: int) -> None:
    image = Image.open(source).convert("RGBA")
    if image.width != image.height:
        canvas_size = max(image.width, image.height)
        canvas = Image.new("RGBA", (canvas_size, canvas_size), (255, 255, 255, 0))
        offset = ((canvas_size - image.width) // 2, (canvas_size - image.height) // 2)
        canvas.alpha_composite(image, offset)
        image = canvas

    resized = image.resize((size, size), Image.Resampling.LANCZOS)
    resized.save(output, "PNG", optimize=True)


def main() -> None:
    if not SOURCE.exists():
        raise FileNotFoundError(f"Source icon not found: {SOURCE}")

    for output, size in OUTPUTS.items():
        resize_square(SOURCE, output, size)
        with Image.open(output) as generated:
            print(f"{output.relative_to(ROOT)}: {generated.width}x{generated.height}")


if __name__ == "__main__":
    main()
