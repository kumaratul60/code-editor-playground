import {copyIcon} from "./svg.js";

/**
 * Renders a JavaScript value into a DOM element with enhanced formatting and interactivity.
 */
export function renderValue(val, depth = 0, maxDepth = 3) {
    const type = typeof val;

    // Handle null and undefined
    if (val === null) return createSpan('null', 'var(--console-null-color)', 'italic');
    if (val === undefined) return createSpan('undefined', 'var(--console-undefined-color)', 'italic');

    // Handle primitives
    if (type !== 'object' && type !== 'function') {
        return renderPrimitive(val, type);
    }

    // Handle functions
    if (type === 'function') {
        return renderFunction(val);
    }

    // Handle objects and arrays
    if (depth >= maxDepth) {
        return createSpan(Array.isArray(val) ? '[...]' : '{...}', 'var(--console-default-color)', 'italic');
    }

    return Array.isArray(val) ? renderAdvancedArray(val, depth) : renderAdvancedObject(val, depth);
}

/**
 * Renders primitive values with appropriate styling
 */
function renderPrimitive(val, type) {
    const span = document.createElement('span');
    const color = getTypeColor(type);

    switch (type) {
        case 'string':
            span.innerHTML = `<span style="color: var(--console-string-quote-color);">"</span><span style="color: var(--console-string-color);">${escapeHtml(val)}</span><span style="color: var(--console-string-quote-color);">"</span>`;
            break;
        case 'number':
            span.textContent = val.toString();
            span.style.color = 'var(--console-number-color)';
            span.style.fontWeight = 'bold';
            break;
        case 'boolean':
            span.textContent = val.toString();
            span.style.color = 'var(--console-boolean-color)';
            span.style.fontWeight = 'bold';
            break;
        case 'bigint':
            span.textContent = val.toString() + 'n';
            span.style.color = 'var(--console-number-color)';
            span.style.fontWeight = 'bold';
            break;
        case 'symbol':
            span.textContent = val.toString();
            span.style.color = 'var(--console-symbol-color)';
            break;
        default:
            span.textContent = String(val);
            span.style.color = 'var(--console-default-color)';
    }

    return span;
}

/**
 * Renders functions with signature display
 */
function renderFunction(func) {
    const container = document.createElement('span');
    container.style.color = 'var(--console-function-color)';

    const funcStr = func.toString();
    const isArrow = funcStr.includes('=>');
    const isAsync = funcStr.startsWith('async');

    let signature;
    if (isArrow) {
        const match = funcStr.match(/^(async\s+)?(\([^)]*\)|[^=]+)\s*=>/);
        signature = match ? `${match[1] || ''}${match[2]} => {...}` : 'function() {...}';
    } else {
        const match = funcStr.match(/^(async\s+)?function\s*([^(]*)\s*\([^)]*\)/);
        signature = match ? `${match[1] || ''}function ${match[2]}() {...}` : 'function() {...}';
    }

    container.textContent = signature;
    return container;
}


/**
 * Renders arrays with Chrome console styling
 */
