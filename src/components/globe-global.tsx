import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import createGlobe from "cobe";

export interface GlobeMarker {
  id: string;
  city: string;
  location: [number, number];
}

type LatLng = [number, number];

interface GlobeGlobalProps {
  markers?: GlobeMarker[];
  className?: string;
  speed?: number;
}

const defaultMarkers: GlobeMarker[] = [
  { id: "nyc", city: "New York", location: [40.71, -74.01] },
  { id: "sfo", city: "San Francisco", location: [37.78, -122.44] },
  { id: "sao", city: "São Paulo", location: [-23.55, -46.63] },
  { id: "lon", city: "London", location: [51.51, -0.13] },
  { id: "fra", city: "Frankfurt", location: [50.11, 8.68] },
  { id: "bom", city: "Mumbai", location: [19.07, 72.87] },
  { id: "sin", city: "Singapore", location: [1.35, 103.82] },
  { id: "hkg", city: "Hong Kong", location: [22.32, 114.17] },
  { id: "tyo", city: "Tokyo", location: [35.68, 139.65] },
  { id: "syd", city: "Sydney", location: [-33.86, 151.21] },
];

const cobeMapTexture =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAACAAQAAAADMzoqnAAAECklEQVR42u3VsW4jRRzH8d94gzfF4Q0VQaC4vBLTRTp0mze4ggfAPAE5XQEFsGNAVIjwBrmW7h7gJE+giKjyABTZE4g06LKJETdRJvtD65kdz6yduKABiW+TVfzRf2bXYxtcE/59YJCz6YdbgQF6ACSRrwYKYImmh5PbwOewlV3wlQNbAN6SEExjUOO+BU0aCSnxReHABUlK4YFQeJeUT3da8IIkZ6NGoSnFY5KsMoVzMKfECUnqxgPYRArarmUCndHwzIEaQEpg5xVdBXROl8mpAQx5dUgPiHoYAAkg5w3JABR06byGAVgcRGAz5bznj6phBQNRFwyqgdxebH6gshJAesWoFhgYpApAFoG8BIZ/fEhSox5jDjQXmV0Ar5XJfAIrALi3URVs09gHIL4XJCkLC5LH9JWiArABFCSrQjdgkBzRJ0WJeUOSNyQAfJJwUSWUBRlJQ8oGHATACGlBynnzy2kEYLNjrxouigD8BZcgOeVPqh12RtufaCN5wCPVDpvQ9lsIrqndsJtDcWqBCpf4hWN7OdWHBw58FwIaNOU/n1TpMW2DFaD48cmr4185T8NHkpUFX749pQPVdgRKC/DGoQPVeAEKv+WHvY8OOWNTPRp5kHuwSf8wzXtVBKR7YwEH9H3lQUaypUfSATOALyVNu5vZJW31Bnx98nkLfDUWJaz6ixvm+RIQRdl3kmRxxiaDoGnZW4CpPfkaQadlcPim1xOSvETQo7Lv75enVAXJ3xGUlony4KQBBWUM1NiDc6qhyS8RgQs18OCMMtPDaAUIyg0PZkRWDqs+wnKJBTDI1Js6BolegOsKmUxNDBAAKqQyMQmidhegBlLZ+wwKYdv5M/8x1khkb1cgKqP2H+MKyV5vS+whrE8DQDgAlUAoRBX056EElJCjJVACeJBZgNfVp+iCCm4RBWCgKsRxASSA9KgDhDtCiTuMyfHsKXzhC6wNAIjjWb8LKAOA2ctk3FmCOlgKFy8f1N0JJtgsxinYnVAHt4t3gPzZXSCTyCWCQmBT91QE3B5yarSN40dNHYPka4TlDhTUI8zLvl0JSL3vZn6DsCFZOeB2yROEpR68sECQQA++xIGCR2X7DwlEoLRgUrZrqlUg50S1uy43YqDcN6UFBVkhAjWiCV2Q0jgQPdplMKxvBXodcOfAwJYvgdL+1etA1YJJfBcZlQV7sO1i2gHoNiyxtQ5sBsCgWyoxCHiFFd2L5nUTCqMAqGUgsQ9f5kCcCiZgRYkMgMTd5WsB1rTzj0Em14BE4r+QxN1lCEsVur2PoF5Wbg8RJXR4djgvBgauhLywoEZQrt1KKRdVS4CdlJ8qafyP+9KIj/nE/d7kKwH9jgS72e9DV+kvfTWgct4ZyP8Byb8BPG7MaaIIkAQAAAAASUVORK5CYII=";

