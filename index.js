import { formatCode } from "./utils/formatCode.js";
import { highlightEditorSyntax } from "./utils/highlightSyntaxUtils.js";
import {
  highlightCurrentLine,
  logOutput,
  runCode,
  toggleRunButton,
  updateLineNumbers,
} from "./utils/utils.js";

document.addEventListener("DOMContentLoaded", () => {
  const editor = document.getElementById("code-text");
  const output = document.getElementById("output");
  const lineNumbers = document.getElementById("line-numbers");
  const themeToggle = document.getElementById("theme-toggle");
  const runBtn = document.getElementById("run-btn");
  const highlighted = document.getElementById("highlighted-code");

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

  editor.addEventListener("scroll", () => {
    lineNumbers.scrollTop = editor.scrollTop;
    highlighted.scrollTop = editor.scrollTop;
  });

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
    document.body.classList.toggle("light-theme");
  });

  runBtn.addEventListener("click", () => runCode(editor, output));

  const originalLog = console.log;
  console.log = (...args) => {
    args.forEach((arg) => logOutput(arg, output));
    originalLog.apply(console, args);
  };
});
