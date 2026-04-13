import { toggleRunButton, updateLineNumbers } from "@shared/commonUtils.js";
import { highlightEditorSyntax } from "@shared/highlightSyntaxUtils.js";
import { logOutput,  clearOutput } from "@shared/runtime/index.js";
import { ensureExecutionTracker } from "@shared/runtime/executionTracker.js";
import {
    focusEditorAtEnd,
    optimizeEditor,
    scrollToCursor,
    syncLineNumbers,
    toggleButtonVisibility,
    updateCursorMeta,
    updateActiveLineIndicator,
    scheduleCursorRefresh,
    updateOutputStatus,
    scheduleHighlightRefresh
} from "@shared/editor/indexHelper.js";
import UndoRedoManager from "@shared/undoRedoManager.js";

import { setupSelectionHandlers } from "@editor/selectionHandlers.js";
import { setupKeyboardHandlers } from "@editor/keyboardHandlers.js";
import { setupPasteHandler } from "@editor/pasteHandler.js";
import { initHeader } from "@header/header.js";
import { addDeveloperInsightsPanel } from "@features/dev-insights/addDeveloperInsightsPanel.js";
import { analyzeCode } from "@features/dev-insights/analyzedCode.js";

import {
    editor,
    lineNumbers,
    highlighted,
    runBtn,
    output,
    clearBtn,
    initDomElements
} from "@editor/domUtils.js";

import "@editor/codeInsertion.js";

// Global instances
let undoRedoManager = null;

// Initialization
document.addEventListener("DOMContentLoaded", () => {
    initDomElements();
    ensureExecutionTracker();
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
    // Header functionality
    initHeader();
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
    // Focus editor on click in the container (empty space)
    document.querySelector(".editor-container")
        .addEventListener("click", (e) => {
            if (e.target !== editor) {
                // Prevent default header jump
                editor.focus({ preventScroll: true });
                
                // If clicked below content, ensure cursor goes to end
                // We let default browser behavior handle text selection if clicked ON text
                // But for background clicks, focus is essential
                const range = document.createRange();
                range.selectNodeContents(editor);
                range.collapse(false);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            }
        });

    // Input changes
    editor.addEventListener("input", (event) => {
        const forceImmediateHighlight = [
            'deleteContentBackward',
            'deleteContentForward',
            'insertFromPaste',
            'deleteByCut',
            'insertLineBreak',
            'insertParagraph'
        ].includes(event.inputType);

        syncLineNumbers();
        scheduleCursorRefresh();
        scheduleHighlightRefresh({immediate: forceImmediateHighlight});
        toggleButtonVisibility();
        toggleRunButton(editor, runBtn);
    });

    // Paste, selection, keyboard handlers
    setupPasteHandler();
    setupSelectionHandlers();
    setupKeyboardHandlers();

    setupConsoleControls();
}

function overrideConsole() {
    const originalLog = console.log;
    console.log = (...args) => {
        args.forEach(arg => logOutput(arg, output));
        originalLog.apply(console, args);
        // Update button visibility after log
        if (window.updateConsoleClearBtn) window.updateConsoleClearBtn();
    };
}

function setupConsoleControls() {
    // Console Clear Button: Clear Output ONLY
    const consoleClearBtn = document.getElementById('console-clear-btn');
    
    // Toggle visibility helper
    const updateClearBtnVisibility = () => {
        if (consoleClearBtn) {
            consoleClearBtn.style.display = output.children.length > 0 ? 'inline-flex' : 'none';
        }
    };

    if (consoleClearBtn) {
        consoleClearBtn.addEventListener('click', () => {
            clearOutput(output);
            updateOutputStatus('idle');
            updateClearBtnVisibility();
        });
    }
    
    // Expose for overrideConsole to call
    window.updateConsoleClearBtn = updateClearBtnVisibility;
    
    // Initial check
    updateClearBtnVisibility();
}
