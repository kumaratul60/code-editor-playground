import { ensureExecutionTracker } from "./executionTracker.js";

const DOM_MUTATION_METHODS = [
    { proto: Element.prototype, method: "appendChild", action: "append" },
    { proto: Element.prototype, method: "insertBefore", action: "insert" },
    { proto: Element.prototype, method: "removeChild", action: "remove" },
    { proto: Element.prototype, method: "replaceChild", action: "replace" },
    { proto: Element.prototype, method: "replaceChildren", action: "replaceChildren" }
];

const NODE_CONSTANTS = typeof Node !== "undefined" ? Node : { TEXT_NODE: 3, COMMENT_NODE: 8, ELEMENT_NODE: 1 };

export function instrumentRuntime() {
    const tracker = ensureExecutionTracker();
    if (!tracker) {
        return () => {};
    }

    const restorers = [];

    if (typeof window !== "undefined" && typeof window.fetch === "function") {
        const originalFetch = window.fetch;
        window.fetch = async function instrumentedFetch(...args) {
            const descriptor = describeRequest(args[0]);
            tracker.recordNetworkRequest("fetch", descriptor);
            try {
                const response = await originalFetch.apply(this, args);
                return response;
            } catch (error) {
                tracker.recordError(error);
                throw error;
            }
        };
        restorers.push(() => {
            window.fetch = originalFetch;
        });
    }

    if (typeof XMLHttpRequest !== "undefined") {
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;

        XMLHttpRequest.prototype.open = function(method, url, ...rest) {
            this.__trackerMeta = { method, url };
            return originalOpen.apply(this, [method, url, ...rest]);
        };

        XMLHttpRequest.prototype.send = function(...args) {
            const meta = this.__trackerMeta || {};
            tracker.recordNetworkRequest("xhr", `${meta.method || "GET"} ${meta.url || ""}`.trim());
            return originalSend.apply(this, args);
        };

        restorers.push(() => {
            XMLHttpRequest.prototype.open = originalOpen;
            XMLHttpRequest.prototype.send = originalSend;
        });
    }

    DOM_MUTATION_METHODS.forEach(({ proto, method, action }) => {
        if (!proto || typeof proto[method] !== "function") return;
        const original = proto[method];
        proto[method] = function instrumentedDomMutation(node, ...rest) {
            const detail = describeNode(node);
            const result = original.call(this, node, ...rest);
            tracker.recordDomMutation(action, detail);
            return result;
        };
        restorers.push(() => {
            proto[method] = original;
        });
    });

    if (typeof window !== "undefined") {
        const originalSetTimeout = window.setTimeout;
        const originalSetInterval = window.setInterval;
        const originalRequestAnimationFrame = window.requestAnimationFrame;

        window.setTimeout = function(handler, timeout, ...args) {
            tracker.recordAsync("timeout", `${timeout ?? 0}ms`);
            return originalSetTimeout(handler, timeout, ...args);
        };
        restorers.push(() => {
            window.setTimeout = originalSetTimeout;
        });

        window.setInterval = function(handler, timeout, ...args) {
            tracker.recordAsync("interval", `${timeout ?? 0}ms`);
            return originalSetInterval(handler, timeout, ...args);
        };
        restorers.push(() => {
            window.setInterval = originalSetInterval;
        });

        if (typeof originalRequestAnimationFrame === "function") {
            window.requestAnimationFrame = function(callback) {
                tracker.recordAsync("raf");
                return originalRequestAnimationFrame(callback);
            };
            restorers.push(() => {
                window.requestAnimationFrame = originalRequestAnimationFrame;
            });
        }
    }

    return () => {
        while (restorers.length) {
            const restore = restorers.pop();
            try {
                restore();
            } catch {
                // ignore restore failures
            }
        }
    };
}

function describeRequest(input) {
    if (typeof input === "string") {
        return input;
    }

    if (input && typeof input === "object" && "url" in input) {
        return input.url;
    }

    return "unknown";
}

function describeNode(node) {
    if (!node) return "unknown";
    if (node.nodeType === NODE_CONSTANTS.TEXT_NODE) {
        return `text:${node.textContent?.slice(0, 20) || ""}`;
    }
    if (node.nodeType === NODE_CONSTANTS.COMMENT_NODE) {
        return "comment";
    }
    if (node.nodeType === NODE_CONSTANTS.ELEMENT_NODE) {
        return node.tagName.toLowerCase();
    }
    return `node:${node.nodeType}`;
}
