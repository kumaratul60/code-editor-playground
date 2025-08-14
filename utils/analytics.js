/**
 * Analytics Utility for JavaScript Playground
 * Tracks user interactions, code execution, and editor usage patterns
 */

class PlaygroundAnalytics {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
        this.events = [];
        this.userMetrics = {
            codeExecutions: 0,
            totalLinesWritten: 0,
            errorsEncountered: 0,
            featuresUsed: new Set(),
            timeSpent: 0,
            devInsightsViews: 0,
            themeChanges: 0,
            codeClears: 0,
            codeCopies: 0
        };

        this.init();
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    init() {
        // Track page load
        this.trackEvent('page_load', {
            timestamp: Date.now(),
            user_agent: navigator.userAgent,
            screen_resolution: `${screen.width}x${screen.height}`,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            session_id: this.sessionId
        });

        // Track page visibility changes
        document.addEventListener('visibilitychange', () => {
            this.trackEvent('visibility_change', {
                hidden: document.hidden,
                timestamp: Date.now()
            });
        });

        // Track page unload
        window.addEventListener('beforeunload', () => {
            this.trackSessionEnd();
        });

        // Track errors
        window.addEventListener('error', (event) => {
            this.trackError('javascript_error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });
    }

    // Core tracking method
    trackEvent(eventName, properties = {}) {
        const event = {
            event: eventName,
            timestamp: Date.now(),
            session_id: this.sessionId,
            ...properties
        };

        this.events.push(event);

        // Send to Google Analytics if available
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                custom_parameter_1: 'editor_usage',
                session_id: this.sessionId,
                ...properties
            });
        }

        // Send to custom analytics endpoint (if you have one)
        this.sendToCustomAnalytics(event);
    }

    // Editor-specific tracking methods
    trackCodeExecution(codeLength, executionTime, hasErrors = false) {
        this.userMetrics.codeExecutions++;
        if (hasErrors) this.userMetrics.errorsEncountered++;

        this.trackEvent('code_execution', {
            code_length: codeLength,
            execution_time: executionTime,
            has_errors: hasErrors,
            total_executions: this.userMetrics.codeExecutions,
            lines_of_code: codeLength ? codeLength.split('\n').length : 0
        });
    }

    trackCodeEdit(action, details = {}) {
        this.trackEvent('code_edit', {
            action: action, // 'type', 'paste', 'delete', 'format'
            timestamp: Date.now(),
            ...details
        });

        if (action === 'paste' && details.lines_added) {
            this.userMetrics.totalLinesWritten += details.lines_added;
        }
    }

    trackFeatureUsage(featureName, details = {}) {
        this.userMetrics.featuresUsed.add(featureName);

        // Track specific feature metrics
        switch(featureName) {
            case 'dev_insights':
                this.userMetrics.devInsightsViews++;
                break;
            case 'theme_toggle':
                this.userMetrics.themeChanges++;
                break;
            case 'code_clear':
                this.userMetrics.codeClears++;
                break;
            case 'code_copy':
                this.userMetrics.codeCopies++;
                break;
        }

        this.trackEvent('feature_usage', {
            feature: featureName,
            usage_count: this.getFeatureUsageCount(featureName),
            ...details
        });
    }

    trackError(errorType, errorDetails) {
        this.userMetrics.errorsEncountered++;

        this.trackEvent('error_occurred', {
            error_type: errorType,
            error_details: errorDetails,
            total_errors: this.userMetrics.errorsEncountered
        });
    }

    trackPerformance(metricName, value, unit = 'ms') {
        this.trackEvent('performance_metric', {
            metric_name: metricName,
            value: value,
            unit: unit,
            timestamp: Date.now()
        });
    }

    trackUserEngagement(engagementType, duration = null) {
        this.trackEvent('user_engagement', {
            engagement_type: engagementType, // 'active_typing', 'idle', 'focused', 'scrolling'
            duration: duration,
            session_duration: Date.now() - this.startTime
        });
    }

    // Helper methods
    getFeatureUsageCount(featureName) {
        return this.events.filter(event =>
            event.event === 'feature_usage' && event.feature === featureName
        ).length;
    }

    getSessionMetrics() {
        return {
            ...this.userMetrics,
            session_duration: Date.now() - this.startTime,
            events_count: this.events.length,
            features_used_count: this.userMetrics.featuresUsed.size,
            session_id: this.sessionId
        };
    }

    trackSessionEnd() {
        const sessionMetrics = this.getSessionMetrics();

        this.trackEvent('session_end', {
            session_duration: sessionMetrics.session_duration,
            total_events: sessionMetrics.events_count,
            code_executions: sessionMetrics.codeExecutions,
            errors_encountered: sessionMetrics.errorsEncountered,
            features_used: Array.from(this.userMetrics.featuresUsed),
            lines_written: sessionMetrics.totalLinesWritten
        });

        // Send final batch to analytics
        this.flushEvents();
    }

    // Send events to custom analytics endpoint
    async sendToCustomAnalytics(event) {
        // Uncomment and modify this if you have a custom analytics endpoint
        /*
        try {
            await fetch('/api/analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(event)
            });
        } catch (error) {
            console.warn('Failed to send analytics event:', error);
        }
        */
    }

    // Batch send events (useful for custom analytics)
    async flushEvents() {
        if (this.events.length === 0) return;

        // Send to custom endpoint in batches
        /*
        try {
            await fetch('/api/analytics/batch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    events: this.events,
                    session_metrics: this.getSessionMetrics()
                })
            });
            this.events = []; // Clear events after successful send
        } catch (error) {
            console.warn('Failed to flush analytics events:', error);
        }
        */
    }

    // Privacy-friendly analytics (no personal data)
    enablePrivacyMode() {
        // Override tracking to exclude potentially sensitive data
        const originalTrackEvent = this.trackEvent;
        this.trackEvent = (eventName, properties = {}) => {
            // Filter out potentially sensitive properties
            const filteredProperties = Object.keys(properties).reduce((acc, key) => {
                if (!['user_agent', 'ip_address', 'email'].includes(key)) {
                    acc[key] = properties[key];
                }
                return acc;
            }, {});

            originalTrackEvent.call(this, eventName, filteredProperties);
        };
    }

    // Debug method to view collected analytics
    getAnalyticsData() {
        return {
            events: this.events,
            metrics: this.getSessionMetrics(),
            session_id: this.sessionId
        };
    }
}

// Initialize global analytics instance
window.playgroundAnalytics = new PlaygroundAnalytics();

// Export for module usage
export default PlaygroundAnalytics;