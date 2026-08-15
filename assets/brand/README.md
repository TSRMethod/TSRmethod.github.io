# Brand source files

The group's approved logo, kept here as the master copies.

**Nothing in this folder is served.** It sits outside `public/`, so it is not
copied into the site and not processed by the image pipeline. What visitors
receive is derived from these and lives in `public/`.

| File | What it is |
| --- | --- |
| `logo-white-bg.png` | 1183 × 1212. Orbital rings drawn in **pale blue**. |
| `logo-transparent.png` | 1526 × 1460. Orbital rings drawn in **white**. |

## Which one to use

**`logo-white-bg.png`, for anything on this site.** The two files are not the
same artwork with and without a background: the transparent version's orbital
rings are white, so on the site's white header they disappear and only the
triangle survives. The pale-blue rings in the white-background version are what
read correctly against white.

`logo-transparent.png` is the one to use on a dark or coloured background.

## What was derived from them, and how

Both were produced with `sharp`; the commands are recorded here so the same
output can be regenerated rather than guessed at.

**`public/images/brand/tsr-mark.png`** — the mark in the site header. Trimmed
of its flat white margin so it fills the 40 px header slot, then squared onto a
transparent canvas at 192 px, which is enough for that slot at 3× pixel
density:

```js
const trimmed = await sharp('logo-white-bg.png').trim({ threshold: 12 }).toBuffer()
await sharp(trimmed)
  .resize({ width: 192, height: 192, fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 0 } })
  .png({ compressionLevel: 9 })
  .toFile('public/images/brand/tsr-mark.png')
```

**`public/favicon.svg`** — hand-drawn rather than exported. The full logo has
orbital rings, two benzene rings, a molecular graph and an amino-acid
structural formula in it; at 16 px none of that is legible and the result is a
smudge. The favicon keeps only the triangle and its three nodes, in colours
sampled from the artwork (`#134168`, `#54b8c9`, `#2e797f`, bars `#0f596f`), so
the two read as the same mark at the sizes each is actually used at.

**`public/apple-touch-icon.png`** — the same SVG at 180 px, flattened onto
white because iOS composites it onto its own tile.

## If the logo is ever replaced

Put the new master here, regenerate `tsr-mark.png` with the command above,
resample the three node colours for `favicon.svg`, and re-render the
apple-touch icon. The group's name is **not** part of any of these images — it
is real text in the header — so a new logo never means re-exporting the
wordmark.
