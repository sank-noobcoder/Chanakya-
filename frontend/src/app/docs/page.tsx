import { Cpu, Zap, Activity, ShieldCheck } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <div>
        <h1 className="font-heading font-bold text-3xl sm:text-4xl text-white">
          Algorithms & Mathematical Specifications
        </h1>
        <p className="text-gray-400 mt-2 text-base">
          Transparent, auditable algorithmic mechanics of Chanakya's sovereign optimization engine.
        </p>
      </div>

      {/* Module 1: Presolve & Scaling */}
      <section className="glass-panel p-8 border-white/10 space-y-4">
        <div className="flex items-center space-x-3 text-saffron font-heading font-bold text-xl">
          <Zap className="w-5 h-5" />
          <h2>1. Presolve Reductions & Matrix Equilibration</h2>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">
          Before factorization, models undergo linear presolve tightening: singleton row elimination propagates implied variable bounds, dominated columns are removed, and redundant constraints are eliminated. The constraint matrix $A$ is subsequently equilibrated using Curtis-Reid geometric scaling to balance the dynamic range of non-zero entries.
        </p>
        <div className="p-4 rounded-xl bg-[#07090F] border border-white/5 font-mono text-xs text-gray-400">
          {"Scaling objective: Minimize condition number κ(A) = ||A|| · ||A⁻¹|| via D₁ A D₂ diagonal matrices."}
        </div>
      </section>

      {/* Module 2: Dual Revised Simplex */}
      <section className="glass-panel p-8 border-white/10 space-y-4">
        <div className="flex items-center space-x-3 text-cyan-live font-heading font-bold text-xl">
          <Cpu className="w-5 h-5" />
          <h2>2. Dual Revised Simplex & Sparse LU</h2>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">
          The revised simplex engine maintains a basis matrix $B$ factorized as $P B Q = L U$ with Markowitz threshold pivoting. Each pivot performs a rank-one update via the Forrest-Tomlin method. Dual degeneracy is mitigated by Harris two-pass ratio tests with bound shifting and cost perturbation.
        </p>
      </section>

      {/* Module 3: Interior Point Method */}
      <section className="glass-panel p-8 border-white/10 space-y-4">
        <div className="flex items-center space-x-3 text-emerald-400 font-heading font-bold text-xl">
          <Activity className="w-5 h-5" />
          <h2>3. Mehrotra Predictor-Corrector IPM & Crossover</h2>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">
          For large-scale and convex quadratic problems, Chanakya executes a primal-dual path-following interior point method. At each iteration, normal equations $(A \Theta A^T) \Delta y = r$ are factorized using sparse Cholesky. After reaching convergence within the central path, an exact basis crossover converts the interior solution into a vertex basic feasible solution.
        </p>
      </section>

      {/* Module 4: Verify-Before-Report */}
      <section className="glass-panel p-8 border-white/10 space-y-4">
        <div className="flex items-center space-x-3 text-yellow-400 font-heading font-bold text-xl">
          <ShieldCheck className="w-5 h-5" />
          <h2>4. Independent Verify-Before-Report Guarantee</h2>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">
          No solution is ever reported as optimal without independent verification:
        </p>
        <ul className="list-disc list-inside text-sm text-gray-400 space-y-1 font-mono text-xs">
          <li>{"Primal feasibility: ||Ax - b||_∞ ≤ 10⁻⁶"}</li>
          <li>{"Variable bounds: l_j - 10⁻⁶ ≤ x_j ≤ u_j + 10⁻⁶"}</li>
          <li>{"Integrality tolerance: |x_j - round(x_j)| ≤ 10⁻⁶ ∀ j ∈ Integer"}</li>
          <li>Objective value recomputed from original problem definition</li>
        </ul>
      </section>
    </div>
  );
}
