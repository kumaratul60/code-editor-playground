import { editor, lineNumbers, highlighted } from './domUtils.js';
import {focusEditorAtEnd, syncLineNumbers, scrollToCursor, toggleButtonVisibility} from "../utils/indexHelper.js";
import {handleEditorHelpers} from "../utils/editorAutoCompleteHelper.js";
import {formatCode} from "../utils/formatCode.js";
import {debouncedHighlight} from "../utils/indexHelper.js";

export function setupKeyboardHandlers() {
    editor.addEventListener("keydown", (e) => {
        if (handleEditorHelpers(e, editor, lineNumbers, highlighted)) return;

        if (e.key === 'Tab') {
            e.preventDefault();
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const tabText = document.createTextNode('    ');
                range.deleteContents();
                range.insertNode(tabText);
                range.setStartAfter(tabText);
                range.setEndAfter(tabText);
                selection.removeAllRanges();
                selection.addRange(range);
            }
            syncLineNumbers();
            scrollToCursor();
            toggleButtonVisibility()
            return;
        }

        if (e.key === "Enter" && !e.ctrlKey) {
            e.preventDefault();
            const selection = window.getSelection();
            if (!selection.rangeCount) return;
            const range = selection.getRangeAt(0);

            let currentLine = "";
            if (range.startContainer.nodeType === Node.TEXT_NODE) {
                currentLine = range.startContainer.textContent.slice(0, range.startOffset);
            }
            const indentMatch = currentLine.match(/^\s*/);
            const indent = indentMatch ? indentMatch[0] : "";
            const extraIndent = /[{[(]\s*$/.test(currentLine) ? "  " : "";

            // Store the text in a variable
            const newLineText = "\n" + indent + extraIndent;
            const newLineNode = document.createTextNode(newLineText);

            // Insert the newline node
            range.deleteContents();
            range.insertNode(newLineNode);

            // Position cursor correctly using the variable
            range.setStart(newLineNode, newLineText.length);
            range.setEnd(newLineNode, newLineText.length);
            range.collapse(true);

            selection.removeAllRanges();
            selection.addRange(range);

            syncLineNumbers();
            scrollToCursor();
            debouncedHighlight();
            return;
        }

        if (e.key === "Enter" && e.ctrlKey) {
            e.preventDefault();
            const formatted = formatCode(editor.textContent);
            editor.innerText = formatted;
            focusEditorAtEnd(editor);
            syncLineNumbers();
            scrollToCursor();
            debouncedHighlight();
            toggleButtonVisibility()
            return;
        }

        if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home','End','PageUp','PageDown'].includes(e.key)) {
            setTimeout(scrollToCursor, 0);
            return;
        }

        if (e.key === 'Backspace' || e.key === 'Delete') {
            setTimeout(() => {
                syncLineNumbers();
                scrollToCursor();
                toggleButtonVisibility()
            }, 0);
        }
    });
}
