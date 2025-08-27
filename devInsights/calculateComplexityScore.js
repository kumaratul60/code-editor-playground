export function calculateComplexityScore(analysis) {
    // Simple heuristic: functions + (loops * 1.5) + (asyncOps * 1.2)
    const rawScore = analysis.functions + (analysis.loops * 1.5) + (analysis.asyncOps * 1.2);

    // Normalize to a 1-10 scale
    const normalizedScore = Math.min(Math.round(rawScore / 5), 10);

    // Determine complexity label and icon
    let label, icon;
    if (normalizedScore <= 3) {
        label = "Simple";
        icon = "🟢";
    } else if (normalizedScore <= 6) {
        label = "Moderate";
        icon = "🟡";
    } else if (normalizedScore <= 8) {
        label = "Complex";
        icon = "🟠";
    } else {
        label = "Very Complex";
        icon = "🔴";
    }

    return { score: normalizedScore, label, icon };
}

