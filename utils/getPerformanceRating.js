export function getPerformanceRating(executionTime) {
    if (executionTime < 50) {
        return {
            label: "Excellent",
            icon: "⚡",
            description: "Code execution is very fast. Great job optimizing your code!"
        };
    } else if (executionTime < 100) {
        return {
            label: "Good",
            icon: "✅",
            description: "Code execution is performing well within acceptable limits."
        };
    } else if (executionTime < 300) {
        return {
            label: "Fair",
            icon: "⚠️",
            description: "Code execution is acceptable but could be improved. Review any loops or expensive operations."
        };
    } else {
        return {
            label: "Needs Optimization",
            icon: "🐢",
            description: "Code execution is slow. Look for inefficient algorithms, unnecessary calculations, or blocking operations."
        };
    }
}



function getPerformanceRatingTest(executionTime) {
    if (executionTime < 50) {
        return { label: "Excellent", icon: "⚡" };
    } else if (executionTime < 100) {
        return { label: "Good", icon: "✅" };
    } else if (executionTime < 300) {
        return { label: "Fair", icon: "⚠️" };
    } else {
        return { label: "Needs Optimization", icon: "🐢" };
    }
}