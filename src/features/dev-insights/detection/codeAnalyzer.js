import {
    detectFunctionPatterns,
    detectLoopPatterns,
    detectAsyncPatterns,
    detectDOMPatterns,
    detectCodeSmells,
    detectPerformanceAntiPatterns,
    analyzeSecurityIssues,
    detectMemoryLeaks
} from "./patternDetectors.js";
import { generateUnifiedExecutionSteps } from "./stepsGenerator.js";

function calculateQualityScore(complexity, loc, smells) {
    let score = 100;

    score -= Math.min(30, complexity * 2);

    if (loc.code > 300) score -= 20;
    else if (loc.code > 100) score -= 10;

    score -= Math.min(20, smells.longMethods * 5);
    score -= Math.min(20, smells.deepNesting * 5);
    score -= Math.min(10, Math.floor(smells.magicNumbers / 5));

    return Math.max(0, Math.round(score));
}

export function analyzeCodePatterns(codeText) {
    if (typeof codeText !== 'string' || !codeText.trim()) {
        return {
            error: 'Invalid or empty code provided',
            timestamp: new Date().toISOString()
        };
    }

    try {
        const functions = detectFunctionPatterns(codeText) || { total: 0 };
        const loops = detectLoopPatterns(codeText) || { total: 0 };
        const asyncPatterns = detectAsyncPatterns(codeText) || { total: 0 };
        const domPatterns = detectDOMPatterns(codeText) || { total: 0 };

        const codeSmells = detectCodeSmells(codeText) || { total: 0 };
        const performanceIssues = detectPerformanceAntiPatterns(codeText) || { total: 0 };
        const securityAnalysis = analyzeSecurityIssues(codeText) || { issues: { total: 0 } };
        const memoryLeaks = detectMemoryLeaks(codeText) || { total: 0 };

        const loc = {
            total: codeText.split('\n').length,
            code: codeText.split('\n').filter(line =>
                line.trim() !== '' && !line.trim().startsWith('//')
            ).length,
            comments: (codeText.match(/\/\/.*|\/\*[\s\S]*?\*\//g) || []).length
        };

        const complexity = Math.min(100, Math.max(1,
            ((functions?.total || 0) * 0.5) +
            ((loops?.total || 0) * 0.3) +
            ((asyncPatterns?.total || 0) * 0.4) +
            ((domPatterns?.total || 0) * 0.2) +
            ((codeSmells?.total || 0) * 0.7)
        ));

        const executionSteps = generateUnifiedExecutionSteps(
            codeText,
            {},
            performance.now()
        );

        const qualityScore = calculateQualityScore(complexity, loc, codeSmells) || 0;

        return {
            functions: {
                total: functions?.total || 0,
                regular: functions?.regular || 0,
                arrow: functions?.arrow || 0,
                async: functions?.async || 0,
                method: functions?.method || 0,
                constructor: functions?.constructor || 0,
                generator: functions?.generator || 0,
                higherOrder: functions?.higherOrder || 0,
                closures: (codeText.match(/\(function\s*\(|\bfunction\s*[^(]*\([^)]*\)\s*\{[^}]*\}\s*\(/g) || []).length
            },
            loops: loops || { total: 0 },
            asyncPatterns: asyncPatterns || { total: 0 },
            domPatterns: domPatterns || { total: 0 },
            codeSmells,
            performanceIssues,
            securityAnalysis,
            memoryLeaks,
            loc,
            complexity,
            executionSteps,
            qualityScore,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Pattern analysis failed:', error);
        return {
            error: 'Pattern analysis failed',
            details: error.message,
            timestamp: new Date().toISOString()
        };
    }
}
