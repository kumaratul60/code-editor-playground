// Advanced analyzers for dev insights

/**
 * Performance Warnings Analyzer
 * Detects performance issues and provides recommendations
 */
export function analyzePerformanceWarnings(code, runtimeMetrics = {}) {
    const warnings = [];
    
    // High DOM operations
    const domOps = runtimeMetrics.domMutations || 0;
    if (domOps > 50) {
        warnings.push({
            type: 'dom',
            severity: domOps > 100 ? 'high' : 'medium',
            message: `High DOM Activity: ${domOps} operations detected`,
            suggestion: 'Batch updates using DocumentFragment or virtual DOM'
        });
    }
    
    // Multiple sequential network requests
    const networkCalls = runtimeMetrics.network?.total || 0;
    if (networkCalls > 5) {
        warnings.push({
            type: 'network',
            severity: networkCalls > 10 ? 'high' : 'medium',
            message: `Multiple Network Requests: ${networkCalls} sequential fetches`,
            suggestion: 'Use Promise.all() to parallelize independent requests'
        });
    }
    
    // String concatenation in loops
    if (/for\s*\([^)]*\)\s*{[^}]*\+=/i.test(code) || /while\s*\([^)]*\)\s*{[^}]*\+=/i.test(code)) {
        warnings.push({
            type: 'string-concat',
            severity: 'medium',
            message: 'String concatenation in loops detected',
            suggestion: 'Use array.join() or template literals for better performance'
        });
    }
    
    // Large loops
    const loopMatches = code.match(/for\s*\([^)]*<\s*(\d+)/g) || [];
    loopMatches.forEach(match => {
        const size = parseInt(match.match(/\d+/)[0]);
        if (size > 1000) {
            warnings.push({
                type: 'large-loop',
                severity: 'medium',
                message: `Large loop detected: ${size} iterations`,
                suggestion: 'Consider pagination, virtualization, or Web Workers'
            });
        }
    });
    
    return warnings;
}

/**
 * Security Scanner
 * Detects potential security vulnerabilities
 */
