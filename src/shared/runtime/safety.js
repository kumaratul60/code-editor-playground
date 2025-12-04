import { logOutput } from "./logging.js";

const dangerousPatterns = [
    { pattern: /while\s*\(\s*true\s*\)/g, name: "Infinite while loop" },
    { pattern: /for\s*\(\s*;\s*;\s*\)/g, name: "Infinite for loop" },
    { pattern: /eval\s*\(/g, name: "Nested eval call" },
    { pattern: /Function\s*\(/g, name: "Function constructor" },
];

export function sanitizeCode(code) {
    for (const { pattern } of dangerousPatterns) {
        if (pattern.test(code)) {
            throw new Error(`Potentially dangerous code detected: ${pattern.source}`);
        }
    }
    return code;
}

export function checkMemoryUsage() {
    if (performance.memory) {
        const used = performance.memory.usedJSHeapSize;
        const limit = performance.memory.jsHeapSizeLimit;
        if (used > limit * 0.9) {
            throw new Error(`Memory usage too high: ${Math.round(used / 1024 / 1024)}MB / ${Math.round(limit / 1024 / 1024)}MB`);
        }
    }
}

export function performSafetyChecks(code, output) {
    try {
        sanitizeCode(code);
    } catch (err) {
        logOutput([`❌ ${err.message}`], output, 0, "error");
        return false;
    }

    try {
        checkMemoryUsage();
    } catch (err) {
        logOutput([`❌ ${err.message}`], output, 0, "error");
        return false;
    }

    return true;
}
