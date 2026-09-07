import { useEffect, useRef } from "react";
import * as THREE from "three";

// Companion Orb: tiny three.js sphere with orbiting electron rings, used as a
// "system familiar" next to the rank emblem on the Home header.
export default function CompanionOrb({ color = "#00d4ff", size = 36 }) {
  const mountRef = useRef(null);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const mount = mountRef.current;
    if (!mount) return;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
    } catch { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(size, size);
    mount.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 50);
    camera.position.z = 3.4;
    const col = new THREE.Color(color);

    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 22, 22),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.45 }),
    );
    scene.add(orb);

    const haloMat = new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.9 });
    const haloA = new THREE.LineLoop(new THREE.RingGeometry(1.05, 1.05, 64).attributes.position
      ? new THREE.BufferGeometry().setFromPoints(
          Array.from({ length: 64 }, (_, i) => {
            const a = (i / 64) * Math.PI * 2;
            return new THREE.Vector3(Math.cos(a) * 1.05, Math.sin(a) * 1.05, 0);
          })
        )
      : new THREE.BufferGeometry(), haloMat);
    const haloB = haloA.clone();
    haloB.material = haloMat.clone(); haloB.material.opacity = 0.6;
    haloB.rotation.x = Math.PI / 2.5;
    scene.add(haloA); scene.add(haloB);

    let raf, frame = 0;
    const t0 = performance.now();
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (document.hidden || (frame++ & 1)) return;
      const t = (performance.now() - t0) / 1000;
      haloA.rotation.z = t * 1.1; haloA.rotation.x = Math.sin(t * 0.7) * 0.3;
      haloB.rotation.z = -t * 0.9; haloB.rotation.y = t * 0.5;
      orb.scale.setScalar(1 + Math.sin(t * 3) * 0.08);
      renderer.render(scene, camera);
    };
    tick();
    return () => {
      cancelAnimationFrame(raf);
      orb.geometry.dispose(); orb.material.dispose();
      haloA.geometry.dispose(); haloA.material.dispose();
      haloB.geometry.dispose(); haloB.material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [color, size]);
  return <div ref={mountRef} style={{ width: size, height: size, position: "relative" }} />;
}
