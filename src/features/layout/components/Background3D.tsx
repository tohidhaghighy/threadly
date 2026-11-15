import { useEffect, useRef } from "react";

/**
 * Background3D
 * -------------
 * A lightweight, dependency-free animated 3D backdrop rendered on a <canvas>.
 *
 * It projects a rotating point cloud (a "constellation / nebula" network) into
 * 2D with real perspective, so points closer to the camera are larger and
 * brighter while distant ones fade — giving a genuine sense of depth without
 * WebGL or heavy libraries.
 *
 * Design goals:
 *  - Works on mobile and desktop (DPR-capped, fewer points on small screens).
 *  - Theme-aware (re-reads brand hue when the `.dark` class toggles).
 *  - Respects `prefers-reduced-motion` (renders a single static frame).
 *  - Pauses when the tab is hidden to save battery.
 *  - Sits behind content, ignores pointer events.
 */

type P3 = {
  x: number;
  y: number;
  z: number;
  // subtle per-point drift so the cloud feels alive, not rigid
  dx: number;
  dy: number;
  dz: number;
};

const TAU = Math.PI * 2;

function isDark() {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

export function Background3D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    // ---- tunables ---------------------------------------------------------
    const COUNT = isMobile ? 46 : 90;
    const LINK_DIST = isMobile ? 0.42 : 0.36; // in normalized 3D units
    const PERSPECTIVE = 2.6;
    const ROT_SPEED = 0.00016; // radians / ms
    const dprCap = isMobile ? 1.75 : 2;
    // ----------------------------------------------------------------------

    let width = 0;
    let height = 0;
    let dpr = 1;
    let minSide = 1;

    const points: P3[] = [];
    for (let i = 0; i < COUNT; i++) {
      // distribute on/inside a sphere for a pleasing volumetric look
      const theta = Math.random() * TAU;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.55 + Math.random() * 0.45;
      points.push({
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi),
        dx: (Math.random() - 0.5) * 0.00004,
        dy: (Math.random() - 0.5) * 0.00004,
        dz: (Math.random() - 0.5) * 0.00004,
      });
    }

    // theme colours (re-read on theme change)
    let hue = 30; // brand orange-ish
    let base = { r: 249, g: 140, b: 40 };
    let linkAlphaBoost = 1;
    function refreshTheme() {
      const dark = isDark();
      hue = 30;
      base = dark ? { r: 255, g: 170, b: 90 } : { r: 240, g: 130, b: 45 };
      linkAlphaBoost = dark ? 1.25 : 0.85;
    }
    refreshTheme();

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, dprCap);
      width = window.innerWidth;
      height = window.innerHeight;
      minSide = Math.min(width, height);
      canvas!.width = Math.floor(width * dpr);
      canvas!.height = Math.floor(height * dpr);
      canvas!.style.width = width + "px";
      canvas!.style.height = height + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    // pointer / device-tilt parallax
    let targetTiltX = 0;
    let targetTiltY = 0;
    let tiltX = 0;
    let tiltY = 0;

    function onPointer(e: PointerEvent) {
      targetTiltY = (e.clientX / width - 0.5) * 0.6;
      targetTiltX = (e.clientY / height - 0.5) * 0.6;
    }
    function onOrient(e: DeviceOrientationEvent) {
      if (e.gamma == null || e.beta == null) return;
      targetTiltY = Math.max(-0.6, Math.min(0.6, (e.gamma / 45) * 0.6));
      targetTiltX = Math.max(-0.6, Math.min(0.6, (e.beta / 90) * 0.6));
    }

    let rotY = 0;
    let rotX = 0.35;
    let last = performance.now();
    let raf = 0;
    let running = true;

    const projected = new Array(COUNT).fill(0).map(() => ({ sx: 0, sy: 0, scale: 0, depth: 0 }));

    function render(now: number) {
      const dt = Math.min(now - last, 60);
      last = now;

      if (!reduceMotion) {
        rotY += ROT_SPEED * dt;
        rotX += ROT_SPEED * 0.35 * dt;
      }

      // ease parallax
      tiltX += (targetTiltX - tiltX) * 0.05;
      tiltY += (targetTiltY - tiltY) * 0.05;

      const ay = rotY + tiltY;
      const ax = rotX + tiltX;
      const cosY = Math.cos(ay);
      const sinY = Math.sin(ay);
      const cosX = Math.cos(ax);
      const sinX = Math.sin(ax);

      ctx!.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const spread = minSide * 0.42;

      // update + project
      for (let i = 0; i < COUNT; i++) {
        const p = points[i];
        if (!reduceMotion) {
          p.x += p.dx * dt;
          p.y += p.dy * dt;
          p.z += p.dz * dt;
        }
        // rotate around Y then X
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.x * sinY + p.z * cosY;
        const y1 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;

        const persp = PERSPECTIVE / (PERSPECTIVE - z2);
        const pr = projected[i];
        pr.sx = cx + x1 * spread * persp;
        pr.sy = cy + y1 * spread * persp;
        pr.scale = persp;
        pr.depth = z2;
      }

      // links
      const linkPx = LINK_DIST * minSide * 0.42;
      ctx!.lineWidth = 1;
      for (let i = 0; i < COUNT; i++) {
        const a = projected[i];
        for (let j = i + 1; j < COUNT; j++) {
          const b = projected[j];
          const dx = a.sx - b.sx;
          const dy = a.sy - b.sy;
          const d = Math.hypot(dx, dy);
          if (d < linkPx) {
            const t = 1 - d / linkPx;
            const depthFade = (a.depth + b.depth) * 0.5 * 0.5 + 0.5;
            const alpha = t * t * 0.35 * depthFade * linkAlphaBoost;
            ctx!.strokeStyle = `rgba(${base.r},${base.g},${base.b},${alpha})`;
            ctx!.beginPath();
            ctx!.moveTo(a.sx, a.sy);
            ctx!.lineTo(b.sx, b.sy);
            ctx!.stroke();
          }
        }
      }

      // nodes (draw far-to-near so nearer points sit on top)
      const order = projected
        .map((p, i) => i)
        .sort((i1, i2) => projected[i1].depth - projected[i2].depth);
      for (const i of order) {
        const p = projected[i];
        const depthFade = p.depth * 0.5 + 0.5; // 0..1
        const rad = (isMobile ? 1.6 : 2.1) * p.scale;
        const alpha = 0.25 + depthFade * 0.7;

        const grad = ctx!.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, rad * 4);
        grad.addColorStop(0, `rgba(${base.r},${base.g},${base.b},${alpha})`);
        grad.addColorStop(1, `rgba(${base.r},${base.g},${base.b},0)`);
        ctx!.fillStyle = grad;
        ctx!.beginPath();
        ctx!.arc(p.sx, p.sy, rad * 4, 0, TAU);
        ctx!.fill();

        ctx!.fillStyle = `rgba(${base.r},${base.g},${base.b},${Math.min(1, alpha + 0.15)})`;
        ctx!.beginPath();
        ctx!.arc(p.sx, p.sy, rad, 0, TAU);
        ctx!.fill();
      }

      if (running && !reduceMotion) {
        raf = requestAnimationFrame(render);
      }
    }

    raf = requestAnimationFrame(render);

    // events
    const onResize = () => resize();
    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reduceMotion) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(render);
      }
    };
    const themeObserver = new MutationObserver(refreshTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    if (!isMobile) window.addEventListener("pointermove", onPointer, { passive: true });
    else window.addEventListener("deviceorientation", onOrient, { passive: true });

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("deviceorientation", onOrient);
      themeObserver.disconnect();
    };
  }, []);

  return (
    <div aria-hidden className="bg3d-root pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* layered aurora gradients behind the point cloud for depth */}
      <div className="bg3d-aurora bg3d-aurora-1" />
      <div className="bg3d-aurora bg3d-aurora-2" />
      <div className="bg3d-aurora bg3d-aurora-3" />
      <canvas ref={canvasRef} className="bg3d-canvas relative h-full w-full" />
      {/* subtle grain/vignette to blend the scene */}
      <div className="bg3d-vignette" />
    </div>
  );
}

export default Background3D;
