// import {calculateComplexityScore} from "./calculateComplexityScore.js";
import {getPerformanceRating} from "./getPerformanceRating.js";
// import {getOptimizationTips} from "./getOptimizationTips.js";
import {addDeveloperInsightsPanel} from "./addDeveloperInsightsPanel.js";

export function updateSummaryBarWithAnalysis(analysis, executionTime = 0,code="") {
    const summaryElement = document.getElementById('summary-icons');
    const execTimeElement = document.getElementById('exec-time');

    // Calculate code complexity score (simple heuristic)
    // const complexityScore = calculateComplexityScore(analysis);

    // Determine performance rating based on execution time
    const performanceRating = getPerformanceRating(executionTime);

    if (summaryElement) {
        // Enhanced summary with complexity indicator and more detailed metrics
        summaryElement.innerHTML = `
            <span style="color: var(--dev-panel-accent);">🧩 ${analysis.functions} func</span> |
            <span style="color: var(--dev-panel-secondary);">🔁 ${analysis.loops} loops</span> |
            <span style="color: var(--dev-panel-warning);">⏳ ${analysis.asyncOps} async</span> 
            
        `;
        // <span style="color: ${performanceRating.color};">${performanceRating.icon} ${complexityScore}</span>

        // Enhanced tooltip with detailed breakdowns
        summaryElement.title = `
DETAILED CODE ANALYSIS

FUNCTIONS (${analysis.functions} total):
${analysis.functionTypes ? `${[
            analysis.functionTypes.regular > 0 ? `  • Regular Functions: ${analysis.functionTypes.regular}` : '',
            analysis.functionTypes.arrow > 0 ? `  • Arrow Functions: ${analysis.functionTypes.arrow}` : '',
            analysis.functionTypes.async > 0 ? `  • Async Functions: ${analysis.functionTypes.async}` : '',
            analysis.functionTypes.methods > 0 ? `  • Methods: ${analysis.functionTypes.methods}` : '',
            analysis.functionTypes.constructors > 0 ? `  • Constructors: ${analysis.functionTypes.constructors}` : '',
            analysis.functionTypes.generators > 0 ? `  • Generators: ${analysis.functionTypes.generators}` : '',
            analysis.functionTypes.higherOrder > 0 ? `  • Higher-Order: ${analysis.functionTypes.higherOrder}` : ''
        ].filter(item => item !== '').join('\n') || '  • No functions detected'}` : '  • Basic function count only'}

LOOPS (${analysis.loops} total):
${analysis.loopTypes ? `${[
            analysis.loopTypes.for > 0 ? `  • For Loops: ${analysis.loopTypes.for}` : '',
            analysis.loopTypes.while > 0 ? `  • While Loops: ${analysis.loopTypes.while}` : '',
            analysis.loopTypes.doWhile > 0 ? `  • Do-While Loops: ${analysis.loopTypes.doWhile}` : '',
            analysis.loopTypes.forIn > 0 ? `  • For-In Loops: ${analysis.loopTypes.forIn}` : '',
            analysis.loopTypes.forOf > 0 ? `  • For-Of Loops: ${analysis.loopTypes.forOf}` : '',
            analysis.loopTypes.forEach > 0 ? `  • forEach Calls: ${analysis.loopTypes.forEach}` : '',
            analysis.loopTypes.functionalMethods > 0 ? `  • Functional Methods: ${analysis.loopTypes.functionalMethods}` : ''
        ].filter(item => item !== '').join('\n') || '  • No loops detected'}` : '  • Basic loop count only'}

ASYNC OPERATIONS (${analysis.asyncOps} total):
${analysis.asyncTypes ? `${[
            analysis.asyncTypes.asyncFunctions > 0 ? `  • Async Functions: ${analysis.asyncTypes.asyncFunctions}` : '',
            analysis.asyncTypes.await > 0 ? `  • Await Expressions: ${analysis.asyncTypes.await}` : '',
            analysis.asyncTypes.promises > 0 ? `  • Promise Usage: ${analysis.asyncTypes.promises}` : '',
            analysis.asyncTypes.fetch > 0 ? `  • Fetch Calls: ${analysis.asyncTypes.fetch}` : '',
            analysis.asyncTypes.setTimeout > 0 ? `  • Timer Functions: ${analysis.asyncTypes.setTimeout}` : '',
            analysis.asyncTypes.callbacks > 0 ? `  • Callbacks: ${analysis.asyncTypes.callbacks}` : ''
        ].filter(item => item !== '').join('\n') || '  • No async operations detected'}` : '  • Basic async count only'}

PERFORMANCE:
  - Rating: ${performanceRating.label}

        `.trim();

        
    };
    //  • Complexity Score: ${complexityScore}
    //   • Execution Time: ${executionTime.toFixed(2)}ms

    if (execTimeElement) {
        const timeColor = executionTime < 100 ? "#a6e22e" : executionTime < 300 ? "#f6c343" : "#ff6b6b";
        execTimeElement.innerHTML = `⏱️ Total Time: <span style="color: ${timeColor}">${executionTime.toFixed(2)} ms</span> ${performanceRating.icon}`;
        execTimeElement.title = `Performance Rating: ${performanceRating.label}`;
    }

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
