import { editor, lineNumbers, highlighted } from './domUtils.js';
import {
    focusEditorAtEnd,
    syncLineNumbers,
    scrollToCursor,
    toggleButtonVisibility,
    insertTextAtSelection,
    scheduleCursorRefresh,
    scheduleHighlightRefresh
} from "@shared/editor/indexHelper.js";
import {handleEditorHelpers} from "@shared/editorAutoCompleteHelper.js";
import {formatCode} from "@shared/formatCode.js";
import {getTextBeforeCursor} from "@shared/commonUtils.js";

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
            toggleButtonVisibility();
            scheduleHighlightRefresh({immediate: true});
            return;
        }

        if (e.key === "Enter" && e.ctrlKey) {
            e.preventDefault();
            editor.innerText = formatCode(editor.textContent);
            focusEditorAtEnd(editor);
            syncLineNumbers();
            scrollToCursor();
            scheduleHighlightRefresh({immediate: true});
            toggleButtonVisibility();
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
                toggleButtonVisibility();
                scheduleHighlightRefresh({immediate: true});
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
    scheduleHighlightRefresh({immediate: true});
}
