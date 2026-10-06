"use client";
import { useCallback, useEffect, useRef, useState } from "react";
export function useAudio() {
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(35);
  const context = useRef<AudioContext | null>(null);
  useEffect(() => {
    try {
      setMuted(localStorage.getItem("crt-muted") !== "false");
      const saved = Number(localStorage.getItem("crt-volume") ?? 35);
      if (Number.isFinite(saved)) setVolume(Math.max(0, Math.min(100, saved)));
    } catch { /* Preferences are optional. */ }
    return () => { void context.current?.close(); };
  }, []);
  const sound = useCallback((kind: "click" | "channel" | "power" = "click", force = false) => {
    if ((muted && !force) || volume === 0) return;
    try {
      context.current ??= new AudioContext(); const ctx = context.current; void ctx.resume();
      const oscillator = ctx.createOscillator(); const gain = ctx.createGain();
      const duration = kind === "click" ? 0.035 : kind === "channel" ? 0.12 : 0.2;
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(kind === "click" ? 460 : kind === "channel" ? 130 : 260, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + duration);
      gain.gain.setValueAtTime(volume / 100 * 0.07, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      oscillator.connect(gain); gain.connect(ctx.destination); oscillator.start(); oscillator.stop(ctx.currentTime + duration);
    } catch { /* Audio is optional. */ }
  }, [muted, volume]);
  const toggleMute = useCallback(() => {
    const next = !muted; setMuted(next);
    try { localStorage.setItem("crt-muted", String(next)); } catch {}
    if (!next) sound("click", true);
  }, [muted, sound]);
  const changeVolume = useCallback((amount: number) => {
    setVolume(previous => {
      const next = Math.max(0, Math.min(100, previous + amount));
      try { localStorage.setItem("crt-volume", String(next)); } catch {}
      return next;
    });
  }, []);
  return { muted, volume, sound, toggleMute, changeVolume };
}
