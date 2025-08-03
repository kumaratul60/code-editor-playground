// Global session tracking
window.__sessionStats = {
  totalAsyncTime: 0,
  asyncCallCount: 0,
  longestAsync: 0,
};

let lastLogTime = null;
window.__asyncSteps = [];

export async function runCode(editor, output) {
  clearOutput(output);
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
    const total = (endTime - startTime).toFixed(2);

    const firstAsyncStart =
      window.__asyncSteps.length > 0 ? parseFloat(window.__asyncSteps[0].start) : endTime;

    const syncTime = (firstAsyncStart - startTime).toFixed(2);
    const asyncTime = (endTime - firstAsyncStart).toFixed(2);

    logSummary({ total, syncTime, asyncTime }, output);
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
  summaryDiv.innerHTML = `
    <div><strong>⏱ Total Execution:</strong> ${total} ms</div>
    <div><strong>⚡ Sync:</strong> ${syncTime} ms</div>
    <div><strong>🌀 Async:</strong> ${asyncTime} ms</div>
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
  heading.innerHTML = "<strong>🔍 Async Steps:</strong>";
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
  const { totalAsyncTime, asyncCallCount, longestAsync } = window.__sessionStats;
  if (asyncCallCount === 0) return;

  const avgAsync = (totalAsyncTime / asyncCallCount).toFixed(2);

  const container = document.createElement("div");
  container.style.marginTop = "1em";
  container.style.borderTop = "1px solid #ccc";
  container.style.padding = "8px";
  container.style.color = "#ccc";

  container.innerHTML = `
    <div><strong>📊 Session Stats:</strong></div>
    <div>• Avg Async Duration: ${avgAsync} ms</div>
    <div>• Longest Async Step: ${longestAsync.toFixed(2)} ms</div>
    <div>• Total Async Time: ${totalAsyncTime.toFixed(2)} ms</div>
    <div>• Async Calls Count: ${asyncCallCount}</div>
  `;

  outputEl.appendChild(container);
}
