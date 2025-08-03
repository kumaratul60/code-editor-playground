# 🧠 JavaScript Code Editor — Built from Scratch

A powerful in-browser JavaScript code editor that runs and analyzes code in real-time — **built completely from scratch** using **vanilla JS, HTML & CSS**. No frameworks. No dependencies. 100% handcrafted logic.

---


## 🛠️ Built With

| Tech         | Used?       |
| ------------ | ----------- |
| JavaScript   | ✅ Vanilla   |
| HTML/CSS     | ✅ Custom UI |
| Libraries    | ❌ None      |
| Frameworks   | ❌ None      |
| Bundlers     | ❌ None      |
| Prettier     | ❌ Not used  |
| Webpack/Vite | ❌ Not used  |

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

## 🚀 Live Preview

> [👉 Click here to try it out (Live Demo)](https://codepi.vercel.app/)

---

## 📊 Real-Time Summary Bar

A sticky UI bar shows you:
- in dev
```txt
⏱️ Total Time: 18.2ms
🧩 3 func | 🔁 2 loops | ⏳ 1 async | 🐌 slow: 7.1ms


 Future Features (Planned)
🔜 Code formatting (Prettier-lite formatting)

✅ Matching bracket highlighting

🔜 Real-time AST parsing (optional)

🔜 Save/load local files

🔜 Export logs as report

🔜 Plugin support

