# CRM Suite Sinergi Guidelines

## Scope
- These instructions apply to all work in this repository.
- Keep changes minimal, targeted, and consistent with the existing Next.js, Prisma, and API integration patterns in this codebase.

## Working Style
- Read the relevant route, hook, component, and lib files before editing. Do not infer architecture from a single file.
- State assumptions when requirements are incomplete or behavior is ambiguous.
- Fix root causes when practical, but do not expand scope into unrelated cleanup.
- Preserve existing public behavior unless the task explicitly changes it.

## Architecture
- App routes and UI live under `src/app` and reusable UI lives under `src/components`.
- Business logic and external integrations belong in `src/lib` and reusable data-fetching logic belongs in `src/hooks`.
- Keep API route handlers thin. Put parsing, mapping, and client logic in `src/lib` when possible.
- Prisma access should use the shared client patterns already present in `src/lib/prisma.ts` and adjacent server-side code.

## Code Quality
- Prefer explicit TypeScript types and narrow interfaces over `any`.
- Reuse existing utilities, hooks, and UI primitives before adding new abstractions.
- Add error handling for network, parsing, auth, and database paths when modifying API or integration code.
- If a task changes exported data shape, API payloads, or mapping behavior, update the relevant docs in `docs/`.

## Validation
- Run the narrowest useful validation first, then broader checks when the change warrants it.
- Use `npm run lint` for code quality checks.
- Use `npm run build` for changes that affect routing, types, build output, or integration boundaries.
- This repo does not yet define a formal `test` script. If work touches export or WMS flows, use the relevant existing scripts such as `node test-export.js` or files in `scripts/` when applicable, and report what was or was not validated.

## Repo-Specific Notes
- Be careful with segment export, WMS, and Everpro flows; these areas have business-specific mappings documented in `docs/`.
- For auth, user management, settings, and API routes, avoid silent fallback behavior. Return clear errors and preserve security checks.
- Do not invent new architectural layers unless the current task clearly needs one.