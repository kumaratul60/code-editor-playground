import { analyzeExecutionHotspots } from "./analyzeExecutionHotspots.js";
import { analyzeFunctionRelationships } from "./analyzeFunctionRelationships.js";
import { estimateBigOComplexity } from "./estimateBigOComplexity.js";
import { calculateCodeEfficiency } from "./calculateCodeEfficiency.js";
import detectionLogicHelper from "./ditectionLogicHelper.js";
import { calculateStandardizedMetrics } from "./panel/metrics.js";
import { createPanelHTML } from "./panel/sections.js";

const {
    setupEventListeners,
} = detectionLogicHelper;

export function addDeveloperInsightsPanel(analysis, executionTime, code = "") {
    const existingPanel = document.getElementById('dev-insights-sidebar');
    if (existingPanel) {
        existingPanel.remove();
    }

    const metrics = window.executionTracker ? window.executionTracker.getMetrics() : {
        peakMemory: 0,
        gcCollections: 0,
        domManipulations: 0,
        networkRequests: 0,
        cacheHits: 0,
        errorCount: 0
    };

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
        metrics
    );

    document.body.appendChild(sidebar);
    setupEventListeners(sidebar);
}
