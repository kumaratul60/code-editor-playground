
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



export function updateSummaryBarWithAnalysis(analysis, executionTime = 0,code="") {
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
    addDeveloperInsightsPanel(analysis, executionTime,code);
}


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


function addDeveloperInsightsPanel(analysis, executionTime, code = "") {
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
  <!-- Footer -->
  <div style="margin-top: 15px; font-size: 12px; color: #888; text-align: right; border-top: 1px solid #444; padding-top: 8px;">
    Click 💡 to open/close
  </div>
    `;
}

//-----Dead Code-----
/*
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
 */

//-----------


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


function analyzeExecutionHotspots(analysis, executionTime) {
    // This is an estimation based on code structure
    // In a real implementation, you would use actual profiling data

    const hotspots = [];
    let totalWeight = 0;

    // Loops are often hotspots
    if (analysis.loops > 0) {
        const loopWeight = analysis.loops * 2;
        totalWeight += loopWeight;
        hotspots.push({
            type: "Loops",
            estimatedImpact: loopWeight,
            recommendation: analysis.loops > 3
                ? "Multiple loops detected - consider optimizing loop operations"
                : "Loop operations appear reasonable"
        });
    }

    // Async operations can be hotspots
    if (analysis.asyncOps > 0) {
        const asyncWeight = analysis.asyncOps * 1.5;
        totalWeight += asyncWeight;
        hotspots.push({
            type: "Async Operations",
            estimatedImpact: asyncWeight,
            recommendation: analysis.asyncOps > 3
                ? "Multiple async operations - consider using Promise.all for parallel execution"
                : "Async operations appear reasonable"
        });
    }

    // Function calls can be hotspots if there are many
    if (analysis.functions > 0) {
        const functionWeight = analysis.functions;
        totalWeight += functionWeight;
        hotspots.push({
            type: "Function Calls",
            estimatedImpact: functionWeight,
            recommendation: analysis.functions > 5
                ? "Many functions - consider memoization for expensive calculations"
                : "Function count appears reasonable"
        });
    }

    // Calculate estimated impact percentages
    hotspots.forEach(hotspot => {
        hotspot.estimatedPercentage = totalWeight > 0
            ? Math.round((hotspot.estimatedImpact / totalWeight) * 100)
            : 0;
    });

    // Sort by estimated impact
    hotspots.sort((a, b) => b.estimatedPercentage - a.estimatedPercentage);

    return {
        hotspots,
        hasCriticalHotspots: executionTime > 200 && hotspots.some(h => h.estimatedPercentage > 50),
        executionCategory: executionTime < 100 ? "Fast" : executionTime < 300 ? "Moderate" : "Slow"
    };
}


function analyzeFunctionRelationships(code) {
    // Extract function names
    const functionNames = (code.match(/function\s+(\w+)/g) || [])
        .map(fn => fn.replace('function ', '').trim());

    // Find function calls
    const relationships = [];

    functionNames.forEach(fnName => {
        // Look for calls to this function in the code
        const regex = new RegExp(`\\b${fnName}\\s*\\(`, 'g');
        let match;
        let callCount = 0;

        while ((match = regex.exec(code)) !== null) {
            callCount++;
        }

        // Don't count the function definition itself
        callCount = Math.max(0, callCount - 1);

        relationships.push({
            name: fnName,
            callCount: callCount
        });
    });

    // Sort by call count
    relationships.sort((a, b) => b.callCount - a.callCount);

    // Identify the most called functions
    const mostCalledFunctions = relationships
        .filter(r => r.callCount > 0)
        .slice(0, 3)
        .map(r => `${r.name} (${r.callCount} calls)`);

    return {
        functionCount: functionNames.length,
        relationships: relationships,
        mostCalledFunctions: mostCalledFunctions,
        hasComplexRelationships: relationships.some(r => r.callCount > 3)
    };
}


function createCodeStructureVisualization(analysis, relationships) {
    // Create a simple visual representation of code structure
    let html = '<div style="margin-top: 15px;">';

    // Only show visualization if we have functions
    if (analysis.functions > 0) {
        html += `
      <div style="font-weight: bold; margin-bottom: 8px; color: #61dafb;">
        📊 Code Structure
      </div>
      <div style="background: rgba(30,30,30,0.6); border-radius: 6px; padding: 10px; font-size: 13px;">
    `;

        // Function relationship visualization
        if (relationships.mostCalledFunctions.length > 0) {
            html += `
        <div style="margin-bottom: 10px;">
          <div style="color: #aaa; margin-bottom: 5px;">Most Called Functions:</div>
          <div style="display: flex; flex-direction: column; gap: 5px;">
      `;

            // Add bars for most called functions
            relationships.mostCalledFunctions.forEach((funcText, index) => {
                const func = relationships.relationships.find(r => funcText.includes(r.name));
                if (func) {
                    const barWidth = Math.min(100, func.callCount * 20);
                    html += `
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 120px; overflow: hidden; text-overflow: ellipsis;">${func.name}</div>
              <div style="flex-grow: 1; display: flex; align-items: center; gap: 8px;">
                <div style="height: 8px; width: ${barWidth}px; background: linear-gradient(to right, #61dafb, #3178c6); border-radius: 4px;"></div>
                <div>${func.callCount} calls</div>
              </div>
            </div>
          `;
                }
            });

            html += '</div></div>';
        }

        // Code composition visualization
        html += `
      <div>
        <div style="color: #aaa; margin-bottom: 5px;">Code Composition:</div>
        <div style="display: flex; height: 20px; border-radius: 10px; overflow: hidden; margin-bottom: 5px;">
    `;

        // Calculate percentages for visualization
        const total = analysis.functions + analysis.loops + analysis.asyncOps;
        const functionPercent = total > 0 ? Math.round((analysis.functions / total) * 100) : 0;
        const loopPercent = total > 0 ? Math.round((analysis.loops / total) * 100) : 0;
        const asyncPercent = total > 0 ? Math.round((analysis.asyncOps / total) * 100) : 0;

        // Add colored bars
        html += `
          <div style="width: ${functionPercent}%; background: #61dafb;" title="Functions: ${analysis.functions}"></div>
          <div style="width: ${loopPercent}%; background: #f6c343;" title="Loops: ${analysis.loops}"></div>
          <div style="width: ${asyncPercent}%; background: #ff6b6b;" title="Async: ${analysis.asyncOps}"></div>
        </div>
        <div style="display: flex; font-size: 12px; justify-content: space-between;">
          <div><span style="color: #61dafb;">■</span> Functions (${functionPercent}%)</div>
          <div><span style="color: #f6c343;">■</span> Loops (${loopPercent}%)</div>
          <div><span style="color: #ff6b6b;">■</span> Async (${asyncPercent}%)</div>
        </div>
      </div>
    `;

        html += '</div>';
    } else {
        html += '<div style="color: #aaa; font-style: italic;">No functions detected for structure visualization</div>';
    }

    html += '</div>';
    return html;
}


function createExecutionTimeVisualization(hotspots) {
    let html = '<div style="margin-top: 15px;">';

    html += `
    <div style="font-weight: bold; margin-bottom: 8px; color: #f6c343;">
      ⏱️ Execution Time Distribution
    </div>
    <div style="background: rgba(30,30,30,0.6); border-radius: 6px; padding: 10px; font-size: 13px;">
  `;

    if (hotspots.hotspots.length > 0) {
        html += `
      <div style="display: flex; height: 20px; border-radius: 10px; overflow: hidden; margin-bottom: 10px;">
    `;

        // Add colored bars for each hotspot
        const colors = ['#f6c343', '#ff6b6b', '#61dafb', '#97e630'];
        hotspots.hotspots.forEach((hotspot, index) => {
            html += `
        <div 
          style="width: ${hotspot.estimatedPercentage}%; background: ${colors[index % colors.length]};" 
          title="${hotspot.type}: ${hotspot.estimatedPercentage}%">
        </div>
      `;
        });

        html += '</div>';

        // Add legend
        html += '<div style="display: flex; flex-wrap: wrap; gap: 10px; font-size: 12px;">';
        hotspots.hotspots.forEach((hotspot, index) => {
            html += `
        <div>
          <span style="color: ${colors[index % colors.length]};">■</span> 
          ${hotspot.type} (${hotspot.estimatedPercentage}%)
        </div>
      `;
        });
        html += '</div>';

        // Add recommendations
        if (hotspots.hasCriticalHotspots) {
            html += `
        <div style="margin-top: 10px; padding: 5px; background: rgba(255,107,107,0.2); border-radius: 4px; font-size: 12px;">
          ⚠️ Critical hotspot detected: ${hotspots.hotspots[0].type} (${hotspots.hotspots[0].estimatedPercentage}%)
        </div>
      `;
        }
    } else {
        html += '<div style="color: #aaa; font-style: italic;">No execution hotspots detected</div>';
    }

    html += '</div></div>';
    return html;
}


function estimateBigOComplexity(code) {
    const loopCount = (code.match(/\b(for|while|do)\b/g) || []).length;
    const arrayCount = (code.match(/\[[^\]]*\]|new\s+Array\s*\(|Array\s*\(|\.push\s*\(|\.unshift\s*\(/g) || []).length;
    const objectCount = (code.match(/\{[^}]*\}/g) || []).filter(obj => !/(function|=>)/.test(obj)).length;
    const setCount = (code.match(/new\s+Set\s*\(/g) || []).length;
    const mapCount = (code.match(/new\s+Map\s*\(/g) || []).length;

    let time = 'O(1)';
    if (loopCount === 1) time = 'O(n)';
    else if (loopCount > 1) time = `O(n^${loopCount})`|| 'O(n^2)';
    const dynamicStructures = arrayCount + objectCount + setCount + mapCount;
    let space = dynamicStructures > 0 ? 'O(n)' : 'O(1)';

    return { time, space, maxLoopDepth:loopCount, arrayCount, objectCount, setCount, mapCount };
}