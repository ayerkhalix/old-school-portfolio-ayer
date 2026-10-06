"use client";
import { useEffect, useRef, useState } from "react";

// Effects use image coordinates, so they remain attached to the artwork when
// the background is cropped. The CSS photograph is always the fallback.
const vertex = `
attribute vec2 position;
varying vec2 uv;
void main() { uv = position * .5 + .5; gl_Position = vec4(position, 0., 1.); }
`;
const fragment = `
precision highp float;
uniform sampler2D room;
uniform vec2 cover;
uniform float time;
varying vec2 uv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x),
             mix(hash(i + vec2(0., 1.)), hash(i + vec2(1.)), f.x), f.y);
}
float cloud(vec2 p) {
  float n = 0., a = .5;
  for (int i = 0; i < 4; i++) { n += a * noise(p); p = p * 2.03 + 7.1; a *= .5; }
  return n;
}
float leaf(vec2 p, vec2 center, vec2 radius) {
  return 1. - smoothstep(.2, 1., length((p - center) / radius));
}
void main() {
  vec2 p = (vec2(uv.x, 1. - uv.y) - .5) * cover + .5;
  vec2 sampleAt = p;
  // Independently phased clusters: the pot and books remain still.
  float upper = leaf(p, vec2(.033, .313), vec2(.042, .043));
  float left = leaf(p, vec2(.056, .396), vec2(.075, .074));
  float right = leaf(p, vec2(.111, .401), vec2(.045, .039));
  float middle = leaf(p, vec2(.070, .479), vec2(.065, .048));
  float hanging = leaf(p, vec2(.142, .576), vec2(.028, .061))
               + leaf(p, vec2(.166, .636), vec2(.023, .040));
  float sway = sin(time * .72) * upper + sin(time * .57 + 1.8) * left
             + sin(time * .83 + 3.2) * right + sin(time * .63 + 4.1) * middle
             + sin(time * .49 + 2.4) * hanging;
  sampleAt += vec2(sway * .0015, sway * .0006);
  vec3 color = texture2D(room, sampleAt).rgb;
  float pool = exp(-dot((p - vec2(.871, .369)) / vec2(.16, .22),
                        (p - vec2(.871, .369)) / vec2(.16, .22)));
  float bulb = leaf(p, vec2(.918, .233), vec2(.073, .04));
  float flicker = sin(time * 1.7) * .015 + sin(time * 4.3 + .8) * .009
                - pow(max(0., sin(time * .67 + sin(time * .23))), 18.) * .065;
  color *= 1. + flicker * (pool + bulb * .7);
  // Slow, low wisps across the desk, behind the television and controls.
  vec2 drift = vec2(p.x * 5. - time * .035, p.y * 9. + time * .018);
  float curl = cloud(drift + vec2(cloud(drift * .7 + time * .015)) * 2.);
  float wisp = smoothstep(.38, .73, curl);
  float band = smoothstep(.73, .83, p.y) * (1. - smoothstep(.91, 1., p.y));
  color = mix(color, vec3(.36, .43, .50), wisp * band * .16);
  gl_FragColor = vec4(color, 1.);
}
`;

export default function AmbientRoom() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [motionEnabled, setMotionEnabled] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const changed = () => setMotionEnabled(!preference.matches);
    changed(); preference.addEventListener("change", changed);
    return () => preference.removeEventListener("change", changed);
  }, []);
  useEffect(() => {
    const element = canvas.current;
    if (!element || !motionEnabled) return;
    const gl = element.getContext("webgl", { alpha: false, antialias: false, depth: false, powerPreference: "low-power" });
    if (!gl) return;
    let disposed = false, frame = 0, previous = 0, elapsed = 0, loaded = false;
    let program: WebGLProgram | null = null;
    let timeLocation: WebGLUniformLocation | null = null;
    const shaders: WebGLShader[] = [];
    const texture = gl.createTexture(), buffer = gl.createBuffer();
    const image = new Image();
    let resizeObserver: ResizeObserver | undefined;
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("Shader unavailable");
      shaders.push(shader); gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error("Ambient shader unavailable");
      return shader;
    };
    const stop = () => { cancelAnimationFrame(frame); frame = 0; previous = 0; };
    const lost = (event: Event) => { event.preventDefault(); stop(); element.classList.remove("ambient-ready"); };
    const cleanup = () => {
      if (disposed) return;
      disposed = true; stop(); resizeObserver?.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      element.removeEventListener("webglcontextlost", lost);
      image.onload = null; image.onerror = null;
      element.classList.remove("ambient-ready");
      gl.useProgram(null); gl.bindTexture(gl.TEXTURE_2D, null); gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.deleteTexture(texture); gl.deleteBuffer(buffer); gl.deleteProgram(program);
      shaders.forEach(shader => gl.deleteShader(shader));
    };
    const draw = () => {
      if (!loaded || disposed || gl.isContextLost()) return;
      gl.uniform1f(timeLocation, elapsed);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (!previous) previous = now;
      const delta = now - previous;
      if (delta < (innerWidth <= 540 ? 1000 / 18 : 1000 / 24)) return;
      elapsed += Math.min(delta, 100) / 1000; previous = now; draw();
    };
    const visibility = () => {
      stop();
      if (!loaded || disposed || gl!.isContextLost()) return;
      if (!document.hidden) { draw(); element.classList.add("ambient-ready"); frame = requestAnimationFrame(tick); }
    };
    try {
      program = gl.createProgram();
      if (!program || !texture || !buffer) throw new Error("Ambient renderer unavailable");
      gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("Ambient renderer unavailable");
      gl.useProgram(program); timeLocation = gl.getUniformLocation(program, "time"); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, "position");
      gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      const resize = () => {
        const { width, height } = element.getBoundingClientRect();
        const scale = Math.min(1, 1600 / Math.max(width, height));
        element.width = Math.max(1, Math.round(width * scale)); element.height = Math.max(1, Math.round(height * scale));
        gl.viewport(0, 0, element.width, element.height);
        const aspect = width / height, sourceAspect = 1672 / 941;
        gl.uniform2f(gl.getUniformLocation(program!, "cover"), Math.min(1, aspect / sourceAspect), Math.min(1, sourceAspect / aspect));
        draw();
      };
      image.onload = () => {
        if (disposed) return;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        loaded = true; resize(); visibility();
      };
      image.src = "/images/room.webp";
      resizeObserver = new ResizeObserver(resize); resizeObserver.observe(element);
      document.addEventListener("visibilitychange", visibility);
      element.addEventListener("webglcontextlost", lost);
    } catch { cleanup(); }
    return cleanup;
  }, [motionEnabled]);
  return <canvas ref={canvas} className="room-ambient" aria-hidden="true" />;
}
