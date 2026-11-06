import { describe, it, expect } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
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

  it('links the file for download and shows credits apart from the software licence', () => {
    render(<LearnVideo video={VIDEO} number={1} />)
    expect(screen.getByRole('link', { name: 'Download the video (MP4, 18 MB)' })).toHaveAttribute('href', VIDEO.src)
    expect(screen.getByText(/Music: example credit/)).toBeInTheDocument()
    expect(document.body).not.toHaveTextContent(/Apache/)
  })
})
