"use client";

import { useFrame } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { CanvasShell } from "./canvas-shell";

const PAIRS = 30;
const RADIUS = 0.9;
const RISE = 0.17;
const TWIST = 0.42;

function Helix() {
  const group = useRef<THREE.Group>(null);
  const spheres = useRef<THREE.InstancedMesh>(null);
  const rungs = useRef<THREE.InstancedMesh>(null);
  const colors = useMemo(() => [new THREE.Color("#00B8A9"), new THREE.Color("#2563EB"), new THREE.Color("#60A5FA"), new THREE.Color("#5EEAD4")], []);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < PAIRS; i++) {
      const y = (i - PAIRS / 2) * RISE;
      const a = i * TWIST;
      const p1 = new THREE.Vector3(Math.cos(a) * RADIUS, y, Math.sin(a) * RADIUS);
      const p2 = new THREE.Vector3(Math.cos(a + Math.PI) * RADIUS, y, Math.sin(a + Math.PI) * RADIUS);
      m.compose(p1, q.identity(), new THREE.Vector3(1, 1, 1));
      spheres.current!.setMatrixAt(i * 2, m);
      m.compose(p2, q.identity(), new THREE.Vector3(1, 1, 1));
      spheres.current!.setMatrixAt(i * 2 + 1, m);
      spheres.current!.setColorAt(i * 2, colors[i % 2]);
      spheres.current!.setColorAt(i * 2 + 1, colors[2 + (i % 2)]);
      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      const dir = p2.clone().sub(p1).normalize();
      q.setFromUnitVectors(up, dir);
      m.compose(mid, q, new THREE.Vector3(1, RADIUS * 2, 1));
      rungs.current!.setMatrixAt(i, m);
    }
    spheres.current!.instanceMatrix.needsUpdate = true;
    if (spheres.current!.instanceColor) spheres.current!.instanceColor.needsUpdate = true;
    rungs.current!.instanceMatrix.needsUpdate = true;
  }, [colors]);

  useFrame((state, dt) => {
    if (!group.current) return;
    group.current.rotation.y += dt * 0.35;
    group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, 0.35 + state.pointer.x * 0.15, 0.05);
  });

  return (
    <group ref={group} rotation={[0.2, 0, 0.35]}>
      <instancedMesh ref={spheres} args={[undefined, undefined, PAIRS * 2]}>
        <sphereGeometry args={[0.11, 24, 24]} />
        <meshPhysicalMaterial roughness={0.2} clearcoat={1} emissive="#0b3a5a" emissiveIntensity={0.4} />
      </instancedMesh>
      <instancedMesh ref={rungs} args={[undefined, undefined, PAIRS]}>
        <cylinderGeometry args={[0.022, 0.022, 1, 8]} />
        <meshStandardMaterial color="#cbd5e1" transparent opacity={0.45} />
      </instancedMesh>
    </group>
  );
}

export default function DnaScene({ className = "" }: { className?: string }) {
  return (
    <CanvasShell className={className} camera={{ position: [0, 0, 8.2], fov: 42 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 3, 4]} intensity={2.5} />
      <pointLight position={[-3, -2, 2]} intensity={20} color="#00B8A9" />
      <Float speed={1.2} floatIntensity={0.4} rotationIntensity={0.1}>
        <Helix />
      </Float>
      <Sparkles count={50} scale={[5, 6, 3]} size={1.6} speed={0.25} color="#5EEAD4" opacity={0.6} />
    </CanvasShell>
  );
}
