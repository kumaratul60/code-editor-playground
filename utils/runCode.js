// let totalStartTime = 0;
// let totalEndTime = 0;
// let syncTime = 0;
// let asyncTime = 0;
// let logTimes = [];

// export async function runCode(editor, output) {
//   const code = editor.innerText;
//   output.innerHTML = "";
//   totalStartTime = performance.now();
//   syncTime = 0;
//   asyncTime = 0;
//   logTimes = [];

//   const originalLog = console.log;

//   console.log = (...args) => {
//     const now = performance.now();
//     const sinceStart = (now - totalStartTime).toFixed(2);
//     logTimes.push(+sinceStart);
//     logOutput(`[+${sinceStart}ms]`, args, output);
//   };

//   const wrappedCode = `
//     (async () => {
//       const measure = async (label, fn) => {
//         const s = performance.now();
//         const result = await fn();
//         const e = performance.now();
//         if (label === "async") asyncTime += (e - s);
//         else syncTime += (e - s);
//         return result;
//       };

//       ${code}
//     })()
//   `;

//   try {
//     await eval(wrappedCode);
//     totalEndTime = performance.now();
//     const totalTime = (totalEndTime - totalStartTime).toFixed(2);
//     const syncMs = syncTime.toFixed(2);
//     const asyncMs = asyncTime.toFixed(2);

//     logOutput(
//       "⏱️ Execution Complete",
//       [`Total: ${totalTime}ms`, `Sync: ${syncMs}ms`, `Async: ${asyncMs}ms`],
//       output
//     );
//   } catch (err) {
//     logOutput("❌ Error", [err.message], output, true);
//   } finally {
//     console.log = originalLog;
//   }
// }

// export function logOutput(timeLabel, messages, outputEl, isError = false) {
//   const logLine = document.createElement("div");
//   logLine.className = "console-log";

//   const timeSpan = document.createElement("span");
//   timeSpan.className = "log-time";
//   timeSpan.textContent = timeLabel + " ";

//   const messageSpan = document.createElement("span");
//   messageSpan.className = "log-message";
//   messageSpan.style.color = isError ? "red" : "#90ee90";
//   messageSpan.textContent = messages
//     .map((msg) => (typeof msg === "object" ? JSON.stringify(msg, null, 2) : msg))
//     .join(" ");

//   logLine.appendChild(timeSpan);
//   logLine.appendChild(messageSpan);
//   outputEl.appendChild(logLine);
//   outputEl.scrollTop = outputEl.scrollHeight;
// }

let lastLogTime = null;

export async function runCode(editor, output) {
  const code = editor.innerText;
  output.innerHTML = "";
  lastLogTime = performance.now();

  const startTime = performance.now();
  let firstAwaitTime = null;

  const originalLog = console.log;
  console.log = (...args) => {
    const now = performance.now();
    const delta = now - lastLogTime;
    lastLogTime = now;
    logOutput(args, output, delta);
    // originalLog(...args); // for testing
  };

  // Patch global "await" to track when first async call resumes
  const instrumentedCode = `
    (async () => {
      const __start = performance.now();
      let __firstAwaitDone = false;
      const __trackAwait = async (p) => {
        const res = await p;
        if (!__firstAwaitDone) {
          window.__firstAwaitTime = performance.now();
          __firstAwaitDone = true;
        }
        return res;
      };
      const await_ = __trackAwait;
      ${code}
    })()
  `;

  try {
    await eval(instrumentedCode);
  } catch (err) {
    logOutput([`❌ ${err.message}`], output, 0, true);
  } finally {
    console.log = originalLog;

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

export function logOutput(message, outputEl, delta = 0, isError = false) {
  const now = performance.now();
  cumulativeTime += delta;

  const logLine = document.createElement("div");
  logLine.className = "console-log";
  logLine.style.display = "flex";
  logLine.style.flexDirection = "column";
  logLine.style.marginBottom = "4px";
  logLine.style.padding = "6px 10px";
  logLine.style.borderLeft = isError ? "4px solid red" : "4px solid lightgreen";
  logLine.style.background = "#111";
  logLine.style.color = isError ? "red" : "white";
  logLine.style.fontFamily = "monospace";

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

  if (Array.isArray(message)) {
    messageSpan.textContent = message.map((m) => formatValue(m)).join(" ");
  } else {
    messageSpan.textContent = formatValue(message);
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
