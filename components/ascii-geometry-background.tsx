"use client"

import type React from "react"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"

export type AsciiBackgroundMode = "mono" | "ink"

export type AsciiGeometryBackgroundProps = {
  className?: string
  style?: React.CSSProperties

  mode?: AsciiBackgroundMode

  resolutionScale?: number
  glyphSize?: number
  speed?: number
  sceneScale?: number
  warp?: number
  contrast?: number
  scanline?: number

  ramp?: string
}

const DEFAULT_RAMP = " .,:;i1tfLCG08@" // dark -> bright

const fullScreenVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`

const sceneFragment = /* glsl */ `
  precision highp float;

  uniform vec2 uResolution;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uSpeed;
  uniform float uSceneScale;
  uniform float uWarp;

  varying vec2 vUv;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 34.345);
    return fract(p.x * p.y);
  }

  float noise21(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  // Signed distance functions
  float sdCircle(vec2 p, float r) {
    return length(p) - r;
  }

  float sdBox(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
  }

  float sdRoundBox(vec2 p, vec2 b, float r) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
  }

  float sdSegment(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
  }

  float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
  }

  vec2 rot(vec2 p, float a) {
    float c = cos(a);
    float s = sin(a);
    return mat2(c, -s, s, c) * p;
  }

  vec2 tile(vec2 p, float s) {
    return (fract(p / s) - 0.5) * s;
  }

  // Very cheap domain warp (sin/cos, no perlin)
  vec2 warp(vec2 p, float t, float k) {
    vec2 w;
    w.x = sin(p.y * 1.7 + t) + sin(p.x * 1.3 - t * 1.2);
    w.y = cos(p.x * 1.9 - t) + cos(p.y * 1.1 + t * 1.4);
    return p + k * 0.35 * w;
  }

  // Hex-ish grid distance (approx)
  float hexGrid(vec2 p, float s) {
    // axial-ish fold
    p.x *= 0.8660254; // sqrt(3)/2
    p.y += p.x * 0.5773503; // 1/sqrt(3)
    vec2 q = tile(p, s);
    // convert back-ish
    q.y -= q.x * 0.5773503;
    q.x /= 0.8660254;
    float d = sdRoundBox(q, vec2(0.42 * s, 0.24 * s), 0.06 * s);
    return d;
  }

  void main() {
    vec2 uv = vUv;

    // NDC-ish centered coordinates, preserve aspect
    vec2 p = (uv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);

    // subtle parallax
    p += (uMouse - 0.5) * 0.12;

    float period = 24.0;
    float t = mod(uTime * uSpeed, period);

    // scene scale
    p *= uSceneScale;

    // warp
    p = warp(p, t * 0.8, uWarp);

    // Build scene from SDFs
    float a = t * 0.35;

    vec2 p1 = rot(p, a);
    vec2 p2 = rot(p, -a * 1.3);

    float dCircle = sdCircle(p1, 0.55);
    float dBox = sdRoundBox(p2, vec2(0.55, 0.22), 0.08);

    vec2 pg = p;
    pg = rot(pg, a * 0.25);
    float dHex = hexGrid(pg + vec2(0.2, -0.1), 0.55);

    float dLine = sdSegment(p1, vec2(-0.9, 0.0), vec2(0.9, 0.0)) - 0.02;

    float d = dCircle;
    d = smin(d, dBox, 0.22);
    d = smin(d, dHex, 0.16);
    d = smin(d, dLine, 0.08);

    // interference / moire
    float waves = sin(7.0 * p.x + t * 0.9) * sin(6.0 * p.y - t * 0.6);
    float rings = sin(10.0 * length(p) - t * 1.2);

    // distance-based shading (inside brighter)
    float edge = smoothstep(0.02, -0.02, d);
    float glow = exp(-4.0 * abs(d));

    float field = 0.0;
    field += 0.65 * edge;
    field += 0.20 * glow;
    field += 0.12 * (0.5 + 0.5 * waves);
    field += 0.10 * (0.5 + 0.5 * rings);

    // grid microstructure
    float n = noise21(p * 2.5 + t * 0.15);
    field += 0.07 * n;

    // vignette
    float v = smoothstep(1.25, 0.35, length((uv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0)));
    field *= mix(0.65, 1.0, v);

    field = clamp(field, 0.0, 1.0);

    // subtle tone shaping
    field = pow(field, 0.95);

    gl_FragColor = vec4(vec3(field), 1.0);
  }
