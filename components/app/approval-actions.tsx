"use client";

import { useState } from "react";
import { Check, MessageSquare, ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ApprovalActions({ prId }: { prId: string }) {
  const [message, setMessage] = useState("No local decision recorded in this browser session.");

  function recordDecision(decision: string) {
    const value = `Recorded ${decision} for ${prId}. GitHub comment is mocked until credentials are configured.`;
    window.localStorage.setItem(`agentgate:${prId}:approval`, value);
    setMessage(value);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => recordDecision("approval")}>
          <Check />
          Approve
        </Button>
        <Button size="sm" variant="secondary" onClick={() => recordDecision("test request")}>
          <MessageSquare />
          Request tests
        </Button>
        <Button size="sm" variant="secondary" onClick={() => recordDecision("risk acceptance")}>
          <ShieldAlert />
          Accept risk
        </Button>
        <Button size="sm" variant="danger" onClick={() => recordDecision("rejection")}>
          <X />
          Reject
        </Button>
      </div>
      <p className="text-xs text-slate-500">{message}</p>
    </div>
  );
}
