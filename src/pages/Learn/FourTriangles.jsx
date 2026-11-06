import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import usePageMetadata from '../../hooks/usePageMetadata'
import useHydrating from '../../hooks/useHydrating'
import Breadcrumb from '../../components/shared/Breadcrumb'
import TriangleViewer from '../../components/learn/TriangleViewer'
import { buildScene, titleCase, verifyTriangles } from '../../components/learn/triangleGeometry'
import { LEARNING_PAGES } from '../../content/learnResources'
import data from '../../content/learn/fourTriangles.json'
import layout from '../../components/method/MethodPage.module.css'
import styles from './FourTriangles.module.css'

/*
 * Four triangles, one key: the interactive lesson of Learn BioTSR.
 *
 * Everything the 3D view shows is also text in the page (prerendered, so it
 * reads without JavaScript): the explanation, the selected triangle's values
 * with explicit bin boundaries, and a table of all four. The view itself is
 * drawn only in the browser, after hydration, and only if the data passes its
 * own check against the coordinates (triangleGeometry.js).
 *
 * The numbers are BioTSR 1.0.0 output for 1UBQ chain A, unchanged from the
 * lesson's verified original; src/learn.test.js holds them to the worked
 * example on Understand TSR and to the notebook's recorded run.
 */

const scene = buildScene(data)
const verified = (() => {
  try {
    return verifyTriangles(data, scene)
  } catch {
    return false
  }
})()

const names = (t) => t.vertices.map((v) => `${titleCase(v.res)} ${v.seq}`)
const range = (lo, hi, symbol, unit) => `${lo.toFixed(2)}${unit} ≤ ${symbol} < ${hi.toFixed(2)}${unit}`
const longestEdge = (t) =>
  t.longest_edge.map((seq) => `${titleCase(data.ca.find((r) => r.seq === seq).res)} ${seq}`).join(' – ')
const intFormat = new Intl.NumberFormat('en-US')

/* A bin with the four values marked in it, edge to edge; decoration only. */
function BinTrack({ lo, hi, values, current, unit }) {
  const lanes = useMemo(() => {
    const order = values.map((_, n) => n).sort((a, b) => values[a] - values[b])
    const lane = {}
    order.forEach((n, k) => {
      const prev = order[k - 1]
      if (k > 0 && (values[n] - values[prev]) / (hi - lo) < 0.09 && !lane[prev]) {
        lane[prev] = 'up'
        lane[n] = 'down'
      }
    })
    return lane
  }, [values, lo, hi])

  return (
    <div className={styles.bin} aria-hidden="true">
      <div className={styles.binTrack}>
        {values.map((v, n) => (
          <div
            key={n}
            className={[styles.binDot, lanes[n] && styles[lanes[n]], n === current && styles.on]
              .filter(Boolean)
              .join(' ')}
            /* Inset by the marker's radius, so a value at an edge stays whole. */
            style={{ left: `calc(11px + (100% - 22px) * ${((v - lo) / (hi - lo)).toFixed(4)})` }}
          >
            {n + 1}
          </div>
        ))}
      </div>
      <div className={styles.binEnds}>
        <span>{`${lo.toFixed(2)}${unit} (included)`}</span>
        <span>{`${hi.toFixed(2)}${unit} (excluded)`}</span>
      </div>
    </div>
  )
}

