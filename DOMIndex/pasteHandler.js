import {editor} from "./domUtils.js";
import {
    debouncedHighlight,
    // preserveCursorPosition,
    scrollToCursor,
    syncLineNumbers,
    toggleButtonVisibility
} from "../utils/indexHelper.js";

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

        // Improved paste with immediate cursor positioning
        // preserveCursorPosition(() => {
        //     const sel = window.getSelection();
        //     if (sel.rangeCount) {
        //         const range = sel.getRangeAt(0);
        //         range.deleteContents();
        //         range.insertNode(document.createTextNode(paste));
        //
        //         // Move cursor to end of pasted content
        //         range.collapse(false);
        //         sel.removeAllRanges();
        //         sel.addRange(range);
        //     }
        //
        //     // Immediate sync
        //     syncLineNumbers();
        //     scrollToCursor();
        //     toggleButtonVisibility()
        //
        //     // Delayed highlighting
        //     setTimeout(() => debouncedHighlight(), 10);
        // }, editor);


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

        // Delayed highlighting to avoid interfering with cursor position
        setTimeout(() => debouncedHighlight(), 10);

        // Delayed highlighting to avoid interfering with cursor position
        setTimeout(() => {
            debouncedHighlight();

            // Save state after paste operation is complete
            if (manager) {
                setTimeout(() => {
                    manager.saveState('paste-after');
                }, 20);
            }
        }, 10);
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