"use client";

import { useEffect } from "react";
import { Fallback } from "@/components/ui/Fallback";

/**
 * Catches a render failure anywhere below the root layout. Without this the
 * student sees Next's unstyled "Application error" screen mid-order.
 *
 * The digest is logged, never shown: it means nothing to a student and the
 * server log is where it can actually be matched to a request.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[render]", error.digest ?? error.message);
  }, [error]);

  return (
    <Fallback
      title="Something went wrong"
      message="Your order hasn't been lost — any token already given to you is still good at the counter. Try again, or ask a member of staff."
      action={{ onRetry: reset, label: "Try again" }}
    />
  );
}
