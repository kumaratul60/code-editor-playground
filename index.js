import { toggleRunButton, updateLineNumbers } from "./utils/commonUtils.js";
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

// Initialization
document.addEventListener("DOMContentLoaded", () => {
    initEditor();
    initUI();
    bindEvents();
    overrideConsole();
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
    runBtn.addEventListener("click", () => runCode(editor, output));
    copyBtnHandler();
    clearBtn.addEventListener("click", clearEditor);
}

function overrideConsole() {
    const originalLog = console.log;
    console.log = (...args) => {
        args.forEach(arg => logOutput(arg, output));
        originalLog.apply(console, args);
    };
}