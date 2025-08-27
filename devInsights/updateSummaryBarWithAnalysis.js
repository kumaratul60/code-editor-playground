import {getPerformanceRating} from "./getPerformanceRating.js";
import {addDeveloperInsightsPanel} from "./addDeveloperInsightsPanel.js";

export function updateSummaryBarWithAnalysis(analysis, executionTime = 0,code="") {
    const summaryElement = document.getElementById('summary-icons');
    const execTimeElement = document.getElementById('exec-time');

    // Determine performance rating based on execution time
    const performanceRating = getPerformanceRating(executionTime);

    if (summaryElement) {
        // Enhanced summary with complexity indicator and more detailed metrics
        summaryElement.innerHTML = `
            <span style="color: var(--dev-panel-accent);">🧩 ${analysis.functions} func</span> |
            <span style="color: var(--dev-panel-secondary);">🔁 ${analysis.loops} loops</span> |
            <span style="color: var(--dev-panel-warning);">⏳ ${analysis.asyncOps} async</span> 
            
        `;

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

        
    }

    if (execTimeElement) {
        const timeColor = executionTime < 100 ? "#a6e22e" : executionTime < 300 ? "#f6c343" : "#ff6b6b";
        execTimeElement.innerHTML = `⏱️ Total Time: <span style="color: ${timeColor}">${executionTime.toFixed(2)} ms</span> ${performanceRating.icon}`;
        execTimeElement.title = `Performance Rating: ${performanceRating.label}`;
    }

    addDeveloperInsightsPanel(analysis, executionTime,code);
}
