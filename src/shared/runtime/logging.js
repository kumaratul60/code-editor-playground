import { createCopyButton, renderValue } from "@shared/logging/index.js";

let cumulativeTime = 0;
let autoScrollEnabled = true;

export function logOutput(message, outputEl, delta = 0, type = "log") {
    cumulativeTime += delta;

    const supportedLevels = ["log", "warn", "error"];
    const levelForFilter = supportedLevels.includes(type) ? type : "log";
    const items = Array.isArray(message) ? message : [message];

    const logLine = document.createElement("div");
    logLine.className = `console-log console-${type}`;
    logLine.dataset.level = levelForFilter;
    logLine.classList.add(`log-level-${type}`);
    logLine.style.cssText = `
        display: flex;
        flex-direction: column;
        margin-bottom: 6px;
        padding: 8px 12px;
        font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
        border-left: 4px solid;
        border-radius: 4px;
        box-shadow: none;
        transition: all 0.2s ease;
    `;

    const typeStyles = {
        error: { border: 'var(--log-error-border)', bg: 'var(--log-error-bg)', color: 'var(--log-error-text)' },
        warn: { border: 'var(--log-warn-border)', bg: 'var(--log-warn-bg)', color: 'var(--log-warn-text)' },
        log: { border: 'var(--log-info-border)', bg: 'var(--log-info-bg)', color: 'var(--log-info-text)' },
        info: { border: 'var(--log-debug-border)', bg: 'var(--log-debug-bg)', color: 'var(--log-debug-text)' },
        debug: { border: 'var(--log-trace-border)', bg: 'var(--log-trace-bg)', color: 'var(--log-trace-text)' },
    };

    const style = typeStyles[type] || typeStyles.log;
    logLine.style.borderColor = style.border;
    logLine.style.background = style.bg;
    logLine.style.color = style.color;

    logLine.addEventListener('mouseenter', () => {
        logLine.style.transform = 'translateX(2px)';
    });

    logLine.addEventListener('mouseleave', () => {
        logLine.style.transform = 'translateX(0)';
    });

    const logHeader = document.createElement('div');
    logHeader.className = 'log-header';
    logHeader.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 4px;
    `;

    const timeMeta = document.createElement("div");
    timeMeta.className = "log-timestamp";
    timeMeta.style.cssText = `
        font-size: 0.75em;
       	color: var(--log-timestamp-color);
        font-weight: 500;
        opacity: 0.8;
        display: flex;
        align-items: center;
        gap: 8px;
    `;

    const timeText = document.createElement('span');
    timeText.textContent = `[${new Date().toLocaleTimeString()}]`;

    const deltaText = document.createElement('span');
    deltaText.textContent = `+${delta.toFixed(2)}ms`;
    deltaText.style.cssText = `
        background: var(--console-hover-bg);
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 0.9em;
    `;

    const totalText = document.createElement('span');
    totalText.textContent = `${cumulativeTime.toFixed(2)}ms total`;
    totalText.style.opacity = '0.6';

    timeMeta.appendChild(timeText);
    timeMeta.appendChild(deltaText);
    timeMeta.appendChild(totalText);

    const logActions = document.createElement('div');
    logActions.className = 'log-actions';
    logActions.style.cssText = `
        display: flex;
        align-items: center;
        gap: 6px;
    `;

    const serializedEntry = items.map(serializeLogValue).join(' ');
    const copyBtn = createCopyButton(serializedEntry, 'Copy entry', '12px');
    logActions.appendChild(copyBtn);

    logHeader.appendChild(timeMeta);
    logHeader.appendChild(logActions);

    const messageSpan = document.createElement("div");
    messageSpan.className = "log-message";
    messageSpan.style.cssText = `
        margin-top: 2px;
        line-height: 1.4;
    `;

    items.forEach((item, index) => {
        if (typeof item === "string" && item.trim().startsWith("<table")) {
            const wrapper = document.createElement("div");
            wrapper.innerHTML = item;
            messageSpan.appendChild(wrapper.firstChild);
        } else if (Array.isArray(item) && item.length > 0 && areObjectsSimilar(item)) {
            messageSpan.appendChild(renderArrayOfObjects(item));
        } else {
            messageSpan.appendChild(renderValue(item));
            if (index < items.length - 1) {
                messageSpan.appendChild(document.createTextNode(" "));
            }
        }
    });

    logLine.appendChild(logHeader);
    logLine.appendChild(messageSpan);
    outputEl.appendChild(logLine);
    if (autoScrollEnabled) {
        outputEl.scrollTop = outputEl.scrollHeight;
    }
}

export function clearOutput(outputEl) {
    outputEl.innerHTML = "";
    cumulativeTime = 0;
}

export function setConsoleAutoScroll(enabled = true) {
    autoScrollEnabled = Boolean(enabled);
}

function serializeLogValue(value) {
    if (typeof value === 'string') return value;
    if (value instanceof Error) {
        return value.stack || value.message || value.toString();
    }
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
}

function areObjectsSimilar(arr) {
    if (arr.length === 0) return false;

    const allObjects = arr.every(item =>
        item !== null && typeof item === 'object' && !Array.isArray(item)
    );

    if (!allObjects) return false;

    const firstKeys = Object.keys(arr[0]);
    if (firstKeys.length === 0) return false;

    const commonKeyThreshold = Math.max(1, Math.floor(firstKeys.length * 0.5));

    return arr.every(item => {
        const itemKeys = Object.keys(item);
        const commonKeys = firstKeys.filter(key => itemKeys.includes(key));
        return commonKeys.length >= commonKeyThreshold;
    });
}

function renderArrayOfObjects(arr) {
    const container = document.createElement("div");
    container.className = "log-array-container";
    container.style.cssText = `
        border: 1px solid var(--log-table-border);
        border-radius: 6px;
        overflow: hidden;
        margin: 4px 0;
        background: var(--log-table-bg);
        transition: all 0.2s ease;
    `;

    const arrayHeader = document.createElement("details");
    arrayHeader.className = "log-array-header";
    arrayHeader.style.cssText = `
        background: var(--log-table-header-bg);
        border-bottom: 1px solid var(--log-table-border);
    `;

    const arraySummary = document.createElement("summary");
    arraySummary.className = "log-array-summary";
    arraySummary.style.cssText = `
        padding: 8px 12px;
        font-weight: 600;
        color: var(--log-table-header-text);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        user-select: none;
        outline: none;
        transition: background-color 0.2s ease;
    `;

    arraySummary.addEventListener('mouseenter', () => {
        arraySummary.style.background = 'var(--console-hover-bg)';
    });

    arraySummary.addEventListener('mouseleave', () => {
        arraySummary.style.background = 'transparent';
    });

    const headerText = document.createElement("span");
    headerText.textContent = `Array(${arr.length}) - Objects`;

    const copyArrayBtn = createCopyButton(arr, 'Copy entire array to clipboard', '11px');

    const expandHint = document.createElement("span");
    expandHint.className = "log-expand-hint";
    expandHint.style.cssText = `
        margin-left: auto;
        font-size: 0.8em;
        color: var(--log-expand-hint);
        font-weight: normal;
        opacity: 0.8;
    `;
    expandHint.textContent = "Click to expand";

    arraySummary.appendChild(headerText);
    arraySummary.appendChild(copyArrayBtn);
    arraySummary.appendChild(expandHint);

    const arrayContent = document.createElement("div");
    arrayContent.className = "log-array-content";
    arrayContent.style.cssText = `
        padding: 8px;
        background: var(--log-table-bg);
        max-height: 400px;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: var(--console-scrollbar-thumb) var(--console-scrollbar);
    `;

    arr.forEach((obj, index) => {
        const objectContainer = document.createElement("details");
        objectContainer.className = "log-object-item";
        objectContainer.style.cssText = `
            margin-bottom: 8px;
            border: 1px solid var(--log-table-border);
            border-radius: 4px;
            background: var(--console-bg);
            transition: all 0.2s ease;
        `;

        const objectSummary = document.createElement("summary");
        objectSummary.className = "log-object-summary";
        objectSummary.style.cssText = `
            padding: 6px 10px;
            font-weight: 500;
            color: var(--console-property-color);
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            user-select: none;
            outline: none;
            background: var(--log-table-header-bg);
            border-radius: 4px 4px 0 0;
            transition: background-color 0.2s ease;
        `;

        objectSummary.addEventListener('mouseenter', () => {
            objectSummary.style.background = 'var(--console-hover-bg)';
        });

        objectSummary.addEventListener('mouseleave', () => {
            objectSummary.style.background = 'var(--log-table-header-bg)';
        });

        const objectTitle = document.createElement("span");
        objectTitle.textContent = `Object ${index + 1}`;

        const copyObjectBtn = createCopyButton(obj, 'Copy object to clipboard', '11px');

        objectSummary.appendChild(objectTitle);
        objectSummary.appendChild(copyObjectBtn);

        const objectContent = document.createElement("div");
        objectContent.className = "log-object-content";
        objectContent.style.cssText = `
            padding: 8px 12px;
            background: var(--console-bg);
            border-top: 1px solid var(--log-table-border);
        `;

        Object.entries(obj).forEach(([key, value]) => {
            const propContainer = document.createElement("div");
            propContainer.className = "log-object-property";
            propContainer.style.cssText = `
                margin: 4px 0;
                display: flex;
                align-items: flex-start;
                gap: 8px;
                padding: 2px 4px;
                border-radius: 3px;
                transition: background-color 0.2s ease;
            `;

            propContainer.addEventListener('mouseenter', () => {
                propContainer.style.background = 'var(--console-hover-bg)';
            });

            propContainer.addEventListener('mouseleave', () => {
                propContainer.style.background = 'transparent';
            });

            const keySpan = document.createElement("span");
            keySpan.className = "log-property-key";
            keySpan.style.cssText = `
                color: var(--console-property-color);
                font-weight: 600;
                min-width: 80px;
                flex-shrink: 0;
            `;
            keySpan.textContent = `${key}:`;

            const valueElement = renderValue(value, 1);
            valueElement.style.flex = "1";

            propContainer.appendChild(keySpan);
            propContainer.appendChild(valueElement);
            objectContent.appendChild(propContainer);
        });

        objectContainer.appendChild(objectSummary);
        objectContainer.appendChild(objectContent);
        arrayContent.appendChild(objectContainer);
    });

    arrayHeader.appendChild(arraySummary);
    arrayHeader.appendChild(arrayContent);
    container.appendChild(arrayHeader);

    return container;
}
