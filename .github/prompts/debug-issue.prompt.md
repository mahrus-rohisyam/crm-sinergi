---
name: "Debug Issue"
description: "Use when investigating a bug, runtime error, API failure, regression, or export mismatch in this repo with the Debug Investigator agent."
argument-hint: "Describe the bug, repro steps, expected behavior, and any logs or failing endpoint"
agent: "Debug Investigator"
---
Investigate and fix the reported issue in this repository.

Requirements:
- Reproduce the issue from the supplied steps, logs, or code path when possible.
- Identify a concrete root-cause hypothesis before changing code.
- Apply the smallest defensible fix at the source of the problem.
- Re-run the best available validation and explain what evidence supports the fix.
- Call out any uncertainty if full reproduction is not possible.

Response format:
- Root cause
- Fix applied
- Validation evidence
- Remaining uncertainty or follow-up risk