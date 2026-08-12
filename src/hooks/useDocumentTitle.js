import { useEffect } from 'react'
import { siteConfig } from '../app/siteConfig'

/*
 * Sets `document.title` for the current page.
 *
 * Pass the page-specific part only — the site name is appended automatically.
 * Passing nothing (or the site name itself) yields the bare site title, which
 * is what the home page wants.
 *
 *   useDocumentTitle('Publications')  ->  "Publications | TSR Research Group"
 *   useDocumentTitle()                ->  "TSR Research Group"
 */
export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title =
      title && title !== siteConfig.title
        ? `${title} | ${siteConfig.title}`
        : siteConfig.title
  }, [title])
}
