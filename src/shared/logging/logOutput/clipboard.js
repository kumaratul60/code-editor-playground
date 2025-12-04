import { copyIcon } from "@shared/svg.js";

export function copyToClipboard(data, button, successMessage = 'Copied!') {
    try {
        const jsonString = JSON.stringify(data, null, 2);

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(jsonString).then(() => {
                showCopyFeedback(button, successMessage, 'success');
            }).catch(() => {
                fallbackCopy(jsonString, button, successMessage);
            });
        } else {
            fallbackCopy(jsonString, button, successMessage);
        }
    } catch (error) {
        console.error('Copy failed:', error);
        showCopyFeedback(button, 'Copy failed!', 'error');
    }
}

function fallbackCopy(text, button, successMessage) {
    try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (successful) {
            showCopyFeedback(button, successMessage, 'success');
        } else {
            showCopyFeedback(button, 'Copy failed!', 'error');
        }
    } catch (error) {
        console.error('Fallback copy failed:', error);
        showCopyFeedback(button, 'Copy failed!', 'error');
    }
}

export function showCopyFeedback(button, text, status) {
    const originalText = button.innerHTML;
    const originalStyles = {
        opacity: button.style.opacity,
        transform: button.style.transform,
        background: button.style.background
    };

    button.innerHTML = text;
    button.style.opacity = '1';
    button.style.transform = 'scale(1.1)';
    button.style.background = status === 'success'
        ? 'var(--console-success-bg)'
        : 'var(--console-error-bg)';

    setTimeout(() => {
        button.innerHTML = originalText;
        button.style.opacity = originalStyles.opacity || '0.7';
        button.style.transform = originalStyles.transform || 'scale(1)';
        button.style.background = originalStyles.background || 'transparent';
    }, 1500);
}

export function createCopyButton(data, label = 'Copy', size = '11px') {
    const copyBtn = document.createElement('button');
    copyBtn.innerHTML = copyIcon;
    copyBtn.title = label;
    copyBtn.className = 'log-copy-btn';
    copyBtn.style.cssText = `
        background: none;
        border: none;
        color: var(--console-property-color);
        cursor: pointer;
        padding: 2px 4px;
        border-radius: 4px;
        font-size: ${size};
        transition: all 0.2s ease;
        opacity: 0.7;
        margin-left: 8px;
    `;

    copyBtn.addEventListener('mouseenter', () => {
        copyBtn.style.background = 'var(--console-hover-bg)';
        copyBtn.style.opacity = '1';
        copyBtn.style.transform = 'scale(1.1)';
    });

    copyBtn.addEventListener('mouseleave', () => {
        copyBtn.style.background = 'transparent';
        copyBtn.style.opacity = '0.7';
        copyBtn.style.transform = 'scale(1)';
    });

    copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        copyToClipboard(data, copyBtn, `${label}!`);
    });

    return copyBtn;
}
