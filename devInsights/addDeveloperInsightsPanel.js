import { analyzeExecutionHotspots } from "./analyzeExecutionHotspots.js";
import { createCodeStructureVisualization } from "./createCodeStructureVisualization.js";
import { createExecutionTimeVisualization } from "./createExecutionTimeVisualization.js";
import { generateOptimizationTips } from "./generateOptimizationTips.js";
import { analyzeFunctionRelationships } from "./analyzeFunctionRelationships.js";
import { estimateBigOComplexity } from "./estimateBigOComplexity.js";
import { calculateCodeEfficiency } from "./calculateCodeEfficiency.js";
import detectionLogicHelper from "./ditectionLogicHelper.js";

const {detectAsyncPatterns,
    detectDOMPatterns,
    detectErrorPatterns,
    detectFunctionPatterns,
    detectLoopPatterns,
    detectOutputPatterns,
    generateUnifiedExecutionSteps,
    getStepStatusColor,
    getComplexityClass,
    getComplexityPercentage,
    getPerformanceClass,
    getQualityClass,
    setupEventListeners,
    detectMemoryLeaks,
    detectCodeSmells,
    detectTestingPatterns,
    detectAccessibilityPatterns,
    calculateCyclomaticComplexity,
    detectCodeDuplication,
    detectPerformanceAntiPatterns,
    detectSecurityIssues} = detectionLogicHelper

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
                <button class="dev-panel-close" onclick="toggleDevInsights()">×</button>
            </div>
            
          <div class="dev-panel-content">
                ${createOverviewSection(analysis, executionTime, metrics)}
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

function createOverviewSection(analysis, executionTime, metrics) {
    return `
        <div class="metric-card fade-in">
            <div class="metric-header">
                <div class="metric-title">Code Overview</div>
                <div class="metric-value">${metrics.quality.score}/100</div>
            </div>
            <div class="complexity-grid">
                <div class="complexity-item">
                    <div class="complexity-number">${analysis.functions}</div>
                    <div class="complexity-label">Functions</div>
                </div>
                <div class="complexity-item">
                    <div class="complexity-number">${analysis.loops}</div>
                    <div class="complexity-label">Loops</div>
                </div>
                <div class="complexity-item">
                    <div class="complexity-number">${analysis.asyncOps}</div>
                    <div class="complexity-label">Async Ops</div>
                </div>
                <div class="complexity-item">
                    <div class="complexity-number">${executionTime.toFixed(1)}ms</div>
                    <div class="complexity-label">Exec Time</div>
                </div>
            </div>
            <div class="metric-description">
                Overall code quality: ${metrics.quality.label}
            </div>
        </div>
    `;
}

