import { renderValue } from "./valueRenderers.js";

export function createLogEntry(message, level = 'info', showTimestamp = true) {
    const entry = document.createElement('div');
    entry.className = 'console-log-entry';

    const levelIndicator = document.createElement('div');
    levelIndicator.className = `console-log-level ${level}`;
    entry.appendChild(levelIndicator);

    if (showTimestamp) {
        const timestamp = document.createElement('span');
        timestamp.className = 'console-timestamp';
        timestamp.textContent = new Date().toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3
        });
        entry.appendChild(timestamp);
    }

    const content = document.createElement('div');
    content.style.flex = '1';

    if (typeof message === 'string') {
        content.textContent = message;
    } else {
        content.appendChild(renderValue(message));
    }

    entry.appendChild(content);

    const copyBtn = document.createElement('button');
    copyBtn.className = 'console-copy-btn';
    copyBtn.textContent = '📋';
    copyBtn.title = 'Copy to clipboard';

    copyBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
            const textToCopy = typeof message === 'string'
                ? message
                : JSON.stringify(message, null, 2);
            await navigator.clipboard.writeText(textToCopy);
            copyBtn.textContent = '✓';
            setTimeout(() => {
                copyBtn.textContent = '📋';
            }, 1000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    });

    entry.appendChild(copyBtn);
    return entry;
}

export function logError(error, context = '') {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'console-error';

    const errorMessage = document.createElement('div');
    errorMessage.className = 'console-error-message';
    errorMessage.textContent = `${context ? `${context}: ` : ''}${error.message || error}`;
    errorContainer.appendChild(errorMessage);

    if (error.stack) {
        const stackTrace = document.createElement('div');
        stackTrace.className = 'console-stack-trace';
        stackTrace.textContent = error.stack;
        errorContainer.appendChild(stackTrace);
    }

    return errorContainer;
}

export function createConsoleTable(data) {
    if (!data || (typeof data !== 'object')) {
        return createStyledSpan('Invalid data for table', 'var(--console-error-color)');
    }

    const table = document.createElement('table');
    table.className = 'console-table';

    if (Array.isArray(data)) {
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');

        const indexHeader = document.createElement('th');
        indexHeader.textContent = '(index)';
        headerRow.appendChild(indexHeader);

        const valueHeader = document.createElement('th');
        valueHeader.textContent = 'Value';
        headerRow.appendChild(valueHeader);

        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        data.forEach((item, index) => {
            const row = document.createElement('tr');

            const indexCell = document.createElement('td');
            indexCell.textContent = index;
            row.appendChild(indexCell);

            const valueCell = document.createElement('td');
            valueCell.appendChild(renderValue(item));
            row.appendChild(valueCell);

            tbody.appendChild(row);
        });

        table.appendChild(tbody);
    } else {
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');

        const keyHeader = document.createElement('th');
        keyHeader.textContent = 'Key';
        headerRow.appendChild(keyHeader);

        const valueHeader = document.createElement('th');
        valueHeader.textContent = 'Value';
        headerRow.appendChild(valueHeader);

        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        Object.entries(data).forEach(([key, value]) => {
            const row = document.createElement('tr');

            const keyCell = document.createElement('td');
            keyCell.textContent = key;
            row.appendChild(keyCell);

            const valueCell = document.createElement('td');
            valueCell.appendChild(renderValue(value));
            row.appendChild(valueCell);

            tbody.appendChild(row);
        });

        table.appendChild(tbody);
    }

    return table;
}

export function createConsoleGroup(label, collapsed = false) {
    const group = document.createElement('div');
    group.className = 'console-group';

    const groupLabel = document.createElement('div');
    groupLabel.className = 'console-group-label';
    groupLabel.innerHTML = `<span class="expand-arrow ${collapsed ? '' : 'expanded'}">▶</span> ${label}`;

    const groupContent = document.createElement('div');
    groupContent.style.display = collapsed ? 'none' : 'block';

    groupLabel.addEventListener('click', () => {
        const arrow = groupLabel.querySelector('.expand-arrow');
        const isExpanded = arrow.classList.contains('expanded');

        arrow.classList.toggle('expanded', !isExpanded);
        groupContent.style.display = isExpanded ? 'none' : 'block';
    });

    group.appendChild(groupLabel);
    group.appendChild(groupContent);

    return { group, content: groupContent };
}

export function createTimingLog(label, duration) {
    const timing = document.createElement('span');
    timing.className = 'console-timing';
    timing.textContent = `${label}: ${duration.toFixed(3)}ms`;
    return timing;
}

export function showAdvancedToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'console-toast';

    const typeColors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: 'var(--console-number-color)'
    };

    toast.style.borderLeft = `4px solid ${typeColors[type] || typeColors.info}`;

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    toast.innerHTML = `
        <span style=\"margin-right: 8px;\">${icons[type] || icons.info}</span>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, duration);

    return toast;
}

function createStyledSpan(text, color, fontStyle = 'normal') {
    const span = document.createElement('span');
    span.textContent = text;
    span.style.color = color;
    span.style.fontStyle = fontStyle;
    return span;
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4ade80' : '#3b82f6'};
        color: white;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 2000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
