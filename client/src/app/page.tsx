import Link from "next/link";
import SimplexPolytopeVisual from "@/components/SimplexPolytopeVisual";
import { ArrowRight, ShieldCheck, Zap, Activity, CheckCircle2, Cpu, FileCode2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="w-full relative">
      {/* Background grid */}
      <div className="absolute inset-0 bg-grid opacity-50 pointer-events-none"></div>

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Mission Headline & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-saffron/10 border border-saffron/30 text-saffron text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-saffron animate-pulse"></span>
              <span>Sovereign Mathematical Optimization Engine</span>
            </div>

            <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-white leading-[1.12]">
              Optimization, built in India. <br />
              <span className="bg-gradient-to-r from-saffron via-saffron-light to-amber-200 bg-clip-text text-transparent">
                From first principles.
              </span>
            </h1>

            <p className="text-gray-400 text-lg sm:text-xl max-w-2xl leading-relaxed">
              Eliminate strategic foreign dependency in refining, petrochemicals, power grids, and logistics. A transparent, high-performance LP / MILP / QP solver engineered without CPLEX, Gurobi, or Xpress.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link href="/jobs/new" className="btn-saffron flex items-center space-x-2 group">
                <span>Launch Solver Console</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/docs"
                className="px-6 py-3 rounded-xl border border-white/10 bg-surface text-gray-300 font-medium hover:text-white hover:border-white/20 transition-all flex items-center space-x-2"
              >
                <FileCode2 className="w-4 h-4 text-cyan-live" />
                <span>Read Mathematical TRD</span>
              </Link>
            </div>

            {/* Live Benchmarks Counters */}
            <div className="pt-8 border-t border-white/10 grid grid-cols-3 gap-6">
              <div>
                <div className="text-2xl sm:text-3xl font-heading font-bold text-white font-mono">100%</div>
                <div className="text-xs text-gray-400 mt-0.5">Netlib Feasible Set</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-heading font-bold text-cyan-live font-mono">10⁻⁶</div>
                <div className="text-xs text-gray-400 mt-0.5">Verified Tolerance</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-heading font-bold text-saffron font-mono">0 Code</div>
                <div className="text-xs text-gray-400 mt-0.5">Foreign Dependencies</div>
              </div>
            </div>
          </div>

          {/* Right Column: Feasible-Region Polytope Simplex Visual */}
          <div className="lg:col-span-5 relative">
            <div className="relative glass-panel p-2 shadow-2xl border-white/10">
              <SimplexPolytopeVisual />
            </div>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES GRID */}
      <section className="py-20 border-t border-white/5 bg-[#0B101D]/50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-white">
              Engineered From First Principles
            </h2>
            <p className="text-gray-400 mt-3 text-base">
              Complete mathematical stack featuring in-house sparse linear algebra, dual revised simplex, and branch-and-cut algorithms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-panel p-8 glass-panel-hover">
              <div className="w-12 h-12 rounded-xl bg-saffron/10 border border-saffron/30 flex items-center justify-center text-saffron mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-xl text-white mb-2">Revised Dual Simplex</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Markowitz sparse LU threshold pivoting, Forrest-Tomlin basis update, Harris two-pass ratio test, and cost perturbation for degeneracy handling.
              </p>
            </div>

            <div className="glass-panel p-8 glass-panel-hover">
              <div className="w-12 h-12 rounded-xl bg-cyan-live/10 border border-cyan-live/30 flex items-center justify-center text-cyan-live mb-6">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-xl text-white mb-2">Mehrotra IPM & Crossover</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Primal-dual interior point method solving massive sparse LPs and convex QPs with Cholesky factorization and basis crossover to vertex solutions.
              </p>
            </div>

            <div className="glass-panel p-8 glass-panel-hover">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-xl text-white mb-2">Verify-Before-Report</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Guaranteed integrity: every solution is independently checked for primal feasibility, bounds, and integrality before declaring optimal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SOVEREIGN COMPARISON TABLE */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-white">
            Sovereign Architecture Comparison
          </h2>
          <p className="text-gray-400 mt-2 text-sm">
            Comparison of architectural sovereignty, licensing, and national security posture.
          </p>
        </div>

        <div className="glass-panel overflow-x-auto border-white/10">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-xs font-mono uppercase text-gray-400">
                <th className="py-4 px-6">Criteria</th>
                <th className="py-4 px-6 text-saffron font-bold">Chanakya (India)</th>
                <th className="py-4 px-6">Commercial Solvers (US/EU)</th>
                <th className="py-4 px-6">Open-Source (HiGHS / CBC)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-xs sm:text-sm">
              <tr>
                <td className="py-4 px-6 font-sans font-medium text-white">Technological Sovereignty</td>
                <td className="py-4 px-6 text-emerald-400 flex items-center space-x-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>100% Indigenous</span>
                </td>
                <td className="py-4 px-6 text-red-400">Foreign Proprietary</td>
                <td className="py-4 px-6 text-yellow-400">Foreign Open-Source</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-sans font-medium text-white">Recurring License Cost</td>
                <td className="py-4 px-6 text-emerald-400 font-bold">Zero ($0 / yr)</td>
                <td className="py-4 px-6 text-red-400">₹20L - ₹1.5 Cr / yr</td>
                <td className="py-4 px-6 text-emerald-400">Free</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-sans font-medium text-white">7-Layer OSI Protection</td>
                <td className="py-4 px-6 text-cyan-live font-bold">Built-In (Anti-DDoS & SQLi)</td>
                <td className="py-4 px-6 text-gray-400">Varies / Library only</td>
                <td className="py-4 px-6 text-gray-400">None (Library only)</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-sans font-medium text-white">Indian Sector Validation</td>
                <td className="py-4 px-6 text-saffron font-bold">IOCL, BPCL, Power Grid</td>
                <td className="py-4 px-6 text-gray-400">Generic Global</td>
                <td className="py-4 px-6 text-gray-400">Academic focus</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-sans font-medium text-white">Mathematical Transparency</td>
                <td className="py-4 px-6 text-emerald-400 font-bold">100% Open & Auditable</td>
                <td className="py-4 px-6 text-red-400">Black-Box Binaries</td>
                <td className="py-4 px-6 text-gray-300">Open</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
