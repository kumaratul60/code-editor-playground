import { editor, selectionOverlay } from "@editor/domUtils.js";

function getContainer() {
    return document.querySelector('.editor-container');
}

function getSelectionGeometry() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount || document.activeElement !== editor) {
        return null;
    }

    const range = selection.getRangeAt(0);
    const isCollapsed = selection.isCollapsed;

    if (isCollapsed) {
        const caretRect = range.getBoundingClientRect();
        if (!caretRect || (!caretRect.height && !caretRect.width)) {
            return null;
        }
        return { rects: [caretRect], isCollapsed: true };
    }

    const rects = Array.from(range.getClientRects()).filter(rect => rect.width || rect.height);
    if (!rects.length) {
        const fallback = range.getBoundingClientRect();
        if (fallback && (fallback.width || fallback.height)) {
            rects.push(fallback);
        }
    }

    if (!rects.length) {
        return null;
    }

    return { rects, isCollapsed: false };
}

export function clearSelectionOverlay() {
    if (!selectionOverlay) return;
    selectionOverlay.innerHTML = "";
    selectionOverlay.classList.remove('is-active');
}

export function updateSelectionOverlay() {
    if (!selectionOverlay) return;
    const container = getContainer();
    if (!container) return;

    const selectionInfo = getSelectionGeometry();
    if (!selectionInfo) {
        clearSelectionOverlay();
        return;
    }

    const { rects, isCollapsed } = selectionInfo;
    const containerRect = container.getBoundingClientRect();
    const fragment = document.createDocumentFragment();

    rects.forEach(rect => {
        const block = document.createElement('div');
        block.className = isCollapsed ? 'cursor-block' : 'selection-block';
        const top = rect.top - containerRect.top + container.scrollTop;
        const left = rect.left - containerRect.left + container.scrollLeft;

        block.style.top = `${top}px`;
        block.style.left = `${left}px`;

        if (isCollapsed) {
            const caretHeight = rect.height || parseFloat(getComputedStyle(editor).lineHeight) || 18;
            block.style.width = '2px';
            block.style.height = `${caretHeight}px`;
        } else {
            block.style.width = `${Math.max(rect.width, 2)}px`;
            block.style.height = `${Math.max(rect.height, 2)}px`;
        }

        fragment.appendChild(block);
    });

    selectionOverlay.innerHTML = "";
    selectionOverlay.appendChild(fragment);
    selectionOverlay.classList.add('is-active');
}
