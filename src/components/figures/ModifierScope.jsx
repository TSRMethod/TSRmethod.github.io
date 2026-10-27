import capabilities from '../../../scripts/figures/data/biotsr-1.0.0-capabilities.json'
import styles from './ModifierScope.module.css'

/*
 * Which BioTSR methods take which option, and what each option does to keys.
 *
 * A table, not a picture: it is a lookup, and a table can be read cell by cell
 * by a screen reader, reflows with the text and needs no alt text. Every
 * tick is computed from the capability data build-biotsr-figures.mjs parsed
 * out of BioTSR 1.0.0's released CAPABILITY_MATRIX.md, the same file the
 * capability-matrix figure is drawn from, so the two cannot disagree. A family
 * whose methods do not all agree is shown as "some" rather than rounded.
 *
 * The "effect on keys" column is the released user guide's (§11) in brief.
 * The contact cutoff is a processing setting rather than a modifier in
 * BioTSR's own terms, and is listed because the cross pages need it.
 *
 * `highlight` marks the row the page is about, in bold and with "this page"
 * in words, so the emphasis does not depend on colour.
 */

const isProtein = (id) => id.startsWith('aa_') || id.startsWith('amino_acid')

const FAMILIES = [
  { id: 'calpha', label: 'Protein Cα', test: (m) => m.family === 'calpha' },
  { id: 'atomic-protein', label: 'Atomic: amino acids', test: (m) => m.family === 'atomic' && isProtein(m.id) },
  {
    id: 'atomic-other',
    label: 'Atomic: ligands, carbohydrates, nucleotides',
    test: (m) => m.family === 'atomic' && !isProtein(m.id),
  },
  { id: 'cross', label: 'Cross TSR', test: (m) => m.family === 'cross' },
]

const OPTIONS = [
  {
    id: 'aa-grouping',
    label: 'Amino acid grouping',
    flag: '--aa-grouping',
    accepts: (m) => m.aaGrouping,
    effect: 'Grouped residue labels: a different key space.',
  },
  {
    id: 'sse',
    label: 'Secondary structure (SSE-TSR)',
    flag: '--sse',
    accepts: (m) => m.sse,
    effect: 'Keys unchanged; each key’s count is split over 18 categories.',
  },
  {
    id: 'mirror',
    label: 'Mirror images',
    flag: '--mirror',
    accepts: (m) => m.mirror,
    effect: 'A key is negated when its angle before folding exceeds 90°: a different key space.',
  },
  {
    id: 'size-filter',
    label: 'Size filtering',
    flag: '--size-filter',
    accepts: (m) => m.sizeFilter,
    effect: 'Same keys; triangles whose longest edge is at or above the cutoff are left out.',
  },
  {
    id: 'contact-cutoff',
    label: 'Contact cutoff',
    flag: '--contact-cutoff',
    accepts: (m) => m.cross,
    effect: 'Chooses which atoms on each side take part; not a key change.',
  },
]

function coverage(option, family) {
  const methods = capabilities.methods.filter(family.test)
  const yes = methods.filter(option.accepts).length
  if (yes === 0) return { text: '—', label: 'not available' }
  if (yes === methods.length) return { text: '✓', label: 'all methods' }
  return { text: `${yes} of ${methods.length}`, label: `${yes} of ${methods.length} methods` }
}

const version = capabilities.source.match(/v([\d.]+)/)[1]

export default function ModifierScope({ highlight }) {
  const counts = FAMILIES.map((family) => capabilities.methods.filter(family.test).length)

  return (
    <figure className={styles.figure}>
      <div className={styles.scroll} tabIndex={0} role="region" aria-labelledby="modifier-scope-caption">
        <table className={styles.table}>
          <caption id="modifier-scope-caption" className={styles.caption}>
            Which BioTSR {version} methods take which option
          </caption>
          <thead>
            <tr>
              <th scope="col">Option</th>
              {FAMILIES.map((family, index) => (
                <th scope="col" key={family.id}>
                  {family.label}
                  <span className={styles.count}>
                    {counts[index]} {counts[index] === 1 ? 'method' : 'methods'}
                  </span>
                </th>
              ))}
              <th scope="col">Effect on keys</th>
            </tr>
          </thead>
          <tbody>
            {OPTIONS.map((option) => {
              const current = option.id === highlight
              return (
                <tr key={option.id} className={current ? styles.current : undefined}>
                  <th scope="row">
                    {option.label}
                    <code className={styles.flag}>{option.flag}</code>
                    {current && <span className={styles.here}>this page</span>}
                  </th>
                  {FAMILIES.map((family) => {
                    const cell = coverage(option, family)
                    return (
                      <td key={family.id} className={styles.mark}>
                        <span aria-hidden="true">{cell.text}</span>
                        <span className="visually-hidden">{cell.label}</span>
                      </td>
                    )
                  })}
                  <td className={styles.effect}>{option.effect}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <figcaption className={styles.note}>
        From the capability matrix released with BioTSR {version}. A method refuses an
        option it does not take, and options combine on one command.
      </figcaption>
    </figure>
  )
}
