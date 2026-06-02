import { SESSION_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

function getOrigin(req: Request): string {
  const h = req.headers;
  const proto = h.get("x-forwarded-proto") || "https";
  const host  = h.get("x-forwarded-host") || h.get("host") || "";
  return `${proto}://${host}`;
}

export async function GET(req: Request) {
  const origin = getOrigin(req);
  const res = Response.redirect(`${origin}/login`, 302);
  res.headers.append("Set-Cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  return res;
}
