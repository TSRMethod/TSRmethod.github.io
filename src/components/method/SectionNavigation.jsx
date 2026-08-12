import { useEffect, useRef, useState } from 'react'
import useMediaQuery, { DESKTOP_QUERY } from '../../hooks/useMediaQuery'
import styles from './SectionNavigation.module.css'

/*
 * "On this page" navigation for a method page.
 *
 * Two presentations, one data source:
 *
 *   Desktop (>= 1024px) — a sticky sidebar beside the content.
 *   Mobile              — a collapsed <details> above the content.
 *
 * The mobile form is deliberately NOT the previous site's approach. That one
 * kept a 20%-wide side rail on small screens and also fixed a bar to the
 * bottom of the viewport (named `.mobile-top-nav`, despite being at the
 * bottom) which sat on top of the content. Here it takes one line when
 * closed, covers nothing, and pushes nothing sideways.
 */

/** Tracks which section heading is currently at the top of the viewport. */
function useActiveSection(ids) {
  const [activeId, setActiveId] = useState(null)
  const key = ids.join('|')

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return

    const elements = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean)

    if (elements.length === 0) return

    const visible = new Set()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id)
          else visible.delete(entry.target.id)
        }
        // Highlight the topmost heading currently inside the band, so the
        // marker moves down as the reader scrolls rather than jumping about.
        const first = ids.find((id) => visible.has(id))
        if (first) setActiveId(first)
      },
      {
        /* A band just below the sticky header: a heading is "current" from
           when it reaches the header until it leaves the upper third. */
        rootMargin: '-80px 0px -66% 0px',
        threshold: 0,
      },
    )

    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
    // `key` keeps this stable when the caller passes a fresh array each render.
  }, [key, ids])

  return activeId
}

function SectionList({ sections, activeId, onNavigate }) {
  return (
    <ul className={styles.list}>
      {sections.map((section) => (
        <li key={section.id} data-depth={section.depth}>
          <a
            href={`#${section.id}`}
            className={styles.link}
            onClick={onNavigate}
            aria-current={section.id === activeId ? 'true' : undefined}
          >
            {section.text}
          </a>
        </li>
      ))}
    </ul>
  )
}

export default function SectionNavigation({ sections }) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const detailsRef = useRef(null)
  const activeId = useActiveSection(sections.map((section) => section.id))

  if (sections.length === 0) return null

  if (isDesktop) {
    return (
      <nav className={styles.sidebar} aria-label="On this page">
        <p className={styles.heading}>On this page</p>
        <SectionList sections={sections} activeId={activeId} />
      </nav>
    )
  }

  return (
    <details className={styles.details} ref={detailsRef}>
      <summary className={styles.summary}>On this page</summary>
      <nav aria-label="On this page">
        <SectionList
          sections={sections}
          activeId={activeId}
          /* Collapse after jumping, so the reader lands on the section
             rather than on a list still covering it. */
          onNavigate={() => {
            if (detailsRef.current) detailsRef.current.open = false
          }}
        />
      </nav>
    </details>
  )
}
