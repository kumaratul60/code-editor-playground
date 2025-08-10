/**
 * Renders a JavaScript value into a DOM element with enhanced formatting and interactivity.
 */
export function renderValue(val, depth = 0, maxDepth = 3) {
    const type = typeof val;

    // Handle null and undefined
    if (val === null) return createSpan('null', '#f94144', 'italic');
    if (val === undefined) return createSpan('undefined', '#999', 'italic');

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
        return createSpan(Array.isArray(val) ? '[...]' : '{...}', '#666', 'italic');
    }

    // return Array.isArray(val) ? renderArray(val, depth) : renderObject(val, depth);
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
            span.innerHTML = `<span style="color: #90be6d;">"</span><span style="color: #a8e6cf;">${escapeHtml(val)}</span><span style="color: #90be6d;">"</span>`;
            break;
        case 'number':
            span.textContent = val.toString();
            span.style.color = color;
            span.style.fontWeight = 'bold';
            break;
        case 'boolean':
            span.textContent = val.toString();
            span.style.color = color;
            span.style.fontWeight = 'bold';
            break;
        case 'bigint':
            span.textContent = val.toString() + 'n';
            span.style.color = '#f9c74f';
            span.style.fontWeight = 'bold';
            break;
        case 'symbol':
            span.textContent = val.toString();
            span.style.color = '#e76f51';
            break;
        default:
            span.textContent = String(val);
            span.style.color = color;
    }

    return span;
}

/**
 * Renders functions with signature display
 */
function renderFunction(func) {
    const container = document.createElement('div');
    container.style.cssText = `
        padding: 4px 8px;
        background: rgba(87, 117, 144, 0.1);
        border-left: 3px solid #577590;
        border-radius: 4px;
        margin: 2px 0;
    `;

    const signature = func.toString().split('\n')[0].trim();
    const shortSignature = signature.length > 60 ? signature.substring(0, 60) + '...' : signature;

    container.innerHTML = `<span style="color: #577590; font-family: monospace;">${escapeHtml(shortSignature)}</span>`;

    return container;
}

/**
 * Renders arrays with advanced features
 */
