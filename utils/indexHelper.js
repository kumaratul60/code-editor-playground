// todo

// === Code Insertion Utilities ===
export function insertAtTop(editor,code) {
    editor.innerText = code + "\n" + editor.innerText;
    syncLineNumbers();
    focusEditorAtEnd();
}
export function insertAtBottom(editor,code) {
    editor.innerText = editor.innerText + "\n" + code;
    syncLineNumbers();
    focusEditorAtEnd();
}
export function insertAtCursor(editor,code) {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(code));
    syncLineNumbers();
    focusEditorAtEnd();
}
