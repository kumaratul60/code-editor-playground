import { editor, lineNumbers } from './domUtils.js';
import {highlightCurrentLine} from "../utils/commonUtils.js";
import {scrollToCursor} from "../utils/indexHelper.js";


// export function setupSelectionHandlers() {
//     document.addEventListener('selectionchange', () => {
//         if (document.activeElement === editor) {
//             requestAnimationFrame(scrollToCursor);
//         }
//     });
//
//     editor.addEventListener("click", () => {
//         setTimeout(() => highlightCurrentLine(editor, lineNumbers), 0);
//     });
// }


export function setupSelectionHandlers() {
    document.addEventListener('selectionchange', () => {
        if (document.activeElement === editor) {
            const selection = window.getSelection();

            // Don't scroll if it's a full selection (Cmd+A) or large selection
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const selectedText = range.toString();
                const editorText = editor.textContent || '';

                // If selection is the entire content or very large, don't auto-scroll
                const isFullSelection = selectedText.length === editorText.length;
                const isLargeSelection = selectedText.length > editorText.length * 0.8;

                if (!isFullSelection && !isLargeSelection) {
                    requestAnimationFrame(scrollToCursor);
                }
            }
        }
    });

    editor.addEventListener("click", () => {
        setTimeout(() => highlightCurrentLine(editor, lineNumbers), 0);
    });
}
