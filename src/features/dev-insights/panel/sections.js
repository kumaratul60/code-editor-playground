import { getPerformanceClass, getComplexityClass, getComplexityPercentage, getStepStatusColor, generateUnifiedExecutionSteps } from "@features/dev-insights/ditectionLogicHelper.js";
import { analyzeCodePatterns } from "@features/dev-insights/detection/codeAnalyzer.js";
import { createCodeStructureVisualization } from "@features/dev-insights/createCodeStructureVisualization.js";
import { createExecutionTimeVisualization } from "@features/dev-insights/createExecutionTimeVisualization.js";
import { getCodeFromEditor } from "@features/dev-insights/panel/panelControls.js";

export function createPanelHTML(analysis, executionTime, metrics, hotspots, relationships, bigOComplexity, efficiency, realTimeMetrics) {
    return `
        <button id="dev-insights-toggle-btn" title="Toggle Developer Insights">
            💡
        </button>
        
        <div id="dev-insights-panel">
            <div class="dev-panel-header">
                <div class="dev-panel-title">
                    🚀 Developer Insights
                </div>
                <button class="dev-panel-close" onclick="closeDevInsights()">×</button>
            </div>
          <div class="dev-panel-content">
              
                ${createComplexitySection(bigOComplexity, analysis)}
                ${createCodeStructureVisualization(analysis, relationships)}
                ${createExecutionTimeVisualization(hotspots)}
                ${createMemorySection(realTimeMetrics,executionTime)}
                
            </div>
        </div>
    `;
}

export function createComplexitySection(bigOComplexity, analysis) {
    const tooltips = {
        time: "Time complexity (Big O notation) based on the most complex operation in your code. Lower is better.",
        space: "Space complexity (Big O notation) based on the memory usage of your code. Lower is better.",
        maxDepth: "Maximum nesting depth of loops and conditionals. Higher values may indicate complex logic that's hard to maintain.",
        recursion: "Indicates if the code contains recursive functions, which can be powerful but may cause stack overflow if not implemented carefully."
    };

    const createTooltip = (text, tooltipText) => `
        <div class="tooltip-container">
            <span class="info-icon">ℹ️</span>
            <div class="tooltip">${tooltipText}</div>
        </div>
    `;

    return `
        <div class="metric-card fade-in">
            <div class="metric-header complexity-header">
                <div class="metric-title">Time & Space Complexity</div>
                <div class="complexity-main-pills">
                    <div class="complexity-pill" aria-label="Time complexity">
                        <span>Time</span>
                        <strong>${bigOComplexity.time}</strong>
                        ${createTooltip('Time', tooltips.time)}
                    </div>
                    <div class="complexity-pill" aria-label="Space complexity">
                        <span>Space</span>
                        <strong>${bigOComplexity.space}</strong>
                        ${createTooltip('Space', tooltips.space)}
                    </div>
                </div>
            </div>
        </div>
    `;
}

