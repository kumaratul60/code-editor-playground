import { debounceUtils } from "./commonUtils.js";

/**
 * Manages editor content synchronization across tabs using localStorage
 */
// In editorSync.js

export class EditorSynchronizer {
    /**
     * @param {HTMLElement} editor - The editor element to synchronize
     * @param {string} storageKey - Key to use for localStorage
     */
    constructor(editor, storageKey = 'code-editor-content') {
        this.editor = editor;
        this.STORAGE_KEY = storageKey;
        this.EDITOR_INSTANCE_ID = 'editor_' + Math.random().toString(36).substr(2, 9);

        // Bind methods
        this.handleStorageEvent = this.handleStorageEvent.bind(this);
        this.save = this.save.bind(this);
        this.destroy = this.destroy.bind(this);

        // Initialize
        this.initialize();
    }

    initialize() {
        // Set up storage event listener
        window.addEventListener('storage', this.handleStorageEvent);
    }

    /**
     * Load saved content from localStorage
     * @returns {string} The saved content or empty string if none
     */
    load() {
        const savedData = localStorage.getItem(this.STORAGE_KEY);
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                return data.content || '';
            } catch (e) {
                console.error('Error parsing saved content:', e);
            }
        }
        return '';
    }

    /**
     * Save content to localStorage
     * @param {string} content - The content to save
     */
    save(content) {
        const data = {
            content,
            timestamp: Date.now(),
            instanceId: this.EDITOR_INSTANCE_ID
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }

    /**
     * Handle storage events from other tabs
     * @param {StorageEvent} event
     */
    handleStorageEvent(event) {
        if (event.key === this.STORAGE_KEY && event.newValue) {
            try {
                const data = JSON.parse(event.newValue);
                // Don't update if the change was made by this instance
                if (data.instanceId !== this.EDITOR_INSTANCE_ID) {
                    this.editor.textContent = data.content;
                    // Trigger any necessary updates
                    if (typeof this.onContentChange === 'function') {
                        this.onContentChange();
                    }
                }
            } catch (e) {
                console.error('Error handling storage event:', e);
            }
        }
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