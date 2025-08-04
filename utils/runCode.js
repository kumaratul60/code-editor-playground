import {renderValue} from "./logOutputUtils.js";
import {analyzeCode,updateSummaryBarWithAnalysis} from "./updateSummaryBarWithAnalysis.js";


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



    //  Execute Instrumented Code with startTime and code as arguments
    const wrappedCode = `(function(startTime, code) { 
      ${instrumentedCode} 
    })(${startTime}, \`${code.replace(/`/g, '\\`')}\`);`;
    await eval(wrappedCode);


    // Log Execution Statistics
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    // console.log('Code executed in', executionTime.toFixed(2), 'ms');

    // Update UI with Analysis
    const analysis = analyzeCode(code);
    updateSummaryBarWithAnalysis(analysis, executionTime,code);

  } catch (err) {
    // Error Handling
    // console.error('Error executing code:', err);
    const errorTime = performance.now() - startTime;
    const analysis = analyzeCode(code);
    updateSummaryBarWithAnalysis(analysis, errorTime,code);
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
 * Clears the output container element.
 */
export function clearOutput(outputEl) {
  outputEl.innerHTML = "";
  cumulativeTime = 0;
}