export function createCodeAnalysisGrid() {
    const codeText = getCodeFromEditor();
    if (!codeText) {
        return '<div class="no-code-message">No code to analyze</div>';
    }

    const analysis = analyzeCodePatterns(codeText);
    if (analysis.error) {
        return `<div class="error-message">${analysis.error}</div>`;
    }

    const metrics = {
        consoleCount: (codeText.match(/console\.(log|error|warn|info|debug|table|group|time)/g) || []).length,
        functions: analysis.functions?.total || 0,
        closures: analysis.functions?.closures || 0,
        higherOrderFunctions: analysis.functions?.higherOrder || 0,
        memoryLeaks: analysis.memoryLeaks?.total || 0,
        errorHandling: analysis.codeSmells?.errorHandling || 0,
        throwStatements: (codeText.match(/throw\s+/g) || []).length,
        globalVars: (codeText.match(/^(\s*|;)\s*(var|let|const)\s+[a-zA-Z_$][\w$]*\s*[=;]/gm) || []).length,
        loopTypes: analysis.loops?.total || 0,
        asyncPatterns: analysis.asyncPatterns?.total || 0,
        codeSmells: analysis.codeSmells?.total || 0,
        domOperations: analysis.domPatterns?.total || 0
    };

    const getColor = (value, thresholds = { good: 0, warn: 1, error: 5 }) => {
        if (value <= thresholds.good) return 'var(--dev-panel-success)';
        if (value <= thresholds.warn) return 'var(--dev-panel-warning)';
        if (value <= thresholds.error) return 'var(--dev-panel-error)';
        return 'var(--dev-panel-error)';
    };

    const gridItems = [
        { label: 'Console Logs', value: metrics.consoleCount, color: getColor(metrics.consoleCount, { good: 2, warn: 5 }) },
        { label: 'Closures', value: metrics.closures, color: getColor(metrics.closures, { good: 2, warn: 5 }) },
        { label: 'Functions', value: metrics.functions, color: getColor(metrics.functions, { good: 4, warn: 8 }) },
        { label: 'Throw Blocks', value: metrics.throwStatements, color: metrics.throwStatements > 0 ? 'var(--dev-panel-success)' : 'var(--dev-panel-secondary)' },
        { label: 'Global Vars', value: metrics.globalVars, color: getColor(metrics.globalVars, { good: 1, warn: 3 }) },
        { label: 'HOFs', value: metrics.higherOrderFunctions, color: metrics.higherOrderFunctions > 0 ? 'var(--dev-panel-success)' : 'var(--dev-panel-secondary)' },
        { label: 'Loops', value: metrics.loopTypes, color: metrics.loopTypes > 0 ? 'var(--dev-panel-success)' : 'var(--dev-panel-secondary)' },
        { label: 'Async Ops', value: metrics.asyncPatterns, color: metrics.asyncPatterns > 0 ? 'var(--dev-panel-success)' : 'var(--dev-panel-secondary)' },
        { label: 'DOM Ops', value: metrics.domOperations, color: getColor(metrics.domOperations, { good: 5, warn: 10 }) },
        { label: 'Code Smells', value: metrics.codeSmells, color: getColor(metrics.codeSmells, { good: 0, warn: 1 }) }
    ];

    const gridItemsHTML = gridItems.map(item => `
        <div class="complexity-item" title="${item.label}">
            <div class="complexity-number" style="color: ${item.color}">
                ${item.value}
            </div>
            <div class="complexity-label">${item.label}</div>
        </div>
    `).join('');

    return `
        <div class="complexity-grid" style="
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            gap: 12px;
            margin: 12px 0;
            padding: 12px;
            background: var(--dev-panel-bg-secondary);
            border-radius: 8px;
        ">
            ${gridItemsHTML}
        </div>
    `;
}

export function createMemorySection(realTimeMetrics, executionTime) {
    const codeText = getCodeFromEditor();
    const realExecutionTime = window.lastExecutionTime || executionTime || 0;
    const unifiedSteps = generateUnifiedExecutionSteps(codeText, realTimeMetrics, realExecutionTime);

    return `
        <div class="metric-card fade-in">
            <div class="metric-header">
                <div class="metric-title">Deep Analysis</div>
            </div>
            <div style="margin: 16px 0;">
                <div style="font-weight: bold; color: var(--dev-panel-accent); margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
                    <span style="display: flex; align-items: center; gap: 8px;">⚡ Execution Flow</span>
                    <span style="font-size: 12px; color: var(--dev-panel-secondary);">Total: ${realExecutionTime.toFixed(2)}ms</span>
                </div>
                <div class="execution-flow">
                    ${unifiedSteps.map((step) => `
                        <div class="flow-step" style="border-left-color: ${getStepStatusColor(step.status)}; padding: 12px 0 12px 16px; margin-bottom: 8px;">
                            <div style="display: flex; align-items: flex-start; justify-content: space-between; width: 100%; gap: 12px;">
                                <div style="flex: 1; min-width: 0;">
                                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                                        <span style="font-size: 12px; font-weight: 400;">${step.name}</span>
                                    </div>
                                    ${step.details ? `<div style="font-size: 11px; margin-top: 6px; opacity: 0.85; line-height: 1.4; color: var(--dev-panel-text);">${step.details}</div>` : ''}
                                    ${step.metrics ? `<div style="font-size: 10px; margin-top: 4px; opacity: 0.7; color: var(--dev-panel-secondary);">${step.metrics}</div>` : ''}
                                </div>
                                <span class="flow-step-time" style="color: ${getStepStatusColor(step.status)}; font-size: 12px; white-space: nowrap; font-weight: 500;">
                                    ${step.time}
                                </span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ${createCodeAnalysisGrid()}
        </div>
    `;
}
