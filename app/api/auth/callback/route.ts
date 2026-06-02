import { jwtVerify, createRemoteJWKSet } from "jose";
import {
  ALLOWED_DOMAIN, STATE_COOKIE, SESSION_COOKIE, SESSION_MAX_AGE,
  createSessionToken,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

function getOrigin(req: Request): string {
  const h = req.headers;
  const proto = h.get("x-forwarded-proto") || "https";
  const host  = h.get("x-forwarded-host") || h.get("host") || "";
  return `${proto}://${host}`;
}

function readCookie(req: Request, name: string): string {
  const raw = req.headers.get("cookie") || "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return "";
}

const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export async function GET(req: Request) {
  const origin = getOrigin(req);
  const url    = new URL(req.url);
  const code   = url.searchParams.get("code") || "";
  const stateP = url.searchParams.get("state") || "";
  const err    = url.searchParams.get("error");

  const fail = (msg: string) =>
    Response.redirect(`${origin}/login?error=${encodeURIComponent(msg)}`, 302);

  if (err)   return fail(err);
  if (!code) return fail("missing_code");

  // CSRF: state must match the cookie we set at login.
  const [stateToken, next = "/"] = stateP.split("|");
  const stateCookie = readCookie(req, STATE_COOKIE);
  if (!stateToken || stateToken !== stateCookie) return fail("bad_state");

  const clientId     = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  if (!clientId || !clientSecret) return fail("not_configured");

  // Exchange the authorization code for tokens (server-to-server, TLS).
  let tokenJson: { id_token?: string };
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${origin}/api/auth/callback`,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) return fail("token_exchange_failed");
    tokenJson = await tokenRes.json();
  } catch {
    return fail("token_exchange_error");
  }

  if (!tokenJson.id_token) return fail("no_id_token");

  // Verify the id_token signature + claims against Google's JWKS.
  let email = "", name = "", picture = "", hd = "", emailVerified = false;
  try {
    const { payload } = await jwtVerify(tokenJson.id_token, GOOGLE_JWKS, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: clientId,
    });
    email         = String(payload.email || "");
    name          = String(payload.name || "");
    picture       = String(payload.picture || "");
    hd            = String(payload.hd || "");
    emailVerified = payload.email_verified === true;
  } catch {
    return fail("invalid_id_token");
  }

  // Enforce the corporate domain. Check both the hd claim and the email suffix.
  const domainOk = hd === ALLOWED_DOMAIN || email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`);
  if (!emailVerified || !domainOk) return fail("domain_not_allowed");

  // Issue our own signed session cookie.
  const session = await createSessionToken({ email, name, picture });

  // Only allow same-site relative redirects for `next`.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const res = Response.redirect(`${origin}${safeNext}`, 302);
  res.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=${session}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}`
  );
  // Clear the state cookie.
  res.headers.append("Set-Cookie", `${STATE_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  return res;
}
