/**
 * Response headers for the whole app.
 *
 * Two of these are load-bearing rather than box-ticking. Referrer-Policy is
 * `no-referrer` because this app deliberately puts secrets in URLs — /t/<qr
 * token> and /status/<public token> — and a Referer header would hand those to
 * any third party the browser talks to next. Nothing here needs a referrer.
 *
 * HSTS backs the HTTPS-only requirement: a table QR is scanned on an open
 * campus network, and the first plaintext request is the one worth stealing.
 *
 * The CSP is deliberately narrow in scope. It shuts the doors that cost
 * nothing — framing, plugins, base-tag rewriting, form posts to other origins,
 * and scripts from any other origin.
 *
 * script-src must be written out explicitly and must allow 'unsafe-inline':
 * Next's hydration bootstrap is an inline <script>, and without a nonce
 * pipeline the browser refuses it, leaving every page server-rendered and
 * dead to the touch. That failure is invisible to a server-side test suite —
 * all 151 of ours passed against a build whose CSP had silently disabled
 * React — so any change here has to be re-checked in a real browser.
 *
 * What remains is still worth having: an injected <script src="evil.com">
 * cannot load, and neither can a framed or rewritten page. Tightening inline
 * script execution needs per-request nonces, which is a separate change.
 */
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  poweredByHeader: false,
  // Runs src/instrumentation.ts at server startup, so a deploy missing a
  // secret or a database URL fails at boot rather than per request.
  experimental: { instrumentationHook: true },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
