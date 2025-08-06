import {
    highlightCurrentLine,
    spawnFloatingEmoji,
    toggleRunButton,
    updateLineNumbers,
} from "./utils/commonUtils.js";
import { formatCode } from "./utils/formatCode.js";
import { highlightEditorSyntax } from "./utils/highlightSyntaxUtils.js";
import { logOutput, runCode } from "./utils/runCode.js";
import {handleEditorHelpers} from "./utils/editorAutoCompleteHelper.js";
import {preserveCursorPosition,focusEditorAtEnd,optimizeEditor,scrollToCursor,debounceIndexHelper} from "./utils/indexHelper.js";

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


    const debouncedHighlight = debounceIndexHelper(() => {
        preserveCursorPosition(() => {
            highlightEditorSyntax(editor, highlighted);
        }, editor);
    }, 50);

    // === Initialize Editor ===
    optimizeEditor(editor);

    // === Focus Editor and Move Caret to End on Load ===
    requestAnimationFrame(() => {
        focusEditorAtEnd(editor);
        scrollToCursor();
    });

    // === Initial UI Sync ===
    updateLineNumbers(editor, lineNumbers);
    toggleRunButton(editor, runBtn);
    highlightEditorSyntax(editor, highlighted);


    // === Sync Scroll Between Layers ===
    function syncScrollPosition() {
        const container = document.querySelector('.editor-container');
        const scrollTop = container.scrollTop;
        const scrollLeft = container.scrollLeft;

        // Use scroll properties instead of transform for better alignment
        highlighted.scrollTop = scrollTop;
        highlighted.scrollLeft = scrollLeft;
        lineNumbers.scrollTop = scrollTop;
    }

    // === Scroll Sync Event ===
    document.querySelector('.editor-container').addEventListener('scroll', syncScrollPosition);


    // === Click on Editor Section Focuses Editor ===
    document.querySelector('.editor-section').addEventListener('click', () => {
        if (document.activeElement !== editor) editor.focus();
    });



    // === Line Number Sync on Input/Paste ===
    function syncLineNumbers() {
        updateLineNumbers(editor, lineNumbers);
        toggleRunButton(editor, runBtn);
        syncScrollPosition();
    }

    // === Enhanced Input Handler ===
    editor.addEventListener('input', () => {
        // Immediate sync
        syncLineNumbers();
        scrollToCursor();
        debouncedHighlight();
    });

    // === Paste Event Handler ===
    editor.addEventListener('paste', (e) => {
        e.preventDefault();
        const paste = (e.clipboardData || window.clipboardData).getData('text');

        if (!paste) return;

        // Improved paste with immediate cursor positioning
        preserveCursorPosition(() => {
            const sel = window.getSelection();
            if (sel.rangeCount) {
                const range = sel.getRangeAt(0);
                range.deleteContents();
                range.insertNode(document.createTextNode(paste));

                // Move cursor to end of pasted content
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
            }

            // Immediate sync
            syncLineNumbers();
            scrollToCursor();

            // Delayed highlighting
            setTimeout(() => debouncedHighlight(), 10);
        }, editor);
    });

    // === Selection Change Handler ===
    document.addEventListener('selectionchange', () => {
        if (document.activeElement === editor) {
            requestAnimationFrame(scrollToCursor);
        }
    });

// === Code Insertion Utilities ===
    function insertAtTop(code) {
        editor.innerText = code + "\n" + editor.innerText;
        syncLineNumbers();
        focusEditorAtEnd(editor);
    }
    function insertAtBottom(code) {
        editor.innerText = editor.innerText + "\n" + code;
        syncLineNumbers();
        focusEditorAtEnd(editor);
    }
    function insertAtCursor(code) {
        const sel = window.getSelection();
        if (!sel.rangeCount) return;
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(code));
        syncLineNumbers();
        focusEditorAtEnd(editor);
    }

    window.insertAtTop = insertAtTop;
    window.insertAtBottom = insertAtBottom;
    window.insertAtCursor = insertAtCursor;

    // === Keyboard Handling for Editor ===
    editor.addEventListener("keydown", (e) => {
        if (handleEditorHelpers(e, editor, lineNumbers, highlighted)) return;

        if (e.key === 'Tab') {
            e.preventDefault();

            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const tabText = document.createTextNode('    '); // 4 spaces

                range.deleteContents();
                range.insertNode(tabText);

                // Move cursor after the inserted tab
                range.setStartAfter(tabText);
                range.setEndAfter(tabText);
                selection.removeAllRanges();
                selection.addRange(range);
            }

            syncLineNumbers();
            scrollToCursor();
            return;
        }

        // Enter handling with auto-scroll
        if (e.key === "Enter" && !e.ctrlKey) {
            e.preventDefault();

            const selection = window.getSelection();
            if (!selection.rangeCount) return;
            const range = selection.getRangeAt(0);

            // Find indentation of current line
            let currentLine = "";
            if (range.startContainer.nodeType === Node.TEXT_NODE) {
                currentLine = range.startContainer.textContent.slice(0, range.startOffset);
            }
            const indentMatch = currentLine.match(/^\s*/);
            const indent = indentMatch ? indentMatch[0] : "";
            const extraIndent = /[{[(]\s*$/.test(currentLine) ? "  " : "";

            // Insert newline with indentation
            const newLineNode = document.createTextNode("\n" + indent + extraIndent);
            range.deleteContents();
            range.insertNode(newLineNode);

            // Move caret after the new line
            range.setStartAfter(newLineNode);
            range.setEndAfter(newLineNode);
            selection.removeAllRanges();
            selection.addRange(range);

            // Immediate sync and scroll
            syncLineNumbers();
            scrollToCursor();
            debouncedHighlight();
            return;
        }

        // Ctrl+Enter: Format
        if (e.key === "Enter" && e.ctrlKey) {
            e.preventDefault();
            const formatted = formatCode(editor.textContent);
            editor.innerText = formatted;
            focusEditorAtEnd(editor);
            syncLineNumbers();
            scrollToCursor();
            // runCode(editor, output);
            debouncedHighlight();
            return;
        }

        // Navigation keys - ensure cursor stays visible
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(e.key)) {
            setTimeout(scrollToCursor, 0);
            return;
        }

        // Backspace/Delete - immediate sync
        if (e.key === 'Backspace' || e.key === 'Delete') {
            setTimeout(() => {
                syncLineNumbers();
                scrollToCursor();
            }, 0);
            return;
        }
    });

    // === Highlight Current Line on Click ===
    editor.addEventListener("click", () => {
        // Use setTimeout to avoid interfering with natural cursor positioning
        setTimeout(() => highlightCurrentLine(editor, lineNumbers), 0);
    });


    // -- Buttons logic --

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

    // === Console Override for Output Panel ===
    const originalLog = console.log;
    console.log = (...args) => {
        args.forEach((arg) => logOutput(arg, output));
        originalLog.apply(console, args);
    };

    // console.log(" Code Editor initialized!");
});