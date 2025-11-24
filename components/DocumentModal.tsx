
import React, { useState } from 'react';
import { StoredDocument, FolderStructure } from '../types';
import { IconX, IconTrash, IconPlus, IconEdit, IconDownload, IconPrinter } from './Icons';

interface DocumentModalProps {
  doc: StoredDocument;
  folders: FolderStructure[];
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (doc: StoredDocument) => void;
}

const DocumentModal: React.FC<DocumentModalProps> = ({ doc, folders, onClose, onDelete, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDoc, setEditedDoc] = useState<StoredDocument>(doc);
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');

  const handleSave = () => {
    onUpdate(editedDoc);
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setEditedDoc(prev => ({
        ...prev,
        extractedData: {
            ...prev.extractedData,
            [field]: value
        }
    }));
  };

  const handleCustomFieldChange = (key: string, value: string) => {
      setEditedDoc(prev => ({
          ...prev,
          extractedData: {
              ...prev.extractedData,
              customFields: {
                  ...(prev.extractedData.customFields || {}),
                  [key]: value
              }
          }
      }));
  };

  const addCustomField = () => {
      if (newFieldKey && newFieldValue) {
          handleCustomFieldChange(newFieldKey, newFieldValue);
          setNewFieldKey('');
          setNewFieldValue('');
      }
  };

  const deleteCustomField = (key: string) => {
      const newCustom = { ...editedDoc.extractedData.customFields };
      delete newCustom[key];
      setEditedDoc(prev => ({
          ...prev,
          extractedData: {
              ...prev.extractedData,
              customFields: newCustom
          }
      }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newCatId = e.target.value;
      const folder = folders.find(f => f.id === newCatId);
      // Default to first subfolder if available
      const newSub = folder && folder.subFolders.length > 0 ? folder.subFolders[0] : 'general';
      
      setEditedDoc(prev => ({
          ...prev,
          category: newCatId,
          subFolder: newSub
      }));
  };

  // Download Handlers
  const downloadImage = () => {
      const link = document.createElement('a');
      link.href = doc.thumbnail;
      link.download = `${doc.fileName}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const downloadJSON = () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(doc.extractedData, null, 2));
      const link = document.createElement('a');
      link.href = dataStr;
      link.download = `${doc.fileName.split('.')[0]}_data.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const convertToPDF = () => {
      // Create a printable window
      const printWindow = window.open('', '', 'height=800,width=800');
      if (!printWindow) return;

      const htmlContent = `
        <html>
        <head>
            <title>${doc.docType} - ${doc.extractedData.name || 'Document'}</title>
            <style>
                body { font-family: 'Helvetica', sans-serif; padding: 40px; }
                .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; }
                .title { font-size: 24px; font-weight: bold; }
                .date { color: #666; font-size: 14px; }
                .image-container { text-align: center; margin-bottom: 30px; border: 1px solid #ddd; padding: 10px; background: #f9f9f9; }
                .image-container img { max-width: 100%; max-height: 500px; }
                .details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .field { margin-bottom: 15px; }
                .label { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 1px; font-weight: bold; margin-bottom: 4px; display: block; }
                .value { font-size: 16px; color: #000; font-weight: 500; }
                .footer { margin-top: 50px; font-size: 10px; text-align: center; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="title">${doc.docType}</div>
                <div class="date">Uploaded: ${new Date(doc.uploadDate).toLocaleDateString()}</div>
            </div>

            <div class="image-container">
                <img src="${doc.thumbnail}" />
            </div>

            <h3>Extracted Details</h3>
            <div class="details">
                ${Object.entries(doc.extractedData)
                    .filter(([key]) => key !== 'customFields' && typeof doc.extractedData[key] === 'string')
                    .map(([key, value]) => `
                        <div class="field">
                            <span class="label">${key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <span class="value">${value}</span>
                        </div>
                    `).join('')}
                
                ${doc.extractedData.customFields ? Object.entries(doc.extractedData.customFields).map(([key, value]) => `
                        <div class="field">
                            <span class="label">${key}</span>
                            <span class="value">${value}</span>
                        </div>
                    `).join('') : ''}
            </div>

            <div class="footer">
                Generated by DocuSort
            </div>
            <script>
                window.onload = function() { window.print(); window.close(); }
            </script>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
  };

  const currentFolderStruct = folders.find(f => f.id === editedDoc.category);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 md:p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-6xl h-full md:h-[90vh] flex flex-col md:flex-row overflow-hidden shadow-2xl relative">
        
        {/* Left Side: Image Preview (Top on Mobile) */}
        <div className="w-full md:w-1/2 h-56 md:h-full bg-slate-100 flex flex-col border-b md:border-b-0 md:border-r border-slate-200 relative group bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] shrink-0">
             <div className="flex-1 flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
                <img 
                    src={doc.thumbnail} 
                    alt={doc.fileName} 
                    className="max-w-full max-h-full object-contain shadow-xl rounded-md transition-transform duration-300 md:group-hover:scale-[1.02]"
                />
            </div>
            
            {/* Floating Toolbar */}
            <div className="absolute top-2 right-2 md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:top-auto md:right-auto bg-white/90 backdrop-blur-md border border-slate-200/50 shadow-lg rounded-full px-2 py-1 md:px-4 md:py-2 flex gap-1 md:gap-2 transition-all md:opacity-0 md:group-hover:opacity-100 md:translate-y-2 md:group-hover:translate-y-0">
                <button 
                    onClick={downloadImage}
                    className="p-1.5 md:p-2 text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-full transition"
                    title="Download Image"
                >
                    <IconDownload className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <div className="w-px h-5 md:h-6 bg-slate-200 my-auto"></div>
                <button 
                    onClick={downloadJSON}
                    className="p-1.5 md:p-2 text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-full transition"
                    title="Download JSON Data"
                >
                    <span className="font-bold text-[10px] md:text-xs tracking-tighter">JSON</span>
                </button>
                 <button 
                    onClick={convertToPDF}
                    className="p-1.5 md:p-2 text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-full transition"
                    title="Print / Save as PDF"
                >
                    <IconPrinter className="w-4 h-4 md:w-5 md:h-5" />
                </button>
            </div>

            {/* Close Button for Mobile Overlay */}
             <button 
                onClick={onClose}
                className="md:hidden absolute top-2 left-2 p-2 bg-black/50 text-white rounded-full z-10"
             >
                <IconX className="w-5 h-5" />
            </button>
        </div>

        {/* Right Side: Details (Bottom on Mobile) */}
        <div className="w-full md:w-1/2 flex flex-col bg-white h-full overflow-hidden">
          
          {/* Header */}
          <div className="px-4 py-4 md:px-8 md:py-6 border-b border-slate-100 flex justify-between items-start shrink-0">
             <div className="flex-1 min-w-0 pr-4">
                 <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        doc.category === 'identity' ? 'bg-purple-50 text-purple-600 border-purple-100' : 
                        doc.category === 'financial' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        doc.category === 'education' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                    }`}>
                        {folders.find(f => f.id === doc.category)?.name || doc.category}
                    </span>
                    <span className="text-slate-300">/</span>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        {doc.subFolder}
                    </span>
                 </div>

                 {isEditing ? (
                    <input 
                        value={editedDoc.docType}
                        onChange={(e) => setEditedDoc({...editedDoc, docType: e.target.value})}
                        className="text-xl md:text-2xl font-bold text-slate-900 border-b-2 border-brand-200 focus:border-brand-500 focus:outline-none w-full bg-transparent placeholder-slate-300"
                        placeholder="Document Type"
                        autoFocus
                    />
                 ) : (
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">{doc.docType}</h2>
                 )}
                 <p className="text-xs text-slate-400 mt-1">
                    Uploaded on {new Date(doc.uploadDate).toLocaleDateString()}
                 </p>
             </div>
             
             {/* Right Header Actions (Close & Edit) */}
             <div className="flex items-center gap-1">
                 {!isEditing && (
                     <button 
                        onClick={() => setIsEditing(true)}
                        className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-full transition"
                        title="Edit Details"
                     >
                        <IconEdit className="w-5 h-5" />
                     </button>
                 )}
                 <button 
                    onClick={onClose}
                    className="hidden md:block p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition"
                    title="Close"
                 >
                    <IconX className="w-6 h-6" />
                 </button>
             </div>
          </div>

          {/* Scrollable Form Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-6 space-y-6 md:space-y-8 custom-scrollbar">
            
            {/* Folder Selection (Only in Edit Mode) */}
            {isEditing && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                     <div className="flex flex-col">
                        <label className="text-[10px] text-slate-400 uppercase font-bold mb-1">Category</label>
                        <select 
                            value={editedDoc.category} 
                            onChange={handleCategoryChange}
                            className="bg-white border border-slate-200 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                        >
                            {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                     </div>
                     <div className="flex flex-col">
                        <label className="text-[10px] text-slate-400 uppercase font-bold mb-1">Sub-Folder</label>
                        <select 
                            value={editedDoc.subFolder} 
                            onChange={(e) => setEditedDoc({...editedDoc, subFolder: e.target.value})}
                            className="bg-white border border-slate-200 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                        >
                            {currentFolderStruct?.subFolders.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                     </div>
                </div>
            )}

            {/* Standard Fields */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-slate-100">
                    Extracted Details
                </h3>
                
                <div className="space-y-4">
                    {isEditing ? (
                        <>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">Name</label>
                                <input 
                                    type="text" 
                                    value={editedDoc.extractedData.name || ''} 
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                    placeholder="Enter Name"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">ID Number</label>
                                <input 
                                    type="text" 
                                    value={editedDoc.extractedData.idNumber || ''} 
                                    onChange={(e) => handleInputChange('idNumber', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                    placeholder="Enter ID Number"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">Date of Birth</label>
                                <input 
                                    type="text" 
                                    value={editedDoc.extractedData.dob || ''} 
                                    onChange={(e) => handleInputChange('dob', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                    placeholder="DD/MM/YYYY"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">Address</label>
                                <textarea 
                                    value={editedDoc.extractedData.address || ''} 
                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none h-24 resize-none transition-all"
                                    placeholder="Full Address"
                                />
                            </div>
                        </>
                    ) : (
                        ['name', 'idNumber', 'dob', 'address'].map(key => {
                            if (!editedDoc.extractedData[key]) return null;
                            return (
                                <div key={key} className="group relative pl-3 border-l-2 border-transparent hover:border-brand-300 transition-all">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </span>
                                    <span className="text-sm font-medium text-slate-800 break-words leading-relaxed block">
                                        {editedDoc.extractedData[key]}
                                    </span>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Custom Fields */}
            <div className="space-y-4">
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-slate-100">
                    Additional Fields
                </h3>

                <div className="space-y-3">
                    {/* Existing Custom Fields */}
                    {editedDoc.extractedData.customFields && Object.entries(editedDoc.extractedData.customFields).map(([key, value]) => (
                        <div key={key} className="flex gap-3 items-center group">
                            {isEditing ? (
                                <>
                                    <div className="w-1/3 p-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 truncate">
                                        {key}
                                    </div>
                                    <input 
                                        type="text"
                                        value={value}
                                        onChange={(e) => handleCustomFieldChange(key, e.target.value)}
                                        className="flex-1 p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                    />
                                    <button onClick={() => deleteCustomField(key)} className="p-2 text-slate-400 hover:text-red-500 transition">
                                        <IconTrash className="w-4 h-4"/>
                                    </button>
                                </>
                            ) : (
                                <div className="w-full p-3 bg-slate-50/50 rounded-lg border border-slate-100 hover:border-brand-200 transition-colors">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">{key}</span>
                                    <span className="text-sm font-medium text-slate-800">{value}</span>
                                </div>
                            )}
                        </div>
                    ))}
                    
                    {/* Add New Field UI */}
                    {isEditing && (
                        <div className="flex gap-2 items-center mt-4 p-3 bg-brand-50/30 rounded-lg border border-brand-100 border-dashed group hover:bg-brand-50/60 transition-colors">
                             <input 
                                type="text"
                                placeholder="e.g. Expiry"
                                value={newFieldKey}
                                onChange={e => setNewFieldKey(e.target.value)}
                                className="w-1/3 px-3 py-2 border border-slate-200 bg-white rounded-lg text-xs font-medium focus:ring-2 focus:ring-brand-500 outline-none"
                             />
                             <input 
                                type="text"
                                placeholder="Value"
                                value={newFieldValue}
                                onChange={e => setNewFieldValue(e.target.value)}
                                className="flex-1 px-3 py-2 border border-slate-200 bg-white rounded-lg text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                             />
                             <button 
                                onClick={addCustomField}
                                disabled={!newFieldKey || !newFieldValue}
                                className="p-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all active:scale-95"
                                title="Add Field"
                             >
                                 <IconPlus className="w-4 h-4" />
                             </button>
                        </div>
                    )}
                </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="p-4 md:p-6 border-t border-slate-100 bg-slate-50 flex gap-4 shrink-0 pb-safe">
             {isEditing ? (
                 <>
                    <button 
                        onClick={() => { setIsEditing(false); setEditedDoc(doc); }}
                        className="flex-1 py-2.5 px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-lg text-sm font-semibold transition-all shadow-sm"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex-1 py-2.5 px-4 bg-brand-600 text-white hover:bg-brand-700 rounded-lg text-sm font-semibold transition-all shadow-md shadow-brand-500/20 active:scale-[0.98]"
                    >
                        Save
                    </button>
                 </>
             ) : (
                 <button 
                    onClick={() => onDelete(doc.id)}
                    className="w-full py-2.5 px-4 bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 group"
                 >
                    <IconTrash className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Delete Document
                 </button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentModal;
