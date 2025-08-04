

/**
 * Renders a JavaScript value into a DOM element with appropriate formatting.
 */
export function renderValue(val) {
    const type = typeof val;

    if (val && type === "object") {
        const details = document.createElement("details");
        const summary = document.createElement("summary");
        summary.textContent = Array.isArray(val) ? `Array(${val.length})` : "Object";
        summary.style.cursor = "pointer";
        summary.style.color = "#0ff";

        const pre = document.createElement("pre");
        pre.textContent = JSON.stringify(val, null, 2);
        pre.style.cssText = "white-space: pre-wrap; margin-top: 4px; color: #ccc;";

        details.appendChild(summary);
        details.appendChild(pre);
        return details;
    }

    // Primitives
    const span = document.createElement("span");
    span.textContent = formatValue(val);
    span.style.color = getTypeColor(type);
    return span;
}

/**
 * Formats a primitive value for display.
 */
 function formatValue(val) {
    if (typeof val === "string") return `"${val}"`;
    try {
        return JSON.stringify(val);
    } catch {
        return String(val);
    }
}

/**
 * Returns a color based on the JavaScript data type.
 */
 function getTypeColor(type) {
    const colors = {
        number: "#f9c74f",
        string: "#90be6d",
        boolean: "#f94144",
        undefined: "#ccc",
        function: "#577590",
        object: "#00b4d8",
        default: "#fff",
    };
    return colors[type] || colors.default;
}
