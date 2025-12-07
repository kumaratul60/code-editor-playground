import { editor, highlighted } from "@editor/domUtils.js";
import { getEditorPlainText } from "../commonUtils.js";
import { updateSelectionOverlay } from "./selectionOverlay.js";

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

export function insertTextAtSelection(text) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) {
        return;
    }

    const range = selection.getRangeAt(0);
    range.deleteContents();

    const textNode = document.createTextNode(text);
    range.insertNode(textNode);

    range.setStart(textNode, textNode.length);
    range.collapse(true);

    selection.removeAllRanges();
    selection.addRange(range);
}

export function scheduleCursorRefresh() {
    requestAnimationFrame(() => {
        scrollToCursor();
        updateCursorMeta();
        updateActiveLineIndicator();
        updateSelectionOverlay();
    });
}

export function getCursorMetrics() {
    const selection = window.getSelection();
    const plainText = getEditorPlainText(editor);

    const baseMetrics = {
        line: 1,
        column: 1,
        charCount: plainText.length,
        selectionLength: 0
    };

    if (!selection || !selection.rangeCount || document.activeElement !== editor) {
        return baseMetrics;
    }

    const range = selection.getRangeAt(0);
    const preRange = range.cloneRange();
    preRange.selectNodeContents(editor);
    preRange.setEnd(range.startContainer, range.startOffset);

    const textBeforeCursor = preRange.toString().replace(/\r\n/g, "\n");
    const lines = textBeforeCursor.split("\n");
    const line = Math.max(1, lines.length);
    const column = (lines[lines.length - 1] || "").length + 1;
    const selectionLength = selection.toString().replace(/\u200B/g, "").length;

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
    if (!indicator || !container) return;

    const {line} = getCursorMetrics();
    const computed = window.getComputedStyle(highlighted);
    let lineHeight = parseFloat(computed.lineHeight);
    if (Number.isNaN(lineHeight)) {
        const fontSize = parseFloat(computed.fontSize) || 14;
        const lineMultiplier = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--editor-line-height')) || 1.5;
        lineHeight = fontSize * lineMultiplier;
    }
    lineHeight = lineHeight || 21;
    const paddingTop = parseFloat(computed.paddingTop) || 0;
    // Since the indicator is strictly positioned within the scrolling content (grid layout),
    // we do NOT subtract scrollTop. It tracks with the content naturally.
    const offset = Math.max(0, paddingTop + (line - 1) * lineHeight);

    indicator.style.opacity = document.activeElement === editor ? '1' : '0';
    indicator.style.height = `${lineHeight}px`;
    indicator.style.transform = `translateY(${offset}px)`;
}

export function scrollToCursor() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    
    // Skip auto-scroll for large selections (e.g., Ctrl+A)
    // If the selection is not collapsed and spans significant content, don't scroll
    if (!range.collapsed) {
        const selectedText = range.toString();
        const totalText = editor?.textContent || '';
        // If more than 50% of content is selected, skip scrolling
        if (selectedText.length > totalText.length * 0.5) {
            return;
        }
    }
    
    const rect = range.getBoundingClientRect();
    const container = document.querySelector('.editor-container');

    if (!container || !rect.height) return;

    const containerRect = container.getBoundingClientRect();
    const scrollTop = container.scrollTop;
    const scrollLeft = container.scrollLeft;

    let nextScrollTop = scrollTop;
    let nextScrollLeft = scrollLeft;

    if (rect.top < containerRect.top) {
        nextScrollTop += rect.top - containerRect.top;
    } else if (rect.bottom > containerRect.bottom) {
        nextScrollTop += rect.bottom - containerRect.bottom;
    }

    if (rect.left < containerRect.left) {
        nextScrollLeft += rect.left - containerRect.left;
    } else if (rect.right > containerRect.right) {
        nextScrollLeft += rect.right - containerRect.right;
    }

    if (nextScrollTop !== scrollTop || nextScrollLeft !== scrollLeft) {
        container.scrollTo({
            top: nextScrollTop,
            left: nextScrollLeft,
            behavior: 'auto'
        });
    }
}
