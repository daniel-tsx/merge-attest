import { PageHeader } from '@/components/app/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
  const params = await searchParams
  const teamStatus = readParam(params, 'team')
  const organization = await getCurrentOrganization()
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
          <CardContent className="p-4 text-sm text-slate-700">
            {teamMessages[teamStatus]}
          </CardContent>
        </Card>
      ) : null}
      {canManage ? (
        <Card>
          <CardContent className="space-y-4 p-5">
            <div>
              <h2 className="text-base font-semibold text-slate-950">
                Invite teammate
              </h2>
              <p className="text-sm text-slate-500">
                Invites expire after seven days and can be refreshed or revoked.
              </p>
            </div>
            <form
              action="/api/team/invites"
              method="post"
              className="grid gap-3 md:grid-cols-[1fr_180px_auto]"
            >
              <Input
                type="email"
                name="email"
                placeholder="teammate@company.com"
                required
              />
              <select
                name="role"
                defaultValue="member"
                className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
              >
                <option value="admin">Admin</option>
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
              </select>
              <Button type="submit">Send invite</Button>
            </form>
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
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
                  <TableCell className="font-medium text-slate-950">
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
                          <select
                            name="role"
                            defaultValue={member.role}
                            disabled={member.role === 'owner'}
                            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs"
                          >
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                            <option value="viewer">Viewer</option>
                          </select>
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
            <div className="border-t border-slate-200 p-4 text-sm text-slate-600">
              No members found for this workspace. The first signed-in user is
              added as owner automatically.
            </div>
          ) : null}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
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
                  <TableCell className="font-medium text-slate-950">
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
            <div className="border-t border-slate-200 p-4 text-sm text-slate-600">
              No invites have been created yet.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
