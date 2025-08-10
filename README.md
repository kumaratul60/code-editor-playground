# 🚀 JavaScript Code Editor — Built from Scratch

[![wakatime](https://wakatime.com/badge/user/1499525d-7f42-4e3a-b9c6-fbf14aa13712/project/a4c8d9fe-52e5-4cc1-8872-abc3e71f2778.svg)](https://wakatime.com/badge/user/1499525d-7f42-4e3a-b9c6-fbf14aa13712/project/a4c8d9fe-52e5-4cc1-8872-abc3e71f2778)

> A modern JavaScript code editor playground with real-time code analysis, developer insights, and a non-intrusive floating insights sidebar.


A **pure vanilla JavaScript** code editor with advanced developer insights, real-time analysis, and professional-grade features. Built without any external dependencies, or third-party packages - just clean, efficient code.

## ✨ Key Features

### 🎯 **Pure Vanilla JavaScript**
- **Zero Dependencies**: No external libraries, frameworks, or packages
- **No AI Integration**: Human-crafted code with intelligent analysis
- **Lightweight**: Fast loading and execution
- **Modern ES6+**: Clean, readable JavaScript using latest standards

### 🔧 **Advanced Code Editor**
- **Real-time Syntax Highlighting**: Dynamic JavaScript syntax highlighting
- **Line Numbers**: Professional line numbering with scroll synchronization
- **Smart Indentation**: Automatic code formatting and indentation
- **Multi-theme Support**: Light and dark themes with smooth transitions
- **Responsive Design**: Works perfectly on desktop and mobile devices

### 📊 **DevInsights Panel - Advanced Code Analysis**
Our crown jewel - a comprehensive developer insights panel that provides:

#### **Real-Time Memory & Execution Tracker**
- **Dynamic Step-by-Step Execution Flow**: Professional stepper UI showing each execution phase
- **Memory Usage Analysis**: Peak memory tracking with DOM operations and network requests
- **Garbage Collection Monitoring**: Real-time GC cycle tracking and memory cleanup analysis
- **Performance Metrics**: Actual execution timing (not estimates) with millisecond precision

#### **Comprehensive Code Pattern Detection**
- **Functional Programming**: Detects `map`, `filter`, `reduce`, `forEach`, `find`, `some`, `every`
- **Async Patterns**: `async/await`, Promises, `fetch`, `axios`, legacy XMLHttpRequest
- **Loop Analysis**: All loop types (`for`, `while`, `do-while`, `for-in`, `for-of`)
- **Design Patterns**: Classes, factory, observer, module, singleton patterns
- **Error Handling**: `try/catch` blocks, error throwing, cleanup operations
- **Memory Leak Detection**: Unreleased intervals, event listeners, unclosed resources

#### **Professional UI Components**
- **Numbered Stepper**: Clean, professional execution flow with connecting lines
- **Status-Based Colors**: Green/yellow/red indicators for performance warnings
- **Code Quality Scoring**: 0-100 performance scores with actionable recommendations
- **Complexity Analysis**: Big O notation analysis and optimization suggestions
- **Smart Summary Bar**: Real-time code metrics display with comprehensive hover tooltips
- **Detailed Hover Analysis**: Intelligent tooltips showing only non-zero values for:
    - **Function Breakdown**: Regular, arrow, async, methods, constructors, generators, higher-order
    - **Loop Analysis**: For, while, do-while, for-in, for-of, forEach, functional methods
    - **Async Operations**: Async functions, await expressions, promises, fetch calls, timers, callbacks
    - **Performance Rating**: Dynamic performance assessment with execution metrics


### 🎨 **Professional Design**
- **Modern UI**: Clean, minimalist design with professional typography
- **Theme System**: Comprehensive light/dark mode with CSS variables
- **Responsive Layout**: Mobile-first design that works on all screen sizes
- **Smooth Animations**: Subtle transitions and fade-in effects
- **Enterprise-Grade Styling**: Professional color schemes and spacing

## 🛠️ **Technical Architecture**

### **Core Technologies**
- **HTML5**: Semantic markup with modern standards
- **CSS3**: Advanced styling with Grid, Flexbox, and CSS Variables
- **Vanilla JavaScript**: Pure ES6+ with no external dependencies
- **DOM APIs**: Direct manipulation for optimal performance

## 🚀 **Getting Started**

1. **Clone or Download** the repository
2. **Open `index.html`** in any modern web browser
3. **Start Coding** - No installation, setup, or dependencies required!

## 💡 **Example Code to Test**

### **Functional Programming Example**
```javascript
const numbers = [1, 2, 3, 4, 5, 1, 2, 3, 4, 5];
const result = numbers
  .filter(n => n % 2 === 0)    
  .map(n => n * 2)             
  .reduce((sum, n) => sum + n, 0); 

console.log({result})
```

```js
function createUserArray(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    role: i % 2 === 0 ? "Admin" : "Editor"
  }));
}

const users = createUserArray(10);
console.log(users);

```

### **Async Operations Example**
```javascript
async function fetchUserData() {
    const response = await fetch('https://jsonplaceholder.typicode.com/todos/2');
    const data = await response.json();
    
    //document.getElementById('output').innerHTML = data.title;
    console.log('User loaded:', data);
    
    return data;
}

fetchUserData();
```

```js
function heavySyncTask() {
  for (let i = 0; i < 1e6; i++) {}
}
async function fetchData() {
  await new Promise((r) => setTimeout(r, 100));
  console.log("Data received!");
}
console.log("Start");
heavySyncTask();
fetchData();
console.log("End");
```

### **Complex Analysis Example**
```javascript
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


sequentialCalls();
parallelCalls();
```

## 🎯 **DevInsights Panel Features**

### **What You'll See:**
- **Code Overview**: Quality scores and complexity metrics
- **Complexity Analysis**: Big O notation with performance ratings
- **Performance Metrics**: Real-time execution analysis
- **Code Quality**: Best practices and optimization suggestions
- **Deep Analysis**: Unified memory and execution tracker with:
  - Memory usage (Peak Memory, DOM Ops, Network, Errors, GC)
  - Professional stepper showing execution flow
  - Step-by-step breakdown with memory allocation details
  - Advanced code analysis grid with pattern detection

### **Real-Time Insights:**
- **Memory Tracking**: See actual memory usage and allocation
- **Execution Timing**: Precise millisecond timing for each operation
- **Pattern Recognition**: Automatic detection of coding patterns and best practices
- **Performance Warnings**: Color-coded alerts for potential issues
- **Optimization Tips**: Actionable recommendations for code improvement

## 🌟 **Why This Editor?**

### **For Developers:**
- **Learning Tool**: Perfect for understanding JavaScript execution and performance
- **Code Analysis**: Deep insights into your code's behavior and efficiency
- **No Setup**: Works immediately without any installation or configuration
- **Professional Grade**: Enterprise-level features in a simple package

### **For Educators:**
- **Teaching Aid**: Visual representation of code execution and memory usage
- **Pattern Recognition**: Helps students understand different programming patterns
- **Performance Education**: Real-time feedback on code efficiency

### **For Professionals:**
- **Quick Prototyping**: Fast code testing and analysis
- **Performance Debugging**: Identify bottlenecks and optimization opportunities
- **Code Review**: Comprehensive analysis for code quality assessment

## 🔧 **Browser Compatibility**

- ✅ **Chrome/Chromium** (Recommended)
- ✅ **Firefox**
- ✅ **Safari**
- ✅ **Edge**

## 📝 **License**

Open source - feel free to use, modify, and distribute!

## 🤝 **Contributing**

This is a pure vanilla JavaScript project. Contributions welcome! Please maintain the no-dependency philosophy.

---

**Built with ❤️ using pure vanilla JavaScript - No AI, No packages, No dependencies!**`
