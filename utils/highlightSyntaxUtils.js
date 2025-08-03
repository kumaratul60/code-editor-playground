// ==============================
// 🔍 Syntax Highlight Pipeline
// ==============================

export function highlightSyntax(code) {
  placeholders = []; // reset before each run
  placeholderIndex = 0;

  code = extractStrings(code); // Template literals + strings
  code = extractComments(code);
  code = highlightRegexLiterals(code);
  code = highlightKeywords(code);
  code = highlightLiterals(code);
  code = highlightGlobals(code);
  code = highlightFunctionCalls(code);
  code = highlightBrackets(code);

  // Highlight nested brackets (AFTER all token replacements)
  code = highlightBrackets(code);

  // Restore placeholders
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

// const extractStrings = (input) =>
//   input.replace(/(["'`])(?:\\.|(?!\1)[^\\\n])*\1/g, (match) => makePlaceholder("string", match));

const extractStrings = (input) =>
  input
    .replace(/`(?:\\[\s\S]|[^\\`])*`/g, (match) => {
      // Handle `${...}` interpolations
      const inner = match.replace(/\$\{([^}]*)\}/g, (_, expr) => {
        const highlighted = highlightSyntax(expr); // recursive!
        return `\${<span class="template-expr">${highlighted}</span>}`;
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
  const chars = input.split("");

  const tagWrap = (ch, level) => `<span class="bracket-depth-${(level % 5) + 1}">${ch}</span>`;

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

export function highlightEditorSyntax(editor, highlighted) {
  const code = editor.innerText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const highlightedHTML = highlightSyntax(code);
  highlighted.innerHTML = highlightedHTML + "<br />";
}
