import ScrollToTop from '../components/shared/ScrollToTop'
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
          <AppRoutes />
        </ErrorBoundary>
      </PageLayout>
    </>
  )
}
