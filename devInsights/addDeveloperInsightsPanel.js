import { analyzeExecutionHotspots } from "./analyzeExecutionHotspots.js";
import { createCodeStructureVisualization } from "./createCodeStructureVisualization.js";
import { createExecutionTimeVisualization } from "./createExecutionTimeVisualization.js";
import { generateOptimizationTips } from "./generateOptimizationTips.js";
import { analyzeFunctionRelationships } from "./analyzeFunctionRelationships.js";
import { estimateBigOComplexity } from "./estimateBigOComplexity.js";
import { calculateCodeEfficiency } from "./calculateCodeEfficiency.js";
import detectionLogicHelper from "./ditectionLogicHelper.js";

const {
    generateUnifiedExecutionSteps,
    getStepStatusColor,
    getComplexityClass,
    getComplexityPercentage,
    getPerformanceClass,
    setupEventListeners,
    analyzeCodePatterns,
} = detectionLogicHelper

export function addDeveloperInsightsPanel(analysis, executionTime, code = "") {
    // Remove existing panel if it exists
    const existingPanel = document.getElementById('dev-insights-sidebar');
    if (existingPanel) {
        existingPanel.remove();
    }

    // Get real-time execution metrics
    const metrics = window.executionTracker ? window.executionTracker.getMetrics() : {
        peakMemory: 0,
        gcCollections: 0,
        domManipulations: 0,
        networkRequests: 0,
        cacheHits: 0,
        errorCount: 0
    };


    // Advanced analysis
    const hotspots = analyzeExecutionHotspots(analysis, executionTime);
    const relationships = analyzeFunctionRelationships(code);
    const bigOComplexity = estimateBigOComplexity(code);
    const efficiency = calculateCodeEfficiency(analysis);
    const optimizationTips = generateOptimizationTips(analysis, executionTime);

    // Calculate standardized metrics
    const standardizedMetrics = calculateStandardizedMetrics(analysis, executionTime, metrics, code);

    // Create sidebar container
    const sidebar = document.createElement('div');
    sidebar.id = 'dev-insights-sidebar';
    sidebar.innerHTML = createPanelHTML(analysis, executionTime, standardizedMetrics, hotspots, relationships, bigOComplexity, efficiency, optimizationTips, metrics);

    document.body.appendChild(sidebar);

    // Add event listeners
    setupEventListeners(sidebar);
}

function calculateStandardizedMetrics(analysis, executionTime, metrics, code) {
    // Complexity Score (0-100)
    const complexityScore = Math.min(100, (analysis.functions * 10) + (analysis.loops * 15) + (analysis.asyncOps * 12));

    // Performance Score (0-100) - inverse of execution time
    const performanceScore = Math.max(0, 100 - Math.min(100, executionTime / 5));

    // Maintainability Score (0-100)
    const codeLength = code.length;
    const avgFunctionLength = analysis.functions > 0 ? codeLength / analysis.functions : 0;
    const maintainabilityScore = Math.max(0, 100 - Math.min(50, avgFunctionLength / 20) - Math.min(30, analysis.loops * 5) - Math.min(20, complexityScore / 5));

    // Memory Efficiency (0-100)
    const memoryScore = metrics.peakMemory > 0 ? Math.max(0, 100 - Math.min(100, metrics.peakMemory / 1000000)) : 95;

    // Code Quality Score (weighted average)
    const qualityScore = Math.round(
        (performanceScore * 0.3) +
        (maintainabilityScore * 0.25) +
        (memoryScore * 0.2) +
        ((100 - Math.min(100, complexityScore)) * 0.25)
    );

    return {
        complexity: { score: complexityScore, label: getScoreLabel(complexityScore, 'complexity') },
        performance: { score: performanceScore, label: getScoreLabel(performanceScore, 'performance') },
        maintainability: { score: maintainabilityScore, label: getScoreLabel(maintainabilityScore, 'maintainability') },
        memory: { score: memoryScore, label: getScoreLabel(memoryScore, 'memory') },
        quality: { score: qualityScore, label: getScoreLabel(qualityScore, 'quality') }
    };
}

function getScoreLabel(score, type) {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 40) return 'Poor';
    return 'Critical';
}