`

const asciiFragment = /* glsl */ `
  precision highp float;

  uniform vec2 uResolution;
  uniform sampler2D uSceneTex;
  uniform sampler2D uGlyphTex;

  uniform float uGlyphCount;
  uniform float uAtlasCols;
  uniform float uAtlasRows;

  uniform float uGlyphPx;
  uniform float uGlyphAspect;

  uniform float uContrast;
  uniform float uScanline;
  uniform float uInk;

  uniform float uTime;

  varying vec2 vUv;

  float sat(float x) { return clamp(x, 0.0, 1.0); }

  vec3 palette(float l) {
    // crisp, technical green-ish ink, not neon
    vec3 ink = vec3(0.38, 0.98, 0.62);
    vec3 paper = vec3(0.03, 0.04, 0.05);
    return mix(paper, ink, l);
  }

  void main() {
    vec2 frag = gl_FragCoord.xy;

    // Character cell size in pixels
    vec2 cell = vec2(uGlyphPx, uGlyphPx * uGlyphAspect);

    vec2 cellId = floor(frag / cell);
    vec2 cellUv = (cellId + 0.5) * cell / uResolution;

    // Sample the low-res scene at cell center
    float l = texture2D(uSceneTex, cellUv).r;

    // Contrast
    l = sat((l - 0.5) * uContrast + 0.5);

    // Map luminance to glyph index
    float idx = floor(l * (uGlyphCount - 1.0) + 0.5);
    idx = clamp(idx, 0.0, uGlyphCount - 1.0);

    float gx = mod(idx, uAtlasCols);
    float gy = floor(idx / uAtlasCols);

    // Pixel position within the glyph cell (0..1)
    vec2 local = fract(frag / cell);

    // Atlas UV
    vec2 atlasUV;
    atlasUV.x = (gx + local.x) / uAtlasCols;
    atlasUV.y = (gy + local.y) / uAtlasRows;

    float glyph = texture2D(uGlyphTex, atlasUV).r;

    // Nearest feeling / crisp threshold
    glyph = step(0.48, glyph);

    // Scanlines
    float scan = 0.5 + 0.5 * sin((frag.y + uTime * 30.0) * 0.15);
    scan = mix(1.0, scan, uScanline);

    // Grain
    float g = fract(sin(dot(frag + uTime * 60.0, vec2(12.9898, 78.233))) * 43758.5453);
    g = (g - 0.5) * 0.06;

    float inkMask = glyph;
    float base = sat(l + g);

    vec3 colMono = vec3(base) * inkMask;

    vec3 colInk = palette(base) * inkMask;
    // faint glow in ink mode
    colInk += palette(base) * (0.15 * uInk) * smoothstep(0.0, 1.0, base) * (1.0 - inkMask);

    vec3 col = mix(colMono, colInk, uInk);
    col *= scan;

    // Vignette
    vec2 p = (vUv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);
    float vig = smoothstep(1.15, 0.25, length(p));
    col *= mix(0.55, 1.0, vig);

    gl_FragColor = vec4(col, 1.0);
  }
