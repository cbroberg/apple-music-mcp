import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) return new Response("GitHub OAuth not configured", { status: 500 });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: "https://music.broberg.dk/api/auth/callback",
    scope: "user:email",
    state: crypto.randomUUID(),
  });

  return NextResponse.redirect(`https://github.com/login/oauth/authorize?${params}`);
}
