import {analyzeCode} from "../devInsights/analyzedCode";
import {updateSummaryBarWithAnalysis} from "../devInsights/updateSummaryBarWithAnalysis";
import {clearOutput, logOutput} from "./runCode";

let lastLogTime = null;
async function runCode(editor, output) {
    // Initialization
    clearOutput(output);
    resetSessionStats();



    lastLogTime = performance.now();
    const startTime = performance.now();

    // Console Override Setup
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalTable = console.table;
    const originalTime = console.time;
    const originalTimeEnd = console.timeEnd;

    const timeLabels = {};


    console.log = (...args) => logWithTimestamp(args, output, "log");
    console.error = (...args) => logWithTimestamp(args, output, "error");
    console.warn = (...args) => logWithTimestamp(args, output, "warn");

    console.time = (label = 'default') => {
        timeLabels[label] = performance.now();
    };
    console.timeEnd = (label = 'default') => {
        const end = performance.now();
        const start = timeLabels[label];
        if (start) {
            const duration = (end - start).toFixed(3);
            logWithTimestamp([`${label}: ${duration} ms`], output, "log");
            delete timeLabels[label];
        } else {
            logWithTimestamp([`${label}: no such label`], output, "log");
        }
    };

    console.table = (data, columns) => {
        let html = '<table style="border-collapse:collapse;margin:6px 0 12px 0;font-size:13px;">';
        let keys = [];

        // Determine columns
        if (Array.isArray(data)) {
            if (data.length === 0) {
                logWithTimestamp(['[empty table]'], output, "log");
                return;
            }
            keys = columns || Object.keys(data[0]);
        } else if (typeof data === "object" && data !== null) {
            keys = columns || Object.keys(data);
            data = [data];
        } else {
            logWithTimestamp([String(data)], output, "log");
            return;
        }

        // Header
        html += '<tr>';
        html += '<th style="border:1px solid #444;padding:2px 8px;background:#222;color:#f6c343;">(index)</th>';
        keys.forEach(k => {
            html += `<th style="border:1px solid #444;padding:2px 8px;background:#222;color:#f6c343;">${k}</th>`;
        });
        html += '</tr>';

        // Rows
        data.forEach((row, i) => {
            html += '<tr>';
            html += `<td style="border:1px solid #444;padding:2px 8px;color:#888;">${i}</td>`;
            keys.forEach(k => {
                html += `<td style="border:1px solid #444;padding:2px 8px;color:#ccc;">${row[k] !== undefined ? row[k] : ''}</td>`;
            });
            html += '</tr>';
        });

        html += '</table>';
        logWithTimestamp([html], output, "log");
    };

    const code = editor.innerText;

    // === SAFETY CHECKS ===
// Sanitize code for dangerous patterns
    try {
        sanitizeCode(code);
    } catch (err) {
        logOutput([`❌ ${err.message}`], output, 0, "error");
        return;
    }

// Check initial memory usage
    try {
        checkMemoryUsage();
    } catch (err) {
        logOutput([`❌ ${err.message}`], output, 0, "error");
        return;
    }

    // Instrumentation Template
//   const instrumentedCode = `
//   // Define user code (so functions exist on window)
//   eval(code);
//
//   // Optionally wrap all named functions on window (no timing, just pass-through)
//   const context = typeof window !== 'undefined' ? window : globalThis;
//   Object.keys(context).forEach(name => {
//     if (
//       typeof context[name] === 'function' &&
//       !name.startsWith('__')
//     ) {
//       const orig = context[name];
//       context[name] = function(...args) {
//         // Just call the original function, no timing, no stats
//         return orig.apply(this, args);
//       };
//     }
//   });
// `;

    try {
        // Store the execution time for tracking
        // window.lastExecutionTime = startTime;

        // Execute Instrumented Code with startTime and code as arguments
        const asyncWrapper = `
      (async function() {
        ${code}
      })().catch(err => {
        console.error('Async execution error:', err.message);
        throw err;
      });
    `;

        // Execute the code directly
        // await eval(asyncWrapper);

        // With this safer version:
        const executionPromise = eval(asyncWrapper);
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`Execution timed out after ${EXECUTION_TIMEOUT}ms`));
            }, EXECUTION_TIMEOUT);
        });

        await Promise.race([executionPromise, timeoutPromise]);


        // Log Execution Statistics
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        // console.log('Code executed in', executionTime.toFixed(2), 'ms');

        // Update UI with Analysis
        const analysis = analyzeCode(code);
        updateSummaryBarWithAnalysis(analysis, executionTime,code);

    } catch (err) {
        // Error Handling
        // console.error('Error executing code:', err);
        const errorInfo = {
            message: err.message,
            stack: err.stack,
            line: err.lineNumber || 'unknown',
            column: err.columnNumber || 'unknown',
            type: err.constructor.name
        };
        const errorTime = performance.now() - startTime;
        const analysis = analyzeCode(code);
        updateSummaryBarWithAnalysis(analysis, errorTime,code);
        // logOutput([`❌ ${err.message}`], output, 0, "error");
        //   (Line: ${errorInfo.line})
        logOutput([`❌ ${errorInfo.type}: ${errorInfo.message} `], output, 0, "error");
    } finally {
        // Cleanup
        console.log = originalLog;
        console.error = originalError;
        console.warn = originalWarn;
        console.table = originalTable;
        console.time = originalTime;
        console.timeEnd = originalTimeEnd;
    }
}