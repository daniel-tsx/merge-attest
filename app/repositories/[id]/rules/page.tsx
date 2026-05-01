import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/app/page-header'
import { RiskBadge } from '@/components/app/status-badge'
import { Card, CardContent } from '@/components/ui/card'
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
  getRepository,
  getRepositoryRules,
} from '@/lib/data/app-data'
import { formatDate } from '@/lib/utils'

export default async function RepositoryRulesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const organization = await getCurrentOrganization()
  const repository = await getRepository(organization.id, id)
  if (!repository) notFound()
  const rules = await getRepositoryRules(organization.id, id)

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${repository.name} Rules`}
        description="Lightweight approval and merge safety rules evaluated against every synced pull request."
      />
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="min-w-96">
                    <div className="font-medium text-slate-950">
                      {rule.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {rule.description}
                    </div>
                  </TableCell>
                  <TableCell>{rule.triggerType.replaceAll('_', ' ')}</TableCell>
                  <TableCell>{rule.actionType.replaceAll('_', ' ')}</TableCell>
                  <TableCell>
                    <RiskBadge level={rule.severity} />
                  </TableCell>
                  <TableCell>{rule.enabled ? 'enabled' : 'disabled'}</TableCell>
                  <TableCell>{formatDate(rule.updatedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
