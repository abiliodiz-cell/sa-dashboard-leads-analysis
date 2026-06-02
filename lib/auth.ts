import { SignJWT, jwtVerify } from "jose";

// Only emails on this Google Workspace domain may sign in.
export const ALLOWED_DOMAIN = "smithandadams.com";

export const SESSION_COOKIE = "sa_session";
export const STATE_COOKIE   = "sa_oauth_state";
const SESSION_TTL_SECONDS   = 7 * 24 * 60 * 60; // 7 days

export interface SessionUser {
  email: string;
  name?: string;
  picture?: string;
}

function secretKey(): Uint8Array {
  const s = process.env.AUTH_SECRET || "";
  return new TextEncoder().encode(s);
}

// Auth is only enforced once both the signing secret and Google client are set.
// This lets the app deploy safely before credentials are configured.
export function authConfigured(): boolean {
  return Boolean(process.env.AUTH_SECRET && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ name: user.name, picture: user.picture })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.email)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    const email = String(payload.sub || "");
    if (!email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`)) return null;
    return { email, name: payload.name as string | undefined, picture: payload.picture as string | undefined };
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE = SESSION_TTL_SECONDS;
