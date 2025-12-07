// Advanced UI sections for dev insights
import {
    analyzePerformanceWarnings,
    analyzeSecurity,
    analyzeHotPaths,
    analyzeMemoryProfile,
    summarizeAPICalls,
    generateSmartSuggestions,
    buildDependencyGraph,
    checkPerformanceBudget
} from './advancedAnalyzers.js';

/**
 * Performance Warnings Section
 */
export function createPerformanceWarningsSection(code, runtimeMetrics) {
    const warnings = analyzePerformanceWarnings(code, runtimeMetrics);
    
    if (warnings.length === 0) {
        return '';
    }
    
    return `
        <div class="metric-card fade-in">
            <div class="metric-header">
                <div class="metric-title">⚠️ Performance Warnings (${warnings.length})</div>
            </div>
            <div style="padding: 12px;">
                ${warnings.map(w => `
                    <div style="margin-bottom: 12px; padding: 10px; background: var(--dev-panel-bg-secondary); border-left: 3px solid ${w.severity === 'high' ? 'var(--dev-panel-error)' : 'var(--dev-panel-warning)'}; border-radius: 4px;">
                        <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px;">
                            ${w.severity === 'high' ? '🔴' : '🟡'} ${w.message}
                        </div>
                        <div style="font-size: 12px; opacity: 0.8;">
                            → ${w.suggestion}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

/**
 * Security Scanner Section
 */
export function createSecurityScannerSection(code) {
    const { issues, passes } = analyzeSecurity(code);
    
    // Only show if there are actual issues
    if (issues.length === 0) {
        return '';
    }
    
    return `
        <div class="metric-card fade-in">
            <div class="metric-header">
                <div class="metric-title">🔒 Security Analysis (${issues.length} issues)</div>
            </div>
            <div style="padding: 12px;">
                ${issues.map(issue => `
                    <div style="margin-bottom: 12px; padding: 10px; background: var(--dev-panel-bg-secondary); border-left: 3px solid ${issue.severity === 'critical' ? 'var(--dev-panel-error)' : 'var(--dev-panel-warning)'}; border-radius: 4px;">
                        <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px;">
                            ${issue.severity === 'critical' ? '🔴' : '⚠️'} ${issue.message}
                        </div>
                        <div style="font-size: 12px; opacity: 0.8;">
                            Risk: ${issue.risk}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

/**
 * Hot Paths Section
 */
export function createHotPathsSection(runtimeMetrics, executionTime) {
    const paths = analyzeHotPaths(runtimeMetrics, executionTime);
    
    if (paths.length === 0) return '';
    
    const maxPercentage = Math.max(...paths.map(p => p.percentage));
    
    return `
        <div class="metric-card fade-in">
            <div class="metric-header">
                <div class="metric-title">🔥 Hot Paths</div>
            </div>
            <div style="padding: 12px;">
                ${paths.map(path => {
                    const barWidth = (path.percentage / maxPercentage) * 100;
                    return `
                        <div style="margin-bottom: 10px;">
                            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                                <span>${path.operation}</span>
                                <span style="font-weight: 600;">${path.percentage}% (${path.time.toFixed(2)}ms)</span>
                            </div>
                            <div style="width: 100%; height: 8px; background: var(--dev-panel-bg-secondary); border-radius: 4px; overflow: hidden;">
                                <div style="width: ${barWidth}%; height: 100%; background: linear-gradient(90deg, var(--dev-panel-accent), var(--dev-panel-info)); border-radius: 4px;"></div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

/**
 * Memory Profiling Section
 */
export function createMemoryProfilingSection(runtimeMetrics) {
    const profile = analyzeMemoryProfile(runtimeMetrics);
    
    // Hide if no memory data
    if (profile.initial === 0 && profile.peak === 0 && profile.final === 0) {
        return '';
    }
    
    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const mb = bytes / (1024 * 1024);
        return mb >= 1 ? `${mb.toFixed(2)} MB` : `${(bytes / 1024).toFixed(2)} KB`;
    };
    
    return `
        <div class="metric-card fade-in">
            <div class="metric-header">
                <div class="metric-title">💾 Memory Profile</div>
            </div>
            <div style="padding: 12px; font-size: 13px; line-height: 1.8;">
                <div>Initial: <strong>${formatBytes(profile.initial)}</strong></div>
                <div>Peak: <strong>${formatBytes(profile.peak)}</strong> ${profile.peak > profile.initial ? `(+${formatBytes(profile.peak - profile.initial)})` : ''}</div>
                <div>Final: <strong>${formatBytes(profile.final)}</strong></div>
                ${profile.potentialLeak ? `
                    <div style="margin-top: 8px; padding: 8px; background: var(--dev-panel-bg-secondary); border-left: 3px solid var(--dev-panel-warning); border-radius: 4px;">
                        ⚠️ Potential leak: ~${formatBytes(Math.abs(profile.delta))}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

/**
 * API Call Summary Section
 */
export function createAPICallSummarySection(runtimeMetrics) {
    const summary = summarizeAPICalls(runtimeMetrics);
    
    if (summary.total === 0) return '';
    
    return `
        <div class="metric-card fade-in">
            <div class="metric-header">
                <div class="metric-title">🌐 Network Summary</div>
            </div>
            <div style="padding: 12px;">
                <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">
                    Total Requests: ${summary.total}
                </div>
                <div style="font-size: 13px; line-height: 1.8; padding-left: 12px;">
                    <div>├─ GET: ${summary.get} ${summary.get > 0 ? `(avg ${summary.avgTime}ms)` : ''}</div>
                    <div>├─ POST: ${summary.post}</div>
                    <div style="color: ${summary.failed > 0 ? 'var(--dev-panel-error)' : 'var(--dev-panel-success)'};">
                        └─ Failed: ${summary.failed}
                    </div>
                </div>
                ${summary.dataTransferred > 0 ? `
                    <div style="margin-top: 8px; font-size: 12px; opacity: 0.8;">
                        Data: ${(summary.dataTransferred / 1024).toFixed(2)} KB
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

/**
 * Smart Suggestions Section
 */
export function createSmartSuggestionsSection(code, analysis) {
    const suggestions = generateSmartSuggestions(code, analysis);
    
    if (suggestions.length === 0) return '';
    
    return `
        <div class="metric-card fade-in">
            <div class="metric-header">
                <div class="metric-title">💡 Smart Suggestions</div>
            </div>
            <ul style="margin: 12px 0; padding-left: 28px; font-size: 13px; line-height: 1.8;">
                ${suggestions.map(s => `<li>${s}</li>`).join('')}
            </ul>
        </div>
    `;
}

/**
 * Dependency Graph Section
 */
export function createDependencyGraphSection(code) {
    const graph = buildDependencyGraph(code);
    const entries = Object.entries(graph);
    
    if (entries.length === 0) return '';
    
    return `
        <div class="metric-card fade-in">
            <div class="metric-header">
                <div class="metric-title">🔗 Dependency Graph</div>
            </div>
            <div style="padding: 12px; font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.8;">
                ${entries.map(([fn, deps], index) => {
                    const isLast = index === entries.length - 1;
                    return `
                        <div>
                            <div style="font-weight: 600; color: var(--dev-panel-accent);">${fn}()</div>
                            ${deps.map((dep, i) => {
                                const connector = i === deps.length - 1 ? '└─' : '├─';
                                return `<div style="padding-left: 12px; opacity: 0.8;">${connector} ${dep}()</div>`;
                            }).join('')}
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

/**
 * Performance Budget Section
 */
export function createPerformanceBudgetSection(executionTime, runtimeMetrics) {
    const budgets = checkPerformanceBudget(executionTime, runtimeMetrics);
    
    const formatValue = (budget) => {
        if (budget.unit === 'MB') {
            return `${(budget.current / (1024 * 1024)).toFixed(2)} MB`;
        }
        if (budget.unit === 'ms') {
            return `${budget.current.toFixed(3)} ms`;
        }
        return `${budget.current} ${budget.unit}`;
    };
    
    const formatLimit = (budget) => {
        if (budget.unit === 'MB') {
            return `${(budget.limit / (1024 * 1024)).toFixed(0)} MB`;
        }
        return `${budget.limit} ${budget.unit}`;
    };
    
    return `
        <div class="metric-card fade-in">
            <div class="metric-header">
                <div class="metric-title">📊 Performance Metrics</div>
            </div>
            <div style="padding: 12px;">
                ${Object.entries(budgets).map(([key, budget]) => {
                    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    const icon = budget.status === 'pass' ? '✅' : '⚠️';
                    const color = budget.status === 'pass' ? 'var(--dev-panel-success)' : 'var(--dev-panel-warning)';
                    
                    return `
                        <div style="margin-bottom: 10px;">
                            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                                <span>${label}</span>
                                <span style="font-weight: 600; color: ${color};">
                                    ${formatValue(budget)} / ${formatLimit(budget)} ${icon}
                                </span>
                            </div>
                            <div style="width: 100%; height: 6px; background: var(--dev-panel-bg-secondary); border-radius: 3px; overflow: hidden;">
                                <div style="width: ${Math.min(budget.percentage, 100)}%; height: 100%; background: ${budget.status === 'pass' ? 'var(--dev-panel-success)' : 'var(--dev-panel-warning)'}; border-radius: 3px;"></div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}
