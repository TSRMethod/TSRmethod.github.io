import styles from './DataTable.module.css'

/*
 * Wraps a Markdown table in a scroll container.
 *
 * Wide tables (parameter documentation, CSV layouts) must scroll inside their
 * own box. Letting them widen the page was one of the layout faults of the
 * previous site, which then hid the symptom with `overflow-x: hidden` on the
 * body.
 *
 * The container is `tabindex="0"` so it can be scrolled from the keyboard,
 * and labelled so that focusing it announces what it is.
 */
export default function DataTable({ children }) {
  return (
    <div
      className={styles.scroll}
      tabIndex={0}
      role="group"
      aria-label="Table, scrolls horizontally"
    >
      <table className={styles.table}>{children}</table>
    </div>
  )
}

/**
 * Header cells from Markdown are always column headers — the syntax has no
 * way to express a row header — so `scope="col"` is correct and lets a screen
 * reader announce the column name with each cell.
 */
export function TableHeaderCell({ children, ...props }) {
  return (
    <th scope="col" {...props}>
      {children}
    </th>
  )
}
