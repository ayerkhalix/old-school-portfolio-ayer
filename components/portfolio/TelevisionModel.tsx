"use client";
import { useEffect, useRef, useState } from "react";
import type { WebGLRenderer } from "three";

// Render only on resize or power changes; portfolio HTML is independent of WebGL.
export default function TelevisionModel({ powered }: { powered: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const render = useRef<(() => void) | null>(null);
  const light = useRef<{ intensity: number } | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // Small screens use the intentional CSS cabinet and skip the Three.js payload.
    if (window.matchMedia("(max-width: 540px)").matches) return;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2", { alpha: true, antialias: true, powerPreference: "low-power" });
    // Probe first so unavailable graphics quietly use the fallback instead of
    // causing the renderer to emit an avoidable console error.
    if (!context) return;
    let cancelled = false;
    let renderer: WebGLRenderer | undefined;
    let dispose: (() => void) | undefined;
    import("three").then(async T => {
      const { RoundedBoxGeometry } = await import("three/addons/geometries/RoundedBoxGeometry.js");
      if (cancelled || !host.current) return;
      try {
        renderer = new T.WebGLRenderer({ canvas, context, alpha: true, antialias: true, powerPreference: "low-power" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = T.SRGBColorSpace;
        const scene = new T.Scene();
        const camera = new T.OrthographicCamera(-5.5, 5.5, 4, -4, 0.1, 100); camera.position.set(0, 0, 16);
        const grain = new Uint8Array(128 * 128 * 4);
        for (let i = 0; i < grain.length; i += 4) {
          const v = 190 + Math.random() * 45; grain[i] = v; grain[i + 1] = v; grain[i + 2] = v; grain[i + 3] = 255;
        }
        const texture = new T.DataTexture(grain, 128, 128);
        texture.wrapS = texture.wrapT = T.RepeatWrapping; texture.repeat.set(5, 5); texture.needsUpdate = true;
        const plastic = new T.MeshStandardMaterial({ color: 0x7d7770, roughness: 0.85, metalness: 0.1, map: texture, bumpMap: texture, bumpScale: 0.02 });
        const dark = new T.MeshStandardMaterial({ color: 0x12191b, roughness: 0.56, metalness: 0.18 });
        const trim = new T.MeshStandardMaterial({ color: 0x383b3a, roughness: 0.5, metalness: 0.3 });
        const rubber = new T.MeshStandardMaterial({ color: 0x171818, roughness: 0.9 });
        const mesh = (geometry: ConstructorParameters<typeof T.Mesh>[0], material: InstanceType<typeof T.Material>, x: number, y: number, z: number) => {
          const m = new T.Mesh(geometry, material); m.position.set(x, y, z); scene.add(m); return m;
        };
        mesh(new RoundedBoxGeometry(10.45, 7.1, 1.9, 4, 0.38), trim, -0.12, 0.08, -0.9);
        mesh(new RoundedBoxGeometry(10.28, 7.08, 0.55, 4, 0.29), plastic, 0.08, 0.1, 0.1);
        mesh(new RoundedBoxGeometry(8.58, 5.94, 0.4, 5, 0.43), trim, -0.53, 0.37, 0.43);
        mesh(new RoundedBoxGeometry(8.24, 5.64, 0.35, 5, 0.5), dark, -0.53, 0.37, 0.68);
        mesh(new RoundedBoxGeometry(0.83, 4.08, 0.08, 2, 0.04), trim, 4.47, 1.27, 0.43);
        for (let i = 0; i < 26; i++) mesh(new T.BoxGeometry(0.77, 0.075, 0.07), dark, 4.47, 3.18 - i * 0.108, 0.5);
        for (const [y, radius] of [[-1.06, 0.145], [-1.91, 0.34], [-2.73, 0.15]]) {
          mesh(new T.CylinderGeometry(radius * 1.14, radius * 1.14, 0.08, 40), trim, 4.45, y, 0.51).rotation.x = Math.PI / 2;
          mesh(new T.CylinderGeometry(radius, radius, 0.17, 40), rubber, 4.45, y, 0.62).rotation.x = Math.PI / 2;
        }
        mesh(new RoundedBoxGeometry(5.18, 0.47, 0.1, 2, 0.05), dark, -1.7, -3.05, 0.48);
        for (let i = 0; i < 5; i++) mesh(new T.BoxGeometry(5.09, 0.037, 0.06), trim, -1.7, -2.87 - i * 0.085, 0.55);
        mesh(new RoundedBoxGeometry(1.2, 0.43, 0.12, 2, 0.05), trim, 3.16, -3.04, 0.47);
        mesh(new RoundedBoxGeometry(0.82, 0.19, 0.11, 2, 0.04), dark, 3.16, -3.04, 0.57);
        for (const x of [-3.88, 3.8]) mesh(new RoundedBoxGeometry(0.68, 0.39, 0.65, 2, 0.08), rubber, x, -3.58, -0.25);
        const cyan = new T.PointLight(0x69d7f8, 8, 15); cyan.position.set(-4, 1.1, 4); scene.add(cyan); light.current = cyan;
        const amber = new T.DirectionalLight(0xffd7ab, 2.4); amber.position.set(1, 7, 7); scene.add(amber);
        const blue = new T.DirectionalLight(0x618ac9, 1.2); blue.position.set(-8, 1, 4); scene.add(blue);
        const purple = new T.DirectionalLight(0x8578ce, 0.7); purple.position.set(7, 0, 3); scene.add(purple);
        scene.add(new T.AmbientLight(0x838b99, 1.15));
        const el = host.current; el.appendChild(renderer.domElement);
        render.current = () => {
          if (!renderer || cancelled) return;
          renderer.setSize(el.clientWidth, el.clientHeight, false); renderer.render(scene, camera);
        };
        const resize = new ResizeObserver(() => render.current?.()); resize.observe(el);
        const lost = (event: Event) => { event.preventDefault(); setReady(false); };
        const restored = () => { render.current?.(); setReady(true); };
        renderer.domElement.addEventListener("webglcontextlost", lost);
        renderer.domElement.addEventListener("webglcontextrestored", restored);
        render.current(); setReady(true);
        dispose = () => {
          resize.disconnect(); renderer?.domElement.removeEventListener("webglcontextlost", lost);
          renderer?.domElement.removeEventListener("webglcontextrestored", restored);
          scene.traverse(object => { if (object instanceof T.Mesh) object.geometry.dispose(); });
          [plastic, dark, trim, rubber].forEach(m => m.dispose()); texture.dispose();
          renderer?.dispose(); renderer?.domElement.remove(); render.current = null;
        };
      } catch { setReady(false); renderer?.dispose(); }
    }).catch(() => setReady(false));
    return () => { cancelled = true; dispose?.(); };
  }, []);
  useEffect(() => {
    if (light.current) light.current.intensity = powered ? 8 : 1.8;
    render.current?.();
  }, [powered, ready]);
  return <div className={`television-model ${ready ? "model-ready" : ""}`} ref={host} aria-hidden="true" />;
}
