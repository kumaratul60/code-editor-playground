import {debouncedHighlight, syncLineNumbers} from "./editorSync.js";
import {scrollToCursor} from "./cursorUtils.js";
import {toggleButtonVisibility} from "./commonUtils.js";

class UndoRedoManager {
    constructor(editor) {
        this.editor = editor;
        this.history = [];
        this.currentIndex = -1;
        this.isUndoRedoOperation = false;

        this.saveState('initial');
        this.setupKeyboardShortcuts();
    }

    saveState(operation = 'edit') {
        if (this.isUndoRedoOperation) return;

        const state = {
            content: this.editor.innerText,
            operation,
            timestamp: Date.now()
        };

        this.history = this.history.slice(0, this.currentIndex + 1);
        this.history.push(state);
        this.currentIndex++;

        if (this.history.length > 50) {
            this.history.shift();
            this.currentIndex--;
        }
    }

    undo() {
        if (this.currentIndex <= 0) return false;

        this.currentIndex--;
        this.restoreState(this.history[this.currentIndex]);
        return true;
    }

    redo() {
        if (this.currentIndex >= this.history.length - 1) return false;

        this.currentIndex++;
        this.restoreState(this.history[this.currentIndex]);
        return true;
    }

    restoreState(state) {
        this.isUndoRedoOperation = true;
        this.editor.innerText = state.content;

        setTimeout(() => {
            syncLineNumbers();
            scrollToCursor();
            toggleButtonVisibility();
            debouncedHighlight();
            this.isUndoRedoOperation = false;
        }, 10);
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
            }
            if (((e.ctrlKey || e.metaKey) && e.key === 'y') ||
                ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
                e.preventDefault();
                this.redo();
            }
        });
    }
}

export default UndoRedoManager;