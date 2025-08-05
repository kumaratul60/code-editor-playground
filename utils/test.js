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