const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * ============================================================
 * Fuzzy Tsukamoto Inference Engine
 * ============================================================
 * 
 * Implements the Tsukamoto method for fuzzy inference:
 * 1. Fuzzification: Convert crisp inputs to fuzzy membership values
 * 2. Rule Evaluation: Evaluate rules using min operator (AND)
 * 3. Defuzzification: Tsukamoto weighted average using monotonic
 *    membership functions for output
 * 
 * Key difference from Mamdani:
 * - Tsukamoto uses monotonic membership functions for output
 * - Each rule produces a crisp output (z) via inverse membership
 * - Final output = weighted average of all rule outputs
 * ============================================================
 */
class FuzzyTsukamotoService {
  constructor() {
    this.variables = null;
    this.rules = null;
  }

  /**
   * Load fuzzy variables and rules from database
   */
  async loadConfiguration() {
    this.variables = await prisma.fuzzyVariable.findMany();
    this.rules = await prisma.fuzzyRule.findMany({
      where: { isActive: true },
    });

    // Index variables by name for quick lookup
    this.variableMap = {};
    for (const v of this.variables) {
      this.variableMap[v.name] = v;
    }
  }

  /**
   * ============================================================
   * MEMBERSHIP FUNCTIONS
   * ============================================================
   */

  /**
   * Calculate membership degree for a given value and membership function
   * Supports: trapezoid, triangle, sigmoid, singleton, linear_increase, linear_decrease
   */
  calculateMembership(value, mf) {
    switch (mf.type) {
      case 'trapezoid':
        return this._trapezoid(value, mf.params);
      case 'triangle':
        return this._triangle(value, mf.params);
      case 'sigmoid':
        return this._sigmoid(value, mf.params);
      case 'singleton':
        return this._singleton(value, mf.params);
      case 'linear_increase':
        return this._linearIncrease(value, mf.params);
      case 'linear_decrease':
        return this._linearDecrease(value, mf.params);
      default:
        return 0;
    }
  }

  /**
   * Trapezoidal membership function
   * params: [a, b, c, d] where a <= b <= c <= d
   * 
   *     1 ┃    ╱‾‾‾‾‾‾╲
   *       ┃   ╱        ╲
   *     0 ┃──╱          ╲──
   *       ┗━━━━━━━━━━━━━━━
   *        a  b      c  d
   */
  _trapezoid(x, [a, b, c, d]) {
    if (x < a || x > d) return 0;
    if (x >= b && x <= c) return 1;
    if (x >= a && x < b) return a === b ? 1 : (x - a) / (b - a);
    if (x > c && x <= d) return c === d ? 1 : (d - x) / (d - c);
    return 0;
  }

  /**
   * Triangular membership function
   * params: [a, b, c] where a <= b <= c
   * 
   *     1 ┃    ╱╲
   *       ┃   ╱  ╲
   *     0 ┃──╱    ╲──
   *       ┗━━━━━━━━━━
   *        a  b    c
   */
  _triangle(x, [a, b, c]) {
    if (x <= a || x >= c) return 0;
    if (x === b) return 1;
    if (x > a && x < b) return a === b ? 1 : (x - a) / (b - a);
    if (x > b && x < c) return b === c ? 1 : (c - x) / (c - b);
    return 0;
  }

  /**
   * Sigmoid membership function
   * params: [center, slope]
   */
  _sigmoid(x, [center, slope]) {
    return 1 / (1 + Math.exp(-slope * (x - center)));
  }

  /**
   * Singleton membership function
   * params: [value]
   * Returns 1 if x equals the singleton value, 0 otherwise
   */
  _singleton(x, [value]) {
    return x === value ? 1 : 0;
  }

  /**
   * Linear increase (monotonic ascending) — for Tsukamoto output
   * params: [a, b] where a < b
   * 
   *     1 ┃        ╱‾‾
   *       ┃       ╱
   *     0 ┃──────╱
   *       ┗━━━━━━━━━━━
   *            a    b
   */
  _linearIncrease(x, [a, b]) {
    if (x <= a) return 0;
    if (x >= b) return 1;
    return (x - a) / (b - a);
  }

