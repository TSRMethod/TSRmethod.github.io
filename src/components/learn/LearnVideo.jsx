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
 *   - Two kinds of caption. The words and numbers drawn into the picture
 *     stay as they are. The narration has a WebVTT caption track, shown by
 *     default as text in its own area UNDER the picture rather than over it:
 *     a cue drawn inside the frame covered the burned-in text or the corner
 *     labels in every placement tried. The "CC Captions" toggle in the bar
 *     beneath the player turns that text on and off (aria-pressed); its area
 *     is as tall as the longest line at the current width whether captions
 *     are on or off, so nothing below it moves.
 *   - In full screen (and the iPhone's own player) the area under the picture
 *     is out of sight, so while captions are on the browser draws them on the
 *     video there instead, and stops when the video leaves full screen. If the
 *     visitor turns on the browser's own captions in the page, the area says
 *     so rather than repeating them: the narration is never captioned twice.
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

const OFF = 'Narration captions are off.'
const IN_PLAYER = 'Narration captions are shown on the video.'

const isFullscreen = (element) =>
  document.fullscreenElement === element || document.webkitFullscreenElement === element

export default function LearnVideo({ video, number }) {
  const player = useRef(null)
  const [captions, setCaptions] = useState(true)
  const [cue, setCue] = useState('')
  const [inPlayer, setInPlayer] = useState(false)

  /*
   * The caption track's mode follows the toggle: "hidden" while captions are
   * on (the browser loads the cues without drawing them, and the cue playing
   * now is copied under the picture), "showing" while they are on in full
   * screen, "disabled" while they are off. A visitor who turns on the
   * browser's own captions turns the toggle on with them; the area under the
   * picture then stays empty. No track support: no captions line, and the
   * transcript is still there.
   */
  useEffect(() => {
    const element = player.current
    const track = element?.textTracks?.[0]
    if (!track) return undefined
    let shownForFullscreen = false

    const update = () => {
      if (track.mode === 'showing' && !captions) {
        setCaptions(true)
        return
      }
      if (track.mode === 'disabled' && captions) track.mode = 'hidden'
      setInPlayer(track.mode === 'showing')
      setCue(track.mode === 'hidden' ? [...(track.activeCues ?? [])].map((c) => c.text).join(' ') : '')
    }
    const fullscreen = (entering) => {
      if (entering && captions && track.mode === 'hidden') {
        track.mode = 'showing'
        shownForFullscreen = true
      } else if (!entering && shownForFullscreen) {
        if (track.mode === 'showing') track.mode = 'hidden'
        shownForFullscreen = false
      }
    }
    const onFullscreenChange = () => fullscreen(isFullscreen(element))
    const onBegin = () => fullscreen(true)
    const onEnd = () => fullscreen(false)

    if (!captions) track.mode = 'disabled'
    else if (track.mode === 'disabled') track.mode = 'hidden'
    if (captions && isFullscreen(element)) fullscreen(true)
    update()
    track.addEventListener('cuechange', update)
    element.textTracks.addEventListener?.('change', update)
    // A cue already active when the track comes back on is not always
    // announced by cuechange; these catch it on the next seek or tick.
    element.addEventListener('seeked', update)
    element.addEventListener('timeupdate', update)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    document.addEventListener('webkitfullscreenchange', onFullscreenChange)
    element.addEventListener('webkitbeginfullscreen', onBegin)
    element.addEventListener('webkitendfullscreen', onEnd)
    return () => {
      if (shownForFullscreen && track.mode === 'showing') track.mode = 'hidden'
      track.removeEventListener('cuechange', update)
      element.textTracks.removeEventListener?.('change', update)
      element.removeEventListener('seeked', update)
      element.removeEventListener('timeupdate', update)
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange)
      element.removeEventListener('webkitbeginfullscreen', onBegin)
      element.removeEventListener('webkitendfullscreen', onEnd)
    }
  }, [captions])

  const line = !captions ? OFF : inPlayer ? IN_PLAYER : cue
  const quiet = !captions || inPlayer

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

      <div className={styles.player}>
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

        <div className={styles.toolbar}>
          <button
            type="button"
            className={styles.ccToggle}
            aria-pressed={captions}
            onClick={() => setCaptions((on) => !on)}
          >
            <span className={styles.ccBadge}>CC</span> Captions
            <span className={styles.ccState} aria-hidden="true">
              {captions ? 'On' : 'Off'}
            </span>
          </button>
        </div>
      </div>

      {/* Every line the area can hold is laid in the same grid cell, unseen,
          so the area is as tall as the longest at this width. The narration
          itself reaches screen readers as sound, and as the transcript. */}
      <div className={styles.captionArea} aria-hidden="true">
        {[OFF, IN_PLAYER, ...video.transcript.map((t) => t.speech).filter(Boolean)].map((text) => (
          <span key={text} className={styles.captionSizer}>
            {text}
          </span>
        ))}
        <p className={quiet ? `${styles.captionLine} ${styles.captionNote}` : styles.captionLine}>{line}</p>
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
