/**
 * File System Access API Utility
 * Manages a workspace directory for offline editing
 * Works in Chrome and Edge browsers
 */

const DB_NAME = 'DocVaultWorkspace';
const DB_VERSION = 1;
const STORE_NAME = 'handles';
const DIR_HANDLE_KEY = 'workspaceDir';

// ---- IndexedDB Helpers ----

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function saveHandleToDB(key, handle) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(handle, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function getHandleFromDB(key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

// ---- Feature Detection ----

export function isFileSystemAccessSupported() {
    return 'showDirectoryPicker' in window;
}

// ---- Workspace Directory Management ----

/**
 * Let user pick a workspace directory (first time setup)
 * Returns the directory handle
 */
export async function pickWorkspaceDirectory() {
    try {
        const dirHandle = await window.showDirectoryPicker({
            mode: 'readwrite',
            startIn: 'desktop'
        });
        // Save to IndexedDB for persistence
        await saveHandleToDB(DIR_HANDLE_KEY, dirHandle);
        return dirHandle;
    } catch (err) {
        if (err.name === 'AbortError') {
            // User cancelled
            return null;
        }
        throw err;
    }
}

/**
 * Get the saved workspace directory handle
 * Returns null if not set or permission denied
 */
export async function getWorkspaceDirectory() {
    try {
        const handle = await getHandleFromDB(DIR_HANDLE_KEY);
        if (!handle) return null;

        // Verify we still have permission
        const permission = await handle.queryPermission({ mode: 'readwrite' });
        if (permission === 'granted') return handle;

        // Try to request permission again
        const newPermission = await handle.requestPermission({ mode: 'readwrite' });
        if (newPermission === 'granted') return handle;

        return null;
    } catch (err) {
        console.warn('[Workspace] Could not retrieve directory handle:', err);
        return null;
    }
}

/**
 * Save a file to the workspace directory
 * @param {string} fileName - Name of the file
 * @param {Blob|ArrayBuffer|Uint8Array} data - File content
 * @returns {FileSystemFileHandle} - Handle to the saved file
 */
export async function saveFileToWorkspace(dirHandle, fileName, data) {
    // Create or overwrite the file
    const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(data);
    await writable.close();
    return fileHandle;
}

/**
 * Read a file from the workspace directory
 * @param {FileSystemDirectoryHandle} dirHandle
 * @param {string} fileName
 * @returns {File} - The file object
 */
export async function readFileFromWorkspace(dirHandle, fileName) {
    try {
        const fileHandle = await dirHandle.getFileHandle(fileName);
        const file = await fileHandle.getFile();
        return file;
    } catch (err) {
        if (err.name === 'NotFoundError') {
            return null;
        }
        throw err;
    }
}

/**
 * Check if a file exists in the workspace
 */
export async function fileExistsInWorkspace(dirHandle, fileName) {
    try {
        await dirHandle.getFileHandle(fileName);
        return true;
    } catch {
        return false;
    }
}

/**
 * Get the workspace directory name
 */
export async function getWorkspaceName() {
    const handle = await getWorkspaceDirectory();
    return handle ? handle.name : null;
}

/**
 * Clear the saved workspace directory
 */
export async function clearWorkspace() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(DIR_HANDLE_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}
