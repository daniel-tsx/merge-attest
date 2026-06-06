import { Fingerprint } from 'lucide-react'
import { AgentBadge } from '@/components/app/status-badge'
import { EmptyState } from '@/components/app/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type {
  AttributionEvidence,
  AttributionSignal,
  AgentSource,
} from '@/lib/types'

const signalLabels: Record<AttributionSignal, string> = {
  commit_trailer: 'Commit trailer',
  bot_account: 'Bot account',
  email_domain: 'Author email',
  branch_prefix: 'Branch prefix',
  label: 'PR label',
  title_keyword: 'Title keyword',
  registry_rule: 'Registry rule',
}

function confidenceTone(confidence: number) {
  if (confidence >= 85) return 'bg-success'
  if (confidence >= 50) return 'bg-accent'
  return 'bg-attention'
}

export function AttributionPanel({
  agentSource,
  aiAssisted,
  confidence,
  evidence,
}: {
  agentSource: AgentSource
  aiAssisted: boolean | null
  confidence: number
  evidence: AttributionEvidence[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="inline-flex items-center gap-2">
          <Fingerprint className="size-4 text-accent" aria-hidden="true" />
          AI attribution
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          How Auteur determined who authored this change.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {aiAssisted === null ? (
              <span className="text-sm text-muted-foreground">
                Authorship unknown
              </span>
            ) : aiAssisted ? (
              <AgentBadge agentSource={agentSource} />
            ) : (
              <span className="text-sm font-medium text-foreground">
                Manual change
              </span>
            )}
          </div>
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {confidence}%
          </span>
        </div>

        {aiAssisted ? (
          <div className="space-y-1.5">
            <Progress
              value={confidence}
              indicatorClassName={confidenceTone(confidence)}
              aria-label={`Attribution confidence ${confidence}%`}
            />
            <p className="text-[11px] text-subtle-foreground">
              Confidence reflects the strongest matching signal.
            </p>
          </div>
        ) : null}

        {evidence.length ? (
          <ul className="space-y-1.5">
            {evidence.map((item, index) => (
              <li
                key={`${item.signal}-${index}`}
                className="flex items-start justify-between gap-3 rounded-control border border-border bg-surface-muted/30 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-subtle-foreground">
                    {signalLabels[item.signal]}
                    {item.agentSource !== agentSource
                      ? ` · ${item.agentSource.replaceAll('_', ' ')}`
                      : ''}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-foreground">
                    {item.detail}
                  </div>
                </div>
                <span className="shrink-0 rounded-pill bg-surface px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground ring-1 ring-border">
                  +{item.weight}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={Fingerprint}
            title="No attribution signals"
            description="No agent fingerprints were detected for this change."
            className="py-6"
          />
        )}
      </CardContent>
    </Card>
  )
}
