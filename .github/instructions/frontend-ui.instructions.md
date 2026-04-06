---
description: "Use when editing Next.js pages, client components, reusable UI components, forms, or interaction flows in src/app and src/components. Covers consistency, state handling, and UI regressions."
applyTo:
  - "src/app/**/*.tsx"
  - "src/components/**/*.tsx"
---
# Frontend And UI Guidelines

- Reuse existing UI primitives in `src/components/ui` before introducing new component patterns.
- Keep page components focused on composition and state wiring. Move reusable fetch or mutation logic into hooks when it starts repeating.
- Preserve the current visual language unless the task explicitly asks for a redesign.
- Keep form and export flows explicit about loading, disabled, error, and empty states.
- Do not introduce avoidable client-side complexity when server-side or shared-hook patterns already exist in the repo.
- When changing a user-visible flow, inspect the related hook, route, and page together before editing so the UI and API assumptions stay aligned.
- Validate UI-facing changes with `npm run lint`, and run `npm run build` when routing, types, or server-client boundaries are affected.