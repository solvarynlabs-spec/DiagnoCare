"use client";

import { useFrame } from "@react-three/fiber";
import { Environment, Float, Lightformer, Sparkles } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { CanvasShell } from "./canvas-shell";

/** Lub-dub cardiac rhythm: two quick pulses per cycle (~72 bpm). */
function beat(t: number) {
  const p = (t * 1.2) % 1;
  const g = (c: number, w: number) => Math.exp(-((p - c) ** 2) / w);
  return 1 + 0.075 * g(0.06, 0.0018) + 0.045 * g(0.24, 0.0022);
}

function useHeartGeometry() {
  return useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(5, 5);
    s.bezierCurveTo(5, 5, 4, 0, 0, 0);
    s.bezierCurveTo(-6, 0, -6, 7, -6, 7);
    s.bezierCurveTo(-6, 11, -3, 15.4, 5, 19);
    s.bezierCurveTo(12, 15.4, 16, 11, 16, 7);
    s.bezierCurveTo(16, 7, 16, 0, 10, 0);
    s.bezierCurveTo(7, 0, 5, 5, 5, 5);
    const g = new THREE.ExtrudeGeometry(s, { depth: 3.5, bevelEnabled: true, bevelSegments: 14, steps: 2, bevelSize: 3.2, bevelThickness: 3.4, curveSegments: 48 });
    g.center();
    g.rotateZ(Math.PI);
    g.scale(0.085, 0.085, 0.085);
    g.computeVertexNormals();
    return g;
  }, []);
}

function Vessel({ points, color, radius = 0.12 }: { points: [number, number, number][]; color: string; radius?: number }) {
  const geo = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))), 64, radius, 20, false), [points, radius]);
  return (
    <mesh geometry={geo}>
      <meshPhysicalMaterial color={color} roughness={0.3} clearcoat={1} clearcoatRoughness={0.2} />
    </mesh>
  );
}

function Heart() {
  const geo = useHeartGeometry();
  const group = useRef<THREE.Group>(null);
  const scan = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (group.current) {
      const s = beat(t);
      group.current.scale.setScalar(s);
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, state.pointer.x * 0.6 + Math.sin(t * 0.3) * 0.25, 0.05);
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -state.pointer.y * 0.3, 0.05);
    }
    if (scan.current) scan.current.position.y = Math.sin(t * 0.9) * 1.3;
    if (ring.current) ring.current.rotation.z = t * 0.4;
  });
  return (
    <group ref={group} rotation={[0, 0, -0.18]}>
      <mesh geometry={geo}>
        <meshPhysicalMaterial color="#d61f45" emissive="#5a0517" emissiveIntensity={0.35} roughness={0.28} metalness={0.05} clearcoat={1} clearcoatRoughness={0.15} sheen={1} sheenColor="#ff8aa0" />
      </mesh>
      {/* holographic wireframe shell */}
      <mesh geometry={geo} scale={1.06}>
        <meshBasicMaterial color="#00B8A9" wireframe transparent opacity={0.08} />
      </mesh>
      {/* aorta: ascending, arch with three branches, descending behind */}
      <Vessel color="#c81e3a" radius={0.16} points={[[0.05, 0.6, 0.05], [0.1, 1.15, 0.02], [-0.1, 1.48, -0.12], [-0.45, 1.42, -0.3], [-0.62, 1.0, -0.45], [-0.66, 0.2, -0.5]]} />
      <Vessel color="#c81e3a" radius={0.06} points={[[0.03, 1.38, -0.05], [0.06, 1.62, -0.05], [0.1, 1.85, -0.05]]} />
      <Vessel color="#c81e3a" radius={0.055} points={[[-0.18, 1.5, -0.15], [-0.2, 1.7, -0.17], [-0.22, 1.9, -0.18]]} />
      <Vessel color="#c81e3a" radius={0.055} points={[[-0.38, 1.47, -0.26], [-0.45, 1.66, -0.28], [-0.52, 1.85, -0.3]]} />
      {/* pulmonary trunk and superior vena cava */}
      <Vessel color="#2f5fd0" radius={0.13} points={[[0.42, 0.6, 0.18], [0.5, 1.0, 0.15], [0.75, 1.22, 0.0], [1.0, 1.2, -0.2]]} />
      <Vessel color="#2f5fd0" radius={0.11} points={[[0.78, 0.45, -0.3], [0.8, 1.05, -0.32], [0.82, 1.75, -0.32]]} />
      {/* coronary arteries on the anterior surface */}
      <Vessel color="#9f1239" radius={0.032} points={[[0.12, 0.62, 0.36], [0.04, 0.15, 0.47], [-0.06, -0.35, 0.45], [-0.02, -0.85, 0.3]]} />
      <Vessel color="#9f1239" radius={0.028} points={[[0.18, 0.58, 0.36], [0.55, 0.28, 0.44], [0.85, -0.1, 0.36], [0.95, -0.4, 0.2]]} />
      <Vessel color="#9f1239" radius={0.024} points={[[0.0, 0.2, 0.47], [-0.45, 0.05, 0.42], [-0.8, -0.15, 0.3]]} />
      {/* scanning plane */}
      <mesh ref={scan} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.35, 1.38, 96]} />
        <meshBasicMaterial color="#00B8A9" transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring} rotation={[Math.PI / 2.4, 0.2, 0]}>
        <torusGeometry args={[2.1, 0.008, 8, 160]} />
        <meshBasicMaterial color="#60A5FA" transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

export default function HeartScene({ className = "" }: { className?: string }) {
  return (
    <CanvasShell className={className} camera={{ position: [0, 0.2, 6.2], fov: 38 }}>
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 4, 5]} intensity={2.2} color="#ffffff" />
      <pointLight position={[-4, -2, 2]} intensity={30} color="#00B8A9" />
      <pointLight position={[4, 1, -3]} intensity={25} color="#2563EB" />
      <Float speed={1.6} rotationIntensity={0.25} floatIntensity={0.6}>
        <group scale={0.72} position={[0, -0.25, 0]}>
          <Heart />
        </group>
      </Float>
      <Sparkles count={90} scale={[6, 5, 4]} size={2.2} speed={0.35} color="#7dd3fc" opacity={0.7} />
      <Environment resolution={256}>
        <Lightformer intensity={2} position={[0, 4, -6]} scale={[10, 2, 1]} color="#ffffff" />
        <Lightformer intensity={3} position={[-5, 1, 2]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} color="#00B8A9" />
        <Lightformer intensity={2.5} position={[5, -1, 2]} rotation-y={-Math.PI / 2} scale={[6, 3, 1]} color="#2563EB" />
      </Environment>
    </CanvasShell>
  );
}
