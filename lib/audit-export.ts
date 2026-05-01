import { getPlanEntitlements } from "@/lib/entitlements";
import type { AuditEvent, PlanKey } from "@/lib/types";

const auditCsvHeaders = [
  "created_at",
  "event_type",
  "summary",
  "actor",
  "repository",
  "pull_request",
  "metadata",
] as const;

function csvCell(value: string | number | boolean | null | undefined) {
  const stringValue = value === null || value === undefined ? "" : String(value);
  return `"${stringValue.replaceAll('"', '""')}"`;
}

export function getAuditRetentionStart(planKey: PlanKey, now = new Date()) {
  const retentionDays = getPlanEntitlements(planKey).auditRetentionDays;
  if (retentionDays === null) return undefined;

  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - retentionDays);
  return start;
}

export function serializeAuditEventsToCsv(events: AuditEvent[]) {
  const rows = events.map((event) =>
    [
      event.createdAt,
      event.eventType,
      event.summary,
      event.actor ?? "system",
      event.repositoryName ?? "",
      event.pullRequestNumber ? `#${event.pullRequestNumber}` : "",
      JSON.stringify(event.metadata),
    ]
      .map(csvCell)
      .join(","),
  );

  return [auditCsvHeaders.join(","), ...rows].join("\n");
}
