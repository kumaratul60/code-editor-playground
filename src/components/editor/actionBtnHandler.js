import { copyBtn, editor, themeToggle } from "./domUtils.js";
import { spawnFloatingEmoji } from "@shared/commonUtils.js";
import { ensureExecutionTracker } from "@shared/runtime/executionTracker.js";

// export function themeToggleHandler() {
//     themeToggle.addEventListener("click", () => {
//         // themeToggle.classList.add("rotating");
//         const isLight = document.body.classList.contains("light-theme");
//         document.body.classList.toggle("light-theme", !isLight);
//         themeToggle.textContent = !isLight ? "🌙 Dark Mode" : "☀️ Toggle Theme";
//         spawnFloatingEmoji(themeToggle, !isLight ? "🌞" : "🌚");
//     });
// }

export function themeToggleHandler() {
    const applyTheme = (isLight) => {
        document.body.classList.toggle("light-theme", isLight);
        themeToggle.textContent = isLight ? "🌙 Dark Mode" : "☀️ Light Mode";
    };

    // Default to dark mode on load
    applyTheme(false);

    themeToggle.addEventListener("click", () => {
        const isLight = document.body.classList.contains("light-theme");
        applyTheme(!isLight);
        spawnFloatingEmoji(themeToggle, !isLight ? "🌞" : "🌚");
        const tracker = ensureExecutionTracker();
        tracker?.recordUIAction('toggle-theme');
    });
}

// Simple code formatter
function formatCode(code) {
    try {
        // Basic formatting: proper indentation and spacing
        let formatted = code;
        
        // Remove extra blank lines
        formatted = formatted.replace(/\n\s*\n\s*\n/g, '\n\n');
        
        // Add space after keywords
        formatted = formatted.replace(/\b(if|for|while|function|const|let|var|return|catch|switch)\(/g, '$1 (');
        
        // Add space around operators
        formatted = formatted.replace(/([^\s])([=+\-*/<>!&|]{1,3})([^\s=])/g, '$1 $2 $3');
        
        // Fix double spaces
        formatted = formatted.replace(/  +/g, ' ');
        
        return formatted.trim();
    } catch (err) {
        console.warn('Formatting failed, copying original code:', err);
        return code;
    }
}

export function copyBtnHandler() {
    copyBtn.addEventListener("click", () => {
        const code = editor.innerText;
        const formattedCode = formatCode(code);
        const originalContent = copyBtn.innerHTML;

        try {
            navigator.clipboard.writeText(formattedCode).then(() => {
                copyBtn.innerHTML = "✓ Formatted & Copied";
                copyBtn.classList.add("success");
                const tracker = ensureExecutionTracker();
                tracker?.recordUIAction('copy-code');

                // Revert back to original content after 1.5 seconds
                setTimeout(() => {
                    copyBtn.innerHTML = originalContent;
                    copyBtn.classList.remove("success");
                }, 1200);
            });
        } catch (err) {
            alert("Failed to copy code to clipboard.");
        }
    });
}