`

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v))
}

function buildGlyphAtlas(params: { ramp: string; fontPx: number; cellPx: number }) {
  const { ramp, fontPx, cellPx } = params

  const glyphs = ramp.split("")
  const count = glyphs.length

  const cols = Math.min(8, count)
  const rows = Math.ceil(count / cols)

  const canvas = document.createElement("canvas")
  canvas.width = cols * cellPx
  canvas.height = rows * cellPx

  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Failed to create glyph atlas context")

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = "black"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.textAlign = "center"
  ctx.textBaseline = "middle"

  // Slightly technical look: mono font, medium weight, no blur.
  ctx.font = `${fontPx}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace`
  ctx.fillStyle = "white"

  for (let i = 0; i < count; i++) {
    const x = (i % cols) * cellPx
    const y = Math.floor(i / cols) * cellPx

    // Small vertical bias so glyphs sit nicely.
    ctx.fillText(glyphs[i], x + cellPx * 0.5, y + cellPx * 0.56)
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.minFilter = THREE.NearestFilter
  tex.magFilter = THREE.NearestFilter
  tex.wrapS = THREE.ClampToEdgeWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.generateMipmaps = false
  tex.needsUpdate = true

  return { texture: tex, cols, rows, count }
}

export function AsciiGeometryBackground(props: AsciiGeometryBackgroundProps) {
  const {
    className,
    style,
    mode = "ink",
    resolutionScale = 0.5,
    glyphSize = 9,
    speed = 1,
    sceneScale = 1,
    warp = 0.75,
    contrast = 1.25,
    scanline = 0.12,
    ramp = DEFAULT_RAMP,
  } = props

  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const params = useMemo(() => {
    return {
      mode,
      resolutionScale: clamp01(resolutionScale),
      glyphSize: Math.max(6, glyphSize),
      speed,
      sceneScale: Math.max(0.25, sceneScale),
      warp: clamp01(warp),
      contrast: Math.max(0.5, contrast),
      scanline: clamp01(scanline),
      ramp,
    }
  }, [mode, resolutionScale, glyphSize, speed, sceneScale, warp, contrast, scanline, ramp])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
      powerPreference: "high-performance",
    })

    // Keep 1:1 pixel ratio for crisp ASCII and perf
    renderer.setPixelRatio(1)

    const sceneA = new THREE.Scene()
    const sceneB = new THREE.Scene()

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    const quad = new THREE.PlaneGeometry(2, 2)

    // Glyph atlas (runtime generated)
    const atlas = buildGlyphAtlas({
      ramp: params.ramp,
      fontPx: 40,
      cellPx: 64,
    })

    const rt = new THREE.WebGLRenderTarget(16, 16, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
      stencilBuffer: false,
      type: THREE.UnsignedByteType,
    })

    const uniformsScene = {
      uResolution: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uSpeed: { value: params.speed },
      uSceneScale: { value: params.sceneScale },
      uWarp: { value: params.warp },
    }

    const matScene = new THREE.ShaderMaterial({
      vertexShader: fullScreenVertex,
      fragmentShader: sceneFragment,
      uniforms: uniformsScene,
    })

    const meshA = new THREE.Mesh(quad, matScene)
    sceneA.add(meshA)

    const uniformsAscii = {
      uResolution: { value: new THREE.Vector2(1, 1) },
      uSceneTex: { value: rt.texture },
      uGlyphTex: { value: atlas.texture },
      uGlyphCount: { value: atlas.count },
      uAtlasCols: { value: atlas.cols },
      uAtlasRows: { value: atlas.rows },
      uGlyphPx: { value: params.glyphSize },
      uGlyphAspect: { value: 1.9 },
      uContrast: { value: params.contrast },
      uScanline: { value: params.scanline },
      uInk: { value: params.mode === "ink" ? 1.0 : 0.0 },
      uTime: { value: 0 },
    }

    const matAscii = new THREE.ShaderMaterial({
      vertexShader: fullScreenVertex,
      fragmentShader: asciiFragment,
      uniforms: uniformsAscii,
      transparent: true,
    })

    const meshB = new THREE.Mesh(quad, matAscii)
    sceneB.add(meshB)

    let raf = 0
    const start = performance.now()

    let mouseX = 0.5
    let mouseY = 0.5
    let targetX = 0.5
    let targetY = 0.5

    const onMouseMove = (e: MouseEvent) => {
      targetX = e.clientX / window.innerWidth
      targetY = 1.0 - e.clientY / window.innerHeight
    }

    window.addEventListener("mousemove", onMouseMove, { passive: true })

    const resize = () => {
      const w = Math.max(1, window.innerWidth)
      const h = Math.max(1, window.innerHeight)

      renderer.setSize(w, h, false)

      uniformsAscii.uResolution.value.set(w, h)

      const rw = Math.max(16, Math.floor(w * params.resolutionScale))
      const rh = Math.max(16, Math.floor(h * params.resolutionScale))
      rt.setSize(rw, rh)
      uniformsScene.uResolution.value.set(rw, rh)
    }

    resize()
    window.addEventListener("resize", resize)

    const tick = () => {
      const now = performance.now()
      const t = (now - start) * 0.001

      // very subtle mouse smoothing
      mouseX += (targetX - mouseX) * 0.06
      mouseY += (targetY - mouseY) * 0.06

      uniformsScene.uTime.value = t
      uniformsScene.uMouse.value.set(mouseX, mouseY)
      uniformsScene.uSpeed.value = params.speed
      uniformsScene.uSceneScale.value = params.sceneScale
      uniformsScene.uWarp.value = params.warp

      uniformsAscii.uTime.value = t
      uniformsAscii.uGlyphPx.value = params.glyphSize
      uniformsAscii.uContrast.value = params.contrast
      uniformsAscii.uScanline.value = params.scanline
      uniformsAscii.uInk.value = params.mode === "ink" ? 1.0 : 0.0

      // Pass A (low res)
      renderer.setRenderTarget(rt)
      renderer.render(sceneA, camera)

      // Pass B (onscreen)
      renderer.setRenderTarget(null)
      renderer.render(sceneB, camera)

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
      window.removeEventListener("mousemove", onMouseMove)

      quad.dispose()
      matScene.dispose()
      matAscii.dispose()
      rt.dispose()
      atlas.texture.dispose()
      renderer.dispose()
    }
  }, [params])

  return (
    <canvas
      ref={canvasRef}
      className={className ?? "fixed inset-0 pointer-events-none"}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -10,
        opacity: 0.32,
        filter: "contrast(0.9) brightness(0.75)",
        WebkitMaskImage:
          "radial-gradient(circle at 50% 40%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.72) 55%, rgba(0,0,0,0.35) 100%)",
        maskImage:
          "radial-gradient(circle at 50% 40%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.72) 55%, rgba(0,0,0,0.35) 100%)",
        ...style,
      }}
    />
  )
}
