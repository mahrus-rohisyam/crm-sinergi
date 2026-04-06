---
description: "Use when editing Next.js API routes, route handlers, auth-protected endpoints, export endpoints, or request/response handling in src/app/api. Covers validation, error responses, and thin-route patterns."
applyTo: "src/app/api/**/route.ts"
---
# API Route Guidelines

- Keep route handlers thin. Move parsing, mapping, export formatting, or external API logic into `src/lib` when the handler starts carrying business logic.
- Validate required request fields explicitly and return clear `400` responses for invalid input.
- Prefer stable JSON error shapes with meaningful messages over silent fallbacks.
- Preserve auth and permission checks when touching user, profile, settings, or other sensitive endpoints.
- Keep success and error status codes intentional. Do not return `200` for partial failures.
- When modifying export, segment, WMS, or Everpro endpoints, verify related docs in `docs/` and update them if payload or mapping behavior changes.
- Add targeted validation after edits. Start with the smallest useful route-level check, then run `npm run lint` and `npm run build` if the route contract or typing changed.