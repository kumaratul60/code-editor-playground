/**
 * Tracking Utilities for JavaScript Playground
 * Simplified interface for analytics tracking throughout the application
 */

// Check if analytics is available
function isAnalyticsAvailable() {
    return typeof window !== 'undefined' && window.playgroundAnalytics;
}

// Safe analytics call wrapper
function safeTrack(trackingFunction) {
    if (isAnalyticsAvailable()) {
        try {
            trackingFunction(window.playgroundAnalytics);
        } catch (error) {
            console.warn('Analytics tracking error:', error);
        }
    }
}

// ===== EDITOR TRACKING =====

/**
 * Track code editing actions
 * @param {string} action - Type of edit action ('type', 'paste', 'delete', 'format')
 * @param {Object} details - Additional details about the edit
 */
export function trackCodeEdit(action, details = {}) {
    safeTrack(analytics => {
        analytics.trackCodeEdit(action, {
            timestamp: Date.now(),
            ...details
        });
    });
}

/**
 * Track code execution
 * @param {string} code - The code being executed
 * @param {number} executionTime - Time taken to execute
 * @param {boolean} hasErrors - Whether execution had errors
 * @param {Object} additionalData - Additional execution data
 */
export function trackCodeExecution(code, executionTime, hasErrors = false, additionalData = {}) {
    safeTrack(analytics => {
        analytics.trackCodeExecution(code, executionTime, hasErrors);

        // Track additional performance metrics
        analytics.trackFeatureUsage('code_execution', {
            code_length: code.length,
            lines_count: code.split('\n').length,
            execution_time: executionTime,
            success: !hasErrors,
            ...additionalData
        });

        analytics.trackPerformance('code_execution_time', executionTime, 'ms');
    });
}

// ===== FEATURE TRACKING =====

/**
 * Track feature usage
 * @param {string} featureName - Name of the feature
 * @param {Object} details - Additional feature details
 */
export function trackFeatureUsage(featureName, details = {}) {
    safeTrack(analytics => {
        analytics.trackFeatureUsage(featureName, {
            timestamp: Date.now(),
            ...details
        });
    });
}

/**
 * Track theme toggle
 * @param {string} fromTheme - Previous theme
 * @param {string} toTheme - New theme
 */
export function trackThemeToggle(fromTheme, toTheme) {
    trackFeatureUsage('theme_toggle', {
        from_theme: fromTheme,
        to_theme: toTheme
    });
}

/**
 * Track code copy action
 * @param {number} codeLength - Length of copied code
 * @param {number} linesCount - Number of lines copied
 */
export function trackCodeCopy(codeLength, linesCount) {
    trackFeatureUsage('code_copy', {
        code_length: codeLength,
        lines_count: linesCount
    });
}

/**
 * Track code clear action
 * @param {number} clearedCodeLength - Length of code that was cleared
 */
export function trackCodeClear(clearedCodeLength) {
    trackFeatureUsage('code_clear', {
        cleared_code_length: clearedCodeLength
    });
}

/**
 * Track DevInsights panel usage
 */
export function trackDevInsightsUsage() {
    trackFeatureUsage('dev_insights');
}

// ===== USER ENGAGEMENT TRACKING =====

/**
 * Track user engagement
 * @param {string} engagementType - Type of engagement ('active_typing', 'idle', 'focused', 'scrolling')
 * @param {number} duration - Duration of engagement (optional)
 */
export function trackUserEngagement(engagementType, duration = null) {
    safeTrack(analytics => {
        analytics.trackUserEngagement(engagementType, duration);
    });
}

/**
 * Track active typing
 */
export function trackActiveTyping() {
    trackUserEngagement('active_typing');
}

/**
 * Track user idle state
 * @param {number} idleDuration - How long user has been idle
 */
export function trackUserIdle(idleDuration = 30000) {
    trackUserEngagement('idle', idleDuration);
}

// ===== ERROR TRACKING =====

/**
 * Track errors
 * @param {string} errorType - Type of error
 * @param {Object} errorDetails - Error details
 */
export function trackError(errorType, errorDetails = {}) {
    safeTrack(analytics => {
        analytics.trackError(errorType, {
            timestamp: Date.now(),
            ...errorDetails
        });
    });
}

