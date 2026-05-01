import { NextRequest, NextResponse } from "next/server";
import { ensureCurrentUserOrganization } from "@/lib/auth/session";
import { getPrismaClient } from "@/lib/prisma";

function redirectToSignIn(request: NextRequest) {
  const signInUrl = new URL("/sign-in", request.url);
  signInUrl.searchParams.set("callbackUrl", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(signInUrl);
}

export async function GET(request: NextRequest) {
  const installationId = request.nextUrl.searchParams.get("installation_id");
  const organization = await ensureCurrentUserOrganization();
  const prisma = getPrismaClient();

  if (!organization || !prisma) return redirectToSignIn(request);

  if (!installationId || !/^\d+$/.test(installationId)) {
    const settingsUrl = new URL("/settings/github", request.url);
    settingsUrl.searchParams.set("error", "missing_installation_id");
    return NextResponse.redirect(settingsUrl);
  }

  await prisma.organization.update({
    where: { id: organization.id },
    data: {
      githubInstallationId: installationId,
    },
  });

  await prisma.auditEvent.create({
    data: {
      eventType: "settings_changed",
      actor: "AgentGate",
      summary: "GitHub App installation connected",
      metadata: { installationId },
      organizationId: organization.id,
    },
  });

  const settingsUrl = new URL("/settings/github", request.url);
  settingsUrl.searchParams.set("connected", "true");
  return NextResponse.redirect(settingsUrl);
}
