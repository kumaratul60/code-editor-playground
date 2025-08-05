export function estimateBigOComplexity(code) {
    // Better loop detection patterns
    const forLoops = (code.match(/\bfor\s*\(/g) || []).length;
    const whileLoops = (code.match(/\bwhile\s*\(/g) || []).length;
    const doWhileLoops = (code.match(/\bdo\s*\{/g) || []).length;
    const forInLoops = (code.match(/\bfor\s*\([^)]*\bin\b/g) || []).length;
    const forOfLoops = (code.match(/\bfor\s*\([^)]*\bof\b/g) || []).length;
    const forEachCalls = (code.match(/\.forEach\s*\(/g) || []).length;
    const arrayMethods = (code.match(/\.(map|filter|reduce|find|some|every)\s*\(/g) || []).length;

    const totalLoops = forLoops + whileLoops + doWhileLoops + forInLoops + forOfLoops + forEachCalls + arrayMethods;

    // Estimate nesting depth by analyzing brace levels
    const maxLoopDepth = estimateLoopNesting(code);

    // Better array/object detection
    const arrayCreations = (code.match(/\[[^\]]*\]|new\s+Array\s*\(|Array\.from\s*\(/g) || []).length;
    const objectCreations = (code.match(/\{[^}]*\}(?!\s*=>)/g) || []).filter(obj =>
        !/(function|class|if|for|while|switch)/.test(obj)
    ).length;
    const setCount = (code.match(/new\s+Set\s*\(/g) || []).length;
    const mapCount = (code.match(/new\s+Map\s*\(/g) || []).length;

    // Special operations
    const sortOperations = (code.match(/\.sort\s*\(/g) || []).length;
    const binarySearchPatterns = (code.match(/binary|bsearch|Math\.log/g) || []).length;

    // More accurate time complexity estimation
    let time = 'O(1)';
    if (maxLoopDepth === 1) {
        time = 'O(n)';
    } else if (maxLoopDepth === 2) {
        time = 'O(n²)';
    } else if (maxLoopDepth >= 3) {
        time = 'O(n³)'
    } else if (maxLoopDepth >= 4) {
        time = '>O(n³)';
    }

    // for sorting operations
    if (sortOperations > 0) {
        time = maxLoopDepth > 0 ? `${time} + O(n log n)` : 'O(n log n)';
    }

    // for binary search patterns
    if (binarySearchPatterns > 0) {
        time = maxLoopDepth > 0 ? `${time} + O(log n)` : 'O(log n)';
    }


    // Check for recursive patterns
    const functionRecursion = (code.match(/function\s+(\w+)[^}]*\1\s*\(/g) || []).length;
    const arrowRecursion = (code.match(/const\s+(\w+)\s*=[^}]*\1\s*\(/g) || []).length;
    const recursivePatterns = functionRecursion + arrowRecursion;

    if (recursivePatterns > 0) {
        time = maxLoopDepth > 0 ? `${time} + Recursive` : 'O(log n) - O(n)';
    }



    // More nuanced space complexity
    const dynamicStructures = arrayCreations + objectCreations + setCount + mapCount;
    let space = 'O(1)';
    if (dynamicStructures > 0 || recursivePatterns > 0) {
        space = 'O(n)';
    }
    if (maxLoopDepth >= 2 && dynamicStructures > 0) {
        space = 'O(n²)';
    }

    return {
        time,
        space,
        maxLoopDepth,
        totalLoops,
        arrayCount: arrayCreations,
        objectCount: objectCreations,
        setCount,
        mapCount,
        recursivePatterns,
        sortOperations,
        binarySearchPatterns
    };
}

function estimateLoopNesting(code) {
    const lines = code.split('\n');
    let maxDepth = 0;
    let currentDepth = 0;
    let braceLevel = 0;

    for (let line of lines) {
        // Count opening braces
        const openBraces = (line.match(/\{/g) || []).length;
        const closeBraces = (line.match(/\}/g) || []).length;

        // Check if line contains loop keywords
        const hasLoop = /\b(for|while|do)\b/.test(line) || /\.forEach\s*\(/.test(line);

        if (hasLoop) {
            currentDepth++;
            maxDepth = Math.max(maxDepth, currentDepth);
        }

        braceLevel += openBraces - closeBraces;

        // Reset depth when we exit scope levels
        if (braceLevel === 0) {
            currentDepth = 0;
        }
    }

    return maxDepth;
}