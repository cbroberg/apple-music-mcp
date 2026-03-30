import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) return new Response("GitHub OAuth not configured", { status: 500 });

  // Derive base URL from the incoming request
  const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${baseUrl}/api/auth/callback`,
    scope: "user:email",
    state: crypto.randomUUID(),
  });

  return NextResponse.redirect(`https://github.com/login/oauth/authorize?${params}`);
}
