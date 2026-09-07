import { useEffect, useRef } from "react";
import * as THREE from "three";

// Three.js ambient particle depth-field, fixed behind all screens.
// ~260 additive-blended motes (accent + gold) drifting upward with pointer
// parallax. Renders at ~30fps, pauses when the tab is hidden, honors
// prefers-reduced-motion, and degrades to nothing if WebGL is unavailable.
export default function SystemParticles({ accent = "#00d4ff" }) {
  const mountRef = useRef(null);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const mount = mountRef.current;
    if (!mount) return;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power" });
    } catch { return; }
    const W = () => window.innerWidth, H = () => window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(W(), H());
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W() / H(), 1, 2000);
    camera.position.z = 420;

    const N = 260;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const seeds = new Float32Array(N);
    const cyan = new THREE.Color(accent), gold = new THREE.Color("#e8c44a"), violet = new THREE.Color("#b455ff");
    for (let i = 0; i < N; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 950;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 1500;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 850;
      const r = Math.random();
      const c = r < 0.74 ? cyan : r < 0.9 ? gold : violet;
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      seeds[i] = Math.random() * Math.PI * 2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));

    // soft round sprite so points render as glowing motes, not squares
    const cnv = document.createElement("canvas");
    cnv.width = cnv.height = 64;
    const g2 = cnv.getContext("2d");
    const grad = g2.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.4, "rgba(255,255,255,.45)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g2.fillStyle = grad; g2.fillRect(0, 0, 64, 64);
    const sprite = new THREE.CanvasTexture(cnv);

    const mat = new THREE.PointsMaterial({
      size: 6, map: sprite, vertexColors: true, transparent: true, opacity: 0.75,
      depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
    });
    const points = new THREE.Points(geo, mat);
    scene.add(points);

    let px = 0, py = 0;
    const onPointer = e => {
      px = (e.clientX / W() - 0.5) * 46;
      py = (e.clientY / H() - 0.5) * 46;
    };
    const onResize = () => {
      camera.aspect = W() / H();
      camera.updateProjectionMatrix();
      renderer.setSize(W(), H());
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("resize", onResize);

    let raf, frame = 0;
    const t0 = performance.now();
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (document.hidden || (frame++ % 2)) return;
      const t = (performance.now() - t0) / 1000;
      points.rotation.y = t * 0.02;
      const arr = geo.attributes.position.array;
      for (let i = 0; i < N; i++) {
        arr[i * 3 + 1] += Math.sin(t * 0.7 + seeds[i]) * 0.05 + 0.07;
        if (arr[i * 3 + 1] > 750) arr[i * 3 + 1] = -750;
      }
      geo.attributes.position.needsUpdate = true;
      camera.position.x += (px - camera.position.x) * 0.03;
      camera.position.y += (-py - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", onResize);
      geo.dispose(); mat.dispose(); sprite.dispose(); renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [accent]);
  return <div ref={mountRef} style={{ position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none" }} />;
}
