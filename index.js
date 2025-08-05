import {
    highlightCurrentLine,
    spawnFloatingEmoji,
    toggleRunButton,
    updateLineNumbers,
    debounceUtils
} from "./utils/commonUtils.js";
import { formatCode } from "./utils/formatCode.js";
import { highlightEditorSyntax } from "./utils/highlightSyntaxUtils.js";
import { logOutput, runCode } from "./utils/runCode.js";
import {handleEditorHelpers} from "./utils/editorAutoCompleteHelper.js";

document.addEventListener("DOMContentLoaded", () => {
    // === DOM Element References ===
    const editor = document.getElementById("code-text");
    const output = document.getElementById("output");
    const lineNumbers = document.getElementById("line-numbers");
    const themeToggle = document.getElementById("theme-toggle");
    const runBtn = document.getElementById("run-btn");
    const highlighted = document.getElementById("highlighted-code");
    const copyBtn = document.getElementById("copy-btn");

    // === Focus Editor and Move Caret to End on Load ===
    requestAnimationFrame(() => {
        editor.focus();
        const range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    });

    // === Initial UI Sync ===
    updateLineNumbers(editor, lineNumbers);
    toggleRunButton(editor, runBtn);
    highlightEditorSyntax(editor, highlighted);

    // === Helper: Focus Editor at End ===
    function focusEditorAtEnd() {
        editor.focus();
        const range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }

    // === Helper: Preserve Cursor Position ===
    function preserveCursorPosition(callback) {
        const sel = window.getSelection();
        let cursorPos = 0;
        let startContainer = null;
        let startOffset = 0;

        if (sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            // Store exact position for precise restoration
            startContainer = range.startContainer;
            startOffset = range.startOffset;

            // Calculate text position as fallback
            const preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(editor);
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            cursorPos = preCaretRange.toString().length;
        }

        // Execute callback (highlighting, etc.)
        callback();

        // Restore cursor position with improved logic
        requestAnimationFrame(() => {
            try {
                const sel = window.getSelection();
                const range = document.createRange();

                // Method 1: Try to restore to exact container and offset (most precise)
                if (startContainer && startContainer.parentNode && editor.contains(startContainer)) {
                    const maxOffset = startContainer.nodeType === Node.TEXT_NODE
                        ? startContainer.textContent.length
                        : startContainer.childNodes.length;
                    range.setStart(startContainer, Math.min(startOffset, maxOffset));
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);
                    return; // Success - exit early
                }

                // Method 2: Fallback to text position calculation
                const textNode = editor.firstChild;
                if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                    range.setStart(textNode, Math.min(cursorPos, textNode.textContent.length));
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);
                    return; // Success - exit early
                }

                // Method 3: Last resort - position at end of editor content
                if (editor.childNodes.length > 0) {
                    range.selectNodeContents(editor);
                    range.collapse(false);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }

            } catch (e) {
                // If all positioning methods fail, don't force cursor movement
                console.warn('Cursor positioning failed, keeping current position:', e);
                // Don't call focusEditorAtEnd() to avoid unwanted jumps
            }
        });
    }

    // === Helper: Sync Scroll Between Layers ===
    function syncScrollPosition() {
        const container = document.querySelector('.editor-container');
        const scrollTop = container.scrollTop;
        const scrollLeft = container.scrollLeft;

        highlighted.style.transform = `translate(-${scrollLeft}px, -${scrollTop}px)`;
        lineNumbers.scrollTop = scrollTop;
    }

    // === Scroll Sync Event ===
    document.querySelector('.editor-container').addEventListener('scroll', syncScrollPosition);


    const debouncedHighlight = debounceUtils(() => {
        preserveCursorPosition(() => {
            highlightEditorSyntax(editor, highlighted);
        });
    }, 150);

    // === Click on Editor Section Focuses Editor ===
    document.querySelector('.editor-section').addEventListener('click', () => {
        if (document.activeElement !== editor) editor.focus();
    });

    // === Copy Button Logic ===
    copyBtn.addEventListener("click", () => {
        const code = editor.innerText;
        try {
            navigator.clipboard.writeText(code).then(() => {
                copyBtn.textContent = "✅";
                setTimeout(() => (copyBtn.textContent = "📋"), 1000);
            });
        } catch (err) {
            alert("Failed to copy code to clipboard.");
        }
    });

    // === Line Number Sync on Input/Paste ===
    function syncLineNumbers() {
        updateLineNumbers(editor, lineNumbers);
    }

    // === Enhanced Input Handler ===
    editor.addEventListener('input', () => {
        // Immediate sync
        syncLineNumbers();
        toggleRunButton(editor, runBtn);

        // Debounced highlight with cursor preservation
        debouncedHighlight();
    });

    // === Paste Event Handler ===
    editor.addEventListener('paste', (e) => {
        // Let the paste happen naturally, then sync UI
        setTimeout(() => {
            syncLineNumbers();
            toggleRunButton(editor, runBtn);
            debouncedHighlight();
        }, 20);
    });

    // === Code Insertion Utilities ===
    function insertAtTop(code) {
        editor.innerText = code + "\n" + editor.innerText;
        syncLineNumbers();
        focusEditorAtEnd();
    }
    function insertAtBottom(code) {
        editor.innerText = editor.innerText + "\n" + code;
        syncLineNumbers();
        focusEditorAtEnd();
    }
    function insertAtCursor(code) {
        const sel = window.getSelection();
        if (!sel.rangeCount) return;
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(code));
        syncLineNumbers();
        focusEditorAtEnd();
    }
    window.insertAtTop = insertAtTop;
    window.insertAtBottom = insertAtBottom;
    window.insertAtCursor = insertAtCursor;

    // === Keyboard Handling for Editor ===
    editor.addEventListener("keydown", (e) => {
        if (handleEditorHelpers(e, editor, lineNumbers, highlighted)) return;
        if (e.key === "Enter" && !e.ctrlKey) {
            e.preventDefault();

            const selection = window.getSelection();
            if (!selection.rangeCount) return;
            const range = selection.getRangeAt(0);

            // Find indentation of current line
            let currentLine = "";
            if (range.startContainer.nodeType === Node.TEXT_NODE) {
                // Only take text before caret for indentation
                currentLine = range.startContainer.textContent.slice(0, range.startOffset);
            }
            const indentMatch = currentLine.match(/^\s*/);
            const indent = indentMatch ? indentMatch[0] : "";
            const extraIndent = /[{[(]\s*$/.test(currentLine) ? "  " : "";

            // Insert exactly one newline
            const newLineNode = document.createTextNode("\n" + indent + extraIndent);
            range.deleteContents();
            range.insertNode(newLineNode);

            // Move caret after the new line
            range.setStartAfter(newLineNode);
            range.setEndAfter(newLineNode);
            selection.removeAllRanges();
            selection.addRange(range);

            // UI updates
            requestAnimationFrame(() => {
                updateLineNumbers(editor, lineNumbers);
                toggleRunButton(editor, runBtn);
                // Use debounced highlight to avoid cursor jumping
                debouncedHighlight();
            });
            return;
        }

        // Ctrl+Enter: Format and run code
        if (e.key === "Enter" && e.ctrlKey) {
            e.preventDefault();
            const formatted = formatCode(editor.textContent);
            editor.innerText = formatted;
            focusEditorAtEnd()
            requestAnimationFrame(() => {
                debouncedHighlight();
                updateLineNumbers(editor, lineNumbers);
                toggleRunButton(editor, runBtn);
                runCode(editor, output);
            });
            return;
        }
    });

    // === Highlight Current Line on Click ===
    editor.addEventListener("click", () => {
        // Use setTimeout to avoid interfering with natural cursor positioning
        setTimeout(() => highlightCurrentLine(editor, lineNumbers), 0);
    });

    // === Theme Toggle Logic ===
    themeToggle.addEventListener("click", () => {
        themeToggle.classList.add("rotating");
        const isLight = document.body.classList.contains("light-theme");
        document.body.classList.toggle("light-theme", !isLight);
        themeToggle.textContent = !isLight ? "🌙 Dark Mode" : "☀️ Toggle Theme";
        spawnFloatingEmoji(themeToggle, !isLight ? "🌞" : "🌚");
    });

    // === Run Button Logic ===
    runBtn.addEventListener("click", () => runCode(editor, output));

    // === Console Override for Output Panel ===
    const originalLog = console.log;
    console.log = (...args) => {
        originalLog(...args);
        logOutput(args.join(" "), output);
    };
});