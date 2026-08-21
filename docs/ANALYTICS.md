# Analytics

Maintainer documentation. Nothing in this file concerns content editors — the
CMS has no analytics settings, by design.

## Why GA4

The site needs two things: which pages people read, and which research
resources they actually open. Page counts alone would not tell us whether the
publications page leads anyone to a paper, or whether the software page leads
anyone to a repository or a tutorial, and those are the questions the group
has.

The site is served by GitHub Pages, so anything requiring a server of our own
is out: there is no request log to read, no edge middleware and no place to
run a collector. GA4 needs no backend, records both page views and named
custom events, and is free at this volume. Vercel Analytics and Vercel Speed
Insights were the previous host's tooling and do not work here at all.

## Configuration

One build-time variable:

    VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

**Analytics is off unless it is set.** With no value — every clone, every
`npm run dev`, every test run, every fork — no Google script is fetched, no
`dataLayer` is created, and each helper in `src/lib/analytics.js` returns
`false`. There is no runtime toggle and no cookie banner logic to get wrong.

**The ID is not a secret.** A GA4 measurement ID is visible in the page source
of every site that uses one. It is kept out of the repository so that a fork
does not report into our property — not because it needs protecting. Do not
put it in a GitHub Actions *secret*; use a repository *variable*.

### Setting it up (one-off, in GitHub)

1. In GA4, create a Web data stream for `https://tsrmethod.github.io/` and copy
   its **Measurement ID** (`G-` followed by ten characters).
2. In the repository, go to **Settings → Secrets and variables → Actions → the
   Variables tab → New repository variable**.
3. Name it `VITE_GA_MEASUREMENT_ID`, paste the ID, and save.
4. Re-run the **Deploy to GitHub Pages** workflow, or push any commit to
   `main`. The variable is read at build time, so a deployment is required for
   it to take effect.

The deploy workflow already passes it to the build:

    - name: Build
      run: npm run build
      env:
        VITE_GA_MEASUREMENT_ID: ${{ vars.VITE_GA_MEASUREMENT_ID }}

Nothing else needs changing. Before the variable exists the build succeeds and
produces a site with no analytics in it.

### Running with analytics locally

Copy `.env.example` to `.env.local` and put a **test property's** ID in it.
`.env.local` is git-ignored. Never point a local build at the production
property: your own reloads become production traffic.

## How page views are recorded

This is a React Router single-page application: the URL changes without a
document load, so GA4's automatic measurement would record the first landing
and nothing after it.

The site therefore sends page views itself, and switches gtag's own off:

- `initializeAnalytics()` configures GA4 with `send_page_view: false`;
- `AnalyticsTracker` (mounted once, in `App`) sends a `page_view` on every
  React Router location change, including the first.

**Only one of the two mechanisms is ever active**, which is what stops every
landing being counted twice. If you ever enable "Enhanced measurement → page
changes based on browser history events" in the GA4 stream settings, you will
have both, and every view will be doubled — leave it off.

Two further guards, both in `src/lib/analytics.js`:

- initialisation happens once per document, however many times it is called;
- a repeat view of the path already recorded is ignored, so React's
  development double-render and any re-mount cannot inflate the count.

`AnalyticsTracker` is mounted after the page content so that its effect runs
after the page has set the document title; otherwise every view would be
reported under the previous page's title.

## Custom events

The taxonomy is deliberately small — a handful of interpretable
research-engagement events rather than a log of every click. Ordinary internal
navigation is not tracked; page views already cover it.

`page_path` is added to every event automatically.

| Event | Fired when | Parameters |
| --- | --- | --- |
| `profile_link_click` | A profile icon on a person's card is opened | `person_id`, `profile_type` (`email`, `scholar`, `linkedin`) |
| `publication_link_click` | A paper's DOI link is opened, on the publications page or the home page | `publication_id`, `link_type` (`doi`) |
| `repository_link_click` | A repository is opened on GitHub | `repository_id`, `link_type` (`repository`, `issues`, `source`) |
| `tutorial_link_click` | A tutorial is opened from a repository's "Documented on this site" list | `method_slug`, `repository_id`, `link_type` (`documentation`) |
| `contact_click` | The group's email is opened, from the home page or the contact page | `contact_type` (`email`) |
| `web_vitals` | A Core Web Vital is measured (see below) | `metric_name`, `metric_value`, `metric_rating`, `metric_id` |

Identifiers are the **stable content ids** — the person, publication and
repository record ids, and the method slug — never display names, titles or
URLs. A paper retitled or a repository renamed in the CMS keeps its history in
GA4.

### No visitor data, ever

Custom parameters carry content ids and link types. They must never carry:

- an email address (including a group member's — the profile event sends
  `person_id`, never the address behind the icon);
- a person's name;
- anything typed by a visitor;
- an identifier for a visitor.

There is a test for this in `src/components/people/ProfileLinks.test.jsx`, and
it should be extended rather than removed if the taxonomy grows.

## Core Web Vitals

`web-vitals` reports LCP, CLS and INP for real visits, and the numbers are sent
as `web_vitals` events through the same helper as everything else — one
vendor, one pipe.

- The library is imported dynamically and only after analytics has started, so
  a build with no measurement ID never downloads it (it is a separate chunk of
  about 3 kB gzipped that the browser has no reason to request).
- CLS is a small ratio and GA4 rounds integers, so it is multiplied by 1000
  before being sent: a reported 85 means a CLS of 0.085.
- Nothing is displayed on the site. A page that renders its own performance
  score is a page that has made itself slower in order to say so.

Read them in GA4 under **Reports → Engagement → Events → `web_vitals`**, or
build an exploration on `metric_name` and `metric_rating`.

## Verifying it works

After a deployment with the variable set:

1. Open **Reports → Realtime** in GA4 and load the live site. The view should
   appear within a few seconds.
2. Navigate between pages. Each navigation should produce **one** `page_view`.
   If you see two per navigation, enhanced measurement's history events are on
   — turn them off.
3. For custom events, use **Admin → DebugView** with the GA Debugger extension
   enabled, then click a person's mail icon, a DOI and a repository link, and
   check the parameters that arrive.

To confirm the disabled path, open the deployed site's page source and search
for `googletagmanager`: with no variable set, it is not there.

## Where the code is

- `src/lib/analytics.js` — the whole integration: enablement, initialisation,
  page views, events, Core Web Vitals, and the event names.
- `src/components/shared/AnalyticsTracker.jsx` — turns router navigations into
  page views.
- Call sites pass content ids to `trackEvent`; no component touches `gtag` or
  `dataLayer` directly, and none should.

Tests: `src/lib/analytics.test.js` (the module, including that a missing ID
loads nothing) and `src/components/shared/AnalyticsTracker.test.jsx` (one view
per navigation). Neither contacts Google.
