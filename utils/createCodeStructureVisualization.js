export function createCodeStructureVisualization(analysis, relationships) {
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