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


export function getEditorPlainText(editor) {
  if (!editor) return "";

  return editor.textContent
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\u00A0/g, " ")
      .replace(/\u200B/g, "");
}

export function updateLineNumbers(editor, lineNumbers) {
  const content = getEditorPlainText(editor);

  // Fix: remove trailing newline to prevent off-by-one line count
  // which causes "ghost" line numbers when cursor is at end
  const cleanContent = content.endsWith('\n') ? content.slice(0, -1) : content;
  const lines = cleanContent.split(/\n/);
  const lineCount = Math.max(1, lines.length);

  
  
  let existingSpans = Array.from(lineNumbers.children);
  
  if (existingSpans.length !== lineCount) {
    lineNumbers.dataset.count = String(lineCount);
    lineNumbers.innerHTML = Array.from({ length: lineCount }, (_, i) => `<span>${i + 1}</span>`).join("");
    existingSpans = Array.from(lineNumbers.children);
  }
  
  const editorContent = editor.firstChild;
  if (!editorContent) {
      // Empty editor
      return;
  }
 
  // 1. Calculate start offsets for each line
  const lineOffsets = [];
  let currentOffset = 0;
  for (const line of lines) {
      lineOffsets.push({ start: currentOffset, length: line.length });
      currentOffset += line.length + 1; // +1 for newline
  }
  
  // 2. Map offsets to Range objects
  // We can optimize by doing one pass over the DOM text nodes.
  
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT, null, false);
  let currentNode = walker.nextNode();
  let currentGlobalOffset = 0;
  
  let lineIdx = 0;
  
  while (lineIdx < lineCount && currentNode) {
      const lineData = lineOffsets[lineIdx];
      const lineEnd = lineData.start + lineData.length;
      
      // We want to create a range from lineData.start to lineEnd
      const range = document.createRange();
      
      try {
          // Find start node
          let startNode = currentNode;
          let startLocalOffset = lineData.start - currentGlobalOffset;
          
          // While the start of the line is beyond the current node...
          while (currentNode && currentGlobalOffset + currentNode.textContent.length <= lineData.start) {
              currentGlobalOffset += currentNode.textContent.length;
              currentNode = walker.nextNode();
          }
          
          if (!currentNode) break;
          
          startNode = currentNode;
          startLocalOffset = lineData.start - currentGlobalOffset;
          
          // Now find the end
          let endNode = startNode;
          let scannedOffset = currentGlobalOffset;
          let endLocalOffset = lineData.start + lineData.length - scannedOffset; // Target absolute end - node start
          
          // If the line extends beyond this node...
           // Look ahead for the end node
           let tempNode = startNode;
           let tempGlobal = scannedOffset;
           
           while (tempNode && tempGlobal + tempNode.textContent.length < lineData.start + lineData.length) {
               tempGlobal += tempNode.textContent.length;
               tempNode = walker.nextNode();
           }
           // The loop breaks when tempNode contains the end or is null
           if (tempNode) {
               endNode = tempNode;
             
               endLocalOffset = (lineData.start + lineData.length) - tempGlobal;
           } else {
               // End of doc
               endLocalOffset = endNode.textContent.length;
           }
           
           // Construct range
           range.setStart(startNode, startLocalOffset);
           range.setEnd(endNode, endLocalOffset);
           
           // Measure
           const rects = range.getClientRects();
    
           const height = range.getBoundingClientRect().height;
           
           if (height > 0) {
              existingSpans[lineIdx].style.height = `${height}px`;
              existingSpans[lineIdx].style.lineHeight = 'normal'; // Allow standard layout inside
              existingSpans[lineIdx].style.display = 'flex'; // Ensure height is respected
              existingSpans[lineIdx].style.alignItems = 'center'; // Center text vertically? Or top? Usually top aligns.
              existingSpans[lineIdx].style.justifyContent = 'flex-end'; // Right align numbers
              // Reset line-height to match font if needed, but height handles spacing
           } else {
               // Empty line or fail
               existingSpans[lineIdx].style.height = ''; 
           }

            // Sync state for next loop
            currentNode = endNode;
            currentGlobalOffset = tempGlobal;
            
      } catch (e) {
          // Fallback
          existingSpans[lineIdx].style.height = '';
          console.warn("Line measure error", e);
      }
      
      lineIdx++;
  }
}

export function toggleRunButton(editor, runBtn) {
  const content = getEditorPlainText(editor).trim();
  const isEmpty = content === "";
  runBtn.disabled = isEmpty;
  runBtn.title = isEmpty ? "Editor is empty" : "";
}

export function highlightCurrentLine(editor, lineNumbers) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);

    // Better cursor position calculation for layered editor
    let lineIndex = 0;

    try {
        // Get the text content up to cursor position
        const textBeforeCursor = getTextBeforeCursor(editor, range);

        // Count actual line breaks in the content
        const lines = textBeforeCursor.split(/\r\n|\r|\n/);
        lineIndex = Math.max(0, lines.length - 1);

    } catch (error) {
        // Fallback to original method if new method fails
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(editor);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        lineIndex = preCaretRange.toString().split(/\n/).length - 1;
    }

    // Update line number highlighting
    lineNumbers.querySelectorAll("span").forEach((span, idx) => {
        span.classList.toggle("active-line", idx === lineIndex);
    });
}

// Helper function to get text before cursor position
export function getTextBeforeCursor(editor, range) {
    const walker = document.createTreeWalker(
        editor,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );

    let textContent = '';
    let node;

    while (node = walker.nextNode()) {
        if (node === range.startContainer) {
            // Add partial text up to cursor position
            textContent += node.textContent.substring(0, range.startOffset);
            break;
        } else {
            // Add full text content of this node
            textContent += node.textContent;
        }
    }

    return textContent;
}
