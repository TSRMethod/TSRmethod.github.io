import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, within, fireEvent, act } from '@testing-library/react'
import LearnVideo from './LearnVideo'

/* A made-up video: the component is not used by the site until the corrected
   render exists, so it is held to its contract here. */
const VIDEO = {
  heading: 'Watch: How BioTSR works',
  intro: 'An introduction.',
  credits: 'Music: example credit',
  src: '/learn-files/example.mp4',
  poster: '/learn-files/example-poster.jpg',
  captions: '/learn-files/example.en.vtt',
  chapters: '/learn-files/example.chapters.vtt',
  bytes: 18_325_178,
  durationSeconds: 85,
  width: 1920,
  height: 1080,
  chapterList: [
    { time: 0, title: 'One triangle' },
    { time: 35.4, title: 'The whole chain' },
  ],
  transcript: [
    { time: 0.4, speech: 'How BioTSR works.', screen: 'Title' },
    { time: 54.8, speech: 'The Cα cross method keeps only residues at the interface.', screen: 'contact cutoff 8 Å' },
  ],
}

describe('LearnVideo', () => {
  it('downloads nothing but the poster until the visitor presses play, and never plays by itself', () => {
    render(<LearnVideo video={VIDEO} number={1} />)
    const video = document.querySelector('video')
    expect(video).toHaveAttribute('controls')
    expect(video).toHaveAttribute('preload', 'none')
    expect(video).toHaveAttribute('poster', VIDEO.poster)
    expect(video).not.toHaveAttribute('autoplay')
    expect(video.playsInline).toBe(true)
    expect(video.closest('div').style.aspectRatio).toBe('1920 / 1080')
  })

  it('carries a caption track for the narration and a chapters track', () => {
    render(<LearnVideo video={VIDEO} number={1} />)
    const tracks = [...document.querySelectorAll('track')].map((t) => [t.kind, t.getAttribute('src'), t.srclang])
    expect(tracks).toEqual([
      ['captions', VIDEO.captions, 'en'],
      ['chapters', VIDEO.chapters, 'en'],
    ])
  })

  it('offers the chapters as buttons that move the playhead', () => {
    render(<LearnVideo video={VIDEO} number={1} />)
    const chapters = within(screen.getByRole('navigation', { name: 'Chapters of the video' }))
    fireEvent.click(chapters.getByRole('button', { name: '0:35 The whole chain' }))
    expect(document.querySelector('video').currentTime).toBe(35.4)
  })

  it('has a transcript in the page, with what is only on screen in brackets', () => {
    render(<LearnVideo video={VIDEO} number={1} />)
    const transcript = document.getElementById('video-transcript')
    expect(transcript.tagName).toBe('DETAILS')
    expect(transcript).toHaveTextContent('0:54 The Cα cross method keeps only residues at the interface. [contact cutoff 8 Å]')
    expect(document.querySelector('video')).toHaveAttribute('aria-describedby', 'video-transcript')
  })

  it('links the file for download, with the credits on their own line beneath it', () => {
    render(<LearnVideo video={VIDEO} number={1} />)
    const link = screen.getByRole('link', { name: 'Download the video (MP4, 18 MB)' })
    expect(link).toHaveAttribute('href', VIDEO.src)
    const credit = screen.getByText('Music: example credit')
    expect(credit.tagName).toBe('P')
    expect(link.closest('p').nextElementSibling).toBe(credit)
    expect(link.closest('p')).not.toHaveTextContent('Music')
    expect(document.body).not.toHaveTextContent(/Apache/)
  })

  it('has a CC Captions toggle in a bar right under the player, on by default', () => {
    render(<LearnVideo video={VIDEO} number={1} />)
    const toggle = screen.getByRole('button', { name: 'CC Captions' })
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(toggle).toHaveTextContent('On')
    const frame = document.querySelector('video').parentElement
    expect(frame.nextElementSibling).toContainElement(toggle)
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    expect(toggle).toHaveTextContent('Off')
    expect(screen.getByRole('button', { name: 'CC Captions' })).toBe(toggle)
  })

  it('keeps the caption area the same size, on or off: every line it can hold is laid in it unseen', () => {
    render(<LearnVideo video={VIDEO} number={1} />)
    const area = document.querySelector('video').closest('div').parentElement.nextElementSibling
    expect(area).toHaveAttribute('aria-hidden', 'true')
    const sizers = () => [...area.querySelectorAll('span')].map((s) => s.textContent)
    const before = sizers()
    expect(before).toEqual(expect.arrayContaining(VIDEO.transcript.map((t) => t.speech)))
    fireEvent.click(screen.getByRole('button', { name: 'CC Captions' }))
    expect(sizers()).toEqual(before)
    expect(area.nextElementSibling).toBe(screen.getByRole('navigation', { name: 'Chapters of the video' }))
  })
})

/*
 * The browser's caption track, which jsdom lacks: a track whose mode change
 * is announced on its list, as a browser does.
 */
