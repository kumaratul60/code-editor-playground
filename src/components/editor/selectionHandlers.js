import { editor, lineNumbers } from './domUtils.js';
import {highlightCurrentLine} from "@shared/commonUtils.js";
import {
    scrollToCursor,
    updateCursorMeta,
    updateSelectionOverlay,
    clearSelectionOverlay
} from "@shared/editor/indexHelper.js";


export function setupSelectionHandlers() {
    document.addEventListener('selectionchange', () => {
        if (document.activeElement === editor) {
            requestAnimationFrame(() => {
                scrollToCursor();
                highlightCurrentLine(editor, lineNumbers);
                updateCursorMeta();
                updateSelectionOverlay();
            });
        }
    });

    editor.addEventListener("click", () => {
        setTimeout(() => {
            highlightCurrentLine(editor, lineNumbers);
            updateCursorMeta();
            updateSelectionOverlay();
        }, 0);
    });

    editor.addEventListener('blur', () => {
        clearSelectionOverlay();
    });
}
