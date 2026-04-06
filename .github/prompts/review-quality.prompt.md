---
name: "Review Quality"
description: "Use when reviewing quality, test gaps, regressions, or merge readiness in this repo with the Quality Guardian agent."
argument-hint: "Describe the change, files, feature area, or risk you want reviewed"
agent: "Quality Guardian"
---
Review the requested change set for quality and regression risk.

Requirements:
- Focus on findings first, not summaries.
- Tie each finding to a concrete file, behavior, or validation gap.
- Check typing, error handling, route behavior, data mapping, and likely regressions.
- Run the most relevant available validation commands for the affected area.
- If no issues are found, say so clearly and mention residual risks or missing test coverage.

Response format:
- Findings ordered by severity
- Validation results
- Residual risks or missing coverage