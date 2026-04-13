import { editor } from "./domUtils.js";
import {
    insertTextAtSelection,
    scrollToCursor,
    syncLineNumbers,
    toggleButtonVisibility,
    scheduleHighlightRefresh,
    clearSelectionOverlay
} from "@shared/editor/indexHelper.js";
import { ensureExecutionTracker } from "@shared/runtime/executionTracker.js";

export function setupPasteHandler() {

    editor.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text');

        if (!text) return;

        // Save state before paste
        const manager = window.undoRedoManager;
        if (manager) manager.saveState('paste-before');

        // Use internal utility (avoids deprecated execCommand)
        insertTextAtSelection(text);

        // UI Helpers
        toggleButtonVisibility();
        clearSelectionOverlay();

        const tracker = ensureExecutionTracker();
        tracker?.recordUIAction('paste');

        if (manager) {
            setTimeout(() => manager.saveState('paste-after'), 100);
        }
    });

    // Add input event listener to track regular typing for undo/redo
    let typingTimer = null;
    let typingInProgress = false;

    editor.addEventListener('input', (e) => {
        const manager = window.undoRedoManager;
        if (!manager || manager.isUndoRedoOperation) return;

        // If this is the start of a new typing burst, save current state
        if (!typingInProgress) {
            manager.saveState('typing-start');
            typingInProgress = true;
        }

        // Debounce to detect when typing stops
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => {
            manager.saveState('typing-end');
            typingInProgress = false;
        }, 1000);
    })

    // Save state on focus loss (when user clicks away)
    editor.addEventListener('blur', () => {
        const manager = window.undoRedoManager;
        if (manager && !manager.isUndoRedoOperation) {
            manager.saveState('focus-lost');
        }
    });
}
