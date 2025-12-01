import { editor, lineNumbers, highlighted } from './domUtils.js';
import {focusEditorAtEnd, syncLineNumbers, scrollToCursor, toggleButtonVisibility, insertTextAtSelection, scheduleCursorRefresh} from "../utils/indexHelper.js";
import {handleEditorHelpers} from "../utils/editorAutoCompleteHelper.js";
import {formatCode} from "../utils/formatCode.js";
import {debouncedHighlight} from "../utils/indexHelper.js";
import {getTextBeforeCursor} from "../utils/commonUtils.js";

export function setupKeyboardHandlers() {
    editor.addEventListener('beforeinput', (e) => {
        if (e.inputType === 'insertParagraph' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            handleCustomEnter();
        }
    });

    editor.addEventListener("keydown", (e) => {
        if (handleEditorHelpers(e, editor, lineNumbers, highlighted)) return;

        if (e.key === 'Tab') {
            e.preventDefault();
            insertTextAtSelection('    ');
            syncLineNumbers();
            scheduleCursorRefresh();
            toggleButtonVisibility()
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
            requestAnimationFrame(scrollToCursor);
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

function getCurrentLineText(selection) {
    const range = selection.getRangeAt(0);
    const textBeforeCursor = getTextBeforeCursor(editor, range) || "";
    const lastLineBreak = textBeforeCursor.lastIndexOf('\n');
    return textBeforeCursor.slice(lastLineBreak + 1);
}

function handleCustomEnter() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const currentLine = getCurrentLineText(selection);
    const indentMatch = currentLine.match(/^\s*/);
    const indent = indentMatch ? indentMatch[0] : "";
    const extraIndent = /[{[(]\s*$/.test(currentLine) ? "  " : "";
    insertTextAtSelection("\n" + indent + extraIndent);

    syncLineNumbers();
    scheduleCursorRefresh();
    debouncedHighlight();
}
