# Plan: Add Email Link (passwordless) auth

Add a passwordless "sign in with a magic link" option alongside the existing
Google OAuth flow. The user enters their email, Firebase emails them a one-time
sign-in link, they click it, and land back in the app authenticated. No
password, no third-party developer account, no paid membership — the flow lives
entirely inside Firebase Auth.

## How the flow works

1. User types their email on `/login` and submits.
2. App calls `sendSignInLinkToEmail(auth, email, actionCodeSettings)` and stashes
   the email in `localStorage` (needed to complete the flow).
3. Firebase emails a link back to `actionCodeSettings.url` (a route we own).
4. User clicks the link → lands on our finish route → app calls
   `signInWithEmailLink(auth, email, window.location.href)`.
5. `onAuthStateChanged` fires (already wired in `AuthContext`), `upsertUserProfile`
   runs, user is redirected to their original destination.

## Prerequisites (external — one-time, no code)

1. **Firebase Console → Authentication → Sign-in method:** enable the
   **Email/Password** provider, then within it toggle on
   **Email link (passwordless sign-in)**.
2. **Authorized domains:** confirm the production domain and
   `<project>.firebaseapp.com` / `localhost` are in Firebase Auth's
   authorized-domains list (they already are, for Google). The
   `actionCodeSettings.url` domain must be on this list or the send fails.
3. (Optional, later) Customise the sign-in email template / sender under
   Authentication → Templates. Default Firebase-branded email is fine for v1.

> No repo `.env` / secret changes needed.

## Code changes (step by step)

### 1. `src/context/AuthContext.tsx`

Import the email-link helpers from `firebase/auth`:
`sendSignInLinkToEmail`, `isSignInWithEmailLink`, `signInWithEmailLink`.

Add two methods to `AuthContextValue` and implement them:

```ts
const EMAIL_FOR_SIGN_IN_KEY = "emailForSignIn";

// Step 2: request the link
const sendEmailSignInLink = async (email: string) => {
  const actionCodeSettings = {
    // Route that completes the sign-in (see step 3). Must be an absolute URL
    // on an authorized domain.
    url: `${window.location.origin}/login/finish`,
    handleCodeInApp: true,
  };
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  window.localStorage.setItem(EMAIL_FOR_SIGN_IN_KEY, email);
};

// Step 4: complete the sign-in when the user returns via the link
const completeEmailSignIn = async (href: string): Promise<boolean> => {
  if (!isSignInWithEmailLink(auth, href)) return false;
  let email = window.localStorage.getItem(EMAIL_FOR_SIGN_IN_KEY);
  if (!email) {
    // Link opened on a different device/browser — ask for it again.
    email = window.prompt("Please confirm your email to finish signing in") ?? "";
  }
  if (!email) return false;
  await signInWithEmailLink(auth, email, href);
  window.localStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);
  return true;
};
```

Expose both on the context `value`. Wrap the `signInWithEmailLink` call in the
same `setState("isLoading", …)` / try-catch shape as `signInWithGoogle` for
consistent error surfacing. (The cross-device `window.prompt` is the simplest
v1 approach; a nicer in-app re-entry form can come later.)

### 2. `src/pages/auth/Login.tsx` — add the email form

- Add local signals: `email`, a `linkSent` boolean, plus reuse the existing
  `error` / `loading` signals.
- Render an `Input` (from `src/components/forms/Input.tsx`) for the email and a
  secondary `Button` "Email me a sign-in link", below the existing Google
  button. Keep Google as the primary CTA.
- On submit: validate the email is non-empty, call
  `auth.sendEmailSignInLink(email())`, then set `linkSent` true and show a
  "Check your inbox ✉️" confirmation instead of the form.
- Update the intro copy to mention both options.
- Basic email-shape validation before sending (an `<input type="email">` +
  non-empty check is enough for v1).

### 3. New route + finish page

**`src/routes.ts`:** add a public route (sibling of `/login`):
```ts
{
  path: "/login/finish",
  component: lazy(() => import("./pages/auth/FinishEmailSignIn")),
},
```

**`src/pages/auth/FinishEmailSignIn.tsx`** (new): a small page that, on mount,
calls `auth.completeEmailSignIn(window.location.href)`.
- Use the `solid-patterns` skill — completion is an async side-effect on mount.
  Show a "Signing you in…" state; on success `navigate("/dashboard", { replace: true })`
  (or the stored redirect target); on failure show an error with a link back to
  `/login`. Mirror `Login.tsx`'s Stage-Night styling shell.
- Guard against the not-a-sign-in-link case (`completeEmailSignIn` returns
  `false`) with a friendly "This link is invalid or expired" message.

> Note: the `redirect` target from the original `/login?redirect=…` visit is lost
> across the email round-trip. For v1, finish → `/dashboard`. If preserving the
> deep-link matters, encode it into `actionCodeSettings.url` as a query param and
> read it back on the finish page. Flag this as a deliberate v1 simplification.

### 4. `src/services/usersService.ts` — verify, likely no change

Email-link users have a real `email` and `emailVerified: true`, but
`displayName` and `photoURL` are `null`. `upsertUserProfile` already handles
`null` for those. The DJ-name onboarding (`getUserDjName` → `null`) already
covers users with no display name, so no change is expected — **verify** the
profile/DJ-name flow renders sensibly for a nameless user rather than assuming.

## Verification

- `pnpm ts`, `pnpm lint:fix`, `pnpm test` all pass.
- Manual (after enabling the provider in console):
  1. `/login` → enter email → confirm "check your inbox" state.
  2. Click the emailed link → lands on `/login/finish` → auto signs in →
     redirected to `/dashboard` with a `users/{uid}` doc written.
  3. Same-device happy path (email read from `localStorage`, no prompt).
  4. Different-device path: open the link where `localStorage` is empty →
     in-app "Confirm your email" page asks for the email → completes.
  5. Reused/expired link → friendly error, not a crash.

## Out of scope

- Email/password (with an actual password) sign-up — this is link-only.
- Custom email templates / custom sending domain (console-side, later).

## Shipped beyond the original plan

Two items originally scoped out of v1 were implemented in this PR:

- Cross-device email re-entry uses an in-app "Confirm your email" page rather
  than `window.prompt`.
- The `redirect` deep-link target is preserved across the email round-trip
  (`sendEmailSignInLink` encodes a validated in-app path into the finish URL;
  `FinishEmailSignIn` re-validates it and forwards there after sign-in).
