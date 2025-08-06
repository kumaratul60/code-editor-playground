import { debounceUtils } from "./commonUtils.js";

/**
 * Manages editor content synchronization across tabs using localStorage
 */
export class EditorSynchronizer {
    /**
     * @param {HTMLElement} editor - The editor element to synchronize
     * @param {HTMLElement} highlighted - The syntax highlighted element
     * @param {Function} syncLineNumbers - Function to update line numbers
     * @param {Function} highlightEditorSyntax - Function to update syntax highlighting
     */
    constructor(editor, highlighted, syncLineNumbers, highlightEditorSyntax) {
        this.editor = editor;
        this.highlighted = highlighted;
        this.syncLineNumbers = syncLineNumbers;
        this.highlightEditorSyntax = highlightEditorSyntax;

        this.EDITOR_INSTANCE_ID = 'editor_' + Math.random().toString(36).substr(2, 9);
        this.STORAGE_KEY = 'editorContent';

        // Bind methods
        this.handleStorageEvent = this.handleStorageEvent.bind(this);
        this.saveCode = this.saveCode.bind(this);
        this.destroy = this.destroy.bind(this);

        // Initialize
        this.initialize();
    }

    initialize() {
        // Set up storage event listener
        window.addEventListener('storage', this.handleStorageEvent);

        // Initial load
        this.loadSavedCode();
    }

    /**
     * Load saved code from localStorage
     */
    loadSavedCode() {
        const savedData = localStorage.getItem(this.STORAGE_KEY);
        if (savedData) {
            try {
                const { content, updatedBy } = JSON.parse(savedData);
                if (content !== this.editor.textContent) {
                    const previousScrollTop = this.editor.scrollTop;
                    this.editor.textContent = content;
                    this.syncLineNumbers();
                    this.highlightEditorSyntax(this.editor, this.highlighted);
                    this.editor.scrollTop = previousScrollTop;

                    if (updatedBy && updatedBy !== this.EDITOR_INSTANCE_ID) {
                        this.showNotification('Code updated from another tab');
                    }
                }
            } catch (e) {
                console.error('Error loading saved code:', e);
            }
        }
    }

    /**
     * Save current editor content to localStorage
     */
    saveCode() {
        const content = this.editor.textContent;
        const data = {
            content,
            timestamp: Date.now(),
            updatedBy: this.EDITOR_INSTANCE_ID
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }

    /**
     * Handle storage events from other tabs
     */
    handleStorageEvent(event) {
        if (event.key === this.STORAGE_KEY && event.newValue) {
            try {
                const newData = JSON.parse(event.newValue);
                const oldData = event.oldValue ? JSON.parse(event.oldValue) : null;

                if (!oldData || newData.content !== oldData.content) {
                    this.loadSavedCode();
                }
            } catch (e) {
                console.error('Error processing storage event:', e);
            }
        }
    }

    /**
     * Show a temporary notification
     */
    showNotification(message) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.background = '#4a90e2';
        notification.style.color = 'white';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '4px';
        notification.style.zIndex = '1000';
        notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transition = 'opacity 0.5s';
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 500);
        }, 2000);
    }

    /**
     * Clean up event listeners
     */
    destroy() {
        window.removeEventListener('storage', this.handleStorageEvent);
    }
}

/**
 * Creates a debounced save function for the editor
 */
export const createDebouncedSave = (synchronizer, delay = 500) => {
    return debounceUtils(() => synchronizer.saveCode(), delay);
};