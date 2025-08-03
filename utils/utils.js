export function markdownToHTML(text) {
  return text
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    .replace(/\*\*(.*)\*\*/gim, "<b>$1</b>")
    .replace(/\*(.*)\*/gim, "<i>$1</i>")
    .replace(/`(.*?)`/gim, "<code>$1</code>")
    .replace(/\n$/gim, "<br />");
}

export function spawnFloatingEmoji(targetBtn, emojiChar = "☀️") {
  const emoji = document.createElement("div");
  const rect = targetBtn.getBoundingClientRect();

  emoji.textContent = emojiChar;
  emoji.style.position = "absolute";
  emoji.style.left = `${rect.left + rect.width / 2}px`;
  emoji.style.top = `${rect.top - 10}px`;
  emoji.style.transform = "translate(-50%, 0)";
  emoji.style.fontSize = "22px";
  emoji.style.opacity = "1";
  emoji.style.transition = "transform 1s ease-out, opacity 1s ease-out";
  emoji.style.zIndex = "9999";
  emoji.style.pointerEvents = "none";

  document.body.appendChild(emoji);

  // Trigger animation
  setTimeout(() => {
    emoji.style.transform += " translateY(-40px)";
    emoji.style.opacity = "0";
  }, 10);

  // Cleanup
  setTimeout(() => emoji.remove(), 1100);
}


export function runCode(editor, output) {
  const code = editor.innerText;
  output.innerHTML = "";
  try {
    const result = eval(code);
    if (result !== undefined) {
      logOutput(result, output);
    }
  } catch (err) {
    logOutput(err.message, output, true);
  }
}

export function logOutput(msg, output, isError = false) {
  const div = document.createElement("div");
  div.innerText = typeof msg === "object" ? JSON.stringify(msg, null, 2) : msg;
  div.style.color = isError ? "red" : "lightgreen";
  output.appendChild(div);
}

export function updateLineNumbers(editor, lineNumbers) {
  const content = editor.textContent.replace(/\u200B/g, "");
  const logicalLines = content.split(/\n|\r|\r\n/).length;

  let lineCount = logicalLines;

  if (logicalLines === 1) {
    const range = document.createRange();
    range.selectNodeContents(editor);
    const rects = range.getClientRects();
    const visualLines = rects.length || 1;
    lineCount = visualLines;
  }

  lineNumbers.innerHTML = Array.from({ length: lineCount }, (_, i) => `<span>${i + 1}</span>`).join(
    ""
  );
}

export function toggleRunButton(editor, runBtn) {
  const content = editor.textContent.replace(/\u200B/g, "").trim();
  const isEmpty = content === "";
  runBtn.disabled = isEmpty;
  runBtn.title = isEmpty ? "Editor is empty" : "";
}

export function highlightCurrentLine(editor, lineNumbers) {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(editor);
  preCaretRange.setEnd(range.endContainer, range.endOffset);

  const lineIndex = preCaretRange.toString().split(/\n/).length - 1;

  lineNumbers.querySelectorAll("span").forEach((span, idx) => {
    span.classList.toggle("active-line", idx === lineIndex);
  });
}
