import {createCopyButton, renderValue} from "./logOutputUtils.js";
import {updateSummaryBarWithAnalysis} from "../devInsights/updateSummaryBarWithAnalysis.js";
import {analyzeCode} from "../devInsights/analyzedCode.js";
import {updateOutputStatus} from "./indexHelper.js";
import {getEditorPlainText} from "./commonUtils.js";

const EXECUTION_TIMEOUT = 5000; // 5 seconds

// === INITIALIZATION FUNCTIONS ===
function initializeExecution(output) {
    clearOutput(output);
    return performance.now();
}

// Prevent dangerous operations
const dangerousPatterns = [
    { pattern: /while\s*\(\s*true\s*\)/g, name: "Infinite while loop" },
    { pattern: /for\s*\(\s*;\s*;\s*\)/g, name: "Infinite for loop" },
    { pattern: /eval\s*\(/g, name: "Nested eval call" },
    { pattern: /Function\s*\(/g, name: "Function constructor" },
];

function sanitizeCode(code) {
    for (const {pattern,name} of dangerousPatterns) {
        if (pattern.test(code)) {
            throw new Error(`Potentially dangerous code detected: ${pattern.source}`);
        }
    }
    return code;
}

// Enhanced memory tracking
function checkMemoryUsage() {
    if (performance.memory) {
        const used = performance.memory.usedJSHeapSize;
        const limit = performance.memory.jsHeapSizeLimit;
        if (used > limit * 0.9) {
            throw new Error(`Memory usage too high: ${Math.round(used/1024/1024)}MB / ${Math.round(limit/1024/1024)}MB`);
        }
    }
}


// === CONSOLE OVERRIDE FUNCTIONS ===
function setupConsoleOverrides(output) {
    const originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        table: console.table,
        time: console.time,
        timeEnd: console.timeEnd
    };

    const timeLabels = {};
    let sessionLogTime = performance.now(); // Self-contained timing

    // Self-contained timing function - no global variables needed
    const logWithTimestamp = (args, type) => {
        const now = performance.now();
        const delta = now - sessionLogTime;
        sessionLogTime = now;
        logOutput(args, output, delta, type);
    };

    console.log = (...args) => logWithTimestamp(args, "log");
    console.error = (...args) => logWithTimestamp(args, "error");
    console.warn = (...args) => logWithTimestamp(args, "warn");
    console.info = (...args) => logWithTimestamp(args, "info");
    console.debug = (...args) => logWithTimestamp(args, "debug");
    console.trace = (...args) => logWithTimestamp(args, "trace");

    console.time = (label = 'default') => {
        timeLabels[label] = performance.now();
    };

    console.timeEnd = (label = 'default') => {
        const end = performance.now();
        const start = timeLabels[label];
        if (start) {
            const duration = (end - start).toFixed(3);
            logWithTimestamp([`${label}: ${duration} ms`], "log");
            delete timeLabels[label];
        } else {
            logWithTimestamp([`${label}: no such label`], "log");
        }
    };

    console.table = (data, columns) => {
        let html = '<table style="border-collapse:collapse;margin:6px 0 12px 0;font-size:13px;">';
        let keys = [];

        if (Array.isArray(data)) {
            if (data.length === 0) {
                logWithTimestamp(['[empty table]'], "log");
                return;
            }
            keys = columns || Object.keys(data[0]);
        } else if (typeof data === "object" && data !== null) {
            keys = columns || Object.keys(data);
            data = [data];
        } else {
            logWithTimestamp([String(data)], "log");
            return;
        }

        html += '<tr>';
        html += '<th style="border:1px solid #444;padding:2px 8px;background:#222;color:#f6c343;">(index)</th>';
        keys.forEach(k => {
            html += `<th style="border:1px solid #444;padding:2px 8px;background:#222;color:#f6c343;">${k}</th>`;
        });
        html += '</tr>';

        data.forEach((row, i) => {
            html += '<tr>';
            html += `<td style="border:1px solid #444;padding:2px 8px;color:#888;">${i}</td>`;
            keys.forEach(k => {
                html += `<td style="border:1px solid #444;padding:2px 8px;color:#ccc;">${row[k] !== undefined ? row[k] : ''}</td>`;
            });
            html += '</tr>';
        });

        html += '</table>';
        logWithTimestamp([html], "log");
    };

    return originalConsole;
}

// === SAFETY CHECK FUNCTIONS ===
function performSafetyChecks(code, output) {
    // Sanitize code for dangerous patterns
    try {
        sanitizeCode(code);
    } catch (err) {
        logOutput([`❌ ${err.message}`], output, 0, "error");
        return false;
    }

    // Check initial memory usage
    try {
        checkMemoryUsage();
    } catch (err) {
        logOutput([`❌ ${err.message}`], output, 0, "error");
        return false;
    }

    return true;
}

// === CODE EXECUTION FUNCTIONS ===
async function executeCodeSafely(code) {
    const asyncWrapper = `
    (async function() {
      ${code}
    })().catch(err => {
      // console.error('Async execution error:', err.message);
      throw err;
    });
  `;

    const executionPromise = eval(asyncWrapper);
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error(`Execution timed out after ${EXECUTION_TIMEOUT}ms`));
        }, EXECUTION_TIMEOUT);
    });

    return Promise.race([executionPromise, timeoutPromise]);
}

