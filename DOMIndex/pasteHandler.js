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

        // Improved paste with immediate cursor positioning
        preserveCursorPosition(() => {
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

            // Immediate sync
            syncLineNumbers();
            scrollToCursor();
            toggleButtonVisibility()

            // Delayed highlighting
            setTimeout(() => debouncedHighlight(), 10);
        }, editor);
    });
}