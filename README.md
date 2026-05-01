# AgentGate

AgentGate is a SaaS control center for engineering teams using AI coding agents. It monitors AI-assisted pull requests, scores risky changes, detects missing tests, evaluates repository rules, records approvals, and keeps an audit trail before code reaches production.

Project documentation has moved to `docs/`.

- Product and setup documentation: `docs/README.md`
- Productization roadmap: `docs/PRODUCTIZATION_PLAN.md`

Quick start:

```bash
pnpm install
cp .env.example .env
pnpm db:generate
pnpm dev
```
