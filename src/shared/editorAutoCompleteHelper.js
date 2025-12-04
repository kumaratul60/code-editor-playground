import { updateLineNumbers, } from "./commonUtils.js";
import {scheduleHighlightRefresh} from "./editor/indexHelper.js";


/**
 * Handles autocomplete and coding helpers for the editor.
 * Call this from your keydown event handler.
 * Returns true if it handled the event (should return early), false otherwise.
 */
export function handleEditorHelpers(e, editor, lineNumbers, highlighted) {
    // --- Autocomplete Patterns on Tab ---
    if (e.key === "Tab") {
        const sel = window.getSelection();
        if (sel.rangeCount) {
            const range = sel.getRangeAt(0);
            let node = range.startContainer;
            let text = node.nodeType === Node.TEXT_NODE ? node.textContent : "";
            let beforeCaret = text.slice(0, range.startOffset);

            // Helper function to safely set range position
            const safeSetRange = (targetNode, offset) => {
                try {
                    const maxOffset = targetNode.nodeType === Node.TEXT_NODE ?
                        targetNode.textContent.length :
                        targetNode.childNodes.length;
                    return Math.max(0, Math.min(offset, maxOffset));
                } catch (error) {
                    console.warn('Range offset calculation error:', error);
                    return 0;
                }
            };

            // log -> console.log()
            if (/(\s|^)log$/.test(beforeCaret)) {
                e.preventDefault();
                const startOffset = safeSetRange(node, beforeCaret.length - 3);
                range.setStart(node, startOffset);
                range.deleteContents();
                range.insertNode(document.createTextNode("console.log()"));

                // Place caret inside ()
                const newRange = document.createRange();
                let parent = range.endContainer;
                let offset = range.endOffset;
                const caretOffset = safeSetRange(parent, offset - 1);
                newRange.setStart(parent, caretOffset);
                newRange.collapse(true);
                sel.removeAllRanges();
                sel.addRange(newRange);

                requestAnimationFrame(() => {
                    updateLineNumbers(editor, lineNumbers);
                    scheduleHighlightRefresh({immediate: true});
                });
                return true;
            }

            // fn -> function name() {  }
            if (/(\s|^)fn$/.test(beforeCaret)) {
                e.preventDefault();
                const startOffset = safeSetRange(node, beforeCaret.length - 2);
                range.setStart(node, startOffset);
                range.deleteContents();
                range.insertNode(document.createTextNode("function name() {\n  \n}"));

                // Place caret inside function body
                const newRange = document.createRange();
                let parent = range.endContainer;
                let offset = range.endOffset;
                const caretOffset = safeSetRange(parent, offset - 3);
                newRange.setStart(parent, caretOffset);
                newRange.collapse(true);
                sel.removeAllRanges();
                sel.addRange(newRange);

                requestAnimationFrame(() => {
                    updateLineNumbers(editor, lineNumbers);
                    scheduleHighlightRefresh({immediate: true});
                });
                return true;
            }

            // for -> for (let i = 0; i < ; i++) {  }
            if (/(\s|^)for$/.test(beforeCaret)) {
                e.preventDefault();
                const startOffset = safeSetRange(node, beforeCaret.length - 3);
                range.setStart(node, startOffset);
                range.deleteContents();
                const snippet = "for (let i = 0; i < ; i++) {\n  \n}";
                const caretPos = 16; // After 'i < '
                const inserted = document.createTextNode(snippet);
                range.insertNode(inserted);

                // Place caret at the right position
                const newRange = document.createRange();
                const caretOffset = safeSetRange(inserted, caretPos);
                newRange.setStart(inserted, caretOffset);
                newRange.collapse(true);
                sel.removeAllRanges();
                sel.addRange(newRange);

                requestAnimationFrame(() => {
                    updateLineNumbers(editor, lineNumbers);
                    scheduleHighlightRefresh({immediate: true});
                });
                return true;
            }
        }
    }
}
