const DEFAULT_LOG_LEVELS = ["log", "warn", "error", "info", "debug", "trace"];

function createLogCounters() {
    return DEFAULT_LOG_LEVELS.reduce((acc, level) => {
        acc[level] = 0;
        return acc;
    }, {});
}

function createAsyncCounters() {
    return {
        timeout: 0,
        interval: 0,
        raf: 0,
        promise: 0
    };
}

function createNetworkCounters() {
    return {
        total: 0,
        fetch: 0,
        xhr: 0
    };
}

function createRunSnapshot() {
    return {
        codeSize: 0,
        startedAt: 0,
        duration: 0,
        failed: false,
        logs: createLogCounters(),
        domMutations: 0,
        lastDomMutation: null,
        network: createNetworkCounters(),
        asyncOps: createAsyncCounters(),
        uiActions: {},
        errors: 0,
        memory: {
            start: 0,
            end: 0,
            delta: 0
        },
        timeline: []
    };
}

export class ExecutionTracker {
    constructor() {
        this.sessionRuns = 0;
        this.sessionUiActions = {};
        this.currentRun = createRunSnapshot();
    }

    resetRunState() {
        this.currentRun = createRunSnapshot();
    }

    resetSession() {
        this.sessionRuns = 0;
        this.sessionUiActions = {};
        this.resetRunState();
    }

    beginRun(source = "") {
        this.sessionRuns += 1;
        this.currentRun = createRunSnapshot();
        this.currentRun.codeSize = source.length;
        this.currentRun.startedAt = performance.now();
        this.currentRun.memory.start = this.sampleMemory();
        this.pushEvent("run-start", {
            codeSize: source.length,
            sessionRuns: this.sessionRuns
        });
    }

    finishRun(duration, { failed = false } = {}) {
        this.currentRun.duration = duration;
        this.currentRun.failed = failed;
        this.currentRun.memory.end = this.sampleMemory();

        if (this.currentRun.memory.start && this.currentRun.memory.end) {
            this.currentRun.memory.delta = this.currentRun.memory.end - this.currentRun.memory.start;
        }

        this.pushEvent("run-complete", { duration, failed });
    }

    sampleMemory() {
        if (typeof performance !== "undefined" && performance.memory && performance.memory.usedJSHeapSize) {
            return performance.memory.usedJSHeapSize;
        }
        return 0;
    }

    pushEvent(type, detail = {}) {
        const timestamp = performance.now();
        this.currentRun.timeline.push({
            type,
            detail,
            timestamp
        });

        if (this.currentRun.timeline.length > 200) {
            this.currentRun.timeline.shift();
        }
    }

    recordLog(level = "log", payload = []) {
        if (!this.currentRun.logs[level]) {
            this.currentRun.logs[level] = 0;
        }
        this.currentRun.logs[level] += 1;
        this.pushEvent("log", { level, preview: summarizePayload(payload) });
    }

    recordNetworkRequest(kind = "fetch", descriptor = "") {
        this.currentRun.network.total += 1;
        if (!this.currentRun.network[kind]) {
            this.currentRun.network[kind] = 0;
        }
        this.currentRun.network[kind] += 1;
        this.pushEvent("network", { kind, descriptor });
    }

    recordDomMutation(action = "mutate", detail = "") {
        this.currentRun.domMutations += 1;
        this.currentRun.lastDomMutation = detail || action;
        this.pushEvent("dom", { action, detail });
    }

    recordAsync(kind = "timeout", detail = "") {
        if (!this.currentRun.asyncOps[kind]) {
            this.currentRun.asyncOps[kind] = 0;
        }
        this.currentRun.asyncOps[kind] += 1;
        this.pushEvent("async", { kind, detail });
    }

    recordUIAction(action = "interaction") {
        this.currentRun.uiActions[action] = (this.currentRun.uiActions[action] || 0) + 1;
        this.sessionUiActions[action] = (this.sessionUiActions[action] || 0) + 1;
        this.pushEvent("ui", { action });
    }

    recordError(error) {
        this.currentRun.errors += 1;
        this.pushEvent("error", {
            message: error?.message || "Unknown error",
            stack: error?.stack
        });
    }

    getMetrics() {
        const peakMemoryMb = this.currentRun.memory.end
            ? this.currentRun.memory.end / (1024 * 1024)
            : 0;
        const retainedMemoryMb = this.currentRun.memory.delta
            ? this.currentRun.memory.delta / (1024 * 1024)
            : 0;

        return {
            sessionRuns: this.sessionRuns,
            codeSize: this.currentRun.codeSize,
            startedAt: this.currentRun.startedAt,
            duration: this.currentRun.duration,
            failed: this.currentRun.failed,
            logs: { ...this.currentRun.logs },
            domMutations: this.currentRun.domMutations,
            lastDomMutation: this.currentRun.lastDomMutation,
            network: { ...this.currentRun.network },
            asyncOps: { ...this.currentRun.asyncOps },
            uiActions: {
                session: { ...this.sessionUiActions },
                currentRun: { ...this.currentRun.uiActions }
            },
            errors: this.currentRun.errors,
            memory: { ...this.currentRun.memory },
            timeline: [...this.currentRun.timeline],
            gcCollections: 0,
            allocations: this.currentRun.domMutations,
            retainedMemory: retainedMemoryMb,
            peakMemory: peakMemoryMb
        };
    }

    getTimeline(limit = 50) {
        if (!Array.isArray(this.currentRun.timeline)) {
            return [];
        }
        return this.currentRun.timeline.slice(-limit);
    }
}

function summarizePayload(values) {
    if (!values || !values.length) return "";
    const [first] = values;
    if (typeof first === "string") {
        return first.slice(0, 120);
    }
    if (typeof first === "object") {
        try {
            return JSON.stringify(first).slice(0, 120);
        } catch {
            return "[object]";
        }
    }
    return String(first);
}

export function ensureExecutionTracker() {
    if (typeof window === "undefined") {
        return null;
    }
    if (!window.executionTracker) {
        window.executionTracker = new ExecutionTracker();
    }
    return window.executionTracker;
}

export function getExecutionTracker() {
    return ensureExecutionTracker();
}
