import { editor } from "./domUtils.js";
import { ensureExecutionTracker } from "@shared/runtime/executionTracker.js";
import { checkIcon, copyIcon } from "@shared/svg.js";

/**
 * Handles the Copy Code button functionality.
 */
export function copyBtnHandler() {
    const copyBtn = document.getElementById("copy-btn");
    if (!copyBtn) return;

    copyBtn.addEventListener("click", () => {
        const code = editor.textContent;
        navigator.clipboard.writeText(code).then(() => {
            copyBtn.innerHTML = checkIcon;
            copyBtn.classList.add("success");
            
            setTimeout(() => {
                copyBtn.innerHTML = copyIcon;
                copyBtn.classList.remove("success");
            }, 2000);

            const tracker = ensureExecutionTracker();
            tracker?.recordUIAction('copy-code');
        });
    });
}
