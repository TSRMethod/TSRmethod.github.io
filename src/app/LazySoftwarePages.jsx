import { lazy, Suspense } from 'react'

/*
 * The software pages, loaded on demand for the same reason as the method
 * pages (see LazyMethodPage.jsx): their text is Markdown, and the Markdown
 * pipeline is the one large dependency worth keeping out of the first
 * download. Rendering the BioTSR page eagerly put it back into the initial
 * chunk — 450 kB raw became 639 kB — for every visitor, including the ones
 * who never open it. Lazily, the pages share the Markdown chunk with the
 * method pages, and the home page is the size it was.
 *
 * A link to a section of these pages (/software#research-code) still lands
 * on that section: ScrollToTop waits for the element to exist before
 * scrolling to it.
 */
const Software = lazy(() => import('../pages/Software/Software'))
const GetStarted = lazy(() => import('../pages/GetStarted/GetStarted'))
const Learn = lazy(() => import('../pages/Learn/Learn'))
const FourTriangles = lazy(() => import('../pages/Learn/FourTriangles'))
const FirstTenMinutes = lazy(() => import('../pages/Learn/FirstTenMinutes'))

export function LazySoftware() {
  return (
    <Suspense fallback={null}>
      <Software />
    </Suspense>
  )
}

export function LazyGetStarted() {
  return (
    <Suspense fallback={null}>
      <GetStarted />
    </Suspense>
  )
}

export function LazyLearn() {
  return (
    <Suspense fallback={null}>
      <Learn />
    </Suspense>
  )
}

export function LazyFourTriangles() {
  return (
    <Suspense fallback={null}>
      <FourTriangles />
    </Suspense>
  )
}

export function LazyFirstTenMinutes() {
  return (
    <Suspense fallback={null}>
      <FirstTenMinutes />
    </Suspense>
  )
}
