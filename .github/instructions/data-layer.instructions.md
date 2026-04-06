---
description: "Use when editing Prisma access, src/lib modules, integration clients, parsers, hooks, or data mapping logic. Covers typed contracts, external API handling, retries, and mapping safety."
applyTo:
  - "src/lib/**/*.ts"
  - "src/hooks/**/*.ts"
  - "prisma/**/*.prisma"
---
# Data Layer And Integration Guidelines

- Keep shared contracts explicit. Prefer narrow TypeScript types for API payloads, parser outputs, and Prisma-facing data.
- Centralize integration behavior in `src/lib` instead of scattering fetch, retry, auth header, or mapping logic across routes and pages.
- When touching WMS, Everpro, or export mapping logic, protect existing field names and output semantics unless the requirement explicitly changes them.
- Avoid hidden defaults for missing credentials, URLs, or configuration. Fail clearly when required environment values are absent.
- Preserve retry, pagination, and error-propagation behavior unless you are intentionally changing failure handling.
- If a change affects stored data shape, Prisma schema behavior, or exported columns, update the matching docs under `docs/`.
- Validate integration changes with the most specific available check first, such as `node test-export.js` or relevant scripts under `scripts/`, then run broader lint/build checks as needed.