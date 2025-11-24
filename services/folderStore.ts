import { FolderStructure, DefaultCategories } from '../types';

const getStorageKey = (userId: string) => `docusort_folders_${userId}`;

const DEFAULT_FOLDERS: FolderStructure[] = [
  { id: DefaultCategories.IDENTITY, name: 'Identity', subFolders: ['aadhaar', 'voter', 'passport'] },
  { id: DefaultCategories.FINANCIAL, name: 'Financial', subFolders: ['pan', 'bank', 'tax'] },
  { id: DefaultCategories.EDUCATION, name: 'Education', subFolders: ['certificates', 'degrees'] },
  { id: DefaultCategories.UNCATEGORIZED, name: 'Uncategorized', subFolders: ['general'] },
];

export const folderStore = {
  getFolders(userId: string): FolderStructure[] {
    const key = getStorageKey(userId);
    const stored = localStorage.getItem(key);
    if (!stored) {
      this.saveFolders(userId, DEFAULT_FOLDERS);
      return DEFAULT_FOLDERS;
    }
    return JSON.parse(stored);
  },

  saveFolders(userId: string, folders: FolderStructure[]) {
    const key = getStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(folders));
  },

  addFolder(userId: string, name: string): FolderStructure[] {
    const folders = this.getFolders(userId);
    const newId = name.toLowerCase().replace(/\s+/g, '-');
    if (folders.find(f => f.id === newId)) return folders; // No duplicates

    const newFolder: FolderStructure = {
      id: newId,
      name: name,
      subFolders: ['general']
    };
    const updated = [...folders, newFolder];
    this.saveFolders(userId, updated);
    return updated;
  },

  updateFolder(userId: string, id: string, name: string, subFolders: string[]): FolderStructure[] {
    const folders = this.getFolders(userId);
    const updated = folders.map(f => {
      if (f.id === id) {
        return { ...f, name, subFolders };
      }
      return f;
    });
    this.saveFolders(userId, updated);
    return updated;
  },

  deleteFolder(userId: string, id: string): FolderStructure[] {
    const folders = this.getFolders(userId);
    const updated = folders.filter(f => f.id !== id);
    this.saveFolders(userId, updated);
    return updated;
  }
};