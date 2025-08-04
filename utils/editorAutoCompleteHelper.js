import { updateLineNumbers, } from "./commonUtils.js";
import {highlightEditorSyntax} from "./highlightSyntaxUtils.js";


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

            // log -> console.log()
            if (/(\s|^)log$/.test(beforeCaret)) {
                e.preventDefault();
                range.setStart(node, beforeCaret.length - 3);
                range.deleteContents();
                range.insertNode(document.createTextNode("console.log()"));
                // Place caret inside ()
                const newRange = document.createRange();
                let parent = range.endContainer;
                let offset = range.endOffset;
                newRange.setStart(parent, offset - 1);
                newRange.collapse(true);
                sel.removeAllRanges();
                sel.addRange(newRange);
                requestAnimationFrame(() => {
                    updateLineNumbers(editor, lineNumbers);
                    highlightEditorSyntax(editor, highlighted);
                });
                return true;
            }

            // fn -> function name() {  }
            if (/(\s|^)fn$/.test(beforeCaret)) {
                e.preventDefault();
                range.setStart(node, beforeCaret.length - 2);
                range.deleteContents();
                range.insertNode(document.createTextNode("function name() {\n  \n}"));
                // Place caret inside function body
                const newRange = document.createRange();
                let parent = range.endContainer;
                let offset = range.endOffset;
                newRange.setStart(parent, offset - 3);
                newRange.collapse(true);
                sel.removeAllRanges();
                sel.addRange(newRange);
                requestAnimationFrame(() => {
                    updateLineNumbers(editor, lineNumbers);
                    highlightEditorSyntax(editor, highlighted);
                });
                return true;
            }

            // for -> for (let i = 0; i < ; i++) {  }
            if (/(\s|^)for$/.test(beforeCaret)) {
                e.preventDefault();
                range.setStart(node, beforeCaret.length - 3);
                range.deleteContents();
                const snippet = "for (let i = 0; i < ; i++) {\n  \n}";
                const caretPos = 16; // After 'i < '
                const inserted = document.createTextNode(snippet);
                range.insertNode(inserted);

                // Clamp caretPos to the length of inserted node
                const safeCaretPos = Math.max(0, Math.min(caretPos, inserted.length));
                const newRange = document.createRange();
                try {
                    newRange.setStart(inserted, safeCaretPos);
                } catch (err) {
                    // Fallback: place at end
                    newRange.setStart(inserted, inserted.length);
                }
                newRange.collapse(true);
                sel.removeAllRanges();
                sel.addRange(newRange);
                requestAnimationFrame(() => {
                    updateLineNumbers(editor, lineNumbers);
                    highlightEditorSyntax(editor, highlighted);
                });
                return true;
            }
        }
    }

    // --- Bracket/Parenthesis Auto-Close ---
    if (["(", "[", "{"].includes(e.key)) {
        const pairs = { "(": ")", "[": "]", "{": "}" };
        const closeChar = pairs[e.key];
        const sel = window.getSelection();
        if (sel.rangeCount) {
            const range = sel.getRangeAt(0);
            e.preventDefault();
            range.insertNode(document.createTextNode(e.key + closeChar));
            // Move caret between the pair
            range.setStart(range.endContainer, range.endOffset - 1);
            range.setEnd(range.endContainer, range.endOffset - 1);
            sel.removeAllRanges();
            sel.addRange(range);
            requestAnimationFrame(() => {
                updateLineNumbers(editor, lineNumbers);
                highlightEditorSyntax(editor, highlighted);
            });
            return true;
        }
    }

    // Not handled
    return false;
}

