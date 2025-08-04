

// Global object to track performance statistics across a session.

window.__sessionStats = {
  totalAsyncTime: 0,
  asyncCallCount: 0,
  longestAsync: 0,
  shortestAsync: 0,
  totalSyncTime: 0,
  syncCallCount: 0,
  longestSync: 0,
  shortestSync: 0,
};

// Global array to store details of each asynchronous step.
window.__asyncSteps = [];

// Timestamp of the last log operation to calculate deltas.
let lastLogTime = null;

export async function runCode(editor, output) {
  // Initialization
  clearOutput(output);
  resetSessionStats();
  lastLogTime = performance.now();
  const startTime = performance.now();

  // Console Override Setup
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  console.log = (...args) => logWithTimestamp(args, output, "log");
  console.error = (...args) => logWithTimestamp(args, output, "error");
  console.warn = (...args) => logWithTimestamp(args, output, "warn");

  const code = editor.innerText;

  // Instrumentation Template
  const instrumentedCode = `
  // Define user code (so functions exist on window)
  eval(code);

  // Optionally wrap all named functions on window (no timing, just pass-through)
  const context = typeof window !== 'undefined' ? window : globalThis;
  Object.keys(context).forEach(name => {
    if (
      typeof context[name] === 'function' &&
      !name.startsWith('__')
    ) {
      const orig = context[name];
      context[name] = function(...args) {
        // Just call the original function, no timing, no stats
        return orig.apply(this, args);
      };
    }
  });
`;

  try {

    let memoryBefore, memoryAfter, memoryDelta;
    let memorySupported = !!(performance && performance.memory && performance.memory.usedJSHeapSize);
    if (memorySupported) {
      memoryBefore = performance.memory.usedJSHeapSize;
    }

    //  Execute Instrumented Code with startTime and code as arguments
    const wrappedCode = `(function(startTime, code) { 
      ${instrumentedCode} 
    })(${startTime}, \`${code.replace(/`/g, '\\`')}\`);`;
    await eval(wrappedCode);


    if (memorySupported) {
      memoryAfter = performance.memory.usedJSHeapSize;
      memoryDelta = memoryAfter - memoryBefore;
      updateMemoryUsageInUI(memoryDelta, true);
    } else {
      updateMemoryUsageInUI(0, false);
    }


    // Log Execution Statistics
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    // console.log('Code executed in', executionTime.toFixed(2), 'ms');

    // Update UI with Analysis
    const analysis = analyzeCode(code);
    updateSummaryBarWithAnalysis(analysis, executionTime);


  } catch (err) {
    // Error Handling
    console.error('Error executing code:', err);
    const errorTime = performance.now() - startTime;
    const analysis = analyzeCode(code);
    updateSummaryBarWithAnalysis(analysis, errorTime);
    logOutput([`❌ ${err.message}`], output, 0, "error");
  } finally {
    // Cleanup
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;
  }
}

/**
 * Resets the session statistics and async steps for a new run.
 */
function resetSessionStats() {
  window.__asyncSteps = [];
  window.__sessionStats = {
    totalAsyncTime: 0,
    asyncCallCount: 0,
    longestAsync: 0,
    shortestAsync: 0,
    totalSyncTime: 0,
    syncCallCount: 0,
    longestSync: 0,
    shortestSync: 0,
  };
}

/**
 * Wrapper for logging to calculate time delta since last log.
 */
function logWithTimestamp(args, output, type) {
  const now = performance.now();
  const delta = now - lastLogTime;
  lastLogTime = now;
  logOutput(args, output, delta, type);
}



let cumulativeTime = 0;

/**
 * Clears the output container element.
 */
export function clearOutput(outputEl) {
  outputEl.innerHTML = "";
  cumulativeTime = 0;
}

/**
 * Logs a message to the output container with appropriate styling. This function
 * is called during execution for real-time output.
 */
