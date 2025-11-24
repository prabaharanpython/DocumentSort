
import React, { useState } from 'react';
import { IconFolder, IconFile, IconSettings, IconPlus, IconTrash, IconUser, IconLogOut, IconX } from './Icons';
import { FolderStructure } from '../types';

interface SidebarProps {
  currentCategory: string | null;
  currentSubFolder: string | null;
  onSelectCategory: (cat: string | null) => void;
  onSelectSubFolder: (catId: string, subId: string) => void;
  counts: Record<string, number>;
  folders: FolderStructure[];
  onUpdateFolders: (folders: FolderStructure[]) => void;
  onMoveDocument: (docId: string, category: string, subFolder: string) => void;
  user: { username: string } | null;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentCategory, 
  currentSubFolder,
  onSelectCategory, 
  onSelectSubFolder,
  counts, 
  folders, 
  onUpdateFolders,
  onMoveDocument,
  user,
  onLogout,
  isOpen,
  onClose
}) => {
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [dragTarget, setDragTarget] = useState<{id: string, sub?: string} | null>(null);
  
  // Form State
  const [editName, setEditName] = useState('');
  const [editSubs, setEditSubs] = useState('');

  const startEdit = (folder: FolderStructure) => {
    setEditingFolderId(folder.id);
    setEditName(folder.name);
    setEditSubs(folder.subFolders.join(', '));
    setIsCreating(false);
  };

  const startCreate = () => {
    setEditingFolderId(null);
    setEditName('');
    setEditSubs('general');
    setIsCreating(true);
  };

  const saveFolder = () => {
    const subsArray = editSubs.split(',').map(s => s.trim()).filter(s => s.length > 0);
    
    if (isCreating) {
        // Create Logic
        const newId = editName.toLowerCase().replace(/\s+/g, '-');
        if (!newId) return;
        
        const newFolder: FolderStructure = {
            id: newId || `folder-${Date.now()}`,
            name: editName || 'New Folder',
            subFolders: subsArray.length > 0 ? subsArray : ['general']
        };
        onUpdateFolders([...folders, newFolder]);
    } else if (editingFolderId) {
        // Update Logic
        const updated = folders.map(f => {
            if (f.id === editingFolderId) {
                return { ...f, name: editName, subFolders: subsArray.length > 0 ? subsArray : ['general'] };
            }
            return f;
        });
        onUpdateFolders(updated);
    }
    
    setEditingFolderId(null);
    setIsCreating(false);
  };

  const deleteFolder = (id: string) => {
    if (confirm("Delete this folder? Documents inside will be hidden until moved.")) {
        onUpdateFolders(folders.filter(f => f.id !== id));
        if (currentCategory === id) onSelectCategory(null);
    }
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent, id: string, sub?: string) => {
      e.preventDefault();
      e.stopPropagation();
      setDragTarget({ id, sub });
  };

  const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      // Simple debounce or check relatedTarget could go here, but simple reset works for now
  };

  const handleDrop = (e: React.DragEvent, categoryId: string, subFolder: string) => {
      e.preventDefault();
      e.stopPropagation();
      setDragTarget(null);
      const docId = e.dataTransfer.getData("docId");
      if (docId) {
          onMoveDocument(docId, categoryId, subFolder);
      }
  };

  const handleNavigation = (action: () => void) => {
      action();
      if (window.innerWidth < 768) { // Is mobile
          onClose();
      }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity"
            onClick={onClose}
        />
      )}

      <div 
        className={`bg-slate-900 text-slate-300 h-full flex flex-col border-r border-slate-800 shadow-2xl z-40
            fixed top-0 left-0 w-64 transform transition-transform duration-300 ease-in-out md:static md:transform-none
            ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="p-6 pb-8 flex justify-between items-center">
          <h1 className="text-xl font-bold text-white flex items-center gap-3 tracking-tight">
            <div className="bg-brand-500 p-1.5 rounded-lg text-white shadow-lg shadow-brand-500/30">
               <IconFile className="w-5 h-5" />
            </div>
            DocuSort
          </h1>
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
              <IconX className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar" onDragLeave={() => setDragTarget(null)}>
          <button
            onClick={() => handleNavigation(() => onSelectCategory(null))}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              currentCategory === null 
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-900/20' 
                  : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-3">
              <IconFolder className={currentCategory === null ? 'text-white' : 'text-slate-500'} /> 
              All Documents
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                currentCategory === null ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-500'
            }`}>
              {Object.values(counts).reduce((a, b) => a + b, 0)}
            </span>
          </button>

          <div className="pt-6 pb-2 px-2 flex items-center justify-between group">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">My Folders</span>
              <button 
                  onClick={startCreate} 
                  className="p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-white transition" 
                  title="Create New Folder"
              >
                  <IconPlus className="w-3.5 h-3.5" />
              </button>
          </div>

          {/* Create New Folder Form */}
          {isCreating && (
              <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 mb-2 space-y-2 animate-fade-in-down">
                  <input 
                      autoFocus
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:border-brand-500 outline-none transition-colors"
                      placeholder="Folder Name"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                  />
                  <input 
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:border-brand-500 outline-none transition-colors"
                      placeholder="Sub-folders (comma sep)"
                      value={editSubs}
                      onChange={e => setEditSubs(e.target.value)}
                  />
                  <div className="flex gap-2 mt-1">
                      <button onClick={saveFolder} className="flex-1 bg-brand-600 hover:bg-brand-500 text-white text-xs py-1.5 rounded font-medium transition-colors">Save</button>
                      <button onClick={() => setIsCreating(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs py-1.5 rounded font-medium transition-colors">Cancel</button>
                  </div>
              </div>
          )}

          {/* Folder List */}
          {folders.map((folder) => {
              const isDragOverFolder = dragTarget?.id === folder.id && !dragTarget?.sub;
              const isDragOverAnySub = dragTarget?.id === folder.id;
              const isSelected = currentCategory === folder.id;

              return (
                <div key={folder.id} className="space-y-0.5 relative group">
                  
                  {editingFolderId === folder.id ? (
                       <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 mb-2 space-y-2 animate-fade-in">
                          <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-semibold text-slate-400">Edit {folder.name}</span>
                              <button onClick={() => deleteFolder(folder.id)} className="text-red-400 hover:text-red-300 p-1 hover:bg-slate-700 rounded transition"><IconTrash className="w-3 h-3"/></button>
                          </div>
                          <input 
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:border-brand-500 outline-none"
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              placeholder="Name"
                          />
                           <textarea 
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:border-brand-500 outline-none resize-none"
                              value={editSubs}
                              onChange={e => setEditSubs(e.target.value)}
                              placeholder="aadhaar, voter..."
                              rows={2}
                          />
                          <div className="flex gap-2 pt-1">
                              <button onClick={saveFolder} className="flex-1 bg-brand-600 hover:bg-brand-500 text-white text-xs py-1.5 rounded font-medium">Update</button>
                              <button onClick={() => setEditingFolderId(null)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs py-1.5 rounded font-medium">Cancel</button>
                          </div>
                      </div>
                  ) : (
                      <>
                          {/* Main Folder Item */}
                          <button
                              onClick={() => handleNavigation(() => onSelectCategory(folder.id))}
                              onDragOver={(e) => handleDragOver(e, folder.id)}
                              onDrop={(e) => handleDrop(e, folder.id, folder.subFolders[0] || 'general')}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all group/item border ${
                                  isDragOverFolder 
                                      ? 'bg-brand-900/40 border-brand-500/50 scale-[1.02] shadow-lg z-10' 
                                      : isSelected && currentSubFolder === null 
                                          ? 'bg-slate-800 text-white border-transparent shadow-sm' 
                                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border-transparent'
                              }`}
                          >
                              <span className="flex items-center gap-3">
                                  <span className={`w-2 h-2 rounded-full shadow-sm ${
                                  folder.id === 'identity' ? 'bg-purple-400 shadow-purple-500/50' :
                                  folder.id === 'financial' ? 'bg-emerald-400 shadow-emerald-500/50' : 
                                  folder.id === 'education' ? 'bg-orange-400 shadow-orange-500/50' : 'bg-slate-500'
                                  }`}></span>
                                  <span className="font-medium truncate max-w-[120px]">{folder.name}</span>
                              </span>
                              <div className="flex items-center gap-2">
                                   {counts[folder.id] > 0 && (
                                      <span className={`text-[10px] font-bold ${isSelected ? 'text-slate-400' : 'text-slate-600'}`}>{counts[folder.id]}</span>
                                  )}
                                  <span 
                                      onClick={(e) => { e.stopPropagation(); startEdit(folder); }}
                                      className="opacity-0 group-hover/item:opacity-100 p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-white transition-all transform hover:scale-110"
                                      title="Settings"
                                  >
                                      <IconSettings className="w-3.5 h-3.5" />
                                  </span>
                              </div>
                          </button>
                          
                          {/* Sub Folders List */}
                          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isDragOverAnySub || isSelected ? 'max-h-96 opacity-100 mt-1 mb-2' : 'max-h-0 opacity-0'}`}>
                              <div className="pl-4 space-y-0.5 border-l border-slate-800 ml-4 py-1">
                                  {folder.subFolders.map(sub => {
                                      const isDragOverSub = dragTarget?.id === folder.id && dragTarget?.sub === sub;
                                      const isSubSelected = isSelected && currentSubFolder === sub;
                                      
                                      return (
                                          <button 
                                              key={sub} 
                                              onClick={() => handleNavigation(() => onSelectSubFolder(folder.id, sub))}
                                              onDragOver={(e) => handleDragOver(e, folder.id, sub)}
                                              onDrop={(e) => handleDrop(e, folder.id, sub)}
                                              className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-all capitalize truncate flex items-center gap-2 relative ${
                                                  isDragOverSub
                                                      ? 'bg-brand-500 text-white scale-105 pl-5 shadow-md'
                                                      : isSubSelected
                                                          ? 'text-brand-400 bg-brand-900/10 font-medium' 
                                                          : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                                              }`}
                                          >
                                              <div className={`w-1 h-1 rounded-full transition-colors ${isSubSelected ? 'bg-brand-400' : 'bg-transparent'}`}></div>
                                              {sub}
                                          </button>
                                      );
                                  })}
                              </div>
                          </div>
                      </>
                  )}
                </div>
              );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50 space-y-3">
          {user && (
              <div className="flex items-center gap-3 px-2">
                  <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white">
                      <IconUser className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{user.username}</p>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Online
                      </p>
                  </div>
                  <button onClick={onLogout} className="text-slate-500 hover:text-red-400 p-1.5 hover:bg-slate-800 rounded transition-colors" title="Log Out">
                      <IconLogOut className="w-4 h-4" />
                  </button>
              </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