function createComplexitySection(bigOComplexity, analysis) {
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
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px;">
                <div>
                    <strong>Time:</strong> ${bigOComplexity.time}<br>
                    <strong>Space:</strong> ${bigOComplexity.space}
                </div>
                <div>
                    <strong>Max Depth:</strong> ${bigOComplexity.maxLoopDepth}<br>
                    <strong>Recursion:</strong> ${bigOComplexity.recursivePatterns}
                </div>
            </div>
            <div class="metric-description">
                Estimated algorithmic complexity based on code structure analysis
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
                    <div class="progress-fill ${getQualityClass(efficiency.score)}" 
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
    const codeAnalysis = analyzeCodePatterns();

    return `
        <div class="complexity-grid" style="margin: 12px 0;">
            <div class="complexity-item">
                <div class="complexity-number" style="color: ${codeAnalysis.consoleCount > 5 ? 'var(--dev-panel-warning)' : 'var(--dev-panel-success)'}">
                    ${codeAnalysis.consoleCount}
                </div>
                <div class="complexity-label">Console Logs</div>
            </div>
            <div class="complexity-item">
                <div class="complexity-number" style="color: ${codeAnalysis.closures > 3 ? 'var(--dev-panel-warning)' : 'var(--dev-panel-success)'}">
                    ${codeAnalysis.closures}
                </div>
                <div class="complexity-label">Closures</div>
            </div>
            <div class="complexity-item">
                <div class="complexity-number" style="color: ${codeAnalysis.memoryLeaks > 0 ? 'var(--dev-panel-error)' : 'var(--dev-panel-success)'}">
                    ${codeAnalysis.memoryLeaks}
                </div>
                <div class="complexity-label">Memory Leaks</div>
            </div>
            <div class="complexity-item">
                <div class="complexity-number" style="color: ${codeAnalysis.errorHandling > 0 ? 'var(--dev-panel-success)' : 'var(--dev-panel-warning)'}">
                    ${codeAnalysis.errorHandling}
                </div>
                <div class="complexity-label">Try/Catch</div>
            </div>
            <div class="complexity-item">
                <div class="complexity-number" style="color: ${codeAnalysis.throwStatements > 0 ? 'var(--dev-panel-success)' : 'var(--dev-panel-secondary)'}">
                    ${codeAnalysis.throwStatements}
                </div>
                <div class="complexity-label">Throw Blocks</div>
            </div>
            <div class="complexity-item">
                <div class="complexity-number" style="color: ${codeAnalysis.globalVars > 2 ? 'var(--dev-panel-warning)' : 'var(--dev-panel-success)'}">
                    ${codeAnalysis.globalVars}
                </div>
                <div class="complexity-label">Global Vars</div>
            </div>
            <div class="complexity-item">
                <div class="complexity-number" style="color: ${codeAnalysis.higherOrderFunctions > 0 ? 'var(--dev-panel-success)' : 'var(--dev-panel-secondary)'}">
                    ${codeAnalysis.higherOrderFunctions}
                </div>
                <div class="complexity-label">Higher-Order Functions</div>
            </div>
            <div class="complexity-item">
                <div class="complexity-number" style="color: ${codeAnalysis.loopTypes > 0 ? 'var(--dev-panel-success)' : 'var(--dev-panel-secondary)'}">
                    ${codeAnalysis.loopTypes}
                </div>
                <div class="complexity-label">Loops</div>
            </div>
            <div class="complexity-item">
                <div class="complexity-number" style="color: ${codeAnalysis.asyncPatterns > 0 ? 'var(--dev-panel-success)' : 'var(--dev-panel-secondary)'}">
                    ${codeAnalysis.asyncPatterns}
                </div>
                <div class="complexity-label">Async Operations</div>
            </div>
            <div class="complexity-item">
                <div class="complexity-number" style="color: ${codeAnalysis.accessibilityPatterns > 0 ? 'var(--dev-panel-success)' : 'var(--dev-panel-secondary)'}">
                    ${codeAnalysis.accessibilityPatterns}
                </div>
                <div class="complexity-label">Accessibility</div>
            </div>
            <div class="complexity-item">
                <div class="complexity-number" style="color: ${codeAnalysis.testingPatterns > 0 ? 'var(--dev-panel-success)' : 'var(--dev-panel-secondary)'}">
                    ${codeAnalysis.testingPatterns}
                </div>
                <div class="complexity-label">Testing</div>
            </div>
            <div class="complexity-item">
                <div class="complexity-number" style="color: ${codeAnalysis.codeDuplication > 0 ? 'var(--dev-panel-warning)' : 'var(--dev-panel-success)'}">
                    ${codeAnalysis.codeDuplication}
                </div>
                <div class="complexity-label">Duplication</div>
            </div>
            <div class="complexity-item">
                <div class="complexity-number" style="color: ${codeAnalysis.codeSmells > 0 ? 'var(--dev-panel-warning)' : 'var(--dev-panel-success)'}">
                    ${codeAnalysis.codeSmells}
                </div>
                <div class="complexity-label">Code Smells</div>
            </div>
            <div class="complexity-item">
                <div class="complexity-number" style="color: ${codeAnalysis.cyclomaticComplexity > 0 ? 'var(--dev-panel-warning)' : 'var(--dev-panel-success)'}">
                    ${codeAnalysis.cyclomaticComplexity}
                </div>
                <div class="complexity-label">Cyclomatic Complexity</div>
            </div>
            <div class="complexity-item">
                <div class="complexity-number" style="color: ${codeAnalysis.securityIssues > 0 ? 'var(--dev-panel-error)' : 'var(--dev-panel-success)'}">
                    ${codeAnalysis.securityIssues}
                </div>
                <div class="complexity-label">Security Issues</div>
            </div>
            <div class="complexity-item">
                <div class="complexity-number" style="color: ${codeAnalysis.performanceAntiPatterns > 0 ? 'var(--dev-panel-error)' : 'var(--dev-panel-success)'}">
                    ${codeAnalysis.performanceAntiPatterns}
                </div>
                <div class="complexity-label">Performance Anti-Patterns</div>
            </div>
           
            
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


    let domOperationsHTML = '';
    if (realTimeMetrics.domOperations && Object.keys(realTimeMetrics.domOperations).length > 0) {
        domOperationsHTML = Object.entries(realTimeMetrics.domOperations)
            .sort((a, b) => b[1] - a[1]) // Sort by count descending
            .map(([op, count]) => `
                <div style="background: var(--dev-panel-metric-bg); padding: 6px 10px; border-radius: 4px; font-size: 12px;">
                    <span style="color: var(--dev-panel-text);">${op}:</span>
                    <span style="color: var(--dev-panel-accent); font-weight: bold; margin-left: 4px;">${count}</span>
                </div>
            `)
            .join('');
    }

/*
 <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin: 12px 0; padding: 12px; background: var(--dev-panel-metric-bg); border-radius: 8px;">
               <div style="text-align: center;">
                    <div style="font-size: 18px; font-weight: bold; color: var(--dev-panel-accent);">${memoryMB}MB</div>
                    <div style="font-size: 11px; opacity: 0.8;">Peak Memory</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 18px; font-weight: bold; color: var(--dev-panel-success);">${realTimeMetrics.domManipulations}</div>
                    <div style="font-size: 11px; opacity: 0.8;">DOM Ops</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 18px; font-weight: bold; color: var(--dev-panel-warning);">${realTimeMetrics.networkRequests}</div>
                    <div style="font-size: 11px; opacity: 0.8;">Network</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 18px; font-weight: bold; color: var(--dev-panel-error);">${realTimeMetrics.errorCount}</div>
                    <div style="font-size: 11px; opacity: 0.8;">Errors</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 18px; font-weight: bold; color: gray;">${realTimeMetrics.gcCollections}</div>
                    <div style="font-size: 11px; opacity: 0.8;">GC</div>
                </div>
            </div>
 */


    return `
        <div class="metric-card fade-in">
            <div class="metric-header">
                <div class="metric-title">Deep Analysis</div>
<!--                <div class="metric-value">${memoryMB}MB | ${realExecutionTime.toFixed(2)}ms</div>-->
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
            
            
              <!-- DOM Operations Breakdown -->
             
    `;
}

// Code analysis patterns
function analyzeCodePatterns() {
    const codeText = getCodeFromEditor();

    if (!codeText) {
        return {
            consoleCount: 0,
            closures: 0,
            memoryLeaks: 0,
            errorHandling: 0,
            throwStatements: 0,
            globalVars: 0,
            higherOrderFunctions: 0,
            functionalMethods: 0,
            loopTypes: 0,
            dataStructures: 0,
            asyncPatterns: 0,
            designPatterns: 0,
            securityIssues: 0,
            performanceAntiPatterns: 0,
            codeDuplication: 0,
            cyclomaticComplexity: 0,
            accessibilityPatterns: 0,
            testingPatterns: 0,
            codeSmells: 0
        };
    }

    const patterns = {
        consoleCount: (codeText.match(/console\.(log|error|warn|info|debug|trace|table|group|time)/g) || []).length,
        closures: (codeText.match(/function[^}]*(?:function|=>)|=>[^}]*(?:function|=>)|\(\s*\)\s*=>\s*\([^)]*\)\s*=>/g) || []).length,
        // memoryLeaks: (codeText.match(/(?:setInterval|setTimeout)(?!.*(?:clearInterval|clearTimeout))|addEventListener(?!.*removeEventListener)|new\s+\w+\s*\([^)]*\)(?!.*\.close\(\)|.*\.disconnect\(\))/g) || []).length,
        memoryLeaks: detectMemoryLeaks(codeText),
        errorHandling: (codeText.match(/try\s*\{[\s\S]*?catch\s*\([^)]*\)|\.catch\s*\(|Promise\.catch/g) || []).length,
        throwStatements: (codeText.match(/throw\s+(?:new\s+)?\w+|throw\s+['"`][^'"`]*['"`]/g) || []).length,
        globalVars: (codeText.match(/(?:^|\n)\s*var\s+\w+(?!\s*=\s*function)|window\.\w+\s*=|global\.\w+\s*=/gm) || []).length,

        // Higher-Order Functions (HOF)
        higherOrderFunctions: (codeText.match(/(?:function\s+\w+[^{]*\{[^}]*return\s+function|=>\s*(?:\([^)]*\)\s*)?=>|\w+\s*=\s*(?:\([^)]*\)\s*)?=>\s*(?:\([^)]*\)\s*)?=>)/g) || []).length,

        // Functional Programming Methods
        functionalMethods: (codeText.match(/\.(?:map|filter|reduce|forEach|find|findIndex|some|every|sort|reverse|slice|splice|concat|join|includes|indexOf|lastIndexOf|flatMap|flat)\s*\(/g) || []).length,

        // All Loop Types
        loopTypes: [
            ...((codeText.match(/for\s*\([^)]*\)\s*\{/g) || [])), // for loops
            ...((codeText.match(/while\s*\([^)]*\)\s*\{/g) || [])), // while loops
            ...((codeText.match(/do\s*\{[\s\S]*?\}\s*while\s*\([^)]*\)/g) || [])), // do-while loops
            ...((codeText.match(/for\s*\(\s*(?:let|const|var)\s+\w+\s+in\s+[^)]+\)/g) || [])), // for-in loops
            ...((codeText.match(/for\s*\(\s*(?:let|const|var)\s+\w+\s+of\s+[^)]+\)/g) || [])), // for-of loops
            ...((codeText.match(/\.forEach\s*\(/g) || [])) // forEach method
        ].length,

        // Data Structures
        dataStructures: [
            ...((codeText.match(/\[[^\]]*\]|new\s+Array\s*\(|Array\.from\s*\(/g) || [])), // Arrays
            ...((codeText.match(/\{[^}]*\}|new\s+Object\s*\(|Object\.(?:create|assign|keys|values|entries)/g) || [])), // Objects
            ...((codeText.match(/new\s+(?:Map|Set|WeakMap|WeakSet)\s*\(/g) || [])), // ES6 Collections
            ...((codeText.match(/new\s+(?:Date|RegExp|Promise|Error)\s*\(/g) || [])) // Built-in objects
        ].length,

        // Async Patterns
        asyncPatterns: [
            ...((codeText.match(/async\s+function|\basync\s*\(/g) || [])), // async functions
            ...((codeText.match(/await\s+/g) || [])), // await expressions
            ...((codeText.match(/new\s+Promise\s*\(|Promise\.(?:all|race|resolve|reject)/g) || [])), // Promises
            ...((codeText.match(/\.then\s*\(|\.catch\s*\(|\.finally\s*\(/g) || [])), // Promise chains
            ...((codeText.match(/fetch\s*\(|XMLHttpRequest|axios\./g) || [])) // HTTP requests
        ].length,

        // Design Patterns & Advanced Concepts
        designPatterns: [
            ...((codeText.match(/class\s+\w+(?:\s+extends\s+\w+)?/g) || [])), // Classes
            ...((codeText.match(/(?:function\s+\w+|const\s+\w+\s*=\s*(?:function|\([^)]*\)\s*=>))[^{]*\{[^}]*return\s*\{/g) || [])), // Factory pattern
            ...((codeText.match(/(?:function\s+\w+|const\s+\w+\s*=)[^{]*\{[^}]*(?:subscribe|notify|observer)/gi) || [])), // Observer pattern
            ...((codeText.match(/(?:export|module\.exports|import)/g) || [])), // Module pattern
            ...((codeText.match(/\w+\s*=\s*\w+\s*\|\|\s*\{|\w+\s*\|\|\s*\(\w+\s*=\s*\{\}/g) || [])) // Singleton pattern
        ].length,

        // Security Issues
        securityIssues: detectSecurityIssues(codeText),

        // Performance Anti-patterns
        performanceAntiPatterns: detectPerformanceAntiPatterns(codeText),

        // Code Duplication
        codeDuplication: detectCodeDuplication(codeText),

        // Cyclomatic Complexity
        cyclomaticComplexity: calculateCyclomaticComplexity(codeText),

        // Accessibility Patterns
        accessibilityPatterns: detectAccessibilityPatterns(codeText),

        // Testing Patterns
        testingPatterns: detectTestingPatterns(codeText),

        // Code Smells
        codeSmells: detectCodeSmells(codeText)
    };

    return patterns;
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
window.toggleDevInsights = function() {
    const sidebar = document.getElementById('dev-insights-sidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
};