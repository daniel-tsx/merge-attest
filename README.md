# AgentGate

AgentGate is a SaaS control center for engineering teams using AI coding agents. It monitors AI-assisted pull requests, scores risky changes, detects missing tests, evaluates repository rules, records approvals, and keeps an audit trail before code reaches production.

## Quick Start

```bash
pnpm install
cp .env.example .env
pnpm db:generate
pnpm dev
```

## Documentation

**Agents:** start with [`docs/AGENT_START_HERE.md`](docs/AGENT_START_HERE.md), then follow its read order.

| Topic                       | Doc                                                                                            |
| --------------------------- | ---------------------------------------------------------------------------------------------- |
| Documentation index         | [`docs/README.md`](docs/README.md)                                                             |
| Setup, routes, architecture | [`docs/operations/SETUP.md`](docs/operations/SETUP.md)                                         |
| API endpoints               | [`docs/features/API.md`](docs/features/API.md)                                                 |
| UI design system            | [`docs/features/DESIGN_SYSTEM.md`](docs/features/DESIGN_SYSTEM.md)                             |
| Production checklist        | [`docs/operations/PRODUCTION_CHECKLIST.md`](docs/operations/PRODUCTION_CHECKLIST.md)           |
| Operations runbook          | [`docs/operations/OPERATIONS_RUNBOOK.md`](docs/operations/OPERATIONS_RUNBOOK.md)               |
| Privacy & support           | [`docs/operations/PRIVACY_RETENTION_SUPPORT.md`](docs/operations/PRIVACY_RETENTION_SUPPORT.md) |
| Product roadmap             | [`docs/strategy/ENHANCEMENT_PLAN.md`](docs/strategy/ENHANCEMENT_PLAN.md)                       |

Historical plans and reviews live under [`docs/archive/`](docs/archive/).
