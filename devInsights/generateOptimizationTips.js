export function generateOptimizationTips(analysis, executionTime) {
    const tips = [];

    // Loop optimization tips
    if (analysis.loops > 3) {
        if (executionTime > 100) {
            tips.push("Consider optimizing loops with array methods like map/filter/reduce");
        }
        if (analysis.loops > 5) {
            tips.push("Multiple nested loops detected - review for O(n²) or worse time complexity");
        }
    }

    // Async optimization tips
    if (analysis.asyncOps > 3) {
        tips.push("Use Promise.all for parallel async operations to reduce wait time");
        if (analysis.asyncOps > 5) {
            tips.push("Consider using async/await pattern for better readability and error handling");
        }
    }

    // Function optimization tips
    if (analysis.functions > 5) {
        if (executionTime > 200) {
            tips.push("Consider memoization for expensive calculations that are called repeatedly");
        }
        if (analysis.functions > 8) {
            tips.push("High function count - review for potential consolidation of similar functions");
        }
    }

    // Performance tips based on execution time
    if (executionTime > 300) {
        tips.push("Execution time is high - profile code to identify bottlenecks");
    }
    if (executionTime > 500) {
        tips.push("Consider using Web Workers for CPU-intensive operations to avoid blocking the UI");
    }

    // Add general best practices if few specific tips
    if (tips.length < 2) {
        if (analysis.functions > 0) {
            tips.push("Ensure functions follow single responsibility principle for better maintainability");
        }
        if (analysis.asyncOps > 0) {
            tips.push("Add proper error handling for all asynchronous operations");
        }
    }

    return tips;
}