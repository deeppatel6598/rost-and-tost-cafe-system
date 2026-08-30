"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Sound cue for a new order.
 *
 * Staff are not staring at the screen — they are at the tawa with their back
 * to the counter. A short two-tone chime is synthesised with WebAudio rather
 * than shipped as an audio file, so there is nothing to load over the canteen
 * wifi and nothing to 404 at the worst moment.
 *
 * Browsers block audio until the user has interacted with the page, so this
 * exposes an `arm` function to call from the first tap.
 */
export function useNewOrderAlert() {
  const ctxRef = useRef<AudioContext | null>(null);

  const arm = useCallback(() => {
    if (ctxRef.current) {
      if (ctxRef.current.state === "suspended") void ctxRef.current.resume();
      return;
    }
    try {
      const Ctor = window.AudioContext ?? (window as any).webkitAudioContext;
      if (Ctor) ctxRef.current = new Ctor();
    } catch {
      /* no audio available — the visual flash still fires */
    }
  }, []);

  const play = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx || ctx.state !== "running") return;

    const now = ctx.currentTime;
    [880, 1174].forEach((frequency, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = frequency;
      const start = now + i * 0.18;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.35, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.18);
    });
  }, []);

  useEffect(() => {
    // Any first interaction unlocks audio for the rest of the shift.
    const onFirstInteraction = () => arm();
    window.addEventListener("pointerdown", onFirstInteraction, { once: true });
    window.addEventListener("keydown", onFirstInteraction, { once: true });
    return () => {
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
    };
  }, [arm]);

  return { arm, play };
}
