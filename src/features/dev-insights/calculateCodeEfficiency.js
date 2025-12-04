export function calculateCodeEfficiency(analysis) {
    // Calculate efficiency based on ratio of functions to loops and async operations
    const totalOperations = analysis.functions + analysis.loops + analysis.asyncOps;
    if (totalOperations === 0) return { score: 100, percentage: 100, label: "N/A" };

    // Penalize for excessive loops relative to functions
    let efficiency = 100;
    if (analysis.functions > 0) {
        const loopRatio = analysis.loops / analysis.functions;
        if (loopRatio > 2) efficiency -= 20;
        else if (loopRatio > 1) efficiency -= 10;
    }

    // Penalize for excessive async operations without proper structuring
    if (analysis.asyncOps > 3 && analysis.functions < 2) {
        efficiency -= 15;
    }

    // Adjust based on total code elements (complexity)
    if (totalOperations > 15) efficiency -= 10;

    // Ensure efficiency is within bounds
    efficiency = Math.max(0, Math.min(100, efficiency));

    // Determine label
    let label;
    if (efficiency >= 90) label = "Excellent";
    else if (efficiency >= 75) label = "Good";
    else if (efficiency >= 60) label = "Fair";
    else label = "Needs Improvement";

    return { score: efficiency, percentage: efficiency, label: label };
}