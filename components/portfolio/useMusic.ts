"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MusicTrack } from "@/data/music";

export function useMusic(tracks: MusicTrack[], volume: number, muted: boolean, unmute: () => void) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const selected = useRef(0);
  const desiredPlayback = useRef(false);
  const awaitingGesture = useRef(false);
  const failed = useRef(new Set<number>());
  const level = useRef({ volume, muted });
  const fade = useRef<ReturnType<typeof setInterval> | null>(null);
  const advance = useRef<(index: number) => void>(() => {});
  const [trackIndex, setTrackIndex] = useState(0);
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState("");
  const [needsGesture, setNeedsGesture] = useState(false);
  const [refresh, setRefresh] = useState(0);

  const clearFade = useCallback(() => { if (fade.current) clearInterval(fade.current); fade.current = null; }, []);
  const start = useCallback(() => {
    const el = audio.current;
    if (!el || !tracks.length) return;
    desiredPlayback.current = true;
    setError("");
    // HTML audio works independently of the optional Web Audio ambience graph.
    void el.play().then(() => {
      if (audio.current === el) { awaitingGesture.current = false; setNeedsGesture(false); setError(""); }
    }).catch((reason: DOMException) => {
      if (audio.current !== el || !desiredPlayback.current) return;
      if (reason.name === "NotAllowedError" || reason.name === "AbortError") {
        awaitingGesture.current = true; setNeedsGesture(true); setPlaying(false); setError("CLICK ANYWHERE OR PRESS PLAY TO START THE RADIO.");
      } else if (reason.name !== "NotSupportedError") {
        setError("SIGNAL INTERRUPTED. TRY PLAY AGAIN.");
      }
    });
  }, [tracks.length]);

  const load = useCallback((index: number, play = true) => {
    const el = audio.current;
    if (!el || !tracks.length) return;
    const next = (index + tracks.length) % tracks.length;
    selected.current = next; setTrackIndex(next); setCursor(next);
    setPosition(0); setDuration(0); setRefresh(v => v + 1);
    try { localStorage.setItem("portfolio.selectedTrack", tracks[next].id); } catch {}
    clearFade(); el.pause(); el.src = tracks[next].file; el.load();
    el.volume = play ? 0 : level.current.volume / 100;
    el.muted = level.current.muted;
    desiredPlayback.current = play;
    if (play) {
      start();
      // A brief attack smooths manual track cuts without an audio processing graph.
      let step = 0;
      fade.current = setInterval(() => {
        el.volume = level.current.volume / 100 * Math.min(1, ++step / 4);
        if (step >= 4) clearFade();
      }, 40);
    }
  }, [clearFade, start, tracks]);
  useEffect(() => {
    const el = new Audio(); audio.current = el; el.preload = "auto";
    const initial = 0;
    // Illusion is first in the discovered playlist; every visit starts there.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    selected.current = initial; setTrackIndex(initial); setCursor(initial);
    el.volume = level.current.volume / 100; el.muted = level.current.muted;
    if (tracks[initial]) el.src = tracks[initial].file;
    try { if (tracks[initial]) localStorage.setItem("portfolio.selectedTrack", tracks[initial].id); } catch {}
    const update = () => { setPosition(el.currentTime || 0); setDuration(Number.isFinite(el.duration) ? el.duration : 0); };
    const onPlay = () => { awaitingGesture.current = false; setNeedsGesture(false); setPlaying(true); };
    const onPause = () => setPlaying(false);
    const ended = () => advance.current((selected.current + 1) % tracks.length);
    const unavailable = () => {
      failed.current.add(selected.current);
      if (!desiredPlayback.current) { setError("TRACK UNAVAILABLE. SELECT ANOTHER SIGNAL."); return; }
      const next = tracks.findIndex((_, offset) => !failed.current.has((selected.current + 1 + offset) % tracks.length));
      if (next < 0) {
        desiredPlayback.current = false; awaitingGesture.current = false; clearFade(); el.pause();
        setNeedsGesture(false); setPlaying(false); setError("NO AUDIO SIGNAL. THE TRACKS COULD NOT BE LOADED.");
      }
      else advance.current((selected.current + 1 + next) % tracks.length);
    };
    el.addEventListener("timeupdate", update); el.addEventListener("loadedmetadata", update);
    el.addEventListener("playing", onPlay); el.addEventListener("pause", onPause);
    el.addEventListener("ended", ended); el.addEventListener("error", unavailable);
    // Try ordinary audible autoplay. A denial is retried only inside a real
    // gesture; explicit mute/pause/stop controls must not restart the deck.
    const gesture = (event: Event) => {
      if (!awaitingGesture.current || !desiredPlayback.current || level.current.muted) return;
      // Touch activation occurs on release, whereas mouse activation can occur
      // on press. Click also covers assistive technology and button activation.
      if (event instanceof PointerEvent && event.type === "pointerdown" && event.pointerType !== "mouse") return;
      if (event instanceof KeyboardEvent && (event.key.toLowerCase() === "m" || event.ctrlKey || event.altKey || event.metaKey)) return;
      if (event.target instanceof Element && event.target.closest("input, textarea, select, [contenteditable=true], [data-audio-mute], [data-audio-pause]")) return;
      start();
    };
    document.addEventListener("pointerdown", gesture); document.addEventListener("pointerup", gesture);
    document.addEventListener("click", gesture); document.addEventListener("keydown", gesture);
    const autoplay = setTimeout(() => { if (tracks.length) start(); }, 0);
    return () => {
      clearTimeout(autoplay); awaitingGesture.current = false; desiredPlayback.current = false;
      document.removeEventListener("pointerdown", gesture); document.removeEventListener("pointerup", gesture);
      document.removeEventListener("click", gesture); document.removeEventListener("keydown", gesture);
      clearFade(); el.removeEventListener("timeupdate", update); el.removeEventListener("loadedmetadata", update);
      el.removeEventListener("playing", onPlay); el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", ended); el.removeEventListener("error", unavailable);
      el.pause(); el.removeAttribute("src"); el.load(); audio.current = null;
    };
  }, [clearFade, tracks, start]);
  useEffect(() => { advance.current = i => load(i); }, [load]);
  useEffect(() => {
    level.current = { volume, muted };
    if (audio.current) { audio.current.volume = volume / 100; audio.current.muted = muted; }
  }, [volume, muted]);
  const playTrack = useCallback((index: number) => {
    if (!tracks.length) return;
    unmute(); failed.current.clear();
    level.current.muted = false;
    if (level.current.volume === 0) level.current.volume = 55;
    if (audio.current) { audio.current.muted = false; audio.current.volume = level.current.volume / 100; }
    if (index === selected.current && audio.current?.getAttribute("src") && !audio.current.error) start(); else load(index);
  }, [load, start, unmute, tracks.length]);
  const pause = useCallback(() => { desiredPlayback.current = false; awaitingGesture.current = false; setNeedsGesture(false); clearFade(); audio.current?.pause(); }, [clearFade]);
  const stop = useCallback(() => { pause(); if (audio.current) audio.current.currentTime = 0; setPosition(0); }, [pause]);
  const seekTo = useCallback((seconds: number) => {
    const el = audio.current;
    if (el && Number.isFinite(el.duration)) { el.currentTime = Math.max(0, Math.min(el.duration, seconds)); setPosition(el.currentTime); }
  }, []);
  const seek = useCallback((seconds: number) => seekTo((audio.current?.currentTime ?? 0) + seconds), [seekTo]);
  const moveCursor = useCallback((delta: number) => { if (tracks.length) setCursor(i => (i + delta + tracks.length) % tracks.length); }, [tracks.length]);
  const step = useCallback((delta: number) => playTrack((selected.current + delta + tracks.length) % tracks.length), [playTrack, tracks.length]);
  return { tracks, trackIndex, cursor, playing, position, duration, error, needsGesture, refresh, playTrack, pause, stop, seek, seekTo, moveCursor, step };
}
export type MusicController = ReturnType<typeof useMusic>;
