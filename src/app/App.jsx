import ScrollToTop from '../components/shared/ScrollToTop'
import ErrorBoundary from '../components/shared/ErrorBoundary'
import AppRoutes from './routes'

/*
 * Application shell.
 *
 * The router itself lives in `main.jsx` so that tests can mount <App /> inside
 * a MemoryRouter instead.
 *
 * Stage 2 replaces the bare <main> below with the real layout — skip link,
 * Header, Navigation, Footer and PageLayout. Keeping it minimal here avoids
 * building layout twice.
 */
export default function App() {
  return (
    <>
      <ScrollToTop />
      {/* tabIndex allows ScrollToTop to move focus here after navigation. */}
      <main id="main" tabIndex={-1}>
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
      </main>
    </>
  )
}
