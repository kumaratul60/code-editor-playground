import { updateSummaryBarWithAnalysis } from "@features/dev-insights/updateSummaryBarWithAnalysis.js";
import { analyzeCode } from "@features/dev-insights/analyzedCode.js";
import { updateOutputStatus } from "@shared/editor/indexHelper.js";
import { getEditorPlainText } from "@shared/commonUtils.js";
import { EXECUTION_TIMEOUT } from "./constants.js";
import { clearOutput, logOutput } from "./logging.js";
import { setupConsoleOverrides, restoreConsole } from "./consoleOverrides.js";
import { performSafetyChecks } from "./safety.js";
import { ensureExecutionTracker } from "./executionTracker.js";
import { instrumentRuntime } from "./instrumentation.js";

function initializeExecution(output) {
    clearOutput(output);
    return performance.now();
}

async function executeCodeSafely(code) {
    const asyncWrapper = `
    (async function() {
      ${code}
    })().catch(err => {
      throw err;
    });
  `;

    const executionPromise = eval(asyncWrapper);
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error(`Execution timed out after ${EXECUTION_TIMEOUT}ms`));
        }, EXECUTION_TIMEOUT);
    });

    return Promise.race([executionPromise, timeoutPromise]);
}

function handleExecutionError(err, startTime, code, output) {
    const errorInfo = {
        message: err?.message,
        stack: err?.stack,
        line: err?.lineNumber || 'unknown',
        column: err?.columnNumber || 'unknown',
        type: err?.constructor?.name
    };

    const errorTime = performance.now() - startTime;
    const analysis = analyzeCode(code);
    updateSummaryBarWithAnalysis(analysis, errorTime, code);
    logOutput([`❌ ${errorInfo.type}: ${errorInfo.message}`], output, 0, "error");
}

export async function runCode(editor, output) {
    const source = getEditorPlainText(editor).trim();
    if (!source.length) {
        updateOutputStatus('idle', 'Nothing to run');
        return;
    }

    updateOutputStatus('running');
    const startTime = initializeExecution(output);
    const tracker = ensureExecutionTracker();
    if (tracker) {
        tracker.beginRun(source);
    }
    const restoreRuntimeInstrumentation = instrumentRuntime();
    const originalConsole = setupConsoleOverrides(output);

    let executionTime = 0;
    let runFailed = false;

    try {
        const code = source;

        if (!performSafetyChecks(code, output)) {
            runFailed = true;
            executionTime = performance.now() - startTime;
            return;
        }

        await executeCodeSafely(code);

        executionTime = performance.now() - startTime;
        window.lastExecutionTime = executionTime;

        const analysis = analyzeCode(code);
        updateSummaryBarWithAnalysis(analysis, executionTime, code);
        updateOutputStatus('success', `Finished in ${executionTime.toFixed(2)} ms`);
    } catch (err) {
        runFailed = true;
        executionTime = performance.now() - startTime;
        if (tracker) {
            tracker.recordError(err);
        }
        handleExecutionError(err, startTime, source, output);
        updateOutputStatus('error', err?.message || 'Execution failed');
    } finally {
        if (tracker) {
            tracker.finishRun(executionTime, { failed: runFailed });
        }
        restoreConsole(originalConsole);
        restoreRuntimeInstrumentation();
    }
}
