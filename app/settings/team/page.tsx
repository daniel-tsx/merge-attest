import { Mail, UserPlus } from 'lucide-react'
import { EmptyState } from '@/components/app/empty-state'
import { PageHeader } from '@/components/app/page-header'
import { SettingsNav } from '@/components/app/settings-nav'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  getCurrentOrganization,
  listTeamInvites,
  listTeamMembers,
} from '@/lib/data/app-data'
import { canManageTeam } from '@/lib/collaboration'
import { formatDate } from '@/lib/utils'

const teamMessages: Record<string, string> = {
  invited: 'Invite created. Share the invite link with your teammate.',
  invite_refreshed: 'Invite refreshed with a new expiration window.',
  invite_revoked: 'Invite revoked.',
  invite_accepted: 'Invite accepted.',
  role_updated: 'Member role updated.',
  member_removed: 'Member removed.',
  forbidden: 'Only owners and admins can manage team settings.',
  invalid_role: 'That role cannot be assigned by your current role.',
  invalid_role_change: 'That role change is not allowed.',
  cannot_remove_member: 'That member cannot be removed.',
  member_exists: 'That email is already a workspace member.',
  invalid_email: 'Enter a valid teammate email address.',
  invite_email_mismatch:
    'This invite is for a different email address. Sign in with the invited email to accept it.',
}

function readParam(
  params: Record<string, string | string[] | undefined> | undefined,
  key: string,
) {
  const value = params?.[key]
  return Array.isArray(value) ? value[0] : value
}

