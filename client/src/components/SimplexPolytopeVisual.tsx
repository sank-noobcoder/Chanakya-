"use client";

import React, { useEffect, useRef, useState } from "react";

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface SimplexPolytopeVisualProps {
  targetObjective?: number;
  modelName?: string;
}

export default function SimplexPolytopeVisual({
  targetObjective = 1420.5,
  modelName,
}: SimplexPolytopeVisualProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [currentObjective, setCurrentObjective] = useState<number>(targetObjective);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0;

    // Define 3D polytope vertices (Truncated octahedron / convex feasible region)
    const vertices: Point3D[] = [
      { x: -1.2, y: -0.6, z: -0.6 },
      { x: -0.6, y: -1.2, z: -0.6 },
      { x: 0.6, y: -1.2, z: -0.6 },
      { x: 1.2, y: -0.6, z: -0.6 },
      { x: 1.2, y: 0.6, z: -0.6 },
      { x: 0.6, y: 1.2, z: -0.6 },
      { x: -0.6, y: 1.2, z: -0.6 },
      { x: -1.2, y: 0.6, z: -0.6 },
      // Top cap
      { x: -0.8, y: -0.4, z: 0.8 },
      { x: 0.8, y: -0.4, z: 0.8 },
      { x: 0.8, y: 0.4, z: 0.8 },
      { x: -0.8, y: 0.4, z: 0.8 },
      // Optimal vertex
      { x: 0.0, y: 1.0, z: 1.2 },
    ];

    // Simplex pivot sequence along adjacent vertices towards optimal
    const simplexPath = [0, 1, 2, 9, 10, 12];
    const objectiveValues = [
      targetObjective * 1.85,
      targetObjective * 1.55,
      targetObjective * 1.32,
      targetObjective * 1.15,
      targetObjective * 1.04,
      targetObjective,
    ];

    let pathProgress = 0;
    let pathIndex = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const scale = Math.min(width, height) * 0.32;

      angle += 0.008;

      // Rotate 3D vertices
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const cosB = Math.cos(0.5);
      const sinB = Math.sin(0.5);

      const projected = vertices.map((v) => {
        // Rotation around Y
        const x1 = v.x * cosA - v.z * sinA;
        const z1 = v.x * sinA + v.z * cosA;
        // Rotation around X
        const y2 = v.y * cosB - z1 * sinB;
        const z2 = v.y * sinB + z1 * cosB;

        // Perspective projection
        const fov = 3.0;
        const pz = z2 + fov;
        return {
          x: width / 2 + (x1 / pz) * scale,
          y: height / 2 - (y2 / pz) * scale,
          depth: z2,
        };
      });

      // Draw polytope wireframe edges
      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.lineWidth = 1.5;

      for (let i = 0; i < vertices.length; i++) {
        for (let j = i + 1; j < vertices.length; j++) {
          const dx = vertices[i].x - vertices[j].x;
          const dy = vertices[i].y - vertices[j].y;
          const dz = vertices[i].z - vertices[j].z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          // Connect neighboring vertices only
          if (dist < 1.45) {
            ctx.beginPath();
            ctx.moveTo(projected[i].x, projected[i].y);
            ctx.lineTo(projected[j].x, projected[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw all vertices
      projected.forEach((p, idx) => {
        ctx.fillStyle = idx === 12 ? "#34D399" : "rgba(255, 153, 51, 0.6)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, idx === 12 ? 5 : 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Simplex Trajectory (Path along vertices)
      ctx.strokeStyle = "#FF9933";
      ctx.lineWidth = 3;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      for (let k = 0; k <= pathIndex; k++) {
        const p = projected[simplexPath[k]];
        if (k === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Interpolate current active Simplex pivot point
      pathProgress += 0.015;
      if (pathProgress >= 1.0) {
        pathProgress = 0;
        pathIndex = (pathIndex + 1) % simplexPath.length;
        setCurrentStep(pathIndex);
        setCurrentObjective(objectiveValues[pathIndex]);
      }

      const pCurrent = projected[simplexPath[pathIndex]];
      const nextIndex = (pathIndex + 1) % simplexPath.length;
      const pNext = projected[simplexPath[nextIndex]];

      const currentX = pCurrent.x + (pNext.x - pCurrent.x) * pathProgress;
      const currentY = pCurrent.y + (pNext.y - pCurrent.y) * pathProgress;

      // Glow effect for Simplex Current Pivot
      const gradient = ctx.createRadialGradient(currentX, currentY, 2, currentX, currentY, 18);
      gradient.addColorStop(0, "#FFC24D");
      gradient.addColorStop(0.5, "rgba(255, 153, 51, 0.5)");
      gradient.addColorStop(1, "transparent");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(currentX, currentY, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(currentX, currentY, 4, 0, Math.PI * 2);
      ctx.fill();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [targetObjective]);

  return (
    <div className="relative w-full h-[380px] sm:h-[460px] flex items-center justify-center">
      {/* 3D Canvas */}
      <canvas
        ref={canvasRef}
        width={500}
        height={460}
        className="max-w-full h-auto cursor-grab active:cursor-grabbing"
      />

      {/* Floating Mission Control Stat Overlays */}
      <div className="absolute top-4 left-4 glass-panel px-3.5 py-2 text-xs font-mono border-white/10 shadow-lg">
        <div className="flex items-center space-x-2 text-gray-400">
          <span className="w-2 h-2 rounded-full bg-saffron animate-ping"></span>
          <span>{modelName ? `${modelName}` : "Dual Revised Simplex Pivot"}</span>
        </div>
        <div className="text-white font-bold mt-1">Iteration #{currentStep * 14 + 28}</div>
      </div>

      <div className="absolute bottom-4 right-4 glass-panel px-3.5 py-2 text-xs font-mono border-white/10 shadow-lg text-right">
        <span className="text-gray-400">Current Objective (cᵀ x)</span>
        <div className="text-cyan-live font-bold text-sm tabular-nums mt-0.5">
          ₹ {currentObjective >= 100000 ? currentObjective.toLocaleString("en-IN", { maximumFractionDigits: 2 }) : currentObjective.toFixed(4)}
        </div>
        <span className="text-[10px] text-emerald-400">Feasible Basis</span>
      </div>
    </div>
  );
}
