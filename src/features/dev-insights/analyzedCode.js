export function analyzeCode(code) {
    if (!code || typeof code !== 'string') {
        return {
            functions: 0,
            loops: 0,
            asyncOps: 0,
            // Extended metrics for comprehensive analysis
            functionTypes: {
                regular: 0,
                arrow: 0,
                async: 0,
                methods: 0,
                constructors: 0,
                generators: 0,
                higherOrder: 0
            },
            loopTypes: {
                for: 0,
                while: 0,
                doWhile: 0,
                forIn: 0,
                forOf: 0,
                forEach: 0,
                functionalMethods: 0
            },
            asyncTypes: {
                asyncFunctions: 0,
                await: 0,
                promises: 0,
                fetch: 0,
                setTimeout: 0,
                callbacks: 0
            }
        };
    }

    // === COMPREHENSIVE FUNCTION DETECTION ===
    
    // Regular function declarations
    const regularFunctions = (code.match(/\bfunction\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(/g) || []).length;
    
    // Arrow functions (various forms)
    const arrowFunctions = (code.match(/(?:const|let|var)\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*=\s*(?:\([^)]*\)|[a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>/g) || []).length +
                          (code.match(/\(\s*[^)]*\s*\)\s*=>/g) || []).length +
                          (code.match(/[a-zA-Z_$][a-zA-Z0-9_$]*\s*=>/g) || []).length;
    
    // Async functions
    const asyncFunctions = (code.match(/\basync\s+function\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(/g) || []).length +
                          (code.match(/\basync\s*\([^)]*\)\s*=>/g) || []).length +
                          (code.match(/\basync\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*=>/g) || []).length;
    
    // Method definitions (in objects/classes)
    const methods = (code.match(/[a-zA-Z_$][a-zA-Z0-9_$]*\s*\([^)]*\)\s*\{/g) || []).length +
                   (code.match(/[a-zA-Z_$][a-zA-Z0-9_$]*:\s*function\s*\(/g) || []).length +
                   (code.match(/[a-zA-Z_$][a-zA-Z0-9_$]*:\s*(?:\([^)]*\)|[a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>/g) || []).length;
    
    // Constructor functions
    const constructors = (code.match(/\bfunction\s+[A-Z][a-zA-Z0-9_$]*\s*\(/g) || []).length +
                        (code.match(/\bclass\s+[A-Z][a-zA-Z0-9_$]*\s*(?:\{|extends)/g) || []).length;
    
    // Generator functions
    const generators = (code.match(/\bfunction\s*\*\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(/g) || []).length;
    
    // Higher-order functions (functions that return functions or take functions as parameters)
    const higherOrderFunctions = (code.match(/\bfunction\s+[a-zA-Z_$][a-zA-Z0-9_$]*[^{]*\{[^}]*return\s+function/g) || []).length +
                                (code.match(/=>\s*(?:\([^)]*\)\s*)?=>/g) || []).length +
                                (code.match(/\w+\s*=\s*(?:\([^)]*\)\s*)?=>\s*(?:\([^)]*\)\s*)?=>/g) || []).length;

    // === COMPREHENSIVE LOOP DETECTION ===
    
    // Traditional for loops
    const forLoops = (code.match(/\bfor\s*\([^)]*;[^)]*;[^)]*\)\s*\{/g) || []).length;
    
    // While loops
    const whileLoops = (code.match(/\bwhile\s*\([^)]*\)\s*\{/g) || []).length;
    
    // Do-while loops
    const doWhileLoops = (code.match(/\bdo\s*\{[\s\S]*?\}\s*while\s*\([^)]*\)/g) || []).length;
    
    // For-in loops
    const forInLoops = (code.match(/\bfor\s*\(\s*(?:let|const|var)\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s+in\s+[^)]+\)/g) || []).length;
    
    // For-of loops
    const forOfLoops = (code.match(/\bfor\s*\(\s*(?:let|const|var)\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s+of\s+[^)]+\)/g) || []).length;
    
    // forEach method calls
    const forEachCalls = (code.match(/\.forEach\s*\(/g) || []).length;
    
    // Functional programming methods (map, filter, reduce, etc.)
    const functionalMethods = (code.match(/\.(?:map|filter|reduce|reduceRight|find|findIndex|some|every|sort|reverse|flatMap|flat)\s*\(/g) || []).length;

    // === COMPREHENSIVE ASYNC DETECTION ===
    
    // Async function declarations (already counted above)
    const asyncFunctionDeclarations = asyncFunctions;
    
    // Await expressions
    const awaitExpressions = (code.match(/\bawait\s+/g) || []).length;
    
    // Promise usage
    const promiseUsage = (code.match(/\bnew\s+Promise\s*\(|Promise\.(?:all|race|resolve|reject|allSettled)/g) || []).length +
                        (code.match(/\.then\s*\(|\.catch\s*\(|\.finally\s*\(/g) || []).length;
    
    // Fetch API calls
    const fetchCalls = (code.match(/\bfetch\s*\(/g) || []).length;
    
    // setTimeout/setInterval
    const timerFunctions = (code.match(/\b(?:setTimeout|setInterval)\s*\(/g) || []).length;
    
    // Callback patterns (functions passed as arguments)
    const callbacks = (code.match(/\w+\s*\(\s*[^,)]*,\s*function\s*\(/g) || []).length +
                     (code.match(/\w+\s*\(\s*[^,)]*,\s*(?:\([^)]*\)|[a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>/g) || []).length;

    // === CALCULATE TOTALS ===
    const totalFunctions = regularFunctions + arrowFunctions + asyncFunctions + methods + constructors + generators;
    const totalLoops = forLoops + whileLoops + doWhileLoops + forInLoops + forOfLoops + forEachCalls + functionalMethods;
    const totalAsyncOps = asyncFunctionDeclarations + awaitExpressions + promiseUsage + fetchCalls + timerFunctions + callbacks;

    return {
        // Legacy compatibility
        functions: totalFunctions,
        loops: totalLoops,
        asyncOps: totalAsyncOps,
        
        // Detailed breakdown
        functionTypes: {
            regular: regularFunctions,
            arrow: arrowFunctions,
            async: asyncFunctions,
            methods: methods,
            constructors: constructors,
            generators: generators,
            higherOrder: higherOrderFunctions
        },
        loopTypes: {
            for: forLoops,
            while: whileLoops,
            doWhile: doWhileLoops,
            forIn: forInLoops,
            forOf: forOfLoops,
            forEach: forEachCalls,
            functionalMethods: functionalMethods
        },
        asyncTypes: {
            asyncFunctions: asyncFunctionDeclarations,
            await: awaitExpressions,
            promises: promiseUsage,
            fetch: fetchCalls,
            setTimeout: timerFunctions,
            callbacks: callbacks
        }
    };
}