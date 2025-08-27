import { editor } from './domUtils.js';
import {focusEditorAtEnd, syncLineNumbers} from "../utils/indexHelper.js";

export function insertAtTop(code) {
    editor.innerText = code + "\n" + editor.innerText;
    syncLineNumbers();
    focusEditorAtEnd(editor);
}

export function insertAtBottom(code) {
    editor.innerText = editor.innerText + "\n" + code;
    syncLineNumbers();
    focusEditorAtEnd(editor);
}

export function insertAtCursor(code) {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(code));
    syncLineNumbers();
    focusEditorAtEnd(editor);
}

// Make available globally (if needed, inline HTML buttons to call them)
window.insertAtTop = insertAtTop;
window.insertAtBottom = insertAtBottom;
window.insertAtCursor = insertAtCursor;
