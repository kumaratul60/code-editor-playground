/**
 * Displays a single, consolidated table of all execution statistics.
 * @param {HTMLElement} outputEl - The output element to append the table to
 * @param {number} totalExecTime - Total execution time in milliseconds
 */
function logStatsTable(outputEl, totalExecTime) {
    // 1. --- Extract session stats with defaults ---
    const {
        totalAsyncTime = 0,
        asyncCallCount = 0,
        longestAsync = 0,
        shortestAsync = 0,
        totalSyncTime = 0,
        syncCallCount = 0,
        longestSync = 0,
        shortestSync = 0,
        functionTimings = {}
    } = window.__sessionStats || {};

    const steps = window.__asyncSteps || [];
    const functionCalls = Object.entries(functionTimings);

    // 2. --- Helper function to create table rows ---
    const createStatRow = (label, value, unit = "ms") => {
        const numericValue = parseFloat(value);
        const color = getTimeColor(numericValue, unit);
        return `
      <tr>
        <td style="padding: 2px 16px;">${label}</td>
        <td style="padding: 2px 16px; text-align: right; color: ${color}; font-weight: bold;">
          ${numericValue.toFixed(2)} ${unit}
        </td>
      </tr>`;
    };

    // Helper to get color based on time value
    const getTimeColor = (value, unit) => {
        if (unit !== "ms" || isNaN(value)) return "#ccc";
        return value < 100 ? "#a6e22e" : value < 300 ? "#f6c343" : "#ff6b6b";
    };

    // 3. --- Performance Insights Section ---
    let performanceInsights = '';

    // Find slowest and fastest functions
    if (functionCalls.length > 0) {
        const syncCalls = functionCalls.filter(([_, times]) => times.every(t => !t.async));
        const asyncCalls = functionCalls.filter(([_, times]) => times.some(t => t.async));

        const slowestCall = functionCalls.flatMap(([name, times]) =>
            times.map(t => ({
                name,
                duration: t.end - t.start,
                async: t.async
            }))
        ).sort((a, b) => b.duration - a.duration)[0];

        const fastestSync = syncCalls.flatMap(([name, times]) =>
            times.filter(t => !t.async).map(t => ({
                name,
                duration: t.end - t.start
            })))
            .sort((a, b) => a.duration - b.duration)[0];

        const fastestAsync = asyncCalls.flatMap(([name, times]) =>
            times.filter(t => t.async).map(t => ({
                name,
                duration: t.end - t.start
            })))
            .sort((a, b) => a.duration - b.duration)[0];

        performanceInsights = `
      <div style="margin: 12px 0; padding: 12px; background: #2a2a2a; border-radius: 4px;">
        <div style="font-weight: bold; margin-bottom: 8px; color: #61dafb;">📉 Performance Insights:</div>
        ${slowestCall ? `<div>🐢 <b>Slowest Call</b>: ${slowestCall.name} → ${slowestCall.duration.toFixed(2)}ms</div>` : ''}
        ${fastestSync ? `<div>⚡ <b>Fastest Sync</b>: ${fastestSync.name} → ${fastestSync.duration.toFixed(2)}ms</div>` : ''}
        ${fastestAsync ? `<div>⚡ <b>Fastest Async</b>: ${fastestAsync.name} → ${fastestAsync.duration.toFixed(2)}ms</div>` : ''}
      </div>`;
    }

    // 4. --- Build the HTML for the table ---
    let tableHTML = `
    <div style="margin-top: 1.5em; border-top: 2px solid #555; padding: 8px 0; color: #ccc;">
      ${performanceInsights}
      <table style="width: 100%; font-size: 14px; color: #ccc; border-collapse: collapse;">
        <tbody>`;

    // --- Total Execution Time ---
    tableHTML += `
      <tr>
        <td style="padding: 8px; font-weight: bold; font-size: 1.1em; border-bottom: 1px solid #444;">⏱️ Total Execution Time</td>
        <td style="padding: 8px; font-weight: bold; font-size: 1.1em; color: ${getTimeColor(totalExecTime, 'ms')}; border-bottom: 1px solid #444; text-align: right;">
          ${totalExecTime.toFixed(2)} ms
        </td>
      </tr>`;

    // --- Async Steps Section ---
    if (steps.length > 0) {
        tableHTML += `
      <tr>
        <td colspan="2" style="padding: 12px 8px 4px; font-weight: bold;">
          🦀 Async Steps Breakdown
        </td>
      </tr>`;

        const maxDuration = Math.max(...steps.map((s) => parseFloat(s.duration))) || 1;
        steps.forEach((step, i) => {
            const duration = parseFloat(step.duration);
            const isSlow = duration > 100;
            const barWidth = Math.min((duration / maxDuration) * 100, 100);

            tableHTML += `
        <tr>
          <td style="padding: 2px 16px;">
            <span style="color: ${isSlow ? "#ff6b6b" : "#ccc"};">
              #${i + 1} @ ${step.start}ms → <b>${step.label}</b> (${step.duration}ms) ${isSlow ? "⚠️" : ""}
            </span>
          </td>
          <td style="padding: 2px 16px; text-align: right;">
            <div style="background: #555; width: 100px; height: 10px; display: inline-block; border-radius: 3px; overflow: hidden;">
              <div style="background: #61dafb; width: ${barWidth}%; height: 100%;"></div>
            </div>
          </td>
        </tr>`;
        });
    }

    // --- Session Stats Section ---
    const avgAsync = asyncCallCount ? totalAsyncTime / asyncCallCount : 0;
    const avgSync = syncCallCount ? totalSyncTime / syncCallCount : 0;

    tableHTML += `
    <tr>
      <td colspan="2" style="padding: 12px 8px 4px; font-weight: bold;">
        📊 Execution Statistics
      </td>
    </tr>`;

    // Async Stats
    tableHTML += `
    <tr>
      <td colspan="2" style="padding: 4px 16px; font-weight: bold; color: #61dafb;">
        Asynchronous Operations
      </td>
    </tr>`;

    tableHTML += createStatRow("Total Time", totalAsyncTime, "ms");
    tableHTML += createStatRow("Average Time", avgAsync, "ms");
    tableHTML += createStatRow("Longest Operation", longestAsync, "ms");
    tableHTML += createStatRow("Shortest Operation", shortestAsync, "ms");
    tableHTML += createStatRow("Total Calls", asyncCallCount, "");

    // Sync Stats
    tableHTML += `
    <tr>
      <td colspan="2" style="padding: 12px 16px 4px; font-weight: bold; color: #97e630;">
        Synchronous Operations
      </td>
    </tr>`;

    tableHTML += createStatRow("Total Time", totalSyncTime, "ms");
    tableHTML += createStatRow("Average Time", avgSync, "ms");
    tableHTML += createStatRow("Longest Operation", longestSync, "ms");
    tableHTML += createStatRow("Shortest Operation", shortestSync, "ms");
    tableHTML += createStatRow("Total Calls", syncCallCount, "");

    // Close table and container
    tableHTML += `
        </tbody>
      </table>
    </div>`;

    // 5. --- Create and append the stats element ---
    const statsElement = document.createElement("div");
    statsElement.className = "execution-stats";
    statsElement.style.marginTop = "1em";
    statsElement.style.padding = "12px";
    statsElement.style.borderRadius = "4px";
    statsElement.style.backgroundColor = "#1e1e1e";
    statsElement.innerHTML = tableHTML;

    outputEl.appendChild(statsElement);
    outputEl.scrollTop = outputEl.scrollHeight;
}