/**
 * Track console errors
 * @param {Array} args - Console error arguments
 */
export function trackConsoleError(args) {
    trackError('console_error', {
        error_args: args.map(arg => String(arg)).join(' ')
    });
}

/**
 * Track console warnings
 * @param {Array} args - Console warning arguments
 */
export function trackConsoleWarning(args) {
    trackError('console_warning', {
        warning_args: args.map(arg => String(arg)).join(' ')
    });
}

/**
 * Track code execution errors
 * @param {Error} error - The error object
 * @param {string} code - The code that caused the error
 * @param {number} executionTime - Time taken before error
 */
export function trackCodeExecutionError(error, code, executionTime) {
    trackError('code_execution_error', {
        error_message: error.message,
        error_stack: error.stack,
        code_length: code.length,
        lines_count: code.split('\n').length,
        execution_time: executionTime
    });
}

// ===== PERFORMANCE TRACKING =====

/**
 * Track performance metrics
 * @param {string} metricName - Name of the metric
 * @param {number} value - Metric value
 * @param {string} unit - Unit of measurement (default: 'ms')
 */
export function trackPerformance(metricName, value, unit = 'ms') {
    safeTrack(analytics => {
        analytics.trackPerformance(metricName, value, unit);
    });
}

// ===== INITIALIZATION TRACKING =====

/**
 * Track editor initialization
 * @param {Array} features - Available features
 */
export function trackEditorInitialized(features = []) {
    safeTrack(analytics => {
        analytics.trackEvent('editor_initialized', {
            timestamp: Date.now(),
            features_available: features,
            user_agent: navigator.userAgent,
            screen_resolution: `${screen.width}x${screen.height}`,
            viewport: `${window.innerWidth}x${window.innerHeight}`
        });
    });
}

// ===== CUSTOM EVENT TRACKING =====

/**
 * Track custom events
 * @param {string} eventName - Name of the event
 * @param {Object} properties - Event properties
 */
export function trackCustomEvent(eventName, properties = {}) {
    safeTrack(analytics => {
        analytics.trackEvent(eventName, {
            timestamp: Date.now(),
            ...properties
        });
    });
}

// ===== UTILITY FUNCTIONS =====

/**
 * Get current editor content metrics
 * @param {HTMLElement} editor - Editor element
 * @returns {Object} Content metrics
 */
export function getEditorMetrics(editor) {
    const content = editor.textContent || '';
    return {
        content_length: content.length,
        lines_count: content.split('\n').length,
        words_count: content.trim() ? content.trim().split(/\s+/).length : 0,
        characters_count: content.length,
        non_whitespace_count: content.replace(/\s/g, '').length
    };
}

/**
 * Create a debounced tracking function
 * @param {Function} trackingFunction - Function to debounce
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounceTracking(trackingFunction, delay = 300) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => trackingFunction.apply(this, args), delay);
    };
}

// ===== BATCH TRACKING =====

/**
 * Track multiple events at once
 * @param {Array} events - Array of event objects {type, data}
 */
export function trackBatchEvents(events) {
    events.forEach(event => {
        switch(event.type) {
            case 'code_edit':
                trackCodeEdit(event.action, event.data);
                break;
            case 'feature_usage':
                trackFeatureUsage(event.feature, event.data);
                break;
            case 'error':
                trackError(event.errorType, event.data);
                break;
            case 'performance':
                trackPerformance(event.metric, event.value, event.unit);
                break;
            case 'custom':
                trackCustomEvent(event.name, event.data);
                break;
            default:
                console.warn('Unknown tracking event type:', event.type);
        }
    });
}

// ===== DEBUG UTILITIES =====

/**
 * Get analytics debug information
 * @returns {Object} Debug information
 */
export function getAnalyticsDebugInfo() {
    if (isAnalyticsAvailable()) {
        return window.playgroundAnalytics.getAnalyticsData();
    }
    return { error: 'Analytics not available' };
}

/**
 * Log analytics debug information to console
 */
export function logAnalyticsDebug() {
    console.log('📊 Analytics Debug Info:', getAnalyticsDebugInfo());
}