import { getStepStatusColor, generateUnifiedExecutionSteps } from "@features/dev-insights/detectionLogicHelper.js";
import { createCodeStructureVisualization } from "@features/dev-insights/createCodeStructureVisualization.js";
import { createExecutionTimeVisualization } from "@features/dev-insights/createExecutionTimeVisualization.js";
import { getCodeFromEditor } from "@features/dev-insights/panel/panelControls.js";
import { getOSInfo } from "@shared/commonUtils.js";
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
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block; stroke: var(--dev-panel-bg); fill: rgba(255,255,255,0.2);">
                <path d="M9 18h6m-6 4h6m-7.5-10a5 5 0 1 1 9 0c0 2.5-2 3.5-2 5H8.5c0-1.5-2-2.5-2-5z"></path>
            </svg>
        </button>
        
        <div id="dev-insights-panel">
            <div class="dev-panel-header">
                <div class="dev-panel-title">
                    Developer Insights
                </div>
                <button class="dev-panel-close">×</button>
            </div>
          <div class="dev-panel-content">
              
                <div class="section-group">
                    <div class="section-group-title">Environment</div>
                    ${createEnvironmentSection(runtimeMetrics)}
                </div>

                <div class="section-group">
                    <div class="section-group-title">Core Analysis</div>
                    ${createComplexitySection(bigOComplexity, analysis)}
                    ${createCodeStructureVisualization(analysis, relationships)}
                    ${createDeepCodeAnalysisSection(scoreMetrics, runtimeMetrics, executionTime, efficiency, analysis, codeText)}
                </div>

                <div class="section-group">
                    <div class="section-group-title">Runtime Performance</div>
                    ${createPerformanceBudgetSection(executionTime, runtimeMetrics)}
                    ${createAPICallSummarySection(runtimeMetrics)}
                    ${createMemoryProfilingSection(runtimeMetrics)}
                    ${createHotPathsSection(runtimeMetrics, executionTime)}
                    ${createExecutionTimeVisualization(hotspots)}
                    ${createExecutionFeedbackSection(runtimeMetrics, executionTime, runtimeTimeline, codeText)}
                </div>

                <div class="section-group">
                    <div class="section-group-title">Security & Scanning</div>
                    ${createSecurityScannerSection(codeText)}
                    ${createPerformanceWarningsSection(codeText, runtimeMetrics)}
                    ${createSmartSuggestionsSection(codeText, analysis)}
                    ${createDependencyGraphSection(codeText)}
                </div>
                
            </div>
        </div>
    `;
}

export function createEnvironmentSection(runtimeMetrics) {
    const os = getOSInfo();
    const heapUsed = runtimeMetrics.memory?.delta ? formatMb(runtimeMetrics.memory.delta) : '0 MB';

    return `
        <div class="metric-card fade-in" style="padding: 10px; display: flex; justify-content: space-between; font-size: 12px; border-style: dashed; opacity: 0.9;">
            <div style="display: flex; flex-direction: column; gap: 2px;">
                <span style="font-size: 9px; text-transform: uppercase; color: var(--dev-panel-text-secondary); letter-spacing: 0.05em;">OS</span>
                <span style="font-weight: 600; color: var(--dev-panel-accent);">${os}</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 2px; text-align: right;">
                <span style="font-size: 9px; text-transform: uppercase; color: var(--dev-panel-text-secondary); letter-spacing: 0.05em;">Heap Used</span>
                <span style="font-weight: 600; color: var(--dev-panel-secondary);">${heapUsed}</span>
            </div>
        </div>
    `;
}

export function createComplexitySection(bigOComplexity, analysis) {
    return `
        <div class="metric-card fade-in" style="padding: 10px; display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 16px;">
            <div style="display: flex; flex-direction: column; gap: 2px;">
                <span style="font-size: 9px; text-transform: uppercase; color: var(--dev-panel-text-secondary); letter-spacing: 0.05em;">Time Complexity</span>
                <span style="font-weight: 600; color: var(--dev-panel-accent);">${bigOComplexity.time}</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 2px; text-align: right;">
                <span style="font-size: 9px; text-transform: uppercase; color: var(--dev-panel-text-secondary); letter-spacing: 0.05em;">Space Complexity</span>
                <span style="font-weight: 600; color: var(--dev-panel-accent);">${bigOComplexity.space}</span>
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
    const safeCodeText = typeof codeText === 'string' ? codeText : "";

    // Code Analysis Metrics
    const metrics = {
            consoleCount: (safeCodeText.match(/console\.(log|error|warn|info|debug|table|group|time)/g) || []).length,
            functions: analysis.functions?.total || 0,
            closures: analysis.functions?.closures || 0,
            higherOrderFunctions: analysis.functions?.higherOrder || 0,
            throwStatements: (safeCodeText.match(/throw\s+/g) || []).length,
            globalVars: (safeCodeText.match(/^(\s*|;)\s*(var|let|const)\s+[a-zA-Z_$][\w$]*\s*[=;]/gm) || []).length,
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

    return `
        <div class="metric-card fade-in">
            <div class="metric-header">
                <div class="metric-title">Deep Code Analysis</div>
            </div>
            
            <!-- Code Patterns Grid -->
            <div style="margin: 16px 0;">
                <div style="font-weight: 600; font-size: 13px; margin-bottom: 10px; color: var(--dev-panel-accent);">Code Patterns</div>
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

        </div>
    `;
}

function renderTimeline(timeline = []) {
    if (!timeline || !timeline.length) {
        return '<div class="no-code-message">Run your code to populate the timeline.</div>';
    }

    const getEventIcon = (type) => {
        const icons = {
            'run-start': '→',
            'network': 'net',
            'async': 'tim',
            'dom': 'dom',
            'error': 'err',
            'log': 'log'
        };
        return icons[type] || '•';
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

function sumObject(obj = {}) {
    return Object.values(obj).reduce((sum, value) => sum + Number(value || 0), 0);
}

function formatMb(bytes = 0) {
    if (!bytes) return 'steady';
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

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
                    <span style="display: flex; align-items: center; gap: 8px;">Execution Flow</span>
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
                    Runtime Timeline
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
