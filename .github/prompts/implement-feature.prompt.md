---
name: "Implement Feature"
description: "Use when turning a product request into a code change in this repo with the App Builder agent."
argument-hint: "Describe the feature, affected flow, constraints, and done criteria"
agent: "App Builder"
---
Implement the requested feature in this repository.

Requirements:
- Read the relevant page, route, hook, and lib files before editing.
- Keep changes minimal and consistent with the existing Next.js, Prisma, and integration patterns.
- State assumptions if the request leaves behavior ambiguous.
- Add or preserve error handling where the flow touches auth, API, parsing, or database logic.
- Run the most relevant validation available for the touched area before finishing.

Response format:
- Implementation result
- Validation performed
- Assumptions or remaining risks