export function analyzeSecurity(code) {
    const issues = [];
    const passes = [];
    
    // Check for eval()
    if (/\beval\s*\(/.test(code)) {
        issues.push({
            severity: 'high',
            type: 'eval',
            message: 'eval() usage detected',
            risk: 'Code injection vulnerability'
        });
    } else {
        passes.push('No eval() usage');
    }
    
    // Check for innerHTML with variables
    if (/innerHTML\s*=\s*[^"']/.test(code)) {
        issues.push({
            severity: 'high',
            type: 'xss',
            message: 'innerHTML with dynamic content',
            risk: 'XSS vulnerability'
        });
    } else {
        passes.push('No unsafe innerHTML usage');
    }
    
    // Check for unvalidated fetch URLs
    const fetchMatches = code.match(/fetch\s*\(\s*[`'"]/g) || [];
    if (fetchMatches.length > 0) {
        issues.push({
            severity: 'medium',
            type: 'unvalidated-url',
            message: `${fetchMatches.length} unvalidated fetch URLs`,
            risk: 'Potential SSRF or data leakage'
        });
    }
    
    // Check for hardcoded credentials
    if (/password\s*=\s*["'][^"']+["']|api[_-]?key\s*=\s*["'][^"']+["']/i.test(code)) {
        issues.push({
            severity: 'critical',
            type: 'credentials',
            message: 'Hardcoded credentials detected',
            risk: 'Credential exposure'
        });
    } else {
        passes.push('No hardcoded credentials');
    }
    
    return { issues, passes };
}

/**
 * Variable Snapshot Tracker
 * Captures global variables and their changes
 */
export function captureVariableSnapshot() {
    const snapshot = {};
    const globalVars = Object.keys(window).filter(key => {
        try {
            return typeof window[key] !== 'function' && 
                   !key.startsWith('webkit') && 
                   !key.startsWith('chrome') &&
                   key.length < 50;
        } catch {
            return false;
        }
    });
    
    globalVars.slice(0, 20).forEach(key => {
        try {
            const value = window[key];
            snapshot[key] = {
                type: Array.isArray(value) ? 'Array' : typeof value,
                value: typeof value === 'object' ? JSON.stringify(value).slice(0, 50) : String(value).slice(0, 50)
            };
        } catch {
            snapshot[key] = { type: 'unknown', value: '[inaccessible]' };
        }
    });
    
    return snapshot;
}

/**
 * Hot Path Analyzer
 * Identifies time-consuming operations
 */
export function analyzeHotPaths(runtimeMetrics = {}, executionTime = 0) {
    const paths = [];
    
    // Network time
    const networkTime = (runtimeMetrics.network?.total || 0) * 50; // Estimate
    if (networkTime > 0) {
        paths.push({
            operation: 'Network Requests',
            time: networkTime,
            percentage: Math.round((networkTime / executionTime) * 100)
        });
    }
    
    // DOM operations time
    const domTime = (runtimeMetrics.domMutations || 0) * 2; // Estimate
    if (domTime > 0) {
        paths.push({
            operation: 'DOM Operations',
            time: domTime,
            percentage: Math.round((domTime / executionTime) * 100)
        });
    }
    
    // Async operations time
    const asyncTime = (runtimeMetrics.asyncOps?.timeout || 0) * 10; // Estimate
    if (asyncTime > 0) {
        paths.push({
            operation: 'Async Operations',
            time: asyncTime,
            percentage: Math.round((asyncTime / executionTime) * 100)
        });
    }
    
    // Computation time (remainder)
    const accountedTime = networkTime + domTime + asyncTime;
    const computeTime = Math.max(0, executionTime - accountedTime);
    if (computeTime > 0) {
        paths.push({
            operation: 'Computation',
            time: computeTime,
            percentage: Math.round((computeTime / executionTime) * 100)
        });
    }
    
    return paths.sort((a, b) => b.time - a.time);
}

/**
 * Memory Profiler
 * Tracks memory usage patterns
 */
export function analyzeMemoryProfile(runtimeMetrics = {}) {
    const memory = runtimeMetrics.memory || {};
    
    return {
        initial: memory.initial || 0,
        peak: memory.peak || 0,
        final: memory.final || 0,
        delta: memory.delta || 0,
        potentialLeak: memory.delta > 1000000 // > 1MB
    };
}

/**
 * API Call Summary
 * Aggregates network activity
 */
export function summarizeAPICalls(runtimeMetrics = {}) {
    const network = runtimeMetrics.network || {};
    
    return {
        total: network.total || 0,
        get: network.get || 0,
        post: network.post || 0,
        failed: network.failed || 0,
        avgTime: network.avgTime || 0,
        dataTransferred: network.dataTransferred || 0
    };
}

/**
 * Smart Suggestions Engine
 * Provides context-aware optimization tips
 */
export function generateSmartSuggestions(code, analysis = {}) {
    const suggestions = [];
    
    // Memoization opportunity
    const functionCalls = code.match(/(\w+)\s*\([^)]*\)/g) || [];
    const callCounts = {};
    functionCalls.forEach(call => {
        const name = call.split('(')[0].trim();
        callCounts[name] = (callCounts[name] || 0) + 1;
    });
    
    Object.entries(callCounts).forEach(([name, count]) => {
        if (count > 3) {
            suggestions.push(`Consider memoizing ${name}() - called ${count} times`);
        }
    });
    
    // Const vs let
    const letVars = code.match(/let\s+(\w+)\s*=/g) || [];
    letVars.forEach(match => {
        const varName = match.match(/let\s+(\w+)/)[1];
        const reassignRegex = new RegExp(`${varName}\\s*=(?!=)`, 'g');
        const reassignments = (code.match(reassignRegex) || []).length;
        if (reassignments === 1) {
            suggestions.push(`Use const for ${varName} - never reassigned`);
        }
    });
    
    // Error handling
    if (/async\s+function|await\s+/.test(code) && !/try\s*{/.test(code)) {
        suggestions.push('Add try/catch around async operations');
    }
    
    return suggestions.slice(0, 5);
}

/**
 * Dependency Graph Builder
 * Maps function call relationships
 */
export function buildDependencyGraph(code) {
    const functions = [];
    const functionRegex = /function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g;
    let match;
    
    while ((match = functionRegex.exec(code)) !== null) {
        const name = match[1] || match[2];
        functions.push(name);
    }
    
    const graph = {};
    functions.forEach(fn => {
        const fnRegex = new RegExp(`function\\s+${fn}[^{]*{([^}]*)}`, 's');
        const fnMatch = code.match(fnRegex);
        if (fnMatch) {
            const body = fnMatch[1];
            const calls = functions.filter(other => 
                other !== fn && new RegExp(`\\b${other}\\s*\\(`).test(body)
            );
            graph[fn] = calls;
        }
    });
    
    return graph;
}

/**
 * Performance Budget Checker
 * Validates against performance limits
 */
export function checkPerformanceBudget(executionTime, runtimeMetrics = {}) {
    const budgets = {
        executionTime: { limit: 500, current: executionTime, unit: 'ms' },
        domOps: { limit: 100, current: runtimeMetrics.domMutations || 0, unit: 'ops' },
        networkCalls: { limit: 10, current: runtimeMetrics.network?.total || 0, unit: 'calls' },
        memory: { limit: 5 * 1024 * 1024, current: Math.abs(runtimeMetrics.memory?.delta || 0), unit: 'MB' }
    };
    
    Object.keys(budgets).forEach(key => {
        const budget = budgets[key];
        budget.status = budget.current <= budget.limit ? 'pass' : 'fail';
        budget.percentage = Math.round((budget.current / budget.limit) * 100);
    });
    
    return budgets;
}
