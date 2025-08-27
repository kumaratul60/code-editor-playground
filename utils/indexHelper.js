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







