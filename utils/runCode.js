

let lastLogTime = null;

export async function runCode(editor, output) {
  const code = editor.innerText;
  output.innerHTML = "";
  lastLogTime = performance.now();

  const startTime = performance.now();
  window.__firstAwaitTime = null;

  // Track logs
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

  // Inject await_ wrapper to measure when first async resumes
const instrumentedCode = `
  (async () => {
    let __firstAwaitDone = false;
    const await_ = async (p) => {
      const res = await p;
      if (!__firstAwaitDone) {
        window.__firstAwaitTime = performance.now();
        __firstAwaitDone = true;
      }
      return res;
    };

    ${code}
  })()
`;


  try {
    await eval(instrumentedCode);
  } catch (err) {
    logOutput([`❌ ${err.message}`], output, 0, "error");
  } finally {
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;

    const endTime = performance.now();
    const total = (endTime - startTime).toFixed(2);
    const asyncStart = window.__firstAwaitTime || endTime;
    const syncTime = (asyncStart - startTime).toFixed(2);
    const asyncTime = (endTime - asyncStart).toFixed(2);

    logSummary({ total, syncTime, asyncTime }, output);
  }
}

function logSummary({ total, syncTime, asyncTime }, outputEl) {
  const summaryDiv = document.createElement("div");
  summaryDiv.className = "execution-summary";
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

let cumulativeTime = 0;

export function logOutput(message, outputEl, delta = 0, type = "log") {
  const now = performance.now();
  cumulativeTime += delta;

  const logLine = document.createElement("div");
  logLine.className = "console-log";
  logLine.style.display = "flex";
  logLine.style.flexDirection = "column";
  logLine.style.marginBottom = "4px";
  logLine.style.padding = "6px 10px";
  //   logLine.style.borderLeft = isError ? "4px solid red" : "4px solid lightgreen";
  //   logLine.style.background = "#111";
  //   logLine.style.color = isError ? "red" : "white";
  logLine.style.fontFamily = "monospace";

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

  const timeMeta = document.createElement("div");
  timeMeta.style.fontSize = "0.8em";
  timeMeta.style.color = "#888";

  const nowStr = new Date().toLocaleTimeString();
  const deltaStr = `+${delta.toFixed(2)}ms`;
  const totalStr = `${cumulativeTime.toFixed(2)}ms total`;

  timeMeta.textContent = `[${nowStr}] ${deltaStr} | ${totalStr}`;

  const messageSpan = document.createElement("div");
  messageSpan.className = "log-message";
  messageSpan.style.marginTop = "2px";

  //   if (Array.isArray(message)) {
  //     messageSpan.textContent = message.map((m) => formatValue(m)).join(" ");
  //   } else {
  //     messageSpan.textContent = formatValue(message);
  //   }

  if (Array.isArray(message)) {
    message.forEach((item) => {
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

function formatValue(val) {
  if (typeof val === "string") return val;
  try {
    return JSON.stringify(val, null, 2);
  } catch {
    return String(val);
  }
}

function renderValue(val) {
  const type = typeof val;

  // For object or array → show collapsible JSON
  if (val && type === "object") {
    const details = document.createElement("details");
    details.style.marginTop = "4px";
    const summary = document.createElement("summary");
    summary.textContent = Array.isArray(val) ? "Array" : "Object";
    summary.style.cursor = "pointer";
    summary.style.color = "#0ff";
    details.appendChild(summary);

    const pre = document.createElement("pre");
    pre.textContent = JSON.stringify(val, null, 2);
    pre.style.whiteSpace = "pre-wrap";
    pre.style.marginTop = "4px";
    pre.style.color = "#ccc";
    details.appendChild(pre);

    return details;
  }

  // For primitives → color-coded span
  const span = document.createElement("span");
  span.textContent = formatValue(val);
  span.style.color = getTypeColor(type);
  return span;
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
