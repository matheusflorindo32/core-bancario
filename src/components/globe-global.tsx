import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import createGlobe from "cobe";

export interface GlobeMarker {
  id: string;
  name: string;
  status: string;
  meta: string;
  location: [number, number];
}

interface GlobeGlobalProps {
  markers?: GlobeMarker[];
  className?: string;
  speed?: number;
}

const defaultMarkers: GlobeMarker[] = [
  { id: "domain", name: "Domain", status: "STABLE", meta: "núcleo", location: [-23.55, -46.63] },
  { id: "application", name: "Application", status: "COVERED", meta: "use cases", location: [40.71, -74.01] },
  { id: "infra", name: "Infrastructure", status: "ADAPTERS", meta: "DB · HTTP", location: [51.51, -0.13] },
  { id: "presentation", name: "Presentation", status: "API", meta: "REST", location: [35.68, 139.65] },
  { id: "tests", name: "Tests", status: "92% COV", meta: "vitest", location: [37.78, -122.44] },
  { id: "docs", name: "Docs", status: "ADRs", meta: "by layer", location: [-33.86, 151.21] },
];

export function GlobeGlobal({
  markers = defaultMarkers,
  className = "",
  speed = 0.0025,
}: GlobeGlobalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null);
  const dragOffset = useRef({ phi: 0, theta: 0 });
  const phiOffsetRef = useRef(0);
  const thetaOffsetRef = useRef(0);
  const isPausedRef = useRef(false);

  const [opsPerSec, setOpsPerSec] = useState(2847);

  useEffect(() => {
    const id = window.setInterval(() => {
      setOpsPerSec((v) => Math.max(1800, v + Math.floor(Math.random() * 21) - 8));
    }, 900);
    return () => window.clearInterval(id);
  }, []);

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
    if (!canvas) return;

    let globe: ReturnType<typeof createGlobe> | null = null;
    let animationId = 0;
    let resizeObserver: ResizeObserver | null = null;
    let phi = 0;

    const initGlobe = () => {
      const width = canvas.offsetWidth;
      if (width === 0 || globe) return;

      globe = createGlobe(canvas, {
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        width: width * 2,
        height: width * 2,
        phi: 0,
        theta: 0.25,
        dark: 0,
        diffuse: 1.4,
        mapSamples: 16000,
        mapBrightness: 8,
        baseColor: [0.86, 0.9, 0.94],
        markerColor: [0.05, 0.14, 0.25],
        glowColor: [0.6, 0.72, 0.84],
        markers: markers.map((m) => ({ location: m.location, size: 0.08 })),
        opacity: 1,

      });

      const animate = () => {
        if (!globe) return;
        if (!isPausedRef.current) phi += speed;
        globe.update({
          phi: phi + phiOffsetRef.current + dragOffset.current.phi,
          theta: 0.25 + thetaOffsetRef.current + dragOffset.current.theta,
        });
        animationId = window.requestAnimationFrame(animate);
      };
      animate();
      window.setTimeout(() => { canvas.style.opacity = "1"; }, 200);
    };

    if (canvas.offsetWidth > 0) initGlobe();
    else {
      resizeObserver = new ResizeObserver((entries) => {
        if ((entries[0]?.contentRect.width ?? 0) > 0) {
          resizeObserver?.disconnect();
          initGlobe();
        }
      });
      resizeObserver.observe(canvas);
    }

    return () => {
      if (animationId) window.cancelAnimationFrame(animationId);
      resizeObserver?.disconnect();
      globe?.destroy();
    };
  }, [markers, speed]);

  return (
    <div className={`relative aspect-square w-full ${className}`}>
      {/* outer glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[-8%] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(45,138,158,0.28), rgba(12,35,64,0.10) 55%, transparent 72%)",
          filter: "blur(24px)",
        }}
      />
      {/* hairline ring */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[2%] rounded-full border border-[rgba(12,35,64,0.12)]"
      />
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        className="absolute inset-0 h-full w-full touch-none cursor-grab opacity-0 transition-opacity duration-700"
        style={{ contain: "layout paint size" }}
      />


      {/* HUD — simulação local */}
      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3 text-foreground">
        <div className="rounded-md border border-border bg-card/80 px-3 py-2 backdrop-blur-sm">
          <div className="font-display text-2xl leading-none tabular-nums">
            {opsPerSec.toLocaleString("pt-BR")}
          </div>
          <div className="eyebrow mt-1 text-[0.6rem]">
            ops/s · simulação local
          </div>
        </div>
        <div className="rounded-md border border-border bg-card/80 px-3 py-2 text-right backdrop-blur-sm">
          <div className="eyebrow text-[0.6rem]">camadas</div>
          <div className="font-display text-lg leading-none">{markers.length} módulos</div>
        </div>
      </div>
    </div>
  );
}
