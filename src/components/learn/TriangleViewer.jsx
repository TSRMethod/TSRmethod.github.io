import { useEffect, useRef } from 'react'
import useMediaQuery from '../../hooks/useMediaQuery'
import { useResolvedTheme } from '../../hooks/useTheme'
import {
  drawScene,
  homeCamera,
  rotateCamera,
  titleCase,
  zoomCamera,
} from './triangleGeometry'
import styles from './TriangleViewer.module.css'

/*
 * The lesson's 3D view and its controls: drag to rotate, pinch or wheel to
 * zoom, tap a number to choose a triangle; with the picture focused, arrow
 * keys rotate, + and − zoom, 1 to 4 choose and R resets. Keys act only while
 * the picture itself has focus and never with a modifier, so they cannot take
 * over typing, browser shortcuts or screen-reader keys.
 *
 * Drawn only in the browser: the page shows the same values as text without
 * it (FourTriangles.jsx renders this only after hydration).
 */

const STEP = 0.08

function readColors(element) {
  const style = getComputedStyle(element)
  const v = (name) => style.getPropertyValue(name).trim()
  return {
    coil: v('--lesson-coil'),
    helix: v('--lesson-helix'),
    strand: v('--lesson-strand'),
    atom: v('--lesson-atom'),
    tri: v('--lesson-tri'),
    triFill: v('--lesson-tri-fill'),
    ghost: v('--lesson-ghost'),
    longest: v('--lesson-longest'),
    onTri: v('--lesson-on-tri') || '#ffffff',
    surface: v('--color-panel') || '#ffffff',
    ink: v('--color-text') || '#1f2933',
  }
}

