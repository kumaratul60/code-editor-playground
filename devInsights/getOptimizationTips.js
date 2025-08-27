export function getOptimizationTips(analysis, executionTime) {
    const tips = [];

    if (analysis.loops > 3 && executionTime > 100) {
        tips.push("Consider optimizing loops or using array methods instead");
    }

    if (analysis.asyncOps > 3) {
        tips.push("Consider using Promise.all for parallel async operations");
    }

    if (analysis.functions > 5 && executionTime > 200) {
        tips.push("Consider function memoization for expensive calculations");
    }

    if (executionTime > 300) {
        tips.push("Code execution is slow - profile for bottlenecks");
    }

    return tips.length > 0 ? "Optimization Tips:\n- " + tips.join("\n- ") : "";
}