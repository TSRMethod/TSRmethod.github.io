import ScrollToTop from '../components/shared/ScrollToTop'
import AnalyticsTracker from '../components/shared/AnalyticsTracker'
import PageTransition from '../components/shared/PageTransition'
import ErrorBoundary from '../components/shared/ErrorBoundary'
import PageLayout from '../components/layout/PageLayout'
import AppRoutes from './routes'

/*
 * Application shell.
 *
 * The router itself lives in `main.jsx` so that tests can mount <App /> inside
 * a MemoryRouter instead.
 */
export default function App() {
  return (
    <>
      <ScrollToTop />
      <PageLayout>
        <ErrorBoundary>
          <PageTransition>
            <AppRoutes />
          </PageTransition>
        </ErrorBoundary>
      </PageLayout>
      {/*
       * Last, so its effect runs after the page has set the document title —
       * see the component for why that ordering matters.
       */}
      <AnalyticsTracker />
    </>
  )
}
