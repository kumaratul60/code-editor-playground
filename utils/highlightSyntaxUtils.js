// ==============================
// Syntax Highlight Pipeline
// ==============================

const MAX_HIGHLIGHT_SIZE = 50000;        // Max characters (50KB)
const PERFORMANCE_MODE_THRESHOLD = 20000; // Switch above 20KB

let placeholders = [];
let placeholderIndex = 0;

function makePlaceholder(type, content) {
    const token = `__${placeholderIndex++}__`;
    placeholders.push({ token, html: `<span class="${type}">${content}</span>` });
    return token;
}

export function highlightSyntax(code) {
    // Reset state each run
    placeholders = [];
    placeholderIndex = 0;

    // Performance optimization
    if (code.length > MAX_HIGHLIGHT_SIZE) {
        return escapeHtml(code); // Just escape HTML
    }

    if (code.length > PERFORMANCE_MODE_THRESHOLD) {
        return highlightSyntaxPerformanceMode(code);
    }

    // Normal highlighting pipeline
    code = extractStrings(code);
    code = extractComments(code);
    code = highlightRegexLiterals(code);
    code = highlightKeywords(code);
    code = highlightLiterals(code);
    code = highlightGlobals(code);
    code = highlightFunctionCalls(code);
    code = highlightBrackets(code);

    // Restore placeholders (replace ALL occurrences)
    for (const { token, html } of placeholders) {
        code = code.split(token).join(html);
    }

    return code;
}

// ------------------ Extractors & Highlighters ------------------

const extractStrings = (input) =>
    input
        .replace(/`(?:\\[\s\S]|[^\\`])*`/g, (match) => {
            const inner = match.replace(/\$\{([^}]*)\}/g, (_, expr) => {
                const simpleHighlighted = expr
                    .replace(
                        /\b(let|const|var|function|return|if|else|for|while|class|async|await|true|false|null|undefined)\b/g,
                        '<span class="keyword">$1</span>'
                    )
                    .replace(/\b\d+(?:\.\d+)?\b/g, '<span class="number">$&</span>')
                    .replace(/(['"`])(?:\\.|(?!\1)[^\\\n])*\1/g, '<span class="string">$&</span>');
                return `\${<span class="template-expr">${simpleHighlighted}</span>}`;
            });
            return makePlaceholder("string", inner);
        })
        .replace(/(['"])(?:\\.|(?!\1)[^\\\n])*\1/g, (match) =>
            makePlaceholder("string", match)
        );

const extractComments = (input) =>
    input.replace(/\/\/[^\n]*/g, (match) => makePlaceholder("comment", match));

const highlightKeywords = (input) =>
    input.replace(
        /\b(const|let|var|function|if|else|return|for|while|try|catch|throw|new|await|async|switch|case|break|default|typeof|instanceof|in|of|continue)\b/g,
        `<span class="keyword">$1</span>`
    );

const highlightLiterals = (input) =>
    input
        .replace(/\b(true|false|null|undefined|NaN|Infinity)\b/g, `<span class="literal">$1</span>`)
        .replace(/\b(\d+(\.\d+)?)\b/g, `<span class="literal">$1</span>`);

const highlightRegexLiterals = (input) =>
    input.replace(/(?<!\w)(\/(\\\/|[^\/\n])+\/[gimsuy]*)/g, (match) =>
        makePlaceholder("regex", match)
    );

const highlightGlobals = (input) =>
    input.replace(
        /\b(console|window|document|Math|Date|Array|Object|String|Number|Boolean|JSON|localStorage|sessionStorage|setTimeout|setInterval|clearTimeout|clearInterval|fetch)\b/g,
        `<span class="keyword">$1</span>`
    );

const highlightFunctionCalls = (input) =>
    input.replace(/(\.\s*)([a-zA-Z_$][\w$]*)\b(?=\s*\()/g, `$1<span class="function">$2</span>`);

const highlightBrackets = (input) => {
    const openers = "([{";
    const closers = ")]}";
    const pairs = { "(": ")", "[": "]", "{": "}" };
    const stack = [];
    const chars = input.split("");

    const tagWrap = (ch, level) =>
        `<span class="bracket-depth-${(level % 5) + 1}">${ch}</span>`;

    for (let i = 0; i < chars.length; i++) {
        const ch = chars[i];
        if (openers.includes(ch)) {
            stack.push({ char: ch, index: i });
        } else if (closers.includes(ch)) {
            const last = stack.pop();
            if (last && pairs[last.char] === ch) {
                const level = stack.length;
                chars[last.index] = tagWrap(chars[last.index], level);
                chars[i] = tagWrap(chars[i], level);
            }
        }
    }

    return chars.join("");
};

// ------------------ Performance Mode ------------------

function highlightSyntaxPerformanceMode(code) {
    code = escapeHtml(code);

    code = code.replace(
        /\b(function|const|let|var|if|else|return|class|async|await)\b/g,
        '<span class="keyword">$1</span>'
    );

    code = code.replace(
        /(["'`])(?:\\.|(?!\1)[^\\\n])*\1/g,
        (m) => `<span class="string">${m}</span>`
    );

    code = code.replace(/\/\/[^\n]*/g, (m) => `<span class="comment">${m}</span>`);

    return code;
}

// ------------------ Helpers ------------------

function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ==============================
// Apply to Editor
// ==============================

export function highlightEditorSyntax(editor, highlighted) {
    const code = editor.innerText; // already safe, don't re-escape

    if (code.length > PERFORMANCE_MODE_THRESHOLD) {
        highlighted.innerHTML = '<span class="loading">Highlighting large content...</span>';

        requestAnimationFrame(() => {
            const highlightedHTML = highlightSyntax(code);
            highlighted.innerHTML = highlightedHTML + "<br />";
        });
    } else {
        const highlightedHTML = highlightSyntax(code);
        highlighted.innerHTML = highlightedHTML + "<br />";
    }
}
