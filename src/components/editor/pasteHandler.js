import {editor} from "./domUtils.js";
import {
    // preserveCursorPosition,
    scrollToCursor,
    syncLineNumbers,
    toggleButtonVisibility,
    scheduleHighlightRefresh
} from "@shared/editor/indexHelper.js";

export function setupPasteHandler() {

    editor.addEventListener('paste', (e) => {
        e.preventDefault();
        const paste = (e.clipboardData || window.clipboardData).getData('text');

        if (!paste) return;

        // Get the undo/redo manager instance and save state before paste
        const manager = window.undoRedoManager;
        if (manager) {
            manager.saveState('paste-before');
        }

        // Handle paste with proper cursor positioning at end
        const sel = window.getSelection();
        if (sel.rangeCount) {
            const range = sel.getRangeAt(0);
            range.deleteContents();
            range.insertNode(document.createTextNode(paste));

            // Move cursor to end of pasted content
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
        }

        // Immediate sync operations
        syncLineNumbers();
        scrollToCursor();
        toggleButtonVisibility();
        scheduleHighlightRefresh({immediate: true});

        if (manager) {
            setTimeout(() => manager.saveState('paste-after'), 20);
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
