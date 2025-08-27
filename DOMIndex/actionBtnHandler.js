import {copyBtn, editor, themeToggle} from "./domUtils.js";
import {spawnFloatingEmoji} from "../utils/commonUtils.js";

export function themeToggleHandler() {
    // Set light mode as default on page load
    document.body.classList.add("light-theme");
    themeToggle.textContent = "🌙 Dark Mode";

    themeToggle.addEventListener("click", () => {
        const isLight = document.body.classList.contains("light-theme");
        document.body.classList.toggle("light-theme", !isLight);
        themeToggle.textContent = !isLight ? "🌙 Dark Mode" : "☀️ Light Mode";
        spawnFloatingEmoji(themeToggle, !isLight ? "🌞" : "🌚");
    });
}

export function copyBtnHandler() {
    copyBtn.addEventListener("click", () => {
        const code = editor.innerText;
        const originalContent = copyBtn.innerHTML;

        try {
            navigator.clipboard.writeText(code).then(() => {
                // copyBtn.innerHTML = checkIcon;
                copyBtn.innerHTML = "Copied";
                copyBtn.classList.add("success");
                // spawnFloatingEmoji("📋", copyBtn);

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




