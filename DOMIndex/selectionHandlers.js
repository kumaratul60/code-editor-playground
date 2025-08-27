import { editor, lineNumbers } from './domUtils.js';
import {highlightCurrentLine} from "../utils/commonUtils.js";
import {scrollToCursor} from "../utils/indexHelper.js";


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
