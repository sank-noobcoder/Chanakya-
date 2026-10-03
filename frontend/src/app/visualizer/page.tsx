"use client";

import React from "react";
import Link from "next/link";
import { Box, Sigma, Layers, ArrowRight, Play, ArrowLeft, RefreshCw } from "lucide-react";
import SimplexPolytopeVisual from "@/components/SimplexPolytopeVisual";

export default function VisualizerPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-live/10 border border-cyan-live/20 flex items-center justify-center text-cyan-live">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-2xl sm:text-3xl text-white">
                Interactive 3D Feasible Region (Polytope)
              </h1>
              <p className="text-sm font-mono text-gray-400 mt-0.5">
                Real-time geometric visualization of high-dimensional convex hulls and Simplex edge-traversal.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/jobs/new"
            className="btn-saffron flex items-center space-x-2 text-sm px-4 py-2"
          >
            <Play className="w-4 h-4" />
            <span>Solve a Model</span>
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-surface border border-white/10 text-gray-300 hover:text-white text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Main 3D Interactive Polytope Visualizer Canvas */}
      <div className="glass-panel p-6 border-white/10 space-y-4">
        <SimplexPolytopeVisual />
      </div>

      {/* Mathematical Architecture Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center space-x-2 text-saffron">
            <Sigma className="w-5 h-5" />
            <h3 className="font-heading font-semibold text-lg text-white">Canonical Optimization Form</h3>
          </div>
          <div className="bg-[#07090F] p-4 rounded-xl border border-white/5 font-mono text-xs text-gray-300 leading-relaxed">
            min cᵀ · x<br />
            subject to:<br />
            &nbsp;&nbsp;A · x = b<br />
            &nbsp;&nbsp;l ≤ x ≤ u
          </div>
          <div className="text-xs text-gray-400 space-y-3">
            <p>
              <strong className="text-white">Convex Polyhedron Geometry:</strong> Each linear constraint defines a
              hyperplane dividing the solution space into half-spaces. The intersection of these half-spaces forms a
              bounded convex polyhedron (polytope).
            </p>
            <p>
              <strong className="text-white">Fundamental Theorem of Linear Programming:</strong> Because the feasible
              region is convex and the objective function is linear, the global optimum is guaranteed to lie on at least
              one of the extreme points (vertices).
            </p>
            <p>
              <strong className="text-white">Simplex Edge Pivoting:</strong> Rather than evaluating the infinite number
              of points inside the polytope, Chanakya Dual Simplex traverses strictly along adjacent 1D edges (edges
              connecting neighboring vertices), guaranteeing strict monotonicity in objective value until optimum is reached.
            </p>
          </div>
        </div>

        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center space-x-2 text-cyan-live">
            <Layers className="w-5 h-5" />
            <h3 className="font-heading font-semibold text-lg text-white">Behind-The-Scenes Mathematical Engine</h3>
          </div>
          <ul className="text-xs text-gray-300 space-y-3.5 font-mono">
            <li className="flex items-start space-x-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <ArrowRight className="w-4 h-4 text-cyan-live flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-white font-bold block mb-0.5">1. Curtis-Reid Matrix Equilibration</span>
                Matrix A is diagonally preconditioned (A' = Dr · A · Dc) to equilibrate condition number, preventing floating-point ill-conditioning.
              </div>
            </li>
            <li className="flex items-start space-x-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <ArrowRight className="w-4 h-4 text-cyan-live flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-white font-bold block mb-0.5">2. Forrest-Tomlin Sparse LU Factorization</span>
                Basis matrix factorization B = L · U is dynamically updated in O(nnz) time using cyclic permutations, avoiding expensive O(n³) inversions.
              </div>
            </li>
            <li className="flex items-start space-x-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <ArrowRight className="w-4 h-4 text-cyan-live flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-white font-bold block mb-0.5">3. Harris Two-Pass Ratio Test</span>
                Uses a dynamic 2-pass pivot ratio threshold to handle degenerate pivots and mathematically guarantee anti-cycling.
              </div>
            </li>
            <li className="flex items-start space-x-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <ArrowRight className="w-4 h-4 text-cyan-live flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-white font-bold block mb-0.5">4. Karush-Kuhn-Tucker (KKT) Independent Verifier</span>
                Raw primal residual ||Ax* - b||_inf ≤ 10⁻⁶ and dual residual ||Aᵀy* + s* - c||_inf ≤ 10⁻⁶ are evaluated independently before marking verified.
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