function createPanelHTML(analysis, executionTime, metrics, hotspots, relationships, bigOComplexity, efficiency, optimizationTips, realTimeMetrics) {
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
                ${createPerformanceSection(metrics, hotspots)}
                ${createCodeQualitySection(relationships, efficiency)}
                ${createCodeStructureVisualization(analysis, relationships)}
                ${createExecutionTimeVisualization(hotspots)}
                ${createMemorySection(realTimeMetrics,executionTime)}
                
            </div>
        </div>
    `;
}

function createComplexitySection(bigOComplexity, analysis) {
    // Tooltip content for each complexity metric
    const tooltips = {
        time: "Time complexity (Big O notation) based on the most complex operation in your code. Lower is better.",
        space: "Space complexity (Big O notation) based on the memory usage of your code. Lower is better.",
        maxDepth: "Maximum nesting depth of loops and conditionals. Higher values may indicate complex logic that's hard to maintain.",
        recursion: "Indicates if the code contains recursive functions, which can be powerful but may cause stack overflow if not implemented carefully."
    };

    // Helper function to create tooltip elements
    const createTooltip = (text, tooltipText) => `
        <div class="tooltip-container">
            <span class="info-icon">ℹ️</span>
            <div class="tooltip">${tooltipText}</div>
        </div>
    `;

    return `
        <div class="metric-card fade-in">
            <div class="metric-header">
                <div class="metric-title">Complexity</div>
                <div class="metric-value">${bigOComplexity.time}</div>
            </div>
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress-fill ${getComplexityClass(bigOComplexity.time)}" 
                         style="width: ${getComplexityPercentage(bigOComplexity.time)}%"></div>
                </div>
            </div>
            <div class="complexity-grid">
                <div class="complexity-item">
                    <div class="complexity-label">
                        Time: ${bigOComplexity.time}
                        ${createTooltip('Time', tooltips.time)}
                    </div>
                </div>
                <div class="complexity-item">
                    <div class="complexity-label">
                        Space: ${bigOComplexity.space}
                        ${createTooltip('Space', tooltips.space)}
                    </div>
                </div>
                <div class="complexity-item">
                    <div class="complexity-label">
                        Max Depth: ${bigOComplexity.maxLoopDepth}
                        ${createTooltip('Max Depth', tooltips.maxDepth)}
                    </div>
                </div>
                <div class="complexity-item">
                    <div class="complexity-label">
                        Recursion: ${bigOComplexity.recursivePatterns}
                        ${createTooltip('Recursion', tooltips.recursion)}
                    </div>
                </div>
            </div>
            
        </div>
    `;
}

function createPerformanceSection(metrics, hotspots) {
    return `
        <div class="metric-card fade-in">
            <div class="metric-header">
                <div class="metric-title">Perf Metrics</div>
                <div class="metric-value">${metrics.performance.score.toFixed(2)}/100</div>
            </div>
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress-fill ${getPerformanceClass(metrics.performance.score)}" 
                         style="width: ${metrics.performance.score}%"></div>
                </div>
            </div>
            ${hotspots.hotspots.length > 0 ? `
                <div style="margin-top: 12px;">
                    <strong>Performance Hotspots:</strong>
                    ${hotspots.hotspots.slice(0, 3).map(hotspot => `
                        <div style="margin: 4px 0; font-size: 12px;">
                            • ${hotspot.type}: ${hotspot.estimatedPercentage}% impact
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            <div class="metric-description">
                Performance rating: ${metrics.performance.label}
            </div>
        </div>
    `;
}

function createCodeQualitySection(relationships, efficiency) {
    return `
        <div class="metric-card fade-in">
            <div class="metric-header">
                <div class="metric-title">Code Quality</div>
                <div class="metric-value">${efficiency.score}/100</div>
            </div>
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress-fill ${getPerformanceClass(efficiency.score)}" 
                         style="width: ${efficiency.score}%"></div>
                </div>
            </div>
            ${relationships.functionCount > 0 ? `
                <div style="margin-top: 12px;">
                    <strong>Function Analysis:</strong>
                    <div style="font-size: 12px; margin: 4px 0;">
                        • ${relationships.functionCount} functions detected
                        ${relationships.mostCalledFunctions.length > 0 ? `
                            <br>• Most called: ${relationships.mostCalledFunctions[0]}
                        ` : ''}
                    </div>
                </div>
            ` : ''}
            <div class="metric-description">
                Code efficiency: ${efficiency.label}
            </div>
        </div>
    `;
}

function createCodeAnalysisGrid() {
    const codeText = getCodeFromEditor();
    if (!codeText) {
        return '<div class="no-code-message">No code to analyze</div>';
    }

    const analysis = analyzeCodePatterns(codeText);
    if (analysis.error) {
        return `<div class="error-message">${analysis.error}</div>`;
    }

    // Extract metrics with safe fallbacks
    const metrics = {
        // Console logs
        consoleCount: (codeText.match(/console\.(log|error|warn|info|debug|table|group|time)/g) || []).length,

        // From functions analysis
        functions: analysis.functions?.total || 0,
        closures: analysis.functions?.closures || 0,
        higherOrderFunctions: analysis.functions?.higherOrder || 0,

        // Memory and errors
        memoryLeaks: analysis.memoryLeaks?.total || 0,
        errorHandling: analysis.codeSmells?.errorHandling || 0,
        throwStatements: (codeText.match(/throw\s+/g) || []).length,

        // Variables and scoping
        globalVars: (codeText.match(/^(\s*|;)\s*(var|let|const)\s+[a-zA-Z_$][\w$]*\s*[=;]/gm) || []).length,

        // Loops and async
        loopTypes: analysis.loops?.total || 0,
        asyncPatterns: analysis.asyncPatterns?.total || 0,

        // Code quality
        codeSmells: analysis.codeSmells?.total || 0,
        cyclomaticComplexity: analysis.metrics?.complexity || 0,
        securityIssues: analysis.securityAnalysis?.issues?.total || 0,
        performanceAntiPatterns: analysis.performanceIssues?.total || 0,

        // Additional metrics
        domOperations: analysis.domPatterns?.total || 0,
        dataStructures: (codeText.match(/(?:new\s+(?:Map|Set|WeakMap|WeakSet|Date|RegExp|Promise|Error)\s*\(|Array\s*\.|Object\s*\.)/g) || []).length
    };

    // Helper function to determine color based on thresholds
    const getColor = (value, thresholds = { good: 0, warn: 1, error: 5 }) => {
        if (value <= thresholds.good) return 'var(--dev-panel-success)';
        if (value <= thresholds.warn) return 'var(--dev-panel-warning)';
        if (value <= thresholds.error) return 'var(--dev-panel-error)';
        return 'var(--dev-panel-error)';
    };

    // Grid items configuration
    const gridItems = [
        {
            label: 'Console Logs',
            value: metrics.consoleCount,
            color: getColor(metrics.consoleCount, { good: 2, warn: 5 })
        },
        {
            label: 'Closures',
            value: metrics.closures,
            color: getColor(metrics.closures, { good: 2, warn: 5 })
        },

        {
            label: 'Functions',
            value: metrics.functions,
            color: getColor(metrics.functions, { good: 4, warn: 8 })
        },

        // {
        //     label: 'Memory Leaks',
        //     value: metrics.memoryLeaks,
        //     color: metrics.memoryLeaks > 0 ? 'var(--dev-panel-error)' : 'var(--dev-panel-success)'
        // },
        // {
        //     label: 'Error Handling',
        //     value: metrics.errorHandling,
        //     color: metrics.errorHandling > 0 ? 'var(--dev-panel-success)' : 'var(--dev-panel-warning)'
        // },
        {
            label: 'Throw Blocks',
            value: metrics.throwStatements,
            color: metrics.throwStatements > 0 ? 'var(--dev-panel-success)' : 'var(--dev-panel-secondary)'
        },
        {
            label: 'Global Vars',
            value: metrics.globalVars,
            color: getColor(metrics.globalVars, { good: 1, warn: 3 })
        },
        {
            label: 'HOFs',
            value: metrics.higherOrderFunctions,
            color: metrics.higherOrderFunctions > 0 ? 'var(--dev-panel-success)' : 'var(--dev-panel-secondary)'
        },
        {
            label: 'Loops',
            value: metrics.loopTypes,
            color: metrics.loopTypes > 0 ? 'var(--dev-panel-success)' : 'var(--dev-panel-secondary)'
        },
        {
            label: 'Async Ops',
            value: metrics.asyncPatterns,
            color: metrics.asyncPatterns > 0 ? 'var(--dev-panel-success)' : 'var(--dev-panel-secondary)'
        },
        {
            label: 'DOM Ops',
            value: metrics.domOperations,
            color: getColor(metrics.domOperations, { good: 5, warn: 10 })
        },
        // {
        //     label: 'Data Structures',
        //     value: metrics.dataStructures,
        //     color: metrics.dataStructures > 0 ? 'var(--dev-panel-success)' : 'var(--dev-panel-secondary)'
        // },
        {
            label: 'Code Smells',
            value: metrics.codeSmells,
            color: getColor(metrics.codeSmells, { good: 0, warn: 1 })
        },
        // {
        //     label: 'Complexity',
        //     value: metrics.cyclomaticComplexity,
        //     color: getColor(metrics.cyclomaticComplexity, { good: 5, warn: 10 })
        // },
        // {
        //     label: 'Security Issues',
        //     value: metrics.securityIssues,
        //     color: metrics.securityIssues > 0 ? 'var(--dev-panel-error)' : 'var(--dev-panel-success)'
        // },
        // {
        //     label: 'Perf Issues',
        //     value: metrics.performanceAntiPatterns,
        //     color: metrics.performanceAntiPatterns > 0 ? 'var(--dev-panel-warning)' : 'var(--dev-panel-success)'
        // }
    ];

    // Generate grid items HTML
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

function createMemorySection(realTimeMetrics,executionTime) {
    const memoryUsage = realTimeMetrics.peakMemory;
    const memoryMB = (memoryUsage / (1024 * 1024)).toFixed(2);
    const codeText = getCodeFromEditor();
    const realExecutionTime = window.lastExecutionTime || executionTime || 0;

    // Generate unified execution steps with real-time analysis
    const unifiedSteps = generateUnifiedExecutionSteps(codeText, realTimeMetrics, realExecutionTime);


    return `
        <div class="metric-card fade-in">
            <div class="metric-header">
                <div class="metric-title">Deep Analysis</div>
            </div>
            
            <!-- Memory Overview -->
           
            <!-- Unified Real-Time Execution Flow -->
            <div style="margin: 16px 0;">
                <div style="font-weight: bold; color: var(--dev-panel-accent); margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
                    <span style="display: flex; align-items: center; gap: 8px;">⚡ Execution Flow</span>
                    <span style="font-size: 12px; color: var(--dev-panel-secondary);">Total: ${realExecutionTime.toFixed(2)}ms</span>
                </div>
                <div class="execution-flow">
                    ${unifiedSteps.map((step, index) => `
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

            <!-- Advanced Code Analysis Grid -->
            ${createCodeAnalysisGrid()} 
    `;
}

function getCodeFromEditor() {
    // Try to get code from the editor
    const codeElement = document.getElementById('code-text');
    if (codeElement) {
        return codeElement.textContent || codeElement.innerText || '';
    }

    // Fallback to global code variable if available
    if (typeof window !== 'undefined' && window.currentCode) {
        return window.currentCode;
    }

    return '';
}

// Global function for closing panel
function toggleDevInsights() {
    const sidebar = document.getElementById('dev-insights-sidebar');
    if (sidebar) {
        const panel = sidebar.querySelector('#dev-insights-panel');
        if (panel) {
            const isHidden = panel.style.display === 'none' || !panel.style.display;

            if (isHidden) {
                panel.style.display = 'block';
                sidebar.classList.add('open');
            } else {
                closeDevInsights(); // Reuse close function
            }
        }
    }
}

function closeDevInsights() {
    const sidebar = document.getElementById('dev-insights-sidebar');
    if (sidebar) {
        const panel = sidebar.querySelector('#dev-insights-panel');
        if (panel) {
            panel.style.display = 'none';
            sidebar.classList.remove('open');
        }
    }
}

// Make function globally available
window.toggleDevInsights = toggleDevInsights;

