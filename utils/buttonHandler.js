
import { spawnFloatingEmoji } from "./commonUtils.js";
import { runCode } from "./runCode.js";

export function setupButtonHandlers(editor, output, themeToggle, runBtn, copyBtn) {
    // Theme Toggle
    themeToggle.addEventListener("click", () => {
        themeToggle.classList.add("rotating");
        const isLight = document.body.classList.contains("light-theme");
        document.body.classList.toggle("light-theme", !isLight);
        themeToggle.textContent = !isLight ? "🌙 Dark Mode" : "☀️ Toggle Theme";
        spawnFloatingEmoji(themeToggle, !isLight ? "🌞" : "🌚");
    });

    // Run Button
    runBtn.addEventListener("click", () => runCode(editor, output));

    // Copy Button
    copyBtn.addEventListener("click", () => {
        const code = editor.innerText;
        navigator.clipboard.writeText(code).then(() => {
            copyBtn.textContent = "✅";
            setTimeout(() => (copyBtn.textContent = "📋"), 1000);
        }).catch(() => {
            alert("Failed to copy code to clipboard.");
        });
    });
}

export function setupConsoleOverride(output) {
    const originalLog = console.log;
    console.log = (...args) => {
        args.forEach((arg) => logOutput(arg, output));
        originalLog.apply(console, args);
    };
}