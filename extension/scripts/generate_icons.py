#!/usr/bin/env python3
"""Generate Meta Library Downloader PNG icons without third-party deps."""
from __future__ import annotations

import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "icons"
BLUE = (24, 119, 242)
WHITE = (255, 255, 255)
NAVY = (15, 23, 42)


def png(width: int, height: int, rgb_rows: list[list[tuple[int, int, int]]]) -> bytes:
    raw = b"".join(b"\x00" + b"".join(bytes(px) for px in row) for row in rgb_rows)

    def chunk(tag: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )


def lerp(a: int, b: int, t: float) -> int:
    return int(a + (b - a) * t)


def fill(canvas: list[list[tuple[int, int, int]]], color: tuple[int, int, int]) -> None:
    for y, row in enumerate(canvas):
        for x in range(len(row)):
            canvas[y][x] = color


def set_px(canvas: list[list[tuple[int, int, int]]], x: int, y: int, color: tuple[int, int, int]) -> None:
    if 0 <= y < len(canvas) and 0 <= x < len(canvas[0]):
        canvas[y][x] = color


def fill_rect(canvas, x0, y0, x1, y1, color) -> None:
    for y in range(y0, y1):
        for x in range(x0, x1):
            set_px(canvas, x, y, color)


def fill_round_rect(canvas, x0, y0, x1, y1, r, color) -> None:
    for y in range(y0, y1):
        for x in range(x0, x1):
            dx = 0
            dy = 0
            if x < x0 + r:
                dx = x0 + r - x
            elif x >= x1 - r:
                dx = x - (x1 - r - 1)
            if y < y0 + r:
                dy = y0 + r - y
            elif y >= y1 - r:
                dy = y - (y1 - r - 1)
            if dx and dy and dx * dx + dy * dy > r * r:
                continue
            set_px(canvas, x, y, color)


def fill_circle(canvas, cx, cy, r, color) -> None:
    for y in range(cy - r, cy + r + 1):
        for x in range(cx - r, cx + r + 1):
            if (x - cx) ** 2 + (y - cy) ** 2 <= r * r:
                set_px(canvas, x, y, color)


def make_icon(size: int) -> bytes:
    canvas = [[BLUE for _ in range(size)] for _ in range(size)]
    fill(canvas, BLUE)
    pad = max(1, size // 16)
    fill_round_rect(canvas, pad, pad, size - pad, size - pad, max(2, size // 6), BLUE)

    # ad card
    card_x0 = size * 22 // 100
    card_y0 = size * 16 // 100
    card_x1 = size * 78 // 100
    card_y1 = size * 58 // 100
    fill_round_rect(canvas, card_x0, card_y0, card_x1, card_y1, max(2, size // 14), WHITE)

    # play triangle inside the card
    mid_x = (card_x0 + card_x1) // 2 + size // 32
    mid_y = (card_y0 + card_y1) // 2
    tri_w = max(3, size // 8)
    tri_h = max(4, size // 7)
    for y in range(mid_y - tri_h, mid_y + tri_h + 1):
        rel = abs(y - mid_y) / max(1, tri_h)
        width = int(tri_w * (1 - rel))
        for x in range(mid_x - 1, mid_x + width):
            set_px(canvas, x, y, BLUE)

    # download arrow
    ax = size // 2
    stem_top = size * 58 // 100
    stem_bot = size * 78 // 100
    stem_w = max(1, size // 14)
    fill_rect(canvas, ax - stem_w, stem_top, ax + stem_w + 1, stem_bot, WHITE)
    head = max(4, size // 6)
    for i in range(head):
        fill_rect(canvas, ax - head + i, stem_bot - 2 + i, ax + head - i + 1, stem_bot + i + 1, WHITE)

    return png(size, size, canvas)


def main() -> None:
    ROOT.mkdir(parents=True, exist_ok=True)
    for size in (16, 32, 48, 128):
        path = ROOT / f"icon{size}.png"
        path.write_bytes(make_icon(size))
        print(path)


if __name__ == "__main__":
    main()
