# Privacy, Retention, And Support

## Customer Data

AgentGate stores organization membership, connected repository metadata, pull request metadata, changed file paths, risk signals, rule violations, approvals, review notes, audit events, billing identifiers, and usage records.

AgentGate does not need to store full source file contents to provide the current product workflow. Keep future integrations scoped to metadata unless a customer explicitly opts in.

## Retention

Audit retention is plan based:

- Free: 7 days
- Starter: 30 days
- Team: 180 days
- Growth: 365 days
- Enterprise: custom retention after customer agreement

Usage records, billing identifiers, and audit export records should be retained long enough to support billing disputes, compliance reviews, and customer support obligations.

## Support Contact

Default support contact: `support@agentgate.local`

Before production launch, replace this with the real monitored support mailbox and include response targets for billing, security, and operational incidents.

## Privacy Notes

- Keep webhook secrets, API keys, billing identifiers, and generated audit exports out of logs.
- Use structured logs with release and environment context for troubleshooting.
- Limit diagnostics endpoints to owners/admins.
- Treat review packets and audit exports as customer confidential data.
