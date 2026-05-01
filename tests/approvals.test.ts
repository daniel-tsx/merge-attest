import { describe, expect, it } from "vitest";
import {
  approvalStatusForDecision,
  approvalSummary,
  auditEventTypeForDecision,
  isApprovalDecision,
} from "../lib/approvals";

describe("approval decisions", () => {
  it("validates supported approval decisions", () => {
    expect(isApprovalDecision("approved")).toBe(true);
    expect(isApprovalDecision("requested_tests")).toBe(true);
    expect(isApprovalDecision("not_required")).toBe(false);
    expect(isApprovalDecision("unknown")).toBe(false);
  });

  it("maps decisions to pull request approval status", () => {
    expect(approvalStatusForDecision("approved")).toBe("approved");
    expect(approvalStatusForDecision("rejected")).toBe("rejected");
    expect(approvalStatusForDecision("risk_accepted")).toBe("risk_accepted");
    expect(approvalStatusForDecision("requested_tests")).toBe("pending");
  });

  it("maps decisions to audit event types", () => {
    expect(auditEventTypeForDecision("approved")).toBe("pr_approved");
    expect(auditEventTypeForDecision("rejected")).toBe("pr_rejected");
    expect(auditEventTypeForDecision("risk_accepted")).toBe("risk_accepted");
    expect(auditEventTypeForDecision("requested_tests")).toBe("approval_requested");
  });

  it("creates human-readable summaries", () => {
    expect(approvalSummary("risk_accepted", 42)).toBe("Pull request #42 risk accepted");
  });
});
