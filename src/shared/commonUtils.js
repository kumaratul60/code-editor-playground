/**
 * Robustify content extraction from the editor.
 * Unified source of truth for text and line counting.
 */
export function getEditorPlainText(editor) {
  if (!editor) return "";

  const walker = document.createTreeWalker(
      editor,
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
      null,
      false
  );

  let text = "";
  let node;
  let lastWasBlock = false;

  while (node = walker.nextNode()) {
      if (node.nodeType === Node.TEXT_NODE) {
          text += node.textContent;
          lastWasBlock = false;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
          const tagName = node.tagName;
          if (tagName === 'BR') {
              text += "\n";
              lastWasBlock = false;
          } else if (tagName === 'DIV' || tagName === 'P') {
              // Only add newline if we're not at the very start and previous wasn't a block
              // This prevents double newlines for <div><div>text</div></div>
              if (text.length > 0 && !lastWasBlock) {
                  text += "\n";
              }
              lastWasBlock = true;
          }
      }
  }

  return text
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\u00A0/g, " ")
      .replace(/\u200B/g, "");
}

/**
 * Updates the line numbers gutter based on current editor content.
 */
export function updateLineNumbers(editor, lineNumbers) {
  const content = getEditorPlainText(editor);
  
  // Browsers often show an extra line at the end if the content ends with a newline
  // We match this behavior for visual sync
  const lines = content.split('\n');
  const lineCount = Math.max(1, lines.length);

  // Re-generate spans only if count changed or they are missing
  const currentSpans = lineNumbers.querySelectorAll('span');
  if (currentSpans.length !== lineCount || lineNumbers.dataset.count !== String(lineCount)) {
      lineNumbers.dataset.count = String(lineCount);
      lineNumbers.innerHTML = Array.from({ length: lineCount }, (_, i) => `<span>${i + 1}</span>`).join("");
  }

  // Consistent line height measurement to match #code-text
  const style = window.getComputedStyle(editor);
  const fontSize = parseFloat(style.fontSize) || 14;
  const lineMultiplier = 1.5;
  const calculatedLineHeight = parseFloat(style.lineHeight) || (fontSize * lineMultiplier);

  const finalSpans = lineNumbers.querySelectorAll('span');
  finalSpans.forEach(span => {
      span.style.height = `${calculatedLineHeight}px`;
      span.style.lineHeight = `${calculatedLineHeight}px`;
      span.style.display = 'flex';
      span.style.alignItems = 'center';
      span.style.justifyContent = 'flex-end';
      span.style.paddingRight = '8px';
      span.style.boxSizing = 'border-box';
  });
}

/**
 * Simple helper to check if Run button should be enabled.
 */
export function toggleRunButton(editor, runBtn) {
  if (!runBtn) return;
  const hasContent = getEditorPlainText(editor).trim().length > 0;
  runBtn.disabled = !hasContent;
  runBtn.style.opacity = hasContent ? "1" : "0.5";
  runBtn.style.cursor = hasContent ? "pointer" : "not-allowed";
}

/**
 * Helper to get text nodes for range calculations.
 */
export function getTextNodes(element) {
  const textNodes = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
  let node;
  while (node = walker.nextNode()) {
      textNodes.push(node);
  }
  return textNodes;
}

/**
 * Helper to get text exactly before cursor.
 */
export function getTextBeforeCursor(editor, range) {
    const preRange = range.cloneRange();
    preRange.selectNodeContents(editor);
    preRange.setEnd(range.startContainer, range.startOffset);
    
    // Use the same robust walker logic for consistency
    const tempDiv = document.createElement('div');
    tempDiv.appendChild(preRange.cloneContents());
    return getEditorPlainText(tempDiv);
}