  /**
   * Linear decrease (monotonic descending) — for Tsukamoto output
   * params: [a, b] where a < b
   * 
   *     1 ┃‾‾╲
   *       ┃   ╲
   *     0 ┃    ╲──────
   *       ┗━━━━━━━━━━━
   *        a    b
   */
  _linearDecrease(x, [a, b]) {
    if (x <= a) return 1;
    if (x >= b) return 0;
    return (b - x) / (b - a);
  }

  /**
   * Inverse membership function for Tsukamoto defuzzification
   * Given a membership degree α, find the crisp value z
   */
  inverseMembership(alpha, mf) {
    switch (mf.type) {
      case 'linear_increase': {
        const [a, b] = mf.params;
        return a + alpha * (b - a);
      }
      case 'linear_decrease': {
        const [a, b] = mf.params;
        return b - alpha * (b - a);
      }
      case 'triangle': {
        const [a, b, c] = mf.params;
        // For Tsukamoto, use the midpoint (b) as reference.
        // Interpolate from a to b on the ascending side.
        // This gives z = a + alpha * (b - a), which maps alpha=1 → b (peak)
        // and alpha=0 → a (base). This is correct for monotonic interpretation.
        return a + alpha * (b - a);
      }
      case 'trapezoid': {
        const [a, b, c, d] = mf.params;
        // Use ascending side: maps alpha=0 → a, alpha=1 → b
        if (a === b) return a;
        return a + alpha * (b - a);
      }
      default:
        return 0;
    }
  }

  /**
   * ============================================================
   * STEP 1: FUZZIFICATION
   * ============================================================
   * Convert crisp input values to fuzzy membership degrees
   */
  fuzzify(inputs) {
    const fuzzyInputs = {};

    for (const [varName, crispValue] of Object.entries(inputs)) {
      const variable = this.variableMap[varName];
      if (!variable || variable.type !== 'INPUT') continue;

      fuzzyInputs[varName] = {};
      const mfs = variable.membershipFunctions;

      for (const mf of mfs) {
        fuzzyInputs[varName][mf.name] = this.calculateMembership(crispValue, mf);
      }
    }

    return fuzzyInputs;
  }

  /**
   * ============================================================
   * STEP 2: RULE EVALUATION
   * ============================================================
   * Evaluate each fuzzy rule using the min operator (AND)
   * For Tsukamoto, also compute the crisp output z for each rule
   */
  evaluateRules(fuzzyInputs) {
    const outputVariable = this.variableMap['riskLevel'];
    if (!outputVariable) {
      throw new Error('Output variable "riskLevel" not found');
    }

    const ruleResults = [];

    for (const rule of this.rules) {
      const conditions = rule.conditions;
      let firingStrength = Infinity;

      // Calculate firing strength using MIN operator (AND)
      let ruleValid = true;
      for (const condition of conditions) {
        const varMemberships = fuzzyInputs[condition.variable];
        if (!varMemberships) {
          ruleValid = false;
          break;
        }

        const membershipDegree = varMemberships[condition.value] || 0;
        firingStrength = Math.min(firingStrength, membershipDegree);
      }

      if (!ruleValid || firingStrength === Infinity) {
        firingStrength = 0;
      }

      // Apply rule weight
      firingStrength *= rule.weight;

      // Skip rules with zero firing strength
      if (firingStrength <= 0) continue;

      // Find the output membership function for this rule's consequent
      const outputMf = outputVariable.membershipFunctions.find(
        (mf) => mf.name === rule.consequent
      );

      if (!outputMf) continue;

      // Tsukamoto: Calculate crisp output z using inverse membership
      const z = this.inverseMembership(firingStrength, outputMf);

      ruleResults.push({
        ruleId: rule.id,
        ruleName: rule.name,
        consequent: rule.consequent,
        firingStrength: Math.round(firingStrength * 10000) / 10000,
        crispOutput: Math.round(z * 100) / 100,
        weight: rule.weight,
      });
    }

    return ruleResults;
  }