export default function TriangleViewer({ scene, selected, onSelect, keysHelpId }) {
  const canvasRef = useRef(null)
  const cam = useRef(null)
  const size = useRef({ W: 0, H: 0, DPR: 1 })
  const tags = useRef([])
  const selectedRef = useRef(selected)
  const pointers = useRef(new Map())
  const gesture = useRef({ pinch: null, moved: 0 })
  const coarse = useMediaQuery('(pointer: coarse)')
  const theme = useResolvedTheme()

  const redraw = () => {
    const canvas = canvasRef.current
    const { W, H, DPR } = size.current
    if (!canvas || !W || !cam.current) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    tags.current = drawScene(ctx, {
      scene,
      cam: cam.current,
      selected: selectedRef.current,
      W,
      H,
      DPR,
      colors: readColors(canvas),
    })
  }

  useEffect(() => {
    cam.current = homeCamera(scene)

    const canvas = canvasRef.current
    const resize = () => {
      const r = canvas.getBoundingClientRect()
      const DPR = Math.min(window.devicePixelRatio || 1, 3)
      const W = Math.max(1, Math.round(r.width)), H = Math.max(1, Math.round(r.height))
      canvas.width = Math.round(W * DPR)
      canvas.height = Math.round(H * DPR)
      size.current = { W, H, DPR }
      redraw()
    }
    // The wheel must be able to prevent the page from scrolling while it
    // zooms, which a passive React listener cannot.
    const onWheel = (e) => {
      e.preventDefault()
      zoomCamera(cam.current, Math.exp(-e.deltaY * 0.0015))
      redraw()
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize)
    observer?.observe(canvas)
    resize()
    return () => {
      canvas.removeEventListener('wheel', onWheel)
      observer?.disconnect()
    }
    // The scene is fixed data; the effect runs once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene])

  useEffect(() => {
    selectedRef.current = selected
    redraw()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  /*
   * The colours are read from the page's tokens at every draw, so a change of
   * theme only needs a draw. The camera and the chosen triangle are refs and
   * props, untouched by it: the visitor keeps their view and their triangle.
   */
  useEffect(() => {
    redraw()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme])

  const resetView = () => {
    cam.current = homeCamera(scene)
    redraw()
  }

  const onPointerDown = (e) => {
    canvasRef.current.setPointerCapture?.(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    gesture.current.moved = 0
    if (pointers.current.size === 2) {
      const [p, q] = [...pointers.current.values()]
      gesture.current.pinch = { d: Math.hypot(p.x - q.x, p.y - q.y), z: cam.current.zoom }
    }
  }

  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return
    const prev = pointers.current.get(e.pointerId)
    const cur = { x: e.clientX, y: e.clientY }
    pointers.current.set(e.pointerId, cur)
    const { pinch } = gesture.current
    if (pointers.current.size === 2 && pinch) {
      const [p, q] = [...pointers.current.values()]
      cam.current.zoom = Math.max(0.5, Math.min(4, (pinch.z * Math.hypot(p.x - q.x, p.y - q.y)) / pinch.d))
      gesture.current.moved += 10
    } else if (pointers.current.size === 1) {
      const dx = cur.x - prev.x, dy = cur.y - prev.y
      gesture.current.moved += Math.abs(dx) + Math.abs(dy)
      rotateCamera(cam.current, dx * 0.01, dy * 0.01)
    }
    redraw()
  }

  const endPointer = (e) => {
    if (pointers.current.size === 1 && gesture.current.moved < 6 && e.type === 'pointerup') {
      const r = canvasRef.current.getBoundingClientRect()
      const x = e.clientX - r.left, y = e.clientY - r.top
      const hit = tags.current.find((h) => Math.hypot(h.x - x, h.y - y) <= h.r)
      if (hit) onSelect(hit.n)
    }
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) gesture.current.pinch = null
  }

  const onKeyDown = (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return
    if (e.key === 'ArrowLeft') rotateCamera(cam.current, -STEP, 0)
    else if (e.key === 'ArrowRight') rotateCamera(cam.current, STEP, 0)
    else if (e.key === 'ArrowUp') rotateCamera(cam.current, 0, -STEP)
    else if (e.key === 'ArrowDown') rotateCamera(cam.current, 0, STEP)
    else if (e.key === '+' || e.key === '=') zoomCamera(cam.current, 1.15)
    else if (e.key === '-') zoomCamera(cam.current, 1 / 1.15)
    else if (/^[1-4]$/.test(e.key)) {
      e.preventDefault()
      onSelect(Number(e.key) - 1)
      return
    } else if (e.key === 'r' || e.key === 'R') {
      cam.current = homeCamera(scene)
    } else return
    e.preventDefault()
    redraw()
  }

  const names = (t) => t.vertices.map((v) => `${titleCase(v.res)} ${v.seq}`)
  const current = scene.triangles[selected]

  return (
    <>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        tabIndex={0}
        aria-label={`Ubiquitin Cα trace, triangle ${selected + 1} highlighted: ${names(current).join(', ')}`}
        aria-describedby={keysHelpId}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onKeyDown={onKeyDown}
      />
      <div className={styles.controls}>
        <div className={styles.hintRow}>
          <p className={styles.hint}>
            {coarse
              ? 'Drag the picture to rotate it and pinch to zoom; scroll the page beside it. Tap a number to switch.'
              : 'Drag to rotate, use the wheel over the picture to zoom, click a number to switch. Keys work while the picture has focus.'}
          </p>
          <button type="button" className={styles.reset} onClick={resetView}>
            Reset view
          </button>
        </div>
        <div className={styles.picker} role="group" aria-label="Choose a triangle">
          {scene.triangles.map((t, n) => (
            <button
              key={t.key + t.vertices.map((v) => v.seq).join('-')}
              type="button"
              className={styles.pick}
              aria-pressed={n === selected}
              aria-label={`Triangle ${n + 1}: ${names(t).join(', ')}`}
              onClick={() => onSelect(n)}
            >
              <b>{n + 1}</b>
              <span>{t.vertices.map((v) => `${titleCase(v.res)}${v.seq}`).join(' ')}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
