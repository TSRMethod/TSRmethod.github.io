/*
 * Geometry and drawing for the lesson "Four triangles, one key".
 *
 * Moved unchanged in substance from the lesson's original standalone page:
 * the same self-check, camera and drawing. Nothing here knows about React;
 * TriangleViewer.jsx owns the canvas and calls in.
 *
 * The data is BioTSR 1.0.0 output for 1UBQ chain A
 * (src/content/learn/fourTriangles.json). verifyTriangles() recomputes every
 * triangle's raw angle, folded angle and longest edge from the coordinates,
 * and checks the bins, before anything is drawn: the picture must be
 * BioTSR's.
 */

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s]
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const len = (a) => Math.hypot(a[0], a[1], a[2])
const norm = (a) => mul(a, 1 / len(a))
const mean = (ps) => mul(ps.reduce(add, [0, 0, 0]), 1 / ps.length)
const clamp = (x, a, b) => Math.max(a, Math.min(b, x))

export const titleCase = (r) => r[0] + r.slice(1).toLowerCase()

/** The scene: points, secondary structure, triangles as point indices. */
export function buildScene(data) {
  const P = data.ca.map((r) => r.xyz)
  const idx = Object.fromEntries(data.ca.map((r, i) => [r.seq, i]))
  const sseOf = (s) => {
    for (const [k, a, b] of data.sse) if (s >= a && s <= b) return k
    return 'coil'
  }
  const kind = data.ca.map((r) => sseOf(parseInt(r.seq, 10)))
  const bonded = P.map((p, i) => i + 1 < P.length && len(sub(P[i + 1], p)) < 4.3)
  const center = mean(P)
  const radius = Math.max(...P.map((p) => len(sub(p, center))))
  const triangles = data.triangles.map((t) => ({ ...t, ix: t.vertices.map((v) => idx[v.seq]) }))
  return { P, idx, kind, bonded, center, radius, triangles }
}

/**
 * Throws unless every triangle's geometry, recomputed from the coordinates,
 * equals BioTSR's values, and every value lies in its bin (lower bound
 * included, upper bound excluded, as BioTSR defines them).
 */
export function verifyTriangles(data, scene = buildScene(data)) {
  for (const t of scene.triangles) {
    const [a, b, c] = t.ix.map((i) => scene.P[i])
    // BioTSR's raw angle is at the base midpoint, between the second vertex
    // and the apex; the TSR angle folds it into 0-90 degrees.
    const M = mul(add(a, b), 0.5)
    const raw = (Math.acos(dot(norm(sub(b, M)), norm(sub(c, M)))) * 180) / Math.PI
    const ang = raw <= 90 ? raw : 180 - raw
    const longest = Math.max(len(sub(a, b)), len(sub(a, c)), len(sub(b, c)))
    if (
      Math.abs(raw - t.theta_raw) > 1e-6 ||
      Math.abs(ang - t.theta) > 1e-6 ||
      Math.abs(longest - t.max_distance) > 1e-9 ||
      t.key !== data.key
    ) {
      throw new Error('drawn geometry disagrees with the verified BioTSR values')
    }
    if (
      !(t.theta >= t.theta_bin[0] && t.theta < t.theta_bin[1]) ||
      !(t.max_distance >= t.distance_bin[0] && t.max_distance < t.distance_bin[1])
    ) {
      throw new Error('a value lies outside the bin it is listed in')
    }
  }
  if (scene.triangles.length !== data.frequency) {
    throw new Error('number of triangles differs from the .keys frequency')
  }
  return true
}

/* ---------------- camera ---------------- */

function faceBasis(p, q, r) {
  const x = norm(sub(q, p))
  const n = norm(cross(sub(q, p), sub(r, p)))
  return [x, cross(n, x), n]
}

/** The opening view: triangle 1 face-on, its base horizontal, apex up. */
export function homeCamera(scene) {
  const R0 = faceBasis(...scene.triangles[0].ix.map((i) => scene.P[i]))
  const xs = scene.P.map((p) => dot(R0[0], sub(p, scene.center)))
  const ys = scene.P.map((p) => dot(R0[1], sub(p, scene.center)))
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys)
  const box = { w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 }
  const pivot = add(scene.center, add(mul(R0[0], box.cx), mul(R0[1], box.cy)))
  return { R: R0.map((v) => v.slice()), zoom: 1, box, pivot }
}

