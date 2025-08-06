
// Function detection
function detectFunctionPatterns(codeText) {
    return {
        regular: (codeText.match(/function\s+\w+/g) || []).length,
        arrow: (codeText.match(/=>\s*[{(]?/g) || []).length,
        async: (codeText.match(/async\s+(?:function|\()/g) || []).length,
        closures: (codeText.match(/function[^}]*(?:function|=>)|=>[^}]*(?:function|=>)|\(\s*\)\s*=>\s*\([^)]*\)\s*=>/g) || []).length,
        total: (codeText.match(/function\s+\w+|=>\s*[{(]?|async\s+(?:function|\()/g) || []).length
    };
}

// Loop detection
function detectLoopPatterns(codeText) {
    const traditional = (codeText.match(/for\s*\(|while\s*\(|do\s*\{/g) || []).length;
    const functional = (codeText.match(/\.(?:map|filter|reduce|forEach|find|some|every)\s*\(/g) || []).length;
    return {
        traditional,
        functional,
        total: traditional + functional
    };
}

// Async detection
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

// DOM detection
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

// Output detection
function detectOutputPatterns(codeText) {
    const console = (codeText.match(/console\.(?:log|error|warn|info|debug|table)/g) || []).length;
    const returns = (codeText.match(/return\s+/g) || []).length;

    return {
        console,
        returns,
        total: console + returns
    };
}

// Error detection
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

// Color detection
function getStepStatusColor(status) {
    switch (status) {
        case 'complete': return 'var(--dev-panel-success)';
        case 'warning': return 'var(--dev-panel-warning)';
        case 'error': return 'var(--dev-panel-error)';
        default: return 'var(--dev-panel-secondary)';
    }
}

// Complexity detection
function getComplexityClass(complexity) {
    if (complexity.includes('O(1)') || complexity.includes('O(log')) return 'progress-excellent';
    if (complexity.includes('O(n)')) return 'progress-good';
    if (complexity.includes('O(n²)')) return 'progress-fair';
    return 'progress-poor';
}

// Complexity detection in percentage
function getComplexityPercentage(complexity) {
    if (complexity.includes('O(1)')) return 95;
    if (complexity.includes('O(log')) return 85;
    if (complexity.includes('O(n)')) return 70;
    if (complexity.includes('O(n²)')) return 40;
    return 20;
}

// Performance detection
function getPerformanceClass(score) {
    if (score >= 90) return 'progress-excellent';
    if (score >= 75) return 'progress-good';
    if (score >= 60) return 'progress-fair';
    return 'progress-poor';
}

// Quality detection
function getQualityClass(score) {
    if (score >= 90) return 'progress-excellent';
    if (score >= 75) return 'progress-good';
    if (score >= 60) return 'progress-fair';
    return 'progress-poor';
}

// Event listeners
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

// Generate unified execution steps
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


export default {
    detectAsyncPatterns,
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
    detectSecurityIssues,




}