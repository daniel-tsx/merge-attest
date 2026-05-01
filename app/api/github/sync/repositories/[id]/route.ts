import { NextRequest, NextResponse } from "next/server";
import { ensureCurrentUserOrganization } from "@/lib/auth/session";
import { syncGitHubRepository } from "@/lib/github-sync";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const organization = await ensureCurrentUserOrganization();
  const { id } = await params;

  if (!organization) {
    return NextResponse.json({ error: "Authentication and database access are required." }, { status: 401 });
  }

  const result = await syncGitHubRepository(id, organization.id);
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/x-www-form-urlencoded") && !contentType.includes("multipart/form-data")) {
    return NextResponse.json(result);
  }

  const formData = await request.formData();
  const redirectTo = String(formData.get("redirectTo") ?? `/repositories/${id}`);
  const url = new URL(redirectTo.startsWith("/") ? redirectTo : `/repositories/${id}`, request.url);
  url.searchParams.set("sync", result.mode);

  return NextResponse.redirect(url, { status: 303 });
}
