// Global session tracking
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

let lastLogTime = null;
window.__asyncSteps = [];

export async function runCode(editor, output) {
  clearOutput(output);

  // Add this block to fully reset session stats before each run:
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

  const code = editor.innerText;
  output.innerHTML = "";
  lastLogTime = performance.now();
  window.__asyncSteps = [];

  const startTime = performance.now();

  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  console.log = (...args) => {
    const now = performance.now();
    const delta = now - lastLogTime;
    lastLogTime = now;
    logOutput(args, output, delta, "log");
  };

  console.error = (...args) => {
    const now = performance.now();
    const delta = now - lastLogTime;
    lastLogTime = now;
    logOutput(args, output, delta, "error");
  };

  console.warn = (...args) => {
    const now = performance.now();
    const delta = now - lastLogTime;
    lastLogTime = now;
    logOutput(args, output, delta, "warn");
  };

  // Instrumented code with async tracking
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

  try {
    await eval(instrumentedCode);
  } catch (err) {
    logOutput([`❌ ${err.message}`], output, 0, true);
  } finally {
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;

    const endTime = performance.now();
    const lastExecTime = endTime - startTime;
    window.__sessionStats.lastExecTime = lastExecTime;
    window.__sessionStats.totalExecTime += lastExecTime;

    // logSummary({ total, syncTime, asyncTime }, output);
    logSummary({ total: lastExecTime }, output);
    logAsyncSteps(output);
    logSessionStats(output);
  }
}

let cumulativeTime = 0;

export function clearOutput(outputEl) {
  outputEl.innerHTML = "";
  cumulativeTime = 0;
}

export function logOutput(message, outputEl, delta = 0, type = "log") {
  cumulativeTime += delta;

  const logLine = document.createElement("div");
  logLine.className = "console-log";
  logLine.style.display = "flex";
  logLine.style.flexDirection = "column";
  logLine.style.marginBottom = "4px";
  logLine.style.padding = "6px 10px";
  logLine.style.fontFamily = "monospace";

  // Style based on log type
  if (type === "error") {
    logLine.style.borderLeft = "4px solid red";
    logLine.style.background = "#2d0000";
    logLine.style.color = "#ff6b6b";
  } else if (type === "warn") {
    logLine.style.borderLeft = "4px solid orange";
    logLine.style.background = "#332100";
    logLine.style.color = "#ffd166";
  } else {
    logLine.style.borderLeft = "4px solid lightgreen";
    logLine.style.background = "#111";
    logLine.style.color = "white";
  }

  // Meta timestamp
  const timeMeta = document.createElement("div");
  timeMeta.style.fontSize = "0.8em";
  timeMeta.style.color = "#888";
  const nowStr = new Date().toLocaleTimeString();
  const deltaStr = `+${delta.toFixed(2)}ms`;
  const totalStr = `${cumulativeTime.toFixed(2)}ms total`;
  timeMeta.textContent = `[${nowStr}] ${deltaStr} | ${totalStr}`;

  // Render message
  const messageSpan = document.createElement("div");
  messageSpan.className = "log-message";
  messageSpan.style.marginTop = "2px";

  if (Array.isArray(message)) {
    message.forEach((item, i) => {
      messageSpan.appendChild(renderValue(item));
      messageSpan.appendChild(document.createTextNode(" "));
    });
  } else {
    messageSpan.appendChild(renderValue(message));
  }

  logLine.appendChild(timeMeta);
  logLine.appendChild(messageSpan);
  outputEl.appendChild(logLine);
  outputEl.scrollTop = outputEl.scrollHeight;
}

