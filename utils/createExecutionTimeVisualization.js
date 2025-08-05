export function createExecutionTimeVisualization(hotspots) {
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