function renderAdvancedArray(arr, depth = 0) {
    const container = document.createElement('div');
    container.className = 'console-output expandable-item';

    // Create expand/collapse arrow
    const arrow = document.createElement('span');
    arrow.className = 'expand-arrow';
    arrow.textContent = '▶';

    // Array header with Chrome console styling
    const header = document.createElement('span');
    header.style.cssText = `
        display: inline-flex;
        align-items: center;
        cursor: pointer;
        user-select: none;
    `;

    // Array bracket and length info
    const openBracket = document.createElement('span');
    openBracket.className = 'bracket';
    openBracket.textContent = '[';

    const arrayInfo = document.createElement('span');
    arrayInfo.style.color = 'var(--console-collapsed-color)';
    arrayInfo.textContent = arr.length === 0 ? '' : `${arr.length}`;

    const closeBracket = document.createElement('span');
    closeBracket.className = 'bracket';
    closeBracket.textContent = ']';

    // Preview text for collapsed state
    const preview = document.createElement('span');
    preview.className = 'object-preview';
    if (arr.length === 0) {
        preview.textContent = '';
    } else if (arr.length <= 3) {
        preview.textContent = ` ${arr.map(item => getPreviewText(item)).join(', ')}`;
    } else {
        preview.textContent = ` ${arr.slice(0, 3).map(item => getPreviewText(item)).join(', ')}, ...`;
    }

    header.appendChild(arrow);
    header.appendChild(openBracket);
    if (arr.length > 0) {
        header.appendChild(arrayInfo);
    }
    header.appendChild(closeBracket);
    header.appendChild(preview);

    // Content container (initially hidden)
    const content = document.createElement('div');
    content.className = 'object-content';
    content.style.display = 'none';

    // Populate array items
    if (arr.length > 0) {
        arr.forEach((item, index) => {
            const itemContainer = document.createElement('div');
            itemContainer.style.cssText = `
                display: flex;
                align-items: flex-start;
                margin: 2px 0;
                padding: 1px 0;
            `;

            const indexSpan = document.createElement('span');
            indexSpan.className = 'property-name';
            indexSpan.style.marginRight = '8px';
            indexSpan.style.minWidth = '20px';
            indexSpan.textContent = `${index}:`;

            const valueSpan = renderValue(item, depth + 1);

            itemContainer.appendChild(indexSpan);
            itemContainer.appendChild(valueSpan);
            content.appendChild(itemContainer);
        });
    }

    // Toggle functionality
    let isExpanded = false;
    header.addEventListener('click', () => {
        isExpanded = !isExpanded;
        arrow.classList.toggle('expanded', isExpanded);
        content.style.display = isExpanded ? 'block' : 'none';
        preview.style.display = isExpanded ? 'none' : 'inline';

        if (isExpanded) {
            content.classList.add('expanding');
            setTimeout(() => content.classList.remove('expanding'), 150);
        }
    });

    container.appendChild(header);
    container.appendChild(content);

    return container;
}

/**
 * Renders objects with Chrome console styling
 */
function renderAdvancedObject(obj, depth = 0) {
    const container = document.createElement('div');
    container.className = 'console-output expandable-item';

    // Create expand/collapse arrow
    const arrow = document.createElement('span');
    arrow.className = 'expand-arrow';
    arrow.textContent = '▶';

    // Object header with Chrome console styling
    const header = document.createElement('span');
    header.style.cssText = `
        display: inline-flex;
        align-items: center;
        cursor: pointer;
        user-select: none;
    `;

    // Object bracket and constructor info
    const openBrace = document.createElement('span');
    openBrace.className = 'bracket';
    openBrace.textContent = '{';

    const closeBrace = document.createElement('span');
    closeBrace.className = 'bracket';
    closeBrace.textContent = '}';

    // Get object keys for preview
    const keys = Object.keys(obj);
    const preview = document.createElement('span');
    preview.className = 'object-preview';

    if (keys.length === 0) {
        preview.textContent = '';
    } else if (keys.length <= 3) {
        preview.textContent = ` ${keys.map(key => `${key}: ${getPreviewText(obj[key])}`).join(', ')}`;
    } else {
        preview.textContent = ` ${keys.slice(0, 3).map(key => `${key}: ${getPreviewText(obj[key])}`).join(', ')}, ...`;
    }

    header.appendChild(arrow);
    header.appendChild(openBrace);
    header.appendChild(closeBrace);
    header.appendChild(preview);

    // Content container (initially hidden)
    const content = document.createElement('div');
    content.className = 'object-content';
    content.style.display = 'none';

    // Populate object properties
    if (keys.length > 0) {
        keys.forEach(key => {
            const propContainer = document.createElement('div');
            propContainer.style.cssText = `
                display: flex;
                align-items: flex-start;
                margin: 2px 0;
                padding: 1px 0;
            `;

            const keySpan = document.createElement('span');
            keySpan.className = 'property-name';
            keySpan.textContent = `${key}:`;
            keySpan.style.marginRight = '8px';

            const valueSpan = renderValue(obj[key], depth + 1);

            propContainer.appendChild(keySpan);
            propContainer.appendChild(valueSpan);
            content.appendChild(propContainer);
        });
    }

    // Toggle functionality
    let isExpanded = false;
    header.addEventListener('click', () => {
        isExpanded = !isExpanded;
        arrow.classList.toggle('expanded', isExpanded);
        content.style.display = isExpanded ? 'block' : 'none';
        preview.style.display = isExpanded ? 'none' : 'inline';

        if (isExpanded) {
            content.classList.add('expanding');
            setTimeout(() => content.classList.remove('expanding'), 150);
        }
    });

    container.appendChild(header);
    container.appendChild(content);

    return container;
}

