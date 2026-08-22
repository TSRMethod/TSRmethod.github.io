import CodeBlock from './CodeBlock'
import MarkdownContent from './MarkdownContent'
import Reveal from '../shared/Reveal'
import styles from './SlurmGuide.module.css'

/*
 * Presents the Slurm / HPC instructions for a package.
 *
 * Slurm sections recur across the TSR packages with the same shape — some
 * introductory prose, a job script, the command that queues it, and notes
 * about the resources requested — which is why this is a shared component
 * rather than repeated markup on every page.
 *
 * The division of responsibility matters and should be preserved:
 *
 *   This component owns   presentation, ordering, headings, and the
 *                         accessibility of the code areas.
 *
 *   Content owns          every value. The partition, node count, wall time,
 *                         allocation name, repository URL, entry point and
 *                         submission command all come from the `slurm` block
 *                         in the page's Markdown frontmatter.
 *
 * Nothing package-specific or cluster-specific may be hard-coded here. This
 * is intentionally not an HPC configuration system: it renders what the
 * content file says and nothing more.
 */
export default function SlurmGuide({ slurm, headingId = 'slurm-and-hpc' }) {
  if (!slurm) return null

  const { intro, script, submit, resources, notes } = slurm

  return (
    <Reveal as="section" className={styles.section} aria-labelledby={headingId}>
      <h2 id={headingId} className={styles.heading}>
        Running on an HPC cluster
      </h2>

      {intro && <MarkdownContent>{intro}</MarkdownContent>}

      <h3 className={styles.subheading}>Job script</h3>
      <CodeBlock
        code={script.code}
        language={script.language}
        filename={script.filename}
      />

      {resources && (
        <div className={styles.resources}>
          <MarkdownContent>{resources}</MarkdownContent>
        </div>
      )}

      <h3 className={styles.subheading}>Submit the job</h3>
      <CodeBlock code={submit.code} language={submit.language} />

      {notes && <MarkdownContent>{notes}</MarkdownContent>}
    </Reveal>
  )
}
