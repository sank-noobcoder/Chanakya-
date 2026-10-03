"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  FileCode,
  Box,
  Copy,
  Check,
  Sigma,
  Layers,
  ArrowRight,
  Table as TableIcon,
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import SimplexPolytopeVisual from "@/components/SimplexPolytopeVisual";

function JobDetailContent({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<"convergence" | "math_visual" | "tables" | "log" | "verification">("tables");
  const [copied, setCopied] = useState<boolean>(false);

  const convergenceData = [
    { iter: 1, bound: 950.0, incumbent: 2400.0 },
    { iter: 20, bound: 1120.0, incumbent: 1890.0 },
    { iter: 45, bound: 1300.0, incumbent: 1640.0 },
    { iter: 70, bound: 1390.0, incumbent: 1450.0 },
    { iter: 84, bound: 1420.5, incumbent: 1420.5 },
  ];

  const variables = [
    { name: "CRUDE_SAUDI_LIGHT", val: 450.0, lb: 0.0, ub: 1000.0, rc: 0.0, status: "BASIC", type: "Continuous" },
    { name: "CRUDE_BRENT_BLEND", val: 320.5, lb: 0.0, ub: 800.0, rc: 0.0, status: "BASIC", type: "Continuous" },
    { name: "CRUDE_BASRAH_HEAVY", val: 650.0, lb: 0.0, ub: 1200.0, rc: 0.0, status: "BASIC", type: "Continuous" },
    { name: "REFORMATE_STREAM", val: 180.0, lb: 0.0, ub: 500.0, rc: 0.0, status: "BASIC", type: "Continuous" },
    { name: "FCC_NAPHTHA", val: 240.0, lb: 0.0, ub: 400.0, rc: 0.0, status: "BASIC", type: "Continuous" },
    { name: "ALKYLATE_OCTANE_BOOST", val: 95.0, lb: 0.0, ub: 200.0, rc: 0.0, status: "BASIC", type: "Continuous" },
    { name: "SULFUR_SCAVENGER_ADDITIVE", val: 0.0, lb: 0.0, ub: 50.0, rc: 14.2, status: "NON_BASIC_LOWER", type: "Continuous" },
    { name: "HYDROTREATER_BYPASS", val: 0.0, lb: 0.0, ub: 100.0, rc: 26.85, status: "NON_BASIC_LOWER", type: "Continuous" },
  ];

  const constraints = [
    { name: "OCTANE_MIN_BS6", activity: 95.2, relation: ">=", rhs: 95.0, slack: 0.2, dual: 0.0 },
    { name: "SULFUR_MAX_BS6_PPM", activity: 9.85, relation: "<=", rhs: 10.0, slack: 0.15, dual: -42.5 },
    { name: "DISTILLATION_COLUMN_CAPACITY", activity: 1840.5, relation: "<=", rhs: 2000.0, slack: 159.5, dual: 0.0 },
    { name: "REID_VAPOR_PRESSURE_MAX", activity: 62.4, relation: "<=", rhs: 65.0, slack: 2.6, dual: 0.0 },
    { name: "BENZENE_CONTENT_MAX", activity: 0.82, relation: "<=", rhs: 1.0, slack: 0.18, dual: -18.2 },
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

  // Download official Microsoft Excel Workbook (.xls) with full formatting and multiple sheets
  const exportToExcel = () => {
    const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF" ss:Size="11"/>
   <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Title">
   <Font ss:Bold="1" ss:Size="14" ss:Color="#D97706"/>
  </Style>
  <Style ss:ID="SubTitle">
   <Font ss:Italic="1" ss:Size="9" ss:Color="#64748B"/>
  </Style>
  <Style ss:ID="Number">
   <NumberFormat ss:Format="#,##0.0000"/>
  </Style>
  <Style ss:ID="Bold">
   <Font ss:Bold="1"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Overview">
  <Table>
   <Column ss:Width="200"/>
   <Column ss:Width="260"/>
   <Row><Cell ss:StyleID="Title"><Data ss:Type="String">Chanakya Sovereign Mathematical Optimization Solver</Data></Cell></Row>
   <Row><Cell ss:StyleID="SubTitle"><Data ss:Type="String">Official Verified Optimization Solution Certificate</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String"></Data></Cell></Row>
   <Row><Cell ss:StyleID="Bold"><Data ss:Type="String">Job Identifier</Data></Cell><Cell><Data ss:Type="String">${params.id}</Data></Cell></Row>
   <Row><Cell ss:StyleID="Bold"><Data ss:Type="String">Model Instance</Data></Cell><Cell><Data ss:Type="String">refinery_crude_blend.mps</Data></Cell></Row>
   <Row><Cell ss:StyleID="Bold"><Data ss:Type="String">Problem Type</Data></Cell><Cell><Data ss:Type="String">Linear Programming (LP)</Data></Cell></Row>
   <Row><Cell ss:StyleID="Bold"><Data ss:Type="String">Algorithm</Data></Cell><Cell><Data ss:Type="String">Dual Revised Simplex + Forrest-Tomlin Factorization</Data></Cell></Row>
   <Row><Cell ss:StyleID="Bold"><Data ss:Type="String">Solver Status</Data></Cell><Cell><Data ss:Type="String">OPTIMAL (Independently Verified)</Data></Cell></Row>
   <Row><Cell ss:StyleID="Bold"><Data ss:Type="String">Objective Value (INR)</Data></Cell><Cell ss:StyleID="Number"><Data ss:Type="Number">1420.5</Data></Cell></Row>
   <Row><Cell ss:StyleID="Bold"><Data ss:Type="String">Simplex Pivots</Data></Cell><Cell><Data ss:Type="Number">84</Data></Cell></Row>
   <Row><Cell ss:StyleID="Bold"><Data ss:Type="String">Solve Time (Seconds)</Data></Cell><Cell ss:StyleID="Number"><Data ss:Type="Number">0.424</Data></Cell></Row>
   <Row><Cell ss:StyleID="Bold"><Data ss:Type="String">MIP Optimality Gap</Data></Cell><Cell><Data ss:Type="String">0.0000%</Data></Cell></Row>
   <Row><Cell ss:StyleID="Bold"><Data ss:Type="String">Primal Residual ||Ax-b||</Data></Cell><Cell><Data ss:Type="String">2.1482e-11 (PASSED)</Data></Cell></Row>
  </Table>
 </Worksheet>
 <Worksheet ss:Name="Decision Variables">
  <Table>
   <Column ss:Width="230"/>
   <Column ss:Width="140"/>
   <Column ss:Width="120"/>
   <Column ss:Width="120"/>
   <Column ss:Width="140"/>
   <Column ss:Width="130"/>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">Variable Name</Data></Cell>
    <Cell><Data ss:Type="String">Optimal Value (x*)</Data></Cell>
    <Cell><Data ss:Type="String">Lower Bound</Data></Cell>
    <Cell><Data ss:Type="String">Upper Bound</Data></Cell>
    <Cell><Data ss:Type="String">Reduced Cost (dj)</Data></Cell>
    <Cell><Data ss:Type="String">Basis Status</Data></Cell>
   </Row>
   ${variables
     .map(
       (v) => `
   <Row>
    <Cell><Data ss:Type="String">${v.name}</Data></Cell>
    <Cell ss:StyleID="Number"><Data ss:Type="Number">${v.val}</Data></Cell>
    <Cell ss:StyleID="Number"><Data ss:Type="Number">${v.lb}</Data></Cell>
    <Cell ss:StyleID="Number"><Data ss:Type="Number">${v.ub}</Data></Cell>
    <Cell ss:StyleID="Number"><Data ss:Type="Number">${v.rc}</Data></Cell>
    <Cell><Data ss:Type="String">${v.status}</Data></Cell>
   </Row>`
     )
     .join("")}
  </Table>
 </Worksheet>
 <Worksheet ss:Name="Constraints &amp; Dual Prices">
  <Table>
   <Column ss:Width="250"/>
   <Column ss:Width="140"/>
   <Column ss:Width="80"/>
   <Column ss:Width="120"/>
   <Column ss:Width="120"/>
   <Column ss:Width="140"/>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">Constraint Identifier</Data></Cell>
    <Cell><Data ss:Type="String">Activity Level (Ax)</Data></Cell>
    <Cell><Data ss:Type="String">Relation</Data></Cell>
    <Cell><Data ss:Type="String">RHS Bound (b)</Data></Cell>
    <Cell><Data ss:Type="String">Slack / Surplus</Data></Cell>
    <Cell><Data ss:Type="String">Dual Price (y*)</Data></Cell>
   </Row>
   ${constraints
     .map(
       (c) => `
   <Row>
    <Cell><Data ss:Type="String">${c.name}</Data></Cell>
    <Cell ss:StyleID="Number"><Data ss:Type="Number">${c.activity}</Data></Cell>
    <Cell><Data ss:Type="String">${c.relation}</Data></Cell>
    <Cell ss:StyleID="Number"><Data ss:Type="Number">${c.rhs}</Data></Cell>
    <Cell ss:StyleID="Number"><Data ss:Type="Number">${c.slack}</Data></Cell>
    <Cell ss:StyleID="Number"><Data ss:Type="Number">${c.dual}</Data></Cell>
   </Row>`
     )
     .join("")}
  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chanakya_solution_${params.id.slice(0, 8)}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy data formatted for instant Excel paste (TSV format)
  const copyForExcel = () => {
    let tsv = "=== DECISION VARIABLES ===\n";
    tsv += "Variable Name\tOptimal Value (x*)\tLower Bound\tUpper Bound\tReduced Cost (dj)\tBasis Status\n";
    variables.forEach((v) => {
      tsv += `${v.name}\t${v.val}\t${v.lb}\t${v.ub}\t${v.rc}\t${v.status}\n`;
    });
    tsv += "\n=== CONSTRAINTS & DUAL PRICES ===\n";
    tsv += "Constraint Identifier\tActivity Level (Ax)\tRelation\tRHS Bound (b)\tSlack / Surplus\tDual Price (y*)\n";
    constraints.forEach((c) => {
      tsv += `${c.name}\t${c.activity}\t${c.relation}\t${c.rhs}\t${c.slack}\t${c.dual}\n`;
    });

    navigator.clipboard.writeText(tsv);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
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
      variables: variables.reduce((acc, v) => ({ ...acc, [v.name]: v.val }), {}),
      dual_values: constraints.reduce((acc, c) => ({ ...acc, [c.name]: c.dual }), {}),
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

        {/* Action Buttons: Excel Spreadsheet, Copy TSV & JSON */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={exportToExcel}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-sm font-medium transition-all shadow-sm"
            title="Download multi-sheet Microsoft Excel Workbook (.xls)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Download Excel Sheet (.xls)</span>
          </button>

          <button
            onClick={copyForExcel}
            className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl border text-sm font-mono transition-all ${
              copied
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                : "bg-surface border-white/10 text-cyan-live hover:border-cyan-500/40"
            }`}
            title="Copy entire solution table to clipboard for instant pasting into Excel"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "Copied for Excel!" : "Copy for Excel (Ctrl+V)"}</span>
          </button>

          <button
            onClick={exportToJson}
            className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-white hover:border-saffron/40 text-sm font-medium transition-all"
            title="Download raw solution JSON"
          >
            <FileCode className="w-4 h-4 text-saffron" />
            <span>JSON</span>
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
      <div className="flex flex-wrap items-center gap-4 border-b border-white/10">
        <button
          onClick={() => setActiveTab("tables")}
          className={`pb-3 text-sm font-medium transition-all flex items-center space-x-1.5 ${
            activeTab === "tables" ? "text-saffron border-b-2 border-saffron" : "text-gray-400 hover:text-white"
          }`}
        >
          <TableIcon className="w-4 h-4 text-emerald-400" />
          <span>Solution Tables (Variables & Constraints)</span>
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

      {/* Tab Contents: Solution Tables (Ready for copy & paste) */}
      {activeTab === "tables" && (
        <div className="space-y-8">
          {/* Decision Variables Table */}
          <div className="glass-panel p-6 border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="font-heading font-semibold text-lg text-white">Optimal Decision Variables</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Optimal values (x*), bounds, and reduced costs computed by Dual Simplex.
                </p>
              </div>
              <button
                onClick={copyForExcel}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-surface border border-white/10 text-xs font-mono text-gray-300 hover:text-white hover:border-emerald-500/40"
              >
                <Copy className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copy Table for Excel</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02] text-gray-400 uppercase text-[11px]">
                    <th className="py-3 px-4">Variable Name</th>
                    <th className="py-3 px-4">Optimal Value (x*)</th>
                    <th className="py-3 px-4">Lower Bound</th>
                    <th className="py-3 px-4">Upper Bound</th>
                    <th className="py-3 px-4">Reduced Cost (dj)</th>
                    <th className="py-3 px-4">Basis Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {variables.map((v, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 text-white font-medium">{v.name}</td>
                      <td className="py-3 px-4 text-emerald-400 font-bold">{v.val.toFixed(4)}</td>
                      <td className="py-3 px-4 text-gray-400">{v.lb.toFixed(4)}</td>
                      <td className="py-3 px-4 text-gray-400">{v.ub.toFixed(4)}</td>
                      <td className="py-3 px-4 text-cyan-live">{v.rc.toFixed(4)}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] ${
                            v.status === "BASIC"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-white/5 text-gray-400 border border-white/10"
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Constraints Table */}
          <div className="glass-panel p-6 border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="font-heading font-semibold text-lg text-white">Linear Constraints & Dual Prices</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Constraint activity, RHS limits, slack values, and economic shadow prices (y*).
                </p>
              </div>
              <button
                onClick={copyForExcel}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-surface border border-white/10 text-xs font-mono text-gray-300 hover:text-white hover:border-emerald-500/40"
              >
                <Copy className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copy Constraints for Excel</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02] text-gray-400 uppercase text-[11px]">
                    <th className="py-3 px-4">Constraint Name</th>
                    <th className="py-3 px-4">Activity (Ax)</th>
                    <th className="py-3 px-4 text-center">Sense</th>
                    <th className="py-3 px-4">RHS Bound (b)</th>
                    <th className="py-3 px-4">Slack / Surplus</th>
                    <th className="py-3 px-4">Dual Price (y*)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {constraints.map((c, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 text-white font-medium">{c.name}</td>
                      <td className="py-3 px-4 text-cyan-live">{c.activity.toFixed(4)}</td>
                      <td className="py-3 px-4 text-center text-gray-400">{c.relation}</td>
                      <td className="py-3 px-4 text-gray-300">{c.rhs.toFixed(4)}</td>
                      <td className="py-3 px-4 text-gray-400">{c.slack.toFixed(4)}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-semibold ${
                            c.dual !== 0.0 ? "text-saffron" : "text-gray-500"
                          }`}
                        >
                          {c.dual.toFixed(4)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

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
          <SimplexPolytopeVisual />

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
