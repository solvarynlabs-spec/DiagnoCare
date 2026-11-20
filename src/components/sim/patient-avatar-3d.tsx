"use client";

import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bounds, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { GLTFLoader, KTX2Loader, MeshoptDecoder, type GLTF } from "three-stdlib";
import type { Emotion } from "@/lib/sim/types";
import { PatientAvatar, type AvatarRendererProps } from "./patient-avatar";

/**
 * Realistic 3D patient face driven by the 52 ARKit blendshapes of a glTF head.
 * - Emotion → facial expression (smoothly blended)
 * - Speaking → procedural jaw / lip motion
 * - Idle life: blinking, small saccades, breathing and head sway
 * Any GLB exposing ARKit-named morph targets (Avaturn, MetaHuman/Character Creator exports…)
 * can replace the default model via `modelUrl`.
 */

export const DEFAULT_AVATAR_MODEL = "/avatars/facecap.glb";

type Weights = Record<string, number>;
const both = (name: string, v: number): Weights => ({ [`${name}_L`]: v, [`${name}_R`]: v });

const EXPRESSIONS: Record<Emotion, Weights> = {
  neutral: { ...both("mouthSmile", 0.04) },
  pain: { ...both("browDown", 0.55), browInnerUp: 0.55, ...both("eyeSquint", 0.65), ...both("cheekSquint", 0.45), ...both("noseSneer", 0.45), ...both("mouthStretch", 0.4), ...both("mouthFrown", 0.35), ...both("mouthPress", 0.25), jawOpen: 0.06 },
  anxious: { browInnerUp: 0.85, ...both("browOuterUp", 0.25), ...both("eyeWide", 0.35), ...both("mouthFrown", 0.25), ...both("mouthPress", 0.3), mouthRollLower: 0.15 },
  distressed: { browInnerUp: 0.95, ...both("browDown", 0.2), ...both("eyeSquint", 0.25), ...both("mouthFrown", 0.6), ...both("mouthStretch", 0.25), mouthShrugLower: 0.3 },
  tired: { ...both("eyeBlink", 0.42), ...both("browDown", 0.12), ...both("mouthFrown", 0.15), jawOpen: 0.03, ...both("mouthLowerDown", 0.05) },
  relieved: { ...both("mouthSmile", 0.45), ...both("cheekSquint", 0.2), browInnerUp: 0.12, ...both("eyeSquint", 0.15) },
  irritated: { ...both("browDown", 0.7), ...both("noseSneer", 0.3), ...both("mouthPress", 0.5), ...both("mouthFrown", 0.3), ...both("eyeSquint", 0.2) },
};

let ktx2: KTX2Loader | null = null;
const cache = new Map<string, Promise<GLTF>>();

/**
 * Loads the head once per URL, retrying transient network failures (dev-server restarts,
 * flaky connections). Failures resolve to a rejected promise handled by the caller instead of
 * being thrown into React, so they never surface as console errors.
 */
function loadFace(url: string, gl: THREE.WebGLRenderer): Promise<GLTF> {
  let p = cache.get(url);
  if (!p) {
    ktx2 ??= new KTX2Loader().setTranscoderPath("/basis/").detectSupport(gl);
    const loader = new GLTFLoader();
    loader.setKTX2Loader(ktx2);
    loader.setMeshoptDecoder(typeof MeshoptDecoder === "function" ? (MeshoptDecoder as unknown as () => never)() : MeshoptDecoder);
    p = (async () => {
      for (let attempt = 0; ; attempt++) {
        try {
          return await loader.loadAsync(url);
        } catch (e) {
          if (attempt >= 2) throw e;
          await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
        }
      }
    })();
    p.catch(() => cache.delete(url)); // allow a fresh attempt on the next mount
    cache.set(url, p);
  }
  return p;
}

function FaceModel(props: { url: string; emotion: Emotion; speaking: boolean; skin: string; onFail: () => void }) {
  const gl = useThree((s) => s.gl);
  const [gltf, setGltf] = useState<GLTF | null>(null);
  const { url, onFail } = props;
  useEffect(() => {
    let alive = true;
    loadFace(url, gl).then(
      (g) => alive && setGltf(g),
      () => alive && onFail(),
    );
    return () => {
      alive = false;
    };
  }, [url, gl, onFail]);
  return gltf ? <FaceRig gltf={gltf} {...props} /> : null;
}

