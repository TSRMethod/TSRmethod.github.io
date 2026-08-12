import { Component } from 'react'
import { siteConfig } from '../../app/siteConfig'
import styles from './ErrorBoundary.module.css'

/*
 * Catches render-time errors so one broken page cannot blank the whole site.
 *
 * This is the only class component in the codebase. React still has no hook
 * equivalent of `componentDidCatch`, so an error boundary must be a class —
 * this is a framework constraint, not a style choice.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // Surface the real error in the console rather than swallowing it.
    console.error('Unhandled error while rendering:', error, info)
  }

  render() {
    const { error } = this.state

    if (!error) return this.props.children

    return (
      <div className={styles.wrapper} role="alert">
        <h1 className={styles.heading}>Something went wrong</h1>
        <p>
          This page failed to load. Reloading may fix it. If the problem keeps
          happening, please{' '}
          <a href={siteConfig.github.issuesUrl}>report it on GitHub</a>.
        </p>
        <p className={styles.detail}>{error.message}</p>
      </div>
    )
  }
}

export default ErrorBoundary
