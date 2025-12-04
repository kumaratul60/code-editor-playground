import { editor, lineNumbers } from './domUtils.js';
import {highlightCurrentLine} from "@shared/commonUtils.js";
import {scrollToCursor, updateCursorMeta, updateActiveLineIndicator} from "@shared/editor/indexHelper.js";


export function setupSelectionHandlers() {
    document.addEventListener('selectionchange', () => {
        if (document.activeElement === editor) {
            requestAnimationFrame(() => {
                scrollToCursor();
                highlightCurrentLine(editor, lineNumbers);
                updateCursorMeta();
                updateActiveLineIndicator();
            });
        }
    });

    editor.addEventListener("click", () => {
        setTimeout(() => {
            highlightCurrentLine(editor, lineNumbers);
            updateCursorMeta();
            updateActiveLineIndicator();
        }, 0);
    });
}
