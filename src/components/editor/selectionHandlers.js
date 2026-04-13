import { editor, lineNumbers } from './domUtils.js';
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
                updateCursorMeta();
                updateSelectionOverlay();
            });
        }
    });

    editor.addEventListener("click", () => {
        setTimeout(() => {
            updateCursorMeta();
            updateSelectionOverlay();
        }, 0);
    });

    editor.addEventListener('blur', () => {
        clearSelectionOverlay();
    });
}