export function logOutput(message, outputEl, delta = 0, type = "log") {
  cumulativeTime += delta;

  const logLine = document.createElement("div");
  logLine.className = `console-log console-${type}`;
  // Basic styles can be moved to CSS
  logLine.style.cssText = `
        display: flex;
        flex-direction: column;
        margin-bottom: 4px;
        padding: 6px 10px;
        font-family: monospace;
        border-left: 4px solid;
    `;

  // Style based on log type
  const typeStyles = {
    error: { border: "red", bg: "#2d0000", color: "#ff6b6b" },
    warn: { border: "orange", bg: "#332100", color: "#ffd166" },
    log: { border: "lightgreen", bg: "#111", color: "white" },
  };
  const style = typeStyles[type] || typeStyles.log;
  logLine.style.borderColor = style.border;
  logLine.style.background = style.bg;
  logLine.style.color = style.color;

  // Meta timestamp
  const timeMeta = document.createElement("div");
  timeMeta.style.fontSize = "0.8em";
  timeMeta.style.color = "#888";
  timeMeta.textContent = `[${new Date().toLocaleTimeString()}] +${delta.toFixed(
    2
  )}ms | ${cumulativeTime.toFixed(2)}ms total`;

  // Render message content
  const messageSpan = document.createElement("div");
  messageSpan.className = "log-message";
  messageSpan.style.marginTop = "2px";

  const items = Array.isArray(message) ? message : [message];
  items.forEach((item) => {
    messageSpan.appendChild(renderValue(item));
    messageSpan.appendChild(document.createTextNode(" "));
  });

  logLine.appendChild(timeMeta);
  logLine.appendChild(messageSpan);
  outputEl.appendChild(logLine);
  outputEl.scrollTop = outputEl.scrollHeight; // Auto-scroll
}

/**
 * Renders a JavaScript value into a DOM element with appropriate formatting.
 */
function renderValue(val) {
  const type = typeof val;

  if (val && type === "object") {
    const details = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = Array.isArray(val) ? `Array(${val.length})` : "Object";
    summary.style.cursor = "pointer";
    summary.style.color = "#0ff";

    const pre = document.createElement("pre");
    pre.textContent = JSON.stringify(val, null, 2);
    pre.style.cssText = "white-space: pre-wrap; margin-top: 4px; color: #ccc;";

    details.appendChild(summary);
    details.appendChild(pre);
    return details;
  }

  // Primitives
  const span = document.createElement("span");
  span.textContent = formatValue(val);
  span.style.color = getTypeColor(type);
  return span;
}

/**
 * Formats a primitive value for display.
 */
function formatValue(val) {
  if (typeof val === "string") return `"${val}"`;
  try {
    return JSON.stringify(val);
  } catch {
    return String(val);
  }
}

/**
 * Returns a color based on the JavaScript data type.
 */
function getTypeColor(type) {
  const colors = {
    number: "#f9c74f",
    string: "#90be6d",
    boolean: "#f94144",
    undefined: "#ccc",
    function: "#577590",
    object: "#00b4d8",
    default: "#fff",
  };
  return colors[type] || colors.default;
}



/**
 * Displays a single, consolidated table of all execution statistics.
 * @param {HTMLElement} outputEl - The output element to append the table to
 * @param {number} totalExecTime - Total execution time in milliseconds
 */