export function createLogEntry(message, level = 'info', showTimestamp = true) {
    const entry = document.createElement('div');
    entry.className = 'console-log-entry';

    // Add log level indicator
    const levelIndicator = document.createElement('div');
    levelIndicator.className = `console-log-level ${level}`;
    entry.appendChild(levelIndicator);

    // Add timestamp if enabled
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

    // Add message content
    const content = document.createElement('div');
    content.style.flex = '1';

    if (typeof message === 'string') {
        content.textContent = message;
    } else {
        content.appendChild(renderValue(message));
    }

    entry.appendChild(content);

    // Add copy button
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
            setTimeout(() => copyBtn.textContent = '📋', 1000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    });

    entry.appendChild(copyBtn);
    return entry;
}

/**
 * Enhanced error logging with stack trace
 */
export function logError(error, context = '') {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'console-error';

    // Error message
    const errorMessage = document.createElement('div');
    errorMessage.className = 'console-error-message';
    errorMessage.textContent = `${context ? context + ': ' : ''}${error.message || error}`;
    errorContainer.appendChild(errorMessage);

    // Stack trace if available
    if (error.stack) {
        const stackTrace = document.createElement('div');
        stackTrace.className = 'console-stack-trace';
        stackTrace.textContent = error.stack;
        errorContainer.appendChild(stackTrace);
    }

    return errorContainer;
}

/**
 * Create console table for objects/arrays
 */
