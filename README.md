# 🚀 JavaScript Code Editor Playground

<div align="center">

<!-- [![wakatime](https://wakatime.com/badge/user/1499525d-7f42-4e3a-b9c6-fbf14aa13712/project/a4c8d9fe-52e5-4cc1-8872-abc3e71f2778.svg)](https://wakatime.com/badge/user/1499525d-7f42-4e3a-b9c6-fbf14aa13712/project/a4c8d9fe-52e5-4cc1-8872-abc3e71f2778) -->

**The ONLY JavaScript editor that lets you make REAL API calls** 🌐

_Built from scratch with pure vanilla JavaScript - No dependencies, No frameworks, No limits_

[Features](#-what-makes-us-unique) • [Quick Start](#-quick-start) • [Examples](#-try-these-examples) • [Dev Insights](#-developer-insights-panel)

</div>

---

## 🎯 What Makes Us Unique?

### 🌐 **Real Network Requests** - The Game Changer

Unlike **every other online JavaScript editor** (CodePen, JSFiddle, JSBin, etc.), we support:

```javascript
// ✅ THIS ACTUALLY WORKS!
async function fetchRealData() {
  const response = await fetch("https://api.github.com/users/github");
  const data = await response.json();
  console.log(data); // Real API response!
}

fetchRealData();
```

Perfect for:

- Testing API integrations
- Learning async/await with real data
- Building fetch-based applications
- Interview preparation with live APIs

---

## 📊 Comparison with Other Online Editors

We tested the top JavaScript online editors to see how they compare. Here's what we found:

| Feature                      | **This Editor** | Programiz  | CodeChef   | OneCompiler | CodePen    | JSFiddle   | NextLeap   |
| ---------------------------- | --------------- | ---------- | ---------- | ----------- | ---------- | ---------- | ---------- |
| **Real fetch() API Calls**   | ✅ **Works!**   | ❌ Blocked | ❌ Blocked | ❌ Blocked  | ❌ Blocked | ❌ Blocked | ❌ Blocked |
| **Async/Await Support**      | ✅ Full         | ⚠️ Limited | ⚠️ Limited | ⚠️ Limited  | ⚠️ Limited | ⚠️ Limited | ⚠️ Limited |
| **Network Requests**         | ✅ Unlimited    | ❌ None    | ❌ None    | ❌ None     | ❌ None    | ❌ None    | ❌ None    |
| **Developer Insights**       | ✅ Rich Features  | ❌ None    | ❌ None    | ❌ None     | ❌ None    | ❌ None    | ❌ None    |
| **Performance Analysis**     | ✅ Real-time    | ❌ None    | ❌ None    | ❌ None     | ❌ None    | ❌ None    | ❌ None    |
| **Security Scanner**         | ✅ Built-in     | ❌ None    | ❌ None    | ❌ None     | ❌ None    | ❌ None    | ❌ None    |
| **Code Complexity Analysis** | ✅ Big O        | ❌ None    | ❌ None    | ❌ None     | ❌ None    | ❌ None    | ❌ None    |
| **Hot Path Visualization**   | ✅ Yes          | ❌ No      | ❌ No      | ❌ No       | ❌ No      | ❌ No      | ❌ No      |
| **Smart Suggestions**        | ✅ AI-like      | ❌ No      | ❌ No      | ❌ No       | ❌ No      | ❌ No      | ❌ No      |
| **Dependency Graph**         | ✅ Yes          | ❌ No      | ❌ No      | ❌ No       | ❌ No      | ❌ No      | ❌ No      |
| **Memory Profiling**         | ✅ Real-time    | ❌ No      | ❌ No      | ❌ No       | ❌ No      | ❌ No      | ❌ No      |
| **No Account Required**      | ✅ Yes          | ✅ Yes     | ⚠️ Limited | ✅ Yes      | ⚠️ Limited | ⚠️ Limited | ✅ Yes     |
| **Offline Support**          | ✅ Full\*       | ❌ No      | ❌ No      | ❌ No       | ❌ No      | ❌ No      | ❌ No      |
| **Load Time**                | ✅ Instant      | ⚠️ Slow    | ⚠️ Slow    | ⚠️ Slow     | ⚠️ Slow    | ⚠️ Slow    | ⚠️ Slow    |
| **File Size**                | ✅ <1MB         | ❌ Heavy   | ❌ Heavy   | ❌ Heavy    | ❌ Heavy   | ❌ Heavy   | ❌ Heavy   |
| **Dependencies**             | ✅ Zero         | ❌ Many    | ❌ Many    | ❌ Many     | ❌ Many    | ❌ Many    | ❌ Many    |

**\*Offline Support**: The editor works completely offline - open `index.html` directly from disk, no server needed. All features work except fetch() API calls (which obviously require internet to reach external APIs).

### 🎯 Key Differentiators

#### 1. **Real Network Requests** 🌐

```javascript
// ✅ THIS ACTUALLY WORKS IN OUR EDITOR!

async function fetchRealData() {
  const response = await fetch("https://api.github.com/users/github");
  const data = await response.json();
  console.log(data); // Real API response!
}

fetchRealData();
```

#### 2. **Advanced Developer Insights** 📊

No other editor provides:

- Real-time performance metrics
- Security vulnerability scanning
- Big O complexity analysis
- Hot path visualization
- Memory leak detection
- Smart optimization suggestions

#### 3. **Zero Dependencies** 🚀

- **This Editor**: Pure vanilla JavaScript, works offline
- **Others**: Require CDNs, frameworks, external services

---

## ✨ Feature Highlights

### 🎨 **Professional Code Editor**

```javascript
// Syntax highlighting, auto-indentation, smart formatting
const fibonacci = (n) => {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
};

console.log(fibonacci(10)); // 55
```

- **Real-time syntax highlighting** with bracket depth coloring
- **Smart auto-indentation** (Ctrl+Enter to format)
- **Active line tracking** with synchronized line numbers
- **Multi-theme support** (Light/Dark with smooth transitions)

### 📊 **Advanced Developer Insights**

Our **crown jewel** - A comprehensive analysis panel that provides:

#### **Performance Metrics** 📈

```
📊 Performance Metrics
Execution Time: 1.234 ms / 500 ms ✅
DOM Operations: 0 ops / 100 ops ✅
Network Calls: 2 calls / 10 calls ✅
Memory Usage: 0.45 MB / 5 MB ✅
```

#### **Security Scanner** 🔒

```
🔒 Security Analysis
✓ No eval() usage
✓ No unsafe innerHTML
⚠️ 2 unvalidated fetch URLs
   Risk: Potential SSRF or data leakage
```

#### **Hot Paths Visualization** 🔥

```
🔥 Hot Paths
Network Requests    85% (3200ms) ████████████████████
DOM Operations      10% (380ms)  ████
Computation          5% (190ms)  ██
```

#### **Smart Suggestions** 💡

```
💡 Smart Suggestions
• Consider memoizing fibonacci() - called 5 times
• Use const for result - never reassigned
• Add try/catch around async operations
```

### 🎯 **Code Pattern Detection**

Automatically detects and analyzes:

- **Async Patterns**: async/await, Promises, fetch, timers
- **Functional Programming**: map, filter, reduce, higher-order functions
- **Loops**: for, while, forEach with complexity analysis
- **Error Handling**: try/catch blocks, throw statements
- **Memory Leaks**: Unclosed intervals, event listeners

### 🔧 **Built-in Features**

- ✅ **Zero Dependencies** - Pure vanilla JavaScript
- ✅ **Offline Ready** - Works without internet (except for API calls)
- ✅ **Auto-format** - Press Ctrl+Enter to format code
- ✅ **Copy to Clipboard** - Auto-formats before copying
- ✅ **Console Output** - Full console.log, warn, error support
- ✅ **Execution Timeline** - See exactly what runs when

## 💻 Try These Examples

### 1️⃣ **Real API Calls** (Our Superpower!)

```javascript
// Fetch real data from GitHub API
async function getGitHubUser(username) {
  try {
    const response = await fetch(`https://api.github.com/users/${username}`);
    const user = await response.json();

    console.log(`Name: ${user.name}`);
    console.log(`Followers: ${user.followers}`);
    console.log(`Public Repos: ${user.public_repos}`);

    return user;
  } catch (error) {
    console.error("Failed to fetch user:", error);
  }
}

getGitHubUser("github");
```

### 2️⃣ **Parallel vs Sequential Requests**

```javascript
// Compare performance of parallel vs sequential API calls
async function sequentialCalls() {
  console.time("Sequential");
  const user1 = await fetch(
    "https://jsonplaceholder.typicode.com/users/1"
  ).then((r) => r.json());
  const user2 = await fetch(
    "https://jsonplaceholder.typicode.com/users/2"
  ).then((r) => r.json());
  console.timeEnd("Sequential");
  console.log("Users:", user1.name, user2.name);
}

async function parallelCalls() {
  console.time("Parallel");
  const [user1, user2] = await Promise.all([
    fetch("https://jsonplaceholder.typicode.com/users/1").then((r) => r.json()),
    fetch("https://jsonplaceholder.typicode.com/users/2").then((r) => r.json()),
  ]);
  console.timeEnd("Parallel");
  console.log("Users:", user1.name, user2.name);
}

sequentialCalls();
parallelCalls();
// See the performance difference in Dev Insights!
```

### 3️⃣ **Functional Programming**

```javascript
// Chain functional methods with real-time analysis
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const result = numbers
  .filter((n) => n % 2 === 0) // Even numbers
  .map((n) => n * n) // Square them
  .reduce((sum, n) => sum + n, 0); // Sum them up

console.log("Result:", result); // 220

// Dev Insights will show:
// - 3 functional methods detected
// - O(n) time complexity
// - Memory efficient
```

### 4️⃣ **Error Handling & Async**

```javascript
// Test error handling with real network requests
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempt ${i + 1}/${retries}`);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn(`Attempt ${i + 1} failed:`, error.message);

      if (i === retries - 1) {
        throw new Error(`Failed after ${retries} attempts`);
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

fetchWithRetry("https://jsonplaceholder.typicode.com/posts/1");
```

### 5️⃣ **DOM Manipulation**

```javascript
// Manipulate the output panel directly
const output = document.getElementById("output");

// Create a user card
function createUserCard(user) {
  return `
        <div style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; color: white; margin: 10px 0;">
            <h2 style="margin: 0 0 10px 0;">${user.name}</h2>
            <p style="margin: 5px 0;">📧 ${user.email}</p>
            <p style="margin: 5px 0;">🏢 ${user.company.name}</p>
            <p style="margin: 5px 0;">🌐 ${user.website}</p>
        </div>
    `;
}

// Fetch and display users
async function displayUsers() {
  const response = await fetch("https://jsonplaceholder.typicode.com/users");
  const users = await response.json();

  output.innerHTML = users.slice(0, 3).map(createUserCard).join("");
  console.log(`Displayed ${users.length} users`);
}

displayUsers();
```

---

## � Developer Insights Panel

Click the **💡 icon** (bottom-right) to open the comprehensive analysis panel:

### **What You'll See:**

#### 1. **Time & Space Complexity**

```
Time & Space Complexity
Time: O(n)
Space: O(n)
```

#### 2. **Code Structure**

Visual representation of your code's architecture

#### 3. **Deep Code Analysis**

- ⚡ **Execution Pattern**: Precise timing (e.g., 1.234 ms)
- 📊 **Code Patterns**: Functions, Loops, Async Ops, DOM Ops, etc.
- 💡 **Productivity Insights**: Actionable optimization tips

#### 4. **Performance Warnings** ⚠️

```
⚠️ Performance Warnings
🟡 Multiple Network Requests: 8 sequential fetches
   → Use Promise.all() to parallelize
```

#### 5. **Security Analysis** 🔒

Scans for common security issues

#### 6. **Hot Paths** 🔥

Visual breakdown of where time is spent

#### 7. **Memory Profiling** 💾

Track memory usage and detect leaks

#### 8. **API Call Summary** 🌐

```
🌐 Network Summary
Total Requests: 8
├─ GET: 6 (avg 42ms)
├─ POST: 2 (avg 156ms)
└─ Failed: 0
```

#### 9. **Smart Suggestions** 💡

Context-aware optimization recommendations

#### 10. **Dependency Graph** 🔗

Function call relationships

#### 11. **Performance Metrics** 📊

Real-time budget tracking

#### 12. **Execution Flow**

Step-by-step execution timeline

#### 13. **Runtime Timeline** 🛰️

```
⏱️ Runtime Timeline
├─ 🚀 run-start      0ms
├─ 🌐 network     3932ms
└─ ⏰ async       3933ms
```

## 🎓 Perfect For

- 🎯 **Interview Preparation**: Practice coding with real APIs
- 📚 **Learning JavaScript**: See how code executes in real-time
- 🔬 **API Testing**: Test endpoints without Postman
- 🚀 **Quick Prototyping**: Rapid code experimentation
- 👨‍🏫 **Teaching**: Visual execution flow for students
- 🐛 **Debugging**: Comprehensive performance analysis

---

## 🛠️ Technical Architecture

### **Built With:**

- **HTML5** - Semantic markup
- **CSS3** - Modern styling (Grid, Flexbox, Variables)
- **Vanilla JavaScript** - Pure ES6+ (no frameworks!)

### **Folder Structure:**

```
src/
├── app/              # Entry point & initialization
├── components/       # Editor components
├── shared/           # Core utilities
├── features/         # Dev Insights & advanced features
└── styles/           # Themeable CSS modules
```

### **Key Features:**

- 🎨 Custom syntax highlighter
- 📝 Smart code formatter
- ⏮️ Undo/Redo system
- 🔍 Pattern detection engine
- 📊 Performance profiler
- 🔒 Security scanner


## 📝 License

Open source - Use freely, modify, and distribute!

---

## 🤝 Contributing

We welcome contributions! Please maintain the **no-dependency philosophy**.

### **Guidelines:**

- Pure vanilla JavaScript only
- No external libraries or frameworks
- Clean, readable code
- Comprehensive comments


<div align="center">

**Built with ❤️ using pure vanilla JavaScript**

_No AI • No packages • No dependencies • No limits_

⭐ **Star this repo if you find it useful!** ⭐

</div>
