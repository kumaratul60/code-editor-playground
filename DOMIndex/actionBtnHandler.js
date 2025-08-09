import {copyBtn, editor, themeToggle} from "./domUtils.js";
import {spawnFloatingEmoji} from "../utils/commonUtils.js";
import {checkIcon, copyIcon} from "../utils/svg.js";

export function themeToggleHandler() {
    themeToggle.addEventListener("click", () => {
        themeToggle.classList.add("rotating");
        const isLight = document.body.classList.contains("light-theme");
        document.body.classList.toggle("light-theme", !isLight);
        themeToggle.textContent = !isLight ? "🌙 Dark Mode" : "☀️ Toggle Theme";
        spawnFloatingEmoji(themeToggle, !isLight ? "🌞" : "🌚");
    });
}

export function copyBtnHandler() {
    copyBtn.addEventListener("click", () => {
        const code = editor.innerText;
        try {
            navigator.clipboard.writeText(code).then(() => {
                copyBtn.classList.add("fade-out");
                setTimeout(() => {
                    copyBtn.innerHTML = checkIcon;
                    copyBtn.classList.remove("fade-out");
                    copyBtn.classList.add("success");

                    // Revert back to copy icon after delay
                    setTimeout(() => {
                        copyBtn.classList.add("fade-out");
                        setTimeout(() => {
                            copyBtn.innerHTML = copyIcon;
                            copyBtn.classList.remove("fade-out", "success");
                        }, 250);
                    }, 1000);
                }, 250);
            });
        } catch (err) {
            alert("Failed to copy code to clipboard.");
        }
    });
}




