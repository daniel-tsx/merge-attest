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
      {/*
        TODO (founder/legal review): confirm the legal entity name and contact
        address that operates MergeAttest, the governing jurisdiction, and the
        managed PostgreSQL provider named in "Third-party sub-processors" below.
        This template is a starting point and is not legal advice.
      */}
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
        <h2 className="text-base font-semibold text-foreground">
          Third-party sub-processors
        </h2>
        <p className="mt-2">
          MergeAttest relies on a small set of service providers to operate.
          Each receives only the data needed for its function:
        </p>
        <ul className="mt-3 space-y-2">
          <li>
            <span className="font-medium text-foreground">GitHub</span> — the
            source of pull request metadata; MergeAttest connects as a GitHub
            App scoped to the repositories you authorize.
          </li>
          <li>
            <span className="font-medium text-foreground">Vercel</span> —
            application hosting and cookieless web analytics for public pages.
          </li>
          <li>
            <span className="font-medium text-foreground">Resend</span> —
            delivery of transactional email (sign-in, verification, and team
            invitations).
          </li>
          <li>
            <span className="font-medium text-foreground">OpenRouter</span> —
            used only if you connect your own key for the advisory AI review
            layer. Model execution stays off during early access, so no diff is
            sent to OpenRouter unless you enable it.
          </li>
          <li>
            <span className="font-medium text-foreground">Lemon Squeezy</span> —
            payment and subscription processing. It is dormant during the free
            early-access launch and stores only billing identifiers when paid
            plans are enabled.
          </li>
          <li>
            {/* TODO (founder): name the managed PostgreSQL provider you deploy on. */}
            <span className="font-medium text-foreground">
              A managed PostgreSQL database provider
            </span>{' '}
            — durable storage for the organization, governance, and audit data
            described above.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">Retention</h2>
        <p className="mt-2">
          Audit event retention depends on your plan. During the free
          early-access launch, audit history is retained for seven days unless
          your plan specifies otherwise. Usage records and billing identifiers
          may be kept longer to support billing disputes, compliance reviews,
          and support obligations.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">
          Cookies, analytics, and tracking
        </h2>
        <p className="mt-2">
          MergeAttest uses Vercel Web Analytics on public marketing pages to
          understand aggregate traffic patterns. It does not set tracking
          cookies or build cross-site advertising profiles, so no cookie consent
          banner is required. Authentication uses a first-party session cookie
          that is strictly necessary to keep you signed in. Product telemetry is
          limited to operational logging required to run the service securely.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">
          Your choices and data requests
        </h2>
        <p className="mt-2">
          You can export audit evidence and compliance reports from the product
          at any time, and disconnect the GitHub App to stop further processing.
          To request access to, correction of, or deletion of your workspace
          data, contact support using the address below; we will respond within
          a reasonable period.
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
