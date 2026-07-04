# MergeAttest Skill Specifications

**Status:** `current`
**Last verified:** 2026-07-04

Project-specific skill **specs** — detailed enough to convert into Claude Code / Eastbase plugin skills later, but kept as specs for now because this repo has no skill/plugin structure of its own (checked 2026-07-04: `.claude/` holds only `launch.json` and worktree cache).

## Relationship to the Other Layers

- **Playbooks** (`docs/agents/playbooks/`) hold the durable method. Specs reference them instead of duplicating.
- **Prompts** (`docs/agent-prompts/`) are the copy/paste form of the same tasks. A skill spec ≈ prompt + triggering rules + I/O contract, packaged for automatic invocation.
- **Eastbase studio-level skills already exist** (`eastbase-premium-ui`, `eastbase-launch-check`, `eastbase-review-pr`, `eastbase-blog-post`). Project skills must **layer on top of** those, never fork or replace them — each spec states its relationship.

## Conversion Notes (when turning a spec into a real skill)

1. Follow the current Claude Code skill format (SKILL.md + frontmatter `name`/`description`; check current docs — formats move).
2. The spec's "When to use / When not to use" becomes the frontmatter `description` triggers; keep the negative triggers, they prevent misfires.
3. The workflow section becomes the skill body; link repo docs by path rather than inlining them (they change).
4. Keep specs and any converted skills in sync — if a converted skill ships, mark the spec `shipped` and note where the skill lives.

## Spec Index

| Spec                                                                                 | Automates                             | Builds on                                     |
| ------------------------------------------------------------------------------------ | ------------------------------------- | --------------------------------------------- |
| [`specs/project-launch-check.md`](specs/project-launch-check.md)                     | MergeAttest-specific launch gate      | `eastbase-launch-check` + launch playbook     |
| [`specs/landing-premium-redesign.md`](specs/landing-premium-redesign.md)             | Landing directions → implementation   | `eastbase-premium-ui` + landing playbook      |
| [`specs/product-content-audit.md`](specs/product-content-audit.md)                   | Copy/claims audit across all surfaces | Content playbook                              |
| [`specs/ai-agent-discoverability-audit.md`](specs/ai-agent-discoverability-audit.md) | llms/discovery/SEO layer audit        | Discoverability playbook                      |
| [`specs/security-readiness-review.md`](specs/security-readiness-review.md)           | Defensive access-control review       | Security playbook                             |
| [`specs/architecture-overview-diagram.md`](specs/architecture-overview-diagram.md)   | Architecture docs/diagrams sync       | Architecture playbook                         |
| [`specs/marketing-assets-prep.md`](specs/marketing-assets-prep.md)                   | Launch asset pack production          | Marketing playbook                            |
| [`specs/blog-series-planner.md`](specs/blog-series-planner.md)                       | Product-grounded blog series planning | `eastbase-blog-post`                          |
| [`specs/dashboard-polish.md`](specs/dashboard-polish.md)                             | App-surface polish to the quality bar | `eastbase-premium-ui` + feature-polish prompt |
| [`specs/handoff-generator.md`](specs/handoff-generator.md)                           | End-of-task handoff production        | Handoff prompt                                |
