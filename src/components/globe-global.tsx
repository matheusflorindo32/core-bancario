import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import createGlobe from "cobe";

export interface GlobeMarker {
  id: string;
  city: string;
  location: [number, number];
}

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

  // Live counter
  useEffect(() => {
    const id = window.setInterval(() => {
      setEventsPerSec((v) => Math.max(900, v + Math.floor(Math.random() * 41) - 18));
    }, 700);
    return () => window.clearInterval(id);
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

  const globeGrid = useMemo(
    () =>
      Array.from({ length: 34 }, (_, index) => {
        const y = -0.92 + (index / 33) * 1.84;
        const halfWidth = Math.sqrt(Math.max(0, 1 - y * y));
        return {
          id: `lat-${index}`,
          top: `${50 + y * 42}%`,
          left: `${50 - halfWidth * 42}%`,
          width: `${halfWidth * 84}%`,
          opacity: 0.1 + halfWidth * 0.24,
        };
      }),
    [],
  );

  const globeDots = useMemo(
    () =>
      Array.from({ length: 240 }, (_, index) => {
        const k = index + 0.5;
        const phi = Math.acos(1 - (2 * k) / 240);
        const theta = Math.PI * (1 + Math.sqrt(5)) * k;
        const x = Math.cos(theta) * Math.sin(phi);
        const y = Math.sin(theta) * Math.sin(phi);
        const z = Math.cos(phi);
        const landBias =
          Math.sin((x + 1.3) * 9) +
          Math.cos((y - 0.2) * 7) +
          Math.sin((x + y) * 12);

        return {
          id: `dot-${index}`,
          left: `${50 + x * 41}%`,
          top: `${50 + y * 41}%`,
          opacity: z > -0.55 && landBias > -0.25 ? 0.22 + Math.max(0, z) * 0.38 : 0,
          size: landBias > 1.1 ? 2 : 1.35,
        };
      }),
    [],
  );

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
        className="pointer-events-none absolute inset-[4%] overflow-hidden rounded-full"
        style={{
          background:
            "radial-gradient(circle at 34% 28%, rgba(221,250,255,0.28), rgba(45,138,158,0.12) 32%, rgba(6,16,31,0.92) 70%, rgba(2,6,12,0.98) 100%)",
          boxShadow:
            "inset -42px -34px 78px rgba(0,0,0,0.62), inset 22px 20px 48px rgba(80,220,230,0.12), 0 0 70px rgba(45,138,158,0.35)",
        }}
      >
        <div
          className="absolute inset-0 rounded-full opacity-70"
          style={{
            background:
              "linear-gradient(115deg, transparent 0 44%, rgba(83,220,224,0.18) 45%, transparent 48% 100%), radial-gradient(circle at 62% 44%, rgba(64,224,208,0.22), transparent 18%)",
          }}
        />
        {globeGrid.map((line) => (
          <span
            key={line.id}
            className="absolute h-px rounded-full bg-cyan-100/70"
            style={{
              top: line.top,
              left: line.left,
              width: line.width,
              opacity: line.opacity,
            }}
          />
        ))}
        {Array.from({ length: 18 }, (_, index) => (
          <span
            key={`lon-${index}`}
            className="absolute left-1/2 top-1/2 h-[84%] w-px origin-center -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-100/20"
            style={{ transform: `translate(-50%, -50%) rotate(${index * 10}deg) scaleX(${0.18 + (index % 9) * 0.06})` }}
          />
        ))}
        {globeDots.map((dot) => (
          <span
            key={dot.id}
            className="absolute rounded-full bg-cyan-100"
            style={{
              left: dot.left,
              top: dot.top,
              width: dot.size,
              height: dot.size,
              opacity: dot.opacity,
              boxShadow: dot.opacity ? "0 0 8px rgba(103,232,249,0.55)" : "none",
            }}
          />
        ))}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, transparent 55%, rgba(64,224,208,0.26) 64%, transparent 66%)",
          }}
        />
      </div>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        className="absolute inset-0 h-full w-full touch-none cursor-grab opacity-0 mix-blend-screen transition-opacity duration-700"
        width={960}
        height={960}
      />

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
