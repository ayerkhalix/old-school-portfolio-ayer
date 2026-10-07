"use client";
import { useEffect, useRef } from "react";
import { Play, Pause, Square, SkipBack, SkipForward } from "lucide-react";
import type { MusicController } from "./useMusic";
const time = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
export default function MusicChannel({ music: m, volume, muted, adjustVolume, active }: { music: MusicController; volume: number; muted: boolean; adjustVolume: (delta: number) => void; active: boolean }) {
  const list = useRef<HTMLOListElement>(null);
  const previousCursor = useRef(m.cursor);
  const wasActive = useRef(active);
  useEffect(() => {
    const changed = previousCursor.current !== m.cursor;
    previousCursor.current = m.cursor;
    // Enter at the player, including when restoring a later track. Scroll the
    // list only when the user moves its selection while this channel is open.
    if (active && wasActive.current && changed) list.current?.querySelector("[data-cursor=true]")?.scrollIntoView({ block: "nearest" });
    wasActive.current = active;
  }, [active, m.cursor]);
  const track = m.tracks[m.trackIndex];
  return <section className="content-channel music-channel" aria-labelledby="music-heading">
    <div className="section-title-row"><div><p className="eyebrow">FM / AFTER HOURS / CONTINUOUS PLAY</p><h2 id="music-heading">Night Radio<span className="cyan">.</span></h2></div><span className="radio-frequency">AKA 08</span></div>
    {!track ? <p className="radio-empty">NO AUDIO SIGNAL.<br />The deck is waiting for its first tape.</p> : <>
      <div className="audio-deck" key={m.refresh}>
        <div className="deck-label"><span>NOW PLAYING</span><span>{muted ? "MUTE" : m.playing ? "PLAY" : "PAUSE"}<i className={m.playing ? "deck-led lit" : "deck-led"} /></span></div>
        <h3>{track.title}</h3><p className="track-artist">{track.artist ?? "UNKNOWN ARTIST"}</p>
        <div className="tape-window" aria-hidden="true"><i className="tape-reel" /><span>STEREO / TYPE I<br />{String(m.trackIndex + 1).padStart(2, "0")} — {String(m.tracks.length).padStart(2, "0")}</span><i className="tape-reel" /></div>
        <label className="deck-progress"><span>{time(m.position)}</span><input aria-label="Track position" type="range" min={0} max={m.duration || 1} step={1} value={Math.min(m.position, m.duration || 1)} disabled={!m.duration} onChange={e => m.seekTo(Number(e.target.value))} /><span>{time(m.duration)}</span></label>
        <div className="deck-controls"><button aria-label="Previous track" onClick={() => m.step(-1)}><SkipBack size={17} /></button><button data-audio-pause={m.playing || undefined} aria-label={m.playing ? "Pause music" : "Play music"} onClick={() => m.playing ? m.pause() : m.playTrack(m.trackIndex)}>{m.playing ? <Pause size={19} /> : <Play size={19} />}</button><button data-audio-pause aria-label="Stop music" onClick={m.stop}><Square size={15} /></button><button aria-label="Next track" onClick={() => m.step(1)}><SkipForward size={17} /></button></div>
      </div>
      <div className="radio-volume"><button aria-label="Music decrease volume" onClick={() => adjustVolume(-5)}>VOL −</button><span>{muted ? "MUTE" : `VOL ${volume}`}</span><button aria-label="Music increase volume" onClick={() => adjustVolume(5)}>VOL +</button></div>
      {m.error && <p className="radio-error" role="status">{m.error}</p>}
      <div className="mini-heading"><span>THE NIGHT ROTATION</span><span>{m.tracks.length} TRACKS / LOOP</span></div>
      <ol ref={list} className="radio-track-list">{m.tracks.map((t, i) => <li key={t.id}><button data-cursor={m.cursor === i} className={`${m.cursor === i ? "cursor" : ""} ${m.trackIndex === i ? "current" : ""}`} aria-label={`Play track ${i + 1}: ${t.title}`} aria-pressed={m.trackIndex === i} onClick={() => m.playTrack(i)}><span>{String(i + 1).padStart(2, "0")}</span><span>{t.title}</span><span aria-hidden="true">{m.trackIndex === i && m.playing ? "▸" : "·"}</span></button></li>)}</ol>
      <p className="control-note">↑ ↓ SELECT · OK PLAY · ← → SEEK 10s · CH ± TRACK</p>
    </>}
  </section>;
}
