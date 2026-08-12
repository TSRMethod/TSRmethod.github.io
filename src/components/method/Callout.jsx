import styles from './Callout.module.css'

/*
 * A highlighted aside.
 *
 * Markdown blockquotes render as `tone="note"`. The `review` tone is used for
 * the banner on a page whose content is still awaiting author review, so a
 * reader is never left to assume unverified material has been checked.
 */
export default function Callout({ tone = 'note', title, children }) {
  const isReview = tone === 'review'

  return (
    <aside
      className={styles.callout}
      data-tone={tone}
      /* A review notice is an advisory about the surrounding content, so it
         is announced when reached rather than interrupting. */
      role={isReview ? 'note' : undefined}
    >
      {title && <p className={styles.title}>{title}</p>}
      <div className={styles.body}>{children}</div>
    </aside>
  )
}
