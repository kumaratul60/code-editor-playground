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

  // === Mutation Observer for Live Updates ===
  const observer = new MutationObserver(() => {
    toggleRunButton(editor, runBtn);
    updateLineNumbers(editor, lineNumbers);
    highlightEditorSyntax(editor, highlighted);
  });
  observer.observe(editor, { childList: true, subtree: true, characterData: true });

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

  // === Scroll Sync: Editor, Line Numbers, Highlight Layer ===
  editor.addEventListener("scroll", () => {
    lineNumbers.scrollTop = editor.scrollTop;
    highlighted.scrollTop = editor.scrollTop;
  });

  // === Line Number Sync on Input/Paste ===
  function syncLineNumbers() {
    updateLineNumbers(editor, lineNumbers);
  }
  editor.addEventListener('input', syncLineNumbers);
  editor.addEventListener('paste', function () {
    setTimeout(syncLineNumbers, 0);
  });

  // === Code Insertion Utilities ===
  function insertAtTop(code) {
    editor.innerText = code + '\n' + editor.innerText;
    syncLineNumbers();
    focusEditorAtEnd();
  }
  function insertAtBottom(code) {
    editor.innerText = editor.innerText + '\n' + code;
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
        highlightEditorSyntax(editor, highlighted);
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
        highlightEditorSyntax(editor, highlighted);
        updateLineNumbers(editor, lineNumbers);
        toggleRunButton(editor, runBtn);
        runCode(editor, output);
        focusEditorAtEnd(); // ensure caret is at end after formatting
      });
      return;
    }

    // Other keys: UI update
    requestAnimationFrame(() => {
      updateLineNumbers(editor, lineNumbers);
      toggleRunButton(editor, runBtn);
      highlightEditorSyntax(editor, highlighted);
    });
  });

  // === Editor Input Handler for UI Sync ===
  editor.addEventListener("input", () => {
    requestAnimationFrame(() => {
      updateLineNumbers(editor, lineNumbers);
      toggleRunButton(editor, runBtn);
      highlightEditorSyntax(editor, highlighted);
    });
  });

  // === Highlight Current Line on Click ===
  editor.addEventListener("click", () => highlightCurrentLine(editor, lineNumbers));

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
    args.forEach((arg) => logOutput(arg, output));
    originalLog.apply(console, args);
  };
});