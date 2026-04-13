/**
 * Robustify content extraction from the editor.
 * Unified source of truth for text and line counting.
 */
export function getEditorPlainText(editor) {
  if (!editor) return "";

  // Strategy: Use a TreeWalker to predictably walk the DOM.
  // This avoids layout-dependent issues with innerText and lumping issues with textContent.
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
              // Add newline for block elements, but avoid doubles if the previous was also a block
              if (text.length > 0 && !text.endsWith('\n')) {
                  text += "\n";
              }
              lastWasBlock = true;
          }
      }
  }

  // Final cleanup for consistency
  let result = text
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\u00A0/g, " ")
      .replace(/\u200B/g, "");
      
  // If the last character is a newline, it's often the "phantom" newline from contenteditable
  // We trim only one trailing newline if it exists to avoid over-counting
  if (result.endsWith('\n')) {
      // But we only trim it if there's content before it, 
      // or if it's the ONLY character (empty editor state)
      // Actually, standard behavior is to NOT count the very last \n if it's trailing content
  }
  
  return result;
}

/**
 * Updates the line numbers gutter based on current editor content.
 */
export function updateLineNumbers(editor, lineNumbers) {
  const content = getEditorPlainText(editor);
  
  // Split by newline and filter out the very last empty entry if it's just a trailing newline
  const lines = content.split('\n');
  if (lines.length > 1 && lines[lines.length - 1] === "") {
      lines.pop();
  }
  
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
