import { getStepStatusColor, generateUnifiedExecutionSteps } from "@features/dev-insights/detectionLogicHelper.js";
import { analyzeCodePatterns } from "@features/dev-insights/detection/codeAnalyzer.js";
import { createCodeStructureVisualization } from "@features/dev-insights/createCodeStructureVisualization.js";
import { createExecutionTimeVisualization } from "@features/dev-insights/createExecutionTimeVisualization.js";
import { getCodeFromEditor } from "@features/dev-insights/panel/panelControls.js";
import {
    createPerformanceWarningsSection,
    createSecurityScannerSection,
    createHotPathsSection,
    createMemoryProfilingSection,
    createAPICallSummarySection,
    createSmartSuggestionsSection,
    createDependencyGraphSection,
    createPerformanceBudgetSection
} from "@features/dev-insights/advancedSections.js";

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
              
                ${createComplexitySection(bigOComplexity, analysis)}
                ${createCodeStructureVisualization(analysis, relationships)}
                ${createDeepCodeAnalysisSection(scoreMetrics, runtimeMetrics, executionTime, efficiency, analysis, codeText)}
                ${createPerformanceWarningsSection(codeText, runtimeMetrics)}
                ${createSecurityScannerSection(codeText)}
                ${createHotPathsSection(runtimeMetrics, executionTime)}
                ${createMemoryProfilingSection(runtimeMetrics)}
                ${createAPICallSummarySection(runtimeMetrics)}
                ${createSmartSuggestionsSection(codeText, analysis)}
                ${createDependencyGraphSection(codeText)}
                ${createPerformanceBudgetSection(executionTime, runtimeMetrics)}
                ${createExecutionTimeVisualization(hotspots)}
                ${createExecutionFeedbackSection(runtimeMetrics, executionTime, runtimeTimeline, codeText)}
                
            </div>
        </div>
    `;
}

export function createComplexitySection(bigOComplexity, analysis) {
    return `
        <div class="metric-card fade-in">
            <div class="metric-header complexity-header">
                <div class="metric-title">Time & Space Complexity</div>
                <div class="complexity-main-pills">
                    <div class="complexity-pill" aria-label="Time complexity">
                        <span>Time</span>
                        <strong>${bigOComplexity.time}</strong>
                    </div>
                    <div class="complexity-pill" aria-label="Space complexity">
                        <span>Space</span>
                        <strong>${bigOComplexity.space}</strong>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export function createDeepCodeAnalysisSection(
    scoreMetrics = {}, 
    runtimeMetrics = {}, 
    executionTime = 0, 
    efficiency = {},
    analysis = {},
    codeText = ""
) {
    const logVolume = totalLogEntries(runtimeMetrics.logs || {});
    const performanceLabel = scoreMetrics.performance?.label || 'Balanced';
    const stabilityLabel = scoreMetrics.stability?.label || 'Stable';
    const memoryDelta = formatMb(runtimeMetrics.memory?.delta);

    // Code Analysis Metrics
    const metrics = {
        consoleCount: (codeText.match(/console\.(log|error|warn|info|debug|table|group|time)/g) || []).length,
        functions: analysis.functions?.total || 0,
        closures: analysis.functions?.closures || 0,
        higherOrderFunctions: analysis.functions?.higherOrder || 0,
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
    ].filter(item => item.value > 0); // Hide zero values

    const suggestions = buildProductivitySuggestions(analysis, codeText);

    return `
        <div class="metric-card fade-in">
            <div class="metric-header">
                <div class="metric-title">Deep Code Analysis</div>
            </div>
            
            <!-- Code Patterns Grid -->
            <div style="margin: 16px 0;">
                <div style="font-weight: 600; font-size: 13px; margin-bottom: 10px; color: var(--dev-panel-accent);">📊 Code Patterns</div>
                <div class="complexity-grid" style="
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(65px, 1fr));
                    gap: 8px;
                    padding: 10px;
                    background: var(--dev-panel-bg-secondary);
                    border-radius: 8px;
                ">
                    ${gridItems.map(item => `
                        <div class="complexity-item" title="${item.label}" style="text-align: center; padding: 8px;">
                            <div class="complexity-number" style="color: ${item.color}; font-size: 18px; font-weight: 600;">
                                ${item.value}
                            </div>
                            <div class="complexity-label" style="font-size: 10px; margin-top: 4px; opacity: 0.8;">${item.label}</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Productivity Insights -->
            <div style="margin: 16px 0;">
                <div style="font-weight: 600; font-size: 13px; margin-bottom: 10px; color: var(--dev-panel-accent);">💡 Productivity Insights</div>
                <ul style="margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.6; color: var(--dev-panel-text);">
                    ${suggestions.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
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

    const getEventIcon = (type) => {
        const icons = {
            'run-start': '🚀',
            'network': '🌐',
            'async': '⏰',
            'dom': '📝',
            'error': '❌',
            'log': '📋'
        };
        return icons[type] || '📌';
    };

    return timeline.slice(-8).map((event, index) => {
        const isLast = index === timeline.slice(-8).length - 1;
        const connector = isLast ? '└─' : '├─';
        const icon = getEventIcon(event.type);
        const timestamp = event.timestamp?.toFixed ? `${event.timestamp.toFixed(0)}ms` : '';
        
        let detailHTML = '';
        if (event.detail) {
            const detailStyle = 'font-size: 11px; opacity: 0.7; margin-top: 2px; padding-left: 24px; word-break: break-all; overflow-wrap: break-word; max-width: 100%;';
            if (typeof event.detail === 'string') {
                detailHTML = `<div style="${detailStyle}">${event.detail.slice(0, 80)}</div>`;
            } else if (event.detail.descriptor) {
                detailHTML = `<div style="${detailStyle}">${event.detail.descriptor.slice(0, 80)}</div>`;
            } else if (event.detail.codeSize) {
                detailHTML = `<div style="${detailStyle}">Code size: ${event.detail.codeSize} bytes | Session run: #${event.detail.sessionRuns || 1}</div>`;
            } else if (event.detail.kind) {
                detailHTML = `<div style="${detailStyle}">${event.detail.kind}: ${event.detail.detail || ''}</div>`;
            }
        }

        return `
            <div style="font-size: 12px; padding: 6px 0; font-family: 'Courier New', monospace;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="opacity: 0.5;">${connector}</span>
                    <span>${icon}</span>
                    <span style="font-weight: 500; color: var(--dev-panel-accent);">${event.type}</span>
                    <span style="margin-left: auto; opacity: 0.5; font-size: 11px;">${timestamp}</span>
                </div>
                ${detailHTML}
            </div>
        `;
    }).join('');
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
                <div style="font-weight: bold; color: var(--dev-panel-info); margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
                    🛰️ Runtime Timeline
                </div>
                <div style="font-size: 11px; opacity: 0.7; margin-bottom: 8px;">
                    Chronological events from code execution. Session run counts how many times you've run code in this browser session.
                </div>
                <div class="runtime-timeline" style="display: flex; flex-direction: column; gap: 6px;">
                    ${renderTimeline(runtimeTimeline)}
                </div>
            </div>
        </div>
    `;
}
