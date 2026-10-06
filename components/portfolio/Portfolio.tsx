"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { Keyboard, Maximize, VolumeX, Volume2, X, Power, ChevronLeft, ChevronRight, Undo2 } from "lucide-react";
import { channels, projects, profile, type Channel } from "@/data/portfolio";
import Channels from "./Channels";
import Remote from "./Remote";
import { useAudio } from "./useAudio";
const TelevisionModel = dynamic(() => import("./TelevisionModel"), { ssr: false });

function hashChannel(): Channel {
  const id = window.location.hash.slice(1).split("/")[0];
  return channels.find(c => c.id === id)?.id ?? "home";
}
export default function Portfolio() {
  const [channel, setChannel] = useState<Channel>("home");
  const [powered, setPowered] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [selected, setSelected] = useState(0);
  const [detail, setDetail] = useState(false);
  const [used, setUsed] = useState(false);
  const [booting, setBooting] = useState(true);
  const [help, setHelp] = useState(false);
  const [volumeVisible, setVolumeVisible] = useState(false);
  const scene = useRef<HTMLDivElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stabilizingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const volumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const current = useRef<Channel>("home");
  const { muted, volume, sound, toggleMute, changeVolume } = useAudio();

  const navigate = useCallback((next: Channel, history = true) => {
    setUsed(true); setPowered(true);
    if (next !== "projects") setDetail(false);
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    if (stabilizingTimer.current) clearTimeout(stabilizingTimer.current);
    if (history && window.location.hash !== `#${next}`) window.history.pushState(null, "", `#${next}`);
    current.current = next;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTransitioning(true); sound("channel");
    transitionTimer.current = setTimeout(() => {
      setChannel(next); if (scroll.current) scroll.current.scrollTop = 0;
      stabilizingTimer.current = setTimeout(() => setTransitioning(false), reduced ? 0 : 180);
    }, reduced ? 0 : 220);
  }, [sound]);
  const stepChannel = useCallback((amount: number) => {
    const index = channels.findIndex(c => c.id === current.current);
    navigate(channels[(index + amount + channels.length) % channels.length].id);
  }, [navigate]);

  const selectProject = useCallback((index: number, open = false) => {
    setSelected(index); setDetail(open); setUsed(true); sound();
    if (scroll.current) scroll.current.scrollTop = 0;
  }, [sound]);
  const direction = useCallback((dir: "left" | "right" | "up" | "down") => {
    setUsed(true); setPowered(true);
    if (dir === "up" || dir === "down") {
      scroll.current?.scrollBy({ top: dir === "up" ? -150 : 150, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }); sound();
    } else if (current.current === "projects") selectProject((selected + (dir === "right" ? 1 : -1) + projects.length) % projects.length, detail);
    else stepChannel(dir === "right" ? 1 : -1);
  }, [detail, selected, selectProject, sound, stepChannel]);
  const select = useCallback(() => {
    setPowered(true); setUsed(true);
    if (current.current === "projects") { setDetail(true); sound(); scroll.current?.scrollTo({ top: 0 }); }
    else if (current.current === "home") navigate("projects");
    else scroll.current?.querySelector<HTMLElement>("a, button")?.focus();
  }, [navigate, sound]);
  const back = useCallback(() => {
    if (detail) { setDetail(false); scroll.current?.scrollTo({ top: 0 }); sound(); }
    else navigate("home");
  }, [detail, navigate, sound]);
  const power = useCallback(() => {
    setUsed(true); sound("power"); setPowered(p => !p);
  }, [sound]);
  const toggleFullscreen = useCallback(async () => {
    setUsed(true); sound();
    if (fullscreen) {
      if (document.fullscreenElement) { try { await document.exitFullscreen(); } catch {} }
      setFullscreen(false);
    } else {
      setFullscreen(true);
      if (scene.current?.requestFullscreen) {
        try { await scene.current.requestFullscreen(); } catch { /* CSS immersive fallback remains active. */ }
      }
    }
  }, [fullscreen, sound]);
  const adjustVolume = useCallback((amount: number) => {
    changeVolume(amount); sound(); setUsed(true); setVolumeVisible(true);
    if (volumeTimer.current) clearTimeout(volumeTimer.current);
    volumeTimer.current = setTimeout(() => setVolumeVisible(false), 1500);
  }, [changeVolume, sound]);

  useEffect(() => {
    const initial = hashChannel(); setChannel(initial); current.current = initial;
    let cancelled = false;
    const image = new window.Image(); image.src = "/images/coast.webp";
    const imageReady = new Promise<void>(resolve => { if (image.complete) resolve(); else { image.onload = () => resolve(); image.onerror = () => resolve(); } });
    // Actual font/image readiness, capped so a slow image never blocks navigation.
    const timeout = setTimeout(() => { if (!cancelled) setBooting(false); }, 1800);
    Promise.all([document.fonts.ready, imageReady]).then(() => { if (!cancelled) { setBooting(false); clearTimeout(timeout); } });
    const changed = () => { if (document.fullscreenElement) setFullscreen(true); else setFullscreen(false); };
    document.addEventListener("fullscreenchange", changed);
    return () => {
      cancelled = true; clearTimeout(timeout); document.removeEventListener("fullscreenchange", changed);
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
      if (stabilizingTimer.current) clearTimeout(stabilizingTimer.current);
      if (volumeTimer.current) clearTimeout(volumeTimer.current);
    };
  }, []);
  useEffect(() => {
    const changed = () => navigate(hashChannel(), false);
    window.addEventListener("hashchange", changed); window.addEventListener("popstate", changed);
    return () => { window.removeEventListener("hashchange", changed); window.removeEventListener("popstate", changed); };
  }, [navigate]);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.matches("input, textarea, select") || target.isContentEditable || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === "Escape") {
        if (help) setHelp(false); else if (detail) back(); else if (fullscreen) void toggleFullscreen();
        return;
      }
      if (event.key === "?") { setHelp(p => !p); return; }
      // Keep native link/button activation and arrow-key focus behavior intact.
      if (target.closest("button, a, [role=dialog]") && (event.key === "Enter" || event.key === " " || event.key.startsWith("Arrow"))) return;
      const shortcuts: Record<string, Channel> = { h: "home", a: "about", p: "projects", e: "experience", s: "skills", w: "awards", c: "contact" };
      const key = event.key.toLowerCase();
      if (shortcuts[key]) { event.preventDefault(); navigate(shortcuts[key]); }
      else if (key === "f") { event.preventDefault(); void toggleFullscreen(); }
      else if (key === "m") toggleMute();
      else if (event.key.startsWith("Arrow")) { event.preventDefault(); direction(event.key.replace("Arrow", "").toLowerCase() as "left" | "right" | "up" | "down"); }
      else if (event.key === "Enter" || event.key === " ") { event.preventDefault(); select(); }
    };
    window.addEventListener("keydown", keydown); return () => window.removeEventListener("keydown", keydown);
  }, [back, detail, direction, fullscreen, help, navigate, select, toggleFullscreen, toggleMute]);
  useEffect(() => {
    const previous = document.body.style.overflow;
    if (fullscreen) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [fullscreen]);

  const index = channels.findIndex(c => c.id === channel);
  return <main>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Person", name: profile.name, jobTitle: profile.role, email: profile.email, sameAs: [profile.github, profile.linkedin], address: { "@type": "PostalAddress", addressLocality: "Puerto Princesa City", addressRegion: "Palawan", addressCountry: "PH" }, subjectOf: projects.map(project => ({ "@type": "CreativeWork", name: project.name, description: project.description, ...(project.live ? { url: project.live } : {}) })) }).replace(/</g, "\\u003c") }} />
    <a className="skip-link" href="#portfolio-screen">Skip to portfolio screen</a>
    <div ref={scene} className={`portfolio-room ${fullscreen ? "immersive" : ""} ${powered ? "powered" : "unpowered"}`}>
      <div className="room-backdrop" aria-hidden="true" /><div className="room-atmosphere" aria-hidden="true" />
      <header className="room-header"><a href="#home" className="wordmark" onClick={e => { e.preventDefault(); navigate("home"); }} aria-label="Ayer Khali Abrio home">aka<span>AN INDEPENDENT DEVELOPER'S FREQUENCY</span></a><div className="room-status"><span className="signal-dot" />{powered ? "ON AIR" : "STANDBY"}<span className="status-divider" />PALAWAN, PH</div></header>
      <div className="main-composition">
        <div className="television-area">
          <div className="television-shadow" aria-hidden="true" />
          <div className="television">
            <img className="tv-fallback" src="/images/tv-cabinet.webp" alt="" aria-hidden="true" width={1434} height={1042} loading="eager" fetchPriority="high" />
            <TelevisionModel powered={powered} />
            <div className="tv-brand" aria-hidden="true">A.K.A.<span>COLOR TELEVISION</span></div>
            <div className={`tv-led ${powered ? "lit" : ""}`} aria-hidden="true" />
            <div id="portfolio-screen" tabIndex={-1} className={`tv-screen ${powered ? "screen-on" : "screen-off"} ${channel === "home" ? "home-screen" : ""} ${transitioning ? "changing-channel" : ""}`}>
              <div className="screen-wallpaper" aria-hidden="true" />
              <div className="screen-interface" inert={!powered}>
                <div className="screen-header"><span>CH {String(index + 1).padStart(2, "0")}</span><span>{channels[index].label.toUpperCase()} <span className="small-play">▸</span></span></div>
                <div className="screen-scroll" ref={scroll} role="region" aria-label={`${channels[index].label} channel content`} tabIndex={0}>
                  {channels.map(c => <div key={c.id} hidden={channel !== c.id} className="channel-view"><Channels channel={c.id} selected={selected} detail={detail} navigate={navigate} selectProject={selectProject} close={() => { setDetail(false); scroll.current?.scrollTo({ top: 0 }); }} /></div>)}
                </div>
                <div className="screen-footer"><span><i className="signal-dot" />{channel === "home" ? "PRESS A BUTTON TO EXPLORE" : detail ? "BACK TO BROWSE · ↑ ↓ TO SCROLL" : "USE THE REMOTE TO EXPLORE"}</span><span className="signal-bars" aria-label="Signal acquired"><i /><i /><i /><i /><i /></span></div>
              </div>
              <div className="crt-scanlines" aria-hidden="true" /><div className="crt-glass" aria-hidden="true" /><div className="crt-static" aria-hidden="true" />
              {!powered && <div className="power-off-message"><span>NO SIGNAL</span><button onClick={power}>PRESS POWER TO TUNE BACK IN</button></div>}
              {booting && powered && <div className="boot-screen" role="status"><span className="eyebrow">AKA / SYSTEM BOOT</span><strong>INITIALIZING DISPLAY...</strong><div className="boot-progress"><span /></div><small>ACQUIRING SIGNAL</small></div>}
              {volumeVisible && powered && <div className="volume-osd" role="status">{muted ? <VolumeX size={18} /> : <Volume2 size={18} />}<span>VOLUME {volume}</span><div><i style={{ width: `${volume}%` }} /></div>{muted && <small>SOUND MUTED</small>}</div>}
            </div>
          </div>
          <div className="television-caption"><span>AKA–01</span><span>GOOD IDEAS. CLEAR SIGNAL.</span><span>EST. IN PALAWAN</span></div>
        </div>
        <Remote channel={channel} powered={powered} fullscreen={fullscreen} muted={muted} used={used} navigate={navigate} power={power} toggleFullscreen={() => void toggleFullscreen()} mute={toggleMute} volume={adjustVolume} stepChannel={stepChannel} direction={direction} select={select} back={back} />
      </div>
      <div className="mobile-controller" aria-label="Compact touch remote">
        <button className="touch-power" aria-label={powered ? "Power off" : "Power on"} onClick={power}><Power size={19} /></button>
        <label className="touch-channel"><span>CHANNEL</span><select aria-label="Choose channel" value={channel} onChange={e => navigate(e.target.value as Channel)}>{channels.map((c, i) => <option key={c.id} value={c.id}>CH {String(i + 1).padStart(2,"0")} · {c.label.toUpperCase()}</option>)}</select></label>
        <button className="touch-prev" aria-label="Touch previous project or channel" onClick={() => direction("left")}><ChevronLeft size={20} /></button>
        <button className="touch-ok" aria-label="Touch select project" onClick={select}>OK</button>
        <button className="touch-next" aria-label="Touch next project or channel" onClick={() => direction("right")}><ChevronRight size={20} /></button>
        <button className="touch-full" aria-label={fullscreen ? "Touch exit fullscreen" : "Touch fullscreen"} onClick={() => void toggleFullscreen()}><Maximize size={17} /></button>
        <button className="touch-mute" aria-label={muted ? "Touch enable sound" : "Touch mute sound"} onClick={toggleMute}>{muted ? <VolumeX size={17} /> : <Volume2 size={17} />}</button>
        <button className="touch-back" aria-label="Touch back" onClick={back}><Undo2 size={17} /></button>
      </div>
      <footer className="room-footer"><span>© {new Date().getFullYear()} {profile.name}<span className="footer-note"> · BUILT WITH INTENTION</span></span><div><button onClick={() => setHelp(true)}><Keyboard size={15} /> KEYBOARD CONTROLS</button><button onClick={() => void toggleFullscreen()}><Maximize size={14} /> {fullscreen ? "EXIT IMMERSIVE" : "GO IMMERSIVE"}</button></div></footer>
      <span className="sr-only" aria-live="polite">{powered ? `Channel ${index + 1}: ${channels[index].label}${detail ? `, ${projects[selected].name} detail` : ""}` : "Television off. Use power or a channel button to return."}</span>
      {help && <HelpDialog close={() => setHelp(false)} />}
      <noscript><div className="noscript-note">This television needs JavaScript for its remote. Reach Ayer at <a href={`mailto:${profile.email}`}>{profile.email}</a> or <a href={profile.github}>GitHub</a>.</div></noscript>
    </div>
  </main>;
}
function HelpDialog({ close }: { close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} className="keyboard-dialog" onCancel={close} onClick={e => { if (e.target === e.currentTarget) close(); }} aria-labelledby="keyboard-heading"><div><button className="dialog-close" onClick={close} aria-label="Close keyboard controls" autoFocus><X size={20} /></button><p className="eyebrow">UNIVERSAL CONTROL</p><h2 id="keyboard-heading">A remote, at your fingertips.</h2><div className="shortcut-list">{channels.map(c => <div key={c.id}><span>{c.label}</span><kbd>{c.key}</kbd></div>)}<div><span>Browse projects / scroll</span><kbd>← ↑ ↓ →</kbd></div><div><span>Select project</span><kbd>ENTER / SPACE</kbd></div><div><span>Fullscreen</span><kbd>F</kbd></div><div><span>Sound</span><kbd>M</kbd></div><div><span>Close / back / exit fullscreen</span><kbd>ESC</kbd></div></div><p className="help-note">Tab moves between controls. Enter activates the focused button.</p></div></dialog>;
}
