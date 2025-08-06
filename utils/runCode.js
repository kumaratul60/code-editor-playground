import {renderValue} from "./logOutputUtils.js";
import {updateSummaryBarWithAnalysis} from "../devInsights/updateSummaryBarWithAnalysis.js";
import {analyzeCode} from "../devInsights/analyzedCode.js";

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

    console.log = (...args) => logWithTimestamp(args, output, "log");
    console.error = (...args) => logWithTimestamp(args, output, "error");
    console.warn = (...args) => logWithTimestamp(args, output, "warn");
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
            logWithTimestamp([`${label}: ${duration} ms`], output, "log");
            delete timeLabels[label];
        } else {
            logWithTimestamp([`${label}: no such label`], output, "log");
        }
    };

    console.table = (data, columns) => {
        let html = '<table style="border-collapse:collapse;margin:6px 0 12px 0;font-size:13px;">';
        let keys = [];

        if (Array.isArray(data)) {
            if (data.length === 0) {
                logWithTimestamp(['[empty table]'], output, "log");
                return;
            }
            keys = columns || Object.keys(data[0]);
        } else if (typeof data === "object" && data !== null) {
            keys = columns || Object.keys(data);
            data = [data];
        } else {
            logWithTimestamp([String(data)], output, "log");
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
        logWithTimestamp([html], output, "log");
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
      console.error('Async execution error:', err.message);
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
    // Initialize execution
    const startTime = initializeExecution(output);

    // Setup console overrides (self-contained timing)
    const originalConsole = setupConsoleOverrides(output);

    try {
        const code = editor.innerText;
        if (!performSafetyChecks(code, output)) return;
        await executeCodeSafely(code);

        const executionTime = performance.now() - startTime;
        window.lastExecutionTime = executionTime

        // Success path - update UI
        const analysis = analyzeCode(code);
        updateSummaryBarWithAnalysis(analysis, executionTime, code);
    } catch (err) {
        handleExecutionError(err, startTime, editor.innerText, output);
    } finally {
        restoreConsole(originalConsole); // Always cleanup
    }
}

// === LOGGING FUNCTIONS ===

let cumulativeTime = 0;

/**
 * Logs a message to the output container with appropriate styling. This function
 * is called during execution for real-time output.
 */

export function logOutput(message, outputEl, delta = 0, type = "log") {
    cumulativeTime += delta;

    const logLine = document.createElement("div");
    logLine.className = `console-log console-${type}`;
    logLine.style.cssText = `
        display: flex;
        flex-direction: column;
        margin-bottom: 6px;
        padding: 8px 12px;
        font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
        border-left: 4px solid;
        border-radius: 4px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    `;

    // Style based on log type
    const typeStyles = {
        error: { border: "#ff6b6b", bg: "#2d0000", color: "#ff6b6b" },
        warn: { border: "#ffd166", bg: "#332100", color: "#ffd166" },
        log: { border: "#4ecdc4", bg: "#0a0a0a", color: "#ffffff" },
        info: { border: "#74c0fc", bg: "#001a2e", color: "#74c0fc" },
        debug: { border: "#9775fa", bg: "#1a0d2e", color: "#9775fa" },
    };

    const style = typeStyles[type] || typeStyles.log;
    logLine.style.borderColor = style.border;
    logLine.style.background = style.bg;
    logLine.style.color = style.color;

    // Meta timestamp
    const timeMeta = document.createElement("div");
    timeMeta.style.cssText = `
    font-size: 0.75em;
    color: #666;
    margin-bottom: 4px;
    font-weight: 500;
  `;
    timeMeta.textContent = `[${new Date().toLocaleTimeString()}] +${delta.toFixed(2)}ms | ${cumulativeTime.toFixed(2)}ms total`;

    // Render message content
    const messageSpan = document.createElement("div");
    messageSpan.className = "log-message";
    messageSpan.style.marginTop = "2px";

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
    outputEl.scrollTop = outputEl.scrollHeight; // Auto-scroll
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
    container.style.cssText = `
    border: 1px solid #333;
    border-radius: 6px;
    overflow: hidden;
    margin: 4px 0;
    background: #1a1a1a;
  `;

    // Main collapsible array header
    const arrayHeader = document.createElement("details");
    arrayHeader.style.cssText = `
    background: #2a2a2a;
    border-bottom: 1px solid #333;
  `;

    const arraySummary = document.createElement("summary");
    arraySummary.style.cssText = `
    padding: 8px 12px;
    font-weight: 600;
    color: #4ecdc4;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    user-select: none;
    outline: none;
  `;

    const arrayIcon = document.createElement("span");
    arrayIcon.textContent = "📋";
    arrayIcon.style.fontSize = "14px";

    const headerText = document.createElement("span");
    headerText.textContent = `Array(${arr.length}) - Objects`;

    const expandHint = document.createElement("span");
    expandHint.style.cssText = `
    margin-left: auto;
    font-size: 0.8em;
    color: #666;
    font-weight: normal;
  `;
    expandHint.textContent = "Click to expand";

    arraySummary.appendChild(arrayIcon);
    arraySummary.appendChild(headerText);
    arraySummary.appendChild(expandHint);

    // Array content container
    const arrayContent = document.createElement("div");
    arrayContent.style.cssText = `
    padding: 8px;
    background: #1a1a1a;
    max-height: 400px;
    overflow-y: auto;
  `;

    // Render each object as collapsible
    arr.forEach((obj, index) => {
        const objectContainer = document.createElement("details");
        objectContainer.style.cssText = `
      margin-bottom: 8px;
      border: 1px solid #333;
      border-radius: 4px;
      background: #222;
    `;

        const objectSummary = document.createElement("summary");
        objectSummary.style.cssText = `
      padding: 6px 10px;
      font-weight: 500;
      color: #f9c74f;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      user-select: none;
      outline: none;
      background: #2a2a2a;
      border-radius: 4px 4px 0 0;
    `;

        const objectIcon = document.createElement("span");
        objectIcon.textContent = "📦";
        objectIcon.style.fontSize = "12px";

        const objectTitle = document.createElement("span");
        objectTitle.textContent = `Object [${index}]`;

        // Show a preview of key properties
        const keys = Object.keys(obj);
        const previewKeys = keys.slice(0, 3);
        const preview = previewKeys.map(key => {
            const value = obj[key];
            let displayValue = "";
            if (typeof value === "string") {
                displayValue = `"${value.length > 15 ? value.substring(0, 15) + "..." : value}"`;
            } else if (typeof value === "number") {
                displayValue = value.toString();
            } else if (typeof value === "boolean") {
                displayValue = value.toString();
            } else if (value === null) {
                displayValue = "null";
            } else if (value === undefined) {
                displayValue = "undefined";
            } else {
                displayValue = Array.isArray(value) ? `Array(${value.length})` : "Object";
            }
            return `${key}: ${displayValue}`;
        }).join(", ");

        const previewText = document.createElement("span");
        previewText.style.cssText = `
      margin-left: auto;
      font-size: 0.75em;
      color: #888;
      font-weight: normal;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    `;
        previewText.textContent = `{ ${preview}${keys.length > 3 ? ", ..." : ""} }`;

        objectSummary.appendChild(objectIcon);
        objectSummary.appendChild(objectTitle);
        objectSummary.appendChild(previewText);

        // Object content
        const objectContent = document.createElement("div");
        objectContent.style.cssText = `
      padding: 8px 12px;
      background: #1a1a1a;
      border-top: 1px solid #333;
    `;

        // Render object properties
        Object.entries(obj).forEach(([key, value]) => {
            const propRow = document.createElement("div");
            propRow.style.cssText = `
        display: flex;
        align-items: flex-start;
        margin-bottom: 4px;
        padding: 4px 0;
        border-bottom: 1px solid #2a2a2a;
      `;

            const keySpan = document.createElement("span");
            keySpan.style.cssText = `
        color: #4ecdc4;
        font-weight: 500;
        min-width: 100px;
        margin-right: 12px;
        font-size: 0.9em;
      `;
            keySpan.textContent = key + ":";

            const valueSpan = document.createElement("span");
            valueSpan.style.cssText = `
        flex: 1;
        font-size: 0.9em;
        word-break: break-word;
      `;

            // Style value based on type
            if (typeof value === "string") {
                valueSpan.style.color = "#90be6d";
                valueSpan.textContent = `"${value}"`;
            } else if (typeof value === "number") {
                valueSpan.style.color = "#f9c74f";
                valueSpan.textContent = value.toString();
            } else if (typeof value === "boolean") {
                valueSpan.style.color = "#f8961e";
                valueSpan.textContent = value.toString();
            } else if (value === null) {
                valueSpan.style.color = "#666";
                valueSpan.textContent = "null";
            } else if (value === undefined) {
                valueSpan.style.color = "#666";
                valueSpan.textContent = "undefined";
            } else if (Array.isArray(value)) {
                valueSpan.style.color = "#4ecdc4";
                valueSpan.textContent = `Array(${value.length})`;
            } else if (typeof value === "object") {
                valueSpan.style.color = "#4ecdc4";
                valueSpan.textContent = "Object";
            } else {
                valueSpan.style.color = "#ccc";
                valueSpan.textContent = String(value);
            }

            propRow.appendChild(keySpan);
            propRow.appendChild(valueSpan);
            objectContent.appendChild(propRow);
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










