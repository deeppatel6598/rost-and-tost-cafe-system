"use client";

import { useEffect } from "react";

/**
 * The last resort: a failure in the root layout itself, where neither the app's
 * fonts nor its stylesheet are available. So this one carries its own inline
 * styling and its own <html> and <body>, and stays deliberately plain.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[render:root]", error.digest ?? error.message);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0909",
          color: "#f5f0e8",
          fontFamily: "system-ui, sans-serif",
          padding: "20px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "360px" }}>
          <h1 style={{ fontSize: "20px", marginBottom: "12px" }}>The canteen app is having trouble</h1>
          <p style={{ fontSize: "15px", lineHeight: 1.5, opacity: 0.8 }}>
            Please order at the counter. Any token you have already been given is still good.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "20px",
              minHeight: "44px",
              padding: "0 20px",
              borderRadius: "8px",
              border: "1px solid #4a4340",
              background: "transparent",
              color: "inherit",
              fontSize: "15px",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
