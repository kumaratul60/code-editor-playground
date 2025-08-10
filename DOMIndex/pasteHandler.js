import {editor} from "./domUtils.js";
import {
    debouncedHighlight,
    preserveCursorPosition,
    scrollToCursor,
    syncLineNumbers,
    toggleButtonVisibility
} from "../utils/indexHelper.js";

export function setupPasteHandler() {

    editor.addEventListener('paste', (e) => {
        e.preventDefault();
        const paste = (e.clipboardData || window.clipboardData).getData('text');

        if (!paste) return;

        // Pause EditorSyncEnhancer during paste to prevent conflicts
        if (window.syncEnhancerControls) {
            window.syncEnhancerControls.pause();
        }

        // paste with immediate cursor positioning
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

        const sel = window.getSelection();
        if (sel.rangeCount) {
            const range = sel.getRangeAt(0);
            range.deleteContents();

            // Insert the pasted text
            const textNode = document.createTextNode(paste);
            range.insertNode(textNode);

            // Position cursor at the end of pasted content
            range.setStartAfter(textNode);
            range.setEndAfter(textNode);
            range.collapse(true);

            // Update selection
            sel.removeAllRanges();
            sel.addRange(range);
        }

        // Immediate sync operations
        syncLineNumbers();
        scrollToCursor();
        toggleButtonVisibility();

        // setTimeout(() => debouncedHighlight(), 50);

        // Delayed highlighting and resume sync to avoid cursor conflicts
        setTimeout(() => {
            debouncedHighlight();

            // Resume EditorSyncEnhancer and trigger full sync
            if (window.syncEnhancerControls) {
                window.syncEnhancerControls.resume();
                window.syncEnhancerControls.triggerFullSync();
            }
        }, 100); // Increased delay for large content
    });
}