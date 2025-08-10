/////----------
/**
 * Complex JS snippet:
 * - Fetches from multiple JSON endpoints (placeholders)
 * - Demonstrates event loop ordering (microtasks/macrotasks/rAF)
 * - Processes data in a 6-step pipeline:
 *     1) fetch
 *     2) validate
 *     3) normalize
 *     4) enrich (combine with other endpoint)
 *     5) aggregate
 *     6) output (and optional persistence)
 *
 * - Includes AbortController, concurrency limit, retries, and clear logs.
 */

// ---------- Config / Endpoints ----------
const endpoints = {
    users: 'https://jsonplaceholder.typicode.com/users',      // placeholder 1
    posts: 'https://jsonplaceholder.typicode.com/posts',      // placeholder 2
    comments: 'https://jsonplaceholder.typicode.com/comments',// placeholder 3
    albums: 'https://jsonplaceholder.typicode.com/albums'     // optional 4th
};

const MAX_CONCURRENT_FETCHES = 3;
const RETRY_COUNT = 2;
const RETRY_DELAY_MS = 300;

// ---------- Utilities ----------
const sleep = ms => new Promise(res => setTimeout(res, ms));

async function retry(fn, attempts = RETRY_COUNT, delay = RETRY_DELAY_MS) {
    let lastErr;
    for (let i = 0; i <= attempts; i++) {
        try {
            return await fn();
        } catch (err) {
            lastErr = err;
            if (i < attempts) await sleep(delay * (i + 1));
        }
    }
    throw lastErr;
}

function safeJsonParse(text) {
    try {
        return JSON.parse(text);
    } catch (err) {
        return null;
    }
}

// Simple concurrency pool for fetch tasks
async function pool(tasks = [], concurrency = MAX_CONCURRENT_FETCHES) {
    const results = [];
    const executing = new Set();

    for (const task of tasks) {
        const p = (async () => {
            try {
                return await task();
            } finally {
                executing.delete(p);
            }
        })();

        executing.add(p);
        results.push(p);

        if (executing.size >= concurrency) {
            await Promise.race(executing);
        }
    }

    return Promise.all(results);
}

// ---------- Fetch helpers with cancellation ----------
function fetchWithTimeout(url, { signal, timeout = 8000 } = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    // If caller provides a signal, forward abort
    if (signal) signal.addEventListener('abort', () => controller.abort(), { once: true });

    return fetch(url, { signal: controller.signal })
        .finally(() => clearTimeout(timeoutId));
}

// ---------- 6-step pipeline functions ----------

