export function calculateMaintainabilityScore(analysis) {
    // Base score out of 10
    let score = 10;

    // Deduct for high function count (potential for spaghetti code)
    if (analysis.functions > 10) score -= 2;
    else if (analysis.functions > 5) score -= 1;

    // Deduct for high loop count (complexity)
    if (analysis.loops > 5) score -= 2;
    else if (analysis.loops > 3) score -= 1;

    // Deduct for high async operation count (potential for callback hell)
    if (analysis.asyncOps > 5) score -= 2;
    else if (analysis.asyncOps > 3) score -= 1;

    // Ensure score is within bounds
    score = Math.max(1, Math.min(10, score));

    // Determine label
    let label;
    if (score >= 8) label = "High";
    else if (score >= 6) label = "Moderate";
    else if (score >= 4) label = "Fair";
    else label = "Low";

    return { score, label };
}