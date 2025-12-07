import { logOutput } from "./logging.js";
import { ensureExecutionTracker } from "./executionTracker.js";

export function setupConsoleOverrides(output) {
    const originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info,
        debug: console.debug,
        trace: console.trace,
        table: console.table,
        time: console.time,
        timeEnd: console.timeEnd
    };

    const timeLabels = {};
    let sessionLogTime = performance.now();

    const logWithTimestamp = (args, type) => {
        const now = performance.now();
        const delta = now - sessionLogTime;
        sessionLogTime = now;
        logOutput(args, output, delta, type);
        const tracker = ensureExecutionTracker();
        if (tracker) {
            tracker.recordLog(type, args);
        }
    };

    console.log = (...args) => logWithTimestamp(args, "log");
    console.error = (...args) => logWithTimestamp(args, "error");
    console.warn = (...args) => logWithTimestamp(args, "warn");
    console.info = (...args) => logWithTimestamp(args, "info");
    console.debug = (...args) => logWithTimestamp(args, "debug");
    console.trace = (...args) => logWithTimestamp(args, "trace");

    console.time = (label = 'default') => {
        timeLabels[label] = performance.now();
    };

    console.timeEnd = (label = 'default') => {
        const end = performance.now();
        const start = timeLabels[label];
        if (start) {
            const duration = (end - start).toFixed(3);
            logWithTimestamp([`${label}: ${duration} ms`], "log");
            delete timeLabels[label];
        } else {
            logWithTimestamp([`${label}: no such label`], "log");
        }
    };

    console.table = (data, columns) => {
        let html = '<table style=\"border-collapse:collapse;margin:6px 0 12px 0;font-size:13px;\">';
        let keys = [];

        if (Array.isArray(data)) {
            if (data.length === 0) {
                logWithTimestamp(['[empty table]'], "log");
                return;
            }
            keys = columns || Object.keys(data[0]);
        } else if (typeof data === "object" && data !== null) {
            keys = columns || Object.keys(data);
            data = [data];
        } else {
            logWithTimestamp([String(data)], "log");
            return;
        }

        html += '<tr>';
        html += '<th style=\"border:1px solid #444;padding:2px 8px;background:#222;color:#f6c343;\">(index)</th>';
        keys.forEach(k => {
            html += `<th style=\"border:1px solid #444;padding:2px 8px;background:#222;color:#f6c343;\">${k}</th>`;
        });
        html += '</tr>';

        data.forEach((row, i) => {
            html += '<tr>';
            html += `<td style=\"border:1px solid #444;padding:2px 8px;color:#888;\">${i}</td>`;
            keys.forEach(k => {
                html += `<td style=\"border:1px solid #444;padding:2px 8px;color:#ccc;\">${row[k] !== undefined ? row[k] : ''}</td>`;
            });
            html += '</tr>';
        });

        html += '</table>';
        logWithTimestamp([html], "log");
    };

    return originalConsole;
}

export function restoreConsole(originalConsole) {
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.info = originalConsole.info;
    console.debug = originalConsole.debug;
    console.trace = originalConsole.trace;
    console.table = originalConsole.table;
    console.time = originalConsole.time;
    console.timeEnd = originalConsole.timeEnd;
}
