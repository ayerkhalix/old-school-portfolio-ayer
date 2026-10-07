"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type Sound = "click" | "channel" | "power-on" | "power-off";
type AudioGraph = {
  context: AudioContext; master: GainNode; noise: AudioBuffer;
};

export function useAudio() {
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(55);
  const graph = useRef<AudioGraph | null>(null);
  const preferences = useRef({ muted: false, volume: 55 });
  const sync = useCallback(() => {
    const audio = graph.current;
    if (!audio || audio.context.state === "closed") return;
    const { muted, volume } = preferences.current;
    // No continuous source advances this graph while idle. Set the intrinsic
    // gain directly so mute/volume also take effect without a rendering tick.
    audio.master.gain.value = muted || document.hidden ? 0 : volume / 100 * .7;
  }, []);

  // Only brief button/channel/power sounds. No room noise or continuous hum.
  const unlock = useCallback(() => {
    try {
      if (!graph.current) {
        const context = new AudioContext();
        const master = context.createGain(); master.gain.value = 0; master.connect(context.destination);
        const noise = context.createBuffer(1, context.sampleRate * 4, context.sampleRate);
        const samples = noise.getChannelData(0);
        for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
        graph.current = { context, master, noise };
      }
      void graph.current.context.resume().then(sync).catch(() => {});
      sync(); return graph.current;
    } catch { return null; }
  }, [sync]);

  const sound = useCallback((kind: Sound = "click") => {
    if (preferences.current.muted || preferences.current.volume === 0) return;
    const audio = unlock(); if (!audio) return;
    const { context, master, noise } = audio;
    const start = context.currentTime + .005;
    const tone = (from: number, to: number, duration: number, level: number) => {
      const oscillator = context.createOscillator(), gain = context.createGain();
      oscillator.type = "sine"; oscillator.frequency.setValueAtTime(from, start);
      oscillator.frequency.exponentialRampToValueAtTime(to, start + duration);
      gain.gain.setValueAtTime(.0001, start); gain.gain.exponentialRampToValueAtTime(level, start + .007);
      gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
      oscillator.connect(gain); gain.connect(master);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      oscillator.start(start); oscillator.stop(start + duration + .01);
    };
    const burst = (duration: number, level: number, frequency: number) => {
      const source = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain();
      source.buffer = noise; filter.type = "bandpass"; filter.frequency.value = frequency; filter.Q.value = .65;
      gain.gain.setValueAtTime(level, start); gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
      source.connect(filter); filter.connect(gain); gain.connect(master);
      source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
      source.start(start, Math.random() * 2, duration); source.stop(start + duration + .01);
    };
    if (kind === "click") { burst(.025, .24, 2200); tone(390, 170, .04, .07); }
    else if (kind === "channel") { burst(.18, .16, 1800); tone(150, 85, .11, .045); }
    else if (kind === "power-on") { burst(.09, .085, 1100); tone(85, 850, .32, .09); }
    else { burst(.035, .1, 1100); tone(350, 48, .27, .075); }
  }, [unlock]);

  const toggleMute = useCallback(() => {
    const next = !preferences.current.muted;
    preferences.current.muted = next; setMuted(next);
    try { localStorage.setItem("portfolio.muted", String(next)); } catch {}
    if (!next) { unlock(); sound(); } else sync();
  }, [sound, sync, unlock]);
  const unmute = useCallback(() => {
    preferences.current.muted = false; setMuted(false);
    if (preferences.current.volume === 0) {
      preferences.current.volume = 55; setVolume(55);
    }
    try {
      localStorage.setItem("portfolio.muted", "false");
      localStorage.setItem("portfolio.volume", String(preferences.current.volume));
    } catch {}
    unlock(); sync();
  }, [sync, unlock]);
  const changeVolume = useCallback((amount: number) => {
    const next = Math.max(0, Math.min(100, preferences.current.volume + amount));
    preferences.current.volume = next; setVolume(next); sync();
    try { localStorage.setItem("portfolio.volume", String(next)); } catch {}
  }, [sync]);
  useEffect(() => {
    try {
      const savedVolume = Number(localStorage.getItem("portfolio.volume") ?? localStorage.getItem("crt-volume") ?? 55);
      // A saved zero is silence even when the mute switch is off.
      // Preserve audible preferences, but every new visit starts with sound.
      localStorage.setItem("portfolio.muted", "false");
      const initialVolume = Number.isFinite(savedVolume) && savedVolume > 0 ? Math.min(100, savedVolume) : 55;
      preferences.current.volume = initialVolume;
      // Storage is only available after hydration; keep the server default stable.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVolume(initialVolume);
      localStorage.setItem("portfolio.volume", String(initialVolume));
    } catch {}
    const visibility = () => {
      const audio = graph.current; if (!audio) return;
      if (document.hidden) { sync(); void audio.context.suspend().catch(() => {}); }
      else if (!preferences.current.muted) void audio.context.resume().then(sync).catch(() => {});
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      const audio = graph.current; graph.current = null;
      if (audio) void audio.context.close().catch(() => {});
    };
  }, [sync]);
  return { muted, volume, sound, toggleMute, changeVolume, unmute };
}
