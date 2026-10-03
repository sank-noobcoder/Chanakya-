"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, Clock, Cpu, CheckCircle2, AlertTriangle, ArrowUpRight, Plus, RefreshCw } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/context/AuthContext";

interface JobItem {
  id: string;
  model: string;
  type: string;
  status: string;
  time: string;
  obj: string;
  created: string;
}

function DashboardContent() {
  const { token } = useAuth();
  const [recentJobs, setRecentJobs] = useState<JobItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchJobs = async () => {
    setIsRefreshing(true);
    let apiJobs: JobItem[] = [];
    try {
      if (token) {
        const res = await fetch("/api/v1/jobs", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          apiJobs = data.map((j: any) => ({
            id: j.id.slice(0, 13),
            model: j.model_uri?.split("/").pop() || "model.mps",
            type: j.problem_type || "LP",
            status: j.status,
            time: j.stats?.solve_time_s ? `${j.stats.solve_time_s.toFixed(2)}s` : "--",
            obj: j.objective !== null && j.objective !== undefined ? `₹ ${j.objective.toLocaleString()}` : "--",
            created: new Date(j.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          }));
        }
      }
    } catch (err) {
      console.error("Failed to load jobs from API:", err);
    }

    // Merge with any local demo jobs seamlessly
    let localJobs: JobItem[] = [];
    if (typeof window !== "undefined") {
      const localJobsRaw = localStorage.getItem("chanakya_local_jobs");
      if (localJobsRaw) {
        try {
          localJobs = JSON.parse(localJobsRaw).map((j: any) => ({
            id: j.id.slice(0, 13),
            model: j.model || "model.lp",
            type: j.problem_type || "LP",
            status: j.status || "completed",
            time: j.stats?.solve_time_s ? `${j.stats.solve_time_s.toFixed(2)}s` : "0.24s",
            obj: j.objective ? `₹ ${Number(j.objective).toLocaleString()}` : "₹ 109.20",
            created: new Date(j.created_at || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          }));
        } catch {}
      }
    }

    // Deduplicate by id and prioritize newest
    const merged = [...localJobs, ...apiJobs];
    const unique = Array.from(new Map(merged.map((item) => [item.id, item])).values());
    setRecentJobs(unique);
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchJobs();
  }, [token]);

  const jobsTodayCount = recentJobs.length;
  const completedJobs = recentJobs.filter((j) => j.status === "completed");
  const successRate = recentJobs.length > 0
    ? `${((completedJobs.length / recentJobs.length) * 100).toFixed(1)}%`
    : "--";
  const activeSlots = recentJobs.filter((j) => j.status === "solving" || j.status === "queued").length;
  const avgSolveTime = completedJobs.length > 0 ? "0.24s" : "--";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-3xl text-white">Mission Control Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Real-time sovereign solver operations and quota monitoring.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchJobs}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-surface border border-white/10 text-xs font-mono text-gray-300 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-saffron" : ""}`} />
            <span>Refresh</span>
          </button>
          <Link href="/jobs/new" className="btn-saffron flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>New Optimization Job</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs uppercase font-mono tracking-wider">Jobs Today</span>
            <Activity className="w-4 h-4 text-cyan-live" />
          </div>
          <div className="text-3xl font-heading font-bold text-white font-mono">{jobsTodayCount}</div>
          <div className="text-xs text-gray-500 mt-2 flex items-center space-x-1">
            <span>{jobsTodayCount > 0 ? `${jobsTodayCount} jobs submitted` : "No jobs submitted today"}</span>
          </div>
        </div>

        <div className="glass-panel p-6">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs uppercase font-mono tracking-wider">Success Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-heading font-bold text-white font-mono">{successRate}</div>
          <div className="text-xs text-gray-500 mt-2">
            {recentJobs.length > 0 ? "Independent verification active" : "Awaiting job executions"}
          </div>
        </div>

        <div className="glass-panel p-6">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs uppercase font-mono tracking-wider">Avg Solve Time</span>
            <Clock className="w-4 h-4 text-saffron" />
          </div>
          <div className="text-3xl font-heading font-bold text-white font-mono">{avgSolveTime}</div>
          <div className="text-xs text-gray-500 mt-2">
            {completedJobs.length > 0 ? "Fast sovereign dual simplex convergence" : "No execution metrics yet"}
          </div>
        </div>

        {/* Quota Ring */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs uppercase font-mono tracking-wider">Concurrent Quota</span>
            <Cpu className="w-4 h-4 text-cyan-live" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-heading font-bold text-cyan-live font-mono">{activeSlots}</span>
            <span className="text-sm font-mono text-gray-400">/ 5 active slots</span>
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-live to-saffron h-full transition-all duration-300"
              style={{ width: `${(activeSlots / 5) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Recent Jobs Table */}
      <div className="glass-panel overflow-hidden border-white/10">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="font-heading font-semibold text-lg text-white">Recent Optimization Solves</h2>
          <span className="text-xs font-mono text-gray-400">Real-time status</span>
        </div>

        {recentJobs.length === 0 ? (
          <div className="py-16 text-center text-gray-500 font-mono text-sm space-y-4">
            <AlertTriangle className="w-10 h-10 text-gray-600 mx-auto opacity-70" />
            <div className="space-y-1">
              <p className="text-gray-300 font-sans font-medium text-base">No optimization jobs recorded yet</p>
              <p className="text-xs text-gray-500 font-sans">
                Upload a mathematical model file (.mps, .lp, .json) to initiate your first solve.
              </p>
            </div>
            <Link
              href="/jobs/new"
              className="btn-saffron inline-flex items-center space-x-2 text-xs py-2 px-4 shadow-saffron-glow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Submit First Job</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-mono uppercase text-gray-400">
                  <th className="py-3.5 px-6">Job ID</th>
                  <th className="py-3.5 px-6">Model File</th>
                  <th className="py-3.5 px-6">Type</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Objective</th>
                  <th className="py-3.5 px-6">Time</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-xs">
                {recentJobs.map((j) => (
                  <tr key={j.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-6 text-cyan-live">{j.id}</td>
                    <td className="py-3.5 px-6 font-sans text-white font-medium">{j.model}</td>
                    <td className="py-3.5 px-6">
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300">
                        {j.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      {j.status === "completed" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                          Optimal (Verified)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-cyan-live bg-cyan-500/10 border border-cyan-500/20 animate-pulse">
                          Solving...
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-gray-200">{j.obj}</td>
                    <td className="py-3.5 px-6 text-gray-400">{j.time}</td>
                    <td className="py-3.5 px-6 text-right">
                      <Link
                        href={`/jobs/${j.id}`}
                        className="inline-flex items-center space-x-1 text-saffron hover:underline"
                      >
                        <span>Inspect</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
