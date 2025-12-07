import { getStepStatusColor, generateUnifiedExecutionSteps } from "@features/dev-insights/detectionLogicHelper.js";
import { analyzeCodePatterns } from "@features/dev-insights/detection/codeAnalyzer.js";
import { createCodeStructureVisualization } from "@features/dev-insights/createCodeStructureVisualization.js";
import { createExecutionTimeVisualization } from "@features/dev-insights/createExecutionTimeVisualization.js";
import { getCodeFromEditor } from "@features/dev-insights/panel/panelControls.js";

export function createPanelHTML(
    analysis,
    executionTime,
    scoreMetrics,
    hotspots,
    relationships,
    bigOComplexity,
    efficiency,
    runtimeMetrics,
    runtimeTimeline,
    codeText = ""
) {
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
              
                ${createRuntimeIntelligenceSection(scoreMetrics, runtimeMetrics, executionTime, efficiency)}
                ${createComplexitySection(bigOComplexity, analysis)}
                ${createExecutionTimeVisualization(hotspots)}
                ${createExecutionFeedbackSection(runtimeMetrics, executionTime, runtimeTimeline, codeText)}
                ${createExperiencePolishSection(runtimeMetrics)}
                ${createAuthoringProductivitySection(analysis, scoreMetrics, efficiency, codeText)}
                ${createCodeStructureVisualization(analysis, relationships)}
                
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

export function createCodeAnalysisGrid(codeText = getCodeFromEditor()) {
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

function createMetricChip(label, value, meta = '', accent) {
    return `
        <div class="metric-chip" style="
            background: var(--dev-panel-bg-secondary);
            border: 1px solid var(--dev-panel-border-light);
            border-radius: 10px;
            padding: 12px;
            box-shadow: var(--dev-panel-shadow);
        ">
            <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--dev-panel-secondary);">
                ${label}
            </div>
            <div style="font-size: 20px; font-weight: 600; margin-top: 4px; color: ${accent || 'var(--dev-panel-text)'};">
                ${value}
            </div>
            <div style="font-size: 11px; opacity: 0.75; margin-top: 2px;">
                ${meta || ''}
            </div>
        </div>
    `;
}

export function createRuntimeIntelligenceSection(scoreMetrics = {}, runtimeMetrics = {}, executionTime = 0, efficiency = {}) {
    const logVolume = totalLogEntries(runtimeMetrics.logs || {});
    const networkSummary = networkBreakdown(runtimeMetrics.network);
    const asyncTotal = sumObject(runtimeMetrics.asyncOps);
    const asyncLabel = asyncSummary(runtimeMetrics.asyncOps);
    const domMutations = runtimeMetrics.domMutations || 0;
    const memoryDelta = formatMb(runtimeMetrics.memory?.delta);
    const performanceLabel = scoreMetrics.performance?.label || 'Balanced';
    const stabilityLabel = scoreMetrics.stability?.label || 'Stable';

    return `
        <div class="metric-card fade-in">
            <div class="metric-header">
                <div class="metric-title">Runtime Intelligence</div>
                <div class="metric-subtitle">Snapshot from the most recent execution</div>
            </div>
            <div class="metric-grid runtime-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px;">
                ${createMetricChip('Execution', `${executionTime.toFixed(2)} ms`, `Performance · ${performanceLabel}`)}
                ${createMetricChip('Logs', logVolume, logVolume > 20 ? 'Consider trimming console noise' : 'Signal looks healthy', logVolume > 20 ? 'var(--dev-panel-warning)' : undefined)}
                ${createMetricChip('Async Ops', asyncTotal, asyncLabel)}
                ${createMetricChip('Network', networkSummary.count, networkSummary.detail)}
                ${createMetricChip('DOM Touches', domMutations, runtimeMetrics.lastDomMutation ? `Last touched: ${runtimeMetrics.lastDomMutation}` : 'Line sync steady')}
                ${createMetricChip('Memory Drift', memoryDelta, `Stability · ${stabilityLabel}`)}
            </div>
            <div class="metric-footnote" style="font-size: 12px; margin-top: 10px; opacity: 0.85;">
                Efficiency: <strong>${efficiency.label || 'N/A'}</strong> · Runtime stability: <strong>${stabilityLabel}</strong>
            </div>
        </div>
    `;
}

export function createExperiencePolishSection(runtimeMetrics = {}) {
    const uiActions = runtimeMetrics.uiActions?.session || {};

    const experiences = [
        {
            icon: '🖱️',
            label: 'Cursor Sync',
            status: runtimeMetrics.domMutations < 40 ? 'Smooth' : 'Heavy editing',
            helper: runtimeMetrics.domMutations < 40 ? 'Layers locked in' : 'Try formatting large blocks',
            active: runtimeMetrics.domMutations < 60
        },
        {
            icon: '📋',
            label: 'Clipboard',
            status: uiActions['copy-code'] ? `${uiActions['copy-code']} copies` : 'Unused',
            helper: uiActions['copy-code'] ? 'Sharing ready' : 'Use the Copy button for instant snippets',
            active: Boolean(uiActions['copy-code'])
        },
        {
            icon: '🌓',
            label: 'Theme',
            status: uiActions['toggle-theme'] ? 'Customized' : 'Default',
            helper: uiActions['toggle-theme'] ? 'Theme toggled for focus' : 'Try switching themes to test contrast',
            active: Boolean(uiActions['toggle-theme'])
        },
        {
            icon: '🧹',
            label: 'Formatter',
            status: uiActions['format-code'] ? 'Applied' : 'Idle',
            helper: 'Press Ctrl + Enter to auto-format blocks',
            active: Boolean(uiActions['format-code'])
        }
    ];

    return `
        <div class="metric-card fade-in">
            <div class="metric-header">
                <div class="metric-title">Experience Polish</div>
                <div class="metric-subtitle">Quick wins that make the editor feel pro-grade</div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                ${experiences.map(exp => `
                    <div style="
                        border: 1px solid ${exp.active ? 'var(--dev-panel-border)' : 'var(--dev-panel-border-light)'};
                        border-radius: 10px;
                        padding: 12px;
                        background: ${exp.active ? 'rgba(97,218,251,0.08)' : 'var(--dev-panel-bg-secondary)'};">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                            <span>${exp.icon}</span>
                            <strong style="font-size: 13px;">${exp.label}</strong>
                            <span style="margin-left: auto; font-size: 11px; color: ${exp.active ? 'var(--dev-panel-success)' : 'var(--dev-panel-secondary)'};">
                                ${exp.status}
                            </span>
                        </div>
                        <div style="font-size: 12px; opacity: 0.8;">${exp.helper}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

export function createAuthoringProductivitySection(analysis = {}, scoreMetrics = {}, efficiency = {}, codeText = "") {
    const stats = [
        { label: 'Functions', value: analysis.functions || 0 },
        { label: 'Loops', value: analysis.loops || 0 },
        { label: 'Async', value: analysis.asyncOps || 0 },
        { label: 'Efficiency', value: `${efficiency.score || 0}%` }
    ];

    const suggestions = buildProductivitySuggestions(analysis, codeText);

    return `
        <div class="metric-card fade-in">
            <div class="metric-header">
                <div class="metric-title">Authoring Productivity</div>
                <div class="metric-subtitle">Guidance to keep writing velocity high</div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-bottom: 12px;">
                ${stats.map(stat => `
                    <div style="background: var(--dev-panel-bg-secondary); border-radius: 8px; padding: 10px;">
                        <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--dev-panel-secondary);">
                            ${stat.label}
                        </div>
                        <div style="font-size: 18px; font-weight: 600; margin-top: 4px;">
                            ${stat.value}
                        </div>
                    </div>
                `).join('')}
            </div>
            <ul style="margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.5;">
                ${suggestions.map(item => `<li>${item}</li>`).join('')}
            </ul>
        </div>
    `;
}

function buildProductivitySuggestions(analysis = {}, codeText = "") {
    const tips = [];
    if (analysis.functions > 12) {
        tips.push('Break modules into smaller files – function count is trending high.');
    }
    if (analysis.loops > analysis.functions * 1.5) {
        tips.push('Consider array helpers (map/filter) to reduce manual loops.');
    }
    if (analysis.asyncOps > 0 && !/try\s*\{[\s\S]*await/.test(codeText)) {
        tips.push('Wrap awaited calls in try/catch to keep authoring friction low.');
    }
    if (!tips.length) {
        tips.push('Structure looks balanced. Keep iterating with confidence.');
    }
    return tips.slice(0, 3);
}

function renderTimeline(timeline = []) {
    if (!timeline || !timeline.length) {
        return '<div class="no-code-message">Run your code to populate the timeline.</div>';
    }

    return timeline.slice(-8).map(event => `
        <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; padding: 6px 10px; border-radius: 6px; background: var(--dev-panel-bg-tertiary);">
            <span style="font-weight: 500;">${event.type}</span>
            <span style="opacity: 0.7;">${formatTimelineDetail(event)}</span>
            <span style="margin-left: auto; opacity: 0.5;">${event.timestamp?.toFixed ? event.timestamp.toFixed(0) : ''}ms</span>
        </div>
    `).join('');
}

function formatTimelineDetail(event = {}) {
    if (!event.detail) return 'No detail';
    if (typeof event.detail === 'string') {
        return event.detail.slice(0, 60);
    }
    if (event.detail.descriptor) {
        return event.detail.descriptor.slice(0, 60);
    }
    if (event.detail.message) {
        return event.detail.message.slice(0, 60);
    }
    return JSON.stringify(event.detail).slice(0, 60);
}

function totalLogEntries(logs = {}) {
    return Object.values(logs).reduce((sum, value) => sum + Number(value || 0), 0);
}

function sumObject(obj = {}) {
    return Object.values(obj).reduce((sum, value) => sum + Number(value || 0), 0);
}

function formatMb(bytes = 0) {
    if (!bytes) return 'steady';
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function asyncSummary(asyncOps = {}) {
    const timeout = asyncOps.timeout || 0;
    const promise = asyncOps.promise || 0;
    if (!timeout && !promise) return 'Idle';
    return `${promise} promise · ${timeout} timers`;
}

function networkBreakdown(network = {}) {
    const total = network.total || 0;
    const fetchCount = network.fetch || 0;
    const xhrCount = network.xhr || 0;
    return {
        count: total,
        detail: total ? `${fetchCount} fetch · ${xhrCount} xhr` : 'No requests'
    };
}

export function createExecutionFeedbackSection(runtimeMetrics, executionTime, runtimeTimeline = [], codeText = getCodeFromEditor()) {
    const realExecutionTime = window.lastExecutionTime || executionTime || 0;
    const unifiedSteps = generateUnifiedExecutionSteps(codeText, runtimeMetrics, realExecutionTime);

    return `
        <div class="metric-card fade-in">
            <div class="metric-header">
                <div class="metric-title">Deeper Execution Feedback</div>
                <div class="metric-subtitle">Visual timeline + code intelligence</div>
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
            <div style="margin: 16px 0;">
                <div style="font-weight: bold; color: var(--dev-panel-info); margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                    🛰️ Runtime Timeline
                </div>
                <div class="runtime-timeline" style="display: flex; flex-direction: column; gap: 6px;">
                    ${renderTimeline(runtimeTimeline)}
                </div>
            </div>
            ${createCodeAnalysisGrid(codeText)}
        </div>
    `;
}