// === CLEANUP FUNCTIONS ===
function restoreConsole(originalConsole) {
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.table = originalConsole.table;
    console.time = originalConsole.time;
    console.timeEnd = originalConsole.timeEnd;
}

// === ERROR HANDLING FUNCTIONS ===
function handleExecutionError(err, startTime, code, output) {
    const errorInfo = {
        message: err?.message,
        stack: err?.stack,
        line: err?.lineNumber || 'unknown',
        column: err?.columnNumber || 'unknown',
        type: err?.constructor?.name
    };

    const errorTime = performance.now() - startTime;
    const analysis = analyzeCode(code);
    updateSummaryBarWithAnalysis(analysis, errorTime, code);
    logOutput([`❌ ${errorInfo.type}: ${errorInfo.message}`], output, 0, "error");
}


export async function runCode(editor, output) {
    const source = getEditorPlainText(editor).trim();
    if (!source.length) {
        updateOutputStatus('idle', 'Nothing to run');
        return;
    }

    // Initialize execution
    updateOutputStatus('running');
    const startTime = initializeExecution(output);

    // Setup console overrides (self-contained timing)
    const originalConsole = setupConsoleOverrides(output);

    try {
        const code = source;

        if (!performSafetyChecks(code, output)) return;

        await executeCodeSafely(code);

        const executionTime = performance.now() - startTime;
        window.lastExecutionTime = executionTime

        // Success path - update UI
        const analysis = analyzeCode(code);
        updateSummaryBarWithAnalysis(analysis, executionTime, code);
        updateOutputStatus('success', `Finished in ${executionTime.toFixed(2)} ms`);
    } catch (err) {
        handleExecutionError(err, startTime, source, output);
        updateOutputStatus('error', err?.message || 'Execution failed');
    } finally {
        restoreConsole(originalConsole); // Always cleanup
    }
}

// === LOGGING FUNCTIONS ===

let cumulativeTime = 0;
let autoScrollEnabled = true;

/**
 * Logs a message to the output container with appropriate styling. This function
 * is called during execution for real-time output.
 */

