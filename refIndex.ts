
import { runCode } from "./utils/runCode.js";
import { EditorSynchronizer} from "./utils/editorSync.js";
import {
    handleKeyDown,
    handlePaste,
    setupEditorEvents,
    syncLineNumbers,
    syncScrollPosition
} from "./utils/editorUtils.js";
import {highlightSyntax} from "./utils/highlightSyntaxUtils.js";
import {preserveCursorPosition} from "./utils/indexHelper.js";

const DEBOUNCE_DELAY = 50;
const HIGHLIGHT_DELAY = 10;

document.addEventListener('DOMContentLoaded', () => {
    // Core elements
    const editor = document.getElementById('code-text');
    const output = document.getElementById('output');
    const lineNumbers = document.getElementById('line-numbers');
    const runBtn = document.getElementById('run-btn');
    const highlighted = document.getElementById('highlighted-code');
    const copyBtn = document.getElementById('copy-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const editorContainer = document.querySelector('.editor-container');

    // Editor state
    let isProcessing = false;
    let lastKnownScroll = { top: 0, left: 0 };

    // Initialize editor synchronization
    const editorSync = new EditorSynchronizer(editor, 'code-editor-content');

    // Load saved content if available
    const savedContent = editorSync.load();
    if (savedContent) {
        editor.textContent = savedContent;
    }

    // Debounced functions
    const debouncedSave = debounce(() => {
        editorSync.save(editor.textContent);
    }, 300);

    const debouncedHighlight = debounce(() => {
        if (!isProcessing) {
            isProcessing = true;
            preserveCursorPosition(() => {
                const highlightedCode = highlightSyntax(editor.textContent);
                highlighted.innerHTML = highlightedCode;
                syncScrollPosition(editor, highlighted, lineNumbers);
            }, editor);
            isProcessing = false;
        }
    }, HIGHLIGHT_DELAY);

    const debouncedScrollSync = debounce(() => {
        syncScrollPosition(editor, highlighted, lineNumbers);
    }, 16); // ~60fps

    // Event Handlers
    function handleEditorInput() {
        debouncedSave();
        syncLineNumbers(editor, lineNumbers);
        debouncedHighlight();
    }



    function scrollToCursor() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const editorRect = editor.getBoundingClientRect();

        if (rect.bottom > editorRect.bottom) {
            editor.scrollTop += (rect.bottom - editorRect.bottom + 20);
        } else if (rect.top < editorRect.top) {
            editor.scrollTop -= (editorRect.top - rect.top + 20);
        }
    }

    // Initialize editor
    function initEditor() {
        // Initial sync
        syncLineNumbers(editor, lineNumbers);

        // Set up event listeners
        setupEditorEvents(
            editor,
            lineNumbers,
            highlighted,
            output,
            () => syncLineNumbers(editor, lineNumbers),  // Sync callback
            scrollToCursor,
            debouncedHighlight
        );

        // Initial highlight and focus
        debouncedHighlight();
        editor.focus();
    }

    // Event Listeners
    editor.addEventListener('input', handleEditorInput);

    editor.addEventListener('paste', (e) => {
        handlePaste(e, editor,
            () => syncLineNumbers(editor, lineNumbers),
            scrollToCursor,
            debouncedHighlight
        );
    });

    editor.addEventListener('keydown', (e) => {
        if (handleKeyDown(e, editor, lineNumbers, highlighted)) {
            return;
        }
        // Additional key handling...
    });

    editorContainer.addEventListener('scroll', () => {
        lastKnownScroll = {
            top: editorContainer.scrollTop,
            left: editorContainer.scrollLeft
        };
        debouncedScrollSync();
    });

    // Button Event Listeners
    runBtn.addEventListener('click', () => {
        runCode(editor, output);
    });

    copyBtn.addEventListener('click', () => {
        const code = editor.textContent;
        navigator.clipboard.writeText(code)
            .then(() => {
                copyBtn.textContent = '✅ Copied!';
                setTimeout(() => {
                    copyBtn.textContent = '📋 Copy';
                }, 2000);
            })
            .catch(err => console.error('Failed to copy:', err));
    });

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        themeToggle.textContent = document.body.classList.contains('light-theme')
            ? '🌙 Dark Mode'
            : '☀️ Light Mode';
    });

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        // Cleanup event listeners
        editor.removeEventListener('input', handleEditorInput);
        editor.removeEventListener('paste', handlePaste);
        editor.removeEventListener('keydown', handleKeyDown);
        editorContainer.removeEventListener('scroll', debouncedScrollSync);

        // Clear debounced functions
        debouncedSave.cancel();
        debouncedHighlight.cancel();
        debouncedScrollSync.cancel();

        // Save final state
        editorSync.save(editor.textContent);
    });

    // Initialize
    initEditor();
});

// Utility Functions
function debounce(func, wait=DEBOUNCE_DELAY) {
    let timeout;
    const debounced = function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
    debounced.cancel = () => clearTimeout(timeout);
    return debounced;
}

// Export for global access if needed
window.insertAtCursor = (text) => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(text));
    range.collapse(false);

    selection.removeAllRanges();
    selection.addRange(range);
};