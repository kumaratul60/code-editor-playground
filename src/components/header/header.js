import { ensureExecutionTracker } from "@shared/runtime/executionTracker.js";
import { runCode } from "@shared/runtime/index.js";
import { copyBtnHandler } from "@editor/actionBtnHandler.js";
import { clearEditor, updateOutputStatus } from "@shared/editor/indexHelper.js";
import { toggleRunButton } from "@shared/commonUtils.js";

/**
 * Initialize all header functionality
 */
export function initHeader() {
    // Re-query elements to ensure we have the latest DOM references
    const themeToggle = document.getElementById("theme-toggle");
    const runBtn = document.getElementById("run-btn");
    const copyBtn = document.getElementById("copy-btn");
    const clearBtn = document.getElementById("header-clear-btn");
    const editor = document.getElementById("code-text");
    const output = document.getElementById("output");

    setupThemeToggle(themeToggle);
    setupRunButton(runBtn, editor, output);
    setupCopyButton();
    setupClearButton(clearBtn, editor);
}

/**
 * Handles Dark/Light mode switching
 */
function setupThemeToggle(themeToggle) {
    if (!themeToggle) return;

    const applyTheme = (isLight) => {
        document.body.classList.toggle("light-theme", isLight);
        localStorage.setItem('theme-preference', isLight ? 'light' : 'dark');
    };

    const savedTheme = localStorage.getItem('theme-preference');
    const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    const initialThemeIsLight = savedTheme === 'light' || (!savedTheme && systemPrefersLight);
    
    applyTheme(initialThemeIsLight);

    themeToggle.addEventListener("click", () => {
        const isCurrentlyLight = document.body.classList.contains("light-theme");
        applyTheme(!isCurrentlyLight);
        
        // Button pop animation
        themeToggle.style.transform = "scale(0.9)";
        setTimeout(() => { themeToggle.style.transform = ""; }, 150);

        const tracker = ensureExecutionTracker();
        tracker?.recordUIAction('toggle-theme');
    });
}

/**
 * Handles Run button action
 */
function setupRunButton(runBtn, editor, output) {
    if (!runBtn) return;
    
    runBtn.addEventListener("click", () => {
        const tracker = ensureExecutionTracker();
        tracker?.recordUIAction('run-code');
        runCode(editor, output);
    });
}

/**
 * Handles Copy button action
 */
function setupCopyButton() {
    copyBtnHandler();
}

/**
 * Handles Clear button action
 */
function setupClearButton(clearBtn, editor) {
    if (!clearBtn) return;

    clearBtn.addEventListener("click", () => {
        const outElement = document.getElementById("output");
        if (outElement) outElement.innerHTML = "";
        
        updateOutputStatus('idle');
        if (window.updateConsoleClearBtn) window.updateConsoleClearBtn();

        try {
            if (typeof clearEditor === 'function') {
                clearEditor(true);
            } else if (editor) {
                editor.textContent = "";
                editor.dispatchEvent(new Event('input', { bubbles: true }));
            }
            
            // Re-sync run button state
            const rb = document.getElementById("run-btn");
            if (rb) toggleRunButton(editor, rb);
        } catch (e) {
            console.error("Error clearing editor:", e);
        }
    });
}
