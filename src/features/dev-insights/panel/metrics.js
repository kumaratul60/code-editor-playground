import { getScoreLabel } from "./scoreLabels.js";

export function calculateStandardizedMetrics(analysis, executionTime, metrics, code) {
    const complexityScore = Math.min(100, (analysis.functions * 10) + (analysis.loops * 15) + (analysis.asyncOps * 12));
    const performanceScore = Math.max(0, 100 - Math.min(100, executionTime / 5));

    const codeLength = code.length;
    const avgFunctionLength = analysis.functions > 0 ? codeLength / analysis.functions : 0;
    const maintainabilityScore = Math.max(0, 100 - Math.min(50, avgFunctionLength / 20) - Math.min(30, analysis.loops * 5) - Math.min(20, complexityScore / 5));

    const memoryScore = metrics.peakMemory > 0 ? Math.max(0, 100 - Math.min(100, metrics.peakMemory / 1000000)) : 95;

    const qualityScore = Math.round(
        (performanceScore * 0.3) +
        (maintainabilityScore * 0.25) +
        (memoryScore * 0.2) +
        ((100 - Math.min(100, complexityScore)) * 0.25)
    );

    return {
        complexity: { score: complexityScore, label: getScoreLabel(complexityScore) },
        performance: { score: performanceScore, label: getScoreLabel(performanceScore) },
        maintainability: { score: maintainabilityScore, label: getScoreLabel(maintainabilityScore) },
        memory: { score: memoryScore, label: getScoreLabel(memoryScore) },
        quality: { score: qualityScore, label: getScoreLabel(qualityScore) }
    };
}
