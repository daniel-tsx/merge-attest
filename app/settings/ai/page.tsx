import { BrainCircuit, CheckCircle2, KeyRound, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/app/page-header'
import { SettingsNav } from '@/components/app/settings-nav'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { canManageSettings } from '@/lib/collaboration'
import { getCurrentOrganization } from '@/lib/data/app-data'
import { getOrganizationOpenRouterCredential } from '@/lib/ai/credentials'
import { formatDate } from '@/lib/utils'
import {
  deleteOpenRouterCredential,
  saveOpenRouterCredential,
  verifyStoredOpenRouterCredential,
} from './actions'

const aiMessages: Record<string, string> = {
  openrouter_saved: 'OpenRouter key saved and verified.',
  openrouter_replaced: 'OpenRouter key replaced and verified.',
  openrouter_verified: 'OpenRouter key verified.',
  openrouter_deleted: 'OpenRouter key deleted.',
  missing_key: 'Enter an OpenRouter API key before saving.',
  verification_failed: 'OpenRouter could not verify that key.',
  forbidden: 'Only owners and admins can manage AI provider credentials.',
  not_configured: 'OpenRouter is not configured for this workspace.',
}

function readParam(
  params: Record<string, string | string[] | undefined> | undefined,
  key: string,
) {
  const value = params?.[key]
  return Array.isArray(value) ? value[0] : value
}

export default async function AiSettingsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const [params, organization] = await Promise.all([
    searchParams ?? Promise.resolve(undefined),
    getCurrentOrganization(),
  ])
  const credential = await getOrganizationOpenRouterCredential(organization.id)
  const canManage = canManageSettings(organization.role)
  const aiStatus = readParam(params, 'ai')
  const hasCredential = Boolean(credential)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="AI reviews"
        description="OpenRouter provider access for queued pull request review jobs."
      />
      <SettingsNav />
      {aiStatus && aiMessages[aiStatus] ? (
        <Card
          className={
            aiStatus === 'verification_failed' || aiStatus === 'forbidden'
              ? 'border-danger-border bg-danger-soft/40'
              : 'border-info-border bg-info-soft/40'
          }
        >
          <CardContent
            className={`text-sm ${aiStatus === 'verification_failed' || aiStatus === 'forbidden' ? 'text-danger' : 'text-info'}`}
          >
            {aiMessages[aiStatus]}
          </CardContent>
        </Card>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2">
              <KeyRound className="size-3.5" aria-hidden="true" />
              OpenRouter credential
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-control border border-border bg-surface-muted/30 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
                  Status
                </div>
                <div className="mt-2">
                  <Badge tone={hasCredential ? 'green' : 'slate'} withDot>
                    {hasCredential ? 'configured' : 'missing'}
                  </Badge>
                </div>
              </div>
              <div className="rounded-control border border-border bg-surface-muted/30 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
                  Provider
                </div>
                <div className="mt-2 text-sm font-medium text-foreground">
                  OpenRouter
                </div>
              </div>
              <div className="rounded-control border border-border bg-surface-muted/30 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
                  Last verified
                </div>
                <div className="mt-2 text-sm font-medium text-foreground">
                  {credential?.lastVerifiedAt
                    ? formatDate(credential.lastVerifiedAt.toISOString())
                    : 'Never'}
                </div>
              </div>
            </div>
            {canManage ? (
              <>
                <form action={saveOpenRouterCredential} className="space-y-3">
                  <label className="space-y-1.5">
                    <span className="block text-[11px] font-medium uppercase tracking-wider text-subtle-foreground">
                      API key
                    </span>
                    <Input
                      type="password"
                      name="apiKey"
                      placeholder="sk-or-v1-..."
                      autoComplete="off"
                      spellCheck={false}
                      required
                    />
                  </label>
                  <Button type="submit">
                    <KeyRound aria-hidden="true" />
                    {hasCredential ? 'Replace key' : 'Save key'}
                  </Button>
                </form>
                <Separator />
                <div className="flex flex-wrap gap-2">
                  <form action={verifyStoredOpenRouterCredential}>
                    <Button
                      type="submit"
                      variant="secondary"
                      size="sm"
                      disabled={!hasCredential}
                    >
                      <CheckCircle2 aria-hidden="true" />
                      Verify stored key
                    </Button>
                  </form>
                  <form action={deleteOpenRouterCredential}>
                    <Button
                      type="submit"
                      variant="danger"
                      size="sm"
                      disabled={!hasCredential}
                    >
                      <Trash2 aria-hidden="true" />
                      Delete key
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="rounded-control border border-border bg-surface-muted/30 p-3 text-sm text-muted-foreground">
                You can view provider status, but only owners and admins can
                change stored credentials.
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2">
              <BrainCircuit className="size-3.5" aria-hidden="true" />
              Review queue impact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-control border border-border bg-surface-muted/30 p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
                Queued job behavior
              </div>
              <div className="mt-2 text-foreground">
                {hasCredential
                  ? 'Jobs can pass provider prerequisites.'
                  : 'Jobs stop at blocked until a key is saved.'}
              </div>
            </div>
            <div className="rounded-control border border-border bg-surface-muted/30 p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
                Scope
              </div>
              <div className="mt-2 text-foreground">
                Organization-level credential
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
