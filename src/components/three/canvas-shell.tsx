"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Shared Canvas wrapper: pauses rendering when off-screen, honours reduced motion,
 * caps device pixel ratio for performance, and fades in once the first frame is ready.
 */
export function CanvasShell({ children, className = "", camera = { position: [0, 0, 6] as [number, number, number], fov: 40 } }: { children: ReactNode; className?: string; camera?: { position: [number, number, number]; fov: number } }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={className || "relative h-full w-full"}>
      <Canvas
        dpr={[1, 1.75]}
        camera={camera}
        frameloop={visible && !reduced ? "always" : "demand"}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={() => setReady(true)}
        style={{ opacity: ready ? 1 : 0, transition: "opacity 1.2s ease" }}
      >
        {children}
      </Canvas>
    </div>
  );
}
