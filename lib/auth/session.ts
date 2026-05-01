import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { isProduction } from "@/lib/env";
import { getPrismaClient } from "@/lib/prisma";
import type { PlanKey } from "@/lib/types";

export type SessionOrganization = {
  userId: string;
  userName: string;
  userEmail: string;
  id: string;
  name: string;
  slug: string;
  planKey: PlanKey;
  githubInstallationId: string | null;
  role: "owner" | "admin" | "member" | "viewer";
};

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return slug || "workspace";
}

export async function getServerSession() {
  try {
    return await auth.api.getSession({
      headers: await headers(),
    });
  } catch (error) {
    if (isProduction()) throw error;
    console.warn("Unable to read auth session; continuing without a session in local mode.", error);
    return null;
  }
}

export async function ensureCurrentUserOrganization(): Promise<SessionOrganization | null> {
  const session = await getServerSession();
  const prisma = getPrismaClient();
  if (!session || !prisma) return null;

  const existingMembership = await prisma.organizationMember.findFirst({
    where: { userId: session.user.id },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });

  if (existingMembership) {
    return {
      userId: session.user.id,
      userName: session.user.name,
      userEmail: session.user.email,
      id: existingMembership.organization.id,
      name: existingMembership.organization.name,
      slug: existingMembership.organization.slug,
      planKey: existingMembership.organization.planKey as PlanKey,
      githubInstallationId: existingMembership.organization.githubInstallationId,
      role: existingMembership.role,
    };
  }

  const workspaceName = `${session.user.name || session.user.email.split("@")[0]}'s workspace`;
  const slugBase = slugify(workspaceName);
  const organization = await prisma.organization.create({
    data: {
      name: workspaceName,
      slug: `${slugBase}-${session.user.id.slice(0, 6)}`,
      planKey: "free",
      members: {
        create: {
          userId: session.user.id,
          role: "owner",
        },
      },
    },
  });

  return {
    userId: session.user.id,
    userName: session.user.name,
    userEmail: session.user.email,
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    planKey: organization.planKey as PlanKey,
    githubInstallationId: organization.githubInstallationId,
    role: "owner",
  };
}
