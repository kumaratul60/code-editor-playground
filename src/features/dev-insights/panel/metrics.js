import { getScoreLabel } from "./scoreLabels.js";

const BYTES_IN_MB = 1024 * 1024;

export function calculateStandardizedMetrics(analysis = {}, executionTime = 0, runtimeMetrics = {}, code = "") {
    const { functions = 0, loops = 0, asyncOps = 0 } = analysis;
    const complexityScore = Math.min(100, (functions * 6) + (loops * 10) + (asyncOps * 8));

    const networkPenalty = Math.min(25, (runtimeMetrics.network?.total || 0) * 3);
    const logPenalty = Math.min(15, totalLogEntries(runtimeMetrics.logs) * 2);
    const performanceScore = Math.max(0, 100 - Math.min(95, (executionTime / 4) + networkPenalty + logPenalty));

    const codeLength = code.length;
    const avgFunctionLength = functions > 0 ? codeLength / functions : codeLength;
    const maintainabilityPenalty = Math.min(50,
        (avgFunctionLength / 18) +
        ((runtimeMetrics.domMutations || 0) * 0.5) +
        (loops * 2)
    );
    const maintainabilityScore = Math.max(0, 100 - maintainabilityPenalty);

    const memoryUsageBytes = Math.max(0, runtimeMetrics.memory?.delta || runtimeMetrics.memory?.end || 0);
    const memoryUsageMb = memoryUsageBytes / BYTES_IN_MB;
    const memoryScore = memoryUsageMb > 0
        ? Math.max(0, 100 - Math.min(95, memoryUsageMb * 5))
        : 95;

    const runtimeStabilityPenalty = Math.min(40,
        (runtimeMetrics.errors || 0) * 12 +
        Math.max(0, (runtimeMetrics.asyncOps?.timeout || 0) - 5)
    );
    const runtimeStabilityScore = Math.max(0, 100 - runtimeStabilityPenalty);

    const qualityScore = Math.round(
        (performanceScore * 0.28) +
        (maintainabilityScore * 0.24) +
        (memoryScore * 0.22) +
        (runtimeStabilityScore * 0.26)
    );

    return {
        complexity: withLabel(complexityScore),
        performance: withLabel(performanceScore),
        maintainability: withLabel(maintainabilityScore),
        memory: withLabel(memoryScore),
        stability: withLabel(runtimeStabilityScore),
        quality: withLabel(qualityScore)
    };
}

function withLabel(score) {
    return { score, label: getScoreLabel(score) };
}

function totalLogEntries(logs = {}) {
    return Object.values(logs).reduce((sum, value) => sum + Number(value || 0), 0);
}
