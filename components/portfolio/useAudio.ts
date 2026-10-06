"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type Sound = "click" | "channel" | "power-on" | "power-off";
type AudioGraph = {
  context: AudioContext; master: GainNode; hum: GainNode; noise: AudioBuffer;
  sources: (AudioBufferSourceNode | OscillatorNode)[];
};

export function useAudio(powered: boolean) {
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(35);
  const graph = useRef<AudioGraph | null>(null);
  const preferences = useRef({ muted: true, volume: 35, powered });
  const sync = useCallback(() => {
    const audio = graph.current;
    if (!audio || audio.context.state === "closed") return;
    const { muted, volume, powered } = preferences.current;
    const now = audio.context.currentTime;
    audio.master.gain.cancelScheduledValues(now);
    audio.master.gain.setTargetAtTime(muted || document.hidden ? 0 : volume / 100 * .7, now, .025);
    audio.hum.gain.setTargetAtTime(powered ? .013 : 0, now, .08);
  }, []);

  // Called only by remote/keyboard gestures. A restored preference cannot autoplay.
  const unlock = useCallback(() => {
    try {
      if (!graph.current) {
        const context = new AudioContext();
        const master = context.createGain(); master.gain.value = 0; master.connect(context.destination);
        const noise = context.createBuffer(1, context.sampleRate * 4, context.sampleRate);
        const samples = noise.getChannelData(0);
        for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
        const air = context.createBufferSource(); air.buffer = noise; air.loop = true;
        const lowpass = context.createBiquadFilter(); lowpass.type = "lowpass"; lowpass.frequency.value = 650;
        const highpass = context.createBiquadFilter(); highpass.type = "highpass"; highpass.frequency.value = 90;
        const airGain = context.createGain(); airGain.gain.value = .095;
        air.connect(lowpass); lowpass.connect(highpass); highpass.connect(airGain); airGain.connect(master);
        const breeze = context.createOscillator(); breeze.frequency.value = .09;
        const drift = context.createGain(); drift.gain.value = 170;
        breeze.connect(drift); drift.connect(lowpass.frequency);
        const hum = context.createGain(); hum.gain.value = preferences.current.powered ? .013 : 0; hum.connect(master);
        const fundamental = context.createOscillator(); fundamental.frequency.value = 60; fundamental.connect(hum);
        const overtone = context.createOscillator(); overtone.frequency.value = 120;
        const overtoneGain = context.createGain(); overtoneGain.gain.value = .22;
        overtone.connect(overtoneGain); overtoneGain.connect(hum);
        const sources = [air, breeze, fundamental, overtone];
        graph.current = { context, master, hum, noise, sources };
        sources.forEach(source => source.start());
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
    try { localStorage.setItem("crt-muted", String(next)); } catch {}
    if (!next) { unlock(); sound(); } else sync();
  }, [sound, sync, unlock]);
  const changeVolume = useCallback((amount: number) => {
    const next = Math.max(0, Math.min(100, preferences.current.volume + amount));
    preferences.current.volume = next; setVolume(next); sync();
    try { localStorage.setItem("crt-volume", String(next)); } catch {}
  }, [sync]);
  useEffect(() => { preferences.current.powered = powered; sync(); }, [powered, sync]);
  useEffect(() => {
    try {
      const savedMuted = localStorage.getItem("crt-muted") !== "false";
      const savedVolume = Number(localStorage.getItem("crt-volume") ?? 35);
      preferences.current.muted = savedMuted; setMuted(savedMuted);
      if (Number.isFinite(savedVolume)) {
        preferences.current.volume = Math.max(0, Math.min(100, savedVolume)); setVolume(preferences.current.volume);
      }
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
      if (audio) { audio.sources.forEach(source => { try { source.stop(); } catch {} }); void audio.context.close().catch(() => {}); }
    };
  }, [sync]);
  return { muted, volume, sound, toggleMute, changeVolume };
}
