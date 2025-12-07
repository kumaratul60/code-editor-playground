

export let editor;
export let output;
export let lineNumbers;
export let themeToggle;
export let runBtn;
export let highlighted;
export let selectionOverlay;
export let copyBtn;
export let clearBtn;

export function initDomElements() {
    editor = document.getElementById("code-text");
    output = document.getElementById("output");
    lineNumbers = document.getElementById("line-numbers");
    themeToggle = document.getElementById("theme-toggle");
    runBtn = document.getElementById("run-btn");
    highlighted = document.getElementById("highlighted-code");
    selectionOverlay = document.getElementById("selection-overlay");
    copyBtn = document.getElementById("copy-btn");
    clearBtn = document.getElementById("header-clear-btn");
}
