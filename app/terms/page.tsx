import type { Metadata } from 'next'
import { LegalPageShell } from '@/components/app/legal-page-shell'
import { createPageMetadata } from '@/lib/seo/metadata'

export const metadata: Metadata = createPageMetadata({
  title: 'Terms of Service',
  description:
    'Terms for using MergeAttest during the free early-access launch: GitHub-native AI pull request governance, usage limits, and customer responsibilities.',
  path: '/terms',
})

export default function TermsPage() {
  return (
    <LegalPageShell
      title="Terms of Service"
      description="Last updated June 2026. These terms apply to MergeAttest during the free early-access launch at www.mergeattest.com."
    >
      {/*
        TODO (founder/legal review): insert the operating legal entity name and
        the governing jurisdiction in "Governing law" below before relying on
        these terms. This template is a starting point and is not legal advice.
      */}
      <section>
        <h2 className="text-base font-semibold text-foreground">Service</h2>
        <p className="mt-2">
          MergeAttest provides a GitHub-native control center for governing
          AI-assisted pull requests, including risk scoring, repository rules,
          approvals, agent attribution, and audit evidence export. Features and
          usage limits may change during early access as the product evolves.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">Accounts</h2>
        <p className="mt-2">
          You are responsible for safeguarding workspace credentials, granting
          GitHub App access only to repositories you are authorized to manage,
          and ensuring team members comply with your organization&apos;s
          policies.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">
          Acceptable use
        </h2>
        <p className="mt-2">
          You may not misuse the service, attempt to access other
          customers&apos; data, interfere with platform operations, or use
          MergeAttest in violation of applicable law or GitHub&apos;s terms.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">
          Early access
        </h2>
        <p className="mt-2">
          The free launch is provided on an as-available basis. Paid plans,
          higher limits, and enterprise features may be introduced later. We may
          suspend accounts that threaten service stability, security, or other
          customers.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">Disclaimers</h2>
        <p className="mt-2">
          MergeAttest helps teams review and document AI-assisted changes. Risk
          scores, attribution signals, and exported evidence support human
          oversight workflows; they are not a guarantee of code safety,
          regulatory compliance, or certification on their own.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">
          Your data and intellectual property
        </h2>
        <p className="mt-2">
          You retain ownership of your code, repositories, and the data you
          connect. MergeAttest processes pull request metadata, governance
          records, and audit events to provide the service, and does not claim
          ownership of your content. You may export evidence and reports, and
          disconnect the GitHub App, at any time.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">
          Limitation of liability
        </h2>
        <p className="mt-2">
          The service is provided on an &ldquo;as is&rdquo; and &ldquo;as
          available&rdquo; basis without warranties of any kind. To the maximum
          extent permitted by law, MergeAttest is not liable for indirect,
          incidental, or consequential damages, or for decisions made on the
          basis of risk scores, attribution signals, or exported evidence.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">
          Changes to these terms
        </h2>
        <p className="mt-2">
          We may update these terms as the product evolves, particularly when
          paid plans and higher limits are introduced. Material changes will be
          reflected by updating the date at the top of this page; continued use
          after an update constitutes acceptance.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">
          Governing law
        </h2>
        <p className="mt-2">
          {/* TODO (founder/legal): insert the operating entity and governing jurisdiction. */}
          These terms are governed by the laws of the jurisdiction in which the
          operating entity is established, without regard to conflict-of-law
          rules.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">Contact</h2>
        <p className="mt-2">
          Questions about these terms can be sent to{' '}
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
