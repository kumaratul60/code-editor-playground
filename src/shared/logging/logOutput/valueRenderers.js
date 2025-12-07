/**
 * Renders arbitrary JS values with Chrome-like console styling.
 */
export function renderValue(val, depth = 0, maxDepth = 3) {
    const type = typeof val;

    if (val === null) return createSpan('null', 'var(--console-null-color)', 'italic');
    if (val === undefined) return createSpan('undefined', 'var(--console-undefined-color)', 'italic');

    if (type !== 'object' && type !== 'function') {
        return renderPrimitive(val, type);
    }

    if (type === 'function') {
        return renderFunction(val);
    }

    if (depth >= maxDepth) {
        return createSpan(Array.isArray(val) ? '[...]' : '{...}', 'var(--console-default-color)', 'italic');
    }

    return Array.isArray(val) ? renderAdvancedArray(val, depth) : renderAdvancedObject(val, depth);
}

function renderPrimitive(val, type) {
    const span = document.createElement('span');

    if (val instanceof Error || (val && val.name && val.message && val.stack)) {
        span.textContent = val.toString();
        span.style.color = 'var(--console-error-color)';
        span.style.fontWeight = 'bold';
        span.title = val.stack || 'Error object';
        return span;
    }

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
            span.textContent = `${val.toString()}n`;
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

function renderAdvancedArray(arr, depth = 0) {
    const container = document.createElement('div');
    container.className = 'console-output expandable-item';

    const arrow = document.createElement('span');
    arrow.className = 'expand-arrow';
    arrow.textContent = '▶';

    const header = document.createElement('span');
    header.style.cssText = `
        display: inline-flex;
        align-items: center;
        cursor: pointer;
        user-select: none;
    `;

    const openBracket = document.createElement('span');
    openBracket.className = 'bracket';
    openBracket.textContent = '[';

    const arrayInfo = document.createElement('span');
    arrayInfo.style.color = 'var(--console-collapsed-color)';
    arrayInfo.textContent = arr.length === 0 ? '' : `${arr.length}`;

    const closeBracket = document.createElement('span');
    closeBracket.className = 'bracket';
    closeBracket.textContent = ']';

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
    if (arr.length > 0) header.appendChild(arrayInfo);
    header.appendChild(closeBracket);
    header.appendChild(preview);

    const content = document.createElement('div');
    content.className = 'object-content';
    content.style.display = 'none';

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

function renderAdvancedObject(obj, depth = 0) {
    const container = document.createElement('div');
    container.className = 'console-output expandable-item';

    const arrow = document.createElement('span');
    arrow.className = 'expand-arrow';
    arrow.textContent = '▶';

    const header = document.createElement('span');
    header.style.cssText = `
        display: inline-flex;
        align-items: center;
        cursor: pointer;
        user-select: none;
    `;

    const openBrace = document.createElement('span');
    openBrace.className = 'bracket';
    openBrace.textContent = '{';

    const closeBrace = document.createElement('span');
    closeBrace.className = 'bracket';
    closeBrace.textContent = '}';

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

    const content = document.createElement('div');
    content.className = 'object-content';
    content.style.display = 'none';

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
    if (typeof val === 'string') return `"${val.length > 20 ? `${val.substring(0, 20)}...` : val}"`;
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
