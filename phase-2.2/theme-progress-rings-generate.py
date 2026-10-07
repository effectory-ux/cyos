#!/usr/bin/env python3
"""Segmented theme-progress rings — 20x20, 2px stroke.
ring(total, done) -> SVG string. Segments = questions in the theme;
teal segments = added, light segments = still to add. Complete = all teal.
"""
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "theme-progress-rings")
GAP, LIGHT, TEAL = 10.0, "#E1F5EE", "#1D9E75"

def ring(total, done):
    seg = 100.0 / total
    dash = seg - GAP
    bg = (f'<circle cx="10" cy="10" r="8" fill="none" stroke="{LIGHT}" stroke-width="2" '
          f'stroke-linecap="round" pathLength="100" stroke-dasharray="{dash:.3f} {GAP:.3f}" '
          f'transform="rotate(-90 10 10)"/>')
    fg = ""
    if done > 0:
        arr = []
        for _ in range(done):
            arr += [dash, GAP]
        arr[-1] = GAP + (100.0 - done * seg)   # final gap skips the remaining arc
        darr = " ".join(f"{x:.3f}" for x in arr)
        fg = (f'<circle cx="10" cy="10" r="8" fill="none" stroke="{TEAL}" stroke-width="2" '
              f'stroke-linecap="round" pathLength="100" stroke-dasharray="{darr}" '
              f'transform="rotate(-90 10 10)"/>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" '
            f'viewBox="0 0 20 20">{bg}{fg}</svg>')

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    n = 0
    for total in range(2, 7):
        for done in range(total + 1):
            with open(os.path.join(OUT, f"ring-{total}step-{done}of{total}.svg"), "w") as f:
                f.write(ring(total, done))
            n += 1
    print(f"wrote {n} SVGs to {OUT}")
