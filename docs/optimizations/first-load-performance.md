# Optimization: First-load performance (lazy analytics, fonts, preconnects)

**Area:** performance / bundle · **Impact:** high for landing-page TTI/LCP · **Effort:** low

## Problem

The signed-out landing page — the most traffic-sensitive page — eagerly downloads Firebase Analytics (+ Installations) and a googletagmanager script, and requests three Google-Fonts families with many weights/axes render-blockingly. The `firebase.ts`/`db.ts` split exists precisely to keep the entry chunk lean, and analytics partially defeats it.

## Evidence (measured against the current `dist/` build)

- Entry chunk `index-*.js` is 172 KB raw / 54 KB gzip and contains `@firebase/analytics`, `@firebase/installations`, and `googletagmanager`/`gtag` markers — pulled in by the top-level static import in `src/lib/firebase.ts:1`, which is on the eager entry path via `AuthContext`.
- `index.html:9-12` — one render-blocking stylesheet loading Bricolage Grotesque (opsz 12..96, 5 weights), Schibsted Grotesk (incl. italics), and Spline Sans Mono (4 weights).
- `index.html:7-8` — preconnects exist only for Google Fonts; none for `firestore.googleapis.com`, `identitytoolkit.googleapis.com`, or `api.spotify.com`.

Already verified fine (no action): Firestore stays out of the entry chunk; `solid-devtools` is stripped in prod; the Spotify Playback SDK only loads on the dev-only `/spotify-test` route; `/assets/**` cache headers are immutable.

## Suggested fix

1. Make analytics fully lazy: drop the static import and `await import("firebase/analytics")` inside the existing `isSupported()` gate (or behind `requestIdleCallback`). Removes ~10 KB gzip + a third-party request from the critical path.
2. Trim unused font weights/axes from the Google Fonts URL (audit actual usage first).
3. Add `<link rel="preconnect">` for the identitytoolkit/firestore origins, and `api.spotify.com` for the play path.

## Acceptance criteria

- `pnpm build`: entry chunk no longer contains `@firebase/analytics` / `googletagmanager` markers; gzip size drops measurably.
- Analytics events still arrive (check DebugView) after idle load.
- `pnpm ts` / `lint` / `test` pass.

_Sources: performance audit findings #2, #5 (2026-07-17)._
