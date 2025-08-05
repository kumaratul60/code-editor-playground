export function analyzeCode(code) {
    // Count functions (including arrow functions, function declarations, and methods)
    const functionCount = (code.match(/\bfunction\s+\w+\s*\(|\bconst\s+\w+\s*=\s*[^=]*=>|\b\w+\s*\([^)]*\)\s*=>/g) || []).length;

    // Count loops (for, while, do-while, for...in, for...of)
    const loopCount = (code.match(/\b(for|while|do\s*\{)/g) || []).length;

    // Count async operations (await, Promise, fetch, setTimeout, setInterval)
    const asyncCount = (code.match(/\b(await|Promise\.|fetch\s*\(|setTimeout\s*\(|setInterval\s*\()/g) || []).length;

    return {
        functions: functionCount,
        loops: loopCount,
        asyncOps: asyncCount
    };
}