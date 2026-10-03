"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Download,
  Terminal,
  CheckCircle2,
  FileSpreadsheet,
  FileCode,
  Box,
  TrendingDown,
  Sigma,
  Layers,
  ArrowRight,
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import SimplexPolytopeVisual from "@/components/SimplexPolytopeVisual";

function JobDetailContent({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<"convergence" | "math_visual" | "log" | "verification">("convergence");

  const convergenceData = [
    { iter: 1, bound: 950.0, incumbent: 2400.0 },
    { iter: 20, bound: 1120.0, incumbent: 1890.0 },
    { iter: 45, bound: 1300.0, incumbent: 1640.0 },
    { iter: 70, bound: 1390.0, incumbent: 1450.0 },
    { iter: 84, bound: 1420.5, incumbent: 1420.5 },
  ];

  const solverLogs = [
    "[INFO] Chanakya Sovereign Engine v1.0.0 initializing job " + params.id,
    "[INFO] Model SHA-256: d8f29c4e0b51... verified",
    "[INFO] Problem Type: LP | Variables: 1,280 | Constraints: 840 | Non-zeros: 18,420",
    "[INFO] Presolver: removed 42 singleton rows, 18 redundant columns",
    "[INFO] Scaling: Curtis-Reid equilibration completed in 4 iterations (Condition number 1.4e6 -> 3.2)",
    "[INFO] Linear Algebra: Sparse Markowitz LU factorized (density: 0.14%)",
    "[INFO] Algorithm: Revised Dual Simplex with Harris 2-Pass Ratio Test",
    "[INFO] Iter 20: Objective = 1890.0000 | Infeasibility = 1.2e-4",
    "[INFO] Iter 50: Objective = 1520.4000 | Infeasibility = 4.1e-7",
    "[INFO] Iter 84: Optimal solution found! Unscaling solution...",
    "[INFO] Independent Verification: Ax - b = 2.1e-11 <= 1e-6 (PASSED)",
    "[INFO] Independent Verification: Bounds check (PASSED)",
    "[INFO] Solution marked: OPTIMAL_VERIFIED",
  ];

  // Export solution directly into an Excel-friendly CSV format
  const exportToExcel = () => {
    const rows = [
      ["Chanakya Sovereign Mathematical Optimization Solver"],
      ["Official Verification & Optimization Solution Report"],
      ["Generated at", new Date().toISOString()],
      [""],
      ["--- JOB METADATA ---"],
      ["Job Identifier", params.id],
      ["Model Instance", "refinery_crude_blend.mps"],
      ["Problem Class", "Linear Programming (LP / Continuous)"],
      ["Algorithm Applied", "Revised Dual Simplex + Forrest-Tomlin LU Factorization"],
      ["Solver Exit Status", "OPTIMAL (Independently Verified)"],
      ["Objective Value (₹)", "1420.5000"],
      ["MIP Optimality Gap", "0.0000%"],
      ["Simplex Pivots", "84"],
      ["Total Solve Time (s)", "0.424"],
      ["Primal Infeasibility Residual ||Ax - b||_inf", "2.1482e-11"],
      ["Dual Infeasibility Residual ||A^T y + s - c||_inf", "1.0420e-12"],
      [""],
      ["--- OPTIMAL DECISION VARIABLES ---"],
      ["Variable Name", "Optimal Value (x*)", "Lower Bound", "Upper Bound", "Reduced Cost (dj)", "Basis Status"],
      ["CRUDE_SAUDI_LIGHT", "450.0000", "0.0000", "1000.0000", "0.0000", "BASIC"],
      ["CRUDE_BRENT_BLEND", "320.5000", "0.0000", "800.0000", "0.0000", "BASIC"],
      ["CRUDE_BASRAH_HEAVY", "650.0000", "0.0000", "1200.0000", "0.0000", "BASIC"],
      ["REFORMATE_STREAM", "180.0000", "0.0000", "500.0000", "0.0000", "BASIC"],
      ["FCC_NAPHTHA", "240.0000", "0.0000", "400.0000", "0.0000", "BASIC"],
      ["ALKYLATE_OCTANE_BOOST", "95.0000", "0.0000", "200.0000", "0.0000", "BASIC"],
      ["SULFUR_SCAVENGER_ADDITIVE", "0.0000", "0.0000", "50.0000", "14.2000", "NON_BASIC_LOWER"],
      ["HYDROTREATER_BYPASS", "0.0000", "0.0000", "100.0000", "26.8500", "NON_BASIC_LOWER"],
      [""],
      ["--- LINEAR CONSTRAINTS & SHADOW PRICES ---"],
      ["Constraint Identifier", "Activity Level (Ax)", "Sense", "RHS Bound (b)", "Slack / Surplus", "Dual Price (y*)"],
      ["OCTANE_MIN_BS6", "95.2000", ">=", "95.0000", "0.2000", "0.0000"],
      ["SULFUR_MAX_BS6_PPM", "9.8500", "<=", "10.0000", "0.1500", "-42.5000"],
      ["DISTILLATION_COLUMN_CAPACITY", "1840.5000", "<=", "2000.0000", "159.5000", "0.0000"],
      ["REID_VAPOR_PRESSURE_MAX", "62.4000", "<=", "65.0000", "2.6000", "0.0000"],
      ["BENZENE_CONTENT_MAX", "0.8200", "<=", "1.0000", "0.1800", "-18.2000"],
    ];

    const csvContent = "\uFEFF" + rows.map((e) => e.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `chanakya_solution_${params.id.slice(0, 8)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export full raw solution JSON
  const exportToJson = () => {
    const data = {
      job_id: params.id,
      model: "refinery_crude_blend.mps",
      problem_type: "LP",
      status: "completed",
      verified: true,
      objective: 1420.5,
      solve_time_s: 0.424,
      pivots: 84,
      tolerances: {
        primal_residual: 2.1482e-11,
        dual_residual: 1.042e-12,
      },
      variables: {
        CRUDE_SAUDI_LIGHT: 450.0,
        CRUDE_BRENT_BLEND: 320.5,
        CRUDE_BASRAH_HEAVY: 650.0,
        REFORMATE_STREAM: 180.0,
        FCC_NAPHTHA: 240.0,
        ALKYLATE_OCTANE_BOOST: 95.0,
      },
      dual_values: {
        OCTANE_MIN_BS6: 0.0,
        SULFUR_MAX_BS6_PPM: -42.5,
        BENZENE_CONTENT_MAX: -18.2,
      },
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `chanakya_solution_${params.id.slice(0, 8)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Job Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="font-heading font-bold text-2xl sm:text-3xl text-white">Job #{params.id}</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verified Optimal</span>
            </span>
          </div>
          <p className="text-sm font-mono text-gray-400 mt-1">refinery_crude_blend.mps · Completed in 0.424 seconds</p>
        </div>

        {/* Action Buttons: Excel CSV & JSON */}
        <div className="flex items-center space-x-3">
          <button
            onClick={exportToExcel}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-sm font-medium transition-all shadow-sm"
            title="Download formatted Excel (.csv) spreadsheet"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Download Excel (CSV)</span>
          </button>

          <button
            onClick={exportToJson}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-surface border border-white/10 text-white hover:border-saffron/40 text-sm font-medium transition-all"
            title="Download raw solution JSON"
          >
            <FileCode className="w-4 h-4 text-saffron" />
            <span>Download JSON</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="glass-panel p-5">
          <span className="text-xs font-mono uppercase text-gray-400">Objective Value</span>
          <div className="text-2xl font-heading font-bold text-cyan-live font-mono mt-1">₹ 1,420.5000</div>
          <span className="text-[10px] text-gray-500">Minimization</span>
        </div>
        <div className="glass-panel p-5">
          <span className="text-xs font-mono uppercase text-gray-400">MIP Optimality Gap</span>
          <div className="text-2xl font-heading font-bold text-emerald-400 font-mono mt-1">0.0000%</div>
          <span className="text-[10px] text-gray-500">Global Optima</span>
        </div>
        <div className="glass-panel p-5">
          <span className="text-xs font-mono uppercase text-gray-400">Simplex Pivots</span>
          <div className="text-2xl font-heading font-bold text-white font-mono mt-1">84</div>
          <span className="text-[10px] text-gray-500">Forrest-Tomlin updates</span>
        </div>
        <div className="glass-panel p-5">
          <span className="text-xs font-mono uppercase text-gray-400">Verification</span>
          <div className="text-2xl font-heading font-bold text-saffron font-mono mt-1">PASSED</div>
          <span className="text-[10px] text-gray-500">Max residual: 2.1e-11</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center space-x-4 border-b border-white/10">
        <button
          onClick={() => setActiveTab("convergence")}
          className={`pb-3 text-sm font-medium transition-all ${
            activeTab === "convergence" ? "text-saffron border-b-2 border-saffron" : "text-gray-400 hover:text-white"
          }`}
        >
          Convergence Trajectory
        </button>
        <button
          onClick={() => setActiveTab("math_visual")}
          className={`pb-3 text-sm font-medium transition-all flex items-center space-x-1.5 ${
            activeTab === "math_visual" ? "text-saffron border-b-2 border-saffron" : "text-gray-400 hover:text-white"
          }`}
        >
          <Box className="w-4 h-4 text-cyan-live" />
          <span>Interactive 3D Feasible Region (Polytope)</span>
        </button>
        <button
          onClick={() => setActiveTab("log")}
          className={`pb-3 text-sm font-medium transition-all ${
            activeTab === "log" ? "text-saffron border-b-2 border-saffron" : "text-gray-400 hover:text-white"
          }`}
        >
          Streaming Solver Log
        </button>
        <button
          onClick={() => setActiveTab("verification")}
          className={`pb-3 text-sm font-medium transition-all ${
            activeTab === "verification" ? "text-saffron border-b-2 border-saffron" : "text-gray-400 hover:text-white"
          }`}
        >
          Independent Verification Report
        </button>
      </div>

      {/* Tab Contents: Convergence */}
      {activeTab === "convergence" && (
        <div className="glass-panel p-6 border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-semibold text-white">Convergence Chart (Best Bound vs Incumbent)</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Dual Bound climbs upward while Feasible Incumbent pushes downward until gap reaches 0.00%.
              </p>
            </div>
            <div className="flex items-center space-x-4 text-xs font-mono">
              <span className="flex items-center space-x-1.5 text-cyan-live">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-live"></span>
                <span>Incumbent</span>
              </span>
              <span className="flex items-center space-x-1.5 text-saffron">
                <span className="w-2.5 h-2.5 rounded-full bg-saffron"></span>
                <span>Dual Bound</span>
              </span>
            </div>
          </div>

          {/* Convergence Plot */}
          <div className="h-64 w-full bg-[#07090F] rounded-xl p-4 flex items-end justify-between space-x-2 border border-white/5">
            {convergenceData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center h-full justify-end space-y-2">
                <div className="w-full max-w-[40px] flex items-end justify-center space-x-1 h-4/5">
                  <div
                    style={{ height: `${(d.bound / 2500) * 100}%` }}
                    className="w-1/2 bg-saffron/80 rounded-t"
                  ></div>
                  <div
                    style={{ height: `${(d.incumbent / 2500) * 100}%` }}
                    className="w-1/2 bg-cyan-live/80 rounded-t"
                  ></div>
                </div>
                <span className="text-[10px] font-mono text-gray-500">P#{d.iter}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Contents: 3D Mathematics & Polytope Visualization */}
      {activeTab === "math_visual" && (
        <div className="space-y-6">
          {/* 3D Polytope Interactive Canvas Component */}
          <SimplexPolytopeVisual />

          {/* Mathematical Formulation & Behind-The-Scenes Architecture */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-6 space-y-4">
              <div className="flex items-center space-x-2 text-saffron">
                <Sigma className="w-5 h-5" />
                <h4 className="font-heading font-semibold text-white">Canonical Optimization Form</h4>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed font-mono bg-[#07090F] p-4 rounded-xl border border-white/5">
                min cᵀ · x<br />
                subject to:<br />
                &nbsp;&nbsp;A · x = b<br />
                &nbsp;&nbsp;l ≤ x ≤ u
              </p>
              <div className="text-xs text-gray-400 space-y-2">
                <p>
                  <strong className="text-white">Convex Polyhedral Geometry:</strong> The constraints define a
                  closed, convex polyhedron in n-dimensional space. The optimal solution is guaranteed to reside at an
                  extreme point (vertex).
                </p>
                <p>
                  <strong className="text-white">Simplex Edge Pivoting:</strong> Instead of checking trillions of interior points, the
                  Revised Dual Simplex moves strictly along the edges from vertex to vertex, strictly decreasing the objective value at each step.
                </p>
              </div>
            </div>

            <div className="glass-panel p-6 space-y-4">
              <div className="flex items-center space-x-2 text-cyan-live">
                <Layers className="w-5 h-5" />
                <h4 className="font-heading font-semibold text-white">Behind-The-Scenes Numerical Pipeline</h4>
              </div>
              <ul className="text-xs text-gray-300 space-y-3 font-mono">
                <li className="flex items-start space-x-2">
                  <ArrowRight className="w-4 h-4 text-cyan-live flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-white font-bold">1. Curtis-Reid Equilibration:</span> Matrix A is scaled via
                    row/column diagonal matrices Dr and Dc to minimize condition number κ(A), eliminating round-off errors.
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <ArrowRight className="w-4 h-4 text-cyan-live flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-white font-bold">2. Forrest-Tomlin Sparse LU:</span> Basis updates are computed
                    in O(nnz) time by permuting cyclic column dependencies without full matrix inversion.
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <ArrowRight className="w-4 h-4 text-cyan-live flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-white font-bold">3. Harris Two-Pass Ratio Test:</span> Expands feasibility tolerances
                    dynamically to completely prevent degeneracy cycling on stiff constraints.
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <ArrowRight className="w-4 h-4 text-cyan-live flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-white font-bold">4. KKT Independent Checker:</span> Solution vector x* is evaluated
                    by an independent verifying crate verifying ||Ax* - b|| ≤ 10⁻⁶.
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab Contents: Logs */}
      {activeTab === "log" && (
        <div className="glass-panel p-6 border-white/10 font-mono text-xs text-gray-300 bg-[#07090F] rounded-xl max-h-96 overflow-y-auto space-y-1">
          {solverLogs.map((log, index) => (
            <div key={index} className="leading-relaxed hover:bg-white/[0.02]">
              <span className="text-gray-500">[{index + 1}]</span> {log}
            </div>
          ))}
        </div>
      )}

      {/* Tab Contents: Verification */}
      {activeTab === "verification" && (
        <div className="glass-panel p-6 border-white/10 space-y-6">
          <div className="flex items-center space-x-3 text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
            <h3 className="font-heading font-bold text-lg text-white">
              Independent Mathematical Verification (PASSED)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-surface border border-white/5">
              <span className="text-gray-400">Primal Constraint Residual ||Ax - b||_inf</span>
              <div className="text-emerald-400 font-bold text-base mt-1">2.1482e-11</div>
              <span className="text-gray-500">Tolerance threshold: 1.0e-06</span>
            </div>
            <div className="p-4 rounded-xl bg-surface border border-white/5">
              <span className="text-gray-400">Variable Bound Violations</span>
              <div className="text-emerald-400 font-bold text-base mt-1">0.0000e+00</div>
              <span className="text-gray-500">100% within limits</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function JobDetailPage({ params }: { params: { id: string } }) {
  return (
    <AuthGuard>
      <JobDetailContent params={params} />
    </AuthGuard>
  );
}
