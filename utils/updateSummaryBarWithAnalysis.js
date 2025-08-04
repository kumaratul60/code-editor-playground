/**
 * Analyzes the code to count functions, loops, and async operations
 * @param {string} code - The source code to analyze
 * @returns {Object} An object containing the analysis results
 */
export function analyzeCode(code) {
    // Count functions (including arrow functions, function declarations, and methods)
    const functionCount = (code.match(/\bfunction\s+\w+\s*\(|\bconst\s+\w+\s*=\s*[^=]*=>|\b\w+\s*\([^)]*\)\s*=>/g) || []).length;

    // Count loops (for, while, do-while, for...in, for...of)
    const loopCount = (code.match(/\b(for|while|do\s*\{)/g) || []).length;

    // Count async operations (await, Promise, fetch, setTimeout, setInterval)
    const asyncCount = (code.match(/\b(await|Promise\.|fetch\s*\(|setTimeout\s*\(|setInterval\s*\()/g) || []).length;

    return {
        functions: functionCount,
        loops: loopCount,
        asyncOps: asyncCount
    };
}

/**
 * Updates the summary bar with code analysis results and execution time
 * @param {Object} analysis - The analysis results from analyzeCode
 * @param {number} [executionTime=0] - Total execution time in milliseconds
 */
// function updateSummaryBarWithAnalysis(analysis, executionTime = 0) {
//   const summaryElement = document.getElementById('summary-icons');
//   const execTimeElement = document.getElementById('exec-time');
//
//   if (summaryElement) {
//     summaryElement.innerHTML = `🧩 ${analysis.functions} func | 🔁 ${analysis.loops} loops | ⏳ ${analysis.asyncOps} async`;
//   }
//
//   if (execTimeElement) {
//     const timeColor = executionTime < 100 ? "#a6e22e" : executionTime < 300 ? "#f6c343" : "#ff6b6b";
//     execTimeElement.innerHTML = `⏱️ Total Time: <span style="color: ${timeColor}">${executionTime.toFixed(2)} ms</span>`;
//   }
// }


/**
 * Updates the summary bar with code analysis results and execution time
 * @param {Object} analysis - The analysis results from analyzeCode
 * @param {number} [executionTime=0] - Total execution time in milliseconds
 */
export function updateSummaryBarWithAnalysis(analysis, executionTime = 0) {
    const summaryElement = document.getElementById('summary-icons');
    const execTimeElement = document.getElementById('exec-time');

    // Calculate code complexity score (simple heuristic)
    const complexityScore = calculateComplexityScore(analysis);

    // Determine performance rating based on execution time
    const performanceRating = getPerformanceRating(executionTime);

    if (summaryElement) {
        // Enhanced summary with complexity indicator and more detailed metrics
        summaryElement.innerHTML = `
      🧩 ${analysis.functions} func |
      🔁 ${analysis.loops} loops |
      ⏳ ${analysis.asyncOps} async |
      🧠 Complexity: ${complexityScore.score}/10 ${complexityScore.icon}
    `;

        // Add tooltip with more detailed information
        summaryElement.title = `
      Functions: ${analysis.functions}
      Loops: ${analysis.loops}
      Async Operations: ${analysis.asyncOps}
      Complexity Score: ${complexityScore.score}/10 (${complexityScore.label})
      Performance: ${performanceRating.label}
      
      ${getOptimizationTips(analysis, executionTime)}
    `;
    }

    if (execTimeElement) {
        const timeColor = executionTime < 100 ? "#a6e22e" : executionTime < 300 ? "#f6c343" : "#ff6b6b";
        execTimeElement.innerHTML = `⏱️ Total Time: <span style="color: ${timeColor}">${executionTime.toFixed(2)} ms</span> ${performanceRating.icon}`;
        execTimeElement.title = `Performance Rating: ${performanceRating.label}`;
    }

    // Optionally add a detailed developer insights panel
    addDeveloperInsightsPanel(analysis, executionTime);
}

/**
 * Calculates a code complexity score based on code analysis
 * @param {Object} analysis - The code analysis results
 * @returns {Object} Complexity score object with score, label and icon
 */
function calculateComplexityScore(analysis) {
    // Simple heuristic: functions + (loops * 1.5) + (asyncOps * 1.2)
    const rawScore = analysis.functions + (analysis.loops * 1.5) + (analysis.asyncOps * 1.2);

    // Normalize to a 1-10 scale
    const normalizedScore = Math.min(Math.round(rawScore / 5), 10);

    // Determine complexity label and icon
    let label, icon;
    if (normalizedScore <= 3) {
        label = "Simple";
        icon = "🟢";
    } else if (normalizedScore <= 6) {
        label = "Moderate";
        icon = "🟡";
    } else if (normalizedScore <= 8) {
        label = "Complex";
        icon = "🟠";
    } else {
        label = "Very Complex";
        icon = "🔴";
    }

    return { score: normalizedScore, label, icon };
}

// function getPerformanceRating(executionTime) {
//   if (executionTime < 50) {
//     return { label: "Excellent", icon: "⚡" };
//   } else if (executionTime < 100) {
//     return { label: "Good", icon: "✅" };
//   } else if (executionTime < 300) {
//     return { label: "Fair", icon: "⚠️" };
//   } else {
//     return { label: "Needs Optimization", icon: "🐢" };
//   }
// }

/**
 * Generates optimization tips based on code analysis and execution time
 * @param {Object} analysis - The code analysis results
 * @param {number} executionTime - Execution time in milliseconds
 * @returns {string} Optimization tips
 */
function getOptimizationTips(analysis, executionTime) {
    const tips = [];

    if (analysis.loops > 3 && executionTime > 100) {
        tips.push("Consider optimizing loops or using array methods instead");
    }

    if (analysis.asyncOps > 3) {
        tips.push("Consider using Promise.all for parallel async operations");
    }

    if (analysis.functions > 5 && executionTime > 200) {
        tips.push("Consider function memoization for expensive calculations");
    }

    if (executionTime > 300) {
        tips.push("Code execution is slow - profile for bottlenecks");
    }

    return tips.length > 0 ? "Optimization Tips:\n- " + tips.join("\n- ") : "";
}

/**
 * Adds a collapsible developer insights panel to the UI
 * @param {Object} analysis - The code analysis results
 * @param {number} executionTime - Execution time in milliseconds
 */
function addDeveloperInsightsPanel(analysis, executionTime) {
    // Check if we already have an insights panel
    let insightsPanel = document.getElementById('dev-insights-panel');

    if (!insightsPanel) {
        // Create the panel if it doesn't exist
        insightsPanel = document.createElement('div');
        insightsPanel.id = 'dev-insights-panel';
        insightsPanel.style.cssText = `
      position: fixed;
      bottom: 50px;
      right: 20px;
      background: linear-gradient(to bottom, #2d2d2d, #1e1e1e);
      border: 1px solid #555;
      border-radius: 8px;
      padding: 15px;
      font-size: 14px;
      color: #eee;
      z-index: 1000;
      max-width: 350px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.5);
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      transform: translateY(${document.getElementById('dev-insights-toggle')?.checked ? '0' : '95%'});
    `;

        document.body.appendChild(insightsPanel);

        // Add toggle button
        const toggleBtn = document.createElement('div');
        toggleBtn.innerHTML = '💡 Developer Insights';
        toggleBtn.style.cssText = `
      padding: 8px 15px;
      background: linear-gradient(to bottom, #444, #333);
      border-radius: 8px 8px 0 0;
      cursor: pointer;
      font-weight: bold;
      position: absolute;
      top: -36px;
      left: 20px;
      box-shadow: 0 -2px 10px rgba(0,0,0,0.2);
      border: 1px solid #555;
      border-bottom: none;
      color: #61dafb;
    `;

        toggleBtn.onclick = function() {
            const isVisible = insightsPanel.style.transform === 'translateY(0%)';
            insightsPanel.style.transform = isVisible ? 'translateY(95%)' : 'translateY(0%)';
            this.style.opacity = isVisible ? '0.9' : '1';
        };

        insightsPanel.appendChild(toggleBtn);
    }

    // Calculate additional metrics
    const complexityScore = calculateComplexityScore(analysis);
    const performanceRating = getPerformanceRating(executionTime);
    const codeEfficiency = calculateCodeEfficiency(analysis);
    const maintainabilityScore = calculateMaintainabilityScore(analysis);
    const tips = generateOptimizationTips(analysis, executionTime);

    // Get memory usage if available
    let memoryUsage = "Not available";
    if (performance && performance.memory && performance.memory.usedJSHeapSize) {
        const usedMemory = performance.memory.usedJSHeapSize / (1024 * 1024);
        const totalMemory = performance.memory.jsHeapSizeLimit / (1024 * 1024);
        memoryUsage = `${usedMemory.toFixed(2)} MB / ${totalMemory.toFixed(0)} MB`;
    }

    // Update panel content with developer insights
    insightsPanel.innerHTML = `
    <div style="padding: 8px 15px; background: linear-gradient(to bottom, #444, #333); border-radius: 8px 8px 0 0; cursor: pointer; font-weight: bold; position: absolute; top: -36px; left: 20px; box-shadow: 0 -2px 10px rgba(0,0,0,0.2); border: 1px solid #555; border-bottom: none; color: #61dafb;">
      💡 Developer Insights
    </div>
    
    <!-- Header Section -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #444; padding-bottom: 8px;">
      <div style="font-weight: bold; font-size: 16px; color: #61dafb;">Code Analysis Dashboard</div>
      <div style="font-size: 12px; color: #888;">${new Date().toLocaleTimeString()}</div>
    </div>
    
    <!-- Main Metrics Grid -->
    <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px; margin-bottom: 15px;">
      <div style="color: #aaa;">Functions:</div>
      <div style="font-weight: bold;">${analysis.functions}</div>
      
      <div style="color: #aaa;">Loops:</div>
      <div style="font-weight: bold;">${analysis.loops}</div>
      
      <div style="color: #aaa;">Async Ops:</div>
      <div style="font-weight: bold;">${analysis.asyncOps}</div>
      
      <div style="color: #aaa;">Complexity:</div>
      <div style="font-weight: bold; display: flex; align-items: center;">
        <div style="width: 60px; height: 8px; background: #333; border-radius: 4px; margin-right: 8px; overflow: hidden;">
          <div style="height: 100%; width: ${complexityScore.score * 10}%; background: ${getGradientColor(complexityScore.score/10)}"></div>
        </div>
        ${complexityScore.score}/10 ${complexityScore.icon}
      </div>
      
      <div style="color: #aaa;">Performance:</div>
      <div style="font-weight: bold;">${performanceRating.label} ${performanceRating.icon}</div>
      
      <div style="color: #aaa;">Execution:</div>
      <div style="font-weight: bold; color: ${executionTime < 100 ? "#a6e22e" : executionTime < 300 ? "#f6c343" : "#ff6b6b"}">
        ${executionTime.toFixed(2)} ms
      </div>
      
      <div style="color: #aaa;">Memory:</div>
      <div style="font-weight: bold;">${memoryUsage}</div>
      
      <div style="color: #aaa;">Efficiency:</div>
      <div style="font-weight: bold; display: flex; align-items: center;">
        <div style="width: 60px; height: 8px; background: #333; border-radius: 4px; margin-right: 8px; overflow: hidden;">
          <div style="height: 100%; width: ${codeEfficiency.percentage}%; background: ${getGradientColor(codeEfficiency.score/100)}"></div>
        </div>
        ${codeEfficiency.label}
      </div>
      
      <div style="color: #aaa;">Maintainability:</div>
      <div style="font-weight: bold; display: flex; align-items: center;">
        <div style="width: 60px; height: 8px; background: #333; border-radius: 4px; margin-right: 8px; overflow: hidden;">
          <div style="height: 100%; width: ${maintainabilityScore.score * 10}%; background: ${getGradientColor(maintainabilityScore.score/10)}"></div>
        </div>
        ${maintainabilityScore.label} (${maintainabilityScore.score}/10)
      </div>
    </div>
    
    <!-- Performance Insights -->
    <div style="margin-top: 15px; padding: 10px; background: rgba(97, 218, 251, 0.1); border-radius: 6px; border-left: 3px solid #61dafb;">
      <div style="font-weight: bold; margin-bottom: 8px; color: #61dafb;">⚡ Performance Insights</div>
      <div style="font-size: 13px; color: #ddd;">
        ${performanceRating.description || "No specific performance insights available."}
      </div>
    </div>
    
    <!-- Optimization Tips -->
    <div style="margin-top: 15px; padding: 10px; background: rgba(151, 230, 48, 0.1); border-radius: 6px; border-left: 3px solid #97e630;">
      <div style="font-weight: bold; margin-bottom: 8px; color: #97e630;">🔧 Optimization Tips(it can make mistakes)</div>
      ${tips.length > 0 ?
        `<ul style="margin: 0; padding-left: 20px; font-size: 13px;">
          ${tips.map(tip => `<li style="margin-bottom: 5px;">${tip}</li>`).join('')}
        </ul>` :
        '<div style="font-size: 13px; color: #ddd;">No specific optimization tips.</div>'
    }
    </div>
    
    <!-- Footer -->
    <div style="margin-top: 15px; font-size: 12px; color: #888; text-align: right; border-top: 1px solid #444; padding-top: 8px;">
      Click header to collapse
    </div>
  `;

    // Add click handler to toggle visibility
    insightsPanel.querySelector('div').onclick = function() {
        const isVisible = insightsPanel.style.transform === 'translateY(0%)';
        insightsPanel.style.transform = isVisible ? 'translateY(95%)' : 'translateY(0%)';
        this.style.opacity = isVisible ? '0.9' : '1';
    };
}

/**
 * Calculates code efficiency based on analysis
 * @param {Object} analysis - The code analysis results
 * @returns {Object} Efficiency score object
 */
function calculateCodeEfficiency(analysis) {
    // Calculate efficiency based on ratio of functions to loops and async operations
    const totalOperations = analysis.functions + analysis.loops + analysis.asyncOps;
    if (totalOperations === 0) return { score: 100, percentage: 100, label: "N/A" };

    // Penalize for excessive loops relative to functions
    let efficiency = 100;
    if (analysis.functions > 0) {
        const loopRatio = analysis.loops / analysis.functions;
        if (loopRatio > 2) efficiency -= 20;
        else if (loopRatio > 1) efficiency -= 10;
    }

    // Penalize for excessive async operations without proper structuring
    if (analysis.asyncOps > 3 && analysis.functions < 2) {
        efficiency -= 15;
    }

    // Adjust based on total code elements (complexity)
    if (totalOperations > 15) efficiency -= 10;

    // Ensure efficiency is within bounds
    efficiency = Math.max(0, Math.min(100, efficiency));

    // Determine label
    let label;
    if (efficiency >= 90) label = "Excellent";
    else if (efficiency >= 75) label = "Good";
    else if (efficiency >= 60) label = "Fair";
    else label = "Needs Improvement";

    return { score: efficiency, percentage: efficiency, label: label };
}

/**
 * Calculates maintainability score based on code analysis
 * @param {Object} analysis - The code analysis results
 * @returns {Object} Maintainability score object
 */
function calculateMaintainabilityScore(analysis) {
    // Base score out of 10
    let score = 10;

    // Deduct for high function count (potential for spaghetti code)
    if (analysis.functions > 10) score -= 2;
    else if (analysis.functions > 5) score -= 1;

    // Deduct for high loop count (complexity)
    if (analysis.loops > 5) score -= 2;
    else if (analysis.loops > 3) score -= 1;

    // Deduct for high async operation count (potential for callback hell)
    if (analysis.asyncOps > 5) score -= 2;
    else if (analysis.asyncOps > 3) score -= 1;

    // Ensure score is within bounds
    score = Math.max(1, Math.min(10, score));

    // Determine label
    let label;
    if (score >= 8) label = "High";
    else if (score >= 6) label = "Moderate";
    else if (score >= 4) label = "Fair";
    else label = "Low";

    return { score, label };
}

/**
 * Generates detailed optimization tips based on code analysis
 * @param {Object} analysis - The code analysis results
 * @param {number} executionTime - Execution time in milliseconds
 * @returns {Array} Array of optimization tips
 */
function generateOptimizationTips(analysis, executionTime) {
    const tips = [];

    // Loop optimization tips
    if (analysis.loops > 3) {
        if (executionTime > 100) {
            tips.push("Consider optimizing loops with array methods like map/filter/reduce");
        }
        if (analysis.loops > 5) {
            tips.push("Multiple nested loops detected - review for O(n²) or worse time complexity");
        }
    }

    // Async optimization tips
    if (analysis.asyncOps > 3) {
        tips.push("Use Promise.all for parallel async operations to reduce wait time");
        if (analysis.asyncOps > 5) {
            tips.push("Consider using async/await pattern for better readability and error handling");
        }
    }

    // Function optimization tips
    if (analysis.functions > 5) {
        if (executionTime > 200) {
            tips.push("Consider memoization for expensive calculations that are called repeatedly");
        }
        if (analysis.functions > 8) {
            tips.push("High function count - review for potential consolidation of similar functions");
        }
    }

    // Performance tips based on execution time
    if (executionTime > 300) {
        tips.push("Execution time is high - profile code to identify bottlenecks");
    }
    if (executionTime > 500) {
        tips.push("Consider using Web Workers for CPU-intensive operations to avoid blocking the UI");
    }

    // Add general best practices if few specific tips
    if (tips.length < 2) {
        if (analysis.functions > 0) {
            tips.push("Ensure functions follow single responsibility principle for better maintainability");
        }
        if (analysis.asyncOps > 0) {
            tips.push("Add proper error handling for all asynchronous operations");
        }
    }

    return tips;
}

/**
 * Returns a gradient color based on a value between 0 and 1
 * @param {number} value - Value between 0 and 1
 * @returns {string} CSS gradient color
 */
function getGradientColor(value) {
    // Ensure value is between 0 and 1
    value = Math.max(0, Math.min(1, value));

    // Red to yellow to green gradient
    if (value < 0.5) {
        // Red to yellow (0 to 0.5)
        const r = 255;
        const g = Math.round(255 * (value * 2));
        return `rgb(${r}, ${g}, 0)`;
    } else {
        // Yellow to green (0.5 to 1.0)
        const r = Math.round(255 * (1 - (value - 0.5) * 2));
        const g = 255;
        return `rgb(${r}, ${g}, 0)`;
    }
}

/**
 * Enhanced performance rating with descriptions
 * @param {number} executionTime - Execution time in milliseconds
 * @returns {Object} Enhanced performance rating object
 */
function getPerformanceRating(executionTime) {
    if (executionTime < 50) {
        return {
            label: "Excellent",
            icon: "⚡",
            description: "Code execution is very fast. Great job optimizing your code!"
        };
    } else if (executionTime < 100) {
        return {
            label: "Good",
            icon: "✅",
            description: "Code execution is performing well within acceptable limits."
        };
    } else if (executionTime < 300) {
        return {
            label: "Fair",
            icon: "⚠️",
            description: "Code execution is acceptable but could be improved. Review any loops or expensive operations."
        };
    } else {
        return {
            label: "Needs Optimization",
            icon: "🐢",
            description: "Code execution is slow. Look for inefficient algorithms, unnecessary calculations, or blocking operations."
        };
    }
}