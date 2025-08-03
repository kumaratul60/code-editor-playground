// 👇 Global session tracking
window.__sessionStats = {
  totalAsyncTime: 0,
  asyncCallCount: 0,
  longestAsync: 0,
};

let lastLogTime = null;
window.__asyncSteps = [];

export async function runCode(editor, output) {
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

export function logOutput(args, outputEl, delta = 0, type = "log") {
  const logDiv = document.createElement("div");
  logDiv.className = `log-entry ${type}`;
  logDiv.style.margin = "4px 0";
  logDiv.style.whiteSpace = "pre-wrap";

  let color;
  switch (type) {
    case "warn":
      color = "#e5c07b";
      break;
    case "error":
      color = "#e06c75";
      break;
    default:
      color = "#98c379";
  }

  // Ensure args is always an array
  const formatted = (Array.isArray(args) ? args : [args])
    .map((arg) => {
      if (Array.isArray(arg)) {
        return `<pre style="display:inline;color:#61afef">[Array(${arg.length})]\n${JSON.stringify(
          arg.slice(0, 3),
          null,
          2
        )}...</pre>`;
      } else if (typeof arg === "object" && arg !== null) {
        return `<pre style="display:inline;color:#61afef">${JSON.stringify(arg, null, 2)}</pre>`;
      } else {
        return `<span>${arg}</span>`;
      }
    })
    .join(" ");

  logDiv.innerHTML = `<span style="color:#555">[${new Date().toLocaleTimeString()}]</span> <span style="color:${color}">+${delta.toFixed(
    2
  )}ms</span> | ${formatted}`;

  outputEl.appendChild(logDiv);
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
