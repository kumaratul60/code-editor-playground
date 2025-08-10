import {toggleRunButton, updateLineNumbers} from "./commonUtils.js";
import {clearBtn, copyBtn, editor, highlighted, lineNumbers, runBtn} from "../DOMIndex/domUtils.js";
import {highlightEditorSyntax} from "./highlightSyntaxUtils.js";

export function focusEditorAtEnd(editor) {
    editor.focus();
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
}

export function preserveCursorPosition(callback,editor) {
    const selection = window.getSelection();
    if (!selection.rangeCount) {
        callback();
        return;
    }

    const range = selection.getRangeAt(0);
    const startContainer = range.startContainer;
    const startOffset = range.startOffset;

    // Calculate text offset from start of editor
    let textOffset = 0;
    const walker = document.createTreeWalker(
        editor,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );

    let node;
    while (node = walker.nextNode()) {
        if (node === startContainer) {
            textOffset += startOffset;
            break;
        }
        textOffset += node.textContent.length;
    }

    // Execute the callback
    callback();

    // Restore cursor position
    setTimeout(() => {
        const newWalker = document.createTreeWalker(
            editor,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let currentOffset = 0;
        let targetNode = null;
        let targetOffset = 0;

        while (node = newWalker.nextNode()) {
            const nodeLength = node.textContent.length;
            if (currentOffset + nodeLength >= textOffset) {
                targetNode = node;
                targetOffset = textOffset - currentOffset;
                break;
            }
            currentOffset += nodeLength;
        }

        if (targetNode) {
            const newRange = document.createRange();
            const newSelection = window.getSelection();

            try {
                newRange.setStart(targetNode, Math.min(targetOffset, targetNode.textContent.length));
                newRange.setEnd(targetNode, Math.min(targetOffset, targetNode.textContent.length));
                newSelection.removeAllRanges();
                newSelection.addRange(newRange);
            } catch (e) {
                // Fallback: focus at end
                focusEditorAtEnd();
            }
        }
    }, 0);
}


// === Performance & UX Optimizations ===
export function optimizeEditor(editor) {
    // Disable spellcheck and grammar checking for code editing
    editor.setAttribute('spellcheck', 'false');
    editor.setAttribute('autocomplete', 'off');
    editor.setAttribute('autocorrect', 'off');
    editor.setAttribute('autocapitalize', 'off');
    editor.setAttribute('data-gramm', 'false'); // Disable Grammarly
    editor.setAttribute('data-gramm_editor', 'false'); // Disable Grammarly editor
    editor.setAttribute('data-enable-grammarly', 'false'); // Additional Grammarly disable

    // Improve text selection and editing behavior
    editor.style.userSelect = 'text';
    editor.style.whiteSpace = 'pre-wrap';
    editor.style.wordBreak = 'keep-all';
    editor.style.overflowWrap = 'normal';

    // Disable browser text suggestions
    editor.contentEditable = 'plaintext-only';
}

// === Scroll to Cursor Function ===
export function scrollToCursor() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const container = document.querySelector('.editor-container');

    if (!container || !rect.height) return;

    const containerRect = container.getBoundingClientRect();
    const scrollTop = container.scrollTop;
    const scrollLeft = container.scrollLeft;

    // Calculate cursor position relative to container
    const cursorTop = rect.top - containerRect.top + scrollTop;
    const cursorLeft = rect.left - containerRect.left + scrollLeft;

    const viewportTop = scrollTop;
    const viewportBottom = scrollTop + containerRect.height;
    const viewportLeft = scrollLeft;
    const viewportRight = scrollLeft + containerRect.width;

    // Auto-scroll if cursor is outside viewport
    let newScrollTop = scrollTop;
    let newScrollLeft = scrollLeft;

    if (cursorTop < viewportTop + 50) {
        newScrollTop = Math.max(0, cursorTop - 50);
    } else if (cursorTop > viewportBottom - 50) {
        newScrollTop = cursorTop - containerRect.height + 100;
    }

    if (cursorLeft < viewportLeft + 50) {
        newScrollLeft = Math.max(0, cursorLeft - 50);
    } else if (cursorLeft > viewportRight - 50) {
        newScrollLeft = cursorLeft - containerRect.width + 100;
    }

    if (newScrollTop !== scrollTop || newScrollLeft !== scrollLeft) {
        container.scrollTo({
            top: newScrollTop,
            left: newScrollLeft,
            behavior: 'smooth'
        });
    }
}

export function debounceIndexHelper(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

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


export function clearEditor() {
    if (confirm("Clear the editor?")) {
        editor.innerText = "";
        updateLineNumbers(editor, lineNumbers);
        highlightEditorSyntax(editor, highlighted);
        toggleButtonVisibility()
    }
}

export function toggleButtonVisibility() {
    const hasContent = editor.innerText.trim().length > 0;
    // Show/hide copy and clear buttons based on content
    copyBtn.style.display = hasContent ? 'inline-block' : 'none';
    clearBtn.style.display = hasContent ? 'inline-block' : 'none';
}



