
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import UploadArea from './components/UploadArea';
import DocumentModal from './components/DocumentModal';
import Auth from './components/Auth'; // Import Auth
import { IconSearch, IconFolder, IconGrid, IconList, IconSort, IconDots, IconTrash, IconFile, IconMenu } from './components/Icons';
import { StoredDocument, FolderStructure } from './types';
import { dbService } from './services/db';
import { folderStore } from './services/folderStore';
import { analyzeDocument } from './services/ocrService';
import { authService } from './services/authService'; // Import Service

// -- Mini Components --

const Toast = ({ message, onClose }: { message: string, onClose: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg text-sm flex items-center gap-3 z-50 animate-fade-in-up">
            <div className="bg-brand-500 w-2 h-2 rounded-full"></div>
            {message}
        </div>
    );
};

const ContextMenu = ({ x, y, onDelete, onOpen, onRename, onClose }: any) => {
    // Click outside to close
    useEffect(() => {
        const handleClick = () => onClose();
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, [onClose]);

    return (
        <div 
            className="fixed bg-white rounded-lg shadow-xl border border-slate-200 w-40 py-1 z-50 overflow-hidden"
            style={{ top: y, left: x }}
            onClick={(e) => e.stopPropagation()} // Prevent close on self click
        >
            <button onClick={onOpen} className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-brand-600">
                Open
            </button>
            <button onClick={onRename} className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-brand-600">
                Rename
            </button>
            <div className="border-t border-slate-100 my-1"></div>
            <button onClick={onDelete} className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50">
                Delete
            </button>
        </div>
    );
};

const App = () => {
  const [currentUser, setCurrentUser] = useState<{username: string} | null>(null);
  
  // App Data State
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [folders, setFolders] = useState<FolderStructure[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Navigation State
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubFolder, setSelectedSubFolder] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar
  
  const [selectedDoc, setSelectedDoc] = useState<StoredDocument | null>(null);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, docId: string } | null>(null);

  // -- Auth Check --
  useEffect(() => {
      const user = authService.getUser();
      if (user) {
          handleLogin(user.username);
      }
  }, []);

  const loadData = async (username: string) => {
    try {
      const docs = await dbService.getDocuments(username);
      setDocuments(docs);
      
      const loadedFolders = folderStore.getFolders(username);
      setFolders(loadedFolders);
    } catch (e) {
      console.error("Failed to load data", e);
    }
  };

  const handleLogin = (username: string) => {
      setCurrentUser({ username });
      loadData(username);
  };

  const handleLogout = () => {
      authService.logout();
      setCurrentUser(null);
      setDocuments([]);
      setFolders([]);
      setSelectedDoc(null);
  };

  const showToast = (msg: string) => setToastMsg(msg);

  const handleUpdateFolders = (newFolders: FolderStructure[]) => {
      if (!currentUser) return;
      setFolders(newFolders);
      folderStore.saveFolders(currentUser.username, newFolders);
  };

  const handleCategorySelect = (catId: string | null) => {
      setSelectedCategory(catId);
      setSelectedSubFolder(null); 
  };

  const handleSubFolderSelect = (catId: string, subId: string) => {
      setSelectedCategory(catId);
      setSelectedSubFolder(subId);
  };

  // -- Actions --

  const handleUpload = async (file: File) => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error("File too large. Max 5MB.");

      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1];

        const analysis = await analyzeDocument(base64Data, file.type);
        
        // Ensure category exists
        const categoryId = folders.find(f => f.id === analysis.category) ? analysis.category : 'uncategorized';
        
        const newDoc: StoredDocument = {
          id: crypto.randomUUID(),
          userId: currentUser.username,
          fileName: file.name,
          fileType: file.type,
          uploadDate: Date.now(),
          thumbnail: base64,
          docType: analysis.docType,
          category: categoryId,
          subFolder: analysis.subFolder,
          extractedData: analysis.extractedData
        };

        await dbService.saveDocument(newDoc);
        await loadData(currentUser.username); // Refresh
        setLoading(false);
        showToast(`Uploaded ${newDoc.fileName}`);
      };

    } catch (e: any) {
      setError(e.message || "Upload failed");
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!currentUser) return;
    if (confirm("Are you sure you want to delete this document? This action cannot be undone.")) {
        try {
            await dbService.deleteDocument(id);
            // Critical: Close modal if the deleted doc is open
            if (selectedDoc && selectedDoc.id === id) {
                setSelectedDoc(null);
            }
            
            // Optimistic update - update local state immediately
            setDocuments(prev => prev.filter(d => d.id !== id));
            
            showToast("Document deleted successfully");
        } catch (e) {
            console.error("Delete failed", e);
            setError("Failed to delete document");
        }
    }
  };

  const handleUpdateDocument = async (updatedDoc: StoredDocument) => {
    if (!currentUser) return;
    try {
        await dbService.updateDocument(updatedDoc);
        
        // Update local state directly to reflect changes immediately
        setDocuments(prev => prev.map(d => d.id === updatedDoc.id ? updatedDoc : d));
        
        // Only update selectedDoc if it matches the current one (modal open)
        // This prevents the modal from popping open during rename if it wasn't open
        if (selectedDoc && selectedDoc.id === updatedDoc.id) {
            setSelectedDoc(updatedDoc); 
        }

        showToast("Changes saved");
    } catch (e) {
        console.error("Failed to update document", e);
        setError("Failed to save changes");
    }
  };

  const handleMoveDocument = async (docId: string, category: string, subFolder: string) => {
      if (!currentUser) return;
      const doc = documents.find(d => d.id === docId);
      if (!doc) return;

      if (doc.category === category && doc.subFolder === subFolder) return;

      const updated = { ...doc, category, subFolder };
      await dbService.updateDocument(updated);
      
      // Optimistic update
      setDocuments(prev => prev.map(d => d.id === docId ? updated : d));
      showToast(`Moved to ${folders.find(f => f.id === category)?.name || category} / ${subFolder}`);
  };

  // -- Drag & Drop Source --

  const onDragStart = (e: React.DragEvent, doc: StoredDocument) => {
      e.dataTransfer.setData("docId", doc.id);
      e.dataTransfer.effectAllowed = "move";
  };

  // -- Context Menu Logic --
  
  const handleContextMenu = (e: React.MouseEvent, docId: string) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, docId });
  };

  // -- Filter & Sort --

  const filteredDocs = useMemo(() => {
    let docs = documents.filter(doc => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = doc.fileName.toLowerCase().includes(searchLower) ||
                            (typeof doc.docType === 'string' && doc.docType.toLowerCase().includes(searchLower)) ||
                            Object.values(doc.extractedData).some(val => 
                                typeof val === 'string' && val.toLowerCase().includes(searchLower)
                            ) ||
                            (doc.extractedData.customFields && Object.values(doc.extractedData.customFields).some(val => 
                                val.toLowerCase().includes(searchLower)
                            ));
      
      const matchesCategory = selectedCategory ? doc.category === selectedCategory : true;
      const matchesSubFolder = selectedSubFolder ? doc.subFolder === selectedSubFolder : true;

      return matchesSearch && matchesCategory && matchesSubFolder;
    });

    // Sorting
    return docs.sort((a, b) => {
        if (sortBy === 'date') return b.uploadDate - a.uploadDate;
        if (sortBy === 'name') return (a.extractedData.name || a.fileName).localeCompare(b.extractedData.name || b.fileName);
        return 0;
    });
  }, [documents, searchQuery, selectedCategory, selectedSubFolder, sortBy]);

  // Folder Counts
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    folders.forEach(f => c[f.id] = 0);
    c['uncategorized'] = 0; 

    documents.forEach(doc => {
        if (c[doc.category] !== undefined) {
            c[doc.category]++;
        } else {
            c['uncategorized'] = (c['uncategorized'] || 0) + 1;
        }
    });
    return c;
  }, [documents, folders]);

  const currentFolder = folders.find(f => f.id === selectedCategory);

  // -- Authentication Guard --
  if (!currentUser) {
      return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      <Sidebar 
        currentCategory={selectedCategory}
        currentSubFolder={selectedSubFolder}
        onSelectCategory={handleCategorySelect}
        onSelectSubFolder={handleSubFolderSelect}
        counts={counts}
        folders={folders}
        onUpdateFolders={handleUpdateFolders}
        onMoveDocument={handleMoveDocument}
        user={currentUser}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-3 md:py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 z-10">
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => setSidebarOpen(true)}
                    className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg -ml-2"
                >
                    <IconMenu className="w-6 h-6" />
                </button>
                <div>
                    <h2 className="text-lg md:text-xl font-bold text-slate-800 flex items-center gap-2 truncate">
                        {currentFolder ? currentFolder.name : (selectedCategory ? 'Unknown Folder' : 'All Documents')}
                        {selectedSubFolder && (
                            <span className="hidden sm:inline text-sm font-normal text-slate-400"> / {selectedSubFolder}</span>
                        )}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">{filteredDocs.length} documents found</p>
                </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-4 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
                {/* Search */}
                <div className="relative flex-1 md:w-64 min-w-[160px]">
                    <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="h-6 w-px bg-slate-200 hidden md:block"></div>

                {/* Controls */}
                <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200 shrink-0">
                     <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}
                        title="Grid View"
                     >
                         <IconGrid className="w-4 h-4" />
                     </button>
                     <button 
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}
                        title="List View"
                     >
                         <IconList className="w-4 h-4" />
                     </button>
                </div>
                
                <button 
                    onClick={() => setSortBy(sortBy === 'date' ? 'name' : 'date')}
                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg flex items-center gap-2 text-sm font-medium transition shrink-0"
                >
                    <IconSort className="w-4 h-4" />
                    <span className="hidden sm:inline">{sortBy === 'date' ? 'Date' : 'Name'}</span>
                </button>
            </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50">
            
            <div className="mb-6 md:mb-10 max-w-2xl mx-auto">
                <UploadArea onUpload={handleUpload} isProcessing={loading} />
                {error && (
                    <div className="mt-4 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center gap-2 animate-fade-in">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        {error}
                    </div>
                )}
            </div>

            {filteredDocs.length === 0 ? (
                <div className="text-center py-12 md:py-20">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <IconFolder className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-medium">No documents found</p>
                    <p className="text-xs text-slate-400 mt-1">Try uploading or changing folders</p>
                </div>
            ) : (
                <div className={viewMode === 'grid' 
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6" 
                    : "space-y-2"
                }>
                    {filteredDocs.map(doc => (
                        <div 
                            key={doc.id} 
                            draggable
                            onDragStart={(e) => onDragStart(e, doc)}
                            onClick={() => setSelectedDoc(doc)}
                            onContextMenu={(e) => handleContextMenu(e, doc.id)}
                            className={`group bg-white border border-slate-200 hover:border-brand-400 transition-all cursor-pointer relative ${
                                viewMode === 'grid' 
                                ? "rounded-xl shadow-sm hover:shadow-xl hover:-translate-y-1 flex flex-col h-64 overflow-hidden" 
                                : "rounded-lg hover:shadow-md p-3 flex items-center gap-3 md:gap-4"
                            }`}
                        >
                            {/* Grid View Content */}
                            {viewMode === 'grid' && (
                                <>
                                    <div className="h-32 bg-slate-100 relative overflow-hidden flex items-center justify-center p-4 border-b border-slate-50">
                                        <img src={doc.thumbnail} className="max-w-full max-h-full object-contain shadow-sm group-hover:scale-105 transition duration-500" alt="preview" />
                                        <div className="absolute top-2 right-2 flex gap-1">
                                            <span className="bg-black/70 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded font-medium">
                                                {doc.docType}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-4 flex-1 flex flex-col">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                                doc.category === 'identity' ? 'bg-purple-400' : 
                                                doc.category === 'financial' ? 'bg-emerald-400' : 
                                                doc.category === 'education' ? 'bg-orange-400' : 'bg-slate-400'
                                            }`}></span>
                                            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide truncate">
                                                {doc.subFolder}
                                            </span>
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-800 mb-1 truncate leading-tight">
                                            {doc.extractedData.name || doc.fileName}
                                        </h4>
                                        <p className="text-xs text-slate-500 truncate mb-3 font-mono opacity-80">
                                            {doc.extractedData.idNumber || "No ID"}
                                        </p>
                                        <div className="mt-auto flex justify-between items-center pt-3 border-t border-slate-50">
                                            <span className="text-[10px] text-slate-400">{new Date(doc.uploadDate).toLocaleDateString()}</span>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleContextMenu(e, doc.id); }}
                                                className="text-slate-300 hover:text-slate-600 p-1 rounded hover:bg-slate-100"
                                            >
                                                <IconDots className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* List View Content */}
                            {viewMode === 'list' && (
                                <>
                                    <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center shrink-0">
                                         <img src={doc.thumbnail} className="w-full h-full object-cover rounded opacity-80" alt="thumb" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-slate-800 truncate">{doc.extractedData.name || doc.fileName}</h4>
                                        <p className="text-xs text-slate-500 truncate">{doc.docType} • {doc.extractedData.idNumber || "No ID"}</p>
                                    </div>
                                    <div className="hidden sm:flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase border ${
                                            doc.category === 'identity' ? 'bg-purple-50 text-purple-600 border-purple-100' : 
                                            doc.category === 'financial' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                            doc.category === 'education' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                                        }`}>
                                            {doc.subFolder}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-400 hidden sm:block w-24 text-right">
                                        {new Date(doc.uploadDate).toLocaleDateString()}
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleContextMenu(e, doc.id); }}
                                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                                    >
                                        <IconDots className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Floating Components */}
        {selectedDoc && (
            <DocumentModal 
                doc={selectedDoc} 
                folders={folders}
                onClose={() => setSelectedDoc(null)} 
                onDelete={handleDelete}
                onUpdate={handleUpdateDocument}
            />
        )}

        {toastMsg && (
            <Toast message={toastMsg} onClose={() => setToastMsg(null)} />
        )}

        {contextMenu && (
            <ContextMenu 
                x={contextMenu.x} 
                y={contextMenu.y} 
                onDelete={() => { handleDelete(contextMenu.docId); setContextMenu(null); }}
                onOpen={() => { 
                    const doc = documents.find(d => d.id === contextMenu.docId);
                    if (doc) setSelectedDoc(doc);
                    setContextMenu(null);
                }}
                onRename={() => {
                     const doc = documents.find(d => d.id === contextMenu.docId);
                     if (doc) {
                         const newName = prompt("Rename Document:", doc.fileName);
                         if (newName) handleUpdateDocument({...doc, fileName: newName});
                     }
                     setContextMenu(null);
                }}
                onClose={() => setContextMenu(null)}
            />
        )}
      </main>
    </div>
  );
};

export default App;
