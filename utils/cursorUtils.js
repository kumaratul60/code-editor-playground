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


export function highlightCurrentLine(editor, lineNumbers) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);

    // Better cursor position calculation for layered editor
    let lineIndex = 0;

    try {
        // Get the text content up to cursor position
        const textBeforeCursor = getTextBeforeCursor(editor, range);

        // Count actual line breaks in the content
        const lines = textBeforeCursor.split(/\r\n|\r|\n/);
        lineIndex = Math.max(0, lines.length - 1);

    } catch (error) {
        // Fallback to original method if new method fails
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(editor);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        lineIndex = preCaretRange.toString().split(/\n/).length - 1;
    }

    // Update line number highlighting
    lineNumbers.querySelectorAll("span").forEach((span, idx) => {
        span.classList.toggle("active-line", idx === lineIndex);
    });
}

// Helper function to get text before cursor position
function getTextBeforeCursor(editor, range) {
    const walker = document.createTreeWalker(
        editor,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );

    let textContent = '';
    let node;

    while (node = walker.nextNode()) {
        if (node === range.startContainer) {
            // Add partial text up to cursor position
            textContent += node.textContent.substring(0, range.startOffset);
            break;
        } else {
            // Add full text content of this node
            textContent += node.textContent;
        }
    }

    return textContent;
}
