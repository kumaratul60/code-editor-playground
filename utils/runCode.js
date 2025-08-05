import {renderValue} from "./logOutputUtils.js";
import {updateSummaryBarWithAnalysis} from "../devInsights/updateSummaryBarWithAnalysis.js";
import {analyzeCode} from "../devInsights/analyzedCode.js";
import {executionTracker} from "../devInsights/executionTracker.js";


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

  // Reset execution tracker for new run
  executionTracker.reset();

  lastLogTime = performance.now();
  const startTime = performance.now();

  // Console Override Setup
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalTable = console.table;
  const originalTime = console.time;
  const originalTimeEnd = console.timeEnd;

  const timeLabels = {};


  console.log = (...args) => logWithTimestamp(args, output, "log");
  console.error = (...args) => logWithTimestamp(args, output, "error");
  console.warn = (...args) => logWithTimestamp(args, output, "warn");

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

    // Determine columns
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

    // Header
    html += '<tr>';
    html += '<th style="border:1px solid #444;padding:2px 8px;background:#222;color:#f6c343;">(index)</th>';
    keys.forEach(k => {
      html += `<th style="border:1px solid #444;padding:2px 8px;background:#222;color:#f6c343;">${k}</th>`;
    });
    html += '</tr>';

    // Rows
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
    console.table = originalTable;
    console.time = originalTime;
    console.timeEnd = originalTimeEnd;
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
    // messageSpan.appendChild(renderValue(item));
    // messageSpan.appendChild(document.createTextNode(" "));
    if (typeof item === "string" && item.trim().startsWith("<table")) {
      // Render as HTML table
      const wrapper = document.createElement("div");
      wrapper.innerHTML = item;
      messageSpan.appendChild(wrapper.firstChild);
    } else {
      messageSpan.appendChild(renderValue(item));
      messageSpan.appendChild(document.createTextNode(" "));
    }
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