export default function FourTriangles() {
  usePageMetadata({
    title: 'Four triangles, one key',
    description:
      'Why four different ubiquitin triangles share one BioTSR key: rotate PDB 1UBQ, switch between the triangles and see what a TSR key keeps and what it leaves out. Values from BioTSR 1.0.0.',
  })
  const hydrating = useHydrating()
  const [selected, setSelected] = useState(0)
  const [announcement, setAnnouncement] = useState('')

  const t = scene.triangles[selected]
  const choose = (n) => {
    setSelected(n)
    const c = scene.triangles[n]
    setAnnouncement(
      `Triangle ${n + 1}: ${names(c).join(', ')}. Angle ${c.theta.toFixed(2)} degrees, longest edge ${c.max_distance.toFixed(2)} ångströms. Same key, ${data.key}.`,
    )
  }

  return (
    <article className={`${layout.page} ${styles.lesson}`}>
      <header className={styles.header}>
        <Breadcrumb
          trail={[
            { to: '/software', label: 'BioTSR' },
            { to: '/software/learn', label: 'Learn BioTSR' },
          ]}
          current="Four triangles, one key"
        />
        <h1 className={layout.title}>Why do four triangles share one BioTSR key?</h1>
        <p className={styles.lede}>
          Ubiquitin (PDB 1UBQ), chain A, computed with the protein Cα method of BioTSR 1.0.0. Four
          different triangles in it have the same key, {data.key}. Choose one, rotate the
          structure, and see what changes and what stays the same.
        </p>
      </header>

      <div className={styles.layout}>
        <div className={styles.viewer}>
          {!hydrating && verified ? (
            <TriangleViewer scene={scene} selected={selected} onSelect={choose} keysHelpId="keys-help" />
          ) : (
            <noscript>
              <p className={styles.noscript}>
                The 3D view needs JavaScript. Everything it shows is in the panel and in the table
                below, and the <Link to="/tsr#worked-example">worked example on Understand TSR</Link>{' '}
                follows the same triangles step by step.
              </p>
            </noscript>
          )}
          <p id="keys-help" className="visually-hidden">
            With the picture focused: arrow keys rotate, plus and minus zoom, 1 to 4 choose a
            triangle, R resets the view.
          </p>
        </div>

        <div className={styles.panel}>
          <div className={styles.section}>
            <p>
              <strong>A key keeps only three things:</strong> the three vertex labels, which bin
              the triangle’s angle θ falls in, and which bin its longest edge falls in. Exact
              positions and lengths are not part of it, so different triangles whose values land in
              the same bins get the same key.
            </p>
          </div>

          <div className={styles.section}>
            <span className={`${styles.tag} ${styles.changes}`}>Changes between triangles</span>
            <dl className={styles.rows}>
              <div className={styles.row}>
                <dt>Residues</dt>
                <dd>
                  {names(t).join(', ')} <span className={styles.sub}>triangle {selected + 1}</span>
                </dd>
              </div>
              <div className={styles.row}>
                <dt>TSR angle θ</dt>
                <dd className={styles.mono}>{t.theta.toFixed(2)}°</dd>
              </div>
              <div className={styles.row}>
                <dt>Longest edge (maxDist)</dt>
                <dd className={styles.mono}>
                  {t.max_distance.toFixed(2)} Å
                  <span className={styles.sub}>between {longestEdge(t).replace(' – ', ' and ')}</span>
                </dd>
              </div>
            </dl>
          </div>

          <div className={styles.section}>
            <span className={`${styles.tag} ${styles.same}`}>Same for all four</span>
            <dl className={styles.rows}>
              <div className={styles.row}>
                <dt>Vertex labels (residue codes)</dt>
                <dd className={styles.mono}>
                  {t.vertices.map((v) => `${titleCase(v.res)} ${v.code}`).join(' · ')}
                </dd>
              </div>
              <div className={styles.row}>
                <dt>θ class</dt>
                <dd>
                  <span className={styles.mono}>
                    class {t.theta_class}: {range(t.theta_bin[0], t.theta_bin[1], 'θ', '°')}
                  </span>
                  {!hydrating && (
                    <BinTrack
                      lo={t.theta_bin[0]}
                      hi={t.theta_bin[1]}
                      values={scene.triangles.map((x) => x.theta)}
                      current={selected}
                      unit="°"
                    />
                  )}
                </dd>
              </div>
              <div className={styles.row}>
                <dt>Distance class</dt>
                <dd>
                  <span className={styles.mono}>
                    class {t.distance_class}: {range(t.distance_bin[0], t.distance_bin[1], 'maxDist', ' Å')}
                  </span>
                  {!hydrating && (
                    <BinTrack
                      lo={t.distance_bin[0]}
                      hi={t.distance_bin[1]}
                      values={scene.triangles.map((x) => x.max_distance)}
                      current={selected}
                      unit=" Å"
                    />
                  )}
                </dd>
              </div>
            </dl>
            <div className={styles.keybox}>
              <small>key</small>
              <div className={`${styles.key} ${styles.mono}`}>{data.key}</div>
              <small className={styles.mono}>
                .keys row: {data.keys_row.split('\t').slice(0, 2).join(' · ')} · frequency{' '}
                {data.frequency} ({intFormat.format(data.n_triangles)} triangles,{' '}
                {intFormat.format(data.n_unique_keys)} distinct keys in the chain)
              </small>
            </div>
          </div>

          <div className={`${styles.section} ${styles.note}`}>
            <p>
              θ is the angle between the base (the first two vertices in BioTSR’s order, highest
              label first) and the line from the base’s midpoint to the third vertex, folded into
              0–90°. In the picture the dashed line is that median and the bold edge is the longest
              edge.
            </p>
          </div>
        </div>
      </div>

      <section className={styles.comparison} aria-labelledby="all-four">
        <h2 id="all-four">The four triangles</h2>
        <p>
          All four have the vertex labels Val 20, Ile 10 and Leu 8, θ in class 11 and maxDist in
          class 5, so all four get key {data.key}, and the <code>.keys</code> file gives that key a
          frequency of {data.frequency}. Their positions in the chain and their exact angles and
          lengths differ.
        </p>
        <div className={styles.scroll} tabIndex={0} role="group" aria-label="The four triangles, scrolls sideways">
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Residues (BioTSR’s order)</th>
                <th scope="col" className={styles.num}>θ</th>
                <th scope="col">θ class</th>
                <th scope="col" className={styles.num}>maxDist</th>
                <th scope="col">Longest edge</th>
                <th scope="col">Distance class</th>
              </tr>
            </thead>
            <tbody>
              {scene.triangles.map((x, n) => (
                <tr key={n}>
                  <td>{n + 1}</td>
                  <td>{names(x).join(' · ')}</td>
                  <td className={styles.num}>{x.theta.toFixed(2)}°</td>
                  <td>{x.theta_class}</td>
                  <td className={styles.num}>{x.max_distance.toFixed(2)} Å</td>
                  <td>{longestEdge(x)}</td>
                  <td>{x.distance_class}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.note}>
          Values from the four rows of <code>1UBQ_A_protein.triplets</code> with this key and the{' '}
          <code>.keys</code> row that counts them, written by{' '}
          <code>biotsr run --method protein --pdb 1UBQ.pdb --chain A</code> with BioTSR{' '}
          {data.biotsr_version}. Coordinates: Cα atoms of PDB entry 1UBQ, the copy BioTSR 1.0.0 was
          tested with. Triangle 1 is the one followed in the worked example; the others follow in
          the order the file lists them.
        </p>
      </section>

      <section className={styles.next} aria-labelledby="lesson-next">
        <h2 id="lesson-next">Next</h2>
        <ul>
          <li>
            <Link to={LEARNING_PAGES.notebookPreview.path}>Your first 10 minutes with BioTSR</Link>:
            compute these four triangles yourself, in a notebook.
          </li>
          <li>
            <Link to="/tsr#worked-example">The worked example on Understand TSR</Link>: how labels,
            θ and maxDist become the key.
          </li>
          <li>
            <Link to="/software/learn">Learn BioTSR</Link>: this lesson and the notebook together.
          </li>
        </ul>
      </section>

      <p className="visually-hidden" aria-live="polite">
        {announcement}
      </p>
    </article>
  )
}
