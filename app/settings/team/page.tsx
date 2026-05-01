import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCurrentOrganization, listTeamMembers } from "@/lib/data/app-data";

export default async function TeamSettingsPage() {
  const organization = await getCurrentOrganization();
  const members = await listTeamMembers(organization.id);

  return (
    <div className="space-y-6">
      <PageHeader title="Team Members" description="Role-ready membership model for owners, admins, members, and viewers." />
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium text-slate-950">{member.name}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Badge tone={member.role === "owner" ? "blue" : "slate"}>{member.role}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {members.length === 0 ? (
            <div className="border-t border-slate-200 p-4 text-sm text-slate-600">
              No members found for this workspace. The first signed-in user is added as owner automatically.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
