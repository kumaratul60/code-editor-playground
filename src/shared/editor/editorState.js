import { toggleRunButton, updateLineNumbers, getEditorPlainText } from "../commonUtils.js";
import { clearBtn, copyBtn, editor, highlighted, lineNumbers, runBtn } from "@editor/domUtils.js";
import { highlightEditorSyntax } from "../highlightSyntaxUtils.js";
import {
    updateCursorMeta,
    updateActiveLineIndicator
} from "./editorCursor.js";
import { clearSelectionOverlay } from "./selectionOverlay.js";
import { ensureExecutionTracker } from "../runtime/executionTracker.js";

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
    targetEditor.style.wordBreak = 'break-word';
    targetEditor.style.overflowWrap = 'break-word';
    targetEditor.contentEditable = 'plaintext-only';
}

export function syncLineNumbers() {
    updateLineNumbers(editor, lineNumbers);
    toggleRunButton(editor, runBtn);
    updateCursorMeta();
    syncScrollPosition();
}

export function syncScrollPosition() {
    const container = document.querySelector('.editor-container');
    // Only need to sync line numbers as other layers are in the same grid cell
    // and scroll naturally with the container
    if (lineNumbers && container) {
        lineNumbers.scrollTop = container.scrollTop;
    }
}

function renderHighlightLayer() {
    // Only updates the separate highlight layer, no need to preserve cursor
    // or block the editor operation.
    highlightEditorSyntax(editor, highlighted);
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

    const statusEl = document.querySelector('.panel-status');
    if (!statusEl) return;

    statusEl.setAttribute('data-state', state);

    if (label) {
        statusEl.textContent = label;
    } else {
        const defaultLabels = {
            idle: 'IDLE',
            running: 'RUNNING...',
            success: 'SUCCESS',
            error: 'ERROR'
        };
        statusEl.textContent = defaultLabels[state] || 'IDLE';
    }

    if (state === 'success' || state === 'error') {
        outputStatusResetTimeout = setTimeout(() => {
            statusEl.setAttribute('data-state', 'idle');
            statusEl.textContent = 'IDLE';
            outputStatusResetTimeout = null;
        }, 3000);
    }
}

export function toggleButtonVisibility() {
    const hasContent = getEditorPlainText(editor).trim().length > 0;
    
    if (hasContent) {
        copyBtn.classList.add('visible');
        clearBtn.classList.add('visible');
    } else {
        copyBtn.classList.remove('visible');
        clearBtn.classList.remove('visible');
    }
}

export function clearEditor(force = false) {
    if (!force && !confirm("Clear the editor?")) {
        return;
    }

    const manager = window.undoRedoManager;
    if (manager) {
        manager.saveState('clear-before');
    }

    editor.textContent = "";
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

    const devInsightsBulb = document.getElementById('dev-insights-toggle-btn');
    if (devInsightsBulb) {
        devInsightsBulb.remove();
    }

    const tracker = ensureExecutionTracker();
    if (tracker) {
        tracker.recordUIAction('clear-editor');
        tracker.resetRunState();
    }

    window.lastExecutionTime = 0;

    toggleButtonVisibility();
    updateOutputStatus('idle');
    clearSelectionOverlay();
}
