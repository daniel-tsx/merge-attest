# Privacy, Retention, And Support

**Status:** `current`
**Location:** `docs/operations/PRIVACY_RETENTION_SUPPORT.md`
**Last verified:** 2026-06-10

## Customer Data

MergeAttest stores organization membership, connected repository metadata, pull request metadata, changed file paths, risk signals, rule violations, approvals, review notes, AI review job metadata, repository AI review settings, audit events, billing identifiers, and usage records.

MergeAttest does not need to store full source file contents to provide the current product workflow. AI review guardrails use GitHub pull request diffs during processing, but the product should keep future integrations scoped to metadata unless a customer explicitly opts in.

OpenRouter API keys are customer-provided credentials and must be encrypted before storage. Do not include plaintext keys in diagnostics, audit exports, review packets, or logs.

## Sub-processors

The public privacy policy (`app/privacy/page.tsx`) names the third-party providers MergeAttest relies on. Keep that list in sync with what the code actually uses:

- **GitHub** — pull request metadata source (GitHub App).
- **Vercel** — application hosting and cookieless web analytics (`@vercel/analytics` in `app/layout.tsx`).
- **Resend** — transactional email (`lib/email.ts`).
- **OpenRouter** — advisory AI review (BYOK; execution off during early access, `lib/ai/openrouter.ts`).
- **Lemon Squeezy** — payment/subscription processing (dormant until `ENABLE_PAID_BILLING=true`, `lib/billing.ts`).
- **Managed PostgreSQL provider** — durable storage (name the provider before launch; currently a `TODO` placeholder in the privacy page).

## Retention

Audit retention is plan based:

- Free: 7 days
- Starter: 30 days
- Team: 180 days
- Growth: 365 days
- Enterprise: custom retention after customer agreement

Usage records, billing identifiers, and audit export records should be retained long enough to support billing disputes, compliance reviews, and customer support obligations.

## Support Contact

Default support contact is the monitored mailbox configured by `SUPPORT_EMAIL`.

Production launch requires response targets for billing, security, and operational incidents, plus a documented escalation owner for urgent webhook, billing, or data export failures.

## Privacy Notes

- Keep webhook secrets, API keys, billing identifiers, and generated audit exports out of logs.
- Use structured logs with release and environment context for troubleshooting.
- Limit diagnostics endpoints to owners/admins.
- Treat review packets and audit exports as customer confidential data.
- Sanitize AI-authored GitHub markdown before publishing or exporting it.
