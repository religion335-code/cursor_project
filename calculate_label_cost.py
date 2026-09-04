#!/usr/bin/env python3
"""Recompute C4050 per-label cost for PM_RLRENALA23.10L.01_PTSRU.

Default numbers match C4050_RENAL_SOL_A23_cost_roi.md (production quality).
Override any constant below or pass --ink-price / --media-roll-price.
"""

from __future__ import annotations

import argparse

# Artwork
WIDTH_MM = 101.5  # must be the web width on C4050 (max print 108 mm)
LENGTH_MM = 152.5
AREA_M2 = (WIDTH_MM / 1000.0) * (LENGTH_MM / 1000.0)

# Printer-like channel means from the PDF (excluding proof annotations)
COV = {"C": 0.01484, "M": 0.06064, "Y": 0.04242, "K": 0.05862}

# ml per m^2 at 100% of one channel
LAYDOWN = {
    "draft": 5.3,
    "production": 6.5,
    "photo": 8.5,
}
MAINT_INK = {"draft": 0.10, "production": 0.12, "photo": 0.15}

CART_ML = 50.0
DEFAULT_CART_TWD = 1320.0
DEFAULT_BOX_TWD = 1330.0
DEFAULT_BOX_LABELS = 50_000
MYR_PER_TWD = 1 / 7.6


def media_per_label(
    roll_price: float,
    roll_m: float,
    length_mm: float,
    gap_mm: float = 0.0,
) -> tuple[float, float]:
    pitch_mm = length_mm + gap_mm
    labels = (roll_m * 1000.0) / pitch_mm
    return roll_price / labels, labels


def ink_cost(
    quality: str,
    cart_twd: float,
    maint_extra: float | None = None,
) -> dict:
    lay = LAYDOWN[quality]
    extra = MAINT_INK[quality] if maint_extra is None else maint_extra
    ml_price = cart_twd / CART_ML
    out = {}
    print_ml = 0.0
    for ch, cov in COV.items():
        ml = AREA_M2 * cov * lay
        out[ch] = {"ml": ml, "twd": ml * ml_price, "yield": CART_ML / ml}
        print_ml += ml
    out["print_ml"] = print_ml
    out["print_twd"] = print_ml * ml_price
    out["total_ml"] = print_ml * (1 + extra)
    out["total_twd"] = out["print_twd"] * (1 + extra)
    return out


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--quality", choices=LAYDOWN, default="production")
    p.add_argument("--ink-price", type=float, default=DEFAULT_CART_TWD, help="TWD per 50ml cartridge")
    p.add_argument("--roll-price", type=float, default=512.5 * 1.65, help="TWD per media roll")
    p.add_argument("--roll-m", type=float, default=30.0)
    p.add_argument("--gap-mm", type=float, default=0.0, help="die-cut gap; 0 = continuous auto-cut")
    p.add_argument("--printer", type=float, default=62790.0)
    p.add_argument("--outsource", type=float, default=10.0, help="TWD per outsourced label")
    args = p.parse_args()

    ink = ink_cost(args.quality, args.ink_price)
    media_twd, n_labels = media_per_label(args.roll_price, args.roll_m, LENGTH_MM, args.gap_mm)
    box = DEFAULT_BOX_TWD / DEFAULT_BOX_LABELS
    total = ink["total_twd"] + media_twd + box

    print(f"Label {WIDTH_MM} x {LENGTH_MM} mm  area {AREA_M2:.5f} m2")
    print(f"Quality={args.quality}  coverage C/M/Y/K % = "
          + " ".join(f"{k}{v*100:.2f}" for k, v in COV.items()))
    print()
    print("Ink (TWD/label, incl. maintenance):")
    for ch in "CMYK":
        d = ink[ch]
        print(f"  {ch}: {d['twd']*(ink['total_twd']/ink['print_twd']):.4f}  "
              f"({d['ml']:.5f} ml print, ~{d['yield']:.0f} labels/cart)")
    print(f"  ink total: NT${ink['total_twd']:.3f}  ({ink['total_ml']:.5f} ml)")
    print(f"Media: NT${media_twd:.3f}  ({n_labels:.1f} labels/roll @ NT${args.roll_price:.0f}/{args.roll_m:.0f}m)")
    print(f"Waste box: NT${box:.3f}")
    print(f"TOTAL: NT${total:.2f}  (RM {total*MYR_PER_TWD:.2f})")
    save = args.outsource - total
    if save > 0:
        print(f"Payback vs NT${args.outsource:.0f} outsource: {args.printer/save:.0f} labels")
    else:
        print("Outsource is cheaper than in-house consumables at this price.")


if __name__ == "__main__":
    main()
