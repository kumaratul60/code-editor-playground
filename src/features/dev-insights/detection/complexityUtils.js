export function getComplexityClass(complexity) {
    if (complexity <= 20) return 'simple';
    if (complexity <= 40) return 'moderate';
    if (complexity <= 60) return 'complex';
    return 'critical';
}

export function getComplexityPercentage(complexity) {
    return Math.min(100, Math.max(0, complexity));
}

export function getPerformanceClass(score) {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'warning';
    return 'critical';
}
