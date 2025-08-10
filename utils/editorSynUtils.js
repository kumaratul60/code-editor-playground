export default class EditorSyncEnhancer {
    constructor(editor, deps = {}) {
        if (!editor) throw new Error('Editor element required');

        // Core elements
        this.editor = editor;
        this.highlighted = deps.highlightedEl || null;
        this.lineNumbers = deps.lineNumbersEl || null;

        // Injected utilities (required)
        this.updateLineNumbers = deps.updateLineNumbers;
        this.highlightEditorSyntax = deps.highlightEditorSyntax;
        this.syncScrollPosition = deps.syncScrollPosition;
        this.scrollToCursor = deps.scrollToCursor;
        this.syncLineNumbersUtil = deps.syncLineNumbers;
        this.debounceUtils = deps.debounceUtils;

        // Config
        const cfg = deps.config || {};
        this.syncThrottle = cfg.syncThrottle ?? 16; // ms between batches (approx 60fps)
        this.maxFrameBudget = cfg.maxFrameBudget ?? 8; // ms budget per RAF frame
        this.scrollThrottle = cfg.scrollThrottle ?? 40; // ms
        this.selectionMaxRatio = cfg.selectionMaxRatio ?? 0.8;

        // Internal state
        this.syncQueue = [];
        this.isProcessing = false;
        this.rafId = null;
        this.lastSyncTime = 0;
        this._isDestroyed = false;
        this._isPaused = false;

        // Performance monitor
        this.perfMonitor = {
            syncTimes: [],
            avgSyncTime: 0,
            maxSyncTime: 0,
            record(time) {
                this.syncTimes.push(time);
                if (this.syncTimes.length > 100) this.syncTimes.shift();
                this.avgSyncTime = this.syncTimes.reduce((a, b) => a + b, 0) / this.syncTimes.length;
                this.maxSyncTime = Math.max(this.maxSyncTime || 0, time);
            }
        };

        // Debounced processor (if debounceUtils available)
        if (this.debounceUtils) {
            this.debouncedProcess = this.debounceUtils(() => this.processSyncQueue(), 10);
        } else {
            this.debouncedProcess = () => this.processSyncQueue();
        }

        // Bound handlers so we can remove them later
        this._bound = {
            onInput: this.handleInput.bind(this),
            onScroll: this.handleScroll.bind(this),
            onSelectionChange: this.handleSelectionChange.bind(this),
            onFocus: this.handleFocus.bind(this),
            onBlur: this.handleBlur.bind(this)
        };

        // Mutation observer placeholder
        this.observer = null;
    }

    // Initialize observers and event listeners (idempotent)
    init() {
        if (this._initialized || this._isDestroyed) return;
        this._initialized = true;

        this.setupMutationObserver();
        this.addEventListeners();
    }

    //--------------------
    // Observers & Events
    //--------------------
    setupMutationObserver() {
        if (typeof MutationObserver === 'undefined') return;

        this.observer = new MutationObserver(mutations => {
            let needsSync = false;
            for (const m of mutations) {
                if (m.type === 'childList' || m.type === 'characterData') {
                    needsSync = true;
                    break;
                }
            }
            if (needsSync) this.queueSync({ type: 'content', priority: 'normal' });
        });

        this.observer.observe(this.editor, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }

    addEventListeners() {
        // Input
        this.editor.addEventListener('input', this._bound.onInput, { passive: true });

        // Scroll (throttled)
        this._throttledScroll = this._throttle(fn => fn(), this.scrollThrottle);
        this.editor.addEventListener('scroll', (e) => this._throttledScroll(() => this._bound.onScroll(e)), { passive: true });

        // Selection changes
        document.addEventListener('selectionchange', this._bound.onSelectionChange, { passive: true });

        // Focus/blur
        this.editor.addEventListener('focus', this._bound.onFocus);
        this.editor.addEventListener('blur', this._bound.onBlur);
    }

    removeEventListeners() {
        try {
            this.editor.removeEventListener('input', this._bound.onInput, { passive: true });
        } catch (e) {
            // Some browsers ignore options when removing; remove without options as fallback
            this.editor.removeEventListener('input', this._bound.onInput);
        }

        // We cannot reliably remove the scroll anonymous handler used above; to make it removable
        // we'd need to create a named function reference. For robustness, we attach the throttled
        // handler as a property and remove it here if present.
        if (this._throttledScroll && this._throttledScroll._handler) {
            this.editor.removeEventListener('scroll', this._throttledScroll._handler);
        }

        document.removeEventListener('selectionchange', this._bound.onSelectionChange);
        this.editor.removeEventListener('focus', this._bound.onFocus);
        this.editor.removeEventListener('blur', this._bound.onBlur);
    }

    //--------------------
    // Queueing & Processing
    //--------------------
    queueSync(item = { type: 'content', priority: 'normal' }) {
        if (this._isDestroyed || this._isPaused) return;

        const syncItem = Object.assign({ timestamp: performance.now() }, item);
        if (syncItem.priority === 'high') this.syncQueue.unshift(syncItem);
        else this.syncQueue.push(syncItem);

        // Debounced kick-off
        this.debouncedProcess();
    }

    processSyncQueue() {
        if (this.isProcessing || this.syncQueue.length === 0) return;

        const now = performance.now();
        if (now - this.lastSyncTime < this.syncThrottle) {
            // schedule next frame
            if (this.rafId) cancelAnimationFrame(this.rafId);
            this.rafId = requestAnimationFrame(() => this.processSyncQueue());
            return;
        }

        this.isProcessing = true;
        const start = performance.now();

        try {
            while (this.syncQueue.length > 0) {
                const item = this.syncQueue.shift();
                this.executeSync(item);

                if (performance.now() - start > this.maxFrameBudget) break; // yield to keep UI smooth
            }
        } finally {
            this.isProcessing = false;
            this.lastSyncTime = performance.now();
            const elapsed = this.lastSyncTime - start;
            this.perfMonitor.record(elapsed);

            if (this.syncQueue.length > 0) {
                this.rafId = requestAnimationFrame(() => this.processSyncQueue());
            }
        }
    }

    executeSync(item) {
        switch (item.type) {
            case 'content':
                this._syncContent();
                break;
            case 'cursor':
                this._syncCursor();
                break;
            case 'scroll':
                this._syncScroll();
                break;
            case 'lineNumbers':
                this._syncLineNumbers();
                break;
            default:
                // allow custom handlers
                if (typeof item.handler === 'function') item.handler();
                break;
        }
    }

    //---------------
    // Sync helpers
    //---------------
    _syncContent() {
        if (this.updateLineNumbers) this.updateLineNumbers(this.editor, this.lineNumbers);
        if (this.highlightEditorSyntax) this.highlightEditorSyntax(this.editor, this.highlighted);
        if (this.syncScrollPosition) this.syncScrollPosition();
    }

    _syncCursor() {
        if (this.scrollToCursor) this.scrollToCursor();
    }

    _syncScroll() {
        if (this.syncScrollPosition) this.syncScrollPosition();
    }

    _syncLineNumbers() {
        if (this.syncLineNumbersUtil) this.syncLineNumbersUtil();
    }

    //--------------------
    // Event handlers
    //--------------------
    handleInput() {
        this.queueSync({ type: 'content' });
    }

    handleScroll() {
        this.queueSync({ type: 'scroll', priority: 'high' });
    }

    handleSelectionChange() {
        if (document.activeElement !== this.editor) return;

        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;

        const range = sel.getRangeAt(0);
        const selectedText = range.toString();
        const editorText = this.editor.textContent || '';

        const isFullSelection = selectedText.length === editorText.length;
        const isLargeSelection = selectedText.length > editorText.length * this.selectionMaxRatio;

        if (!isFullSelection && !isLargeSelection) {
            this.queueSync({ type: 'cursor' });
        }
    }

    handleFocus() {
        this.queueSync({ type: 'content' });
    }

    handleBlur() {
        // Optional: could pause sync on blur
    }

    //--------------------
    // Utility helpers
    //--------------------
    _throttle(fn, wait) {
        let last = 0;
        let timeout = null;
        const wrapper = (...args) => {
            const now = Date.now();
            const remaining = wait - (now - last);
            if (remaining <= 0) {
                if (timeout) { clearTimeout(timeout); timeout = null; }
                last = now;
                fn(...args);
            } else if (!timeout) {
                timeout = setTimeout(() => {
                    last = Date.now();
                    timeout = null;
                    fn(...args);
                }, remaining);
            }
        };
        // attach a handler ref so it can be removed if needed
        wrapper._handler = wrapper;
        return wrapper;
    }

    //--------------------
    // Public API
    //--------------------
    getPerformanceStats() {
        return {
            avgSyncTime: this.perfMonitor.avgSyncTime,
            maxSyncTime: this.perfMonitor.maxSyncTime,
            queueLength: this.syncQueue.length,
            isProcessing: this.isProcessing
        };
    }

    pause() {
        this._isPaused = true;
    }

    resume() {
        this._isPaused = false;
        if (this.syncQueue.length > 0) this.debouncedProcess();
    }

    // Manually trigger a full sync
    triggerFullSync() {
        this.queueSync({ type: 'content', priority: 'high' });
    }

    // Cleanup listeners & observers
    destroy() {
        if (this._isDestroyed) return;
        this._isDestroyed = true;

        if (this.observer) {
            try { this.observer.disconnect(); } catch (e) {}
            this.observer = null;
        }

        if (this.rafId) cancelAnimationFrame(this.rafId);

        // Clear queue
        this.syncQueue.length = 0;

        // Remove listeners
        try { this.removeEventListeners(); } catch (e) {}

        // If debouncedProcess has cancel method (like lodash), call it
        if (this.debouncedProcess && typeof this.debouncedProcess.cancel === 'function') {
            this.debouncedProcess.cancel();
        }
    }
}