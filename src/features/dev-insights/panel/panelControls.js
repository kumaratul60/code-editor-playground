export function getCodeFromEditor() {
    const codeElement = document.getElementById('code-text');
    if (codeElement) {
        return codeElement.textContent || codeElement.innerText || '';
    }

    if (typeof window !== 'undefined' && window.currentCode) {
        return window.currentCode;
    }

    return '';
}

export function toggleDevInsights() {
    const sidebar = document.getElementById('dev-insights-sidebar');
    if (sidebar) {
        const panel = sidebar.querySelector('#dev-insights-panel');
        if (panel) {
            const isHidden = panel.style.display === 'none' || !panel.style.display;

            if (isHidden) {
                panel.style.display = 'block';
                sidebar.classList.add('open');
            } else {
                closeDevInsights();
            }
        }
    }
}

export function closeDevInsights() {
    const sidebar = document.getElementById('dev-insights-sidebar');
    if (sidebar) {
        const panel = sidebar.querySelector('#dev-insights-panel');
        if (panel) {
            panel.style.display = 'none';
            sidebar.classList.remove('open');
        }
    }
}

if (typeof window !== 'undefined') {
    window.toggleDevInsights = toggleDevInsights;
    window.closeDevInsights = closeDevInsights;
}
