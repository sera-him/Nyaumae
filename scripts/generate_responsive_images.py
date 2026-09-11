"""Generate responsive WebP/AVIF derivatives without modifying original assets."""

from __future__ import annotations

import json
import re
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
OUTPUT = PUBLIC / "optimized"
SOURCE_EXTENSIONS = {".png", ".jpg", ".jpeg"}
REFERENCE_PATTERN = re.compile(r"['\"`](/[^'\"`?#]+\.(?:png|jpe?g))", re.IGNORECASE)
PORTAL_IMAGES = {
    "/hero-bg.jpg",
    "/2-generated.png",
    "/1.jpg",
    "/1-generated.png",
    "/2.jpg",
    "/2-time-nodes.png",
    "/3.jpg",
    "/3-generated.png",
}


def referenced_images() -> list[str]:
    references: set[str] = set()
    for source in (ROOT / "src").rglob("*"):
        if source.suffix.lower() not in {".ts", ".tsx", ".css"}:
            continue
        try:
            text = source.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        references.update(match.group(1) for match in REFERENCE_PATTERN.finditer(text))
    return sorted(
        reference
        for reference in references
        if (PUBLIC / reference.lstrip("/")).is_file()
        and Path(reference).suffix.lower() in SOURCE_EXTENSIONS
    )


def widths_for(reference: str) -> tuple[int, ...]:
    if reference.startswith(("/stickers/", "/pets/", "/icons/")):
        return (160, 320)
    if reference in PORTAL_IMAGES:
        return (240, 640, 960, 1280)
    if reference.startswith("/chat-themes/"):
        return (320, 640, 960, 1280)
    if reference.startswith("/characters/"):
        return (320, 640)
    if reference.startswith("/story-") or reference.startswith("/fox-penguin-"):
        return (320, 640, 960, 1280)
    return (320, 640, 960)


def variant_path(reference: str, width: int, extension: str) -> Path:
    relative = Path(reference.lstrip("/"))
    return OUTPUT / relative.parent / f"{relative.stem}-{width}.{extension}"


def save_variant(image: Image.Image, target: Path, source_mtime: float, width: int) -> bool:
    if target.exists() and target.stat().st_size > 0 and target.stat().st_mtime >= source_mtime:
        return False
    ratio = width / image.width
    height = max(1, round(image.height * ratio))
    resized = image.resize((width, height), Image.Resampling.LANCZOS)
    target.parent.mkdir(parents=True, exist_ok=True)
    temporary = target.with_name(f"{target.name}.tmp")
    if target.suffix == ".avif":
        resized.save(temporary, format="AVIF", quality=50, speed=8)
    else:
        resized.save(temporary, format="WEBP", quality=78, method=5)
    temporary.replace(target)
    return True


def process_reference(reference: str) -> tuple[str, dict[str, object], int, int]:
    source = PUBLIC / reference.lstrip("/")
    generated = 0
    skipped = 0
    with Image.open(source) as opened:
        image = ImageOps.exif_transpose(opened)
        if image.mode not in {"RGB", "RGBA"}:
            image = image.convert("RGBA" if "transparency" in image.info else "RGB")
        widths = tuple(width for width in widths_for(reference) if width <= image.width)
        entry: dict[str, object] = {
            "sourceWidth": image.width,
            "sourceHeight": image.height,
            "widths": widths,
        }
        for width in widths:
            for extension in ("avif", "webp"):
                target = variant_path(reference, width, extension)
                if save_variant(image, target, source.stat().st_mtime, width):
                    generated += 1
                else:
                    skipped += 1
    return reference, entry, generated, skipped


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    generated_dir = ROOT / "src" / "lib" / "generated"
    generated_dir.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, dict[str, object]] = {}
    generated = 0
    skipped = 0

    references = referenced_images()
    with ThreadPoolExecutor(max_workers=4, thread_name_prefix="responsive-image") as executor:
        for reference, entry, generated_count, skipped_count in executor.map(process_reference, references):
            manifest[reference] = entry
            generated += generated_count
            skipped += skipped_count

    manifest_text = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
    (OUTPUT / "manifest.json").write_text(manifest_text, encoding="utf-8")
    # Runtime copy: ResponsiveImage clamps its srcset to widths that actually
    # exist, so browsers never select a missing (404) srcset candidate.
    (generated_dir / "imageVariants.json").write_text(manifest_text, encoding="utf-8")
    print(f"responsive images: {generated} generated, {skipped} current, {len(manifest)} sources")


if __name__ == "__main__":
    main()