// project lat/long onto 2D using current globe phi/theta orientation
function project(
  lat: number,
  lng: number,
  phi: number,
  theta: number,
): { x: number; y: number; visible: boolean } {
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  // 3D point on unit sphere
  const x0 = Math.cos(latRad) * Math.sin(lngRad);
  const y0 = Math.sin(latRad);
  const z0 = Math.cos(latRad) * Math.cos(lngRad);
  // rotate by -phi around Y (longitude offset)
  const cp = Math.cos(-phi);
  const sp = Math.sin(-phi);
  const x1 = cp * x0 + sp * z0;
  const z1 = -sp * x0 + cp * z0;
  // rotate by theta around X (tilt)
  const ct = Math.cos(theta);
  const st = Math.sin(theta);
  const y2 = ct * y0 - st * z1;
  const z2 = st * y0 + ct * z1;
  return { x: x1, y: -y2, visible: z2 > 0.05 };
}

export function GlobeGlobal({
  markers = defaultMarkers,
  className = "",
  speed = 0.003,
}: GlobeGlobalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null);
  const dragOffset = useRef({ phi: 0, theta: 0 });
  const phiOffsetRef = useRef(0);
  const thetaOffsetRef = useRef(0);
  const isPausedRef = useRef(false);

  const [orientation, setOrientation] = useState({ phi: 0, theta: 0.3 });
  const [eventsPerSec, setEventsPerSec] = useState(1284);
  const [pulseKey, setPulseKey] = useState(0);
  const [activeIds, setActiveIds] = useState<string[]>([]);
  const [mapDots, setMapDots] = useState<LatLng[]>([]);

  // Live counter
  useEffect(() => {
    const id = window.setInterval(() => {
      setEventsPerSec((v) => Math.max(900, v + Math.floor(Math.random() * 41) - 18));
    }, 700);
    return () => window.clearInterval(id);
  }, []);

  // Build the same dotted world map used by cobe, so the map remains visible
  // even when WebGL texture brightness varies between browsers.
  useEffect(() => {
    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      const sampler = document.createElement("canvas");
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      sampler.width = width;
      sampler.height = height;

      const context = sampler.getContext("2d");
      if (!context) return;

      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, width, height).data;
      const dots: LatLng[] = [];
      const sampleStep = 3;

      for (let y = 0; y < height; y += sampleStep) {
        for (let x = 0; x < width; x += sampleStep) {
          const value = pixels[(y * width + x) * 4];
          if (value < 18) continue;

          const longitude = (x / (width - 1)) * 360 - 180;
          const latitude = 90 - (y / (height - 1)) * 180;
          dots.push([latitude, longitude]);
        }
      }

      if (!cancelled) setMapDots(dots);
    };
    image.src = cobeMapTexture;

    return () => {
      cancelled = true;
    };
  }, []);

  // Trigger pulses on random markers periodically
  useEffect(() => {
    const tick = () => {
      const n = 2 + Math.floor(Math.random() * 3);
      const picks: string[] = [];
      const pool = [...markers];
      for (let i = 0; i < n && pool.length; i++) {
        picks.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0].id);
      }
      setActiveIds(picks);
      setPulseKey((k) => k + 1);
    };
    tick();
    const id = window.setInterval(tick, 1800);
    return () => window.clearInterval(id);
  }, [markers]);

  const handlePointerDown = useCallback((event: ReactPointerEvent) => {
    pointerInteracting.current = { x: event.clientX, y: event.clientY };
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
    isPausedRef.current = true;
  }, []);

  const handlePointerUp = useCallback(() => {
    if (pointerInteracting.current !== null) {
      phiOffsetRef.current += dragOffset.current.phi;
      thetaOffsetRef.current += dragOffset.current.theta;
      dragOffset.current = { phi: 0, theta: 0 };
    }
    pointerInteracting.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = "grab";
    isPausedRef.current = false;
  }, []);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (pointerInteracting.current !== null) {
        dragOffset.current = {
          phi: (event.clientX - pointerInteracting.current.x) / 300,
          theta: (event.clientY - pointerInteracting.current.y) / 1000,
        };
      }
    };
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [handlePointerUp]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let globe: ReturnType<typeof createGlobe> | null = null;
    let animationId = 0;
    let resizeObserver: ResizeObserver | null = null;
    let phi = 0;
    let frame = 0;

    let globeSize = 0;
    const markerConfig = markers.map((m) => ({
      location: m.location,
      size: 0.08,
      id: m.id,
    }));

    const getContainerSize = () => {
      const rect = container.getBoundingClientRect();
      return Math.floor(Math.min(rect.width, rect.height));
    };

    const updateCanvasSize = (size: number) => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      canvas.width = Math.floor(size * pixelRatio);
      canvas.height = Math.floor(size * pixelRatio);
      return pixelRatio;
    };

    const initGlobe = () => {
      const size = getContainerSize();
      if (size < 120 || globe) return;

      globeSize = size;
      const pixelRatio = updateCanvasSize(size);

      globe = createGlobe(canvas, {
        devicePixelRatio: pixelRatio,
        width: size,
        height: size,
        phi: 0,
        theta: 0.3,
        dark: 1,
        diffuse: 1.6,
        scale: 1.08,
        mapSamples: 16000,
        mapBrightness: 11,
        mapBaseBrightness: 0.08,
        baseColor: [0.55, 0.72, 0.9],
        markerColor: [0.18, 0.85, 0.78],
        glowColor: [0.24, 0.6, 0.68],
        markers: markerConfig,
        opacity: 1,
      });

      const animate = () => {
        if (!globe) return;
        if (!isPausedRef.current) phi += speed;
        const curPhi = phi + phiOffsetRef.current + dragOffset.current.phi;
        const curTheta = 0.3 + thetaOffsetRef.current + dragOffset.current.theta;

        const nextSize = getContainerSize();
        if (nextSize >= 120 && Math.abs(nextSize - globeSize) > 2) {
          globeSize = nextSize;
          const nextPixelRatio = updateCanvasSize(nextSize);
          globe.update({
            width: nextSize,
            height: nextSize,
            devicePixelRatio: nextPixelRatio,
          });
        }

        globe.update({ phi: curPhi, theta: curTheta });
        // Update React state ~10x/s so overlay tracks rotation without re-rendering every frame
        if (frame++ % 6 === 0) setOrientation({ phi: curPhi, theta: curTheta });
        animationId = window.requestAnimationFrame(animate);
      };
      animate();
      window.setTimeout(() => { canvas.style.opacity = "1"; }, 200);
    };

    if (getContainerSize() >= 120) initGlobe();
    else {
      resizeObserver = new ResizeObserver((entries) => {
        const rect = entries[0]?.contentRect;
        if (Math.min(rect?.width ?? 0, rect?.height ?? 0) >= 120) {
          resizeObserver?.disconnect();
          initGlobe();
        }
      });
      resizeObserver.observe(container);
    }

    return () => {
      if (animationId) window.cancelAnimationFrame(animationId);
      resizeObserver?.disconnect();
      globe?.destroy();
    };
  }, [markers, speed]);

  // Project markers to overlay coords (sphere radius ~ 45% of container)
  const projected = useMemo(() => {
    return markers.map((m) => {
      const p = project(m.location[0], m.location[1], orientation.phi, orientation.theta);
      return {
        ...m,
        // center 50%, radius scale ~45%
        left: `${50 + p.x * 45}%`,
        top: `${50 + p.y * 45}%`,
        visible: p.visible,
      };
    });
  }, [markers, orientation]);

  const projectedMapDots = useMemo(() => {
    return mapDots.flatMap(([lat, lng], index) => {
      const point = project(lat, lng, orientation.phi, orientation.theta);
      if (!point.visible) return [];

      return {
        id: `map-dot-${index}`,
        cx: 50 + point.x * 39.5,
        cy: 50 + point.y * 39.5,
        opacity: 0.24 + Math.max(0, point.y * -0.15),
      };
    });
  }, [mapDots, orientation]);

  return (
    <div
      ref={containerRef}
      className={`relative aspect-square min-h-[320px] w-full ${className}`}
    >
      {/* outer glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[-10%] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(45,138,158,0.35), rgba(12,35,64,0.0) 60%)",
          filter: "blur(28px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[4%] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 34% 28%, rgba(20,40,70,0.6), rgba(6,16,31,0.95) 70%, rgba(2,6,12,1) 100%)",
          boxShadow:
            "inset -42px -34px 78px rgba(0,0,0,0.62), 0 0 70px rgba(45,138,158,0.35)",
        }}
      />
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        className="absolute inset-0 h-full w-full touch-none cursor-grab opacity-0 transition-opacity duration-700"
        width={960}
        height={960}
      />

      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
      >
        <defs>
          <radialGradient id="map-dot-fade" cx="42%" cy="36%" r="60%">
            <stop offset="0%" stopColor="rgb(123, 245, 232)" stopOpacity="0.95" />
            <stop offset="72%" stopColor="rgb(45, 138, 158)" stopOpacity="0.72" />
            <stop offset="100%" stopColor="rgb(45, 138, 158)" stopOpacity="0.18" />
          </radialGradient>
        </defs>
        <g filter="drop-shadow(0 0 0.7px rgba(96, 255, 238, 0.65))">
          {projectedMapDots.map((dot) => (
            <circle
              key={dot.id}
              cx={dot.cx}
              cy={dot.cy}
              r="0.18"
              fill="url(#map-dot-fade)"
              opacity={dot.opacity}
            />
          ))}
        </g>
      </svg>


      {/* Pulse overlay */}
      <div className="pointer-events-none absolute inset-0">
        {projected.map((m) => {
          if (!m.visible) return null;
          const isActive = activeIds.includes(m.id);
          return (
            <div
              key={m.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: m.left, top: m.top }}
            >
              {/* core dot */}
              <span
                className="block h-1.5 w-1.5 rounded-full"
                style={{
                  background: "rgb(64, 224, 208)",
                  boxShadow: "0 0 8px rgba(64,224,208,0.9)",
                }}
              />
              {/* pulse rings */}
              {isActive && (
                <>
                  <span
                    key={`r1-${pulseKey}`}
                    className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-1 ring-[rgba(64,224,208,0.8)]"
                    style={{ animation: "globe-pulse 1.6s ease-out forwards" }}
                  />
                  <span
                    key={`r2-${pulseKey}`}
                    className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-1 ring-[rgba(64,224,208,0.6)]"
                    style={{ animation: "globe-pulse 1.6s ease-out 0.35s forwards" }}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* HUD */}
      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
        <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-md">
          <div className="font-display text-2xl leading-none tabular-nums text-white">
            {eventsPerSec.toLocaleString("pt-BR")}
          </div>
          <div className="mt-1 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-white/60">
            eventos/s · simulação
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white/80">
            Live
          </span>
        </div>
      </div>

      <style>{`
        @keyframes globe-pulse {
          0%   { transform: translate(-50%,-50%) scale(1);  opacity: 0.9; }
          100% { transform: translate(-50%,-50%) scale(10); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
