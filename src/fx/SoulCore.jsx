import { useEffect, useRef } from "react";
import * as THREE from "three";

// Holographic "Soul Core": three.js icosahedron + two orbiting wireframe rings
// in the wearer's rank color. Rendered into the rank card on the Character
// screen. Cheap (~one mesh + two rings, no bloom postprocessing) and gated by
// reduced-motion + WebGL availability.
export default function SoulCore({ color = "#00d4ff", size = 84 }) {
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
    camera.position.z = 5.4;
    const col = new THREE.Color(color);

    // Core: wireframe icosahedron with a glowing inner orb
    const coreGeo = new THREE.IcosahedronGeometry(1.1, 0);
    const coreEdges = new THREE.EdgesGeometry(coreGeo);
    const coreMat = new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.95 });
    const core = new THREE.LineSegments(coreEdges, coreMat);
    scene.add(core);

    const innerOrb = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 18, 18),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.18 }),
    );
    scene.add(innerOrb);

    // Two orbiting rings on perpendicular axes
    const ringGeo = new THREE.TorusGeometry(1.85, 0.018, 8, 96);
    const ringMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.65 });
    const ringA = new THREE.Mesh(ringGeo, ringMat);
    const ringB = new THREE.Mesh(ringGeo, ringMat.clone());
    ringB.material.opacity = 0.45;
    ringB.rotation.x = Math.PI / 2;
    scene.add(ringA); scene.add(ringB);

    // Orbiting shards (small dodecahedra)
    const shards = [];
    for (let i = 0; i < 6; i++) {
      const m = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.TetrahedronGeometry(0.16)),
        new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.85 }),
      );
      m.userData = { phase: i * (Math.PI * 2 / 6), radius: 2.2 + (i % 2) * 0.25, speed: 0.6 + (i % 3) * 0.18 };
      scene.add(m); shards.push(m);
    }

    let raf, frame = 0;
    const t0 = performance.now();
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (document.hidden || (frame++ & 1)) return;
      const t = (performance.now() - t0) / 1000;
      core.rotation.x = t * 0.4; core.rotation.y = t * 0.55;
      ringA.rotation.z = t * 0.7; ringA.rotation.x = t * 0.2;
      ringB.rotation.z = -t * 0.5; ringB.rotation.y = t * 0.35;
      innerOrb.scale.setScalar(1 + Math.sin(t * 2.4) * 0.07);
      shards.forEach(s => {
        const a = t * s.userData.speed + s.userData.phase;
        s.position.set(Math.cos(a) * s.userData.radius, Math.sin(a * 0.7) * 0.6, Math.sin(a) * s.userData.radius);
        s.rotation.x = a * 1.5; s.rotation.y = a;
      });
      renderer.render(scene, camera);
    };
    tick();
    return () => {
      cancelAnimationFrame(raf);
      coreEdges.dispose(); coreMat.dispose(); coreGeo.dispose();
      innerOrb.geometry.dispose(); innerOrb.material.dispose();
      ringGeo.dispose(); ringMat.dispose(); ringB.material.dispose();
      shards.forEach(s => { s.geometry.dispose(); s.material.dispose(); });
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [color, size]);
  return <div ref={mountRef} style={{ width: size, height: size, position: "relative" }} />;
}
