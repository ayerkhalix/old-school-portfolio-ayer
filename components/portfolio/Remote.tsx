"use client";
import { Maximize, Minimize, Power, Volume2, VolumeX, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Undo2 } from "lucide-react";
import { channels, type Channel } from "@/data/portfolio";
export type RemoteProps = {
  channel: Channel; powered: boolean; fullscreen: boolean; muted: boolean; used: boolean;
  navigate: (channel: Channel) => void; power: () => void; toggleFullscreen: () => void;
  mute: () => void; volume: (amount: number) => void; stepChannel: (amount: number) => void;
  direction: (direction: "left" | "right" | "up" | "down") => void; select: () => void; back: () => void;
};
export default function Remote(p: RemoteProps) {
  return <aside className="remote-area" aria-label="Television remote">
    <div className={`remote-hint ${p.used ? "hint-used" : ""}`}><span>YOUR CONTROLS</span><i />Pick a channel. Make yourself at home.</div>
    <div className="remote">
      <div className="remote-top">
        <span className="remote-brand">AKA<span>UNIVERSAL CONTROL</span></span>
        <button className={`remote-button power-button ${p.powered ? "is-on" : ""}`} aria-label={p.powered ? "Turn television off" : "Turn television on"} aria-pressed={p.powered} onClick={p.power}><Power size={22} strokeWidth={1.7} /></button>
      </div>
      <div className="remote-channel-buttons">
        {channels.map(c => <button key={c.id} className={`remote-button channel-button ${p.channel === c.id ? "selected" : ""}`} onClick={() => p.navigate(c.id)} aria-label={`Tune to ${c.label}`} aria-pressed={p.channel === c.id} title={`${c.label} · ${c.key} key`}><span>{c.label}</span></button>)}
        <button className={`remote-button fullscreen-button ${p.fullscreen ? "selected" : ""}`} onClick={p.toggleFullscreen} aria-label={p.fullscreen ? "Exit fullscreen" : "Enter fullscreen"} aria-pressed={p.fullscreen} title="Fullscreen · F key">{p.fullscreen ? <Minimize size={17} /> : <Maximize size={17} />}<span>FULL</span></button>
      </div>
      <div className="remote-divider" />
      <div className="remote-rockers">
        <div><button className="remote-button" aria-label="Next channel" onClick={() => p.stepChannel(1)}>CH +</button><button className="remote-button" aria-label="Previous channel" onClick={() => p.stepChannel(-1)}>CH −</button></div>
        <div className="rocker-label">CHANNEL<br /><span>VOLUME</span></div>
        <div><button className="remote-button" aria-label="Increase volume" onClick={() => p.volume(10)}>VOL +</button><button className="remote-button" aria-label="Decrease volume" onClick={() => p.volume(-10)}>VOL −</button></div>
      </div>
      <div className="direction-pad" aria-label="Directional controls">
        <button className="remote-button dpad-up" aria-label="Scroll up" onClick={() => p.direction("up")}><ChevronUp /></button>
        <button className="remote-button dpad-left" aria-label="Previous project or channel" onClick={() => p.direction("left")}><ChevronLeft /></button>
        <button className="remote-button dpad-ok" aria-label="Select project" onClick={p.select}>OK</button>
        <button className="remote-button dpad-right" aria-label="Next project or channel" onClick={() => p.direction("right")}><ChevronRight /></button>
        <button className="remote-button dpad-down" aria-label="Scroll down" onClick={() => p.direction("down")}><ChevronDown /></button>
      </div>
      <div className="remote-bottom">
        <button className="remote-button" onClick={p.back} aria-label="Go back"><Undo2 size={15} /><span>BACK</span></button>
        <button className="remote-button" onClick={p.mute} aria-label={p.muted ? "Enable sound" : "Mute sound"} aria-pressed={p.muted} title="Room ambience and remote sounds · M key">{p.muted ? <VolumeX size={15} /> : <Volume2 size={15} />}<span>{p.muted ? "SOUND" : "MUTE"}</span></button>
      </div>
      <div className="remote-model">AK–07 <span>•</span> PORTFOLIO EDITION</div>
    </div>
    <div className="remote-caption">A LITTLE ANALOG. A LOT OF POSSIBILITIES.</div>
  </aside>;
}