export function logOutput(message, outputEl, delta = 0, type = "log") {
    cumulativeTime += delta;

    const supportedLevels = ["log", "warn", "error"];
    const levelForFilter = supportedLevels.includes(type) ? type : "log";

    const logLine = document.createElement("div");
    logLine.className = `console-log console-${type}`;
    logLine.dataset.level = levelForFilter;
    logLine.classList.add(`log-level-${type}`);
    logLine.style.cssText = `
        display: flex;
        flex-direction: column;
        margin-bottom: 6px;
        padding: 8px 12px;
        font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
        border-left: 4px solid;
        border-radius: 4px;
        box-shadow: none;
        transition: all 0.2s ease;
    `;

    // Style based on log type using CSS custom properties
    const typeStyles = {
        error: {
            border: 'var(--log-error-border)',
            bg: 'var(--log-error-bg)',
            color: 'var(--log-error-text)'
        },
        warn: {
            border: 'var(--log-warn-border)',
            bg: 'var(--log-warn-bg)',
            color: 'var(--log-warn-text)'
        },
        log: {
            border: 'var(--log-info-border)',
            bg: 'var(--log-info-bg)',
            color: 'var(--log-info-text)'
        },
        info: {
            border: 'var(--log-debug-border)',
            bg: 'var(--log-debug-bg)',
            color: 'var(--log-debug-text)'
        },
        debug: {
            border: 'var(--log-trace-border)',
            bg: 'var(--log-trace-bg)',
            color: 'var(--log-trace-text)'
        },
    };

    const style = typeStyles[type] || typeStyles.log;
    logLine.style.borderColor = style.border;
    logLine.style.background = style.bg;
    logLine.style.color = style.color;

    // Add hover effect
    logLine.addEventListener('mouseenter', () => {
        logLine.style.transform = 'translateX(2px)';
    });

    logLine.addEventListener('mouseleave', () => {
        logLine.style.transform = 'translateX(0)';
    });

    // Meta timestamp with theme-aware styling
    const timeMeta = document.createElement("div");
    timeMeta.className = "log-timestamp";
    timeMeta.style.cssText = `
        font-size: 0.75em;
        color: var(--log-timestamp-color);
        margin-bottom: 4px;
        font-weight: 500;
        opacity: 0.8;
        display: flex;
        align-items: center;
        gap: 8px;
    `;

    // Add execution time badge
    const timeText = document.createElement('span');
    timeText.textContent = `[${new Date().toLocaleTimeString()}]`;

    const deltaText = document.createElement('span');
    deltaText.textContent = `+${delta.toFixed(2)}ms`;
    deltaText.style.cssText = `
        background: var(--console-hover-bg);
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 0.9em;
    `;

    const totalText = document.createElement('span');
    totalText.textContent = `${cumulativeTime.toFixed(2)}ms total`;
    totalText.style.opacity = '0.6';

    timeMeta.appendChild(timeText);
    timeMeta.appendChild(deltaText);
    timeMeta.appendChild(totalText);

    // Render message content
    const messageSpan = document.createElement("div");
    messageSpan.className = "log-message";
    messageSpan.style.cssText = `
        margin-top: 2px;
        line-height: 1.4;
    `;

    const items = Array.isArray(message) ? message : [message];
    items.forEach((item, index) => {
        if (typeof item === "string" && item.trim().startsWith("<table")) {
            // Render as HTML table
            const wrapper = document.createElement("div");
            wrapper.innerHTML = item;
            messageSpan.appendChild(wrapper.firstChild);
        } else if (Array.isArray(item) && item.length > 0 && areObjectsSimilar(item)) {
            // Enhanced array of objects display
            messageSpan.appendChild(renderArrayOfObjects(item));
        } else {
            messageSpan.appendChild(renderValue(item));
            if (index < items.length - 1) {
                messageSpan.appendChild(document.createTextNode(" "));
            }
        }
    });

    logLine.appendChild(timeMeta);
    logLine.appendChild(messageSpan);
    outputEl.appendChild(logLine);
    if (autoScrollEnabled) {
        outputEl.scrollTop = outputEl.scrollHeight;
    }
}

/**
 * Checks if array items are similar objects (for compact display)
 */
function areObjectsSimilar(arr) {
    if (arr.length === 0) return false;

    // Check if all items are objects
    const allObjects = arr.every(item =>
        item !== null && typeof item === 'object' && !Array.isArray(item)
    );

    if (!allObjects) return false;

    // Check if objects have similar structure (at least 50% common keys)
    const firstKeys = Object.keys(arr[0]);
    if (firstKeys.length === 0) return false;

    const commonKeyThreshold = Math.max(1, Math.floor(firstKeys.length * 0.5));

    return arr.every(item => {
        const itemKeys = Object.keys(item);
        const commonKeys = firstKeys.filter(key => itemKeys.includes(key));
        return commonKeys.length >= commonKeyThreshold;
    });
}


/**
 * Renders array of similar objects in a collapsible format
 */