function renderAdvancedArray(arr, depth = 0) {
    const container = document.createElement('div');
    container.className = 'output-array-advanced';
    container.style.cssText = `
        margin: 4px 0;
        border-radius: 6px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        transition: all 0.3s ease;
    `;

    // Advanced header with metrics
    const header = document.createElement('div');
    header.className = 'output-header-advanced';
    header.style.cssText = `
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        background: linear-gradient(135deg, rgba(0, 180, 216, 0.15), rgba(0, 180, 216, 0.05));
        border-left: 4px solid #00b4d8;
        transition: all 0.3s ease;
        position: relative;
    `;

    const leftSection = document.createElement('div');
    leftSection.style.cssText = 'display: flex; align-items: center; gap: 8px;';

    const arrow = document.createElement('span');
    arrow.textContent = '▼';
    arrow.style.cssText = `
        transition: transform 0.3s ease;
        color: #00b4d8;
        font-size: 14px;
        font-weight: bold;
    `;

    const label = document.createElement('span');
    label.innerHTML = `<span style="color: #00b4d8; font-weight: bold; font-size: 14px;">Array</span>`;

    const metrics = document.createElement('div');
    metrics.style.cssText = 'display: flex; gap: 8px; align-items: center;';

    // Length badge
    const lengthBadge = document.createElement('span');
    lengthBadge.textContent = `${arr.length}`;
    lengthBadge.style.cssText = `
        background: #00b4d8;
        color: white;
        padding: 2px 6px;
        border-radius: 10px;
        font-size: 11px;
        font-weight: bold;
    `;

    // Data types summary
    const types = [...new Set(arr.map(item => typeof item))];
    const typesBadge = document.createElement('span');
    typesBadge.textContent = types.join(', ');
    typesBadge.style.cssText = `
        background: rgba(0, 180, 216, 0.2);
        color: #00b4d8;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 500;
    `;

    // Copy array button
    const copyArrayBtn = document.createElement('button');
    copyArrayBtn.innerHTML = '📋';
    copyArrayBtn.style.cssText = `
        background: none;
        border: none;
        color: #00b4d8;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s ease;
        opacity: 0.7;
    `;

    copyArrayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(JSON.stringify(arr, null, 2)).then(() => {
            showToast('Array copied to clipboard!', 'success');
        });
    });

    copyArrayBtn.addEventListener('mouseenter', () => {
        copyArrayBtn.style.background = 'rgba(0, 180, 216, 0.2)';
        copyArrayBtn.style.opacity = '1';
    });

    metrics.appendChild(lengthBadge);
    metrics.appendChild(typesBadge);
    metrics.appendChild(copyArrayBtn);

    leftSection.appendChild(arrow);
    leftSection.appendChild(label);

    header.appendChild(leftSection);
    header.appendChild(metrics);

    // Array content with enhanced styling
    const content = document.createElement('div');
    content.className = 'output-content-advanced';
    content.style.cssText = `
        background: rgba(0, 180, 216, 0.02);
        border-left: 2px solid rgba(0, 180, 216, 0.3);
        margin-left: 16px;
        padding: 8px 12px;
        transition: all 0.3s ease;
    `;

    arr.forEach((item, index) => {
        const itemContainer = document.createElement('div');
        itemContainer.style.cssText = `
            margin: 4px 0;
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 4px 8px;
            border-radius: 4px;
            transition: all 0.2s ease;
        `;

        const indexSpan = document.createElement('span');
        indexSpan.textContent = `${index}`;
        indexSpan.style.cssText = `
            color: #666;
            min-width: 24px;
            font-size: 11px;
            font-weight: bold;
            background: rgba(255,255,255,0.1);
            padding: 2px 6px;
            border-radius: 4px;
            text-align: center;
            margin-top: 2px;
        `;

        const valueElement = renderValue(item, depth + 1);

        // Hover effect for items
        itemContainer.addEventListener('mouseenter', () => {
            itemContainer.style.background = 'rgba(255,255,255,0.03)';
        });
        itemContainer.addEventListener('mouseleave', () => {
            itemContainer.style.background = 'transparent';
        });

        itemContainer.appendChild(indexSpan);
        itemContainer.appendChild(valueElement);
        content.appendChild(itemContainer);
    });

    // Toggle functionality with enhanced animations
    let isExpanded = true;
    header.addEventListener('click', () => {
        isExpanded = !isExpanded;
        content.style.display = isExpanded ? 'block' : 'none';
        arrow.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)';
        header.style.background = isExpanded
            ? 'linear-gradient(135deg, rgba(0, 180, 216, 0.15), rgba(0, 180, 216, 0.05))'
            : 'linear-gradient(135deg, rgba(0, 180, 216, 0.1), rgba(0, 180, 216, 0.03))';
    });

    // Hover effects for header
    header.addEventListener('mouseenter', () => {
        header.style.background = 'linear-gradient(135deg, rgba(0, 180, 216, 0.25), rgba(0, 180, 216, 0.1))';
        container.style.transform = 'translateY(-1px)';
        container.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    });

    header.addEventListener('mouseleave', () => {
        header.style.background = isExpanded
            ? 'linear-gradient(135deg, rgba(0, 180, 216, 0.15), rgba(0, 180, 216, 0.05))'
            : 'linear-gradient(135deg, rgba(0, 180, 216, 0.1), rgba(0, 180, 216, 0.03))';
        container.style.transform = 'translateY(0)';
        container.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    });

    container.appendChild(header);
    container.appendChild(content);

    return container;
}

/**
 * Renders objects with advanced features (similar structure to arrays but with object-specific styling)
 */
