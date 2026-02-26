# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important

Never add Claude Code as a co-author on commits or pull requests.

## Commands

```bash
npm run dev        # Start dev server on http://localhost:4900 (with Turbo)
npm run build      # Production build (runs pre-build scripts first)
npm run lint       # ESLint check
npm run lint:fix   # ESLint auto-fix
npm run ts         # TypeScript type check (no emit)
npm run unused     # Detect unused exports/imports via Knip
```

Both `dev` and `build` automatically run `src/utils/script/pre-build.js` first, which generates type files for icons and colors in parallel, then formats them.

**Node/npm version requirements** (from `package.json` engines): Node 25.6.1, npm 11.9.0.

## Architecture

### Routing

Next.js 14 **App Router**. Key route groups under `src/app/`:

- `(before-login-page)/` — public/unauthenticated pages
- `app/` — authenticated dashboard (hjem, prute, tilbud, innsikt, tips, profil, lan, refinansier)
- `api/` — Next.js API route handlers
- Top-level pages: `/login`, `/forbrukslan`, `/andrelan`, `/bankguiden`

### API Layer

**Axios client** at `src/utils/api-client/axios-instance.ts`:
- Dev: `https://rente-gateway-dev.herokuapp.com`, Prod: `https://rente-gateway-prod.herokuapp.com`
- Controlled by `NEXT_PUBLIC_ENV=production`
- Request interceptor injects `X-Auth-Token` from localStorage and `h_id` from Hotjar cookie
- Custom `raw` config flag bypasses response unwrapping; `silent` flag suppresses error handling
- `ErrorHandlerRegistry` class handles API errors; global handlers registered in `global-errors.ts`

**API endpoints** defined in `src/api-config/api-urls.ts` as `V2_ENDPOINTS` object.

**React Query hooks** in `src/api-config/hooks/` — 23+ hooks (e.g., `auth-api.ts`, `loans-api.ts`, `user-api.ts`). These are the primary way components fetch and mutate data.

React Query provider at `src/utils/ReactQueryProvider.tsx`: staleTime 10 min, 1 retry, no refetch on window focus.

### Authentication

Multi-service token system. Token types: `"main"`, `"ftb"`, `"unsecured-debt"`, `"omstartslan"`. Stored in localStorage with service-specific keys, managed in `src/utils/api-client/accessToken.ts`.

Login methods: BankID, Vipps, demo login, GUID-based, unfinished registration/payment recovery.

### State Management

- **React Query** — all server state
- **React Context** — UI state: `DrawerContext` (`src/store/DrawerContext.tsx`), `StepContext` (`src/store/StepContext.tsx`)
- **Providers** in `src/provider/` (e.g., `HouseProvider`)

### Path Aliases (tsconfig)

```
@/*          → src/*
@components/* → src/shared/components/*
@shared/*    → src/shared/*
@store/*     → src/store/*
@api/*       → src/api-config/*
@utils/*     → src/utils/*
@lib/*       → src/lib/*
@types/*     → src/types/*
```

### Key Directories

- `src/api-config/` — API hooks, DTOs, endpoint URLs, service type definitions
- `src/app/` — Next.js App Router pages and layouts
- `src/lib/` — helpers, custom hooks (`useLoginVerification`, `useResponsiveLayout`), A/B testing (`abTests/`), Brevo chat integration
- `src/provider/` — React providers
- `src/shared/components/` — 50+ shared UI components (forms, cards, menus, modals, etc.)
- `src/store/` — React context providers
- `src/types/` — TypeScript types including generated color and icon types
- `src/utils/` — API client, cookies, domain utilities (unsecuredDebt, refinancing, zipcodes)

### Generated Files

`src/utils/script/icon-script.js` and `colors-script.js` generate TypeScript type files at build time. Don't edit these generated files manually.

### Styling

Tailwind CSS v4 with PostCSS. Global styles in `src/app/globals.css`, `theme.css`, `typography.css`. Prettier auto-sorts Tailwind classes via `prettier-plugin-tailwindcss`.

### Forms

React Hook Form v7 + Zod v4 for validation + Maskito v5 for input masking. Norwegian-specific: `@navikt/fnrvalidator` for FNR (national ID) validation.

### External Integrations

Sentry (error tracking), Google Tag Manager, Hotjar, Brevo (customer chat), BankID, Vipps, Dintero (checkout).
