import { PageHeader } from '@/components/app/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
  const [members, invites] = await Promise.all([
    listTeamMembers(organization.id),
    listTeamInvites(organization.id),
  ])
  const canManage = canManageTeam(organization.role)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Members"
        description="Invite teammates, manage workspace roles, and track pending or accepted invites."
      />
      {teamStatus && teamMessages[teamStatus] ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            {teamMessages[teamStatus]}
          </CardContent>
        </Card>
      ) : null}
      {canManage ? (
        <Card>
          <CardContent className="space-y-4 p-5">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Invite teammate
              </h2>
              <p className="text-sm text-muted-foreground">
                Invites expire after seven days and can be refreshed or revoked.
              </p>
            </div>
            <form
              action="/api/team/invites"
              method="post"
              className="grid gap-3 md:grid-cols-[1fr_180px_auto]"
            >
              <label className="space-y-1.5">
                <span className="block text-xs font-medium text-muted-foreground">
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
                <span className="block text-xs font-medium text-muted-foreground">
                  Role
                </span>
                <Select name="role" defaultValue="member">
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </Select>
              </label>
              <Button type="submit" className="md:self-end">
                Send invite
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <caption className="sr-only">
              Workspace members with role management actions
            </caption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                {canManage ? <TableHead>Actions</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium text-foreground">
                    {member.name}
                  </TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Badge tone={member.role === 'owner' ? 'blue' : 'slate'}>
                      {member.role}
                    </Badge>
                  </TableCell>
                  {canManage ? (
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
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
                            className="h-8 px-2 text-xs"
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
            <div className="border-t border-border p-4 text-sm text-muted-foreground">
              No members found for this workspace. The first signed-in user is
              added as owner automatically.
            </div>
          ) : null}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="overflow-x-auto p-0">
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
                {canManage ? <TableHead>Actions</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.map((invite) => (
                <TableRow key={invite.id}>
                  <TableCell className="font-medium text-foreground">
                    {invite.email}
                  </TableCell>
                  <TableCell>{invite.role}</TableCell>
                  <TableCell>
                    <Badge
                      tone={invite.status === 'pending' ? 'blue' : 'slate'}
                    >
                      {invite.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(invite.expiresAt)}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {invite.status === 'pending' ? invite.inviteUrl : 'n/a'}
                  </TableCell>
                  {canManage ? (
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <form
                          action={`/api/team/invites/${invite.id}`}
                          method="post"
                        >
                          <input type="hidden" name="_action" value="refresh" />
                          <Button type="submit" size="sm" variant="secondary">
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
            <div className="border-t border-border p-4 text-sm text-muted-foreground">
              No invites have been created yet.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
