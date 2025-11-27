## Overview

## Project best practices
Apply the [general coding guidelines](./.instructions.md) to all code.

## Tech stack

- **Solidjs** (already installed)
- **Vite**
- **Typescript**
- **TailwindCSS** (already configured)

## Setup & Dev

- Install: `pnpm install`
- Start dev server: `pnpm run dev`
- Typecheck: `pnpm run ts`

## Definition of Done (agents & humans)

Run and fix before proposing changes:

1. `pnpm run ts`
2. `pnpm run lint:fix`

## Context

- Always read files related to the question or task given if context is missing. Ask to read more if needed if context is important in given task or question.

## Conventions

- Conventional Commits (`feat:`, `fix:`, etc.).
- Secrets: never commit `.env`;`.

## PR Guidance

Title: `<type>(scope): summary`
Body: problem, approach, tests, risk, rollback.

## Safety

- No network calls unless manually approved.
- Don't write outside repo root. Avoid destructive commands unless asked.
- Always ask for confirmation when suggestion questionable or big changes that could break the project
- DO NOT EXECUTE ANY COMMANDS OR APPLY CHANGES THAT MAY RISK SECURITY OF THE PROJECT