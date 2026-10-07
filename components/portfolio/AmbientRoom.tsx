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
uniform float lamp;
varying vec2 uv;
float leaf(vec2 p, vec2 center, vec2 radius) {
  return 1. - smoothstep(.2, 1., length((p - center) / radius));
}
void main() {
  vec2 p = (vec2(uv.x, 1. - uv.y) - .5) * cover + .5;
  vec2 sampleAt = p;
  vec3 color = texture2D(room, sampleAt).rgb;
  float pool = exp(-dot((p - vec2(.871, .369)) / vec2(.16, .22),
                        (p - vec2(.871, .369)) / vec2(.16, .22)));
  float bulb = leaf(p, vec2(.918, .233), vec2(.073, .04));
  color *= 1. + lamp * (pool + bulb * .7);
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
    let disposed = false, loaded = false, lamp = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
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
    const stop = () => { clearTimeout(timer); lamp = 0; };
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
      gl.uniform1f(timeLocation, lamp);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    const schedule = () => {
      timer = setTimeout(() => {
        const levels = [-.025 - Math.random() * .015, .006, -.02 - Math.random() * .025, 0];
        let step = 0;
        const flicker = () => {
          if (disposed || document.hidden || gl.isContextLost()) return;
          lamp = levels[step++]; draw();
          if (step < levels.length) timer = setTimeout(flicker, 35 + Math.random() * 45);
          else schedule();
        };
        flicker();
      }, 4000 + Math.random() * 3000);
    };
    const visibility = () => {
      stop();
      if (!loaded || disposed || gl!.isContextLost()) return;
      if (!document.hidden) { draw(); element.classList.add("ambient-ready"); schedule(); }
    };
    try {
      program = gl.createProgram();
      if (!program || !texture || !buffer) throw new Error("Ambient renderer unavailable");
      gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("Ambient renderer unavailable");
      gl.useProgram(program); timeLocation = gl.getUniformLocation(program, "lamp"); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
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
