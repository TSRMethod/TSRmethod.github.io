import { useEffect, useRef, useState } from 'react'
import styles from './LearnVideo.module.css'

/*
 * The Watch section of Learn BioTSR: a self-hosted video with everything a
 * visitor needs to use it without sound, without sight of the picture, or
 * without playing it at all.
 *
 *   - preload="none" and a poster: nothing but the poster is downloaded until
 *     the visitor presses play. The box keeps the video's aspect ratio, so the
 *     page does not move when it loads.
 *   - Native controls, no autoplay, playsInline (no forced full screen on a
 *     phone).
 *   - A WebVTT caption track for the narration, shown as a line of text
 *     UNDER the picture rather than over it: the video already has captions
 *     burned in along its bottom and labels in its top corners, and a cue
 *     drawn inside the frame covered one or the other in every placement
 *     tried (Chrome also cut two-line cues at the top to one line). The
 *     browser's own captions button still works, as usual, for full screen;
 *     while it is on, the line under the picture steps aside.
 *   - A chapters track. Not every browser shows chapters in its controls, so
 *     the chapters are also buttons under the video that move the playhead.
 *   - A transcript, as text on the page: what is said, and in brackets the
 *     numbers and labels that are only on screen.
 *
 * `video` is VIDEO from src/content/learnResources.js, its words included:
 * they belong to one render of the video and change only with it.
 */

const timeFormat = (seconds) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`

const durationLabel = (seconds) => {
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return m ? `${m} min ${s} s` : `${s} s`
}

export default function LearnVideo({ video, number }) {
  const player = useRef(null)
  const [captions, setCaptions] = useState(true)
  const [cue, setCue] = useState('')

  /*
   * The narration cue playing now, read from the caption track. The track is
   * kept in "hidden" mode, so the browser loads its cues without drawing
   * them; while the visitor has the browser's own captions on ("showing"),
   * the line under the picture is empty. No track support: no line.
   */
  useEffect(() => {
    const element = player.current
    const track = element?.textTracks?.[0]
    if (!track) return undefined
    if (captions && track.mode === 'disabled') track.mode = 'hidden'
    const update = () =>
      setCue(track.mode === 'hidden' ? [...(track.activeCues ?? [])].map((c) => c.text).join(' ') : '')
    update()
    track.addEventListener('cuechange', update)
    element.textTracks.addEventListener?.('change', update)
    return () => {
      track.removeEventListener('cuechange', update)
      element.textTracks.removeEventListener?.('change', update)
    }
  }, [captions])

  const line = captions ? cue : ''

  const seek = (time) => {
    const element = player.current
    if (!element) return
    element.currentTime = time
    element.focus()
  }

  return (
    <section className={styles.watch} aria-labelledby="watch">
      <p className={styles.step}>{number}</p>
      <h2 id="watch" className={styles.heading}>
        {video.heading}
      </h2>
      <p className={styles.meta}>
        {durationLabel(video.durationSeconds)} · captions · transcript
      </p>
      <p className={styles.intro}>{video.intro}</p>

      <div
        className={styles.frame}
        style={{ aspectRatio: `${video.width} / ${video.height}` }}
      >
        <video
          ref={player}
          className={styles.video}
          controls
          preload="none"
          playsInline
          poster={video.poster}
          width={video.width}
          height={video.height}
          aria-describedby="video-transcript"
        >
          <source src={video.src} type="video/mp4" />
          <track kind="captions" src={video.captions} srcLang="en" label="English" />
          <track kind="chapters" src={video.chapters} srcLang="en" label="Chapters" />
        </video>
      </div>

      <div className={styles.captionBar}>
        <p className={styles.captionLine} aria-hidden="true">
          {line}
        </p>
        <button
          type="button"
          className={styles.captionToggle}
          aria-pressed={captions}
          onClick={() => setCaptions((on) => !on)}
        >
          Captions under the video
        </button>
      </div>

      <nav className={styles.chapters} aria-label="Chapters of the video">
        <ol>
          {video.chapterList.map((chapter) => (
            <li key={chapter.time}>
              <button type="button" onClick={() => seek(chapter.time)}>
                <span className={styles.time}>{timeFormat(chapter.time)}</span> {chapter.title}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <details className={styles.transcript} id="video-transcript">
        <summary>Read the transcript</summary>
        <ol>
          {video.transcript.map((line) => (
            <li key={line.time}>
              <span className={styles.time}>{timeFormat(line.time)}</span>{' '}
              {line.speech && <span>{line.speech}</span>}
              {line.screen && <span className={styles.screen}> [{line.screen}]</span>}
            </li>
          ))}
        </ol>
      </details>

      <p className={styles.files}>
        <a href={video.src} download>
          Download the video (MP4, {Math.round(video.bytes / 1e6)} MB)
        </a>
        {video.credits && <span className={styles.credits}> · {video.credits}</span>}
      </p>
    </section>
  )
}
