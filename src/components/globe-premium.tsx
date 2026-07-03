import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export interface GlobePremiumMarker {
  id: string;
  city: string;
  location: [number, number]; // [lat, lng]
}

interface GlobePremiumProps {
  markers?: GlobePremiumMarker[];
  className?: string;
}

const DEFAULT_MARKERS: GlobePremiumMarker[] = [
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

// Texture URLs (three-globe examples — stable, MIT-licensed NASA Blue Marble derivatives)
const TEX_DAY = "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg";
const TEX_TOPO = "https://unpkg.com/three-globe/example/img/earth-topology.png";
const TEX_SPEC = "https://unpkg.com/three-globe/example/img/earth-water.png";
const TEX_CLOUDS =
  "https://cdn.jsdelivr.net/gh/turban/webgl-earth@master/images/fair_clouds_4k.png";

function loadTexture(url: string): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      url,
      (tex) => resolve(tex),
      undefined,
      (err) => reject(err),
    );
  });
}

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// Fresnel atmosphere shader (rim glow)
const atmosphereVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const atmosphereFragment = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPosition;
  uniform vec3 uColor;
  uniform float uPower;
  uniform float uIntensity;
  void main() {
    vec3 viewDir = normalize(-vPosition);
    float rim = 1.0 - max(dot(vNormal, viewDir), 0.0);
    float glow = pow(rim, uPower) * uIntensity;
    gl_FragColor = vec4(uColor * glow, glow);
  }