function renderArrayOfObjects(arr) {
    const container = document.createElement("div");
    container.className = "log-array-container";
    container.style.cssText = `
        border: 1px solid var(--log-table-border);
        border-radius: 6px;
        overflow: hidden;
        margin: 4px 0;
        background: var(--log-table-bg);
        transition: all 0.2s ease;
    `;

    // Main collapsible array header
    const arrayHeader = document.createElement("details");
    arrayHeader.className = "log-array-header";
    arrayHeader.style.cssText = `
        background: var(--log-table-header-bg);
        border-bottom: 1px solid var(--log-table-border);
    `;

    const arraySummary = document.createElement("summary");
    arraySummary.className = "log-array-summary";
    arraySummary.style.cssText = `
        padding: 8px 12px;
        font-weight: 600;
        color: var(--log-table-header-text);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        user-select: none;
        outline: none;
        transition: background-color 0.2s ease;
    `;

    // Add hover effect for summary
    arraySummary.addEventListener('mouseenter', () => {
        arraySummary.style.background = 'var(--console-hover-bg)';
    });

    arraySummary.addEventListener('mouseleave', () => {
        arraySummary.style.background = 'transparent';
    });

    const arrayIcon = document.createElement("span");
    // arrayIcon.textContent = "📋";
    arrayIcon.textContent = "";
    arrayIcon.style.fontSize = "11px";

    const headerText = document.createElement("span");
    headerText.textContent = `Array(${arr.length}) - Objects`;

    const copyArrayBtn = createCopyButton(arr, 'Copy entire array to clipboard', '11px');

    const expandHint = document.createElement("span");
    expandHint.className = "log-expand-hint";
    expandHint.style.cssText = `
        margin-left: auto;
        font-size: 0.8em;
        color: var(--log-expand-hint);
        font-weight: normal;
        opacity: 0.8;
    `;
    expandHint.textContent = "Click to expand";

    arraySummary.appendChild(arrayIcon);
    arraySummary.appendChild(headerText);
    arraySummary.appendChild(copyArrayBtn);
    arraySummary.appendChild(expandHint);

    // Array content container
    const arrayContent = document.createElement("div");
    arrayContent.className = "log-array-content";
    arrayContent.style.cssText = `
        padding: 8px;
        background: var(--log-table-bg);
        max-height: 400px;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: var(--console-scrollbar-thumb) var(--console-scrollbar);
    `;

    // Render each object as collapsible
    arr.forEach((obj, index) => {
        const objectContainer = document.createElement("details");
        objectContainer.className = "log-object-item";
        objectContainer.style.cssText = `
            margin-bottom: 8px;
            border: 1px solid var(--log-table-border);
            border-radius: 4px;
            background: var(--console-bg);
            transition: all 0.2s ease;
        `;

        const objectSummary = document.createElement("summary");
        objectSummary.className = "log-object-summary";
        objectSummary.style.cssText = `
            padding: 6px 10px;
            font-weight: 500;
            color: var(--console-property-color);
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            user-select: none;
            outline: none;
            background: var(--log-table-header-bg);
            border-radius: 4px 4px 0 0;
            transition: background-color 0.2s ease;
        `;

        // Add hover effect for object summary
        objectSummary.addEventListener('mouseenter', () => {
            objectSummary.style.background = 'var(--console-hover-bg)';
        });

        objectSummary.addEventListener('mouseleave', () => {
            objectSummary.style.background = 'var(--log-table-header-bg)';
        });

        const objectIcon = document.createElement("span");
        // objectIcon.textContent = "📦";
        objectIcon.textContent = "";
        objectIcon.style.fontSize = "11px";

        const objectTitle = document.createElement("span");
        objectTitle.textContent = `Object ${index + 1}`;

        const copyObjectBtn = createCopyButton(obj, 'Copy object to clipboard', '11px');

        objectSummary.appendChild(objectIcon);
        objectSummary.appendChild(objectTitle);
        objectSummary.appendChild(copyObjectBtn);

        // Object content
        const objectContent = document.createElement("div");
        objectContent.className = "log-object-content";
        objectContent.style.cssText = `
            padding: 8px 12px;
            background: var(--console-bg);
            border-top: 1px solid var(--log-table-border);
        `;

        // Render object properties
        Object.entries(obj).forEach(([key, value]) => {
            const propContainer = document.createElement("div");
            propContainer.className = "log-object-property";
            propContainer.style.cssText = `
                margin: 4px 0;
                display: flex;
                align-items: flex-start;
                gap: 8px;
                padding: 2px 4px;
                border-radius: 3px;
                transition: background-color 0.2s ease;
            `;

            // Add hover effect for properties
            propContainer.addEventListener('mouseenter', () => {
                propContainer.style.background = 'var(--console-hover-bg)';
            });

            propContainer.addEventListener('mouseleave', () => {
                propContainer.style.background = 'transparent';
            });

            const keySpan = document.createElement("span");
            keySpan.className = "log-property-key";
            keySpan.style.cssText = `
                color: var(--console-property-color);
                font-weight: 600;
                min-width: 80px;
                flex-shrink: 0;
            `;
            keySpan.textContent = key + ":";

            const valueElement = renderValue(value, 1);
            valueElement.style.flex = "1";

            propContainer.appendChild(keySpan);
            propContainer.appendChild(valueElement);
            objectContent.appendChild(propContainer);
        });

        objectContainer.appendChild(objectSummary);
        objectContainer.appendChild(objectContent);
        arrayContent.appendChild(objectContainer);
    });

    arrayHeader.appendChild(arraySummary);
    arrayHeader.appendChild(arrayContent);
    container.appendChild(arrayHeader);

    return container;
}
/**
 * Clears the output container element.
 */
export function clearOutput(outputEl) {
  outputEl.innerHTML = "";
  cumulativeTime = 0;
}

export function setConsoleAutoScroll(enabled = true) {
  autoScrollEnabled = Boolean(enabled);
}

