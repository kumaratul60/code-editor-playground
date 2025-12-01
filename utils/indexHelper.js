import {toggleRunButton, updateLineNumbers, getEditorPlainText} from "./commonUtils.js";
import {clearBtn, copyBtn, editor, highlighted, lineNumbers, runBtn} from "../DOMIndex/domUtils.js";
import {highlightEditorSyntax} from "./highlightSyntaxUtils.js";

let outputStatusResetTimeout = null;

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
    const scrollTop = container.scrollTop;
    const offset = Math.max(0, paddingTop + (line - 1) * lineHeight - scrollTop);

    indicator.style.opacity = document.activeElement === editor ? 1 : 0;
    indicator.style.height = `${lineHeight}px`;
    indicator.style.transform = `translateY(${offset}px)`;
}

export function updateOutputStatus(state = 'idle', label) {
    const statusEl = document.getElementById('output-status');
    if (!statusEl) return;

    if (outputStatusResetTimeout) {
        clearTimeout(outputStatusResetTimeout);
        outputStatusResetTimeout = null;
    }

    const labels = {
        idle: 'Ready',
        running: 'Running...',
        success: 'Completed',
        error: 'Error'
    };

    statusEl.dataset.state = state;
    statusEl.textContent = label || labels[state] || labels.idle;

    if (state === 'running' || state === 'error') {
        return;
    }

    outputStatusResetTimeout = setTimeout(() => {
        const el = document.getElementById('output-status');
        if (el) {
            el.dataset.state = 'idle';
            el.textContent = labels.idle;
        }
    }, 2500);
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
    updateCursorMeta();
    updateActiveLineIndicator();
    syncScrollPosition();
}

export function syncScrollPosition() {
    const container = document.querySelector('.editor-container');
    highlighted.scrollTop = container.scrollTop;
    highlighted.scrollLeft = container.scrollLeft;
    lineNumbers.scrollTop = container.scrollTop;
    updateActiveLineIndicator();
}

export const debouncedHighlight = debounceIndexHelper(() => {
    preserveCursorPosition(() => {
        highlightEditorSyntax(editor, highlighted);
    }, editor);
}, 50);


export function clearEditor() {
    if (confirm("Clear the editor?")) {

        // Save state before clearing for undo
        const manager = window.undoRedoManager;
        if (manager) {
            manager.saveState('clear-before');
        }

        // Clear editor content
        editor.innerText = "";
        updateLineNumbers(editor, lineNumbers);
        toggleRunButton(editor, runBtn);
        highlightEditorSyntax(editor, highlighted);
        updateCursorMeta();
        updateActiveLineIndicator();

        // Clear output section
        const outputSection = document.getElementById('output');
        if (outputSection) {
            outputSection.innerHTML = '';
        }

        // Clear execution time
        const execTimeElement = document.getElementById('exec-time');
        if (execTimeElement) {
            execTimeElement.innerHTML = '⏱️ Total Time: <span style="color: #a6e22e">0.00 ms</span>';
        }

        // Clear summary icons
        const summaryIcons = document.getElementById('summary-icons');
        if (summaryIcons) {
            summaryIcons.innerHTML = '🧩 0 func | 🔁 0 loops | ⏳ 0 async';
        }

        // Remove DevInsights panel if it exists
        const devInsightsSidebar = document.getElementById('dev-insights-sidebar');
        if (devInsightsSidebar) {
            devInsightsSidebar.remove();
        }

        // Clear any global execution tracking data
        if (window.executionTracker) {
            window.executionTracker.reset();
        }

        // Reset execution time tracking
        window.lastExecutionTime = 0;

        toggleButtonVisibility();
        updateOutputStatus('idle');
    }
}

export function toggleButtonVisibility() {
    const hasContent = getEditorPlainText(editor).trim().length > 0;
    // Show/hide copy and clear buttons based on content
    copyBtn.style.display = hasContent ? 'inline-block' : 'none';
    clearBtn.style.display = hasContent ? 'inline-block' : 'none';
}
