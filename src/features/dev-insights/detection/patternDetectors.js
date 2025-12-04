// Core pattern detectors shared across Dev Insights modules

export function detectFunctionPatterns(codeText) {
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

    const higherOrderMatches = codeText.match(/\.(map|filter|reduce|forEach|some|every|find|findIndex)\s*\(/g) || [];
    results.higherOrder = higherOrderMatches.length;
    total += results.higherOrder;

    return { ...results, total };
}

export function detectLoopPatterns(codeText) {
    const cleanCode = codeText.replace(/('.*?'|\".*?\"|`[\s\S]*?`)/g, '');

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

export function detectAsyncPatterns(codeText) {
    const cleanCode = codeText
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '');

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

    const promises = newPromise + promiseAll + promiseRace + promiseThen + promiseCatch;
    const legacy = xmlHttp + timeouts;
    const total = asyncFunctions + awaitKeywords + promises + fetch + axios + legacy;

    return {
        fetch,
        axios,
        promises,
        legacy,
        total,
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

export function detectDOMPatterns(codeText) {
    const cleanCode = codeText
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '');

    const getElementById = (cleanCode.match(/document\.getElementById\s*\(/g) || []).length;
    const querySelector = (cleanCode.match(/document\.querySelector\s*\(/g) || []).length;
    const querySelectorAll = (cleanCode.match(/document\.querySelectorAll\s*\(/g) || []).length;
    const getElementsByTag = (cleanCode.match(/document\.getElementsByTagName\s*\(/g) || []).length;
    const getElementsByClass = (cleanCode.match(/document\.getElementsByClassName\s*\(/g) || []).length;
    const getElementsByName = (cleanCode.match(/document\.getElementsByName\s*\(/g) || []).length;

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

    const addEventListener = (cleanCode.match(/\.addEventListener\s*\(/g) || []).length;
    const removeEventListener = (cleanCode.match(/\.removeEventListener\s*\(/g) || []).length;
    const inlineEvents = (cleanCode.match(/\bon\w+\s*=/g) || []).length;

    const queries = getElementById + querySelector + querySelectorAll + getElementsByTag + getElementsByClass + getElementsByName;
    const modifications = createElement + appendChild + removeChild + innerHTML + textContent + innerText + setAttribute + getAttribute + classList + style;
    const events = addEventListener + removeEventListener + inlineEvents;
    const total = queries + modifications + events;

    return {
        queries,
        modifications,
        events,
        total,
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
            events: {
                addEventListener,
                removeEventListener,
                inlineEvents,
                total: events
            }
        }
    };
}

export function detectMemoryLeaks(codeText) {
    const leaks = {
        intervalsWithoutClear: (codeText.match(/setInterval\s*\(.*(?!clearInterval)/g) || []).length,
        globalReferences: (codeText.match(/window\.\w+\s*=/g) || []).length,
        detachedDOM: (codeText.match(/document\.createElement[\s\S]*?\.innerHTML/g) || []).length,
        cachedDom: (codeText.match(/document\.querySelectorAll[\s\S]*?push/g) || []).length
    };

    const total = Object.values(leaks).reduce((sum, count) => sum + count, 0);
    return { ...leaks, total };
}

export function detectPerformanceAntiPatterns(codeText) {
    const patterns = {
        heavyDomInLoops: (codeText.match(/for.*\{[\s\S]*?document\./g) || []).length,
        synchronousXHR: (codeText.match(/XMLHttpRequest.*open\([^)]*,[^)]*,\s*false\)/g) || []).length,
        layoutThrashing: (codeText.match(/(offset|client)Width/g) || []).length,
        largeInnerHTMLUsage: (codeText.match(/innerHTML\s*=\s*`[\s\S]{500,}`/g) || []).length,
        multipleEventBindings: (codeText.match(/addEventListener/g) || []).length
    };

    return {
        ...patterns,
        total: Object.values(patterns).reduce((sum, count) => sum + count, 0)
    };
}

export function findDuplicateCode(codeText, minLines = 3) {
    const lines = codeText.split('\n').map(line => line.trim()).filter(line => line);
    const duplicates = new Map();

    for (let i = 0; i <= lines.length - minLines; i++) {
        const snippet = lines.slice(i, i + minLines).join('\n');
        duplicates.set(snippet, (duplicates.get(snippet) || 0) + 1);
    }

    return Array.from(duplicates.entries())
        .filter(([_, count]) => count > 1)
        .map(([snippet, count]) => ({ snippet, count }));
}

export function detectCodeSmells(codeText) {
    const longMethods = (codeText.match(/function\s+\w+\s*\([\s\S]*?\{[\s\S]*?\n(?:\s*\n){5,}/g) || []).length;
    const deepNesting = (codeText.match(/\{[^{}]*\{[^{}]*\{[^{}]*\{/g) || []).length;
    const longParameters = (codeText.match(/function\s+\w+\s*\([^)]{40,}\)/g) || []).length;
    const magicNumbers = (codeText.match(/\b\d{3,}\b/g) || []).length;
    const globalUsage = (codeText.match(/window\.\w+/g) || []).length;
    const duplicateCode = findDuplicateCode(codeText, 4).length;

    return {
        longMethods,
        deepNesting,
        longParameters,
        magicNumbers,
        globalUsage,
        duplicateCode,
        total: longMethods + deepNesting + longParameters + (magicNumbers > 5 ? 1 : 0) + (globalUsage > 5 ? 1 : 0) + duplicateCode
    };
}

export function analyzeSecurityIssues(codeText) {
    const cleanCode = codeText
        .replace(/(['\"]).*?\1/g, '')
        .replace(/`[\s\S]*?`/g, '');

    const issues = {
        evalUsage: (cleanCode.match(/\beval\s*\(/g) || []).length,
        innerHTMLUsage: (cleanCode.match(/\.innerHTML\s*=/g) || []).length,
        documentWrite: (cleanCode.match(/document\.write/g) || []).length,
        unsanitizedInputs: (cleanCode.match(/(location|document\.cookie)/g) || []).length,
        insecureRequests: (cleanCode.match(/http:\/\/(?!localhost)/g) || []).length,
        domXSS: (cleanCode.match(/innerHTML\s*=\s*(?:userInput|request\.|params\.)/g) || []).length
    };

    const suggestions = [];
    if (issues.evalUsage) suggestions.push('Avoid using eval; consider JSON.parse or safer parsers.');
    if (issues.innerHTMLUsage) suggestions.push('Use textContent or DOM APIs to avoid XSS.');
    if (issues.insecureRequests) suggestions.push('Use HTTPS for external requests.');
    if (issues.domXSS) suggestions.push('Sanitize user input before injecting into DOM.');

    return {
        issues: {
            ...issues,
            total: Object.values(issues).reduce((sum, count) => sum + count, 0)
        },
        suggestions
    };
}

export function detectModulePatterns(codeText) {
    const imports = (codeText.match(/import\s+.+\s+from\s+['"][^'"]+['"]/g) || []).length;
    const requires = (codeText.match(/const\s+\w+\s*=\s*require\(/g) || []).length;
    const exports = (codeText.match(/export\s+(?:default|const|function|class)/g) || []).length;
    const dynamic = (codeText.match(/import\(/g) || []).length;

    return {
        imports: imports + requires,
        exports,
        dynamic,
        total: imports + requires + exports + dynamic
    };
}

export function detectVariablePatterns(codeText) {
    const globals = (codeText.match(/(?:var|let|const)\s+\w+\s*=/g) || []).length;
    const locals = (codeText.match(/(?:let|const)\s+\w+\s*=/g) || []).length;
    const constants = (codeText.match(/const\s+\w+\s*=/g) || []).length;
    const closures = (codeText.match(/return\s+function/g) || []).length;

    return {
        globals,
        locals,
        constants,
        closures,
        total: globals + locals + constants + closures
    };
}

export function analyzeCodeComplexity(codeText) {
    const lines = codeText.split('\n');
    const tokens = (codeText.match(/\b\w+\b/g) || []).length;
    const cyclomatic = (codeText.match(/\b(if|for|while|case|catch|&&|\|\|)\b/g) || []).length + 1;
    const nestingDepth = Math.max(1, (codeText.match(/\{/g) || []).length - (codeText.match(/\}/g) || []).length);

    return {
        lines: lines.length,
        tokens,
        cyclomatic,
        nestingDepth,
        functions: (codeText.match(/function\s+\w+|=>/g) || []).length
    };
}

export function detectErrorPatterns(codeText) {
    const tryBlocks = (codeText.match(/\btry\s*\{/g) || []).length;
    const catchBlocks = (codeText.match(/\bcatch\s*\(/g) || []).length;
    const finallyBlocks = (codeText.match(/\bfinally\s*\{/g) || []).length;
    const throwStatements = (codeText.match(/\bthrow\b/g) || []).length;
    const customErrors = (codeText.match(/class\s+\w+\s+extends\s+Error/g) || []).length;
    const loggingInsideCatch = (codeText.match(/catch\s*\([^)]*\)\s*\{[^}]*console\.(?:error|warn)/g) || []).length;

    const total = tryBlocks + catchBlocks + finallyBlocks + throwStatements + customErrors;
    const coverage = tryBlocks ? (catchBlocks / tryBlocks) * 100 : 0;
    const unhandled = Math.max(0, throwStatements - catchBlocks);

    return {
        tryBlocks,
        catchBlocks,
        finallyBlocks,
        throwStatements,
        customErrors,
        loggingInsideCatch,
        total,
        coverage: coverage.toFixed(0),
        unhandled: Math.max(0, unhandled)
    };
}

export function analyzePerformanceIssues(codeText) {
    const nestedLoops = (codeText.match(/for[\s\S]*?for[\s\S]*?\{/g) || []).length;
    const domInLoops = (codeText.match(/for[\s\S]*?document\./g) || []).length;
    const inefficientSelectors = (codeText.match(/document\.getElementsBy/g) || []).length;
    const syncRequests = (codeText.match(/XMLHttpRequest[\s\S]*?false/g) || []).length;

    const bottlenecks = nestedLoops + domInLoops + syncRequests;
    const optimizations = inefficientSelectors;
    const critical = syncRequests + (nestedLoops > 2 ? 1 : 0);
    const warnings = domInLoops + inefficientSelectors;

    const score = Math.max(0, 100 - (critical * 30) - (warnings * 10));

    return {
        bottlenecks,
        optimizations,
        critical,
        warnings,
        score,
        total: bottlenecks + optimizations
    };
}
