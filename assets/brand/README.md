# Brand sources

The group's identity: direction **A2 · Compact, tilted**, adopted in November 2026.

**Nothing in this folder is served.** It sits outside `public/`. What visitors
receive is generated from these files and from
`src/components/brand/symbol.json`.

## The symbol

A triangle L1 L2 L3 is split by the median from the midpoint of its base,
L1–L2, to the third vertex, L3. This is the line from which TSR measures the
angle θ. A pale sector marks θ on its acute side, because TSR folds θ to at
most 90°. The triangle is illustrative, not a real residue triplet or key.
It is tilted 10° so that no edge is level; never straighten it.

There are two versions, both in `symbol.json`:

- **full** — 32 px and larger. The header draws this one.
- **small** — wider gap, rounder corners and no θ sector, which would close up
  at small sizes. Used by the favicon and the footer.

## Files here

| File | What it is |
| --- | --- |
| `tsr-symbol.svg` | The symbol, full colour, for reference |
| `tsr-logo-horizontal.svg` | The horizontal group logo, wordmark outlined: the source of the social card |
| `fonts/IBMPlexSans-Regular.ttf` | Used by `scripts/brand-assets.mjs` to outline the social card's tagline |
| `fonts/OFL.txt` | The font's licence, which must accompany the font file |
| `previous/` | The retired logo (raster masters, 2025), kept for the record. Not used anywhere |

## What is generated, and how

`node scripts/brand-assets.mjs` writes:

- `public/favicon.svg`
- `public/favicon.ico`
- `public/apple-touch-icon.png`
- `public/images/brand/tsr-logo.png`
- `public/share/social-card.png`

See [docs/DEPLOYMENT.md](../../docs/DEPLOYMENT.md#the-favicon-and-other-brand-images).

In the header the name is **real text**, not part of an image. It is set in
IBM Plex Sans: "TSR" in SemiBold in the theme's blue, "Research Group" in
Regular in the text colour. The fonts are IBM's own Latin-1 web files in
`public/fonts/ibm-plex-sans/`, served with `OFL.txt`. Only the wordmark uses
them; body text keeps the system font stack.

## The typeface

IBM Plex Sans 1.1.0 (`@ibm/plex-sans@1.1.0`, IBM's official GitHub release),
© 2017 IBM Corp., under the SIL Open Font License 1.1 with Reserved Font Name
"Plex":

- Keep `OFL.txt` with every copy of the font files.
- Never subset or modify the fonts under the name "Plex". Use IBM's files as
  released, as here.

## The full identity package

The brand guide (PDF), the logo files (horizontal, stacked, symbol and
small-size versions in colour, dark-background, black and white; SVG with
editable or outlined text, vector PDF and transparent PNG), avatars, app icons
and the BioTSR software lockup are kept in the group's design workspace, not
in this repository.

`symbol.json` and the two SVGs here are copied from that package. To change
the symbol, regenerate the package, copy the files across and rerun
`scripts/brand-assets.mjs`.
