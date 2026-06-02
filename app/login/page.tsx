import { ALLOWED_DOMAIN } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  domain_not_allowed: `Access is restricted to @${ALLOWED_DOMAIN} accounts. Please sign in with your corporate Google account.`,
  bad_state:          "Your sign-in session expired. Please try again.",
  not_configured:     "Sign-in is not configured yet. Contact your administrator.",
  invalid_id_token:   "Could not verify your Google account. Please try again.",
  token_exchange_failed: "Google sign-in failed. Please try again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const sp    = await searchParams;
  const error = sp.error ? (ERRORS[sp.error] || "Sign-in failed. Please try again.") : "";
  const next  = sp.next && sp.next.startsWith("/") ? sp.next : "/";
  const loginHref = `/api/auth/login?next=${encodeURIComponent(next)}`;

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#0f2040", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      padding: 24,
    }}>
      <div style={{
        background: "#fff", borderRadius: 18, padding: "40px 36px", width: "100%", maxWidth: 400,
        boxShadow: "0 20px 60px rgba(0,0,0,0.35)", textAlign: "center",
      }}>
        <div style={{
          fontSize: 11, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase",
          color: "#0f2040", marginBottom: 6,
        }}>Smith &amp; Adams Group</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>
          Lead Intelligence
        </h1>
        <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 28px" }}>
          Sign in with your <strong>@{ALLOWED_DOMAIN}</strong> account
        </p>

        {error && (
          <div style={{
            background: "rgba(239,68,68,0.08)", color: "#b91c1c", borderRadius: 10,
            padding: "10px 14px", fontSize: 13, marginBottom: 20, textAlign: "left", lineHeight: 1.5,
          }}>{error}</div>
        )}

        <a href={loginHref} style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #e2e8f0",
          background: "#fff", color: "#1f2937", fontSize: 14, fontWeight: 600,
          textDecoration: "none", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", boxSizing: "border-box",
        }}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Sign in with Google
        </a>

        <p style={{ fontSize: 11, color: "#94a3b8", margin: "24px 0 0" }}>
          Authorized personnel only. Access is logged.
        </p>
      </div>
    </div>
  );
}
