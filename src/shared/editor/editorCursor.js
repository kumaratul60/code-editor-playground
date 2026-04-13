import { editor, highlighted } from "@editor/domUtils.js";
import { getEditorPlainText, updateLineNumbers } from "../commonUtils.js";
import { updateSelectionOverlay } from "./selectionOverlay.js";

/**
 * Focuses the editor and places caret at the very end.
 */
export function focusEditorAtEnd(targetEditor) {
    const editable = targetEditor || editor;
    editable.focus();
    const range = document.createRange();
    range.selectNodeContents(editable);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
}

/**
 * Executes a callback while maintaining the editor cursor position relative to text.
 */
export function preserveCursorPosition(callback, targetEditor = editor) {
    const selection = window.getSelection();
    if (!selection.rangeCount) {
        callback();
        return;
    }

    const range = selection.getRangeAt(0);
    const startContainer = range.startContainer;
    const startOffset = range.startOffset;

    let textOffset = 0;
    const walker = document.createTreeWalker(
        targetEditor,
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

    callback();

    setTimeout(() => {
        const newWalker = document.createTreeWalker(
            targetEditor,
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
                const clampedOffset = Math.min(targetOffset, targetNode.textContent.length);
                newRange.setStart(targetNode, clampedOffset);
                newRange.setEnd(targetNode, clampedOffset);
                newSelection.removeAllRanges();
                newSelection.addRange(newRange);
            } catch (error) {
                focusEditorAtEnd(targetEditor);
            }
        }
    }, 0);
}

/**
 * Robustly inserts text at current selection while tracking history.
 */
export function insertTextAtSelection(text) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    range.deleteContents();

    const textNode = document.createTextNode(text);
    range.insertNode(textNode);

    // Position cursor after the inserted text
    range.setStart(textNode, textNode.length);
    range.collapse(true);

    selection.removeAllRanges();
    selection.addRange(range);

    // Crucial: Dispatch input event to trigger centralized sync in main.js
    editor.dispatchEvent(new Event('input', { bubbles: true }));
}

export function scheduleCursorRefresh() {
    requestAnimationFrame(() => {
        scrollToCursor();
        updateCursorMeta();
        updateActiveLineIndicator();
        updateSelectionOverlay();
    });
}

/**
 * Canonical Cursor Metrics Calculation.
 * Uses character-offset based counting for 100% accuracy.
 */
export function getCursorMetrics() {
    const selection = window.getSelection();
    const plainText = getEditorPlainText(editor);

    if (!selection || !selection.rangeCount || document.activeElement !== editor) {
        return { line: 1, column: 1, charCount: plainText.length, selectionLength: 0 };
    }

    const range = selection.getRangeAt(0);
    const preRange = range.cloneRange();
    preRange.selectNodeContents(editor);
    preRange.setEnd(range.startContainer, range.startOffset);

    // Extract text before cursor using a hidden div to leverage our canonical walker
    const tempDiv = document.createElement('div');
    tempDiv.appendChild(preRange.cloneContents());
    const textBefore = getEditorPlainText(tempDiv);
    
    // Calculate line and column
    const lines = textBefore.split('\n');
    const line = lines.length;
    const column = (lines[lines.length - 1] || "").length + 1;

    const selectionLength = Math.abs(selection.toString().replace(/\u200B/g, "").length);

    return {
        line,
        column,
        charCount: plainText.length,
        selectionLength
    };
}

export function updateCursorMeta() {
    const metaEl = document.getElementById('cursor-meta');
    if (!metaEl) return;

    const {line, column, charCount, selectionLength} = getCursorMetrics();
    const selectionInfo = selectionLength ? ` | Sel ${selectionLength}` : '';
    metaEl.textContent = `Ln ${line}, Col ${column} | ${charCount} chars${selectionInfo}`;
}

export function updateActiveLineIndicator() {
    const indicator = document.getElementById('active-line-indicator');
    const container = document.querySelector('.editor-container');
    const gutter = document.getElementById('line-numbers');
    if (!indicator || !container) return;

    const {line} = getCursorMetrics();
    const style = window.getComputedStyle(editor);
    const fontSize = parseFloat(style.fontSize) || 14;
    const lineMultiplier = 1.5;
    const lineHeight = parseFloat(style.lineHeight) || (fontSize * lineMultiplier);
    const paddingTop = parseFloat(style.paddingTop) || 0;

    const offset = Math.max(0, paddingTop + (line - 1) * lineHeight);

    indicator.style.opacity = document.activeElement === editor ? '1' : '0';
    indicator.style.height = `${lineHeight}px`;
    indicator.style.transform = `translateY(${offset}px)`;

    // Update gutter highlighting
    if (gutter) {
        gutter.querySelectorAll('span').forEach((span, idx) => {
            span.classList.toggle('active-line', idx === (line - 1));
        });
    }
}

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

    let nextScrollTop = scrollTop;
    let nextScrollLeft = scrollLeft;

    if (rect.top < containerRect.top) {
        nextScrollTop += rect.top - containerRect.top - 10; // offset for breathing room
    } else if (rect.bottom > containerRect.bottom) {
        nextScrollTop += rect.bottom - containerRect.bottom + 10;
    }

    if (rect.left < containerRect.left) {
        nextScrollLeft += rect.left - containerRect.left - 20;
    } else if (rect.right > containerRect.right) {
        nextScrollLeft += rect.right - containerRect.right + 20;
    }

    if (nextScrollTop !== scrollTop || nextScrollLeft !== scrollLeft) {
        container.scrollTo({ top: nextScrollTop, left: nextScrollLeft, behavior: 'auto' });
    }
}
