import { analyzeExecutionHotspots } from "./analyzeExecutionHotspots.js";
import { analyzeFunctionRelationships } from "./analyzeFunctionRelationships.js";
import { estimateBigOComplexity } from "./estimateBigOComplexity.js";
import { calculateCodeEfficiency } from "./calculateCodeEfficiency.js";
import detectionLogicHelper from "./detectionLogicHelper.js";
import { calculateStandardizedMetrics } from "./panel/metrics.js";
import { createPanelHTML } from "./panel/sections.js";
import { ensureExecutionTracker } from "@shared/runtime/executionTracker.js";

const {
    setupEventListeners,
} = detectionLogicHelper;

export function addDeveloperInsightsPanel(analysis, executionTime, code = "") {
    const existingPanel = document.getElementById('dev-insights-sidebar');
    if (existingPanel) {
        existingPanel.remove();
    }

    const tracker = ensureExecutionTracker();
    const metrics = tracker ? tracker.getMetrics() : getFallbackRuntimeMetrics();
    const runtimeTimeline = tracker ? tracker.getTimeline(60) : [];

    const hotspots = analyzeExecutionHotspots(analysis, executionTime);
    const relationships = analyzeFunctionRelationships(code);
    const bigOComplexity = estimateBigOComplexity(code);
    const efficiency = calculateCodeEfficiency(analysis);
    const standardizedMetrics = calculateStandardizedMetrics(analysis, executionTime, metrics, code);

    const sidebar = document.createElement('div');
    sidebar.id = 'dev-insights-sidebar';
    sidebar.innerHTML = createPanelHTML(
        analysis,
        executionTime,
        standardizedMetrics,
        hotspots,
        relationships,
        bigOComplexity,
        efficiency,
        metrics,
        runtimeTimeline,
        code
    );

    document.body.appendChild(sidebar);
    setupEventListeners(sidebar);
}

function getFallbackRuntimeMetrics() {
    return {
        sessionRuns: 0,
        codeSize: 0,
        startedAt: 0,
        duration: 0,
        failed: false,
        logs: {},
        domMutations: 0,
        lastDomMutation: null,
        network: { total: 0, fetch: 0, xhr: 0 },
        asyncOps: { timeout: 0, interval: 0, raf: 0, promise: 0 },
        uiActions: { session: {}, currentRun: {} },
        errors: 0,
        memory: { start: 0, end: 0, delta: 0 },
        timeline: [],
        gcCollections: 0,
        allocations: 0,
        retainedMemory: 0,
        peakMemory: 0
    };
}
