
// Function detection
function detectFunctionPatterns(codeText) {
    const functionPatterns = {
        regular: /function\s+\w+\s*\(/g,
        arrow: /(?:const|let|var)\s+\w+\s*=\s*\([^)]*\)\s*=>/g,
        async: /async\s+(?:function|\()/g,
        method: /(?:\w+\.\w+\s*=\s*function|class\s+\w+\s*\{[^}]*\b\w+\s*\([^)]*\)\s*\{)/g,
        constructor: /constructor\s*\([^)]*\)\s*\{/g,
        generator: /function\s*\*\s*\w+\s*\(|=>\s*\{[^}]*yield\b/g
    };

    const results = {};
    let total = 0;

    for (const [type, pattern] of Object.entries(functionPatterns)) {
        const matches = (codeText.match(pattern) || []).length;
        results[type] = matches;
        total += matches;
    }

    // Check for higher-order functions
    const higherOrderMatches = codeText.match(/\.(map|filter|reduce|forEach|some|every|find|findIndex)\s*\(/g) || [];
    results.higherOrder = higherOrderMatches.length;
    total += results.higherOrder;

    return { ...results, total };
}

// Loop detection
function detectLoopPatterns(codeText) {
    const cleanCode = codeText.replace(/('.*?'|".*?"|`[\s\S]*?`)/g, '');

    const forLoops = (cleanCode.match(/\bfor\s*\(/g) || []).length;
    const whileLoops = (cleanCode.match(/\bwhile\s*\(/g) || []).length;
    const doWhileLoops = (cleanCode.match(/\bdo\s*\{/g) || []).length;
    const forIn = (cleanCode.match(/\bfor\s*\(\s*(?:var|let|const)\s+\w+\s+in\s+/g) || []).length;
    const forOf = (cleanCode.match(/\bfor\s*\(\s*(?:var|let|const)\s+\w+\s+of\s+/g) || []).length;
    const forEach = (cleanCode.match(/\.forEach\s*\(/g) || []).length;
    const functional = (cleanCode.match(/\.(?:map|filter|reduce|find|some|every)\s*\(/g) || []).length;

    return {
        forLoops,
        whileLoops,
        doWhileLoops,
        forIn,
        forOf,
        forEach,
        functional,
        total: forLoops + whileLoops + doWhileLoops + forIn + forOf + forEach + functional
    };
}

// Async detection
function detectAsyncPatterns(codeText) {
    // Remove comments to avoid false positives
    const cleanCode = codeText
        .replace(/\/\/.*$/gm, '') // Line comments
        .replace(/\/\*[\s\S]*?\*\//g, ''); // Block comments

    const asyncFunctions = (cleanCode.match(/\basync\s+(?:function|\()/g) || []).length;
    const awaitKeywords = (cleanCode.match(/\bawait\b/g) || []).length;

    const newPromise = (cleanCode.match(/new\s+Promise\s*\(/g) || []).length;
    const promiseAll = (cleanCode.match(/Promise\.all\s*\(/g) || []).length;
    const promiseRace = (cleanCode.match(/Promise\.race\s*\(/g) || []).length;
    const promiseThen = (cleanCode.match(/\.then\s*\(/g) || []).length;
    const promiseCatch = (cleanCode.match(/\.catch\s*\(/g) || []).length;

    const fetch = (cleanCode.match(/\bfetch\s*\(/g) || []).length;
    const axios = (cleanCode.match(/\baxios\s*[\.\(]/g) || []).length;
    const xmlHttp = (cleanCode.match(/\bXMLHttpRequest\b/g) || []).length;
    const timeouts = (cleanCode.match(/\b(?:setTimeout|setInterval)\s*\(/g) || []).length;

    // Calculate totals
    const promises = newPromise + promiseAll + promiseRace + promiseThen + promiseCatch;
    const legacy = xmlHttp + timeouts;
    const total = asyncFunctions + awaitKeywords + promises + fetch + axios + legacy;

    return {
        fetch,
        axios,
        promises,
        legacy,
        total,
        // Keep detailed breakdown for potential future use
        details: {
            asyncFunctions,
            awaitKeywords,
            newPromise,
            promiseAll,
            promiseRace,
            promiseThen,
            promiseCatch,
            xmlHttp,
            timeouts
        }
    };
}

// DOM detection
function detectDOMPatterns(codeText) {
    // Remove comments to avoid false positives
    const cleanCode = codeText
        .replace(/\/\/.*$/gm, '') // Line comments
        .replace(/\/\*[\s\S]*?\*\//g, ''); // Block comments

    // Query Selectors
    const getElementById = (cleanCode.match(/document\.getElementById\s*\(/g) || []).length;
    const querySelector = (cleanCode.match(/document\.querySelector\s*\(/g) || []).length;
    const querySelectorAll = (cleanCode.match(/document\.querySelectorAll\s*\(/g) || []).length;
    const getElementsByTag = (cleanCode.match(/document\.getElementsByTagName\s*\(/g) || []).length;
    const getElementsByClass = (cleanCode.match(/document\.getElementsByClassName\s*\(/g) || []).length;
    const getElementsByName = (cleanCode.match(/document\.getElementsByName\s*\(/g) || []).length;

    // DOM Manipulation
    const createElement = (cleanCode.match(/document\.createElement\s*\(/g) || []).length;
    const appendChild = (cleanCode.match(/\.appendChild\s*\(/g) || []).length;
    const removeChild = (cleanCode.match(/\.removeChild\s*\(/g) || []).length;
    const innerHTML = (cleanCode.match(/\.innerHTML\s*=/g) || []).length;
    const textContent = (cleanCode.match(/\.textContent\s*=/g) || []).length;
    const innerText = (cleanCode.match(/\.innerText\s*=/g) || []).length;
    const setAttribute = (cleanCode.match(/\.setAttribute\s*\(/g) || []).length;
    const getAttribute = (cleanCode.match(/\.getAttribute\s*\(/g) || []).length;
    const classList = (cleanCode.match(/\.classList\.\w+/g) || []).length;
    const style = (cleanCode.match(/\.style\.\w+\s*=/g) || []).length;

    // Event Listeners
    const addEventListener = (cleanCode.match(/\.addEventListener\s*\(/g) || []).length;
    const removeEventListener = (cleanCode.match(/\.removeEventListener\s*\(/g) || []).length;
    const inlineEvents = (cleanCode.match(/\bon\w+\s*=/g) || []).length;

    // Calculate totals for calling code compatibility
    const queries = getElementById + querySelector + querySelectorAll + getElementsByTag + getElementsByClass + getElementsByName;
    const modifications = createElement + appendChild + removeChild + innerHTML + textContent + innerText + setAttribute + getAttribute + classList + style;
    const events = addEventListener + removeEventListener + inlineEvents;
    const total = queries + modifications + events;

    return {
        // Flat properties that calling code expects
        queries,
        modifications,
        events,
        total,

        // Detailed breakdown for potential future use
        details: {
            querySelectors: {
                getElementById,
                querySelector,
                querySelectorAll,
                getElementsByTag,
                getElementsByClass,
                getElementsByName,
                total: queries
            },
            manipulation: {
                createElement,
                appendChild,
                removeChild,
                innerHTML,
                textContent,
                innerText,
                setAttribute,
                getAttribute,
                classList,
                style,
                total: modifications
            },
            eventListeners: {
                addEventListener,
                removeEventListener,
                inlineEvents,
                total: events
            }
        }
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

// Memory leak detection
function detectMemoryLeaks(codeText) {
    let leaks = 0;

    // Timer leaks
    const timerMatches = codeText.match(/(?:setInterval|setTimeout)\s*\(/g) || [];
    const clearMatches = codeText.match(/(?:clearInterval|clearTimeout)\s*\(/g) || [];
    leaks += Math.max(0, timerMatches.length - clearMatches.length);

    // Event listener leaks (match event types)
    const addListeners = [...codeText.matchAll(/addEventListener\s*\(\s*['"`](\w+)['"`]/g)].map(m => m[1]);
    const removeListeners = [...codeText.matchAll(/removeEventListener\s*\(\s*['"`](\w+)['"`]/g)].map(m => m[1]);

    const listenerCount = {};
    addListeners.forEach(e => listenerCount[e] = (listenerCount[e] || 0) + 1);
    removeListeners.forEach(e => listenerCount[e] = (listenerCount[e] || 0) - 1);

    for (const count of Object.values(listenerCount)) {
        if (count > 0) leaks += count;
    }

    // Resource leaks (WebSocket/EventSource/Worker without close)
    const resourceMatches = codeText.match(/new\s+(WebSocket|EventSource|Worker)\s*\(/g) || [];
    const closes = codeText.match(/\.\s*close\s*\(/g) || [];
    leaks += Math.max(0, resourceMatches.length - closes.length);

    // Global variable leaks
    leaks += (codeText.match(/window\.\w+\s*=(?!\s*function)/g) || []).length;

    return leaks;
}

// Performance anti-pattern detection
function detectPerformanceAntiPatterns(codeText) {
    const lines = codeText.split('\n');
    const antiPatterns = [
        {
            name: "Direct style manipulation",
            pattern: /document\.getElementById\s*\([^)]*\)\s*\.style\./,
            type: "DOM"
        },
        {
            name: "DOM queries in for loops",
            pattern: /for\s*\([^)]*\)\s*\{[^}]*document\.(getElementById|querySelector)/,
            type: "Loop+DOM"
        },
        {
            name: "DOM queries in while loops",
            pattern: /while\s*\([^)]*\)\s*\{[^}]*document\.(getElementById|querySelector)/,
            type: "Loop+DOM"
        },
        {
            name: "innerHTML concatenation",
            pattern: /\.innerHTML\s*\+=/,
            type: "DOM"
        },
        {
            name: "RegExp constructor (may cause performance issues in loops)",
            pattern: /new\s+RegExp\s*\(/,
            type: "Memory"
        },
        {
            name: "Deep clone anti-pattern (JSON parse/stringify)",
            pattern: /JSON\.parse\s*\(\s*JSON\.stringify\s*\(/,
            type: "Memory"
        },
        {
            name: "Zero-delay timeout or interval",
            pattern: /(setTimeout|setInterval)\s*\([^,]+,\s*0\s*\)/,
            type: "Timer"
        },
        {
            name: "DOM queries in forEach loop",
            pattern: /\.forEach\s*\(\s*\(?[^\)]*\)?\s*=>\s*\{[^}]*document\.(getElementById|querySelector)/,
            type: "Loop+DOM"
        },
        {
            name: "Multiple direct DOM manipulations",
            pattern: /(appendChild|insertBefore|removeChild).+\1/,
            type: "DOM"
        },
        {
            name: "Layout thrashing (multiple reflows)",
            pattern: /(offsetWidth|offsetHeight|clientWidth|clientHeight|scrollWidth|scrollHeight).+\1/,
            type: "DOM+Layout"
        }
    ];

    const issues = [];

    lines.forEach((line, index) => {
        antiPatterns.forEach(({ name, pattern, type }) => {
            if (pattern.test(line)) {
                issues.push({
                    line: index + 1,
                    snippet: line.trim(),
                    name,
                    type
                });
            }
        });
    });

    return {
        count: issues.length,
        issues
    };
}

// Duplicate code detection
function findDuplicateCode(codeText, minLines = 3) {
    const cleanCode = codeText
        .replace(/\/\/.*$/gm, '') // remove single-line comments
        .replace(/\/\*[\s\S]*?\*\//g, '') // remove multi-line comments
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean); // remove empty lines

    const seen = new Map();
    const windowSize = minLines;

    for (let i = 0; i <= cleanCode.length - windowSize; i++) {
        const chunk = cleanCode.slice(i, i + windowSize).join('\n');
        const hash = chunk;

        seen.set(hash, (seen.get(hash) || 0) + 1);
    }

    // Count how many chunks are repeated
    let duplicates = 0;
    for (const count of seen.values()) {
        if (count > 1) duplicates++;
    }

    return duplicates;
}

// Code smell detection
function detectCodeSmells(codeText) {
    const smellPatterns = [
        { pattern: /function\s+\w+\s*\([^)]{50,}\)/g, name: "longParameterLists" },
        { pattern: /function[^{]{0,100}\{(?:[^{}]*\{[^{}]*\})*[^{}]{300,}\}/g, name: "longFunctions" },
        { pattern: /(?:var|let|const)\s+\w+\s*,\s*\w+\s*,\s*\w+/g, name: "multiVarDeclarations" },
        { pattern: /if\s*\([^)]*\)\s*\{\s*if\s*\([^)]*\)\s*\{/g, name: "nestedIfs" },
        { pattern: /(?:TODO|FIXME|HACK|XXX|BUG)/gi, name: "commentIssues" },
        { pattern: /console\.log\s*\(/g, name: "debugStatements" },
        { pattern: /(?:42|123|999|1000|100)\b(?!\s*[+\-*\/])/g, name: "magicNumbers" },
        { pattern: /(?:temp|test|foo|bar|baz)\w*/gi, name: "poorNaming" },
        { pattern: /(?:var\s+|let\s+|const\s+)\w+\s*=\s*(?:var\s+|let\s+|const\s+)/g, name: "variableShadowing" },
        { pattern: /catch\s*\([^)]*\)\s*\{\s*\}/g, name: "emptyCatch" }
    ];

    const result = smellPatterns.reduce((acc, { name, pattern }) => {
        acc[name] = (codeText.match(pattern) || []).length;
        return acc;
    }, {});

    // Additional patterns like deep nesting or duplicate code
    result.deepNesting = (codeText.match(/\{[^{}]*\{[^{}]*\{[^{}]*\{/g) || []).length;
    result.duplicateCode = findDuplicateCode(codeText); // assumes this returns a count
    result.total = Object.values(result).reduce((sum, v) => sum + (typeof v === 'number' ? v : 0), 0);

    return result;
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

    // Detect all patterns first to determine which steps will be included
    const functionPatterns = detectFunctionPatterns(codeText);
    const loopPatterns = detectLoopPatterns(codeText);
    const asyncPatterns = detectAsyncPatterns(codeText);
    const domPatterns = detectDOMPatterns(codeText);

    // Count active steps (parsing is always included)
    let activeSteps = 1; // Always include parsing
    if (functionPatterns.total > 0) activeSteps++;
    if (loopPatterns.total > 0) activeSteps++;
    if (asyncPatterns.total > 0) activeSteps++;
    if (domPatterns.total > 0) activeSteps++;

    // Distribute time evenly among active steps, with parsing getting slightly less
    const parsingTime = Math.max(0.1, realExecutionTime * 0.1); // Fixed 10% for parsing
    const remainingTime = realExecutionTime - parsingTime;
    const stepTime = activeSteps > 1 ? remainingTime / (activeSteps - 1) : 0;

    // Step 1: Code Parsing & Memory Initialization (always included)
    const lineCount = (codeText.match(/\n/g) || []).length + 1;
    const memoryForParsing = (lineCount * 0.1).toFixed(2);
    steps.push({
        icon: '📝',
        name: 'Code Parsing & Memory Initialization',
        time: `${parsingTime.toFixed(2)}ms`,
        status: 'complete',
        details: `${lineCount} lines parsed, variables declared`,
        metrics: `Memory allocated: ~${memoryForParsing}KB | GC: ${realTimeMetrics.gcCollections}`
    });

    // Step 2: Function Analysis & Memory Allocation
    if (functionPatterns.total > 0) {
        const functionMemory = (functionPatterns.total * 2.5).toFixed(2);
        steps.push({
            icon: '🔧',
            name: 'Function Analysis & Memory Allocation',
            time: `${stepTime.toFixed(2)}ms`,
            status: functionPatterns.total > 10 ? 'warning' : 'complete',
            details: `${functionPatterns.total} functions analyzed (${functionPatterns.arrow || 0} arrow, ${functionPatterns.regular || 0} regular, ${functionPatterns.async || 0} async)`,
            metrics: `Function memory: ~${functionMemory}KB | Closures detected: ${functionPatterns.closures || 0}`
        });
    }

    // Step 3: Loop Processing & Iteration Memory
    if (loopPatterns.total > 0) {
        const loopStatus = loopPatterns.total > 5 ? 'warning' : 'complete';
        const loopMemory = (loopPatterns.total * 1.8).toFixed(2);
        steps.push({
            icon: '🔄',
            name: 'Loop Processing & Iteration Memory',
            time: `${stepTime.toFixed(2)}ms`,
            status: loopStatus,
            details: `${loopPatterns.forLoops + loopPatterns.whileLoops + loopPatterns.doWhileLoops} traditional loops, ${loopPatterns.functional} functional methods processed`,
            metrics: `Loop memory: ~${loopMemory}KB | Peak iterations: ${loopPatterns.total * 100}`
        });
    }

    // Step 4: Async Operations & Network Memory
    if (asyncPatterns.total > 0) {
        const asyncStatus = asyncPatterns.total > 3 ? 'warning' : 'complete';
        const networkMemory = (asyncPatterns.total * 5.2).toFixed(2);
        steps.push({
            icon: '⏳',
            name: 'Async Operations & Network Memory',
            time: `${stepTime.toFixed(2)}ms`,
            status: asyncStatus,
            details: `${asyncPatterns.fetch} fetch, ${asyncPatterns.axios} axios, ${asyncPatterns.promises} promises, ${asyncPatterns.legacy} legacy async`,
            metrics: `Network buffer: ~${networkMemory}KB | Active requests: ${realTimeMetrics.networkRequests}`
        });
    }

    // Step 5: DOM Manipulation & Event Memory
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

    // Verify total time matches (for debugging)
    const calculatedTotal = steps.reduce((sum, step) => {
        const timeValue = parseFloat(step.time.replace('ms', ''));
        return sum + timeValue;
    }, 0);

    // If there's a significant discrepancy, adjust the last step
    const timeDifference = realExecutionTime - calculatedTotal;
    if (Math.abs(timeDifference) > 0.01 && steps.length > 1) {
        const lastStep = steps[steps.length - 1];
        const lastStepTime = parseFloat(lastStep.time.replace('ms', ''));
        const adjustedTime = Math.max(0.1, lastStepTime + timeDifference);
        lastStep.time = `${adjustedTime.toFixed(2)}ms`;
    }

    return steps;
}

// Generate unified execution steps
// function generateUnifiedExecutionSteps(codeText, realTimeMetrics, realExecutionTime) {
//     const steps = [];
//
//     if (!codeText || codeText.trim().length === 0) {
//         return [{
//             icon: '⚠️',
//             name: 'No Code Detected',
//             time: '0ms',
//             status: 'warning',
//             details: 'Write some code to see real-time execution analysis',
//             metrics: 'Memory: 0MB | Operations: 0'
//         }];
//     }
//
//     // Calculate dynamic timing distribution
//     const baseParsingTime = Math.max(0.1, realExecutionTime * 0.05);
//     const functionTime = Math.max(0.1, realExecutionTime * 0.15);
//     const loopTime = Math.max(0.1, realExecutionTime * 0.25);
//     const asyncTime = Math.max(0.1, realExecutionTime * 0.35);
//     const domTime = Math.max(0.1, realExecutionTime * 0.10);
//     // const outputTime = Math.max(0.1, realExecutionTime * 0.10);
//
//     // Step 1: Code Parsing & Memory Initialization
//     const lineCount = (codeText.match(/\n/g) || []).length + 1;
//     const memoryForParsing = (lineCount * 0.1).toFixed(2);
//     steps.push({
//         icon: '📝',
//         name: 'Code Parsing & Memory Initialization',
//         time: `${baseParsingTime.toFixed(2)}ms`,
//         status: 'complete',
//         details: `${lineCount} lines parsed, variables declared`,
//         metrics: `Memory allocated: ~${memoryForParsing}KB | GC: ${realTimeMetrics.gcCollections}`
//     });
//
//     // Step 2: Function Analysis & Memory Allocation
//     const functionPatterns = detectFunctionPatterns(codeText);
//     if (functionPatterns.total > 0) {
//         const functionMemory = (functionPatterns.total * 2.5).toFixed(2);
//         steps.push({
//             icon: '🔧',
//             name: 'Function Analysis & Memory Allocation',
//             time: `${functionTime.toFixed(2)}ms`,
//             status: functionPatterns.total > 10 ? 'warning' : 'complete',
//             details: `${functionPatterns.total} functions analyzed (${functionPatterns.arrow} arrow, ${functionPatterns.regular} regular, ${functionPatterns.async} async)`,
//             metrics: `Function memory: ~${functionMemory}KB | Closures detected: ${functionPatterns.closures || 0}`
//         });
//     }
//
//     // Step 3: Loop Processing & Iteration Memory
//     const loopPatterns = detectLoopPatterns(codeText);
//     if (loopPatterns.total > 0) {
//         const loopStatus = loopPatterns.total > 5 ? 'warning' : 'complete';
//         const loopMemory = (loopPatterns.total * 1.8).toFixed(2);
//         steps.push({
//             icon: '🔄',
//             name: 'Loop Processing & Iteration Memory',
//             time: `${loopTime.toFixed(2)}ms`,
//             status: loopStatus,
//             details: `${loopPatterns.traditional} traditional loops, ${loopPatterns.functional} functional methods processed`,
//             metrics: `Loop memory: ~${loopMemory}KB | Peak iterations: ${loopPatterns.total * 100}`
//         });
//     }
//
//     // Step 4: Async Operations & Network Memory
//     const asyncPatterns = detectAsyncPatterns(codeText);
//     if (asyncPatterns.total > 0) {
//         const asyncStatus = asyncPatterns.total > 3 ? 'warning' : 'complete';
//         const networkMemory = (asyncPatterns.total * 5.2).toFixed(2);
//         steps.push({
//             icon: '⏳',
//             name: 'Async Operations & Network Memory',
//             time: `${asyncTime.toFixed(2)}ms`,
//             status: asyncStatus,
//             details: `${asyncPatterns.fetch} fetch, ${asyncPatterns.axios} axios, ${asyncPatterns.promises} promises, ${asyncPatterns.legacy} legacy async`,
//             metrics: `Network buffer: ~${networkMemory}KB | Active requests: ${realTimeMetrics.networkRequests}`
//         });
//     }
//
//     // Step 5: DOM Manipulation & Event Memory
//     const domPatterns = detectDOMPatterns(codeText);
//     if (domPatterns.total > 0) {
//         const domStatus = domPatterns.total > 10 ? 'warning' : 'complete';
//         const domMemory = (domPatterns.total * 3.1).toFixed(2);
//         steps.push({
//             icon: '🌐',
//             name: 'DOM Manipulation & Event Memory',
//             time: `${domTime.toFixed(2)}ms`,
//             status: domStatus,
//             details: `${domPatterns.queries} DOM queries, ${domPatterns.events} event listeners, ${domPatterns.modifications} modifications`,
//             metrics: `DOM memory: ~${domMemory}KB | Active listeners: ${domPatterns.events}`
//         });
//     }
//
//     // Step 6: Output Generation & Console Memory
//     // const outputPatterns = detectOutputPatterns(codeText);
//     // if (outputPatterns.total > 0) {
//     //     const consoleMemory = (outputPatterns.total * 0.8).toFixed(2);
//     //     steps.push({
//     //         icon: '📤',
//     //         name: 'Output Generation & Console Memory',
//     //         time: `${outputTime.toFixed(2)}ms`,
//     //         status: 'complete',
//     //         details: `${outputPatterns.console} console operations, ${outputPatterns.returns} return statements`,
//     //         metrics: `Console buffer: ~${consoleMemory}KB | Output size: ${outputPatterns.total * 50}B`
//     //     });
//     // }
//
//     // Step 7: Error Handling & Memory Cleanup
//     // const errorPatterns = detectErrorPatterns(codeText);
//     // if (errorPatterns.total > 0) {
//     //     const cleanupMemory = (errorPatterns.cleanup * 1.2).toFixed(2);
//     //     steps.push({
//     //         icon: '🛡️',
//     //         name: 'Error Handling & Memory Cleanup',
//     //         time: `${(realExecutionTime * 0.05).toFixed(2)}ms`,
//     //         status: errorPatterns.hasCleanup ? 'complete' : 'warning',
//     //         details: `${errorPatterns.tryCatch} try/catch blocks, ${errorPatterns.cleanup} cleanup operations`,
//     //         metrics: `Cleanup freed: ~${cleanupMemory}KB | Error count: ${realTimeMetrics.errorCount}`
//     //     });
//     // }
//
//     // Step 8: Garbage Collection & Final Memory State
//     if (realTimeMetrics.gcCollections > 0) {
//         const finalMemory = (realTimeMetrics.peakMemory / (1024 * 1024)).toFixed(2);
//         steps.push({
//             icon: '🗑️',
//             name: 'Garbage Collection & Final Memory State',
//             time: `${(realExecutionTime * 0.03).toFixed(2)}ms`,
//             status: parseFloat(finalMemory) > 50 ? 'warning' : 'complete',
//             details: `${realTimeMetrics.gcCollections} GC cycles completed, memory optimized`,
//             metrics: `Final memory: ${finalMemory}MB | Memory freed: ~${(realTimeMetrics.gcCollections * 2.5).toFixed(2)}KB`
//         });
//     }
//
//     return steps.length > 1 ? steps : [{
//         icon: '✅',
//         name: 'Simple Code Execution',
//         time: `${realExecutionTime.toFixed(2)}ms`,
//         status: 'complete',
//         details: 'Basic code execution completed successfully',
//         metrics: `Memory: ${(realTimeMetrics.peakMemory / (1024 * 1024)).toFixed(2)}MB | Operations: ${realTimeMetrics.domManipulations + realTimeMetrics.networkRequests}`
//     }];
// }

// Function to analyze code for security vulnerabilities
function analyzeSecurityIssues(codeText) {
    // Strip string literals (handles escaped quotes), line comments, and block comments
    const cleanCode = codeText
        .replace(/(["'`])(?:\\.|(?!\1)[^\\\n\r])*\1/g, '') // Remove string literals
        .replace(/\/\/.*$/gm, '')                          // Remove line comments
        .replace(/\/\*[\s\S]*?\*\//g, '');                 // Remove block comments

    // Detection rules
    const issues = {
        // XSS (Cross-Site Scripting)
        innerHTML: (cleanCode.match(/\.innerHTML\s*[\+\=]=?/g) || []).length,
        outerHTML: (cleanCode.match(/\.outerHTML\s*[\+\=]=?/g) || []).length,
        documentWrite: (cleanCode.match(/document\.write\s*\(/g) || []).length,
        javascriptHref: (cleanCode.match(/(?:src|href)\s*=\s*["']javascript:/gi) || []).length,

        // RCE (Remote Code Execution)
        eval: (cleanCode.match(/\beval\s*\(/g) || []).length,
        newFunction: (cleanCode.match(/new\s+Function\s*\(/g) || []).length,
        setTimeoutString: (cleanCode.match(/set(?:Timeout|Interval)\s*\([^,)]*["']/g) || []).length,

        // Client Storage (Sensitive usage)
        localStorage: (cleanCode.match(/\blocalStorage\s*[=.\[]/g) || []).length,
        sessionStorage: (cleanCode.match(/\bsessionStorage\s*[=.\[]/g) || []).length,
        localStorageSensitive: (cleanCode.match(/localStorage\.setItem\s*\([^)]*(?:password|secret|token)/gi) || []).length,

        // Secrets / Tokens (Hardcoded)
        hardcodedSecrets: (cleanCode.match(/(?:password|secret|key|token|api_key)\s*[:=]\s*['"`][^'"`]*['"`]/gi) || []).length,

        // Crypto
        mathRandom: (cleanCode.match(/\bMath\.random\s*\(/g) || []).length,
        weakCrypto: (cleanCode.match(/\b(?:md5|sha1|crc32|base64)\b/gi) || []).length,

        // Cross-Origin Risks
        postMessage: (cleanCode.match(/\bpostMessage\s*\(/g) || []).length,
        locationAssign: (cleanCode.match(/\b(?:window\.)?location\s*=\s*["']/g) || []).length,

        // WebSocket
        websocket: (cleanCode.match(/new\s+WebSocket\s*\(/g) || []).length,

        // ⚠Inline Event Handlers
        inlineEvents: (cleanCode.match(/(?:onload|onclick|onerror)\s*=\s*["']/g) || []).length,

        // Insecure Protocols
        insecureProtocols: (cleanCode.match(/(?:http:\/\/|ftp:\/\/)/g) || []).length,
    };

    const severity = {
        high:
            issues.eval +
            issues.newFunction +
            issues.setTimeoutString +
            issues.javascriptHref +
            issues.documentWrite +
            issues.hardcodedSecrets,

        medium:
            issues.innerHTML +
            issues.outerHTML +
            issues.inlineEvents +
            issues.postMessage +
            issues.locationAssign +
            issues.websocket +
            issues.localStorageSensitive,

        low:
            issues.localStorage +
            issues.sessionStorage +
            issues.mathRandom +
            issues.weakCrypto +
            issues.insecureProtocols,
    };

    const categories = {
        xss:
            issues.innerHTML +
            issues.outerHTML +
            issues.documentWrite +
            issues.javascriptHref +
            issues.inlineEvents,

        rce: issues.eval + issues.newFunction + issues.setTimeoutString,

        storage:
            issues.localStorage +
            issues.sessionStorage +
            issues.localStorageSensitive,

        secrets: issues.hardcodedSecrets,

        crypto: issues.mathRandom + issues.weakCrypto,

        cors: issues.postMessage + issues.locationAssign,

        websocket: issues.websocket,

        protocol: issues.insecureProtocols,
    };

    return {
        issues,
        severity,
        categories,
        total: Object.values(issues).reduce((a, b) => a + b, 0),
    };
}

// Function to calculate the quality score
function calculateQualityScore(complexity, loc, smells) {
    // Simple scoring algorithm (0-100)
    let score = 100;

    // Deduct for complexity
    score -= Math.min(30, complexity * 2);

    // Deduct for long files
    if (loc.code > 300) score -= 20;
    else if (loc.code > 100) score -= 10;

    // Deduct for code smells
    score -= Math.min(20, smells.longMethods * 5);
    score -= Math.min(20, smells.deepNesting * 5);
    score -= Math.min(10, Math.floor(smells.magicNumbers / 5));

    return Math.max(0, Math.round(score));
}


function setupEventListeners(sidebar) {
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

    // Use a named function for reuse/removal if needed
    const handleEscapeKey = (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
    };

    // Prevent adding multiple listeners if this function runs multiple times
    document.removeEventListener('keydown', handleEscapeKey);
    document.addEventListener('keydown', handleEscapeKey);
}


export function analyzeCodePatterns(codeText) {
    if (typeof codeText !== 'string' || !codeText.trim()) {
        return {
            error: 'Invalid or empty code provided',
            timestamp: new Date().toISOString()
        };
    }

    try {
        // Core pattern detection with safe defaults
        const functions = detectFunctionPatterns(codeText) || { total: 0 };
        const loops = detectLoopPatterns(codeText) || { total: 0 };
        const asyncPatterns = detectAsyncPatterns(codeText) || { total: 0 };
        const domPatterns = detectDOMPatterns(codeText) || { total: 0 };

        // Code quality analysis with safe defaults
        const codeSmells = detectCodeSmells(codeText) || { total: 0 };
        const performanceIssues = detectPerformanceAntiPatterns(codeText) || { total: 0 };
        const securityAnalysis = analyzeSecurityIssues(codeText) || { issues: { total: 0 } };
        const memoryLeaks = detectMemoryLeaks(codeText) || { total: 0 };

        // Calculate metrics
        const loc = {
            total: codeText.split('\n').length,
            code: codeText.split('\n').filter(line =>
                line.trim() !== '' && !line.trim().startsWith('//')
            ).length,
            comments: (codeText.match(/\/\/.*|\/\*[\s\S]*?\*\//g) || []).length
        };

        // Calculate complexity (simplified)
        const complexity = Math.min(100, Math.max(1,
            ((functions?.total || 0) * 0.5) +
            ((loops?.total || 0) * 0.3) +
            ((asyncPatterns?.total || 0) * 0.4) +
            ((domPatterns?.total || 0) * 0.2) +
            ((codeSmells?.total || 0) * 0.7)
        ));

        // Generate unified execution steps with proper parameters
        const executionSteps = generateUnifiedExecutionSteps(
            codeText,
            {}, // realTimeMetrics (can be empty object if not available)
            performance.now()
        );

        // Calculate overall quality score with safe defaults
        const qualityScore = calculateQualityScore(complexity, loc, codeSmells) || 0;

        return {
            // Core patterns with safe defaults
            functions: {
                total: functions?.total || 0,
                regular: functions?.regular || 0,
                arrow: functions?.arrow || 0,
                async: functions?.async || 0,
                method: functions?.method || 0,
                constructor: functions?.constructor || 0,
                generator: functions?.generator || 0,
                higherOrder: functions?.higherOrder || 0,
                closures: (codeText.match(/\(function\s*\(|\bfunction\s*[^(]*\([^)]*\)\s*\{[^}]*\}\s*\(/g) || []).length
            },
            loops: loops || { total: 0 },
            asyncPatterns: asyncPatterns || { total: 0 },
            domPatterns: domPatterns || { total: 0 },

            // Code quality with safe defaults
            codeSmells: codeSmells || { total: 0 },
            performanceIssues: performanceIssues || { total: 0 },
            securityAnalysis: securityAnalysis || { issues: { total: 0 } },
            memoryLeaks: memoryLeaks || { total: 0 },

            // Metrics
            metrics: {
                linesOfCode: loc,
                complexity: Math.round(complexity),
                qualityScore,
                timestamp: new Date().toISOString()
            },

            // Execution flow
            executionSteps: executionSteps || [],

            // Raw data for advanced processing
            _raw: {
                codeTextLength: codeText.length,
                analysisTimestamp: new Date().toISOString()
            }
        };
    } catch (error) {
        console.error('Error analyzing code patterns:', error);
        return {
            error: 'Failed to analyze code patterns',
            details: error.message,
            timestamp: new Date().toISOString()
        };
    }
}


export default {
    generateUnifiedExecutionSteps,
    getStepStatusColor,
    getComplexityClass,
    getComplexityPercentage,
    getPerformanceClass,
    setupEventListeners,
    analyzeCodePatterns

}