import { EVENTS, trackEvent } from '../../lib/analytics'

/* One analytics event for every outbound link to a repository, its release
   or its documentation, whichever page it is on. */
export default function trackRepositoryLink(repositoryId, linkType) {
  trackEvent(EVENTS.repositoryLink, {
    repository_id: repositoryId,
    link_type: linkType,
  })
}