export function createConsoleTable(data) {
    if (!data || (typeof data !== 'object')) {
        return createSpan('Invalid data for table', 'var(--console-error-color)');
    }

    const table = document.createElement('table');
    table.className = 'console-table';

    if (Array.isArray(data)) {
        // Array table
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');

        // Index column
        const indexHeader = document.createElement('th');
        indexHeader.textContent = '(index)';
        headerRow.appendChild(indexHeader);

        // Value column
        const valueHeader = document.createElement('th');
        valueHeader.textContent = 'Value';
        headerRow.appendChild(valueHeader);

        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Table body
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
        // Object table
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

/**
 * Create console group
 */
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

/**
 * Performance timing utility
 */
export function createTimingLog(label, duration) {
    const timing = document.createElement('span');
    timing.className = 'console-timing';
    timing.textContent = `${label}: ${duration.toFixed(3)}ms`;
    return timing;
}

/**
 * Enhanced showToast with different types and better styling
 */
export function showAdvancedToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'console-toast';

    // Add type-specific styling
    const typeColors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: 'var(--console-number-color)'
    };

    toast.style.borderLeft = `4px solid ${typeColors[type] || typeColors.info}`;

    // Add icon based on type
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    toast.innerHTML = `
        <span style="margin-right: 8px;">${icons[type] || icons.info}</span>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);

    // Auto remove
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

/**
 * Shows a toast notification
 */
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

// Add CSS animations
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


/**
 * Copy data to clipboard with user feedback
 */
export function copyToClipboard(data, button, successMessage = 'Copied!') {
    try {
        const jsonString = JSON.stringify(data, null, 2);

        if (navigator.clipboard && navigator.clipboard.writeText) {
            // Modern clipboard API
            navigator.clipboard.writeText(jsonString).then(() => {
                showCopyFeedback(button, successMessage, 'success');
            }).catch(() => {
                fallbackCopy(jsonString, button, successMessage);
            });
        } else {
            // Fallback for older browsers
            fallbackCopy(jsonString, button, successMessage);
        }
    } catch (error) {
        console.error('Copy failed:', error);
        showCopyFeedback(button, 'Copy failed!', 'error');
    }
}

/**
 * Fallback copy method for older browsers
 */
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

/**
 * Show visual feedback for copy operations
 */
export function showCopyFeedback(button, text, status) {
    const originalText = button.innerHTML;
    const originalStyles = {
        opacity: button.style.opacity,
        transform: button.style.transform,
        background: button.style.background
    };

    // Show feedback
    button.innerHTML = text;
    button.style.opacity = '1';
    button.style.transform = 'scale(1.1)';
    button.style.background = status === 'success'
        ? 'var(--console-success-bg)'
        : 'var(--console-error-bg)';

    // Reset after delay
    setTimeout(() => {
        button.innerHTML = originalText;
        button.style.opacity = originalStyles.opacity || '0.7';
        button.style.transform = originalStyles.transform || 'scale(1)';
        button.style.background = originalStyles.background || 'transparent';
    }, 1500);
}

/**
 * Create a copy button with consistent styling
 */
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

    // Hover effects
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

    // Copy functionality
    copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        copyToClipboard(data, copyBtn, `${label}!`);
    });

    return copyBtn;
}

/**
 * Helper functions
 */
function createSpan(text, color, fontStyle = 'normal') {
    const span = document.createElement('span');
    span.textContent = text;
    span.style.color = color;
    span.style.fontStyle = fontStyle;
    return span;
}

function getPreviewText(val) {
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (typeof val === 'string') return `"${val.length > 20 ? val.substring(0, 20) + '...' : val}"`;
    if (typeof val === 'object') {
        if (Array.isArray(val)) return `Array(${val.length})`;
        return val.constructor?.name || 'Object';
    }
    return String(val);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Returns a color based on the JavaScript data type.
 */
function getTypeColor(type) {
    const colors = {
        number: 'var(--console-number-color)',
        string: 'var(--console-string-color)',
        boolean: 'var(--console-boolean-color)',
        undefined: 'var(--console-undefined-color)',
        function: 'var(--console-function-color)',
        object: 'var(--console-object-color)',
        bigint: 'var(--console-number-color)',
        symbol: 'var(--console-symbol-color)',
        default: 'var(--console-default-color)',
    };
    return colors[type] || colors.default;
}

/**
 * Renders arrays with advanced features
 */
// function renderAdvancedArray(arr, depth = 0) {
//     const container = document.createElement('div');
//     container.className = 'output-array-advanced';
//     container.style.cssText = `
//         margin: 4px 0;
//         border-radius: 6px;
//         overflow: hidden;
//         box-shadow: 0 2px 8px rgba(0,0,0,0.1);
//         transition: all 0.3s ease;
//     `;
//
//     // Advanced header with metrics
//     const header = document.createElement('div');
//     header.className = 'output-header-advanced';
//     header.style.cssText = `
//         cursor: pointer;
//         display: flex;
//         align-items: center;
//         justify-content: space-between;
//         padding: 8px 12px;
//         background: linear-gradient(135deg, rgba(0, 180, 216, 0.15), rgba(0, 180, 216, 0.05));
//         border-left: 4px solid #00b4d8;
//         transition: all 0.3s ease;
//         position: relative;
//     `;
//
//     const leftSection = document.createElement('div');
//     leftSection.style.cssText = 'display: flex; align-items: center; gap: 8px;';
//
//     const arrow = document.createElement('span');
//     arrow.textContent = '▼';
//     arrow.style.cssText = `
//         transition: transform 0.3s ease;
//         color: #00b4d8;
//         font-size: 14px;
//         font-weight: bold;
//     `;
//
//     const label = document.createElement('span');
//     label.innerHTML = `<span style="color: #00b4d8; font-weight: bold; font-size: 14px;">Array</span>`;
//
//     const metrics = document.createElement('div');
//     metrics.style.cssText = 'display: flex; gap: 8px; align-items: center;';
//
//     // Length badge
//     const lengthBadge = document.createElement('span');
//     lengthBadge.textContent = `${arr.length}`;
//     lengthBadge.style.cssText = `
//         background: #00b4d8;
//         color: white;
//         padding: 2px 6px;
//         border-radius: 10px;
//         font-size: 11px;
//         font-weight: bold;
//     `;
//
//     // Data types summary
//     const types = [...new Set(arr.map(item => typeof item))];
//     const typesBadge = document.createElement('span');
//     typesBadge.textContent = types.join(', ');
//     typesBadge.style.cssText = `
//         background: rgba(0, 180, 216, 0.2);
//         color: #00b4d8;
//         padding: 2px 6px;
//         border-radius: 4px;
//         font-size: 10px;
//         font-weight: 500;
//     `;
//
//     // Copy array button
//     const copyArrayBtn = document.createElement('button');
//     copyArrayBtn.innerHTML = '📋';
//     copyArrayBtn.style.cssText = `
//         background: none;
//         border: none;
//         color: #00b4d8;
//         cursor: pointer;
//         padding: 4px;
//         border-radius: 4px;
//         transition: all 0.2s ease;
//         opacity: 0.7;
//     `;
//
//     copyArrayBtn.addEventListener('click', (e) => {
//         e.stopPropagation();
//         navigator.clipboard.writeText(JSON.stringify(arr, null, 2)).then(() => {
//             showToast('Array copied to clipboard!', 'success');
//         });
//     });
//
//     copyArrayBtn.addEventListener('mouseenter', () => {
//         copyArrayBtn.style.background = 'rgba(0, 180, 216, 0.2)';
//         copyArrayBtn.style.opacity = '1';
//     });
//
//     metrics.appendChild(lengthBadge);
//     metrics.appendChild(typesBadge);
//     metrics.appendChild(copyArrayBtn);
//
//     leftSection.appendChild(arrow);
//     leftSection.appendChild(label);
//
//     header.appendChild(leftSection);
//     header.appendChild(metrics);
//
//     // Array content with enhanced styling
//     const content = document.createElement('div');
//     content.className = 'output-content-advanced';
//     content.style.cssText = `
//         background: rgba(0, 180, 216, 0.02);
//         border-left: 2px solid rgba(0, 180, 216, 0.3);
//         margin-left: 16px;
//         padding: 8px 12px;
//         transition: all 0.3s ease;
//     `;
//
//     arr.forEach((item, index) => {
//         const itemContainer = document.createElement('div');
//         itemContainer.style.cssText = `
//             margin: 4px 0;
//             display: flex;
//             align-items: flex-start;
//             gap: 12px;
//             padding: 4px 8px;
//             border-radius: 4px;
//             transition: all 0.2s ease;
//         `;
//
//         const indexSpan = document.createElement('span');
//         indexSpan.textContent = `${index}`;
//         indexSpan.style.cssText = `
//             color: #666;
//             min-width: 24px;
//             font-size: 11px;
//             font-weight: bold;
//             background: rgba(255,255,255,0.1);
//             padding: 2px 6px;
//             border-radius: 4px;
//             text-align: center;
//             margin-top: 2px;
//         `;
//
//         const valueElement = renderValue(item, depth + 1);
//
//         // Hover effect for items
//         itemContainer.addEventListener('mouseenter', () => {
//             itemContainer.style.background = 'rgba(255,255,255,0.03)';
//         });
//         itemContainer.addEventListener('mouseleave', () => {
//             itemContainer.style.background = 'transparent';
//         });
//
//         itemContainer.appendChild(indexSpan);
//         itemContainer.appendChild(valueElement);
//         content.appendChild(itemContainer);
//     });
//
//     // Toggle functionality with enhanced animations
//     let isExpanded = true;
//     header.addEventListener('click', () => {
//         isExpanded = !isExpanded;
//         content.style.display = isExpanded ? 'block' : 'none';
//         arrow.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)';
//         header.style.background = isExpanded
//             ? 'linear-gradient(135deg, rgba(0, 180, 216, 0.15), rgba(0, 180, 216, 0.05))'
//             : 'linear-gradient(135deg, rgba(0, 180, 216, 0.1), rgba(0, 180, 216, 0.03))';
//     });
//
//     // Hover effects for header
//     header.addEventListener('mouseenter', () => {
//         header.style.background = 'linear-gradient(135deg, rgba(0, 180, 216, 0.25), rgba(0, 180, 216, 0.1))';
//         container.style.transform = 'translateY(-1px)';
//         container.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
//     });
//
//     header.addEventListener('mouseleave', () => {
//         header.style.background = isExpanded
//             ? 'linear-gradient(135deg, rgba(0, 180, 216, 0.15), rgba(0, 180, 216, 0.05))'
//             : 'linear-gradient(135deg, rgba(0, 180, 216, 0.1), rgba(0, 180, 216, 0.03))';
//         container.style.transform = 'translateY(0)';
//         container.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
//     });
//
//     container.appendChild(header);
//     container.appendChild(content);
//
//     return container;
// }
//
// /**
//  * Renders objects with advanced features (similar structure to arrays but with object-specific styling)
//  */
// function renderAdvancedObject(obj, depth = 0) {
//     const container = document.createElement('div');
//     container.className = 'output-object-advanced';
//     container.style.cssText = `
//         margin: 4px 0;
//         border-radius: 6px;
//         overflow: hidden;
//         box-shadow: 0 2px 8px rgba(0,0,0,0.1);
//         transition: all 0.3s ease;
//     `;
//
//     const keys = Object.keys(obj);
//     const constructor = obj.constructor?.name || 'Object';
//
//     // Advanced object header
//     const header = document.createElement('div');
//     header.className = 'output-header-advanced';
//     header.style.cssText = `
//         cursor: pointer;
//         display: flex;
//         align-items: center;
//         justify-content: space-between;
//         padding: 8px 12px;
//         background: linear-gradient(135deg, rgba(249, 199, 79, 0.15), rgba(249, 199, 79, 0.05));
//         border-left: 4px solid #f9c74f;
//         transition: all 0.3s ease;
//     `;
//
//     const leftSection = document.createElement('div');
//     leftSection.style.cssText = 'display: flex; align-items: center; gap: 8px;';
//
//     const arrow = document.createElement('span');
//     arrow.textContent = '▼';
//     arrow.style.cssText = `
//         transition: transform 0.3s ease;
//         color: #f9c74f;
//         font-size: 14px;
//         font-weight: bold;
//     `;
//
//     const label = document.createElement('span');
//     label.innerHTML = `<span style="color: #f9c74f; font-weight: bold; font-size: 14px;">${constructor}</span>`;
//
//     const metrics = document.createElement('div');
//     metrics.style.cssText = 'display: flex; gap: 8px; align-items: center;';
//
//     // Properties count badge
//     const propsBadge = document.createElement('span');
//     propsBadge.textContent = `${keys.length}`;
//     propsBadge.style.cssText = `
//         background: #f9c74f;
//         color: white;
//         padding: 2px 6px;
//         border-radius: 10px;
//         font-size: 11px;
//         font-weight: bold;
//     `;
//
//     // Copy object button
//     const copyObjBtn = document.createElement('button');
//     copyObjBtn.innerHTML = '📋';
//     copyObjBtn.style.cssText = `
//         background: none;
//         border: none;
//         color: #f9c74f;
//         cursor: pointer;
//         padding: 4px;
//         border-radius: 4px;
//         transition: all 0.2s ease;
//         opacity: 0.7;
//     `;
//
//     copyObjBtn.addEventListener('click', (e) => {
//         e.stopPropagation();
//         navigator.clipboard.writeText(JSON.stringify(obj, null, 2)).then(() => {
//             showToast('Object copied to clipboard!', 'success');
//         });
//     });
//
//     metrics.appendChild(propsBadge);
//     metrics.appendChild(copyObjBtn);
//
//     leftSection.appendChild(arrow);
//     leftSection.appendChild(label);
//
//     header.appendChild(leftSection);
//     header.appendChild(metrics);
//
//     // Object content
//     const content = document.createElement('div');
//     content.className = 'output-content-advanced';
//     content.style.cssText = `
//         background: rgba(249, 199, 79, 0.02);
//         border-left: 2px solid rgba(249, 199, 79, 0.3);
//         margin-left: 16px;
//         padding: 8px 12px;
//         transition: all 0.3s ease;
//     `;
//
//     keys.forEach(key => {
//         const itemContainer = document.createElement('div');
//         itemContainer.style.cssText = `
//             margin: 4px 0;
//             display: flex;
//             align-items: flex-start;
//             gap: 12px;
//             padding: 4px 8px;
//             border-radius: 4px;
//             transition: all 0.2s ease;
//         `;
//
//         const keySpan = document.createElement('span');
//         keySpan.innerHTML = `<span style="color: #e76f51; font-weight: 600; background: rgba(231, 111, 81, 0.1); padding: 2px 6px; border-radius: 4px;">${escapeHtml(key)}</span><span style="color: #666; margin-left: 4px;">:</span>`;
//         keySpan.style.minWidth = '100px';
//
//         const valueElement = renderValue(obj[key], depth + 1);
//
//         itemContainer.addEventListener('mouseenter', () => {
//             itemContainer.style.background = 'rgba(255,255,255,0.03)';
//         });
//         itemContainer.addEventListener('mouseleave', () => {
//             itemContainer.style.background = 'transparent';
//         });
//
//         itemContainer.appendChild(keySpan);
//         itemContainer.appendChild(valueElement);
//         content.appendChild(itemContainer);
//     });
//
//     // Toggle functionality
//     let isExpanded = true;
//     header.addEventListener('click', () => {
//         isExpanded = !isExpanded;
//         content.style.display = isExpanded ? 'block' : 'none';
//         arrow.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)';
//     });
//
//     // Hover effects
//     header.addEventListener('mouseenter', () => {
//         header.style.background = 'linear-gradient(135deg, rgba(249, 199, 79, 0.25), rgba(249, 199, 79, 0.1))';
//         container.style.transform = 'translateY(-1px)';
//         container.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
//     });
//
//     header.addEventListener('mouseleave', () => {
//         header.style.background = 'linear-gradient(135deg, rgba(249, 199, 79, 0.15), rgba(249, 199, 79, 0.05))';
//         container.style.transform = 'translateY(0)';
//         container.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
//     });
//
//     container.appendChild(header);
//     container.appendChild(content);
//
//     return container;
// }
