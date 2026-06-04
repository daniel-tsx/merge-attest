import { ShieldCheck, UserCheck } from 'lucide-react'
import { AgentBadge } from '@/components/app/status-badge'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AgentSource, Attestation } from '@/lib/types'
import { formatDate } from '@/lib/utils'

export function AccountabilityPanel({
  agentSource,
  headSha,
  requiresAttestation,
  attestations,
}: {
  agentSource: AgentSource
  headSha?: string | null
  requiresAttestation: boolean
  attestations: Attestation[]
}) {
  const currentAttestations = attestations.filter(
    (attestation) => attestation.headSha === headSha,
  )
  const signed = currentAttestations.length > 0
  const displayedAttestations = signed ? currentAttestations : attestations

  return (
    <Card
      className={
        requiresAttestation && !signed
          ? 'border-attention-border bg-attention-soft/20'
          : undefined
      }
    >
      <CardHeader>
        <CardTitle className="inline-flex items-center gap-2">
          <UserCheck className="size-4 text-accent" aria-hidden="true" />
          Human accountability
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          A named human takes responsibility for this AI-authored change.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <AgentBadge agentSource={agentSource} />
          {signed ? (
            <Badge tone="green" withDot>
              signed off
            </Badge>
          ) : requiresAttestation ? (
            <Badge tone="orange" withDot>
              required — awaiting sign-off
            </Badge>
          ) : (
            <Badge tone="slate" withDot>
              not recorded
            </Badge>
          )}
        </div>

        {!signed ? (
          <p className="text-xs text-muted-foreground">
            {requiresAttestation
              ? 'Policy requires a human sign-off before this change is accountable. Approve or accept risk with the responsibility box checked to record it.'
              : 'No human accountability sign-off has been recorded for this commit. Check the responsibility box when approving to capture one.'}
          </p>
        ) : null}

        {displayedAttestations.length > 0
          ? displayedAttestations.map((attestation) => (
              <div
                key={attestation.id}
                className="rounded-control border border-border bg-surface-muted/30 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <ShieldCheck
                      className="size-3.5 text-success"
                      aria-hidden="true"
                    />
                    {attestation.reviewerName}
                  </span>
                  <span className="text-xs text-subtle-foreground">
                    {formatDate(attestation.createdAt)}
                  </span>
                </div>
                {attestation.headSha !== headSha ? (
                  <Badge tone="slate" className="mt-2">
                    previous commit
                  </Badge>
                ) : null}
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {attestation.statement}
                </p>
                {attestation.headSha ? (
                  <p className="mt-1 font-mono text-[11px] text-subtle-foreground">
                    commit {attestation.headSha.slice(0, 7)}
                  </p>
                ) : null}
              </div>
            ))
          : null}
      </CardContent>
    </Card>
  )
}
