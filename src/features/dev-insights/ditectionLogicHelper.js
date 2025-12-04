import {
    detectFunctionPatterns,
    detectLoopPatterns,
    detectAsyncPatterns,
    detectDOMPatterns,
    detectCodeSmells,
    detectPerformanceAntiPatterns,
    analyzeSecurityIssues,
    detectMemoryLeaks,
    detectModulePatterns,
    detectVariablePatterns,
    detectErrorPatterns,
    analyzeCodeComplexity,
    analyzePerformanceIssues
} from './detection/patternDetectors.js';
import { getStepStatusColor, generateUnifiedExecutionSteps, setupEventListeners } from './detection/stepsGenerator.js';
import { getComplexityClass, getComplexityPercentage, getPerformanceClass } from './detection/complexityUtils.js';
import { analyzeCodePatterns } from './detection/codeAnalyzer.js';

export {
    detectFunctionPatterns,
    detectLoopPatterns,
    detectAsyncPatterns,
    detectDOMPatterns,
    detectCodeSmells,
    detectPerformanceAntiPatterns,
    analyzeSecurityIssues,
    detectMemoryLeaks,
    detectModulePatterns,
    detectVariablePatterns,
    detectErrorPatterns,
    analyzeCodeComplexity,
    analyzePerformanceIssues,
    getStepStatusColor,
    generateUnifiedExecutionSteps,
    setupEventListeners,
    getComplexityClass,
    getComplexityPercentage,
    getPerformanceClass,
    analyzeCodePatterns
};

export default {
    generateUnifiedExecutionSteps,
    getStepStatusColor,
    getComplexityClass,
    getComplexityPercentage,
    getPerformanceClass,
    setupEventListeners,
    analyzeCodePatterns
};