  /**
   * ============================================================
   * STEP 3: DEFUZZIFICATION (Tsukamoto Weighted Average)
   * ============================================================
   * 
   * z* = Σ(αi × zi) / Σ(αi)
   * 
   * where:
   *   αi = firing strength of rule i
   *   zi = crisp output of rule i (from inverse membership)
   *   z* = final crisp output (risk score)
   */
  defuzzify(ruleResults, fuzzyInputs = null) {
    if (ruleResults.length === 0) {
      // Fallback heuristic for sparse rule base when no rules fire
      let riskScore = 0;
      if (fuzzyInputs) {
        riskScore = this.calculateFallbackScore(fuzzyInputs);
      }
      return {
        method: 'fallback_heuristic',
        riskScore: riskScore,
        numerator: 0,
        denominator: 0,
        activeRules: 0,
      };
    }

    let numerator = 0;
    let denominator = 0;

    for (const result of ruleResults) {
      numerator += result.firingStrength * result.crispOutput;
      denominator += result.firingStrength;
    }

    // Prevent division by zero
    const riskScore = denominator === 0 ? 0 : numerator / denominator;

    return {
      method: 'tsukamoto_weighted_average',
      riskScore: Math.round(riskScore * 100) / 100,
      numerator: Math.round(numerator * 100) / 100,
      denominator: Math.round(denominator * 10000) / 10000,
      activeRules: ruleResults.length,
      formula: `z* = ${Math.round(numerator * 100) / 100} / ${Math.round(denominator * 10000) / 10000} = ${Math.round(riskScore * 100) / 100}`,
    };
  }

  /**
   * Fallback heuristic score calculator
   * Used when no fuzzy rules match the input combination
   */
  calculateFallbackScore(fuzzyInputs) {
    let totalScore = 0;
    let weightSum = 0;

    // Map common fuzzy linguistic labels to a 0-100 severity scale
    const severityMap = {
      muda: 10, dewasa: 40, tua: 80,
      ringan: 10, sedang: 50, berat: 90,
      singkat: 10, lama: 90,
      kurus: 30, normal: 10, gemuk: 60, obesitas: 90,
      tidak_ada: 10, ada: 80,
      rendah: 10, tinggi: 90
    };

    for (const [varName, memberships] of Object.entries(fuzzyInputs)) {
      for (const [label, degree] of Object.entries(memberships)) {
        if (degree > 0) {
           const severity = severityMap[label] || 50; 
           totalScore += severity * degree;
           weightSum += degree;
        }
      }
    }

    if (weightSum === 0) return 0;
    return Math.round(totalScore / weightSum);
  }

  /**
   * ============================================================
   * CLASSIFY RISK
   * ============================================================
   */
  classifyRisk(riskScore) {
    if (riskScore <= 30) return 'RENDAH';
    if (riskScore <= 60) return 'SEDANG';
    if (riskScore <= 80) return 'TINGGI';
    return 'SANGAT_TINGGI';
  }

  /**
   * Get risk label in Indonesian
   */
  getRiskLabel(category) {
    const labels = {
      RENDAH: 'Risiko Rendah',
      SEDANG: 'Risiko Sedang',
      TINGGI: 'Risiko Tinggi',
      SANGAT_TINGGI: 'Risiko Sangat Tinggi',
    };
    return labels[category] || category;
  }

  /**
   * Get risk color for UI
   */
  getRiskColor(category) {
    const colors = {
      RENDAH: '#22c55e',
      SEDANG: '#eab308',
      TINGGI: '#f97316',
      SANGAT_TINGGI: '#ef4444',
    };
    return colors[category] || '#6b7280';
  }

  /**
   * ============================================================
   * MAIN INFERENCE PIPELINE
   * ============================================================
   * Runs the full Fuzzy Tsukamoto inference
   */
  async infer(inputs) {
    // Ensure configuration is loaded
    await this.loadConfiguration();

    // Step 1: Fuzzification
    const fuzzyInputs = this.fuzzify(inputs);

    // Step 2: Rule Evaluation
    const ruleResults = this.evaluateRules(fuzzyInputs);

    // Step 3: Defuzzification
    const defuzzResult = this.defuzzify(ruleResults, fuzzyInputs);

    // Classify risk
    const riskCategory = this.classifyRisk(defuzzResult.riskScore);

    return {
      riskScore: defuzzResult.riskScore,
      riskCategory,
      riskLabel: this.getRiskLabel(riskCategory),
      riskColor: this.getRiskColor(riskCategory),
      fuzzyInputs,
      ruleResults,
      defuzzificationResult: defuzzResult,
    };
  }
}

module.exports = new FuzzyTsukamotoService();
