"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { Spinner } from "@/components/ui/Spinner";

type Phase = "starting" | "scanning" | "denied" | "unsupported" | "found";

/**
 * Opens the device camera and watches for a table QR code. Only accepts codes
 * that point at a /t/<token> path on this same site — a QR from anywhere else
 * is ignored rather than followed, so pointing the scanner at a random sticker
 * on a noticeboard can't navigate a student off to someone else's URL.
 *
 * The token itself is still verified server-side at /t/<token>; matching the
 * shape here only stops the camera from following junk.
 */
export function ScanClient() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const handledRef = useRef(false);

  const [phase, setPhase] = useState<Phase>("starting");

  const stop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const handleDecoded = useCallback(
    (raw: string) => {
      if (handledRef.current) return;
      let target: URL;
      try {
        target = new URL(raw, window.location.origin);
      } catch {
        return;
      }
      if (target.origin !== window.location.origin) return;
      if (!/^\/t\/[A-Za-z0-9_-]{10,64}$/.test(target.pathname)) return;

      handledRef.current = true;
      setPhase("found");
      stop();
      router.push(`${target.pathname}${target.search}`);
    },
    [router, stop],
  );

  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setPhase("unsupported");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setPhase("scanning");
        tick();
      } catch {
        if (!cancelled) setPhase("denied");
      }
    }

    function tick() {
      const video = videoRef.current;
      if (!video || handledRef.current) return;

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const canvas = (canvasRef.current ??= document.createElement("canvas"));
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          // Downscale the frame — jsQR is CPU-bound and a ~400px wide sample
          // decodes a table code reliably without dropping the frame rate.
          const scale = Math.min(1, 400 / video.videoWidth);
          canvas.width = Math.round(video.videoWidth * scale);
          canvas.height = Math.round(video.videoHeight * scale);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(image.data, image.width, image.height, { inversionAttempts: "dontInvert" });
          if (code?.data) handleDecoded(code.data);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    start();
    return () => {
      cancelled = true;
      stop();
    };
  }, [handleDecoded, stop]);

  return (
    <div data-surface="roast" className="min-h-screen bg-[#0a0909]">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col border-x border-roast-600 bg-bg text-text">
        <header className="flex flex-none items-center gap-3 border-b border-border px-[var(--gutter-guest)] py-3.5">
          <span className="t-display-xs">Scan your table</span>
          <Link href="/" className="ml-auto text-[13px] font-medium text-text-faint">
            Site
          </Link>
        </header>

        <div className="flex flex-1 flex-col gap-5 px-[var(--gutter-guest)] py-5">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-surface-sunken">
            <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />

            {phase === "scanning" && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <div className="h-[58%] w-[58%] rounded-xl border-2 border-accent/80 shadow-[0_0_0_2000px_rgba(10,9,9,0.45)]" />
              </div>
            )}

            {phase === "starting" && (
              <div className="absolute inset-0 grid place-items-center">
                <Spinner className="h-7 w-7 text-accent" />
              </div>
            )}

            {(phase === "denied" || phase === "unsupported") && (
              <div className="absolute inset-0 grid place-items-center gap-2 px-6 text-center">
                <span className="t-title-md">
                  {phase === "denied" ? "Camera access blocked" : "Camera not available"}
                </span>
                <span className="t-body-sm text-text-muted">
                  {phase === "denied"
                    ? "Allow camera access in your browser settings, then try again."
                    : "This browser can't open the camera. Please ask a member of staff for help."}
                </span>
              </div>
            )}

            {phase === "found" && (
              <div className="absolute inset-0 grid place-items-center bg-roast-950/70">
                <span className="t-title-md">Opening your menu…</span>
              </div>
            )}
          </div>

          <p className="t-body-sm text-center text-text-muted">
            Point your camera at the QR code printed on your table. The menu opens on its own — no app, no sign-up.
          </p>

          <div className="mt-auto grid gap-2 rounded-lg border border-border bg-surface p-4">
            <span className="t-overline text-text-faint">Can&apos;t scan the code?</span>
            <p className="t-body-sm text-text-muted">
              Table codes are signed, so a table number typed by hand won&apos;t open the menu. Ask a member of
              canteen staff — they can bring you a fresh code or take your order at the counter.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
