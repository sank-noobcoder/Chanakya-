# Chanakya Mathematical Solver Algorithms

## 1. Linear Programming (LP)

### Standard Primal Formulation
$$\min_{x} c^T x \quad \text{s.t.} \quad A x = b, \quad l \le x \le u$$

### Revised Simplex with Harris Two-Pass Ratio Test
Let basis matrix $B$ be factorized as $P B Q = L U$.
1. **Pricing (Dual Step):** Solve $B^T y = c_B$. Compute reduced costs $d_N = c_N - N^T y$.
2. **Entering Variable:** Select $j \in N$ violating dual feasibility: $d_j < 0$ (for lower bound) or $d_j > 0$ (for upper bound).
3. **FTRAN (Primal Step):** Solve $B \alpha = A_{\cdot j}$ using $L U$ factors and Forrest-Tomlin update.
4. **Harris Ratio Test:**
   - Pass 1: Compute maximum step $\theta_{\max} = \min_{i} \left\{ \frac{x_{B_i} - l_{B_i} + \epsilon_{\text{feas}}}{\alpha_i} \right\}$ for $\alpha_i > \epsilon_{\text{piv}}$.
   - Pass 2: Select leaving variable $p$ that maximizes $|\alpha_p|$ among candidates with $\theta_i \le \theta_{\max}$.
5. **Update:** Apply Forrest-Tomlin rank-one update to maintain basis factors.

---

## 2. Interior Point Method (Mehrotra Predictor-Corrector)

Solves the primal-dual KKT conditions:
$$\begin{aligned}
A x &= b, \quad x > 0 \\
A^T y + s &= c, \quad s > 0 \\
X S e &= \mu e
\end{aligned}$$

1. **Affine Direction (Predictor):** Solve normal equations:
   $$(A X S^{-1} A^T) \Delta y_{\text{aff}} = A X S^{-1} (c - A^T y - s) + b - A x$$
2. **Centering Parameter:** Calculate $\mu = \frac{x^T s}{n}$, $\alpha_{\text{aff}}$, and $\sigma = \left( \frac{\mu_{\text{aff}}}{\mu} \right)^3$.
3. **Corrector Direction:** Solve augmented system with Mehrotra non-linear term $\Delta X_{\text{aff}} \Delta S_{\text{aff}} e - \sigma \mu e$.
4. **Step and Update:** Compute step lengths $\alpha_P, \alpha_D$ with step fraction to boundary $\tau = 0.995$.

---

## 3. Mixed-Integer Linear Programming (MILP)

### Branch-and-Cut Engine
- **LP Relaxation:** Solved via Dual Revised Simplex at each tree node.
- **Presolve:** Eliminates redundant rows, contracts singleton rows, and tightens variable bounds.
- **Cut Generation:**
  - Chvátal-Gomory mixed-integer cuts derived from optimal simplex tableau.
  - Knapsack cover cuts for binary knapsack substructures.
- **Node Selection:** Hybrid best-bound search prioritizing lower dual bounds.
- **Primal Heuristic:** Feasibility Pump driving fractional solutions toward integer feasibility.
