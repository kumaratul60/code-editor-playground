import { toggleRunButton, updateLineNumbers } from "./utils/commonUtils.js";
import { logOutput, runCode } from "./utils/runCode.js";
import {
    focusEditorAtEnd,
    optimizeEditor,
    scrollToCursor,
    syncLineNumbers,
    debouncedHighlight,
    syncScrollPosition,
    clearEditor,
    toggleButtonVisibility
} from "./utils/indexHelper.js";
import "./utils/analytics.js";
import UndoRedoManager from "./utils/undoRedoManager.js";

import { setupSelectionHandlers } from "./DOMIndex/selectionHandlers.js";
import { setupKeyboardHandlers } from "./DOMIndex/keyboardHandlers.js";
import { setupPasteHandler } from "./DOMIndex/pasteHandler.js";
import { copyBtnHandler, themeToggleHandler } from "./DOMIndex/actionBtnHandler.js";

import {
    editor,
    lineNumbers,
    runBtn,
    output,
    clearBtn
} from "./DOMIndex/domUtils.js";

import "./DOMIndex/codeInsertion.js";
import { initializeAnalytics } from "./utils/analyticsConfig.js";
import {
    getEditorMetrics,
    trackActiveTyping,
    trackCodeClear,
    trackCodeCopy,
    trackCodeExecution,
    trackCodeExecutionError,
    trackDevInsightsUsage,
    trackEditorInitialized,
    trackThemeToggle,
    trackUserIdle,
    debounceTracking
} from "./utils/trackUtil.js";

// Global instances
let undoRedoManager = null;

// Debounced tracking function for code edits
const debouncedTrackCodeEdit = debounceTracking((action, details) => {
    if (window.playgroundAnalytics) {
        window.playgroundAnalytics.trackEvent('code_edit', {
            action,
            ...details,
            timestamp: Date.now()
        });
    }
}, 500);

// Initialization
document.addEventListener("DOMContentLoaded", () => {
    initEditor();
    initUI();
    initUndoRedoManager();
    bindEvents();
    overrideConsole();

    // Initialize analytics
    initializeAnalytics();

    // Track editor initialization with available features
    trackEditorInitialized([
        'syntax_highlighting',
        'dev_insights',
        'undo_redo',
        'theme_toggle',
        'code_execution',
        'line_numbers',
        'copy_paste'
    ]);
});

// Initialization Functions
function initEditor() {
    focusEditorAtEnd(editor);
    optimizeEditor(editor);
    syncLineNumbers();
    debouncedHighlight();
}

function initUI() {
    toggleRunButton(editor, runBtn);
    toggleButtonVisibility();
}

// Initialize Undo/Redo Manager
function initUndoRedoManager() {
    if (!undoRedoManager) {
        undoRedoManager = new UndoRedoManager(editor);
        // Make it globally available for other modules
        window.undoRedoManager = undoRedoManager;
    }
}

// Event Binding
function bindEvents() {
    // Focus management
    editor.addEventListener("blur", () => {
        setTimeout(() => {
            if (document.activeElement !== editor) editor.focus();
        });
    });

    // Scroll sync
    document.querySelector(".editor-container")
        .addEventListener("scroll", syncScrollPosition);

    // Focus editor on click
    document.querySelector(".editor-section")
        .addEventListener("click", () => {
            if (document.activeElement !== editor) editor.focus();
        });

    // Single input event listener with all functionality and correct parameters
    editor.addEventListener("input", (e) => {
        // Core editor functionality with CORRECT parameter usage
        updateLineNumbers(editor, lineNumbers);
        toggleRunButton(editor, runBtn);
        debouncedHighlight();
        syncScrollPosition();
        toggleButtonVisibility();
        scrollToCursor();

        // Analytics tracking
        const editorMetrics = getEditorMetrics(editor);
        debouncedTrackCodeEdit('type', {
            input_type: e.inputType || 'unknown',
            ...editorMetrics
        });

        // Track active typing
        trackActiveTyping();
    });

    // Run button with analytics tracking
    runBtn.addEventListener("click", async () => {
        const startTime = Date.now();
        const codeContent = editor.textContent;

        try {
            await runCode(editor, output);
            const executionTime = Date.now() - startTime;

            // Track successful code execution
            trackCodeExecution(codeContent, executionTime, false, {
                trigger: 'button_click'
            });

        } catch (error) {
            const executionTime = Date.now() - startTime;

            // Track failed code execution
            trackCodeExecutionError(error, codeContent, executionTime);
        }
    });

    // Clear button with proper function call
    clearBtn.addEventListener("click", () => {
        const codeLength = editor.textContent.length;

        // Call clearEditor with NO parameters (it doesn't accept any)
        clearEditor();

        // Track clear action
        trackCodeClear(codeLength);
    });

    // Theme toggle with analytics tracking
    document.getElementById("theme-toggle").addEventListener("click", () => {
        const wasLight = document.body.classList.contains('light-theme');

        // Execute the theme toggle (call the actual handler)
        themeToggleHandler();

        // Track theme change
        trackThemeToggle(
            wasLight ? 'light' : 'dark',
            wasLight ? 'dark' : 'light'
        );
    });

    // Copy button with analytics tracking
    document.getElementById("copy-btn").addEventListener("click", () => {
        const editorMetrics = getEditorMetrics(editor);

        // Execute the copy action (call the actual handler)
        copyBtnHandler();

        // Track copy action
        trackCodeCopy(editorMetrics.content_length, editorMetrics.lines_count);
    });

    // Track DevInsights panel usage (if it exists)
    const devInsightsToggle = document.querySelector('[data-dev-insights]');
    if (devInsightsToggle) {
        devInsightsToggle.addEventListener('click', () => {
            trackDevInsightsUsage();
        });
    }

    // User engagement tracking with idle detection
    let idleTimer;
    const trackUserActivity = () => {
        clearTimeout(idleTimer);

        idleTimer = setTimeout(() => {
            trackUserIdle(30000); // 30 seconds idle
        }, 30000);
    };

    // Track various user interactions for engagement
    ['click', 'keydown', 'scroll', 'mousemove'].forEach(event => {
        document.addEventListener(event, trackUserActivity, { passive: true });
    });

    // Setup handlers with NO parameters (they don't accept any)
    setupSelectionHandlers();
    setupKeyboardHandlers();
    setupPasteHandler();
}

// Console override for capturing output and analytics
function overrideConsole() {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = (...args) => {
        args.forEach(arg => logOutput(arg, 'log'));
        originalLog.apply(console, args);
    };

    console.warn = (...args) => {
        args.forEach(arg => logOutput(arg, 'warn'));
        originalWarn.apply(console, args);

        // Track console warnings
        if (window.playgroundAnalytics) {
            window.playgroundAnalytics.trackError('console_warning', {
                warning_args: args.map(arg => String(arg)).join(' ')
            });
        }
    };

    console.error = (...args) => {
        args.forEach(arg => logOutput(arg, 'error'));
        originalError.apply(console, args);

        // Track console errors
        if (window.playgroundAnalytics) {
            window.playgroundAnalytics.trackError('console_error', {
                error_args: args.map(arg => String(arg)).join(' ')
            });
        }
    };


    console.log('Analytics initialized:', !!window.playgroundAnalytics);

// Check environment variables
    console.log('GA ID:', import.meta.env.VITE_GA_MEASUREMENT_ID);
    console.log('Analytics enabled:', import.meta.env.VITE_ANALYTICS_ENABLED);

// Manually trigger a test event
    if (window.playgroundAnalytics) {
        window.playgroundAnalytics.trackEvent('test_event', { test: true });
    }
}