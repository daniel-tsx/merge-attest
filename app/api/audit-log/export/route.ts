import { NextResponse } from "next/server";
import { getAuditRetentionStart, serializeAuditEventsToCsv } from "@/lib/audit-export";
import { ensureCurrentUserOrganization } from "@/lib/auth/session";
import { listAuditEvents } from "@/lib/data/app-data";
import { isFeatureAvailable } from "@/lib/plans";

export async function GET() {
  const organization = await ensureCurrentUserOrganization();

  if (!organization) {
    return NextResponse.json({ error: "Authentication and database access are required." }, { status: 401 });
  }

  if (!isFeatureAvailable(organization.planKey, "auditExport")) {
    return NextResponse.json({ error: "Audit exports require the Growth plan or Enterprise." }, { status: 403 });
  }

  const events = await listAuditEvents(organization.id, {
    since: getAuditRetentionStart(organization.planKey),
    take: 10_000,
  });
  const csv = serializeAuditEventsToCsv(events);
  const timestamp = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Disposition": `attachment; filename="agentgate-audit-${timestamp}.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
