import TsrOverview, { TsrWorkedExample } from './TsrOverview'
import ModifierScope from './ModifierScope'
import CrossTriangles from './CrossTriangles'
import PointChoice from './PointChoice'
import ClusteringExample from './ClusteringExample'

/*
 * The figures the site draws itself, by id.
 *
 * A page places one with Markdown image syntax and a `diagram:` address, on a
 * line of its own, where it belongs in the text:
 *
 *     ![](diagram:modifier-scope?highlight=mirror)
 *
 * Anything after `?` is passed to the component as props. The content
 * registry checks every id a page uses against DIAGRAM_IDS in
 * src/content/index.js, so a typo fails the build instead of rendering
 * nothing, and a test checks the two lists agree.
 */
export const DIAGRAMS = {
  'tsr-overview': TsrOverview,
  'tsr-worked-example': TsrWorkedExample,
  'modifier-scope': ModifierScope,
  'cross-triangles': CrossTriangles,
  'point-choice': PointChoice,
  'clustering-example': ClusteringExample,
}

