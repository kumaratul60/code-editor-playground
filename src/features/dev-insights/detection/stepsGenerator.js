import {
    detectModulePatterns,
    detectVariablePatterns,
    detectFunctionPatterns,
    detectLoopPatterns,
    detectAsyncPatterns,
    detectDOMPatterns,
    detectErrorPatterns,
    analyzeSecurityIssues,
    analyzePerformanceIssues,
    analyzeCodeComplexity
} from "./patternDetectors.js";

export function getStepStatusColor(status) {
    const statusColors = {
        complete: 'var(--dev-panel-success)',
        warning: 'var(--dev-panel-warning)',
        error: 'var(--dev-panel-error)',
        running: 'var(--dev-panel-info)'
    };
    return statusColors[status] || statusColors.complete;
}

export function generateUnifiedExecutionSteps(codeText, realTimeMetrics, realExecutionTime) {
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

    const codeComplexity = analyzeCodeComplexity(codeText);
    const isLargeCodebase = codeComplexity.lines > 50 || codeComplexity.functions > 10;
    const isComplexCodebase = codeComplexity.lines > 100 || codeComplexity.functions > 20;

    const modulePatterns = detectModulePatterns(codeText);
    const variablePatterns = detectVariablePatterns(codeText);
    const functionPatterns = detectFunctionPatterns(codeText);
    const loopPatterns = detectLoopPatterns(codeText);
    const asyncPatterns = detectAsyncPatterns(codeText);
    const domPatterns = detectDOMPatterns(codeText);
    const errorPatterns = detectErrorPatterns(codeText);
    const securityPatterns = analyzeSecurityIssues(codeText);
    const performancePatterns = analyzePerformanceIssues(codeText);

    let activeSteps = 1;
    if (modulePatterns.total > 0 || isLargeCodebase) activeSteps++;
    if (variablePatterns.total > 0 || isLargeCodebase) activeSteps++;
    if (functionPatterns.total > 0) activeSteps++;
    if (loopPatterns.total > 0) activeSteps++;
    if (asyncPatterns.total > 0) activeSteps++;
    if (domPatterns.total > 0) activeSteps++;
    if (errorPatterns.total > 0 || isComplexCodebase) activeSteps++;
    if (securityPatterns.total > 0 || isComplexCodebase) activeSteps++;
    if (performancePatterns.total > 0 || isComplexCodebase) activeSteps++;
    if (realTimeMetrics.gcCollections > 0 || isLargeCodebase) activeSteps++;

    const parsingTime = Math.max(0.1, realExecutionTime * 0.08);
    const remainingTime = realExecutionTime - parsingTime;
    const stepTime = activeSteps > 1 ? remainingTime / (activeSteps - 1) : 0;

    const lineCount = (codeText.match(/\n/g) || []).length + 1;
    const memoryForParsing = (lineCount * 0.1).toFixed(2);
    steps.push({
        icon: '📝',
        name: 'Code Parsing & Lexical Analysis',
        time: `${parsingTime.toFixed(2)}ms`,
        status: 'complete',
        details: `${lineCount} lines parsed, ${codeComplexity.tokens} tokens analyzed`,
        metrics: `Memory allocated: ~${memoryForParsing}KB | Complexity: ${codeComplexity.cyclomatic}`
    });

    if (modulePatterns.total > 0 || isLargeCodebase) {
        const moduleMemory = (modulePatterns.total * 1.5).toFixed(2);
        steps.push({
            icon: '📦',
            name: 'Module Import & Dependency Resolution',
            time: `${stepTime.toFixed(2)}ms`,
            status: modulePatterns.total > 15 ? 'warning' : 'complete',
            details: `${modulePatterns.imports} imports, ${modulePatterns.exports} exports, ${modulePatterns.dynamic} dynamic imports`,
            metrics: `Module memory: ~${moduleMemory}KB | Dependencies: ${modulePatterns.total}`
        });
    }

    if (variablePatterns.total > 0 || isLargeCodebase) {
        const scopeMemory = (variablePatterns.total * 0.8).toFixed(2);
        const scopeStatus = variablePatterns.globals > 10 ? 'warning' : 'complete';
        steps.push({
            icon: '🔍',
            name: 'Variable Scope & Memory Allocation',
            time: `${stepTime.toFixed(2)}ms`,
            status: scopeStatus,
            details: `${variablePatterns.locals} local vars, ${variablePatterns.globals} globals, ${variablePatterns.constants} constants`,
            metrics: `Scope memory: ~${scopeMemory}KB | Closures: ${variablePatterns.closures}`
        });
    }

    if (functionPatterns.total > 0) {
        const functionMemory = (functionPatterns.total * 2.5).toFixed(2);
        steps.push({
            icon: '🔧',
            name: 'Function Analysis & Call Stack Setup',
            time: `${stepTime.toFixed(2)}ms`,
            status: functionPatterns.total > 15 ? 'warning' : 'complete',
            details: `${functionPatterns.total} functions (${functionPatterns.arrow || 0} arrow, ${functionPatterns.async || 0} async, ${functionPatterns.generator || 0} generators)`,
            metrics: `Function memory: ~${functionMemory}KB | Max depth: ${functionPatterns.maxNesting || 3}`
        });
    }

    if (loopPatterns.total > 0) {
        const loopStatus = loopPatterns.total > 8 ? 'warning' : 'complete';
        const loopMemory = (loopPatterns.total * 1.8).toFixed(2);
        steps.push({
            icon: '🔄',
            name: 'Loop Processing & Iteration Optimization',
            time: `${stepTime.toFixed(2)}ms`,
            status: loopStatus,
            details: `${loopPatterns.forLoops + loopPatterns.whileLoops + loopPatterns.doWhileLoops} traditional, ${loopPatterns.functional} functional`,
            metrics: `Loop memory: ~${loopMemory}KB | Est. iterations: ${loopPatterns.total * 100}`
        });
    }

    if (asyncPatterns.total > 0) {
        const asyncStatus = asyncPatterns.total > 5 ? 'warning' : 'complete';
        const networkMemory = (asyncPatterns.total * 5.2).toFixed(2);
        steps.push({
            icon: '⏳',
            name: 'Async Operations & Promise Resolution',
            time: `${stepTime.toFixed(2)}ms`,
            status: asyncStatus,
            details: `${asyncPatterns.fetch} fetch, ${asyncPatterns.promises} promises, ${asyncPatterns.legacy} legacy async`,
            metrics: `Network buffer: ~${networkMemory}KB | Concurrent: ${Math.min(asyncPatterns.total, 6)}`
        });
    }

    if (domPatterns.total > 0) {
        const domStatus = domPatterns.total > 12 ? 'warning' : 'complete';
        const domMemory = (domPatterns.total * 3.1).toFixed(2);
        steps.push({
            icon: '🌐',
            name: 'DOM Manipulation & Event Binding',
            time: `${stepTime.toFixed(2)}ms`,
            status: domStatus,
            details: `${domPatterns.queries} queries, ${domPatterns.modifications} modifications, ${domPatterns.events} listeners`,
            metrics: `DOM memory: ~${domMemory}KB | Active elements: ${domPatterns.total}`
        });
    }

    if (errorPatterns.total > 0 || isComplexCodebase) {
        const errorStatus = errorPatterns.unhandled > 0 ? 'warning' : 'complete';
        steps.push({
            icon: '🛡️',
            name: 'Error Handling & Exception Mapping',
            time: `${stepTime.toFixed(2)}ms`,
            status: errorStatus,
            details: `${errorPatterns.tryBlocks} try blocks, ${errorPatterns.catchBlocks} catch blocks, ${errorPatterns.throwStatements} throw statements`,
            metrics: `Coverage: ${errorPatterns.coverage}% | Unhandled: ${errorPatterns.unhandled}`
        });
    }

    if (securityPatterns.issues.total > 0 || isComplexCodebase) {
        const securityStatus = securityPatterns.issues.total > 3 ? 'warning' : 'complete';
        steps.push({
            icon: '🔐',
            name: 'Security Audit & Validation',
            time: `${stepTime.toFixed(2)}ms`,
            status: securityStatus,
            details: `${securityPatterns.issues.evalUsage} eval, ${securityPatterns.issues.innerHTMLUsage} innerHTML, ${securityPatterns.issues.insecureRequests} http`,
            metrics: `Security flags: ${securityPatterns.issues.total} | Recommendations: ${securityPatterns.suggestions.length}`
        });
    }

    if (performancePatterns.total > 0 || isComplexCodebase) {
        const perfStatus = performancePatterns.critical > 0 ? 'warning' : 'complete';
        steps.push({
            icon: '⚙️',
            name: 'Performance Profiling & Optimization',
            time: `${stepTime.toFixed(2)}ms`,
            status: perfStatus,
            details: `${performancePatterns.bottlenecks} potential bottlenecks, ${performancePatterns.optimizations} optimization opportunities`,
            metrics: `Performance score: ${performancePatterns.score} | Critical: ${performancePatterns.critical}`
        });
    }

    if (realTimeMetrics.gcCollections > 0 || isLargeCodebase) {
        steps.push({
            icon: '🧹',
            name: 'Memory Management & GC Activity',
            time: `${stepTime.toFixed(2)}ms`,
            status: 'complete',
            details: `${realTimeMetrics.gcCollections || 0} GC events, ${realTimeMetrics.allocations || 0} allocations tracked`,
            metrics: `Peak memory: ${(realTimeMetrics.peakMemory || 0).toFixed(2)}MB | Retained: ${(realTimeMetrics.retainedMemory || 0).toFixed(2)}MB`
        });
    }

    if (steps.length === 0) {
        steps.push({
            icon: 'ℹ️',
            name: 'Basic Execution',
            time: `${realExecutionTime.toFixed(2)}ms`,
            status: 'complete',
            details: 'Code executed successfully with no special operations detected',
            metrics: 'Memory: minimal | Async: none'
        });
    }

    return steps;
}

export function setupEventListeners(sidebar) {
    if (!sidebar) {
        console.warn('Sidebar element not found.');
        return;
    }

    const toggleBtn = sidebar.querySelector('#dev-insights-toggle-btn');
    const closeBtn = sidebar.querySelector('.dev-panel-close');

    if (!toggleBtn) {
        console.warn('Toggle button not found.');
    } else {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            sidebar.classList.remove('open');
        });
    }

    const handleEscapeKey = (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
    };

    document.removeEventListener('keydown', handleEscapeKey);
    document.addEventListener('keydown', handleEscapeKey);
}
