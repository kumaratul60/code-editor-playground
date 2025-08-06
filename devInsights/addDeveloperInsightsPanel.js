import { analyzeExecutionHotspots } from "./analyzeExecutionHotspots.js";
import { createCodeStructureVisualization } from "./createCodeStructureVisualization.js";
import { createExecutionTimeVisualization } from "./createExecutionTimeVisualization.js";
import { generateOptimizationTips } from "./generateOptimizationTips.js";
import { analyzeFunctionRelationships } from "./analyzeFunctionRelationships.js";
import { estimateBigOComplexity } from "./estimateBigOComplexity.js";
import { calculateCodeEfficiency } from "./calculateCodeEfficiency.js";

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

function detectFunctionPatterns(codeText) {
    return {
        regular: (codeText.match(/function\s+\w+/g) || []).length,
        arrow: (codeText.match(/=>\s*[{(]?/g) || []).length,
        async: (codeText.match(/async\s+(?:function|\()/g) || []).length,
        closures: (codeText.match(/function[^}]*(?:function|=>)|=>[^}]*(?:function|=>)|\(\s*\)\s*=>\s*\([^)]*\)\s*=>/g) || []).length,
        total: (codeText.match(/function\s+\w+|=>\s*[{(]?|async\s+(?:function|\()/g) || []).length
    };
}

function detectLoopPatterns(codeText) {
    const traditional = (codeText.match(/for\s*\(|while\s*\(|do\s*\{/g) || []).length;
    const functional = (codeText.match(/\.(?:map|filter|reduce|forEach|find|some|every)\s*\(/g) || []).length;
    return {
        traditional,
        functional,
        total: traditional + functional
    };
}

function detectAsyncPatterns(codeText) {
    const fetch = (codeText.match(/fetch\s*\(/g) || []).length;
    const axios = (codeText.match(/axios\.(?:get|post|put|delete|patch)|axios\s*\(/g) || []).length;
    const promises = (codeText.match(/new\s+Promise\s*\(|Promise\.(?:all|race|resolve|reject)/g) || []).length;
    const legacy = (codeText.match(/XMLHttpRequest|jQuery\.ajax|\$\.ajax|setTimeout|setInterval/g) || []).length;

    return {
        fetch,
        axios,
        promises,
        legacy,
        total: fetch + axios + promises + legacy
    };
}

function detectDOMPatterns(codeText) {
    const queries = (codeText.match(/document\.(?:getElementById|querySelector|getElementsBy)|document\.\w+/g) || []).length;
    const events = (codeText.match(/addEventListener|on\w+\s*=|\.on\(/g) || []).length;
    const modifications = (codeText.match(/innerHTML|textContent|appendChild|removeChild|createElement/g) || []).length;

    return {
        queries,
        events,
        modifications,
        total: queries + events + modifications
    };
}

function detectOutputPatterns(codeText) {
    const console = (codeText.match(/console\.(?:log|error|warn|info|debug|table)/g) || []).length;
    const returns = (codeText.match(/return\s+/g) || []).length;

    return {
        console,
        returns,
        total: console + returns
    };
}

function detectErrorPatterns(codeText) {
    const tryCatch = (codeText.match(/try\s*\{[\s\S]*?catch/g) || []).length;
    const cleanup = (codeText.match(/finally\s*\{|removeEventListener|clearInterval|clearTimeout|\.close\(\)|\.disconnect\(\)/g) || []).length;

    return {
        tryCatch,
        cleanup,
        hasCleanup: cleanup > 0,
        total: tryCatch + cleanup
    };
}

function getStepStatusColor(status) {
    switch (status) {
        case 'complete': return 'var(--dev-panel-success)';
        case 'warning': return 'var(--dev-panel-warning)';
        case 'error': return 'var(--dev-panel-error)';
        default: return 'var(--dev-panel-secondary)';
    }
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

function getComplexityClass(complexity) {
    if (complexity.includes('O(1)') || complexity.includes('O(log')) return 'progress-excellent';
    if (complexity.includes('O(n)')) return 'progress-good';
    if (complexity.includes('O(n²)')) return 'progress-fair';
    return 'progress-poor';
}

function getComplexityPercentage(complexity) {
    if (complexity.includes('O(1)')) return 95;
    if (complexity.includes('O(log')) return 85;
    if (complexity.includes('O(n)')) return 70;
    if (complexity.includes('O(n²)')) return 40;
    return 20;
}

function getPerformanceClass(score) {
    if (score >= 90) return 'progress-excellent';
    if (score >= 75) return 'progress-good';
    if (score >= 60) return 'progress-fair';
    return 'progress-poor';
}

function getQualityClass(score) {
    if (score >= 90) return 'progress-excellent';
    if (score >= 75) return 'progress-good';
    if (score >= 60) return 'progress-fair';
    return 'progress-poor';
}

function setupEventListeners(sidebar) {
    const toggleBtn = sidebar.querySelector('#dev-insights-toggle-btn');
    const closeBtn = sidebar.querySelector('.dev-panel-close');

    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            sidebar.classList.remove('open');
        });
    }

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
    });
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
           
            
        </div>
    `;
}

/*
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
 */

/////-----


// function createCodeAnalysisGrid() {
//     const patterns = analyzeCodePatterns();
//
//     // Calculate total issues for each category
//     const securityTotal = patterns.securityIssues;
//     const performanceTotal = patterns.performanceAntiPatterns;
//     const qualityTotal = patterns.codeDuplication + patterns.codeSmells;
//     const complexityTotal = patterns.cyclomaticComplexity;
//     const modernTotal = patterns.accessibilityPatterns + patterns.testingPatterns;
//
//     // Only show sections that have values > 0
//     const sections = [];
//
//     // Core Patterns (always show if any exist)
//     const coreItems = [
//         { label: "Console Statements", value: patterns.consoleCount, icon: "🖥️" },
//         { label: "Functions", value: patterns.higherOrderFunctions, icon: "⚡" },
//         { label: "Loops", value: patterns.loopTypes, icon: "🔄" },
//         { label: "Async Operations", value: patterns.asyncPatterns, icon: "⏱️" },
//         { label: "Data Structures", value: patterns.dataStructures, icon: "📦" },
//         { label: "Design Patterns", value: patterns.designPatterns, icon: "🏗️" }
//     ].filter(item => item.value > 0);
//
//     if (coreItems.length > 0) {
//         sections.push({
//             title: "📊 Core Patterns",
//             color: "var(--dev-panel-accent)",
//             items: coreItems
//         });
//     }
//
//     // Security Analysis
//     if (securityTotal > 0) {
//         sections.push({
//             title: "🛡️ Security Analysis",
//             color: securityTotal > 3 ? "var(--dev-panel-error)" : securityTotal > 1 ? "var(--dev-panel-warning)" : "var(--dev-panel-success)",
//             items: [
//                 { label: "Security Issues", value: patterns.securityIssues, icon: "⚠️", critical: patterns.securityIssues > 2 }
//             ]
//         });
//     }
//
//     // Performance Analysis
//     const performanceItems = [
//         { label: "Anti-patterns", value: patterns.performanceAntiPatterns, icon: "🐌", critical: patterns.performanceAntiPatterns > 3 },
//         { label: "Memory Leaks", value: patterns.memoryLeaks, icon: "💧", critical: patterns.memoryLeaks > 1 }
//     ].filter(item => item.value > 0);
//
//     if (performanceItems.length > 0) {
//         sections.push({
//             title: "⚡ Performance Analysis",
//             color: performanceTotal > 5 ? "var(--dev-panel-error)" : performanceTotal > 2 ? "var(--dev-panel-warning)" : "var(--dev-panel-success)",
//             items: performanceItems
//         });
//     }
//
//     // Code Quality
//     const qualityItems = [
//         { label: "Cyclomatic Complexity", value: patterns.cyclomaticComplexity, icon: "🔀", critical: patterns.cyclomaticComplexity > 15 },
//         { label: "Code Duplication", value: patterns.codeDuplication, icon: "📋", critical: patterns.codeDuplication > 3 },
//         { label: "Code Smells", value: patterns.codeSmells, icon: "👃", critical: patterns.codeSmells > 5 },
//         { label: "Error Handling", value: patterns.errorHandling, icon: "🛠️" }
//     ].filter(item => item.value > 0);
//
//     if (qualityItems.length > 0 || complexityTotal > 10) {
//         sections.push({
//             title: "📈 Code Quality",
//             color: complexityTotal > 20 ? "var(--dev-panel-error)" : complexityTotal > 10 ? "var(--dev-panel-warning)" : "var(--dev-panel-success)",
//             items: qualityItems
//         });
//     }
//
//     // Modern Development Practices
//     const modernItems = [
//         { label: "Accessibility Patterns", value: patterns.accessibilityPatterns, icon: "♿" },
//         { label: "Testing Patterns", value: patterns.testingPatterns, icon: "🧪" },
//         { label: "Functional Methods", value: patterns.functionalMethods, icon: "🔧" },
//         { label: "Closures", value: patterns.closures, icon: "🎯" }
//     ].filter(item => item.value > 0);
//
//     if (modernItems.length > 0) {
//         sections.push({
//             title: "🚀 Modern Practices",
//             color: "var(--dev-panel-success)",
//             items: modernItems
//         });
//     }
//
//     // Advanced Patterns (if any exist)
//     const advancedItems = [
//         { label: "Global Variables", value: patterns.globalVars, icon: "🌐", critical: patterns.globalVars > 2 },
//         { label: "Throw Statements", value: patterns.throwStatements, icon: "💥" }
//     ].filter(item => item.value > 0);
//
//     if (advancedItems.length > 0) {
//         sections.push({
//             title: "🔬 Advanced Analysis",
//             color: "var(--dev-panel-secondary)",
//             items: advancedItems
//         });
//     }
//
//     // If no sections, show empty state
//     if (sections.length === 0) {
//         return `
//             <div style="margin: 16px 0; text-align: center; color: var(--dev-panel-secondary); font-size: 12px;">
//                 <div style="margin-bottom: 8px;">🔍</div>
//                 <div>No code patterns detected</div>
//                 <div style="font-size: 11px; opacity: 0.7;">Write some code to see analysis</div>
//             </div>
//         `;
//     }
//
//     // Generate HTML for sections
//     const sectionsHTML = sections.map(section => `
//         <div class="analysis-section" style="margin-bottom: 16px;">
//             <div style="font-weight: bold; color: ${section.color}; margin-bottom: 8px; font-size: 13px; display: flex; align-items: center; gap: 6px;">
//                 ${section.title}
//                 ${section.items.some(item => item.critical) ? '<span style="color: var(--dev-panel-error); font-size: 12px;">⚠️</span>' : ''}
//             </div>
//             <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px;">
//                 ${section.items.map(item => `
//                     <div style="
//                         display: flex;
//                         align-items: center;
//                         justify-content: space-between;
//                         padding: 6px 8px;
//                         background: ${item.critical ? 'rgba(255, 107, 107, 0.1)' : 'var(--dev-panel-metric-bg)'};
//                         border-radius: 4px;
//                         border-left: 3px solid ${item.critical ? 'var(--dev-panel-error)' : section.color};
//                         font-size: 11px;
//                     ">
//                         <span style="display: flex; align-items: center; gap: 4px; opacity: 0.9;">
//                             <span>${item.icon}</span>
//                             <span>${item.label}</span>
//                         </span>
//                         <span style="
//                             font-weight: bold;
//                             color: ${item.critical ? 'var(--dev-panel-error)' : section.color};
//                             font-size: 12px;
//                         ">${item.value}</span>
//                     </div>
//                 `).join('')}
//             </div>
//         </div>
//     `).join('');
//
//     // Summary insights
//     const totalIssues = securityTotal + performanceTotal + patterns.memoryLeaks + patterns.codeSmells;
//     const qualityScore = Math.max(0, 100 - (totalIssues * 5) - Math.max(0, (complexityTotal - 10) * 2));
//
//     const summaryColor = qualityScore >= 80 ? 'var(--dev-panel-success)' :
//         qualityScore >= 60 ? 'var(--dev-panel-warning)' : 'var(--dev-panel-error)';
//
//     return `
//         <div style="margin: 16px 0;">
//             <div style="font-weight: bold; color: var(--dev-panel-accent); margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
//                 <span style="display: flex; align-items: center; gap: 8px;">🔍 Advanced Code Analysis</span>
//                 <span style="font-size: 12px; color: ${summaryColor}; background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 12px;">
//                     Quality: ${qualityScore}/100
//                 </span>
//             </div>
//
//             ${sectionsHTML}
//
//             ${totalIssues > 0 ? `
//                 <div style="
//                     margin-top: 12px;
//                     padding: 8px 10px;
//                     background: rgba(255, 193, 7, 0.1);
//                     border-left: 3px solid var(--dev-panel-warning);
//                     border-radius: 4px;
//                     font-size: 11px;
//                     color: var(--dev-panel-warning);
//                 ">
//                     💡 <strong>Recommendations:</strong>
//                     ${securityTotal > 0 ? 'Review security patterns. ' : ''}
//                     ${performanceTotal > 0 ? 'Optimize performance bottlenecks. ' : ''}
//                     ${patterns.codeDuplication > 2 ? 'Refactor duplicated code. ' : ''}
//                     ${complexityTotal > 15 ? 'Simplify complex functions. ' : ''}
//                 </div>
//             ` : `
//                 <div style="
//                     margin-top: 12px;
//                     padding: 8px 10px;
//                     background: rgba(76, 175, 80, 0.1);
//                     border-left: 3px solid var(--dev-panel-success);
//                     border-radius: 4px;
//                     font-size: 11px;
//                     color: var(--dev-panel-success);
//                 ">
//                     ✅ <strong>Excellent!</strong> Your code follows good practices with minimal issues detected.
//                 </div>
//             `}
//         </div>
//     `;
// }

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

// Memory leak detection
function detectMemoryLeaks(codeText) {
    let leaks = 0;

    // Timer leaks (more accurate)
    const timerMatches = codeText.match(/(?:setInterval|setTimeout)\s*\(/g) || [];
    const clearMatches = codeText.match(/(?:clearInterval|clearTimeout)\s*\(/g) || [];
    leaks += Math.max(0, timerMatches.length - clearMatches.length);

    // Event listener leaks
    const addListenerMatches = codeText.match(/addEventListener\s*\(/g) || [];
    const removeListenerMatches = codeText.match(/removeEventListener\s*\(/g) || [];
    leaks += Math.max(0, addListenerMatches.length - removeListenerMatches.length);

    // Unclosed resources
    leaks += (codeText.match(/new\s+(?:WebSocket|EventSource|Worker)\s*\([^)]*\)(?![\s\S]*\.close\(\))/g) || []).length;

    // Global variable leaks
    leaks += (codeText.match(/window\.\w+\s*=(?!\s*function)/g) || []).length;

    return leaks;
}

// Security vulnerability detection
function detectSecurityIssues(codeText) {
    const securityPatterns = [
        { pattern: /eval\s*\(/g, name: "eval() usage" },
        { pattern: /innerHTML\s*=\s*[^;]+(?!\s*(?:textContent|innerText))/g, name: "XSS via innerHTML" },
        { pattern: /document\.write\s*\(/g, name: "document.write usage" },
        { pattern: /Function\s*\(/g, name: "Function constructor" },
        { pattern: /(?:password|secret|key|token|api_key)\s*[:=]\s*['"`][^'"`]*['"`]/gi, name: "Hardcoded secrets" },
        { pattern: /(?:http:\/\/|ftp:\/\/)/g, name: "Insecure protocols" },
        { pattern: /localStorage\.setItem\s*\([^)]*(?:password|secret|token)/gi, name: "Sensitive data in localStorage" },
        { pattern: /Math\.random\s*\(\)\s*\*\s*\d+(?=.*(?:password|token|key|security))/gi, name: "Weak random for security" },
        { pattern: /(?:onclick|onload|onerror)\s*=\s*['"`]/g, name: "Inline event handlers" },
        { pattern: /(?:src|href)\s*=\s*['"`]javascript:/g, name: "JavaScript URLs" }
    ];

    return securityPatterns.reduce((count, { pattern }) => {
        return count + (codeText.match(pattern) || []).length;
    }, 0);
}

// Performance anti-pattern detection
function detectPerformanceAntiPatterns(codeText) {
    const antiPatterns = [
        { pattern: /document\.getElementById\s*\([^)]*\)\s*\.style\./g, name: "Direct style manipulation" },
        { pattern: /for\s*\([^)]*\)\s*\{[^}]*document\.(?:getElementById|querySelector)/g, name: "DOM queries in for loops" },
        { pattern: /while\s*\([^)]*\)\s*\{[^}]*document\.(?:getElementById|querySelector)/g, name: "DOM queries in while loops" },
        { pattern: /\.innerHTML\s*\+=\s*/g, name: "innerHTML concatenation" },
        { pattern: /new\s+RegExp\s*\(/g, name: "RegExp constructor in loops" },
        { pattern: /JSON\.parse\s*\(\s*JSON\.stringify/g, name: "Deep clone anti-pattern" },
        { pattern: /(?:setInterval|setTimeout)\s*\([^)]*,\s*0\s*\)/g, name: "Zero timeout" },
        { pattern: /\.forEach\s*\([^)]*document\.(?:getElementById|querySelector)/g, name: "DOM queries in forEach" },
        { pattern: /(?:appendChild|insertBefore|removeChild)\s*\([^)]*\)(?=[\s\S]*(?:appendChild|insertBefore|removeChild))/g, name: "Multiple DOM manipulations" },
        { pattern: /(?:offsetWidth|offsetHeight|clientWidth|clientHeight|scrollWidth|scrollHeight)\s*[;,\)](?=[\s\S]*(?:offsetWidth|offsetHeight|clientWidth|clientHeight|scrollWidth|scrollHeight))/g, name: "Layout thrashing" }
    ];

    return antiPatterns.reduce((count, { pattern }) => {
        return count + (codeText.match(pattern) || []).length;
    }, 0);
}

// Code duplication detection
function detectCodeDuplication(codeText) {
    const lines = codeText.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 15 && !line.startsWith('//') && !line.startsWith('/*'));

    const lineMap = new Map();
    let duplicates = 0;

    lines.forEach(line => {
        const count = lineMap.get(line) || 0;
        lineMap.set(line, count + 1);
        if (count === 1) duplicates++; // First duplicate
    });

    // Also check for repeated function patterns
    const functionPatterns = codeText.match(/function\s+\w+\s*\([^)]*\)\s*\{[\s\S]*?\}/g) || [];
    const functionBodies = functionPatterns.map(fn => fn.replace(/function\s+\w+/, 'function'));
    const functionMap = new Map();

    functionBodies.forEach(body => {
        if (body.length > 50) { // Only check substantial functions
            const count = functionMap.get(body) || 0;
            functionMap.set(body, count + 1);
            if (count === 1) duplicates += 2; // Weight function duplication higher
        }
    });

    return duplicates;
}

// Cyclomatic complexity calculation
function calculateCyclomaticComplexity(codeText) {
    const complexityPatterns = [
        { pattern: /if\s*\(/g, weight: 1 },
        { pattern: /else\s+if\s*\(/g, weight: 1 },
        { pattern: /while\s*\(/g, weight: 1 },
        { pattern: /for\s*\(/g, weight: 1 },
        { pattern: /switch\s*\(/g, weight: 1 },
        { pattern: /case\s+/g, weight: 1 },
        { pattern: /catch\s*\(/g, weight: 1 },
        { pattern: /\?\s*[^:]*:/g, weight: 1 }, // Ternary operators
        { pattern: /&&|\|\|/g, weight: 1 }, // Logical operators
        { pattern: /function\s+\w+|=>\s*\{|=>\s*[^{]/g, weight: 1 } // Functions add complexity
    ];

    return complexityPatterns.reduce((complexity, { pattern, weight }) => {
        return complexity + ((codeText.match(pattern) || []).length * weight);
    }, 1); // Base complexity is 1
}

// Accessibility pattern detection
function detectAccessibilityPatterns(codeText) {
    const a11yPatterns = [
        { pattern: /aria-\w+\s*=/g, name: "ARIA attributes" },
        { pattern: /role\s*=\s*['"`]/g, name: "Role attributes" },
        { pattern: /alt\s*=\s*['"`]/g, name: "Alt text" },
        { pattern: /tabindex\s*=/g, name: "Tab index" },
        { pattern: /(?:focus|blur)\s*\(/g, name: "Focus management" },
        { pattern: /(?:keydown|keyup|keypress)/g, name: "Keyboard events" },
        { pattern: /(?:screen|reader)/gi, name: "Screen reader considerations" },
        { pattern: /(?:label|for)\s*=\s*['"`]/g, name: "Form labels" },
        { pattern: /(?:title|description)\s*=\s*['"`]/g, name: "Descriptive text" }
    ];

    return a11yPatterns.reduce((count, { pattern }) => {
        return count + (codeText.match(pattern) || []).length;
    }, 0);
}

// Testing pattern detection
function detectTestingPatterns(codeText) {
    const testPatterns = [
        { pattern: /(?:describe|it|test|expect|assert)\s*\(/g, name: "Test functions" },
        { pattern: /(?:beforeEach|afterEach|beforeAll|afterAll)\s*\(/g, name: "Test hooks" },
        { pattern: /\.(?:toBe|toEqual|toMatch|toContain|toThrow|toHaveBeenCalled)\s*\(/g, name: "Test matchers" },
        { pattern: /(?:mock|spy|stub)/gi, name: "Mocking patterns" },
        { pattern: /(?:jest|mocha|jasmine|chai)/gi, name: "Testing frameworks" },
        { pattern: /\.(?:mockImplementation|mockReturnValue|mockResolvedValue)\s*\(/g, name: "Mock implementations" }
    ];

    return testPatterns.reduce((count, { pattern }) => {
        return count + (codeText.match(pattern) || []).length;
    }, 0);
}

// Code smell detection
function detectCodeSmells(codeText) {
    const smellPatterns = [
        { pattern: /function\s+\w+\s*\([^)]{50,}\)/g, name: "Long parameter lists" },
        { pattern: /function[^{]{0,100}\{(?:[^{}]*\{[^{}]*\})*[^{}]{300,}\}/g, name: "Long functions" },
        { pattern: /(?:var|let|const)\s+\w+\s*,\s*\w+\s*,\s*\w+/g, name: "Multiple variable declarations" },
        { pattern: /if\s*\([^)]*\)\s*\{\s*if\s*\([^)]*\)\s*\{/g, name: "Nested if statements" },
        { pattern: /(?:TODO|FIXME|HACK|XXX|BUG)/gi, name: "Code comments indicating issues" },
        { pattern: /console\.log\s*\(/g, name: "Debug statements left in code" },
        { pattern: /(?:42|123|999|1000|100)\b(?!\s*[+\-*\/])/g, name: "Magic numbers" },
        { pattern: /(?:temp|test|foo|bar|baz)\w*/gi, name: "Poor naming" },
        { pattern: /(?:var\s+|let\s+|const\s+)\w+\s*=\s*(?:var\s+|let\s+|const\s+)/g, name: "Variable shadowing" },
        { pattern: /catch\s*\([^)]*\)\s*\{\s*\}/g, name: "Empty catch blocks" }
    ];

    return smellPatterns.reduce((count, { pattern }) => {
        return count + (codeText.match(pattern) || []).length;
    }, 0);
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
<!--                <div class="metric-value">${memoryMB}MB | ${realExecutionTime.toFixed(2)}ms</div>-->
            </div>
            
            <!-- Memory Overview -->
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
        </div>
    `;
}

function generateUnifiedExecutionSteps(codeText, realTimeMetrics, realExecutionTime) {
    const steps = [];

    if (!codeText || codeText.trim().length === 0) {
        return [{
            icon: '⚠️',
            name: 'No Code Detected',
            time: '0ms',
            status: 'warning',
            details: 'Write some code to see real-time execution analysis',
            metrics: 'Memory: 0MB | Operations: 0'
        }];
    }

    // Calculate dynamic timing distribution
    const baseParsingTime = Math.max(0.1, realExecutionTime * 0.05);
    const functionTime = Math.max(0.1, realExecutionTime * 0.15);
    const loopTime = Math.max(0.1, realExecutionTime * 0.25);
    const asyncTime = Math.max(0.1, realExecutionTime * 0.35);
    const domTime = Math.max(0.1, realExecutionTime * 0.10);
    const outputTime = Math.max(0.1, realExecutionTime * 0.10);

    // Step 1: Code Parsing & Memory Initialization
    const lineCount = (codeText.match(/\n/g) || []).length + 1;
    const memoryForParsing = (lineCount * 0.1).toFixed(2);
    steps.push({
        icon: '📝',
        name: 'Code Parsing & Memory Initialization',
        time: `${baseParsingTime.toFixed(2)}ms`,
        status: 'complete',
        details: `${lineCount} lines parsed, variables declared`,
        metrics: `Memory allocated: ~${memoryForParsing}KB | GC: ${realTimeMetrics.gcCollections}`
    });

    // Step 2: Function Analysis & Memory Allocation
    const functionPatterns = detectFunctionPatterns(codeText);
    if (functionPatterns.total > 0) {
        const functionMemory = (functionPatterns.total * 2.5).toFixed(2);
        steps.push({
            icon: '🔧',
            name: 'Function Analysis & Memory Allocation',
            time: `${functionTime.toFixed(2)}ms`,
            status: functionPatterns.total > 10 ? 'warning' : 'complete',
            details: `${functionPatterns.total} functions analyzed (${functionPatterns.arrow} arrow, ${functionPatterns.regular} regular, ${functionPatterns.async} async)`,
            metrics: `Function memory: ~${functionMemory}KB | Closures detected: ${functionPatterns.closures || 0}`
        });
    }

    // Step 3: Loop Processing & Iteration Memory
    const loopPatterns = detectLoopPatterns(codeText);
    if (loopPatterns.total > 0) {
        const loopStatus = loopPatterns.total > 5 ? 'warning' : 'complete';
        const loopMemory = (loopPatterns.total * 1.8).toFixed(2);
        steps.push({
            icon: '🔄',
            name: 'Loop Processing & Iteration Memory',
            time: `${loopTime.toFixed(2)}ms`,
            status: loopStatus,
            details: `${loopPatterns.traditional} traditional loops, ${loopPatterns.functional} functional methods processed`,
            metrics: `Loop memory: ~${loopMemory}KB | Peak iterations: ${loopPatterns.total * 100}`
        });
    }

    // Step 4: Async Operations & Network Memory
    const asyncPatterns = detectAsyncPatterns(codeText);
    if (asyncPatterns.total > 0) {
        const asyncStatus = asyncPatterns.total > 3 ? 'warning' : 'complete';
        const networkMemory = (asyncPatterns.total * 5.2).toFixed(2);
        steps.push({
            icon: '⏳',
            name: 'Async Operations & Network Memory',
            time: `${asyncTime.toFixed(2)}ms`,
            status: asyncStatus,
            details: `${asyncPatterns.fetch} fetch, ${asyncPatterns.axios} axios, ${asyncPatterns.promises} promises, ${asyncPatterns.legacy} legacy async`,
            metrics: `Network buffer: ~${networkMemory}KB | Active requests: ${realTimeMetrics.networkRequests}`
        });
    }

    // Step 5: DOM Manipulation & Event Memory
    const domPatterns = detectDOMPatterns(codeText);
    if (domPatterns.total > 0) {
        const domStatus = domPatterns.total > 10 ? 'warning' : 'complete';
        const domMemory = (domPatterns.total * 3.1).toFixed(2);
        steps.push({
            icon: '🌐',
            name: 'DOM Manipulation & Event Memory',
            time: `${domTime.toFixed(2)}ms`,
            status: domStatus,
            details: `${domPatterns.queries} DOM queries, ${domPatterns.events} event listeners, ${domPatterns.modifications} modifications`,
            metrics: `DOM memory: ~${domMemory}KB | Active listeners: ${domPatterns.events}`
        });
    }

    // Step 6: Output Generation & Console Memory
    const outputPatterns = detectOutputPatterns(codeText);
    if (outputPatterns.total > 0) {
        const consoleMemory = (outputPatterns.total * 0.8).toFixed(2);
        steps.push({
            icon: '📤',
            name: 'Output Generation & Console Memory',
            time: `${outputTime.toFixed(2)}ms`,
            status: 'complete',
            details: `${outputPatterns.console} console operations, ${outputPatterns.returns} return statements`,
            metrics: `Console buffer: ~${consoleMemory}KB | Output size: ${outputPatterns.total * 50}B`
        });
    }

    // Step 7: Error Handling & Memory Cleanup
    const errorPatterns = detectErrorPatterns(codeText);
    if (errorPatterns.total > 0) {
        const cleanupMemory = (errorPatterns.cleanup * 1.2).toFixed(2);
        steps.push({
            icon: '🛡️',
            name: 'Error Handling & Memory Cleanup',
            time: `${(realExecutionTime * 0.05).toFixed(2)}ms`,
            status: errorPatterns.hasCleanup ? 'complete' : 'warning',
            details: `${errorPatterns.tryCatch} try/catch blocks, ${errorPatterns.cleanup} cleanup operations`,
            metrics: `Cleanup freed: ~${cleanupMemory}KB | Error count: ${realTimeMetrics.errorCount}`
        });
    }

    // Step 8: Garbage Collection & Final Memory State
    if (realTimeMetrics.gcCollections > 0) {
        const finalMemory = (realTimeMetrics.peakMemory / (1024 * 1024)).toFixed(2);
        steps.push({
            icon: '🗑️',
            name: 'Garbage Collection & Final Memory State',
            time: `${(realExecutionTime * 0.03).toFixed(2)}ms`,
            status: parseFloat(finalMemory) > 50 ? 'warning' : 'complete',
            details: `${realTimeMetrics.gcCollections} GC cycles completed, memory optimized`,
            metrics: `Final memory: ${finalMemory}MB | Memory freed: ~${(realTimeMetrics.gcCollections * 2.5).toFixed(2)}KB`
        });
    }

    return steps.length > 1 ? steps : [{
        icon: '✅',
        name: 'Simple Code Execution',
        time: `${realExecutionTime.toFixed(2)}ms`,
        status: 'complete',
        details: 'Basic code execution completed successfully',
        metrics: `Memory: ${(realTimeMetrics.peakMemory / (1024 * 1024)).toFixed(2)}MB | Operations: ${realTimeMetrics.domManipulations + realTimeMetrics.networkRequests}`
    }];
}

// Global function for closing panel
window.toggleDevInsights = function() {
    const sidebar = document.getElementById('dev-insights-sidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
};