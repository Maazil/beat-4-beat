# Plan: Add Sign in with Apple auth

Add "Sign in with Apple" alongside the existing Google OAuth flow, following the
same `signInWithPopup` pattern already used in `AuthContext`. Firebase Auth
supports Apple natively via `OAuthProvider("apple.com")`, so no backend is
required — the popup flow works the same way as Google.

## Scope & approach

- Mirror the existing Google flow: add `signInWithApple()` to `AuthContext`,
  expose a second button on the Login page.
- Keep the change surgical — no refactor of the shared sign-in logic beyond what
  Apple needs. The one Apple-specific wrinkle (display name only arrives on the
  _first_ sign-in) is handled in `usersService`.

## Prerequisites (external — one-time, no code)

These must be done by an Apple Developer Program member before the code works.
They cannot be scripted; list is here so the config values are ready when the
code lands.

1. **Apple Developer Program membership.** Sign in with Apple can only be
   configured by a paid member.
2. **Create a Services ID** (App IDs & Services). This is the client ID.
3. **Register the return URL** on the Services ID:
   `https://<VITE_FIREBASE_PROJECT_ID>.firebaseapp.com/__/auth/handler`
   (find the exact `authDomain` in `.env.local`).
4. **Configure the Email relay service** and register the sender
   `noreply@<VITE_FIREBASE_PROJECT_ID>.firebaseapp.com` so relayed emails deliver.
5. **Create a Sign in with Apple private key** — note the **Key ID** and download
   the `.p8`. Also note the **Team ID**.
6. **Firebase Console → Authentication → Sign-in method → Apple:** enable it and
   paste Services ID, Apple Team ID, Key ID, and the private key.
7. **Authorized domains:** confirm the production domain and
   `<project>.firebaseapp.com` are in Firebase Auth's authorized-domains list
   (they are already, for Google).

> No `.env` / Firebase secrets change is needed in the repo — Apple's keys live
> in the Firebase console, not in client config.

## Code changes (step by step)

### 1. `src/context/AuthContext.tsx`

- Import `OAuthProvider` from `firebase/auth` (add to the existing import
  alongside `GoogleAuthProvider`).
- Add `signInWithApple: () => Promise<void>` to the `AuthContextValue` interface.
- Implement it mirroring `signInWithGoogle`:
  ```ts
  const signInWithApple = async () => {
    setState("isLoading", true);
    try {
      const provider = new OAuthProvider("apple.com");
      provider.addScope("email");
      provider.addScope("name");
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Apple sign in failed:", error);
      throw error;
    } finally {
      setState("isLoading", false);
    }
  };
  ```
- Add `signInWithApple` to the `value` object returned by the provider.

### 2. `src/services/usersService.ts` — handle first-sign-in-only display name

Apple returns the display name **only on the very first authorization**, and
never provides a `photoURL`. On subsequent logins `user.displayName` is `null`.
`upsertUserProfile` currently writes `displayName: user.displayName ?? null`,
which would overwrite a previously-stored Apple name with `null`.

- Guard the `displayName` write so it never clobbers an existing value with
  `null`: only set `displayName` in the merge payload when `user.displayName` is
  truthy, or fall back to the already-stored value. Concretely, drop
  `displayName` from the update payload when it's `null` and the doc already
  exists.
- `photoURL` behaves the same way (Apple never sends one) — apply the same
  non-clobber guard so a Google-linked photo isn't wiped if the accounts merge.

This keeps the Google path byte-for-byte identical while making the profile sync
resilient to Apple's sparse payloads.

### 3. `src/pages/auth/Login.tsx` — add the button

- Add a `handleAppleSignIn` handler mirroring `handleGoogleSignIn`, calling
  `auth.signInWithApple()` and setting an Apple-specific error message.
- Render a second `Button` below the Google one. Use a visually secondary
  variant if `Button` supports it (check `src/components/forms/Button.tsx`), so
  Google stays the primary CTA. Label: "Sign in with Apple".
- Update the intro copy ("Sign in with your Google account…") to mention both
  providers.
- Share the `loading()` signal between both buttons (disable both while either
  is in flight) to avoid concurrent popups.

### 4. Account-linking consideration (verify, likely no code)

If a user signs in with Apple using an email already registered via Google,
Firebase throws `auth/account-exists-with-different-credential`. The Google flow
today doesn't handle this either, so matching current behaviour (surface the
error) is acceptable for v1. Note it as a known limitation rather than expanding
scope — call out in the PR description.

## Verification

- `pnpm ts` — types (new `OAuthProvider` import, `signInWithApple` signature).
- `pnpm lint:fix`
- `pnpm test` — existing suite still green (no pure-logic changes to test; the
  `usersService` guard is worth a small unit test if the file is testable in the
  node env — check `src/services` isn't Firestore-coupled first).
- Manual: once the Apple console config is live, click "Sign in with Apple" on
  `/login`, confirm the popup completes and the user lands on `/dashboard` with a
  `users/{uid}` doc written. Sign out and back in to confirm the display name
  persists (not overwritten with `null`).

## Out of scope

- Native/redirect flow (`signInWithRedirect`) — the app uses popup for Google;
  keep parity.
- Explicit account-linking UI.
- Apple sign-in on any native/mobile shell (web only).