function FaceRig({ gltf, emotion, speaking, skin }: { gltf: GLTF; emotion: Emotion; speaking: boolean; skin: string }) {
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const root = useRef<THREE.Group>(null);

  const { morphMeshes, eyes } = useMemo(() => {
    const morphMeshes: THREE.Mesh[] = [];
    const eyes: THREE.Object3D[] = [];
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && m.morphTargetDictionary && m.morphTargetInfluences) morphMeshes.push(m);
      if (/^eye(Left|Right)$/.test(o.name)) eyes.push(o);
      if (m.isMesh && o.name !== "teeth") {
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        mats.forEach((mat) => {
          const sm = mat as THREE.MeshStandardMaterial;
          if (sm.color && !/teeth|eye/i.test(o.name + (o.parent?.name ?? ""))) sm.color = new THREE.Color(skin).lerp(new THREE.Color("#ffffff"), 0.22);
          sm.roughness = 0.62;
        });
      }
    });
    return { morphMeshes, eyes };
  }, [scene, skin]);

  const current = useRef<Weights>({});
  const blink = useRef({ next: 1.5, t: -1 });
  const gaze = useRef({ next: 1, x: 0, y: 0, tx: 0, ty: 0 });

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const target: Weights = { ...EXPRESSIONS[emotion] };

    // Speech: irregular jaw/lip motion while the patient talks.
    if (speaking) {
      const s = Math.abs(Math.sin(t * 9.5)) * 0.55 + Math.abs(Math.sin(t * 5.3 + 1)) * 0.25;
      target.jawOpen = Math.max(target.jawOpen ?? 0, 0.06 + s * 0.38);
      target.mouthFunnel = 0.12 * Math.abs(Math.sin(t * 3.1));
      target.mouthClose = 0.05;
      Object.assign(target, both("mouthLowerDown", 0.15 + s * 0.2), both("mouthUpperUp", 0.08 + s * 0.1));
    }

    // Blinks every 2.5–5 s (double-blink occasionally).
    const b = blink.current;
    if (t > b.next) {
      b.t = t;
      b.next = t + 2.5 + Math.random() * 2.5;
    }
    const bp = (t - b.t) / 0.16;
    if (bp >= 0 && bp <= 1) Object.assign(target, both("eyeBlink", Math.max(target.eyeBlink_L ?? 0, Math.sin(bp * Math.PI))));

    // Smoothly approach the target weights.
    const k = 1 - Math.exp(-dt * 10);
    const keys = new Set([...Object.keys(target), ...Object.keys(current.current)]);
    keys.forEach((key) => {
      const v = current.current[key] ?? 0;
      current.current[key] = v + ((target[key] ?? 0) - v) * (key.startsWith("eyeBlink") ? 0.6 : k);
    });
    for (const m of morphMeshes) {
      const dict = m.morphTargetDictionary!;
      const inf = m.morphTargetInfluences!;
      for (const [key, v] of Object.entries(current.current)) {
        const i = dict[key];
        if (i !== undefined) inf[i] = v;
      }
    }

    // Eyes: small saccades around the camera.
    const g = gaze.current;
    if (t > g.next) {
      g.tx = (Math.random() - 0.5) * 0.12;
      g.ty = (Math.random() - 0.5) * 0.08;
      g.next = t + 0.8 + Math.random() * 2.2;
    }
    g.x += (g.tx - g.x) * 0.25;
    g.y += (g.ty - g.y) * 0.25;
    eyes.forEach((e) => e.rotation.set(g.y, g.x, 0));

    // Breathing and gentle head sway (more agitation when distressed).
    if (root.current) {
      const agit = emotion === "distressed" || emotion === "pain" ? 1.6 : emotion === "tired" ? 0.6 : 1;
      root.current.rotation.y = Math.sin(t * 0.35) * 0.06 * agit;
      root.current.rotation.x = Math.sin(t * 0.27 + 1) * 0.025 * agit + (emotion === "tired" ? 0.06 : 0);
      root.current.rotation.z = Math.sin(t * 0.21) * 0.015 * agit;
      root.current.position.y = Math.sin(t * 1.4) * 0.004;
    }
  });

  return (
    <group ref={root}>
      <primitive object={scene} />
    </group>
  );
}

class GLBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(e: unknown) {
    console.warn("[avatar-3d] falling back to 2D avatar:", e);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function PatientAvatar3D(props: AvatarRendererProps & { modelUrl?: string }) {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => setOk(webglAvailable()), []);
  const onFail = useCallback(() => setOk(false), []);
  const fallback = <PatientAvatar {...props} />;
  // Children keep the illustrated avatar: the default 3D head is an adult face.
  if (props.age < 12 || ok === false) return fallback;
  if (ok === null) return <div className="h-full w-full" />;
  return (
    <GLBoundary fallback={fallback}>
      <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0, 3], fov: 24 }} gl={{ antialias: true, alpha: true }} style={{ width: "100%", height: "100%" }} role="img" aria-label={`Patient virtuel en 3D`}>
        <ambientLight intensity={0.35} />
        <directionalLight position={[1.5, 2, 3]} intensity={2.2} color="#fff4ea" />
        <directionalLight position={[-2.5, 0.5, 1]} intensity={0.8} color="#cfe3ff" />
        <Environment resolution={128}>
          <Lightformer intensity={1.6} position={[0, 2, 3]} scale={[4, 2, 1]} color="#ffffff" />
          <Lightformer intensity={0.8} position={[-3, 0, 2]} rotation-y={Math.PI / 3} scale={[3, 3, 1]} color="#dbeafe" />
          <Lightformer intensity={0.6} position={[3, -1, 1]} rotation-y={-Math.PI / 3} scale={[3, 3, 1]} color="#fde7d6" />
        </Environment>
        <Suspense fallback={null}>
          <Bounds fit clip observe margin={1.08}>
            <FaceModel url={props.modelUrl ?? DEFAULT_AVATAR_MODEL} emotion={props.emotion} speaking={props.speaking} skin={props.config.skin} onFail={onFail} />
          </Bounds>
        </Suspense>
      </Canvas>
    </GLBoundary>
  );
}
