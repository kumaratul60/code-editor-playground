import {calculateComplexityScore} from "./calculateComplexityScore.js";
import {getPerformanceRating} from "./getPerformanceRating.js";
import {getOptimizationTips} from "./getOptimizationTips.js";
import {addDeveloperInsightsPanel} from "./addDeveloperInsightsPanel.js";

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






























