import { StoredDocument } from '../types';

const DB_NAME = 'DocuSortDB';
const STORE_NAME = 'documents';
const DB_VERSION = 2; // Incremented for schema change

class DocumentDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('category', 'category', { unique: false });
          store.createIndex('docType', 'docType', { unique: false });
          store.createIndex('userId', 'userId', { unique: false });
        } else {
            // Upgrade existing store
            const store = (event.target as IDBOpenDBRequest).transaction?.objectStore(STORE_NAME);
            if (store && !store.indexNames.contains('userId')) {
                store.createIndex('userId', 'userId', { unique: false });
            }
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };
    });
  }

  async saveDocument(doc: StoredDocument): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(doc);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updateDocument(doc: StoredDocument): Promise<void> {
    return this.saveDocument(doc);
  }

  async getDocuments(userId: string): Promise<StoredDocument[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('userId');
      const request = index.getAll(IDBKeyRange.only(userId));

      request.onsuccess = () => {
        const res = request.result as StoredDocument[];
        // Sort by upload date desc
        res.sort((a, b) => b.uploadDate - a.uploadDate);
        resolve(res);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteDocument(id: string): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

export const dbService = new DocumentDB();