export default async function TeamSettingsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const [params, organization] = await Promise.all([
    searchParams ?? Promise.resolve(undefined),
    getCurrentOrganization(),
  ])
  const teamStatus = readParam(params, 'team')
  const inviteToken = readParam(params, 'inviteToken')
  const inviteEmail = readParam(params, 'inviteEmail')
  const oneTimeInviteUrl =
    inviteToken && inviteEmail
      ? `/api/team/invites/accept?token=${encodeURIComponent(inviteToken)}`
      : null
  const [members, invites] = await Promise.all([
    listTeamMembers(organization.id),
    listTeamInvites(organization.id),
  ])
  const canManage = canManageTeam(organization.role)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Team members"
        description="Invite teammates, manage workspace roles, and track pending or accepted invites."
      />
      <SettingsNav />
      {teamStatus && teamMessages[teamStatus] ? (
        <Card className="border-info-border bg-info-soft/40">
          <CardContent className="space-y-3 text-sm text-info">
            <p>{teamMessages[teamStatus]}</p>
            {oneTimeInviteUrl ? (
              <div className="rounded-control border border-info-border bg-surface p-3 text-foreground">
                <p className="text-xs font-semibold uppercase tracking-wider text-subtle-foreground">
                  One-time invite link for {inviteEmail}
                </p>
                <p className="mt-2 break-all rounded-control bg-surface-subtle p-2 font-mono text-xs">
                  {oneTimeInviteUrl}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  This link is shown only now. Refreshing the invite will rotate
                  it.
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2">
              <UserPlus className="size-3.5" aria-hidden="true" />
              Invite teammate
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Invites expire after seven days and can be refreshed or revoked.
            </p>
          </CardHeader>
          <CardContent>
            <form
              action="/api/team/invites"
              method="post"
              className="grid gap-3 md:grid-cols-[1fr_180px_auto]"
            >
              <label className="space-y-1.5">
                <span className="block text-[11px] font-medium uppercase tracking-wider text-subtle-foreground">
                  Teammate email
                </span>
                <Input
                  type="email"
                  name="email"
                  placeholder="teammate@company.com"
                  autoComplete="email"
                  spellCheck={false}
                  required
                />
              </label>
              <label className="space-y-1.5">
                <span className="block text-[11px] font-medium uppercase tracking-wider text-subtle-foreground">
                  Role
                </span>
                <Select name="role" defaultValue="member">
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </Select>
              </label>
              <Button type="submit" className="md:self-end">
                <Mail aria-hidden="true" />
                Send invite
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <p className="text-xs text-muted-foreground">
            {members.length} {members.length === 1 ? 'person has' : 'people have'}{' '}
            access to this workspace.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <caption className="sr-only">
                Workspace members with role management actions
              </caption>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  {canManage ? (
                    <TableHead className="text-right">Actions</TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium text-foreground">
                      <div className="inline-flex items-center gap-2.5">
                        <span className="flex size-7 items-center justify-center rounded-pill bg-surface-subtle text-[11px] font-semibold uppercase text-subtle-foreground">
                          {member.name?.charAt(0) ?? '?'}
                        </span>
                        {member.name}
                      </div>
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Badge tone={member.role === 'owner' ? 'blue' : 'slate'}>
                        {member.role}
                      </Badge>
                    </TableCell>
                    {canManage ? (
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <form
                            action={`/api/team/members/${member.id}`}
                            method="post"
                            className="flex gap-2"
                          >
                            <input
                              type="hidden"
                              name="_action"
                              value="update_role"
                            />
                            <Select
                              name="role"
                              defaultValue={member.role}
                              disabled={member.role === 'owner'}
                              aria-label={`Role for ${member.name}`}
                              className="h-8 px-2 pr-7 text-xs"
                            >
                              <option value="admin">Admin</option>
                              <option value="member">Member</option>
                              <option value="viewer">Viewer</option>
                            </Select>
                            <Button
                              type="submit"
                              size="sm"
                              variant="secondary"
                              disabled={member.role === 'owner'}
                            >
                              Save
                            </Button>
                          </form>
                          <form
                            action={`/api/team/members/${member.id}`}
                            method="post"
                          >
                            <input type="hidden" name="_action" value="remove" />
                            <Button
                              type="submit"
                              size="sm"
                              variant="danger"
                              disabled={member.role === 'owner'}
                            >
                              Remove
                            </Button>
                          </form>
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {members.length === 0 ? (
              <div className="border-t border-border p-5">
                <EmptyState
                  title="No members yet"
                  description="The first signed-in user is added as owner automatically."
                />
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Invites</CardTitle>
          <p className="text-xs text-muted-foreground">
            Pending and historical workspace invites.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <caption className="sr-only">
                Pending and historical team invites
              </caption>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Invite link</TableHead>
                  {canManage ? (
                    <TableHead className="text-right">Actions</TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell className="font-medium text-foreground">
                      {invite.email}
                    </TableCell>
                    <TableCell className="capitalize">{invite.role}</TableCell>
                    <TableCell>
                      <Badge
                        tone={invite.status === 'pending' ? 'blue' : 'slate'}
                        withDot
                      >
                        {invite.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(invite.expiresAt)}</TableCell>
                    <TableCell className="text-xs text-subtle-foreground">
                      {invite.status === 'pending'
                        ? 'Refresh to issue a new one-time link'
                        : 'n/a'}
                    </TableCell>
                    {canManage ? (
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <form
                            action={`/api/team/invites/${invite.id}`}
                            method="post"
                          >
                            <input
                              type="hidden"
                              name="_action"
                              value="refresh"
                            />
                            <Button
                              type="submit"
                              size="sm"
                              variant="secondary"
                            >
                              Refresh
                            </Button>
                          </form>
                          <form
                            action={`/api/team/invites/${invite.id}`}
                            method="post"
                          >
                            <input type="hidden" name="_action" value="revoke" />
                            <Button type="submit" size="sm" variant="danger">
                              Revoke
                            </Button>
                          </form>
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {invites.length === 0 ? (
              <div className="border-t border-border p-5">
                <EmptyState
                  icon={Mail}
                  title="No invites yet"
                  description="Invite teammates to collaborate on review and approvals."
                />
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