function logStatsTable(outputEl, totalExecTime) {
  // 1. --- Extract session stats with defaults ---
  const {
    totalAsyncTime = 0,
    asyncCallCount = 0,
    longestAsync = 0,
    shortestAsync = 0,
    totalSyncTime = 0,
    syncCallCount = 0,
    longestSync = 0,
    shortestSync = 0,
    functionTimings = {}
  } = window.__sessionStats || {};

  const steps = window.__asyncSteps || [];
  const functionCalls = Object.entries(functionTimings);

  // 2. --- Helper function to create table rows ---
  const createStatRow = (label, value, unit = "ms") => {
    const numericValue = parseFloat(value);
    const color = getTimeColor(numericValue, unit);
    return `
      <tr>
        <td style="padding: 2px 16px;">${label}</td>
        <td style="padding: 2px 16px; text-align: right; color: ${color}; font-weight: bold;">
          ${numericValue.toFixed(2)} ${unit}
        </td>
      </tr>`;
  };

  // Helper to get color based on time value
  const getTimeColor = (value, unit) => {
    if (unit !== "ms" || isNaN(value)) return "#ccc";
    return value < 100 ? "#a6e22e" : value < 300 ? "#f6c343" : "#ff6b6b";
  };

  // 3. --- Performance Insights Section ---
  let performanceInsights = '';

  // Find slowest and fastest functions
  if (functionCalls.length > 0) {
    const syncCalls = functionCalls.filter(([_, times]) => times.every(t => !t.async));
    const asyncCalls = functionCalls.filter(([_, times]) => times.some(t => t.async));

    const slowestCall = functionCalls.flatMap(([name, times]) =>
        times.map(t => ({
          name,
          duration: t.end - t.start,
          async: t.async
        }))
    ).sort((a, b) => b.duration - a.duration)[0];

    const fastestSync = syncCalls.flatMap(([name, times]) =>
        times.filter(t => !t.async).map(t => ({
          name,
          duration: t.end - t.start
        })))
        .sort((a, b) => a.duration - b.duration)[0];

    const fastestAsync = asyncCalls.flatMap(([name, times]) =>
        times.filter(t => t.async).map(t => ({
          name,
          duration: t.end - t.start
        })))
        .sort((a, b) => a.duration - b.duration)[0];

    performanceInsights = `
      <div style="margin: 12px 0; padding: 12px; background: #2a2a2a; border-radius: 4px;">
        <div style="font-weight: bold; margin-bottom: 8px; color: #61dafb;">📉 Performance Insights:</div>
        ${slowestCall ? `<div>🐢 <b>Slowest Call</b>: ${slowestCall.name} → ${slowestCall.duration.toFixed(2)}ms</div>` : ''}
        ${fastestSync ? `<div>⚡ <b>Fastest Sync</b>: ${fastestSync.name} → ${fastestSync.duration.toFixed(2)}ms</div>` : ''}
        ${fastestAsync ? `<div>⚡ <b>Fastest Async</b>: ${fastestAsync.name} → ${fastestAsync.duration.toFixed(2)}ms</div>` : ''}
      </div>`;
  }

  // 4. --- Build the HTML for the table ---
  let tableHTML = `
    <div style="margin-top: 1.5em; border-top: 2px solid #555; padding: 8px 0; color: #ccc;">
      ${performanceInsights}
      <table style="width: 100%; font-size: 14px; color: #ccc; border-collapse: collapse;">
        <tbody>`;

  // --- Total Execution Time ---
  tableHTML += `
      <tr>
        <td style="padding: 8px; font-weight: bold; font-size: 1.1em; border-bottom: 1px solid #444;">⏱️ Total Execution Time</td>
        <td style="padding: 8px; font-weight: bold; font-size: 1.1em; color: ${getTimeColor(totalExecTime, 'ms')}; border-bottom: 1px solid #444; text-align: right;">
          ${totalExecTime.toFixed(2)} ms
        </td>
      </tr>`;

  // --- Async Steps Section ---
  if (steps.length > 0) {
    tableHTML += `
      <tr>
        <td colspan="2" style="padding: 12px 8px 4px; font-weight: bold;">
          🦀 Async Steps Breakdown
        </td>
      </tr>`;

    const maxDuration = Math.max(...steps.map((s) => parseFloat(s.duration))) || 1;
    steps.forEach((step, i) => {
      const duration = parseFloat(step.duration);
      const isSlow = duration > 100;
      const barWidth = Math.min((duration / maxDuration) * 100, 100);

      tableHTML += `
        <tr>
          <td style="padding: 2px 16px;">
            <span style="color: ${isSlow ? "#ff6b6b" : "#ccc"};">
              #${i + 1} @ ${step.start}ms → <b>${step.label}</b> (${step.duration}ms) ${isSlow ? "⚠️" : ""}
            </span>
          </td>
          <td style="padding: 2px 16px; text-align: right;">
            <div style="background: #555; width: 100px; height: 10px; display: inline-block; border-radius: 3px; overflow: hidden;">
              <div style="background: #61dafb; width: ${barWidth}%; height: 100%;"></div>
            </div>
          </td>
        </tr>`;
    });
  }

  // --- Session Stats Section ---
  const avgAsync = asyncCallCount ? totalAsyncTime / asyncCallCount : 0;
  const avgSync = syncCallCount ? totalSyncTime / syncCallCount : 0;

  tableHTML += `
    <tr>
      <td colspan="2" style="padding: 12px 8px 4px; font-weight: bold;">
        📊 Execution Statistics
      </td>
    </tr>`;

  // Async Stats
  tableHTML += `
    <tr>
      <td colspan="2" style="padding: 4px 16px; font-weight: bold; color: #61dafb;">
        Asynchronous Operations
      </td>
    </tr>`;

  tableHTML += createStatRow("Total Time", totalAsyncTime, "ms");
  tableHTML += createStatRow("Average Time", avgAsync, "ms");
  tableHTML += createStatRow("Longest Operation", longestAsync, "ms");
  tableHTML += createStatRow("Shortest Operation", shortestAsync, "ms");
  tableHTML += createStatRow("Total Calls", asyncCallCount, "");

  // Sync Stats
  tableHTML += `
    <tr>
      <td colspan="2" style="padding: 12px 16px 4px; font-weight: bold; color: #97e630;">
        Synchronous Operations
      </td>
    </tr>`;

  tableHTML += createStatRow("Total Time", totalSyncTime, "ms");
  tableHTML += createStatRow("Average Time", avgSync, "ms");
  tableHTML += createStatRow("Longest Operation", longestSync, "ms");
  tableHTML += createStatRow("Shortest Operation", shortestSync, "ms");
  tableHTML += createStatRow("Total Calls", syncCallCount, "");

  // Close table and container
  tableHTML += `
        </tbody>
      </table>
    </div>`;

  // 5. --- Create and append the stats element ---
  const statsElement = document.createElement("div");
  statsElement.className = "execution-stats";
  statsElement.style.marginTop = "1em";
  statsElement.style.padding = "12px";
  statsElement.style.borderRadius = "4px";
  statsElement.style.backgroundColor = "#1e1e1e";
  statsElement.innerHTML = tableHTML;

  outputEl.appendChild(statsElement);
  outputEl.scrollTop = outputEl.scrollHeight;
}

