# Copilot Workflow Guide

This workspace includes global instructions, file-specific instructions, custom agents, and reusable prompts for CRM Suite Sinergi.

## What Is Configured

- Global rules live in `.github/copilot-instructions.md`.
- File-specific rules live in `.github/instructions/` and auto-attach when matching files are edited.
- Custom agents live in `.github/agents/`.
- Reusable prompts live in `.github/prompts/`.

## Which Agent To Use

- Use `App Builder` when implementing a new feature, refining behavior, or translating a product request into code.
- Use `Debug Investigator` when you need root-cause analysis for bugs, regressions, API failures, or data mismatches.
- Use `Quality Guardian` when reviewing code quality, checking validation coverage, or assessing merge readiness.

## Which Prompt To Use

- Run `/Implement Feature` for a structured feature request.
- Run `/Debug Issue` for an investigation or bug fix request.
- Run `/Review Quality` for a review pass focused on findings and validation gaps.

## Recommended Prompt Structure

When asking Copilot to work on this repo, include these details whenever possible:

- Business goal or expected outcome.
- Relevant page, route, API, export flow, or integration area.
- Exact bug symptoms, logs, or reproduction steps if debugging.
- Constraints such as preserving output columns, auth behavior, or API contracts.
- Done criteria such as lint, build, export script, or docs updates.

## Validation Reality In This Repo

Current common validation commands:

- `npm run lint`
- `npm run build`
- `node test-export.js`
- Relevant scripts under `scripts/` for WMS or export-related verification

This repo does not yet define a formal `npm test` script. Until that exists, review and quality agents should report validation coverage honestly instead of implying automated behavior is fully tested.
