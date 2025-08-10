import {copyBtn, editor, themeToggle} from "./domUtils.js";
import {spawnFloatingEmoji} from "../utils/commonUtils.js";
import { copyIcon} from "../utils/svg.js";

export function themeToggleHandler() {
    themeToggle.addEventListener("click", () => {
        // themeToggle.classList.add("rotating");
        const isLight = document.body.classList.contains("light-theme");
        document.body.classList.toggle("light-theme", !isLight);
        themeToggle.textContent = !isLight ? "🌙 Dark Mode" : "☀️ Toggle Theme";
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