/** Rotate about the screen's y (yaw, dx) and x (pitch, dy) axes. */
export function rotateCamera(cam, dx, dy) {
  const [ex, ey, ez] = cam.R
  let nx = add(mul(ex, Math.cos(dx)), mul(ez, -Math.sin(dx)))
  const nz = add(mul(ex, Math.sin(dx)), mul(ez, Math.cos(dx)))
  let ny = add(mul(ey, Math.cos(dy)), mul(nz, Math.sin(dy)))
  // Re-orthonormalise; the third axis follows from the other two.
  nx = norm(nx)
  ny = norm(sub(ny, mul(nx, dot(ny, nx))))
  cam.R = [nx, ny, cross(nx, ny)]
}

export const zoomCamera = (cam, factor) => {
  cam.zoom = clamp(cam.zoom * factor, 0.5, 4)
}

/* ---------------- drawing ---------------- */

function withAlpha(color, a) {
  const m = color.match(/^#([0-9a-f]{6})$/i)
  if (!m) return color
  const n = parseInt(m[1], 16)
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`
}

const FONT = "600 13px system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
const TAG_FONT = "700 13px system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"

/**
 * Draw the scene with triangle `selected` highlighted, and return where the
 * number tags ended up, so a tap on one can select it.
 * `colors` are read from the lesson's CSS custom properties.
 */
export function drawScene(ctx, { scene, cam, selected, W, H, DPR, colors }) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
  ctx.clearRect(0, 0, W, H)
  const { P, radius, kind, bonded, triangles: TRIS, idx } = scene

  const project = (p) => {
    const v = sub(p, cam.pivot)
    const x = dot(cam.R[0], v), y = dot(cam.R[1], v), z = dot(cam.R[2], v)
    const f = 1 / (1 - z / 170)
    const s = Math.min(W / (cam.box.w * 1.22), H / (cam.box.h * 1.22)) * cam.zoom
    return { x: W / 2 + x * s * f, y: H / 2 - y * s * f, z, f, s }
  }

  const pillAt = (text, x, y) => {
    ctx.font = FONT
    const w = ctx.measureText(text).width + 14, h = 22
    x = clamp(x, w / 2 + 4, W - w / 2 - 4)
    y = clamp(y, h / 2 + 4, H - h / 2 - 4)
    ctx.fillStyle = colors.surface
    ctx.strokeStyle = colors.tri
    ctx.lineWidth = 1.5
    ctx.beginPath()
    if (ctx.roundRect) ctx.roundRect(x - w / 2, y - h / 2, w, h, 11)
    else ctx.rect(x - w / 2, y - h / 2, w, h)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = colors.ink
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, x, y + 0.5)
  }

  const pr = P.map(project)
  const items = []
  P.forEach((_, i) => {
    if (bonded[i]) items.push({ b: true, i, z: (pr[i].z + pr[i + 1].z) / 2 })
    items.push({ b: false, i, z: pr[i].z + 0.01 })
  })
  items.sort((a, b) => a.z - b.z)
  ctx.lineCap = 'round'
  const k = pr[0].s / 16
  for (const it of items) {
    const fog = clamp(0.35 + (0.65 * (it.z + radius)) / (2 * radius), 0.3, 1)
    if (it.b) {
      const a = pr[it.i], b = pr[it.i + 1]
      ctx.strokeStyle = withAlpha(colors[kind[it.i]], 0.25 + 0.75 * fog)
      ctx.lineWidth = Math.max(2, (5.5 * k * (a.f + b.f)) / 2)
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.stroke()
    } else {
      const a = pr[it.i]
      ctx.fillStyle = withAlpha(colors.atom, 0.2 + 0.6 * fog)
      ctx.beginPath()
      ctx.arc(a.x, a.y, Math.max(1.6, 2.8 * k * a.f), 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // The other triangles with the same key: dashed outlines.
  TRIS.forEach((t, n) => {
    if (n === selected) return
    const q = t.ix.map((i) => pr[i])
    ctx.setLineDash([5, 5])
    ctx.strokeStyle = colors.ghost
    ctx.lineWidth = 1.6
    ctx.beginPath()
    q.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
    ctx.closePath()
    ctx.stroke()
    ctx.setLineDash([])
  })

  // The selected triangle, its longest edge in bold, and the median.
  const t = TRIS[selected], q = t.ix.map((i) => pr[i])
  ctx.fillStyle = colors.triFill
  ctx.strokeStyle = colors.tri
  ctx.lineWidth = 3.5
  ctx.lineJoin = 'round'
  ctx.beginPath()
  q.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  const [la, lb] = t.longest_edge.map((s) => pr[idx[s]])
  ctx.strokeStyle = colors.longest
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(la.x, la.y)
  ctx.lineTo(lb.x, lb.y)
  ctx.stroke()
  const M = project(mul(add(P[t.ix[0]], P[t.ix[1]]), 0.5))
  ctx.setLineDash([6, 5])
  ctx.strokeStyle = colors.tri
  ctx.lineWidth = 2.2
  ctx.beginPath()
  ctx.moveTo(M.x, M.y)
  ctx.lineTo(q[2].x, q[2].y)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.fillStyle = colors.tri
  ctx.beginPath()
  ctx.arc(M.x, M.y, 3.5, 0, Math.PI * 2)
  ctx.fill()
  q.forEach((p) => {
    ctx.fillStyle = colors.tri
    ctx.strokeStyle = colors.surface
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(p.x, p.y, 7, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  })

  // Residue labels and number tags, laid out together so none overlap: each
  // starts at its anchor (labels outward from their own vertex, tags at their
  // triangle's centre), is pushed apart from the others, and is drawn with a
  // leader line back to its anchor if it had to move away from it.
  ctx.font = FONT
  const gx = (q[0].x + q[1].x + q[2].x) / 3, gy = (q[0].y + q[1].y + q[2].y) / 3
  const boxes = []
  q.forEach((p, i) => {
    const v = t.vertices[i], text = `${titleCase(v.res)} ${v.seq}`
    const dx = p.x - gx, dy = p.y - gy, L = Math.hypot(dx, dy) || 1
    const w = ctx.measureText(text).width + 14
    boxes.push({ kind: 'label', text, ax: p.x, ay: p.y, x: p.x + (dx / L) * (w / 2 + 10), y: p.y + (dy / L) * 22, w, h: 22 })
  })
  TRIS.forEach((tt, n) => {
    const qq = tt.ix.map((i) => pr[i])
    const cx = (qq[0].x + qq[1].x + qq[2].x) / 3, cy = (qq[0].y + qq[1].y + qq[2].y) / 3
    boxes.push({ kind: 'tag', n, ax: cx, ay: cy, x: cx, y: cy, w: 26, h: 26 })
  })
  const fixed = q.map((p) => ({ x: p.x, y: p.y, w: 16, h: 16 }))
  for (let it = 0; it < 60; it++) {
    let movedAny = false
    const all = boxes.concat(fixed)
    for (let a = 0; a < boxes.length; a++) {
      for (let b = 0; b < all.length; b++) {
        if (a === b) continue
        const A = boxes[a], B = all[b]
        const ox = (A.w + B.w) / 2 + 4 - Math.abs(A.x - B.x)
        const oy = (A.h + B.h) / 2 + 3 - Math.abs(A.y - B.y)
        if (ox > 0 && oy > 0) {
          const share = b < boxes.length ? 0.5 : 1
          if (ox < oy) A.x += (A.x >= B.x ? 1 : -1) * ox * share
          else A.y += (A.y >= B.y ? 1 : -1) * oy * share
          movedAny = true
        }
      }
      const A = boxes[a]
      A.x = clamp(A.x, A.w / 2 + 4, W - A.w / 2 - 4)
      A.y = clamp(A.y, A.h / 2 + 4, H - A.h / 2 - 4)
    }
    if (!movedAny) break
  }
  const tags = []
  for (const B of boxes) {
    if (Math.hypot(B.x - B.ax, B.y - B.ay) > (B.kind === 'tag' ? 6 : B.w / 2 + 16)) {
      ctx.strokeStyle = B.kind === 'tag' ? colors.ghost : colors.tri
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(B.ax, B.ay)
      ctx.lineTo(B.x, B.y)
      ctx.stroke()
    }
  }
  for (const B of boxes) {
    if (B.kind === 'label') {
      pillAt(B.text, B.x, B.y)
    } else {
      const on = B.n === selected
      ctx.fillStyle = on ? colors.tri : colors.surface
      ctx.strokeStyle = on ? colors.tri : colors.ghost
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(B.x, B.y, 12, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = on ? colors.onTri : colors.ink
      ctx.font = TAG_FONT
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(B.n + 1), B.x, B.y + 0.5)
      tags.push({ n: B.n, x: B.x, y: B.y, r: 20 })
    }
  }
  return tags
}
