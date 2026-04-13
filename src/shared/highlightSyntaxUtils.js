import { getEditorPlainText } from "./commonUtils.js";

// ==============================
// Syntax Highlight Pipeline
// ==============================

const MAX_HIGHLIGHT_SIZE = 50000;
const PERFORMANCE_MODE_THRESHOLD = 20000;

export function highlightSyntax(code) {
    if (code.length > MAX_HIGHLIGHT_SIZE) {
        return escapeHtml(code);
    }

    placeholders = [];
    placeholderIndex = 0;

    if (code.length > PERFORMANCE_MODE_THRESHOLD) {
        return highlightSyntaxPerformanceMode(code);
    }

    // Step 1: Extract and placeholder items that shouldn't be touched by keyword highlighting
    code = extractStrings(code);
    code = extractComments(code);
    code = highlightRegexLiterals(code);
    
    // Step 2: Highlight core language features
    code = highlightKeywords(code);
    code = highlightLiterals(code);
    code = highlightGlobals(code);
    code = highlightFunctionCalls(code);
    
    // Step 3: Bracket highlighting - done on character level but aware of existing spans
    code = highlightBrackets(code);

    // Step 4: Restore placeholders
    for (const { token, html } of placeholders) {
        code = code.replace(token, html);
    }

    return code;
}

let placeholders = [];
let placeholderIndex = 0;

const makePlaceholder = (type, content) => {
  const token = `__${placeholderIndex++}__`;
  placeholders.push({ token, html: `<span class="${type}">${content}</span>` });
  return token;
};

const extractStrings = (input) =>
    input
        .replace(/`(?:\\[\s\S]|[^\\`])*`/g, (match) => {
          const inner = match.replace(/\$\{([^}]*)\}/g, (_, expr) => {
            const simpleHighlighted = expr
                .replace(/\b(let|const|var|function|return|if|else|for|while|class|async|await|true|false|null|undefined)\b/g, '<span class="keyword">$1</span>')
                .replace(/\b\d+(?:\.\d+)?\b/g, '<span class="number">$&</span>')
                .replace(/(['"`])(?:\\.|(?!\1)[^\\\n])*\1/g, '<span class="string">$&</span>')
            return `\${<span class="template-expr">${simpleHighlighted}</span>}`;
          });
          return makePlaceholder("string", inner);
        })
        .replace(/(['"])(?:\\.|(?!\1)[^\\\n])*\1/g, (match) => makePlaceholder("string", match));

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
  
  // We splitter only non-span parts preferably, but for simplicity here 
  // we ensure we don't break existing span tags
  const chars = [];
  let inTag = false;
  let currentTag = "";
  
  for(let i=0; i<input.length; i++) {
    if (input[i] === '<') { inTag = true; currentTag += '<'; }
    else if (input[i] === '>') { inTag = false; currentTag += '>'; chars.push({v: currentTag, t: true}); currentTag = ""; }
    else if (inTag) { currentTag += input[i]; }
    else { chars.push({v: input[i], t: false}); }
  }

  const tagWrap = (ch, level) => `<span class="bracket-depth-${(level % 5) + 1}">${ch}</span>`;

  for (let i = 0; i < chars.length; i++) {
    if (chars[i].t) continue;
    const ch = chars[i].v;

    if (openers.includes(ch)) {
      stack.push({ char: ch, index: i });
    } else if (closers.includes(ch)) {
      const last = stack.pop();
      if (last && pairs[last.char] === ch) {
        const level = stack.length;
        chars[last.index].v = tagWrap(chars[last.index].v, level);
        chars[i].v = tagWrap(chars[i].v, level);
      }
    }
  }

  return chars.map(c => c.v).join("");
};

function highlightSyntaxPerformanceMode(code) {
    code = escapeHtml(code);
    code = code.replace(/\b(function|const|let|var|if|else|return|class|async|await)\b/g, '<span class="keyword">$1</span>');
    code = code.replace(/(["'`])(?:\\.|(?!\1)[^\\\n])*\1/g, '<span class="string">$1</span>');
    code = code.replace(/\/\/[^\n]*/g, '<span class="comment">$1</span>');
    return code;
}

function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function highlightEditorSyntax(editor, highlighted) {
    if (!highlighted) return;

    // Source of truth: Canonical Extraction
    const code = getEditorPlainText(editor);
    
    // Safety: Always escape HTML before highlighting to prevent XSS and DOM hijacking
    const safeCode = escapeHtml(code);

    const applyToLayer = (html) => {
        // Trailing space/br ensures the final line is always measurable and visible
        const finalHTML = html.endsWith('\n') ? html + ' ' : html;
        highlighted.innerHTML = finalHTML + "<br />";
    };

    if (safeCode.length > PERFORMANCE_MODE_THRESHOLD) {
        highlighted.innerHTML = '<span class="loading">Highlighting...</span>';
        requestAnimationFrame(() => applyToLayer(highlightSyntax(safeCode)));
    } else {
        applyToLayer(highlightSyntax(safeCode));
    }
}
