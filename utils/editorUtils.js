export const DEBOUNCE_DELAY = 50;
export const HIGHLIGHT_DELAY = 10;

/**
 * Handles paste events in the editor
 */
export function handlePaste(e, editor, syncLineNumbers, scrollToCursor, debouncedHighlight) {
    e.preventDefault();
    const paste = (e.clipboardData || window.clipboardData).getData('text');
    if (!paste) return;

    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(paste));
    range.collapse(false);

    syncLineNumbers();
    scrollToCursor();
    setTimeout(debouncedHighlight, HIGHLIGHT_DELAY);
}

/**
 * Handles keyboard events in the editor
 */
export function handleKeyDown(e, editor, lineNumbers, highlighted, syncLineNumbers, scrollToCursor) {
    if (e.key === 'Tab') {
        e.preventDefault();
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const tabText = document.createTextNode('    ');
            range.deleteContents();
            range.insertNode(tabText);
            range.setStartAfter(tabText);
            range.setEndAfter(tabText);
            selection.removeAllRanges();
            selection.addRange(range);
        }
        syncLineNumbers();
        scrollToCursor();
        return true;
    }
    return false;
}

/**
 * Syncs scroll position between editor layers
 */
export function syncScrollPosition(editor, highlighted, lineNumbers) {
    const container = editor.parentElement;
    if (!container) return;

    const scrollTop = container.scrollTop;
    const scrollLeft = container.scrollLeft;

    if (highlighted) {
        highlighted.scrollTop = scrollTop;
        highlighted.scrollLeft = scrollLeft;
    }
    if (lineNumbers) {
        lineNumbers.scrollTop = scrollTop;
    }
}