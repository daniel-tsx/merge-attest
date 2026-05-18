# AgentGate

AgentGate is a SaaS control center for engineering teams using AI coding agents. It monitors AI-assisted pull requests, scores risky changes, detects missing tests, evaluates repository rules, records approvals, and keeps an audit trail before code reaches production.

Project documentation has moved to `docs/`.

- Product and setup documentation: `docs/README.md`
- Original productization plan: `docs/PRODUCTIZATION_PLAN.md`
- Enhancement roadmap: `docs/ENHANCEMENT_PLAN.md`
- Merge Mate AI review adoption plan: `docs/MERGE_MATE_ADOPTION_PLAN.md`
- Production checklist: `docs/PRODUCTION_CHECKLIST.md`
- API and operations notes: `docs/API.md`
- Privacy, retention, and support notes: `docs/PRIVACY_RETENTION_SUPPORT.md`

Quick start:

```bash
pnpm install
cp .env.example .env
pnpm db:generate
pnpm dev
```
