import {
  highlightCurrentLine,
  spawnFloatingEmoji,
  toggleRunButton,
  updateLineNumbers,
} from "./utils/commonUtils.js";
import { formatCode } from "./utils/formatCode.js";
import { highlightEditorSyntax } from "./utils/highlightSyntaxUtils.js";
import { logOutput, runCode } from "./utils/runCode.js";

document.addEventListener("DOMContentLoaded", () => {
  const editor = document.getElementById("code-text");
  const output = document.getElementById("output");
  const lineNumbers = document.getElementById("line-numbers");
  const themeToggle = document.getElementById("theme-toggle");
  const runBtn = document.getElementById("run-btn");
  const highlighted = document.getElementById("highlighted-code");
  const copyBtn = document.getElementById("copy-btn");

  // editor.focus();
  requestAnimationFrame(() => editor.focus());

  updateLineNumbers(editor, lineNumbers);
  toggleRunButton(editor, runBtn);
  highlightEditorSyntax(editor, highlighted);

  const observer = new MutationObserver(() => {
    toggleRunButton(editor, runBtn);
    updateLineNumbers(editor, lineNumbers);
    highlightEditorSyntax(editor, highlighted);
  });
  observer.observe(editor, { childList: true, subtree: true, characterData: true });

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

  editor.addEventListener("scroll", () => {
    lineNumbers.scrollTop = editor.scrollTop;
    highlighted.scrollTop = editor.scrollTop;
  });


  // --- Line Number Sync ---
  function syncLineNumbers() {
    updateLineNumbers(editor, lineNumbers);
  }

// Update on typing and pasting
  editor.addEventListener('input', syncLineNumbers);
  editor.addEventListener('paste', function () {
    setTimeout(syncLineNumbers, 0); // after paste
  });

// --- Utilities for code insertion ---
   function insertAtTop(code) {
    editor.innerText = code + '\n' + editor.innerText;
    syncLineNumbers();
  }

function insertAtBottom(code) {
    editor.innerText = editor.innerText + '\n' + code;
    syncLineNumbers();
  }

function insertAtCursor(code) {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(code));
    syncLineNumbers();
  }

// --- Initial line number setup ---
  syncLineNumbers();

// (Optional) Expose these to window for debugging or button wiring
  window.insertAtTop = insertAtTop;
  window.insertAtBottom = insertAtBottom;
  window.insertAtCursor = insertAtCursor;

  editor.addEventListener("keydown", (e) => {
    // if (e.key === "Enter" && !e.shiftKey) {
    //   e.preventDefault();
    //   runCode(editor, output);
    // }

    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      const formatted = formatCode(editor.innerText);
      editor.innerText = formatted;

      requestAnimationFrame(() => {
        highlightEditorSyntax(editor, highlighted);
        updateLineNumbers(editor, lineNumbers);
        toggleRunButton(editor, runBtn);
        runCode(editor, output);
      });
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      const currentLine = range.startContainer.textContent;
      const indentMatch = currentLine.match(/^\s*/);
      const indent = indentMatch ? indentMatch[0] : "";

      const extraIndent = /[{[(]\s*$/.test(currentLine) ? "  " : "";
      const newLine = document.createTextNode("\n" + indent + extraIndent);

      range.deleteContents();
      range.insertNode(newLine);

      range.setStartAfter(newLine);
      range.setEndAfter(newLine);
      selection.removeAllRanges();
      selection.addRange(range);

      requestAnimationFrame(() => {
        updateLineNumbers(editor, lineNumbers);
        toggleRunButton(editor, runBtn);
        highlightEditorSyntax(editor, highlighted);
      });
      return;
    }
    requestAnimationFrame(() => {
      updateLineNumbers(editor, lineNumbers);
      toggleRunButton(editor, runBtn);
      highlightEditorSyntax(editor, highlighted);
    });
  });

  editor.addEventListener("input", () => {
    requestAnimationFrame(() => {
      updateLineNumbers(editor, lineNumbers);
      toggleRunButton(editor, runBtn);
      highlightEditorSyntax(editor, highlighted);
    });
  });

  editor.addEventListener("click", () => highlightCurrentLine(editor, lineNumbers));

  themeToggle.addEventListener("click", () => {
    //  document.body.classList.toggle("light-theme");

    themeToggle.classList.add("rotating");

    const isLight = document.body.classList.contains("light-theme");

    document.body.classList.toggle("light-theme", !isLight);
    document.body.classList.toggle("dark-theme", isLight);

    themeToggle.textContent = !isLight ? "🌙 Dark Mode" : "☀️ Toggle Theme";

    spawnFloatingEmoji(themeToggle, !isLight ? "🌞" : "🌚");

    setTimeout(() => {
      themeToggle.classList.remove("rotating");
    }, 500);
  });

  runBtn.addEventListener("click", () => runCode(editor, output));

  const originalLog = console.log;
  console.log = (...args) => {
    args.forEach((arg) => logOutput(arg, output));
    originalLog.apply(console, args);
  };
});
