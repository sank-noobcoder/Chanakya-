"use client";

import React, { useState } from "react";
import { ShieldCheck, Download, StopCircle, RefreshCw, Terminal, CheckCircle2 } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";

function JobDetailContent({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<"convergence" | "log" | "verification">("convergence");

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
    "[INFO] Scaling: Curtis-Reid equilibration completed in 4 iterations",
    "[INFO] Linear Algebra: Sparse Markowitz LU factorized (density: 0.14%)",
    "[INFO] Algorithm: Revised Dual Simplex with Harris 2-Pass Ratio Test",
    "[INFO] Iter 20: Objective = 1890.0000 | Infeasibility = 1.2e-4",
    "[INFO] Iter 50: Objective = 1520.4000 | Infeasibility = 4.1e-7",
    "[INFO] Iter 84: Optimal solution found! Unscaling solution...",
    "[INFO] Independent Verification: Ax - b = 2.1e-11 <= 1e-6 (PASSED)",
    "[INFO] Independent Verification: Bounds check (PASSED)",
    "[INFO] Solution marked: OPTIMAL_VERIFIED",
  ];

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

        <div className="flex items-center space-x-3">
          <button
            onClick={() => alert("Downloading verified solution JSON...")}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-surface border border-white/10 text-white hover:border-saffron/40 text-sm font-medium transition-all"
          >
            <Download className="w-4 h-4 text-saffron" />
            <span>Download Solution</span>
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

      {/* Tab Contents */}
      {activeTab === "convergence" && (
        <div className="glass-panel p-6 border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-semibold text-white">Convergence Chart (Best Bound vs Incumbent)</h3>
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

      {activeTab === "log" && (
        <div className="glass-panel p-6 border-white/10 font-mono text-xs text-gray-300 bg-[#07090F] rounded-xl max-h-96 overflow-y-auto space-y-1">
          {solverLogs.map((log, index) => (
            <div key={index} className="leading-relaxed hover:bg-white/[0.02]">
              <span className="text-gray-500">[{index + 1}]</span> {log}
            </div>
          ))}
        </div>
      )}

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

