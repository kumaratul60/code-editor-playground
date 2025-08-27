import { editor, lineNumbers } from './domUtils.js';
import {highlightCurrentLine, scrollToCursor} from "../utils/cursorUtils.js";



export function setupSelectionHandlers() {
    document.addEventListener('selectionchange', () => {
        if (document.activeElement === editor) {
            requestAnimationFrame(scrollToCursor);
        }
    });

    editor.addEventListener("click", () => {
        setTimeout(() => highlightCurrentLine(editor, lineNumbers), 0);
    });
}
