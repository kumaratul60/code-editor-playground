/**
 * =============================================================================
 * SECTION 1: GLOBAL STATE AND INITIALIZATION
 *
 * Manages the global state for tracking asynchronous operations and session
 * statistics across multiple code executions.
 * =============================================================================
 */

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

/**
 * =============================================================================
 * SECTION 2: CORE EXECUTION LOGIC
 *
 * The main `runCode` function that takes code from an editor, instruments it
 * for performance tracking, executes it, and logs the output.
 * =============================================================================
 */

export async function runCode(editor, output) {
  // 1. --- Execution Setup ---
  clearOutput(output);
  resetSessionStats();
  lastLogTime = performance.now();
  const startTime = performance.now();

  // 2. --- Console Overriding ---
  // Hijack console methods to provide custom logging with timestamps.
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  console.log = (...args) => logWithTimestamp(args, output, "log");
  console.error = (...args) => logWithTimestamp(args, output, "error");
  console.warn = (...args) => logWithTimestamp(args, output, "warn");

  // 3. --- Code Instrumentation ---
  // Wrap the user's code to intercept and time `await` calls.
  const code = editor.innerText;
  const instrumentedCode = `
    (async () => {
      const await_ = async (p) => {
        const start = performance.now();
        const res = await p;
        const end = performance.now();
        const duration = end - start;

        window.__asyncSteps.push({
          start: (start - ${startTime}).toFixed(2),
          duration: duration.toFixed(2)
        });

        window.__sessionStats.totalAsyncTime += duration;
        window.__sessionStats.asyncCallCount += 1;
        window.__sessionStats.longestAsync = Math.max(window.__sessionStats.longestAsync, duration);

        return res;
      };
      ${code}
    })()
  `;

  // 4. --- Execution and Finalization ---
  try {
    await eval(instrumentedCode);
  } catch (err) {
    logOutput([`❌ ${err.message}`], output, 0, "error");
  } finally {
    // Restore original console functions
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;

    // Calculate final execution time
    const endTime = performance.now();
    const lastExecTime = endTime - startTime;

    // Log the consolidated statistics table at the very end
    logStatsTable(output, lastExecTime);
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

/**
 * =============================================================================
 * SECTION 3: OUTPUT AND LOGGING UTILITIES
 *
 * Functions responsible for clearing and rendering formatted output to the DOM.
 * This includes handling different data types and styling log messages.
 * =============================================================================
 */

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
 * =============================================================================
 * SECTION 4: CONSOLIDATED STATISTICS REPORTING
 *
 * A single function to display the final, consolidated statistics table
 * after the code execution has finished.
 * =============================================================================
 */

/**
 * Displays a single, consolidated table of all execution statistics.
 */
function logStatsTable(outputEl, totalExecTime) {
  // 1. --- Gather Stats ---
  const {
    totalAsyncTime = 0,
    asyncCallCount = 0,
    longestAsync = 0,
    shortestAsync = 0,
    totalSyncTime = 0,
    syncCallCount = 0,
    longestSync = 0,
    shortestSync = 0,
  } = window.__sessionStats || {};
  const steps = window.__asyncSteps || [];

  // 2. --- Helper function to create table rows ---
  const createStatRow = (label, value, unit = "ms") => {
    const numericValue = parseFloat(value);
    // Colorize only if the value is a time in milliseconds
    const color =
      unit !== "ms" || isNaN(numericValue)
        ? "#ccc"
        : numericValue < 100
        ? "#a6e22e"
        : numericValue < 300
        ? "#f6c343"
        : "#ff6b6b";

    return `
      <tr>
        <td style="padding: 2px 16px;">${label}</td>
        <td style="padding: 2px 16px; text-align: right; color: ${color}; font-weight: bold;">
          ${numericValue.toFixed(2)} ${unit}
        </td>
      </tr>`;
  };

  // 3. --- Build the HTML for the table ---
  let tableHTML = `
    <div style="margin-top: 1.5em; border-top: 2px solid #555; padding: 8px 0; color: #ccc;">
      <table style="width: 100%; font-size: 14px; color: #ccc; border-collapse: collapse;">
        <tbody>`;

  // --- Total Execution Time ---
  const totalTimeColor =
    totalExecTime < 100 ? "#a6e22e" : totalExecTime < 300 ? "#f6c343" : "#ff6b6b";
  tableHTML += `
      <tr>
        <td style="padding: 8px; font-weight: bold; font-size: 1.1em; border-bottom: 1px solid #444;">⏱️ Total Execution Time</td>
        <td style="padding: 8px; font-weight: bold; font-size: 1.1em; color: ${totalTimeColor}; border-bottom: 1px solid #444; text-align: right;">
          ${totalExecTime.toFixed(2)} ms
        </td>
      </tr>`;

  // --- Async Steps Section ---
  if (steps.length > 0) {
    tableHTML += `<tr><td colspan="2" style="padding: 12px 8px 4px; font-weight: bold;">🦀 Async Steps Breakdown</td></tr>`;
    const maxDuration = Math.max(...steps.map((s) => parseFloat(s.duration))) || 1;
    steps.forEach((step, i) => {
      const duration = parseFloat(step.duration);
      const isSlow = duration > 100;
      const barWidth = Math.min((duration / maxDuration) * 100, 100);
      tableHTML += `
        <tr>
          <td style="padding: 2px 16px;">
            <span style="color: ${isSlow ? "#ff6b6b" : "#ccc"};">#${i + 1} @ ${step.start}ms (${
        step.duration
      }ms) ${isSlow ? "⚠️" : ""}</span>
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
  tableHTML += `<tr><td colspan="2" style="padding: 12px 8px 4px; font-weight: bold;">📊 Session Statistics</td></tr>`;
  const avgAsync = asyncCallCount ? totalAsyncTime / asyncCallCount : 0;
  const avgSync = syncCallCount ? totalSyncTime / syncCallCount : 0;

  tableHTML += `<tr><td colspan="2" style="padding: 4px 16px; font-weight: bold; color: #61dafb;">Async</td></tr>`;
  tableHTML += createStatRow("Total Async Time", totalAsyncTime, "ms");
  tableHTML += createStatRow("Average Async", avgAsync, "ms");
  tableHTML += createStatRow("Longest Async", longestAsync, "ms");
  tableHTML += createStatRow("Async Calls", asyncCallCount, "");

  tableHTML += `<tr><td colspan="2" style="padding: 8px 16px 4px; font-weight: bold; color: #dcdcdc;">Sync</td></tr>`;
  tableHTML += createStatRow("Total Sync Time", totalSyncTime, "ms");
  tableHTML += createStatRow("Average Sync", avgSync, "ms");
  tableHTML += createStatRow("Longest Sync", longestSync, "ms");
  tableHTML += createStatRow("Sync Calls", syncCallCount, "");

  // --- Close table and container ---
  tableHTML += `
        </tbody>
      </table>
    </div>`;

  // 4. --- Append to DOM ---
  const container = document.createElement("div");
  container.innerHTML = tableHTML;
  outputEl.appendChild(container);
  outputEl.scrollTop = outputEl.scrollHeight; // Auto-scroll
}