// 1) FETCH step: fetch multiple endpoints concurrently (with retry + cancellation)
async function fetchEndpoints(abortSignal) {
    console.log('[STEP 1] fetchEndpoints start');

    const tasks = Object.entries(endpoints).map(([k, url]) => async () => {
        const text = await retry(() => fetchWithTimeout(url, { signal: abortSignal, timeout: 7000 })
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status} from ${url}`);
                return r.text();
            }));
        return { key: k, text };
    });

    const rawResponses = await pool(tasks, MAX_CONCURRENT_FETCHES);
    console.log('[STEP 1] fetchEndpoints done');
    return rawResponses; // [{key, text}, ...]
}

// 2) VALIDATE: ensure JSON parsable and shape minimally valid
function validateResponses(rawResponses) {
    console.log('[STEP 2] validateResponses');
    return rawResponses.reduce((acc, { key, text }) => {
        const parsed = safeJsonParse(text);
        if (!parsed) {
            throw new Error(`Invalid JSON from ${key}`);
        }
        // Minimal schema checks (very small)
        if (!Array.isArray(parsed) && typeof parsed !== 'object') {
            throw new Error(`Unexpected shape for ${key}`);
        }
        acc[key] = parsed;
        return acc;
    }, {});
}

// 3) NORMALIZE: pick fields we care about and normalize keys
function normalizeData(validData) {
    console.log('[STEP 3] normalizeData');
    const users = (validData.users || []).map(u => ({
        id: Number(u.id),
        name: String(u.name),
        username: String(u.username),
        email: u.email || null,
    }));

    const posts = (validData.posts || []).map(p => ({
        id: Number(p.id),
        userId: Number(p.userId),
        title: String(p.title).trim(),
        body: String(p.body).trim(),
    }));

    const comments = (validData.comments || []).map(c => ({
        id: Number(c.id),
        postId: Number(c.postId),
        name: String(c.name),
        body: String(c.body),
        email: c.email || null
    }));

    return { users, posts, comments, albums: validData.albums || [] };
}

// 4) ENRICH: join posts -> users and attach comment counts
function enrichData(normalized) {
    console.log('[STEP 4] enrichData');
    const userById = new Map(normalized.users.map(u => [u.id, u]));
    const commentCountByPost = normalized.comments.reduce((m, c) => {
        m.set(c.postId, (m.get(c.postId) || 0) + 1);
        return m;
    }, new Map());

    const postsEnriched = normalized.posts.map(p => {
        const user = userById.get(p.userId) || { id: p.userId, name: 'Unknown' };
        const commentCount = commentCountByPost.get(p.id) || 0;
        return { ...p, author: { id: user.id, name: user.name }, commentCount };
    });

    return { ...normalized, posts: postsEnriched };
}

// 5) AGGREGATE: produce summary metrics + top posts per user
function aggregateData(enriched) {
    console.log('[STEP 5] aggregateData');
    const postsByUser = new Map();
    for (const post of enriched.posts) {
        const arr = postsByUser.get(post.userId) || [];
        arr.push(post);
        postsByUser.set(post.userId, arr);
    }

    const userSummaries = Array.from(postsByUser.entries()).map(([userId, posts]) => ({
        userId,
        userName: posts[0]?.author?.name || 'Unknown',
        postCount: posts.length,
        totalComments: posts.reduce((s, p) => s + p.commentCount, 0),
        topPost: posts.slice().sort((a, b) => b.commentCount - a.commentCount)[0] || null
    }));

    const global = {
        totalUsers: enriched.users.length,
        totalPosts: enriched.posts.length,
        totalComments: enriched.comments.length,
        busiestUser: userSummaries.slice().sort((a, b) => b.postCount - a.postCount)[0] || null
    };

    return { userSummaries, global };
}

// 6) OUTPUT: log and optionally persist to localStorage (if available)
function outputResults(aggregated) {
    console.log('[STEP 6] outputResults');
    console.table(aggregated.userSummaries.slice(0, 10));
    console.log('Global summary:', aggregated.global);

    // optional persistence (browser-only)
    if (typeof localStorage !== 'undefined') {
        try {
            localStorage.setItem('lastAggregatedSummary', JSON.stringify(aggregated));
            console.log('Saved summary to localStorage');
        } catch (err) {
            console.warn('Could not save to localStorage', err);
        }
    }
}

// ---------- Event loop demo (micro vs macro vs rAF) ----------
function eventLoopDemo() {
    console.log('--- eventLoopDemo START ---');

    // Immediately scheduled (sync)
    console.log('sync log 1');

    // microtask
    Promise.resolve().then(() => console.log('microtask (Promise.resolve)'));

    // macrotask timer
    setTimeout(() => console.log('macrotask (setTimeout 0)'), 0);

    // rAF (only in browser)
    if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(() => console.log('rAF callback (animation frame)'));
    } else {
        // Node fallback
        setTimeout(() => console.log('rAF fallback (setTimeout)'), 16);
    }

    // another microtask
    queueMicrotask(() => console.log('microtask (queueMicrotask)'));

    console.log('sync log 2');
    console.log('--- eventLoopDemo END ---');
}

// ---------- Orchestration: run the full pipeline with cancel support ----------
async function runFullPipeline({ timeoutMs = 15000 } = {}) {
    // show event loop ordering before heavy async work
    eventLoopDemo();

    const controller = new AbortController();
    const killTimer = setTimeout(() => {
        controller.abort();
    }, timeoutMs);

    try {
        // Step 1: fetch
        const raw = await fetchEndpoints(controller.signal);

        // Step 2: validate
        const valid = validateResponses(raw);

        // Step 3: normalize
        const normalized = normalizeData(valid);

        // Step 4: enrich
        const enriched = enrichData(normalized);

        // Step 5: aggregate
        const aggregated = aggregateData(enriched);

        // Step 6: output
        outputResults(aggregated);

        console.log('Pipeline completed successfully.');
        return aggregated;
    } catch (err) {
        if (controller.signal.aborted) {
            console.error('Pipeline aborted (timeout or user cancel).', err?.message || err);
        } else {
            console.error('Pipeline failed:', err);
        }
        throw err;
    } finally {
        clearTimeout(killTimer);
    }
}

// ---------- Usage ----------
(async function main() {
    try {
        const result = await runFullPipeline({ timeoutMs: 12000 });
        // Use the result as needed...
    } catch (err) {
        // handle or ignore
    }
})();






/////---------




// Design Patterns Test Snippets
// Test these patterns in your code editor to verify syntax highlighting and analysis

// ========== 1. SINGLETON PATTERN ==========
class DatabaseConnection {
    constructor() {
        if (DatabaseConnection.instance) {
            return DatabaseConnection.instance;
        }
        this.connection = null;
        DatabaseConnection.instance = this;
    }

    connect() {
        if (!this.connection) {
            this.connection = 'Connected to database';
            console.log('Database connection established');
        }
        return this.connection;
    }

    static getInstance() {
        return new DatabaseConnection();
    }
}

// Test Singleton
const db1 = new DatabaseConnection();
const db2 = DatabaseConnection.getInstance();
console.log(db1 === db2); // Should be true

// ========== 2. FACTORY PATTERN ==========
// class ShapeFactory {
//     static createShape(type, ...args) {
//         switch (type.toLowerCase()) {
//             case 'circle':
//                 return new Circle(...args);
//             case 'rectangle':
//                 return new Rectangle(...args);
//             case 'triangle':
//                 return new Triangle(...args);
//             default:
//                 throw new Error(`Shape type ${type} not supported`);
//         }
//     }
// }
//
// class Circle {
//     constructor(radius) {
//         this.radius = radius;
//         this.type = 'circle';
//     }
//
//     area() {
//         return Math.PI * this.radius ** 2;
//     }
// }
//
// class Rectangle {
//     constructor(width, height) {
//         this.width = width;
//         this.height = height;
//         this.type = 'rectangle';
//     }
//
//     area() {
//         return this.width * this.height;
//     }
// }
//
// class Triangle {
//     constructor(base, height) {
//         this.base = base;
//         this.height = height;
//         this.type = 'triangle';
//     }
//
//     area() {
//         return 0.5 * this.base * this.height;
//     }
// }
//
// // Test Factory
// const circle = ShapeFactory.createShape('circle', 5);
// const rectangle = ShapeFactory.createShape('rectangle', 4, 6);
// console.log(`Circle area: ${circle.area()}`);
// console.log(`Rectangle area: ${rectangle.area()}`);

// ========== 3. OBSERVER PATTERN ==========
class EventEmitter {
    constructor() {
        this.events = {};
    }

    subscribe(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(callback);
    }

    unsubscribe(eventName, callback) {
        if (this.events[eventName]) {
            this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
        }
    }

    emit(eventName, data) {
        if (this.events[eventName]) {
            this.events[eventName].forEach(callback => callback(data));
        }
    }
}

class NewsletterSubscriber {
    constructor(name) {
        this.name = name;
    }

    update(article) {
        console.log(`${this.name} received: ${article.title}`);
    }
}

// Test Observer
const newsletter = new EventEmitter();
const subscriber1 = new NewsletterSubscriber('Alice');
const subscriber2 = new NewsletterSubscriber('Bob');

newsletter.subscribe('newArticle', (data) => subscriber1.update(data));
newsletter.subscribe('newArticle', (data) => subscriber2.update(data));

newsletter.emit('newArticle', { title: 'Design Patterns in JavaScript' });

// ========== 4. STRATEGY PATTERN ==========
class PaymentStrategy {
    pay(amount) {
        throw new Error('Payment method must be implemented');
    }
}

class CreditCardPayment extends PaymentStrategy {
    constructor(cardNumber, cvv) {
        super();
        this.cardNumber = cardNumber;
        this.cvv = cvv;
    }

    pay(amount) {
        console.log(`Paid $${amount} using Credit Card ending in ${this.cardNumber.slice(-4)}`);
        return { success: true, method: 'credit_card', amount };
    }
}

class PayPalPayment extends PaymentStrategy {
    constructor(email) {
        super();
        this.email = email;
    }

    pay(amount) {
        console.log(`Paid $${amount} using PayPal account ${this.email}`);
        return { success: true, method: 'paypal', amount };
    }
}

class BankTransferPayment extends PaymentStrategy {
    constructor(accountNumber) {
        super();
        this.accountNumber = accountNumber;
    }

    pay(amount) {
        console.log(`Paid $${amount} using Bank Transfer from account ${this.accountNumber}`);
        return { success: true, method: 'bank_transfer', amount };
    }
}

class PaymentProcessor {
    constructor(strategy) {
        this.strategy = strategy;
    }

    setStrategy(strategy) {
        this.strategy = strategy;
    }

    processPayment(amount) {
        return this.strategy.pay(amount);
    }
}

// Test Strategy
const processor = new PaymentProcessor(new CreditCardPayment('1234567890123456', '123'));
processor.processPayment(100);

processor.setStrategy(new PayPalPayment('user@example.com'));
processor.processPayment(50);

// ========== 5. COMMAND PATTERN ==========
class Command {
    execute() {
        throw new Error('Execute method must be implemented');
    }

    undo() {
        throw new Error('Undo method must be implemented');
    }
}

class Light {
    constructor(location) {
        this.location = location;
        this.isOn = false;
    }

    turnOn() {
        this.isOn = true;
        console.log(`${this.location} light is ON`);
    }

    turnOff() {
        this.isOn = false;
        console.log(`${this.location} light is OFF`);
    }
}

class LightOnCommand extends Command {
    constructor(light) {
        super();
        this.light = light;
    }

    execute() {
        this.light.turnOn();
    }

    undo() {
        this.light.turnOff();
    }
}

class LightOffCommand extends Command {
    constructor(light) {
        super();
        this.light = light;
    }

    execute() {
        this.light.turnOff();
    }

    undo() {
        this.light.turnOn();
    }
}

class RemoteControl {
    constructor() {
        this.commands = {};
        this.lastCommand = null;
    }

    setCommand(slot, command) {
        this.commands[slot] = command;
    }

    pressButton(slot) {
        if (this.commands[slot]) {
            this.commands[slot].execute();
            this.lastCommand = this.commands[slot];
        }
    }

    pressUndo() {
        if (this.lastCommand) {
            this.lastCommand.undo();
        }
    }
}

// Test Command
const livingRoomLight = new Light('Living Room');
const kitchenLight = new Light('Kitchen');

const livingRoomLightOn = new LightOnCommand(livingRoomLight);
const livingRoomLightOff = new LightOffCommand(livingRoomLight);
const kitchenLightOn = new LightOnCommand(kitchenLight);

const remote = new RemoteControl();
remote.setCommand(1, livingRoomLightOn);
remote.setCommand(2, livingRoomLightOff);
remote.setCommand(3, kitchenLightOn);

remote.pressButton(1); // Turn on living room light
remote.pressButton(3); // Turn on kitchen light
remote.pressUndo(); // Undo last command

// ========== 6. MODULE PATTERN ==========
const CalculatorModule = (function() {
    // Private variables and methods
    let history = [];

    function addToHistory(operation, result) {
        history.push({ operation, result, timestamp: new Date() });
    }

    function validateNumbers(...numbers) {
        return numbers.every(num => typeof num === 'number' && !isNaN(num));
    }

    // Public API
    return {
        add: function(a, b) {
            if (!validateNumbers(a, b)) {
                throw new Error('Invalid numbers provided');
            }
            const result = a + b;
            addToHistory(`${a} + ${b}`, result);
            return result;
        },

        subtract: function(a, b) {
            if (!validateNumbers(a, b)) {
                throw new Error('Invalid numbers provided');
            }
            const result = a - b;
            addToHistory(`${a} - ${b}`, result);
            return result;
        },

        multiply: function(a, b) {
            if (!validateNumbers(a, b)) {
                throw new Error('Invalid numbers provided');
            }
            const result = a * b;
            addToHistory(`${a} * ${b}`, result);
            return result;
        },

        divide: function(a, b) {
            if (!validateNumbers(a, b)) {
                throw new Error('Invalid numbers provided');
            }
            if (b === 0) {
                throw new Error('Division by zero');
            }
            const result = a / b;
            addToHistory(`${a} / ${b}`, result);
            return result;
        },

        getHistory: function() {
            return [...history]; // Return copy to prevent external modification
        },

        clearHistory: function() {
            history = [];
            console.log('Calculator history cleared');
        }
    };
})();

// Test Module
console.log(CalculatorModule.add(5, 3)); // 8
console.log(CalculatorModule.multiply(4, 7)); // 28
console.log(CalculatorModule.divide(10, 2)); // 5
console.log('History:', CalculatorModule.getHistory());

// ========== 7. DECORATOR PATTERN ==========
class Coffee {
    cost() {
        return 2;
    }

    description() {
        return 'Simple coffee';
    }
}

class CoffeeDecorator {
    constructor(coffee) {
        this.coffee = coffee;
    }

    cost() {
        return this.coffee.cost();
    }

    description() {
        return this.coffee.description();
    }
}

class MilkDecorator extends CoffeeDecorator {
    cost() {
        return this.coffee.cost() + 0.5;
    }

    description() {
        return this.coffee.description() + ', milk';
    }
}

class SugarDecorator extends CoffeeDecorator {
    cost() {
        return this.coffee.cost() + 0.2;
    }

    description() {
        return this.coffee.description() + ', sugar';
    }
}

class WhipDecorator extends CoffeeDecorator {
    cost() {
        return this.coffee.cost() + 0.7;
    }

    description() {
        return this.coffee.description() + ', whip';
    }
}

// Test Decorator
let myCoffee = new Coffee();
console.log(`${myCoffee.description()} costs $${myCoffee.cost()}`);

myCoffee = new MilkDecorator(myCoffee);
console.log(`${myCoffee.description()} costs $${myCoffee.cost()}`);

myCoffee = new SugarDecorator(myCoffee);
myCoffee = new WhipDecorator(myCoffee);
console.log(`${myCoffee.description()} costs $${myCoffee.cost()}`);

// ========== 8. ASYNC PATTERNS FOR TESTING ==========
// Test async/await patterns
async function fetchUserData(userId) {
    try {
        const response = await fetch(`/api/users/${userId}`);
        const userData = await response.json();

        // Multiple async operations
        const [profile, settings, preferences] = await Promise.all([
            fetch(`/api/users/${userId}/profile`).then(r => r.json()),
            fetch(`/api/users/${userId}/settings`).then(r => r.json()),
            fetch(`/api/users/${userId}/preferences`).then(r => r.json())
        ]);

        return {
            user: userData,
            profile,
            settings,
            preferences
        };
    } catch (error) {
        console.error('Error fetching user data:', error);
        throw error;
    }
}

// Promise chain pattern
function processDataChain(data) {
    return Promise.resolve(data)
        .then(data => {
            console.log('Processing step 1');
            return { ...data, step1: true };
        })
        .then(data => {
            console.log('Processing step 2');
            return { ...data, step2: true };
        })
        .then(data => {
            console.log('Processing step 3');
            return { ...data, step3: true };
        })
        .catch(error => {
            console.error('Error in processing chain:', error);
            throw error;
        });
}

// Test the patterns
console.log('=== Design Patterns Test Complete ===');
console.log('Paste these snippets into your code editor to test:');
console.log('1. Syntax highlighting');
console.log('2. Code analysis features');
console.log('3. Pattern recognition');
console.log('4. Async operation detection');