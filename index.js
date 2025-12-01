import { toggleRunButton, updateLineNumbers } from "./utils/commonUtils.js";
import { highlightEditorSyntax } from "./utils/highlightSyntaxUtils.js";
import { logOutput, runCode, clearOutput, setConsoleAutoScroll } from "./utils/runCode.js";
import {
    focusEditorAtEnd,
    optimizeEditor,
    scrollToCursor,
    syncLineNumbers,
    debouncedHighlight,
    syncScrollPosition,
    clearEditor,
    toggleButtonVisibility,
    updateCursorMeta,
    updateActiveLineIndicator,
    scheduleCursorRefresh,
    updateOutputStatus
} from "./utils/indexHelper.js";
import UndoRedoManager from "./utils/undoRedoManager.js";

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

// Global instances
let undoRedoManager = null;

// Initialization
document.addEventListener("DOMContentLoaded", () => {
    initEditor();
    initUI();
    bindEvents();
    overrideConsole();
    initUndoRedoManager();
});

// Initialization Functions
function initEditor() {
    optimizeEditor(editor);
    focusEditorAtEnd(editor);
    scrollToCursor();
    updateLineNumbers(editor, lineNumbers);
    toggleRunButton(editor, runBtn);
    highlightEditorSyntax(editor, highlighted);
    toggleButtonVisibility();
    updateCursorMeta();
    updateActiveLineIndicator();
}

function initUI() {
    // Theme toggle
    themeToggleHandler();
}

// Initialize Undo/Redo Manager
function initUndoRedoManager() {
    if (!undoRedoManager) {
        undoRedoManager = new UndoRedoManager(editor);

        // Make it globally accessible for debugging and other operations
        window.undoRedoManager = undoRedoManager;
    }
    return undoRedoManager;
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
        scheduleCursorRefresh();
        debouncedHighlight();
        toggleButtonVisibility()

    });

    // Paste, selection, keyboard handlers
    setupPasteHandler();
    setupSelectionHandlers();
    setupKeyboardHandlers();

    // Buttons
    runBtn.addEventListener("click", () => runCode(editor, output));
    copyBtnHandler();
    clearBtn.addEventListener("click", clearEditor);

    setupConsoleControls();
}

function overrideConsole() {
    const originalLog = console.log;
    console.log = (...args) => {
        args.forEach(arg => logOutput(arg, output));
        originalLog.apply(console, args);
    };
}

function setupConsoleControls() {
    const filterButtons = document.querySelectorAll('[data-console-filter]');
    const clearConsoleBtn = document.getElementById('console-clear');
    const autoScrollBtn = document.getElementById('console-autoscroll');

    if (filterButtons.length) {
        filterButtons.forEach((btn) => {
            btn.addEventListener('click', () => {
                const selectedFilter = btn.dataset.consoleFilter || 'all';
                output.dataset.filter = selectedFilter;

                filterButtons.forEach((button) => {
                    button.classList.toggle('active', button === btn);
                });
            });
        });
    }

    if (clearConsoleBtn) {
        clearConsoleBtn.addEventListener('click', () => {
            clearOutput(output);
            updateOutputStatus('idle');
        });
    }

    if (autoScrollBtn) {
        let isAutoScrollEnabled = true;
        autoScrollBtn.addEventListener('click', () => {
            isAutoScrollEnabled = !isAutoScrollEnabled;
            autoScrollBtn.setAttribute('aria-pressed', String(isAutoScrollEnabled));
            autoScrollBtn.textContent = isAutoScrollEnabled ? 'Auto-scroll: On' : 'Auto-scroll: Off';
            setConsoleAutoScroll(isAutoScrollEnabled);
        });
        setConsoleAutoScroll(isAutoScrollEnabled);
    }
}
