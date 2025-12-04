import { toggleRunButton, updateLineNumbers, getEditorPlainText } from "../commonUtils.js";
import { clearBtn, copyBtn, editor, highlighted, lineNumbers, runBtn } from "@editor/domUtils.js";
import { highlightEditorSyntax } from "../highlightSyntaxUtils.js";
import {
    preserveCursorPosition,
    updateCursorMeta,
    updateActiveLineIndicator
} from "./editorCursor.js";

let outputStatusResetTimeout = null;
let highlightRefreshTimeout = null;

export function optimizeEditor(targetEditor = editor) {
    targetEditor.setAttribute('spellcheck', 'false');
    targetEditor.setAttribute('autocomplete', 'off');
    targetEditor.setAttribute('autocorrect', 'off');
    targetEditor.setAttribute('autocapitalize', 'off');
    targetEditor.setAttribute('data-gramm', 'false');
    targetEditor.setAttribute('data-gramm_editor', 'false');
    targetEditor.setAttribute('data-enable-grammarly', 'false');

    targetEditor.style.userSelect = 'text';
    targetEditor.style.whiteSpace = 'pre-wrap';
    targetEditor.style.wordBreak = 'keep-all';
    targetEditor.style.overflowWrap = 'normal';
    targetEditor.contentEditable = 'plaintext-only';
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

function renderHighlightLayer() {
    preserveCursorPosition(() => {
        highlightEditorSyntax(editor, highlighted);
    }, editor);
}

export function scheduleHighlightRefresh(options = {}) {
    const {immediate = false} = options;

    if (immediate) {
        if (highlightRefreshTimeout) {
            clearTimeout(highlightRefreshTimeout);
            highlightRefreshTimeout = null;
        }
        renderHighlightLayer();
        return;
    }

    if (highlightRefreshTimeout) {
        clearTimeout(highlightRefreshTimeout);
    }

    highlightRefreshTimeout = setTimeout(() => {
        highlightRefreshTimeout = null;
        renderHighlightLayer();
    }, 50);
}

export function updateOutputStatus(state = 'idle', label) {
    if (outputStatusResetTimeout) {
        clearTimeout(outputStatusResetTimeout);
        outputStatusResetTimeout = null;
    }
}

export function toggleButtonVisibility() {
    const hasContent = getEditorPlainText(editor).trim().length > 0;
    copyBtn.style.display = hasContent ? 'inline-block' : 'none';
    clearBtn.style.display = hasContent ? 'inline-block' : 'none';
}

export function clearEditor() {
    if (!confirm("Clear the editor?")) {
        return;
    }

    const manager = window.undoRedoManager;
    if (manager) {
        manager.saveState('clear-before');
    }

    editor.innerText = "";
    updateLineNumbers(editor, lineNumbers);
    toggleRunButton(editor, runBtn);
    highlightEditorSyntax(editor, highlighted);
    updateCursorMeta();
    updateActiveLineIndicator();

    const outputSection = document.getElementById('output');
    if (outputSection) {
        outputSection.innerHTML = '';
    }

    const execTimeElement = document.getElementById('exec-time');
    if (execTimeElement) {
        execTimeElement.innerHTML = '⏱️ Total Time: <span style="color: #a6e22e">0.00 ms</span>';
    }

    const summaryIcons = document.getElementById('summary-icons');
    if (summaryIcons) {
        summaryIcons.innerHTML = '🧩 0 func | 🔁 0 loops | ⏳ 0 async';
    }

    const devInsightsSidebar = document.getElementById('dev-insights-sidebar');
    if (devInsightsSidebar) {
        devInsightsSidebar.remove();
    }

    if ('executionTracker' in window) {
        const tracker = window.executionTracker;
        if (tracker && typeof tracker.reset === 'function') {
            tracker.reset();
        }
    }

    window.lastExecutionTime = 0;

    toggleButtonVisibility();
    updateOutputStatus('idle');
}
