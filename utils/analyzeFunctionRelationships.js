export function analyzeFunctionRelationships(code) {
    // Extract function names
    const functionNames = (code.match(/function\s+(\w+)/g) || [])
        .map(fn => fn.replace('function ', '').trim());

    // Find function calls
    const relationships = [];

    functionNames.forEach(fnName => {
        // Look for calls to this function in the code
        const regex = new RegExp(`\\b${fnName}\\s*\\(`, 'g');
        let match;
        let callCount = 0;

        while ((match = regex.exec(code)) !== null) {
            callCount++;
        }

        // Don't count the function definition itself
        callCount = Math.max(0, callCount - 1);

        relationships.push({
            name: fnName,
            callCount: callCount
        });
    });

    // Sort by call count
    relationships.sort((a, b) => b.callCount - a.callCount);

    // Identify the most called functions
    const mostCalledFunctions = relationships
        .filter(r => r.callCount > 0)
        .slice(0, 3)
        .map(r => `${r.name} (${r.callCount} calls)`);

    return {
        functionCount: functionNames.length,
        relationships: relationships,
        mostCalledFunctions: mostCalledFunctions,
        hasComplexRelationships: relationships.some(r => r.callCount > 3)
    };
}