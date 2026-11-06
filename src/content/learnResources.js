/*
 * Where the Learn BioTSR resources live, and the facts about them that are
 * not prose: addresses, file sizes, dates. The Learn page's words are in
 * pages.json under "learn".
 *
 * The lesson and the notebook's recorded run are ordinary routes of the app,
 * under BioTSR → Learn BioTSR. Files a visitor downloads or plays live under
 * public/learn-files/, a folder no page address shares, and are not in the
 * sitemap (see docs/DEPLOYMENT.md, "Learning resources"). src/learn.test.js
 * checks that every file named here exists, at the size written here.
 */

/** The two pages the Learn BioTSR page introduces. Both are routes in the app. */
export const LEARNING_PAGES = {
  lesson: { path: '/software/four-triangles-one-key' },
  notebookPreview: { path: '/software/first-10-minutes' },
}

export const NOTEBOOK = {
  href: '/learn-files/biotsr-first-10-minutes.ipynb',
  file: 'learn-files/biotsr-first-10-minutes.ipynb',
  /** The name a visitor's browser saves it under. */
  downloadName: 'biotsr-first-10-minutes.ipynb',
  bytes: 38090,
  /** When the stored outputs were recorded, from a clean environment. */
  recordedOn: '2026-11-05',
}

/*
 * The video, How BioTSR works: the corrected render approved on
 * 6 November 2026. Its words (transcript, chapters) belong to this render and
 * change only with it; the caption and chapter tracks beside it in
 * public/learn-files/ hold the same cues. The music's credit stays in
 * `credits`, apart from the software licence. Shape:
 *
 *   {
 *     heading, intro, credits,           words that belong to this render
 *     src, poster, captions, chapters,   paths under /learn-files/
 *     bytes, durationSeconds, width, height,
 *     transcript: [{ time, speech, screen }],
 *     chapterList: [{ time, title }],
 *   }
 */
export const VIDEO = {
  "heading": "Watch: How BioTSR works",
  "intro": "An 85-second introduction: how three Cα atoms become one integer key, why different triangles can share a key, and how BioTSR compares structures through the keys they share.",
  "credits": "Music: “Nebula” by The Grey Room / Density & Time, from the YouTube Audio Library, used under its licence; not covered by BioTSR’s Apache-2.0 software licence.",
  "src": "/learn-files/how-biotsr-works.mp4",
  "poster": "/learn-files/how-biotsr-works-poster.jpg",
  "captions": "/learn-files/how-biotsr-works.en.vtt",
  "chapters": "/learn-files/how-biotsr-works.chapters.vtt",
  "bytes": 21449069,
  "durationSeconds": 85,
  "width": 1920,
  "height": 1080,
  "chapterList": [
    {
      "time": 0,
      "title": "One triangle"
    },
    {
      "time": 15.4,
      "title": "Triangle to key"
    },
    {
      "time": 35.4,
      "title": "The whole chain"
    },
    {
      "time": 50.5,
      "title": "Across an interface"
    },
    {
      "time": 65.5,
      "title": "Comparing samples"
    }
  ],
  "transcript": [
    {
      "time": 0.4,
      "speech": "How BioTSR works.",
      "screen": "How BioTSR Works. From a protein structure to structural keys. BioTSR 1.0.0 · TSR Research Group"
    },
    {
      "time": 4.13,
      "speech": "Ubiquitin: one carbon alpha atom per residue.",
      "screen": "Ubiquitin (PDB 1UBQ), chain A: 76 residues, one Cα atom each; real coordinates from PDB entry 1UBQ"
    },
    {
      "time": 7.8,
      "speech": "Pick three from its hydrophobic patch.",
      "screen": "Three Cα atoms of the Ile44 patch: Leu 8, Ile 44, Val 70"
    },
    {
      "time": 11.1,
      "speech": "Three points, one triangle, one number.",
      "screen": "Three points make a triangle; TSR encodes it as one integer, its key"
    },
    {
      "time": 15.4,
      "speech": "Each residue type has a fixed code.",
      "screen": "Each residue type has a code: Val 20, Ile 10, Leu 8"
    },
    {
      "time": 19.5,
      "speech": "Its shape gives two bins: angle and distance.",
      "screen": "Shape: one angle and the longest edge, each sorted into a numbered bin"
    },
    {
      "time": 23.6,
      "speech": "Codes and bins make one key.",
      "screen": "Codes and bins combine into one integer: key 17,637,781"
    },
    {
      "time": 27.5,
      "speech": "The key records only residue types and shape bins, so different triangles can share it.",
      "screen": "Four different triangles in ubiquitin share this key: Val 70 · Ile 44 · Leu 8, Val 5 · Ile 61 · Leu 56, Val 17 · Ile 61 · Leu 15 and Val 70 · Ile 36 · Leu 71; .keys frequency 4"
    },
    {
      "time": 35.4,
      "speech": "Any three carbon alpha atoms form a triangle: 70,300 in all.",
      "screen": "Every set of three Cα atoms is a triangle: 76 atoms give 70,300 triangles"
    },
    {
      "time": 42.8,
      "speech": "Together, they produce 45,349 distinct keys.",
      "screen": "Those 70,300 triangles produce 45,349 distinct keys"
    },
    {
      "time": 50.5,
      "speech": "Next, barnase, bound to its inhibitor, barstar.",
      "screen": "PDB 1BRS: barnase (chain A) bound to its inhibitor barstar (chain D)"
    },
    {
      "time": 54.4,
      "speech": "The carbon alpha cross method keeps only residues at the interface.",
      "screen": "Interface residues have a heavy atom within 8 Å of the other chain (contact cutoff set to 8 Å): 39 in barnase, 35 in barstar"
    },
    {
      "time": 59.0,
      "speech": "Every cross triangle spans both proteins, like this one.",
      "screen": "A cross triangle spans both chains: barnase Arg 59 and His 102, barstar Asp 39; key 19,587,605, one of 49,140 Cα cross triangles, contact cutoff 8 Å"
    },
    {
      "time": 65.5,
      "speech": "Now compare three samples, each with its own keys.",
      "screen": "Three samples: ubiquitin, barnase and barstar, one key set each"
    },
    {
      "time": 70.4,
      "speech": "9,523 distinct keys occur in all three samples.",
      "screen": "9,523 distinct keys occur in all three samples."
    },
    {
      "time": 78.4,
      "speech": "BioTSR is open source, from the TSR Research Group.",
      "screen": "BioTSR · github.com/TSRMethod/BioTSR · TSR Research Group · tsrmethod.github.io · BioTSR 1.0.0 · Apache License 2.0 (the software licence)"
    }
  ]
}
