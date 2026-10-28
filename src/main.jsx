import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import './styles/tokens.css'
import './styles/reset.css'
import './styles/base.css'

import App from './app/App'
import ownAddress from './app/ownAddress'
import { PageMetadataCollector } from './lib/pageMetadata'

/* /people/, /people.html and /People go to /people first (see ownAddress.js). */
const target = ownAddress(window.location.pathname)

if (target) {
  window.location.replace(`${target}${window.location.search}${window.location.hash}`)
} else {
  const container = document.getElementById('root')
  const app = (
    <StrictMode>
      {/* The same tree as the build-time render, so the two hydrate cleanly. */}
      <PageMetadataCollector value={null}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </PageMetadataCollector>
    </StrictMode>
  )

  /*
   * Every published page arrives as HTML built for it (scripts/prerender.mjs),
   * and React takes that HTML over rather than drawing the page again. The
   * attribute records which page the HTML is for; anything else — the 404
   * page, or the development server — is drawn from scratch.
   */
  if (container.dataset.prerendered === window.location.pathname) {
    hydrateRoot(container, app)
  } else {
    createRoot(container).render(app)
  }
}