describe('LearnVideo with a caption track', () => {
  let track
  const original = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'textTracks')

  const install = () => {
    const list = new EventTarget()
    track = new EventTarget()
    let mode = 'disabled'
    Object.defineProperty(track, 'mode', {
      get: () => mode,
      set: (value) => {
        mode = value
        list.dispatchEvent(new Event('change'))
      },
    })
    track.activeCues = []
    list[0] = track
    list.length = 1
    Object.defineProperty(HTMLMediaElement.prototype, 'textTracks', { configurable: true, get: () => list })
  }

  afterEach(() => {
    if (original) Object.defineProperty(HTMLMediaElement.prototype, 'textTracks', original)
    else delete HTMLMediaElement.prototype.textTracks
    delete document.fullscreenElement
  })

  const line = () => document.querySelector('video').closest('div').parentElement.nextElementSibling.querySelector('p')

  it('copies the cue playing now under the picture, with the track hidden in the video', () => {
    install()
    render(<LearnVideo video={VIDEO} number={1} />)
    expect(track.mode).toBe('hidden')
    act(() => {
      track.activeCues = [{ text: 'How BioTSR works.' }]
      track.dispatchEvent(new Event('cuechange'))
    })
    expect(line()).toHaveTextContent('How BioTSR works.')
  })

  it('picks up a cue the track did not announce on the next seek or tick', () => {
    install()
    render(<LearnVideo video={VIDEO} number={1} />)
    track.activeCues = [{ text: 'How BioTSR works.' }]
    act(() => document.querySelector('video').dispatchEvent(new Event('timeupdate')))
    expect(line()).toHaveTextContent('How BioTSR works.')
  })

  it('turns the track off with the toggle, and says so in the area', () => {
    install()
    render(<LearnVideo video={VIDEO} number={1} />)
    fireEvent.click(screen.getByRole('button', { name: 'CC Captions' }))
    expect(track.mode).toBe('disabled')
    expect(line()).toHaveTextContent('Narration captions are off.')
  })

  const fullscreen = (element) =>
    act(() => {
      Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: element })
      document.dispatchEvent(new Event('fullscreenchange'))
    })

  it('draws nothing on the video in full screen, and resumes under the picture on leaving', () => {
    install()
    render(<LearnVideo video={VIDEO} number={1} />)
    const video = document.querySelector('video')
    fullscreen(video)
    expect(track.mode).toBe('hidden')
    fullscreen(null)
    expect(track.mode).toBe('hidden')
    act(() => {
      track.activeCues = [{ text: 'How BioTSR works.' }]
      track.dispatchEvent(new Event('cuechange'))
    })
    expect(line()).toHaveTextContent('How BioTSR works.')
    expect(screen.getByRole('button', { name: 'CC Captions' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('takes the browser’s own captions off the video in full screen, and gives them back after', () => {
    install()
    render(<LearnVideo video={VIDEO} number={1} />)
    act(() => {
      track.mode = 'showing'
    })
    fullscreen(document.querySelector('video'))
    expect(track.mode).toBe('hidden')
    fullscreen(null)
    expect(track.mode).toBe('showing')
    expect(line()).toHaveTextContent('Narration captions are shown on the video.')
  })

  it('does the same in the iPhone’s own player', () => {
    install()
    render(<LearnVideo video={VIDEO} number={1} />)
    const video = document.querySelector('video')
    act(() => {
      track.mode = 'showing'
    })
    act(() => video.dispatchEvent(new Event('webkitbeginfullscreen')))
    expect(track.mode).toBe('hidden')
    act(() => video.dispatchEvent(new Event('webkitendfullscreen')))
    expect(track.mode).toBe('showing')
  })

  it('leaves captions off through full screen when they are off, and off after', () => {
    install()
    render(<LearnVideo video={VIDEO} number={1} />)
    const toggle = screen.getByRole('button', { name: 'CC Captions' })
    fireEvent.click(toggle)
    act(() => document.querySelector('video').dispatchEvent(new Event('webkitbeginfullscreen')))
    expect(track.mode).toBe('disabled')
    act(() => document.querySelector('video').dispatchEvent(new Event('webkitendfullscreen')))
    expect(track.mode).toBe('disabled')
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    expect(line()).toHaveTextContent('Narration captions are off.')
  })

  it('does not let a choice made in the full-screen player outlast it', () => {
    install()
    render(<LearnVideo video={VIDEO} number={1} />)
    fireEvent.click(screen.getByRole('button', { name: 'CC Captions' }))
    fullscreen(document.querySelector('video'))
    act(() => {
      track.mode = 'showing'
    })
    expect(screen.getByRole('button', { name: 'CC Captions' })).toHaveAttribute('aria-pressed', 'false')
    fullscreen(null)
    expect(track.mode).toBe('disabled')
  })

  it('never captions the narration twice: the browser’s own captions empty the area and turn the toggle on', () => {
    install()
    render(<LearnVideo video={VIDEO} number={1} />)
    const toggle = screen.getByRole('button', { name: 'CC Captions' })
    fireEvent.click(toggle)
    act(() => {
      track.mode = 'showing'
    })
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(line()).toHaveTextContent('Narration captions are shown on the video.')
    act(() => {
      track.activeCues = [{ text: 'How BioTSR works.' }]
      track.dispatchEvent(new Event('cuechange'))
    })
    expect(line()).not.toHaveTextContent('How BioTSR works.')
  })
})
