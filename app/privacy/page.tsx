import type { Metadata } from 'next'
import { LegalPageShell } from '@/components/app/legal-page-shell'
import { createPageMetadata } from '@/lib/seo/metadata'

export const metadata: Metadata = createPageMetadata({
  title: 'Privacy Policy',
  description:
    'How MergeAttest collects, stores, and protects organization data, pull request metadata, audit events, and customer credentials.',
  path: '/privacy',
})

export default function PrivacyPage() {
  return (
    <LegalPageShell
      title="Privacy Policy"
      description="Last updated June 2026. This policy describes how MergeAttest handles customer data for teams governing AI-assisted pull requests on GitHub."
    >
      <section>
        <h2 className="text-base font-semibold text-foreground">
          What we process
        </h2>
        <p className="mt-2">
          MergeAttest stores organization membership, connected repository
          metadata, pull request metadata, changed file paths, risk signals,
          rule violations, approvals, review notes, AI review job metadata,
          repository AI settings, audit events, billing identifiers, and usage
          records needed to operate the product.
        </p>
        <p className="mt-3">
          We do not need to store full source file contents for the current
          workflow. AI review guardrails may process GitHub pull request diffs
          during processing, but integrations should remain scoped to metadata
          unless a customer explicitly opts in to broader retention.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">
          Credentials and secrets
        </h2>
        <p className="mt-2">
          OpenRouter API keys and similar customer-provided credentials are
          encrypted before storage. Webhook secrets, API keys, billing
          identifiers, and generated audit exports must not appear in
          diagnostics, review packets, or application logs.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">Retention</h2>
        <p className="mt-2">
          Audit event retention depends on your plan. During the free early-access
          launch, audit history is retained for seven days unless your plan
          specifies otherwise. Usage records and billing identifiers may be kept
          longer to support billing disputes, compliance reviews, and support
          obligations.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">
          Analytics and observability
        </h2>
        <p className="mt-2">
          MergeAttest may use privacy-preserving web analytics on public marketing
          pages to understand traffic patterns. Product telemetry is limited to
          operational logging required to run the service securely.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">Contact</h2>
        <p className="mt-2">
          For privacy questions or data requests, contact the support mailbox
          configured for your deployment or email{' '}
          <a
            href="mailto:support@mergeattest.com"
            className="text-foreground underline underline-offset-4"
          >
            support@mergeattest.com
          </a>
          .
        </p>
      </section>
    </LegalPageShell>
  )
}
