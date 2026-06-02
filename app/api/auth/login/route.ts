import { ALLOWED_DOMAIN, STATE_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

function getOrigin(req: Request): string {
  const h = req.headers;
  const proto = h.get("x-forwarded-proto") || "https";
  const host  = h.get("x-forwarded-host") || h.get("host") || "";
  return `${proto}://${host}`;
}

export async function GET(req: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return new Response("Auth not configured", { status: 503 });
  }

  const origin      = getOrigin(req);
  const redirectUri = `${origin}/api/auth/callback`;
  const state       = crypto.randomUUID();

  // Preserve where the user wanted to go (optional ?next=)
  const url  = new URL(req.url);
  const next = url.searchParams.get("next") || "/";

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", `${state}|${next}`);
  authUrl.searchParams.set("hd", ALLOWED_DOMAIN);          // hint: restrict to our workspace
  authUrl.searchParams.set("prompt", "select_account");

  const res = Response.redirect(authUrl.toString(), 302);
  // Store state for CSRF check on callback (10 min).
  res.headers.append(
    "Set-Cookie",
    `${STATE_COOKIE}=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
  );
  return res;
}
