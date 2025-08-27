import {toggleRunButton} from "./commonUtils.js";
import {editor, highlighted, lineNumbers, runBtn} from "../DOMIndex/domUtils.js";
import {highlightEditorSyntax} from "./highlightSyntaxUtils.js";
import {debounceIndexHelper} from "./indexHelper.js";
import {preserveCursorPosition} from "./cursorUtils.js";

export function syncLineNumbers() {
    updateLineNumbers(editor, lineNumbers);
    toggleRunButton(editor, runBtn);
    syncScrollPosition();
}

export function syncScrollPosition() {
    const container = document.querySelector('.editor-container');
    highlighted.scrollTop = container.scrollTop;
    highlighted.scrollLeft = container.scrollLeft;
    lineNumbers.scrollTop = container.scrollTop;
}

export const debouncedHighlight = debounceIndexHelper(() => {
    preserveCursorPosition(() => {
        highlightEditorSyntax(editor, highlighted);
    }, editor);
}, 50);


export function updateLineNumbers(editor, lineNumbers) {
    // Use innerText to get what the user actually sees (handles <div>, <br>, etc.)
    let content = editor.innerText.replace(/\u200B/g, "");
    let lines = content.split(/\r\n|\r|\n/);

    // Remove trailing empty lines (including those with just whitespace)
    while (lines.length > 1 && lines[lines.length - 1].trim() === "") {
        lines.pop();
    }

    // Always show at least one line number
    const lineCount = Math.max(1, lines.length);

    // Render one <span> per line, vertical by CSS
    lineNumbers.innerHTML = Array.from({ length: lineCount }, (_, i) => `<span>${i + 1}</span>`).join("");
}
