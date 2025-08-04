# 🧠 JavaScript Code Editor — Built from Scratch

[![wakatime](https://wakatime.com/badge/user/1499525d-7f42-4e3a-b9c6-fbf14aa13712/project/a4c8d9fe-52e5-4cc1-8872-abc3e71f2778.svg)](https://wakatime.com/badge/user/1499525d-7f42-4e3a-b9c6-fbf14aa13712/project/a4c8d9fe-52e5-4cc1-8872-abc3e71f2778)

> A modern JavaScript code editor playground with real-time code analysis, developer insights, and a non-intrusive floating insights sidebar.


---

## 🚀 Why I Built This

Most online editors (CodePen, JSFiddle, etc.) are great for prototyping, but they don't show **what's really happening** behind the scenes and take time to load and run + aid.
I wanted to build an editor that’s not just about **writing code**, but about **understanding code** — with **execution timing**, **loop tracking**, **async/sync analysis**, and more.

So I built this:

- ✅ No frameworks
- ✅ No build tools
- ✅ No dependencies
- ✅ Full control over console + output rendering
- ✅ Deep stats per run

## ✨ Features

- ⚡ **Live Code Execution** — Run JS directly in the browser.
- 🎯 **Execution Time Tracking**
  - Total execution time (with color-coded performance levels)
  - Sync vs Async breakdown
  - Time taken per `console.log()`
- 🧩 **Function Profiling**
  - Track number of functions executed
  - Record execution duration per function
  - Detect slowest function
- 🔁 **Loop Tracking**
  - Profile `for`, `while`, `do...while` loops
  - Record iteration counts & time
- ⏳ **Async Insights**
  - Async call count (tracked via wrapped `await`)
- 🖥️ **Console Output**
  - Styled log, warn, error output
  - Per-log execution timestamp
- 🎛️ **Interactive UI**
  - Light/Dark mode toggle
  - Live line numbering
  - Sticky summary bar showing key metrics

---

## Features

- **Live JavaScript Editing & Execution**: Write and run JS code instantly in the browser.
- **Syntax Highlighting**: Colorful, readable code with real-time highlighting.
- **Code Analysis & Metrics**:
  - Function, loop, and async operation counts
  - Complexity, maintainability, and efficiency scores
  - Performance profiling and execution time
- **Visual Developer Insights**:
  - Floating sidebar ( icon, lower-right) shows:
    - Code structure visualization (functions, loops, async)
    - Execution hotspot visualization
    - Key metrics and recommendations
- **Minimal, Responsive UI**: Sidebar overlays the app, does not shift layout.

---

## File Structure

```txt
⏱️ Total Time: 18.2ms
🧩 3 func | 🔁 2 loops | ⏳ 1 async | 🐌 slow: 7.1ms
```

---

## How the Developer Insights Sidebar Works

- ** Button**: Click the floating icon in the lower-right to open/close the sidebar.
- **Sidebar Panel**: Overlays the app, showing:
  - Code metrics (functions, loops, async, complexity, etc.)
  - Visualizations for code structure and execution hotspots
  - Performance and maintainability scores
  - Optimization tips
- **Non-Intrusive**: Sidebar does not take up space or shift your editor/output.

## 🧪 Example Code You Can Run

```js
function heavySyncTask() {
  for (let i = 0; i < 1e6; i++) {}
}
async function fetchData() {
  await new Promise((r) => setTimeout(r, 150));
  console.log("Data received!");
}
console.log("Start");
heavySyncTask();
fetchData();
console.log("End");
```

```js
async function sequentialCalls() {
  console.time("Sequential");
  const todo1 = await fetch("https://jsonplaceholder.typicode.com/todos/1").then((r) => r.json());
  const todo2 = await fetch("https://jsonplaceholder.typicode.com/todos/2").then((r) => r.json());
  console.log("Todo 1:", todo1);
  console.log("Todo 2:", todo2);
  console.timeEnd("Sequential");
}

async function parallelCalls() {
  console.time("Parallel");
  const [todo1, todo2] = await Promise.all([
    fetch("https://jsonplaceholder.typicode.com/todos/1").then((r) => r.json()),
    fetch("https://jsonplaceholder.typicode.com/todos/2").then((r) => r.json()),
  ]);
  console.log("Todo 1:", todo1);
  console.log("Todo 2:", todo2);
  console.timeEnd("Parallel");
}

// Run one at a time to compare:
sequentialCalls();
// parallelCalls();
```

```js
console.time("Total Execution");

function nestedLoopsProfiler() {
  const loopStats = [];

  const startOuter = performance.now();
  for (let i = 0; i < 3; i++) {
    const startInner = performance.now();
    for (let j = 0; j < 5; j++) {
      // Simulate some work
      const temp = i * j;
    }
    const endInner = performance.now();
    loopStats.push({
      type: "Inner Loop",
      iteration: i,
      time: (endInner - startInner).toFixed(2) + " ms",
    });
  }
  const endOuter = performance.now();
  loopStats.unshift({
    type: "Outer Loop",
    iterations: 3,
    time: (endOuter - startOuter).toFixed(2) + " ms",
  });

  console.table(loopStats);
}

nestedLoopsProfiler();

console.timeEnd("Total Execution");

```

## TL;DR
- Built with vanilla JS, CSS, and HTML.
- Uses Prettier for code formatting.
This editor is not just about writing code. It’s about understanding code, still it is in building phase.
Unlike most editors focused on writing & sharing, this one gives you deep visibility into how your code performs, all in pure JavaScript with no frameworks, plugins, or abstractions.