function renderValue(val) {
  const type = typeof val;

  if (val && type === "object") {
    const details = document.createElement("details");
    details.style.marginTop = "4px";
    const summary = document.createElement("summary");
    summary.textContent = Array.isArray(val) ? `Array(${val.length})` : "Object";
    summary.style.cursor = "pointer";
    summary.style.color = "#0ff";

    const pre = document.createElement("pre");
    pre.textContent = JSON.stringify(val, null, 2);
    pre.style.whiteSpace = "pre-wrap";
    pre.style.marginTop = "4px";
    pre.style.color = "#ccc";

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

function formatValue(val) {
  if (typeof val === "string") return `"${val}"`;
  try {
    return JSON.stringify(val);
  } catch {
    return String(val);
  }
}

function getTypeColor(type) {
  switch (type) {
    case "number":
      return "#f9c74f";
    case "string":
      return "#90be6d";
    case "boolean":
      return "#f94144";
    case "undefined":
      return "#ccc";
    case "function":
      return "#577590";
    case "object":
      return "#00b4d8";
    default:
      return "#fff";
  }
}

function logSummary({ total, syncTime, asyncTime }, outputEl) {
  const summaryDiv = document.createElement("div");
  summaryDiv.style.marginTop = "1em";
  summaryDiv.style.padding = "8px";
  summaryDiv.style.borderTop = "1px solid #ccc";
  summaryDiv.style.color = "#ccc";

  //   summaryDiv.innerHTML = `
  //     <div><strong>⏱ Total Execution:</strong> ${total} ms</div>
  //     <div><strong>⚡ Sync:</strong> ${syncTime} ms</div>
  //     <div><strong>🌀 Async:</strong> ${asyncTime} ms</div>
  //   `;
  const color =
    total < 100
      ? "#a6e22e" // green for fast
      : total < 300
      ? "#f6c343" // orange for moderate
      : "#ff6b6b"; // red for slow

  summaryDiv.innerHTML = `
    <div>
      <strong>⏱ Total Execution Time:</strong>
      <span style="color:${color}; font-weight:bold">${total.toFixed(2)} ms</span>
    </div>
  `;
  outputEl.appendChild(summaryDiv);
}

function logAsyncSteps(outputEl) {
  const steps = window.__asyncSteps || [];
  if (steps.length === 0) return;

  const container = document.createElement("div");
  container.style.marginTop = "1em";
  container.style.borderTop = "1px solid #ccc";
  container.style.padding = "8px";
  container.style.color = "#ccc";

  const heading = document.createElement("div");
  heading.innerHTML = "<strong>🦀 Async Steps:</strong>";
  heading.style.marginBottom = "6px";
  container.appendChild(heading);

  const maxDuration = Math.max(...steps.map((s) => parseFloat(s.duration)));

  steps.forEach((step, i) => {
    const duration = parseFloat(step.duration);
    const normalized = Math.min(Math.round((duration / maxDuration) * 10), 10);
    const bar = "▮".repeat(normalized) + "▯".repeat(10 - normalized);
    const isSlow = duration > 100;

    const stepDiv = document.createElement("div");
    stepDiv.innerHTML = `
      <span style="color: ${isSlow ? "#ff6b6b" : "#ccc"}">
        #${i + 1} • Start: ${step.start} ms |
        Duration: ${step.duration} ms
        ${isSlow ? "⚠️ Slow" : ""}
        <span style="font-family: monospace; margin-left: 6px;">${bar}</span>
      </span>
    `;
    container.appendChild(stepDiv);
  });

  outputEl.appendChild(container);
}

function logSessionStats(outputEl) {
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

  const avgAsync = asyncCallCount ? (totalAsyncTime / asyncCallCount).toFixed(2) : "0.00";
  const avgSync = syncCallCount ? (totalSyncTime / syncCallCount).toFixed(2) : "0.00";

  const totalExecutionTime = totalAsyncTime + totalSyncTime;
  const asyncPercent = totalExecutionTime
    ? ((totalAsyncTime / totalExecutionTime) * 100).toFixed(1)
    : "0.0";
  const syncPercent = totalExecutionTime
    ? ((totalSyncTime / totalExecutionTime) * 100).toFixed(1)
    : "0.0";

  const colorize = (value) => {
    const val = parseFloat(value);
    if (val < 100) return "#a6e22e"; // fast - green
    if (val < 300) return "#f6c343"; // medium - orange
    return "#ff6b6b"; // slow - red
  };

  const createRow = (label, value, unit = "ms") => {
    const color = colorize(value);
    return `<tr>
      <td style="padding-right:12px;">${label}</td>
      <td><span style="color:${color}; font-weight:bold">${parseFloat(value).toFixed(
      2
    )} ${unit}</span></td>
    </tr>`;
  };

  const percentageBar = `
    <div style="margin-top:10px;">
      <strong>⚖️ Execution Breakdown</strong>
      <div style="margin-top:4px; background:#222; border:1px solid #444; border-radius:4px; overflow:hidden; height:20px; width:100%;">
        <div style="float:left; background:#61dafb; width:${asyncPercent}%; height:100%; text-align:center; font-size:12px; line-height:20px; color:#000;">
          ${asyncPercent}% Async
        </div>
        <div style="float:left; background:#dcdcdc; width:${syncPercent}%; height:100%; text-align:center; font-size:12px; line-height:20px; color:#000;">
          ${syncPercent}% Sync
        </div>
      </div>
    </div>
  `;

  const tableHTML = `
    <div style="margin-top: 1em; border-top: 1px solid #ccc; padding: 8px; color: #ccc;">
      <div><strong>📊 Session Stats:</strong></div>
      <table style="margin-top: 6px; font-size: 14px; color: #ccc;">
        <tbody>
          <tr><td colspan="2"><strong>🔁 Async</strong></td></tr>
          ${createRow("Avg Async Duration", avgAsync)}
          ${createRow("Longest Async", longestAsync)}
          ${createRow("Fastest Async", shortestAsync || 0)}
          ${createRow("Total Async Time", totalAsyncTime)}
          ${createRow("Async Calls Count", asyncCallCount, "")}

          <tr><td colspan="2" style="padding-top:8px;"><strong>⚡ Sync</strong></td></tr>
          ${createRow("Avg Sync Duration", avgSync)}
          ${createRow("Longest Sync", longestSync)}
          ${createRow("Fastest Sync", shortestSync || 0)}
          ${createRow("Total Sync Time", totalSyncTime)}
          ${createRow("Sync Calls Count", syncCallCount, "")}
        </tbody>
      </table>

      ${percentageBar}
    </div>
  `;

  const container = document.createElement("div");
  container.innerHTML = tableHTML;
  outputEl.appendChild(container);
}
