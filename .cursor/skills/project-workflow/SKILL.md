---
name: project-workflow
description: Runs the standard project execution flow: align with concise questions, review lessons learned before planning/implementation, and complete with git push/deploy steps. Use when implementing features, fixing bugs, or doing multi-step project work.
---

# Project Workflow

## Execution Order

1. Ask alignment questions first (goal, constraints, done criteria).
2. Read `LESSONS_LEARNED.md` before planning or implementation.
3. Plan and implement the change.
4. Update `LESSONS_LEARNED.md` if any roadblock was encountered.
5. Complete git push/deploy workflow.

## Alignment Questions

Ask a short set of focused questions before implementation:

- What exact outcome should this change produce?
- What constraints or non-goals should be respected?
- How should success be validated?

## Lessons Learned Rules

- Keep lessons concise.
- Include: roadblock, solution, prevention.
- Add newest entries at the top.

## Git Push + Deploy

- After changes, prepare commit and push by default.
- Confirm checks/tests are complete and summarize what is being pushed.
- If deploy command is known, run it after push.
- If deploy command is unknown, ask once and document it.
