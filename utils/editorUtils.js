import {highlightCurrentLine} from "./commonUtils.js";
import {highlightSyntax} from "./highlightSyntaxUtils.js";

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
export function handleKeyDown(e, editor, lineNumbers, highlighted, syncLineNumbers, scrollToCursor, debouncedHighlight) {
    // Handle Tab key
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

    // Handle Enter key
    if (e.key === 'Enter' && !e.ctrlKey) {
        e.preventDefault();
        const selection = window.getSelection();
        if (!selection.rangeCount) return false;

        const range = selection.getRangeAt(0);
        const currentLine = getCurrentLine(range.startContainer, range.startOffset);
        const indentMatch = currentLine.textBeforeCursor.match(/^\s*/);
        const indent = indentMatch ? indentMatch[0] : '';

        // Add extra indent if line ends with {, [, or (
        const extraIndent = /[{\[\(]\s*$/.test(currentLine.textBeforeCursor) ? '    ' : '';

        // Create new line with proper indentation
        const newLineNode = document.createTextNode('\n' + indent + extraIndent);
        range.deleteContents();
        range.insertNode(newLineNode);

        // Move cursor to the new line
        const newRange = document.createRange();
        newRange.setStartAfter(newLineNode);
        newRange.collapse(true);

        selection.removeAllRanges();
        selection.addRange(newRange);

        // Update UI
        syncLineNumbers();
        scrollToCursor();
        if (debouncedHighlight) debouncedHighlight();

        return true;
    }

    return false;
}

/**
 * Gets information about the current line and cursor position
 */
function getCurrentLine(node, offset) {
    // Find the text node and offset within it
    let textNode = node;
    let textOffset = offset;

    if (node.nodeType !== Node.TEXT_NODE) {
        const range = document.createRange();
        range.setStart(node, offset);
        range.collapse(true);

        const textWalker = document.createTreeWalker(
            range.commonAncestorContainer.ownerDocument.body,
            NodeFilter.SHOW_TEXT
        );

        let currentNode;
        while (currentNode = textWalker.nextNode()) {
            if (currentNode === node || currentNode.parentNode === node) {
                textNode = currentNode;
                textOffset = 0;
                break;
            }
        }
    }

    const text = textNode.textContent || '';
    const textBeforeCursor = text.substring(0, textOffset);
    const textAfterCursor = text.substring(textOffset);

    // Find the start of the current line
    const lastNewLineBefore = textBeforeCursor.lastIndexOf('\n');
    const lineStart = lastNewLineBefore === -1 ? 0 : lastNewLineBefore + 1;

    // Find the end of the current line
    const nextNewLineAfter = textAfterCursor.indexOf('\n');
    const lineEnd = nextNewLineAfter === -1 ? text.length : textOffset + nextNewLineAfter;

    return {
        node: textNode,
        textBeforeCursor: text.substring(lineStart, textOffset),
        textAfterCursor: text.substring(textOffset, lineEnd),
        lineStart,
        lineEnd,
        offset: textOffset
    };
}

/**
 * Syncs scroll position between editor layers
 */
export function syncScrollPosition(editor, highlighted, lineNumbers) {
    const scrollTop = editor.scrollTop;
    const scrollLeft = editor.scrollLeft;

    if (highlighted) {
        highlighted.scrollTop = scrollTop;
        highlighted.scrollLeft = scrollLeft;
    }

    if (lineNumbers) {
        lineNumbers.scrollTop = scrollTop;
    }
}

/**
 * Sets up event listeners for the editor
 */
export function setupEditorEvents(editor, lineNumbers, highlighted, output, syncLineNumbers, scrollToCursor, debouncedHighlight) {
    // Input handler for general typing
    editor.addEventListener('input', () => {
        syncLineNumbers();
        debouncedHighlight();
    });

    // Click handler for line highlighting
    editor.addEventListener('click', () => {
        highlightCurrentLine(editor, lineNumbers);
        scrollToCursor();
    });

    // Scroll handler
    editor.addEventListener('scroll', () => {
        syncScrollPosition(editor, highlighted, lineNumbers);
    });

    // Keyboard handler
    editor.addEventListener('keydown', (e) => {
        handleKeyDown(e, editor, lineNumbers, highlighted, syncLineNumbers, scrollToCursor, debouncedHighlight);
    });
}

/**
 * Syncs line numbers with editor content
 */
export function syncLineNumbers(editor, lineNumbersElement) {
    if (!editor || !lineNumbersElement) return;

    const lineCount = (editor.textContent.match(/\n/g) || []).length + 1;
    const numbers = Array.from({length: lineCount}, (_, i) => i + 1).join('\n');
    lineNumbersElement.innerHTML = numbers;
}