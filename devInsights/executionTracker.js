class ExecutionTracker {
    constructor() {
        this.metrics = {
            peakMemory: 0,
            gcCollections: 0,
            domManipulations: 0,
            networkRequests: 0,
            cacheHits: 0,
            errorCount: 0
        };
        this.setupTracking();
    }

    setupTracking() {
        // Track DOM manipulations
        this.trackDOMChanges();

        // Track network requests
        this.trackNetworkRequests();

        // Track errors
        this.trackErrors();
    }

    trackDOMChanges() {
        const self = this;
        const originalMethods = {
            appendChild: Element.prototype.appendChild,
            removeChild: Element.prototype.removeChild,
            insertBefore: Element.prototype.insertBefore
        };

        Element.prototype.appendChild = function(...args) {
            if (window.executionTracker && window.executionTracker.metrics) {
                window.executionTracker.metrics.domManipulations++;
            }
            return originalMethods.appendChild.apply(this, args);
        };

        Element.prototype.removeChild = function(...args) {
            if (window.executionTracker && window.executionTracker.metrics) {
                window.executionTracker.metrics.domManipulations++;
            }
            return originalMethods.removeChild.apply(this, args);
        };

        Element.prototype.insertBefore = function(...args) {
            if (window.executionTracker && window.executionTracker.metrics) {
                window.executionTracker.metrics.domManipulations++;
            }
            return originalMethods.insertBefore.apply(this, args);
        };

        // Track innerHTML changes
        const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
        if (originalInnerHTML) {
            Object.defineProperty(Element.prototype, 'innerHTML', {
                get: originalInnerHTML.get,
                set: function(value) {
                    if (window.executionTracker && window.executionTracker.metrics) {
                        window.executionTracker.metrics.domManipulations++;
                    }
                    return originalInnerHTML.set.call(this, value);
                }
            });
        }
    }

    trackNetworkRequests() {
        const self = this;
        const originalFetch = window.fetch;

        window.fetch = function(...args) {
            if (self.metrics) {
                self.metrics.networkRequests++;
            }
            return originalFetch.apply(window, args);
        };

        // Track XMLHttpRequest
        const originalXHROpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(...args) {
            if (self.metrics) {
                self.metrics.networkRequests++;
            }
            return originalXHROpen.apply(this, args);
        };
    }

    trackErrors() {
        const self = this;
        const originalErrorHandler = window.onerror;

        window.onerror = function(message, source, lineno, colno, error) {
            if (self.metrics) {
                self.metrics.errorCount++;
            }
            if (originalErrorHandler) {
                return originalErrorHandler.apply(window, arguments);
            }
        };

        // Track unhandled promise rejections
        window.addEventListener('unhandledrejection', function(event) {
            if (self.metrics) {
                self.metrics.errorCount++;
            }
        });
    }

    updatePeakMemory() {
        if (performance && performance.memory) {
            const currentMemory = performance.memory.usedJSHeapSize;
            this.metrics.peakMemory = Math.max(this.metrics.peakMemory, currentMemory);
        }
    }

    reset() {
        this.metrics = {
            peakMemory: 0,
            gcCollections: 0,
            domManipulations: 0,
            networkRequests: 0,
            cacheHits: 0,
            errorCount: 0
        };
    }

    getMetrics() {
        this.updatePeakMemory();
        return { ...this.metrics };
    }
}

export const executionTracker = new ExecutionTracker();

// Make it globally available
if (typeof window !== 'undefined') {
    window.executionTracker = executionTracker;
}