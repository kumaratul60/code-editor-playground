import {estimateBigOComplexity} from "./estimateBigOComplexity.js";
import {calculateCodeEfficiency} from "./calculateCodeEfficiency.js";
import {createCodeStructureVisualization} from "./createCodeStructureVisualization.js";
import {createExecutionTimeVisualization} from "./createExecutionTimeVisualization.js";
import {calculateComplexityScore} from "./calculateComplexityScore.js";
import {getPerformanceRating} from "./getPerformanceRating.js";
import {calculateMaintainabilityScore} from "./calculateMaintainabilityScore.js";
import {analyzeFunctionRelationships} from "./analyzeFunctionRelationships.js";
import {analyzeExecutionHotspots} from "./analyzeExecutionHotspots.js";
// import {executionTracker} from "./executionTracker.js";


export function addDeveloperInsightsPanel(analysis, executionTime, code = "") {

    // Real-time Execution Metrics
    const executionMetrics = {
        peakMemory: 0,
        gcCollections: 0,
        domManipulations: 0,
        networkRequests: 0,
        cacheHits: 0,
        errorCount: 0
    };

    const metrics = executionMetrics || (window.executionTracker ? window.executionTracker.getMetrics() : {
        peakMemory: 0,
        gcCollections: 0,
        domManipulations: 0,
        networkRequests: 0,
        cacheHits: 0,
        errorCount: 0
    })

    // Sidebar container
    let sidebar = document.getElementById('dev-insights-sidebar');
    if (!sidebar) {
        sidebar = document.createElement('div');
        sidebar.id = 'dev-insights-sidebar';
        document.body.appendChild(sidebar);

        // Toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'dev-insights-toggle-btn';
        toggleBtn.innerHTML = '💡';
        sidebar.appendChild(toggleBtn);

        toggleBtn.onclick = function () {
            sidebar.classList.toggle('open');
        };
    }

    // Panel content
    let panel = document.getElementById('dev-insights-panel');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'dev-insights-panel';
        sidebar.appendChild(panel);
    }

    const bigO = estimateBigOComplexity(code);
    // Separate async analysis for dev panel only - improved patterns
    // const awaitCount = (code.match(/\bawait\b/g) || []).length;
    // const promiseCount = (code.match(/\bPromise\.[a-zA-Z]+/g) || []).length;
    // const fetchCount = (code.match(/\bfetch\s*\(/g) || []).length;
    // const timeoutCount = (code.match(/\bsetTimeout\s*\(/g) || []).length;
    // const intervalCount = (code.match(/\bsetInterval\s*\(/g) || []).length;
    // // Categorize for display
    // const asyncFunctionCalls = awaitCount + promiseCount + fetchCount;
    // const asyncOperations = timeoutCount + intervalCount;

    /*
      <div style="color: #aaa;">Async Function Calls:</div>
    <div style="font-weight: bold;">${asyncFunctionCalls}</div>
    <div style="color: #aaa;">Async Operations:</div>
    <div style="font-weight: bold;">${asyncOperations}</div>
     */


    // Code quality analysis
    const codeLines = code.split('\n').filter(line => line.trim()).length;
    const commentLines = (code.match(/\/\/.*|\/\*[\s\S]*?\*\//g) || []).length;
    const commentRatio = ((commentLines / codeLines) * 100).toFixed(1);
    const avgLineLength = code.split('\n').reduce((sum, line) => sum + line.length, 0) / code.split('\n').length;
    const longLines = code.split('\n').filter(line => line.length > 80).length;

// Error Handling & Security
    const tryBlocks = (code.match(/\btry\s*\{/g) || []).length;
    const catchBlocks = (code.match(/\bcatch\s*\(/g) || []).length;
    const throwStatements = (code.match(/\bthrow\b/g) || []).length;
    const consoleUsage = (code.match(/console\.(log|error|warn|info)/g) || []).length;
    const evalUsage = (code.match(/\beval\s*\(/g) || []).length;
    const innerHTMLUsage = (code.match(/innerHTML/g) || []).length;

    // Modern JavaScript Features
    const arrowFunctions = (code.match(/=>\s*[{(]?/g) || []).length;
    const destructuring = (code.match(/\{[^}]*\}\s*=/g) || []).length;
    const templateLiterals = (code.match(/`[^`]*`/g) || []).length;
    const spreadOperator = (code.match(/\.{3}/g) || []).length;
    const asyncAwait = (code.match(/\basync\s+function|\basync\s*\(/g) || []).length;
    const classes = (code.match(/\bclass\s+\w+/g) || []).length;

    // Performance Indicators
    const domQueries = (code.match(/document\.(getElementById|querySelector|getElementsBy)/g) || []).length;
    const eventListeners = (code.match(/addEventListener|on\w+\s*=/g) || []).length;
    const intervals = (code.match(/setInterval|setTimeout/g) || []).length;
    const apiCalls = (code.match(/fetch\s*\(|axios\.|XMLHttpRequest/g) || []).length;
    const jsonOperations = (code.match(/JSON\.(parse|stringify)/g) || []).length;

    // Code Patterns & Architecture
    const designPatterns = {
        singleton: (code.match(/getInstance|new\s+\w+\(\)\s*===\s*new\s+\w+\(\)/g) || []).length,
        factory: (code.match(/create\w+|factory/gi) || []).length,
        observer: (code.match(/addEventListener|subscribe|notify/g) || []).length,
        module: (code.match(/export|import|module\.exports/g) || []).length
    };

    // Memory & Resource Usage
    const memoryLeakRisks = (code.match(/setInterval(?!.*clearInterval)|addEventListener(?!.*removeEventListener)/g) || []).length;
    const globalVariables = (code.match(/var\s+\w+|window\.\w+\s*=/g) || []).length;
    const closures = (code.match(/function[^}]*function|=>[^}]*=>/g) || []).length;

    // Testing & Debugging
    const testKeywords = (code.match(/\b(test|it|describe|expect|assert|should)\b/g) || []).length;
    const debugStatements = (code.match(/debugger|console\.(log|debug)/g) || []).length;
    const conditionalLogic = (code.match(/\bif\s*\(|\bswitch\s*\(/g) || []).length;



    panel.innerHTML = `
      <div style="font-weight:bold; font-size:16px; color:#61dafb; margin-bottom:10px;">
        Developer Insights
      </div>
      
  <div style="margin-bottom: 12px; border-bottom: 1px solid #444; padding-bottom: 8px;">
    <span style="font-weight: bold; font-size: 15px;">Code Analysis Dashboard</span>
    <span style="float: right; font-size: 12px; color: #888;">${new Date().toLocaleTimeString()}</span>
  </div>
  
  <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px; margin-bottom: 15px;">
  <div style="font-weight: bold">~Complexity (Time):</div>
  <div>
    <span style="color:#f6c343">${bigO.time}</span>
    <span style="color:#888;">
      (${bigO.maxLoopDepth > 1 ? 'Nested loops detected' : bigO.maxLoopDepth === 1 ? 'Single loop' : 'No loops'})
    </span>
  </div>
  <div style="font-weight: bold;">~Complexity (Space):</div>
  <div>
    <span style="color:#f6c343">${bigO.space}</span>
    <span style="color:#888;">
      (${bigO.arrayCount} arrays, ${bigO.objectCount} objects)
    </span>
  </div>
    <div style="color: #aaa;">Functions:</div>
    <div style="font-weight: bold;">${analysis.functions}</div>
    <div style="color: #aaa;">Loops:</div>
    <div style="font-weight: bold;">${analysis.loops}</div>
    <div style="color: #aaa;">Async Ops:</div>
    <div style="font-weight: bold;">${analysis.asyncOps}</div>
   
    <div style="color: #aaa;">Complexity:</div>
    <div style="font-weight: bold;">
      ${calculateComplexityScore(analysis).score}/10 ${calculateComplexityScore(analysis).icon}
    </div>
    <div style="color: #aaa;">Performance:</div>
    <div style="font-weight: bold;">
      ${getPerformanceRating(executionTime).label} ${getPerformanceRating(executionTime).icon}
    </div>
    <div style="color: #aaa;">Execution:</div>
    <div style="font-weight: bold; color: ${executionTime < 100 ? "#a6e22e" : executionTime < 300 ? "#f6c343" : "#ff6b6b"}">
      ${executionTime.toFixed(2)} ms
    </div>
    <div style="color: #aaa;">Memory:</div>
    <div style="font-weight: bold;">
      ${
        (performance && performance.memory && performance.memory.usedJSHeapSize)
            ? `${(performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(2)} MB / ${(performance.memory.jsHeapSizeLimit / (1024 * 1024)).toFixed(0)} MB`
            : "Not available"
    }
    </div>
    <div style="color: #aaa;">Efficiency:</div>
    <div style="font-weight: bold;">
      ${calculateCodeEfficiency(analysis).label}
    </div>
    <div style="color: #aaa;">Maintainability:</div>
    <div style="font-weight: bold;">
      ${calculateMaintainabilityScore(analysis).label} (${calculateMaintainabilityScore(analysis).score}/10)
    </div>
  </div>
  <!-- Code Structure Visualization -->
  ${createCodeStructureVisualization(analysis, analyzeFunctionRelationships(code))}
  
  <!-- Execution Hotspots Visualization -->
  ${createExecutionTimeVisualization(analyzeExecutionHotspots(analysis, executionTime))}
  
    <!-- Code Quality Section -->
  ${codeLines > 0 || commentRatio > 0 || avgLineLength > 0 || longLines > 0 ? `
  <div style="margin: 15px 0; border-top: 1px solid #444; padding-top: 10px;">
    <div style="font-weight: bold; color: #61dafb; margin-bottom: 8px;">📊 Code Quality</div>
    <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px; font-size: 13px;">
      ${codeLines > 0 ? `<div style="color: #aaa;">Lines of Code:</div><div style="font-weight: bold;">${codeLines}</div>` : ''}
      ${commentRatio > 0 ? `<div style="color: #aaa;">Comment Ratio:</div><div style="font-weight: bold;">${commentRatio}%</div>` : ''}
      ${avgLineLength > 0 ? `<div style="color: #aaa;">Avg Line Length:</div><div style="font-weight: bold;">${avgLineLength.toFixed(0)} chars</div>` : ''}
      ${longLines > 0 ? `<div style="color: #aaa;">Long Lines (>80 chars):</div><div style="font-weight: bold; color: ${longLines > 5 ? '#f6c343' : '#a6e22e'}">${longLines}</div>` : ''}
    </div>
  </div>` : ''}
  
   <!-- Modern JS Features -->
  ${arrowFunctions > 0 || asyncAwait > 0 || destructuring > 0 || templateLiterals > 0 || spreadOperator > 0 || classes > 0 ? `
  <div style="margin: 15px 0; border-top: 1px solid #444; padding-top: 10px;">
    <div style="font-weight: bold; color: #61dafb; margin-bottom: 8px;">🚀 Modern Features</div>
    <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px; font-size: 13px;">
      ${arrowFunctions > 0 ? `<div style="color: #aaa;">Arrow Functions:</div><div style="font-weight: bold;">${arrowFunctions}</div>` : ''}
      ${asyncAwait > 0 ? `<div style="color: #aaa;">Async/Await:</div><div style="font-weight: bold;">${asyncAwait}</div>` : ''}
      ${destructuring > 0 ? `<div style="color: #aaa;">Destructuring:</div><div style="font-weight: bold;">${destructuring}</div>` : ''}
      ${templateLiterals > 0 ? `<div style="color: #aaa;">Template Literals:</div><div style="font-weight: bold;">${templateLiterals}</div>` : ''}
      ${spreadOperator > 0 ? `<div style="color: #aaa;">Spread Operator:</div><div style="font-weight: bold;">${spreadOperator}</div>` : ''}
      ${classes > 0 ? `<div style="color: #aaa;">Classes:</div><div style="font-weight: bold;">${classes}</div>` : ''}
    </div>
  </div>` : ''}
  
    <!-- Performance Indicators -->
  ${domQueries > 0 || eventListeners > 0 || intervals > 0 || apiCalls > 0 || jsonOperations > 0 ? `
  <div style="margin: 15px 0; border-top: 1px solid #444; padding-top: 10px;">
    <div style="font-weight: bold; color: #61dafb; margin-bottom: 8px;">📊 Performance Indicators</div>
    <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px; font-size: 13px;">
      ${domQueries > 0 ? `<div style="color: #aaa;">DOM Queries:</div><div style="font-weight: bold; color: ${domQueries > 5 ? '#ff6b6b' : '#a6e22e'}">${domQueries}</div>` : ''}
      ${eventListeners > 0 ? `<div style="color: #aaa;">Event Listeners:</div><div style="font-weight: bold; color: ${eventListeners > 10 ? '#f6c343' : '#a6e22e'}">${eventListeners}</div>` : ''}
      ${intervals > 0 ? `<div style="color: #aaa;">Timers (setInterval/setTimeout):</div><div style="font-weight: bold; color: ${intervals > 5 ? '#f6c343' : '#a6e22e'}">${intervals}</div>` : ''}
      ${apiCalls > 0 ? `<div style="color: #aaa;">API Calls:</div><div style="font-weight: bold; color: ${apiCalls > 5 ? '#f6c343' : '#a6e22e'}">${apiCalls}</div>` : ''}
      ${jsonOperations > 0 ? `<div style="color: #aaa;">JSON Operations:</div><div style="font-weight: bold;">${jsonOperations}</div>` : ''}
    </div>
  </div>` : ''}
  
  
    <!-- Performance Risks -->
  ${memoryLeakRisks > 0 || globalVariables > 0 || closures > 0 ? `
  <div style="margin: 15px 0; border-top: 1px solid #444; padding-top: 10px;">
    <div style="font-weight: bold; color: #61dafb; margin-bottom: 8px;">⚠️ Performance Risks</div>
    <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px; font-size: 13px;">
      ${memoryLeakRisks > 0 ? `<div style="color: #aaa;">Memory Leak Risks:</div><div style="font-weight: bold; color: ${memoryLeakRisks > 0 ? '#ff6b6b' : '#a6e22e'}">${memoryLeakRisks}</div>` : ''}
      ${globalVariables > 0 ? `<div style="color: #aaa;">Global Variables:</div><div style="font-weight: bold; color: ${globalVariables > 3 ? '#f6c343' : '#a6e22e'}">${globalVariables}</div>` : ''}
      ${closures > 0 ? `<div style="color: #aaa;">Closures:</div><div style="font-weight: bold;">${closures}</div>` : ''}
    </div>
  </div>` : ''}
  
  <!-- Design Patterns -->
  ${designPatterns.singleton > 0 || designPatterns.factory > 0 || designPatterns.observer > 0 || designPatterns.module > 0 ? `
  <div style="margin: 15px 0; border-top: 1px solid #444; padding-top: 10px;">
    <div style="font-weight: bold; color: #61dafb; margin-bottom: 8px;">🏗️ Design Patterns</div>
    <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px; font-size: 13px;">
      ${designPatterns.singleton > 0 ? `<div style="color: #aaa;">Singleton Pattern:</div><div style="font-weight: bold;">${designPatterns.singleton}</div>` : ''}
      ${designPatterns.factory > 0 ? `<div style="color: #aaa;">Factory Pattern:</div><div style="font-weight: bold;">${designPatterns.factory}</div>` : ''}
      ${designPatterns.observer > 0 ? `<div style="color: #aaa;">Observer Pattern:</div><div style="font-weight: bold;">${designPatterns.observer}</div>` : ''}
      ${designPatterns.module > 0 ? `<div style="color: #aaa;">Module Pattern:</div><div style="font-weight: bold;">${designPatterns.module}</div>` : ''}
    </div>
  </div>` : ''}
  
  <!-- Testing & Debugging -->
  ${testKeywords > 0 || debugStatements > 0 || conditionalLogic > 0 ? `
  <div style="margin: 15px 0; border-top: 1px solid #444; padding-top: 10px;">
    <div style="font-weight: bold; color: #61dafb; margin-bottom: 8px;">🧪 Testing & Debugging</div>
    <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px; font-size: 13px;">
      ${testKeywords > 0 ? `<div style="color: #aaa;">Test Keywords:</div><div style="font-weight: bold; color: ${testKeywords > 0 ? '#a6e22e' : '#888'}">${testKeywords}</div>` : ''}
      ${debugStatements > 0 ? `<div style="color: #aaa;">Debug Statements:</div><div style="font-weight: bold; color: ${debugStatements > 10 ? '#f6c343' : '#a6e22e'}">${debugStatements}</div>` : ''}
      ${conditionalLogic > 0 ? `<div style="color: #aaa;">Conditional Logic:</div><div style="font-weight: bold;">${conditionalLogic}</div>` : ''}
    </div>
  </div>` : ''}
  
  <!-- Security & Error Handling -->
  ${tryBlocks > 0 || catchBlocks > 0 || throwStatements > 0 || consoleUsage > 0 || (evalUsage + innerHTMLUsage) > 0 ? `
  <div style="margin: 15px 0; border-top: 1px solid #444; padding-top: 10px;">
    <div style="font-weight: bold; color: #61dafb; margin-bottom: 8px;">🔒 Security & Errors</div>
    <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px; font-size: 13px;">
      ${(tryBlocks > 0 || catchBlocks > 0) ? `<div style="color: #aaa;">Try/Catch Blocks:</div><div style="font-weight: bold;">${tryBlocks}/${catchBlocks}</div>` : ''}
      ${throwStatements > 0 ? `<div style="color: #aaa;">Throw Statements:</div><div style="font-weight: bold; color: ${throwStatements > 0 ? '#a6e22e' : '#888'}">${throwStatements}</div>` : ''}
      ${consoleUsage > 0 ? `<div style="color: #aaa;">Console Usage:</div><div style="font-weight: bold; color: ${consoleUsage > 10 ? '#f6c343' : '#a6e22e'}">${consoleUsage}</div>` : ''}
      ${(evalUsage + innerHTMLUsage) > 0 ? `<div style="color: #aaa;">Security Risks:</div><div style="font-weight: bold; color: ${evalUsage + innerHTMLUsage > 0 ? '#ff6b6b' : '#a6e22e'}">${evalUsage + innerHTMLUsage}</div>` : ''}
    </div>
  </div>` : ''}
  
  
  
  
  <!-- Footer -->
  <div style="margin-top: 15px; font-size: 12px; color: #888; text-align: right; border-top: 1px solid #444; padding-top: 8px;">
    Click 💡 to open/close
  </div>
    `;
}

/*
<!-- Real-time Execution Metrics -->
  <div style="margin: 15px 0; border-top: 1px solid #444; padding-top: 10px;">
    <div style="font-weight: bold; color: #61dafb; margin-bottom: 8px;">⚡ Execution Metrics</div>
    <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px; font-size: 13px;">
      <div style="color: #aaa;">Peak Memory:</div>
      <div style="font-weight: bold;">${(metrics.peakMemory / (1024 * 1024)).toFixed(2)} MB</div>
      <div style="color: #aaa;">DOM Changes:</div>
      <div style="font-weight: bold; color: ${metrics.domManipulations > 10 ? '#f6c343' : '#a6e22e'}">${metrics.domManipulations}</div>
      <div style="color: #aaa;">Network Requests:</div>
      <div style="font-weight: bold; color: ${metrics.networkRequests > 5 ? '#f6c343' : '#a6e22e'}">${metrics.networkRequests}</div>
      <div style="color: #aaa;">Runtime Errors:</div>
      <div style="font-weight: bold; color: ${metrics.errorCount > 0 ? '#ff6b6b' : '#a6e22e'}">${metrics.errorCount}</div>
    </div>
  </div>
 */