`;

export default function GlobePremium({
  markers = DEFAULT_MARKERS,
  className = "",
}: GlobePremiumProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "webgl-error" | "texture-error">(
    "loading",
  );
  const [softwareRender, setSoftwareRender] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isMobile = window.matchMedia("(max-width: 640px)").matches;

    let disposed = false;
    let animationId = 0;

    const scene = new THREE.Scene();

    const width = container.clientWidth;
    const height = container.clientHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0.4, 3.2);

    // Try to construct the renderer with permissive options. We do NOT
    // pre-check WebGL support — iframes/software renderers often trip false
    // negatives. The only reliable signal is the actual constructor + a
    // webglcontextcreationerror listener on the canvas.
    const probeCanvas = document.createElement("canvas");
    let creationError: string | null = null;
    const onCreationError = (e: Event) => {
      creationError = (e as WebGLContextEvent).statusMessage || "context creation failed";
    };
    probeCanvas.addEventListener("webglcontextcreationerror", onCreationError, false);

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: probeCanvas,
        antialias: false, // enable after we know we're on hardware
        alpha: true,
        powerPreference: "default",
        failIfMajorPerformanceCaveat: false,
      });
    } catch (err) {
      console.warn("[GlobePremium] WebGLRenderer constructor threw", err, creationError);
      probeCanvas.removeEventListener("webglcontextcreationerror", onCreationError);
      setStatus("webgl-error");
      return;
    }
    probeCanvas.removeEventListener("webglcontextcreationerror", onCreationError);

    // Detect software rendering (SwiftShader / llvmpipe) and downgrade quality
    let isSoftware = false;
    try {
      const gl = renderer.getContext();
      const dbg = gl.getExtension("WEBGL_debug_renderer_info");
      const rendererName = dbg
        ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || "")
        : "";
      isSoftware = /swiftshader|llvmpipe|software|angle.*basic/i.test(rendererName);
    } catch {
      /* ignore */
    }
    if (isSoftware) setSoftwareRender(true);

    const segments = isMobile || isSoftware ? 40 : 72;
    const useAntialias = !isMobile && !isSoftware;

    // Re-init with antialias if hardware and desktop. Cheaper than
    // reasoning about it upfront and keeps a single code path.
    if (useAntialias) {
      renderer.dispose();
      renderer.forceContextLoss();
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: "default",
          failIfMajorPerformanceCaveat: false,
        });
      } catch {
        // fall back to the software-safe renderer we already had
        renderer = new THREE.WebGLRenderer({
          antialias: false,
          alpha: true,
          powerPreference: "default",
          failIfMajorPerformanceCaveat: false,
        });
      }
    }
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      setStatus("webgl-error");
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, false);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    container.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.opacity = "0";
    renderer.domElement.style.transition = "opacity 900ms ease-out";

    // Lights
    const ambient = new THREE.AmbientLight(0x8899bb, 0.35);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 1.4);
    sun.position.set(5, 3, 5);
    scene.add(sun);

    const rimLight = new THREE.DirectionalLight(0x4488cc, 0.35);
    rimLight.position.set(-5, -2, -3);
    scene.add(rimLight);

    // Starfield background
    const starGeometry = new THREE.BufferGeometry();
    const starCount = isMobile ? 1200 : 2500;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 60 + Math.random() * 40;
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);
      starPositions[i * 3] = r * Math.sin(p) * Math.cos(t);
      starPositions[i * 3 + 1] = r * Math.sin(p) * Math.sin(t);
      starPositions[i * 3 + 2] = r * Math.cos(p);
    }
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.12,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Placeholders that will hold texture-dependent meshes
    let earth: THREE.Mesh | null = null;
    let clouds: THREE.Mesh | null = null;
    let earthMaterial: THREE.MeshPhongMaterial | null = null;
    let cloudsMaterial: THREE.MeshPhongMaterial | null = null;
    let atmosphere: THREE.Mesh | null = null;
    const markerMeshes: THREE.Mesh[] = [];
    const disposables: Array<{ dispose: () => void }> = [
      starGeometry,
      starMaterial,
    ];
    const loadedTextures: THREE.Texture[] = [];

    // Atmosphere (independent of textures — render immediately)
    const atmosphereGeometry = new THREE.SphereGeometry(1.06, segments, segments);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: atmosphereVertex,
      fragmentShader: atmosphereFragment,
      uniforms: {
        uColor: { value: new THREE.Color(0x4aa3c7) },
        uPower: { value: 2.6 },
        uIntensity: { value: 1.1 },
      },
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
    atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);
    disposables.push(atmosphereGeometry, atmosphereMaterial);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.5;
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.minDistance = 2.2;
    controls.maxDistance = 5;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.35;

    let userInteracting = false;
    const onStart = () => {
      userInteracting = true;
      controls.autoRotate = false;
    };
    const onEnd = () => {
      userInteracting = false;
      window.setTimeout(() => {
        if (!userInteracting && !disposed) controls.autoRotate = true;
      }, 1500);
    };
    controls.addEventListener("start", onStart);
    controls.addEventListener("end", onEnd);

    // Resize
    const resize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    // Render loop
    let lastTime = performance.now();
    const animate = () => {
      if (disposed) return;
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      if (clouds) clouds.rotation.y += dt * 0.02;
      controls.update();
      renderer.render(scene, camera);
      animationId = window.requestAnimationFrame(animate);
    };
    animate();

    // Load textures (async, may fail gracefully)
    (async () => {
      try {
        const [day, topo, spec] = await Promise.all([
          loadTexture(TEX_DAY),
          loadTexture(TEX_TOPO),
          loadTexture(TEX_SPEC),
        ]);
        if (disposed) {
          day.dispose();
          topo.dispose();
          spec.dispose();
          return;
        }
        day.colorSpace = THREE.SRGBColorSpace;
        day.anisotropy = renderer.capabilities.getMaxAnisotropy();
        loadedTextures.push(day, topo, spec);

        const earthGeometry = new THREE.SphereGeometry(1, segments, segments);
        earthMaterial = new THREE.MeshPhongMaterial({
          map: day,
          bumpMap: topo,
          bumpScale: 0.025,
          specularMap: spec,
          specular: new THREE.Color(0x2a4a66),
          shininess: 18,
        });
        earth = new THREE.Mesh(earthGeometry, earthMaterial);
        earth.rotation.y = -Math.PI / 2;
        scene.add(earth);
        disposables.push(earthGeometry, earthMaterial);

        // Markers (glowing dots on the surface)
        const markerGeo = new THREE.SphereGeometry(0.012, 12, 12);
        disposables.push(markerGeo);
        const markerMat = new THREE.MeshBasicMaterial({ color: 0x40e0d0 });
        disposables.push(markerMat);
        for (const m of markers) {
          const pos = latLngToVector3(m.location[0], m.location[1], 1.005);
          const mesh = new THREE.Mesh(markerGeo, markerMat);
          mesh.position.copy(pos);
          earth.add(mesh);
          markerMeshes.push(mesh);

          // subtle halo
          const haloGeo = new THREE.SphereGeometry(0.024, 12, 12);
          const haloMat = new THREE.MeshBasicMaterial({
            color: 0x40e0d0,
            transparent: true,
            opacity: 0.35,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          });
          const halo = new THREE.Mesh(haloGeo, haloMat);
          halo.position.copy(pos);
          earth.add(halo);
          disposables.push(haloGeo, haloMat);
        }

        // Clouds (optional — don't fail the whole globe if it 404s)
        try {
          const cloudsTex = await loadTexture(TEX_CLOUDS);
          if (disposed) {
            cloudsTex.dispose();
          } else {
            loadedTextures.push(cloudsTex);
            const cloudsGeometry = new THREE.SphereGeometry(1.012, segments, segments);
            cloudsMaterial = new THREE.MeshPhongMaterial({
              map: cloudsTex,
              transparent: true,
              opacity: 0.55,
              depthWrite: false,
            });
            clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
            scene.add(clouds);
            disposables.push(cloudsGeometry, cloudsMaterial);
          }
        } catch {
          // clouds are cosmetic — silently skip
        }

        if (!disposed) {
          renderer.domElement.style.opacity = "1";
          setStatus("ready");
        }
      } catch (err) {
        console.error("[GlobePremium] texture load failed", err);
        if (!disposed) setStatus("texture-error");
      }
    })();

    return () => {
      disposed = true;
      if (animationId) window.cancelAnimationFrame(animationId);
      ro.disconnect();
      controls.removeEventListener("start", onStart);
      controls.removeEventListener("end", onEnd);
      controls.dispose();

      for (const t of loadedTextures) t.dispose();
      for (const d of disposables) d.dispose();

      scene.clear();
      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [markers]);

  return (
    <div
      ref={containerRef}
      className={`relative aspect-square min-h-[320px] w-full overflow-hidden ${className}`}
    >
      {/* Ambient background gradient (visible even before textures) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(45,138,158,0.18), rgba(4,10,20,0) 65%)",
        }}
      />

      {status === "loading" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-[#40e0d0]" />
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white/60">
              Carregando globo
            </span>
          </div>
        </div>
      )}

      {status === "webgl-error" && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
          <div className="max-w-[240px] text-sm text-white/70">
            Seu navegador não suporta WebGL. Ative aceleração por hardware para
            ver o globo 3D.
          </div>
        </div>
      )}

      {status === "texture-error" && (
        <div className="absolute inset-x-0 bottom-3 text-center text-[0.65rem] uppercase tracking-[0.18em] text-white/50">
          Falha ao carregar texturas · exibindo modo básico
        </div>
      )}

      {/* HUD */}
      <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
        <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-md">
          <div className="font-display text-xl leading-none tabular-nums text-white">
            10
          </div>
          <div className="mt-1 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-white/60">
            regiões · rede global
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
    </div>
  );
}
