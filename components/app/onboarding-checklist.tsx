import { CheckCircle2, Circle, LockKeyhole } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { OnboardingStatus, OnboardingStep } from '@/lib/onboarding'

function StepIcon({ status }: { status: OnboardingStep['status'] }) {
  if (status === 'complete')
    return <CheckCircle2 className="size-5 text-emerald-600" />
  if (status === 'blocked')
    return <LockKeyhole className="size-5 text-slate-400" />
  return <Circle className="size-5 text-blue-600" />
}

function StepBadge({ status }: { status: OnboardingStep['status'] }) {
  if (status === 'complete') return <Badge tone="green">done</Badge>
  if (status === 'blocked') return <Badge tone="slate">blocked</Badge>
  return <Badge tone="blue">next</Badge>
}

export function OnboardingChecklist({ status }: { status: OnboardingStatus }) {
  if (status.completed) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Finish Setup</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-600">
          Connect GitHub and sync your first repository so AgentGate can start
          monitoring pull requests.
        </p>
        <div className="grid gap-3 lg:grid-cols-4">
          {status.steps.map((step) => (
            <div
              key={step.id}
              className="rounded-md border border-slate-200 p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <StepIcon status={step.status} />
                <StepBadge status={step.status} />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-slate-950">
                {step.title}
              </h3>
              <p className="mt-1 min-h-10 text-sm text-slate-600">
                {step.description}
              </p>
              {step.actionHref && step.status !== 'complete' ? (
                <Button
                  asChild
                  className="mt-3 w-full"
                  size="sm"
                  variant={step.status === 'blocked' ? 'secondary' : 'default'}
                >
                  <a href={step.actionHref}>{step.actionLabel}</a>
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
