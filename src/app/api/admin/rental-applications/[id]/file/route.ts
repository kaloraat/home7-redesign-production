import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import TenancyApplication from "@/models/TenancyApplication";
import { applicationFiles } from "@/lib/rentalApplication/files";
import { signedPrivateGet } from "@/lib/s3Private";

/**
 * Staff-only door to a private upload: checks the admin session, checks the
 * key really belongs to this application, then redirects to a presigned
 * link that expires in 5 minutes. The file itself never has a public URL.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const { id } = await params;
  const key = new URL(request.url).searchParams.get("key") ?? "";

  await dbConnect();
  const a = await TenancyApplication.findById(id).select("formVersion v2").lean();
  const file = a?.formVersion === 2 && a.v2 ? applicationFiles(a.v2).find((f) => f.key === key) : undefined;
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const res = NextResponse.redirect(await signedPrivateGet(file.key, file.name), 302);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
