import {debounceUtils, toggleRunButton, updateLineNumbers} from "./utils/commonUtils.js";
import { highlightEditorSyntax } from "./utils/highlightSyntaxUtils.js";
import { logOutput, runCode } from "./utils/runCode.js";
import {
    focusEditorAtEnd,
    optimizeEditor,
    scrollToCursor,
    syncLineNumbers,
    debouncedHighlight,
    syncScrollPosition,
    clearEditor, toggleButtonVisibility
} from "./utils/indexHelper.js";
import EditorSyncEnhancer from "./utils/editorSynUtils.js";

import { setupSelectionHandlers } from "./DOMIndex/selectionHandlers.js";
import { setupKeyboardHandlers } from "./DOMIndex/keyboardHandlers.js";
import { setupPasteHandler } from "./DOMIndex/pasteHandler.js";
import { copyBtnHandler, themeToggleHandler } from "./DOMIndex/actionBtnHandler.js";

import {
    editor,
    lineNumbers,
    highlighted,
    runBtn,
    output,
    clearBtn
} from "./DOMIndex/domUtils.js";

import "./DOMIndex/codeInsertion.js";

// Global Variables
let syncEnhancer;

// Initialization
document.addEventListener("DOMContentLoaded", () => {
    initEditor();
    initUI();
    bindEvents();
    overrideConsole();
    requestAnimationFrame(initSyncEnhancer);
    setupCleanup();
});

// Initialization Functions
function initEditor() {
    optimizeEditor(editor);
    focusEditorAtEnd(editor);
    scrollToCursor();
    updateLineNumbers(editor, lineNumbers);
    toggleRunButton(editor, runBtn);
    highlightEditorSyntax(editor, highlighted);
    toggleButtonVisibility()
}

function initUI() {
    // Theme toggle
    themeToggleHandler();
}

function initSyncEnhancer() {
    try {
        syncEnhancer = new EditorSyncEnhancer(editor, {
            highlightedEl: highlighted,
            lineNumbersEl: lineNumbers,
            updateLineNumbers: updateLineNumbers,
            highlightEditorSyntax: highlightEditorSyntax,
            syncScrollPosition: syncScrollPosition,
            scrollToCursor: scrollToCursor,
            syncLineNumbers: syncLineNumbers,
            debounceUtils: debounceUtils,
            config: {
                syncThrottle: 16,        // 60fps
                maxFrameBudget: 8,       // 8ms per frame
                scrollThrottle: 40,      // Scroll throttling
                selectionMaxRatio: 0.8   // Large selection threshold
            }
        });

        syncEnhancer.init();

        // Monitor performance every 10 seconds
        setInterval(() => {
            const stats = syncEnhancer.getPerformanceStats();
            if (stats.avgSyncTime > 5) { // If sync is getting slow
                console.warn('EditorSync performance degrading:', stats);
            }
        }, 10000);

        // console.log('EditorSyncEnhancer initialized successfully');
    } catch (error) {
        console.error('Failed to initialize EditorSyncEnhancer:', error);
    }
}


function setupCleanup() {
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (syncEnhancer) {
            syncEnhancer.destroy();
        }
    });
}

// Event Binding
function bindEvents() {
    // Scroll sync
    document.querySelector(".editor-container")
        .addEventListener("scroll", syncScrollPosition);

    // Focus editor on click
    document.querySelector(".editor-section")
        .addEventListener("click", () => {
            if (document.activeElement !== editor) editor.focus();
        });

    // Input changes
    editor.addEventListener("input", () => {
        syncLineNumbers();
        scrollToCursor();
        debouncedHighlight();
        toggleButtonVisibility()

    });

    // Paste, selection, keyboard handlers
    setupPasteHandler();
    setupSelectionHandlers();
    setupKeyboardHandlers();

    // Buttons
    // runBtn.addEventListener("click", () => runCode(editor, output));
    runBtn.addEventListener("click", async () => {
        // Pause sync during code execution for better performance
        if (syncEnhancer) syncEnhancer.pause();

        try {
            await runCode(editor, output);
        } finally {
            // Resume sync after code execution
            if (syncEnhancer) {
                syncEnhancer.resume();
                syncEnhancer.triggerFullSync(); // Ensure everything is in sync
            }
        }
    });
    copyBtnHandler();
    // clearBtn.addEventListener("click", clearEditor);
    // Replace your current clear button handler:
    clearBtn.addEventListener("click", () => {
        clearEditor();
        // Trigger full sync after clearing to ensure clean state
        if (syncEnhancer) syncEnhancer.triggerFullSync();
    });
}

function overrideConsole() {
    const originalLog = console.log;
    console.log = (...args) => {
        args.forEach(arg => logOutput(arg, output));
        originalLog.apply(console, args);
    };
}


// Add this at the very end of your index.js file:
window.syncEnhancerControls = {
    pause: () => syncEnhancer?.pause(),
    resume: () => syncEnhancer?.resume(),
    triggerFullSync: () => syncEnhancer?.triggerFullSync(),
    getPerformanceStats: () => syncEnhancer?.getPerformanceStats(),
};