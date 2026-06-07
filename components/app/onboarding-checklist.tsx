import {
  ArrowUpRight,
  CheckCircle2,
  Circle,
  LockKeyhole,
  Sparkles,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { OnboardingStatus, OnboardingStep } from '@/lib/onboarding'

function StepIcon({ status }: { status: OnboardingStep['status'] }) {
  if (status === 'complete')
    return <CheckCircle2 className="size-5 text-success" aria-hidden="true" />
  if (status === 'blocked')
    return (
      <LockKeyhole
        className="size-5 text-subtle-foreground"
        aria-hidden="true"
      />
    )
  return <Circle className="size-5 text-accent" aria-hidden="true" />
}

function StepBadge({ status }: { status: OnboardingStep['status'] }) {
  if (status === 'complete')
    return (
      <Badge tone="green" withDot>
        done
      </Badge>
    )
  if (status === 'blocked')
    return (
      <Badge tone="slate" withDot>
        blocked
      </Badge>
    )
  return (
    <Badge tone="blue" withDot>
      next
    </Badge>
  )
}

export function OnboardingChecklist({ status }: { status: OnboardingStatus }) {
  if (status.completed) return null

  const completedCount = status.steps.filter(
    (step) => step.status === 'complete',
  ).length
  const totalCount = status.steps.length
  const progress = Math.round((completedCount / totalCount) * 100)

  return (
    <section className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
      <header className="flex flex-col gap-3 border-b border-border p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-9 items-center justify-center rounded-control bg-accent-soft text-accent">
            <Sparkles className="size-4" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Finish your setup
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Connect GitHub and sync your first repository so MergeAttest can start
              monitoring pull requests.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Progress
            value={progress}
            className="hidden h-1.5 w-32 md:block"
            aria-label="Setup progress"
          />
          <span className="text-xs font-medium tabular-nums text-muted-foreground">
            {completedCount}/{totalCount} complete
          </span>
        </div>
      </header>
      <div className="grid gap-px bg-border lg:grid-cols-4">
        {status.steps.map((step) => (
          <div
            key={step.id}
            className={cn(
              'flex flex-col gap-3 bg-surface p-4',
              step.status === 'complete' && 'bg-success-soft/30',
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <StepIcon status={step.status} />
              <StepBadge status={step.status} />
            </div>
            <div className="min-h-16">
              <h3 className="text-sm font-semibold tracking-tight text-foreground">
                {step.title}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {step.description}
              </p>
            </div>
            {step.actionHref && step.status !== 'complete' ? (
              <Button
                asChild
                size="sm"
                variant={step.status === 'blocked' ? 'secondary' : 'default'}
                className="w-full"
              >
                <a href={step.actionHref}>
                  {step.actionLabel}
                  <ArrowUpRight className="size-3.5" aria-hidden="true" />
                </a>
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  )
}