/**
 * Analyzes the code to count functions, loops, and async operations
 * @param {string} code - The source code to analyze
 * @returns {Object} An object containing the analysis results
 */
function analyzeCode(code) {
  // Count functions (including arrow functions, function declarations, and methods)
  const functionCount = (code.match(/\bfunction\s+\w+\s*\(|\bconst\s+\w+\s*=\s*[^=]*=>|\b\w+\s*\([^)]*\)\s*=>/g) || []).length;

  // Count loops (for, while, do-while, for...in, for...of)
  const loopCount = (code.match(/\b(for|while|do\s*\{)/g) || []).length;

  // Count async operations (await, Promise, fetch, setTimeout, setInterval)
  const asyncCount = (code.match(/\b(await|Promise\.|fetch\s*\(|setTimeout\s*\(|setInterval\s*\()/g) || []).length;

  return {
    functions: functionCount,
    loops: loopCount,
    asyncOps: asyncCount
  };
}

/**
 * Updates the summary bar with code analysis results and execution time
 * @param {Object} analysis - The analysis results from analyzeCode
 * @param {number} [executionTime=0] - Total execution time in milliseconds
 */
function updateSummaryBarWithAnalysis(analysis, executionTime = 0) {
  const summaryElement = document.getElementById('summary-icons');
  const execTimeElement = document.getElementById('exec-time');

  if (summaryElement) {
    summaryElement.innerHTML = `🧩 ${analysis.functions} func | 🔁 ${analysis.loops} loops | ⏳ ${analysis.asyncOps} async`;
  }

  if (execTimeElement) {
    const timeColor = executionTime < 100 ? "#a6e22e" : executionTime < 300 ? "#f6c343" : "#ff6b6b";
    execTimeElement.innerHTML = `⏱️ Total Time: <span style="color: ${timeColor}">${executionTime.toFixed(2)} ms</span>`;
  }
}

function updateMemoryUsageInUI(memoryDelta, supported = true) {
  let memElem = document.getElementById("memory-usage");
  if (!memElem) {
    memElem = document.createElement("div");
    memElem.id = "memory-usage";
    memElem.style.marginTop = "8px";
    memElem.style.fontSize = "14px";
    memElem.style.color = "#7c3aed";
    const summaryBar = document.getElementById("summary-bar");
    if (summaryBar && summaryBar.parentNode) {
      summaryBar.parentNode.insertBefore(memElem, summaryBar.nextSibling);
    } else {
      document.body.appendChild(memElem);
    }
  }
  if (!supported) {
    memElem.textContent = " Memory usage measurement is not supported in this browser.";
  } else {
    memElem.textContent =
        " Approximate memory used by code: " +
        (memoryDelta / 1024).toFixed(2) +
        " KB";
  }
}
