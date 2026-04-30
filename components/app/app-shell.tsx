import Link from "next/link";
import {
  Activity,
  BadgeCheck,
  Boxes,
  Gauge,
  GitPullRequest,
  KeyRound,
  ListChecks,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { organization } from "@/lib/demo-data";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/repositories", label: "Repositories", icon: Boxes },
  { href: "/pull-requests", label: "Pull Requests", icon: GitPullRequest },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/approvals", label: "Approvals", icon: BadgeCheck },
  { href: "/audit-log", label: "Audit Log", icon: ListChecks },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white md:block">
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-4">
          <div className="flex size-9 items-center justify-center rounded-lg bg-slate-950 text-white">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">AgentGate</div>
            <div className="text-xs text-slate-500">{organization.name}</div>
          </div>
        </div>
        <nav className="space-y-1 p-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950"
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 p-4">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
            <span>Mode</span>
            <Badge tone="blue">demo data</Badge>
          </div>
          <Link href="/settings/github" className="flex items-center gap-2 text-xs font-medium text-slate-700">
            <KeyRound className="size-3.5" />
            Configure GitHub App
          </Link>
        </div>
      </aside>
      <div className="md:pl-64">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-6">
          <div className="font-semibold md:hidden">AgentGate</div>
          <div className="hidden text-sm text-slate-600 md:block">
            Review, test, and approve AI-generated code before it ships.
          </div>
          <Badge tone="slate">Team plan</Badge>
        </header>
        <main className="mx-auto w-full max-w-7xl p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
