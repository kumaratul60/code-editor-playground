import {clearBtn, copyBtn, editor, highlighted, lineNumbers} from "../DOMIndex/domUtils.js";
import {highlightEditorSyntax} from "./highlightSyntaxUtils.js";

export function spawnFloatingEmoji(targetBtn, emojiChar = "☀️") {
  const emoji = document.createElement("div");
  const rect = targetBtn.getBoundingClientRect();

  emoji.textContent = emojiChar;
  emoji.style.position = "absolute";
  emoji.style.left = `${rect.left + rect.width / 2}px`;
  emoji.style.top = `${rect.top - 10}px`;
  emoji.style.transform = "translate(-50%, 0)";
  emoji.style.fontSize = "22px";
  emoji.style.opacity = "1";
  emoji.style.transition = "transform 1s ease-out, opacity 1s ease-out";
  emoji.style.zIndex = "9999";
  emoji.style.pointerEvents = "none";

  document.body.appendChild(emoji);

  // Trigger animation
  setTimeout(() => {
    emoji.style.transform += " translateY(-40px)";
    emoji.style.opacity = "0";
  }, 10);

  // Cleanup
  setTimeout(() => emoji.remove(), 1100);
}

export function toggleRunButton(editor, runBtn) {
  const content = editor.textContent.replace(/\u200B/g, "").trim();
  const isEmpty = content === "";
  runBtn.disabled = isEmpty;
  runBtn.title = isEmpty ? "Editor is empty" : "";
}

export function clearEditor() {
    if (confirm("Clear the editor?")) {

        // Save state before clearing for undo
        const manager = window.undoRedoManager;
        if (manager) {
            manager.saveState('clear-before');
        }

        // Clear editor content
        editor.innerText = "";
        updateLineNumbers(editor, lineNumbers);
        highlightEditorSyntax(editor, highlighted);

        // Clear output section
        const outputSection = document.getElementById('output');
        if (outputSection) {
            outputSection.innerHTML = '';
        }

        // Clear execution time
        const execTimeElement = document.getElementById('exec-time');
        if (execTimeElement) {
            execTimeElement.innerHTML = '⏱️ Total Time: <span style="color: #a6e22e">0.00 ms</span>';
        }

        // Clear summary icons
        const summaryIcons = document.getElementById('summary-icons');
        if (summaryIcons) {
            summaryIcons.innerHTML = '🧩 0 func | 🔁 0 loops | ⏳ 0 async';
        }

        // Remove DevInsights panel if it exists
        const devInsightsSidebar = document.getElementById('dev-insights-sidebar');
        if (devInsightsSidebar) {
            devInsightsSidebar.remove();
        }

        // Clear any global execution tracking data
        if (window.executionTracker) {
            window.executionTracker.reset();
        }

        // Reset execution time tracking
        window.lastExecutionTime = 0;

        toggleButtonVisibility();
    }
}

export function toggleButtonVisibility() {
    const hasContent = editor.innerText.trim().length > 0;
    // Show/hide copy and clear buttons based on content
    copyBtn.style.display = hasContent ? 'inline-block' : 'none';
    clearBtn.style.display = hasContent ? 'inline-block' : 'none';
}