function renderAdvancedObject(obj, depth = 0) {
    const container = document.createElement('div');
    container.className = 'output-object-advanced';
    container.style.cssText = `
        margin: 4px 0;
        border-radius: 6px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        transition: all 0.3s ease;
    `;

    const keys = Object.keys(obj);
    const constructor = obj.constructor?.name || 'Object';

    // Advanced object header
    const header = document.createElement('div');
    header.className = 'output-header-advanced';
    header.style.cssText = `
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        background: linear-gradient(135deg, rgba(249, 199, 79, 0.15), rgba(249, 199, 79, 0.05));
        border-left: 4px solid #f9c74f;
        transition: all 0.3s ease;
    `;

    const leftSection = document.createElement('div');
    leftSection.style.cssText = 'display: flex; align-items: center; gap: 8px;';

    const arrow = document.createElement('span');
    arrow.textContent = '▼';
    arrow.style.cssText = `
        transition: transform 0.3s ease;
        color: #f9c74f;
        font-size: 14px;
        font-weight: bold;
    `;

    const label = document.createElement('span');
    label.innerHTML = `<span style="color: #f9c74f; font-weight: bold; font-size: 14px;">${constructor}</span>`;

    const metrics = document.createElement('div');
    metrics.style.cssText = 'display: flex; gap: 8px; align-items: center;';

    // Properties count badge
    const propsBadge = document.createElement('span');
    propsBadge.textContent = `${keys.length}`;
    propsBadge.style.cssText = `
        background: #f9c74f;
        color: white;
        padding: 2px 6px;
        border-radius: 10px;
        font-size: 11px;
        font-weight: bold;
    `;

    // Copy object button
    const copyObjBtn = document.createElement('button');
    copyObjBtn.innerHTML = '📋';
    copyObjBtn.style.cssText = `
        background: none;
        border: none;
        color: #f9c74f;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s ease;
        opacity: 0.7;
    `;

    copyObjBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(JSON.stringify(obj, null, 2)).then(() => {
            showToast('Object copied to clipboard!', 'success');
        });
    });

    metrics.appendChild(propsBadge);
    metrics.appendChild(copyObjBtn);

    leftSection.appendChild(arrow);
    leftSection.appendChild(label);

    header.appendChild(leftSection);
    header.appendChild(metrics);

    // Object content
    const content = document.createElement('div');
    content.className = 'output-content-advanced';
    content.style.cssText = `
        background: rgba(249, 199, 79, 0.02);
        border-left: 2px solid rgba(249, 199, 79, 0.3);
        margin-left: 16px;
        padding: 8px 12px;
        transition: all 0.3s ease;
    `;

    keys.forEach(key => {
        const itemContainer = document.createElement('div');
        itemContainer.style.cssText = `
            margin: 4px 0;
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 4px 8px;
            border-radius: 4px;
            transition: all 0.2s ease;
        `;

        const keySpan = document.createElement('span');
        keySpan.innerHTML = `<span style="color: #e76f51; font-weight: 600; background: rgba(231, 111, 81, 0.1); padding: 2px 6px; border-radius: 4px;">${escapeHtml(key)}</span><span style="color: #666; margin-left: 4px;">:</span>`;
        keySpan.style.minWidth = '100px';

        const valueElement = renderValue(obj[key], depth + 1);

        itemContainer.addEventListener('mouseenter', () => {
            itemContainer.style.background = 'rgba(255,255,255,0.03)';
        });
        itemContainer.addEventListener('mouseleave', () => {
            itemContainer.style.background = 'transparent';
        });

        itemContainer.appendChild(keySpan);
        itemContainer.appendChild(valueElement);
        content.appendChild(itemContainer);
    });

    // Toggle functionality
    let isExpanded = true;
    header.addEventListener('click', () => {
        isExpanded = !isExpanded;
        content.style.display = isExpanded ? 'block' : 'none';
        arrow.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)';
    });

    // Hover effects
    header.addEventListener('mouseenter', () => {
        header.style.background = 'linear-gradient(135deg, rgba(249, 199, 79, 0.25), rgba(249, 199, 79, 0.1))';
        container.style.transform = 'translateY(-1px)';
        container.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    });

    header.addEventListener('mouseleave', () => {
        header.style.background = 'linear-gradient(135deg, rgba(249, 199, 79, 0.15), rgba(249, 199, 79, 0.05))';
        container.style.transform = 'translateY(0)';
        container.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    });

    container.appendChild(header);
    container.appendChild(content);

    return container;
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
        number: '#f9c74f',
        string: '#90be6d',
        boolean: '#f94144',
        undefined: '#999',
        function: '#577590',
        object: '#00b4d8',
        bigint: '#f9c74f',
        symbol: '#e76f51',
        default: '#fff',
    };
    return colors[type] || colors.default;
}
