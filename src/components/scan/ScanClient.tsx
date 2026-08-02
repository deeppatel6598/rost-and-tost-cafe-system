"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

type Phase = "starting" | "scanning" | "denied" | "unsupported" | "found";

/**
 * Opens the device camera and watches for a table QR code. Only accepts codes
 * that point at an /order/<n> path on this same site — a QR from anywhere
 * else is ignored rather than followed, so pointing the scanner at a random
 * code can't navigate a guest off to an attacker's URL.
 */
export function ScanClient() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const handledRef = useRef(false);

  const [phase, setPhase] = useState<Phase>("starting");
  const [manualTable, setManualTable] = useState("");

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
      if (!/^\/order\/\d+$/.test(target.pathname)) return;

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

  function submitManual(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(manualTable);
    if (Number.isInteger(n) && n > 0) router.push(`/order/${n}`);
  }

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
                    ? "Allow camera access in your browser settings, or enter your table number below."
                    : "This browser can't open the camera. Enter your table number below instead."}
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

          <form onSubmit={submitManual} className="mt-auto grid gap-2 rounded-lg border border-border bg-surface p-4">
            <label htmlFor="manual-table" className="t-overline text-text-faint">
              Can't scan? Enter your table number
            </label>
            <div className="flex gap-2">
              <input
                id="manual-table"
                type="number"
                min={1}
                inputMode="numeric"
                value={manualTable}
                onChange={(e) => setManualTable(e.target.value)}
                placeholder="e.g. 7"
                className="h-11 flex-1 rounded-md border border-border bg-bg px-3"
              />
              <Button type="submit" size="guest" disabled={!manualTable}>
                Go
              </Button>
            </div>
            <p className="t-caption text-text-faint">
              A team member at the counter can confirm your table number if it isn't printed on the code.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
