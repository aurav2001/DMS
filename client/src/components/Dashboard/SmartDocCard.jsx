import React, { useState } from 'react';
import { 
  FileText, 
  MoreVertical, 
  Download, 
  Share2, 
  Trash, 
  Star,
  FileCode,
  FileImage,
  FileAudio,
  FileVideo,
  Archive,
  File,
  Eye,
  EyeOff,
  X,
  Edit3,
  Check,
  Loader2,
  FileEdit,
  FileSpreadsheet,
  Presentation,
  Monitor,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

import MSWordOnline from './MSWordOnline';
import ExcelEditor from './SpreadsheetEngine';
import PPTEditor from './PresentationEngine';
import OfficeViewer from './OfficeViewer';
import { getDocType, getIconColor, getBgColor } from '../../utils/fileUtils';

const SmartDocCard = ({ doc, onStar, onDelete, onShare, onRefresh }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [viewState, setViewState] = useState({ isOpen: false, url: null });
  const [isEditing, setIsEditing] = useState(false); // For Metadata Rename
  const [isEditorOpen, setIsEditorOpen] = useState(false); // For Full Document Editor
  const [readOnlyMode, setReadOnlyMode] = useState(false);
  const [editData, setEditData] = useState({ title: doc.title });
  const [editLoading, setEditLoading] = useState(false);
  const { user } = useAuth();

  const getIcon = (type = '', fileName = '', title = '') => {
    const docInfo = getDocType(type, fileName, title);
    const colorClass = getIconColor(docInfo.mainType);
    const bgClass = getBgColor(docInfo.mainType);

    if (docInfo.isImage) return <FileImage className={`w-10 h-10 ${colorClass}`} />;
    if (docInfo.isPdf) return <FileText className={`w-10 h-10 ${colorClass}`} />;
    if (docInfo.isExcel) return <div className={`${bgClass} p-2 rounded-lg`}><FileSpreadsheet className={`w-10 h-10 ${colorClass}`} /></div>;
    if (docInfo.isPPT) return <div className={`${bgClass} p-2 rounded-lg`}><Presentation className={`w-10 h-10 ${colorClass}`} /></div>;
    if (docInfo.isWord) return <div className={`${bgClass} p-2 rounded-lg`}><FileText className={`w-10 h-10 ${colorClass}`} /></div>;
    
    const t = (type || '').toLowerCase();
    if (t.includes('video')) return <FileVideo className="w-10 h-10 text-purple-500" />;
    if (t.includes('audio')) return <FileAudio className="w-10 h-10 text-green-500" />;
    if (t.includes('zip') || t.includes('compressed')) return <Archive className="w-10 h-10 text-amber-600" />;
    if (t.includes('javascript') || t.includes('html') || t.includes('css') || t.includes('code')) return <FileCode className="w-10 h-10 text-blue-500" />;
    return <File className="w-10 h-10 text-slate-400" />;
  };

  const formatDate = (date) => new Date(date).toLocaleDateString();

  const uploaderId = typeof doc.uploadedBy === 'object' ? doc.uploadedBy?._id : doc.uploadedBy;
  const isOwner = uploaderId === user?._id || uploaderId === user?.id;
  const isAdmin = user?.role === 'Admin';
  
  const canView = isOwner || isAdmin || doc.permissions?.canView !== false;
  const canDownload = isOwner || isAdmin || doc.permissions?.canDownload !== false;
  const canEdit = isOwner || isAdmin || doc.permissions?.canEdit === true;
  
  // Robust Detection for Editor Support
  const docInfo = getDocType(doc.fileType, doc.fileName, doc.title);
  const { isExcel, isPPT, isWord, isPdf, isEditorSupported } = docInfo;

  const handleOpenEditor = (readOnly = false) => {
    if (isEditorSupported) {
      if (!readOnly) toast.success('Initializing Advanced Editor...', { icon: '⚙️' });
      setReadOnlyMode(readOnly);
      setIsEditorOpen(true);
    } else {
      toast('Opening metadata editor (File format not specialized)', { icon: 'ℹ️' });
      setIsEditing(true);
    }
  };

  const handleSecureAction = async (action) => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const endpoint = action === 'view' ? 'view' : 'download';
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/documents/${endpoint}/${doc._id}`, {
        responseType: 'blob',
        headers: { 'x-auth-token': token }
      });
      const contentType = response.headers['content-type'] || '';
      const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
      
      if (action === 'download') {
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', doc.fileName || doc.title);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        // ROBUST ROUTING: Sniff binary + Fallback to metadata
        const detectType = () => new Promise(resolve => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const arr = (new Uint8Array(reader.result)).subarray(0, 4);
            let header = "";
            for(let i = 0; i < arr.length; i++) {
               header += arr[i].toString(16).padStart(2, '0');
            }
            resolve({
              isModern: header.startsWith("504b"), // PK..
              isLegacy: header.startsWith("d0cf11e0"), // old doc/xls
              isPDF: header.startsWith("2550") // %PDF
            });
          };
          reader.readAsArrayBuffer(response.data);
        });

        const binary = await detectType();
        const info = getDocType(contentType, doc.fileName, doc.title);
        
        const isActuallyOffice = binary.isModern || binary.isLegacy || info.isWord || info.isExcel || info.isPPT;

        if (isActuallyOffice) {
          handleOpenEditor(true);
        } else {
          // Normal fallback for PDFs and Images
          setViewState({ isOpen: true, url, doc });
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Action failed. Denied.');
    }
  };
  
  const handleMainView = (e) => {
    if (e) e.stopPropagation();
    const isOffice = isWord || isExcel || isPPT;
    const isCloudOffice = isOffice && doc.fileUrl?.startsWith('http');

    console.log('[Routing Diagnostic]', { 
      id: doc._id, 
      title: doc.title, 
      isOffice, 
      isCloudOffice, 
      isWord,
      isExcel,
      isPPT,
      fileUrl: doc.fileUrl,
      docInfo 
    });

    // If it's an Office file and has a CLOUD URL, prioritize Microsoft/Google Cloud View
    if (isCloudOffice) {
      setViewState({ isOpen: true, url: null, doc });
    } else if (isOffice) {
      // For Local files, use the internal Premium Previewer (fixed high-fidelity)
      handleOpenEditor(true);
    } else {
      handleSecureAction('view');
    }
  };

  const handleOpenDesktop = async (e) => {
    if (e) e.stopPropagation();
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');
      
      await axios.post(`${API_BASE}/documents/${doc._id}/open-in-desktop`, {}, {
        headers: { 'x-auth-token': token }
      });
      
      toast.success(`Opening ${doc.title} in Desktop...`, { icon: '🚀' });
    } catch (err) {
      console.error('Desktop Open Error:', err);
      toast.error(err.response?.data?.message || 'Failed to open Desktop App');
    }
  };

  const handleUpdateMetadata = async (e) => {
    e.preventDefault();
    try {
      setEditLoading(true);
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      await axios.patch(`${API_BASE}/documents/${doc._id}`, editData);
      toast.success('Document updated');
      setIsEditing(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error('Update failed');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 hover:shadow-2xl transition-all group relative"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="bg-slate-50 dark:bg-slate-800 p-1 rounded-2xl group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 transition-colors">
            {getIcon(doc.fileType, doc.fileName, doc.title)}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {canView && (
              <button 
                onClick={handleMainView} 
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-indigo-500 transition-all" 
                title="View"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            {canDownload && (
              <button onClick={() => handleSecureAction('download')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-emerald-500 transition-all" title="Download">
                <Download className="w-4 h-4" />
              </button>
            )}
            {canEdit && isEditorSupported && (
              <button onClick={handleOpenEditor} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-indigo-600 transition-all shadow-sm" title="Advanced Editor">
                <FileEdit className="w-4 h-4" />
              </button>
            )}
            {canEdit && (
              <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-amber-500 transition-all" title="Rename">
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </div>
          <button onClick={() => setShowOptions(!showOptions)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {isEditing ? (
                <form onSubmit={handleUpdateMetadata} className="flex-1 flex gap-2">
                  <input 
                    autoFocus
                    className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={editData.title}
                    onChange={e => setEditData({...editData, title: e.target.value})}
                  />
                  <button type="submit" disabled={editLoading} className="p-1 text-green-500 hover:bg-green-50 rounded">
                    {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button type="button" onClick={() => setIsEditing(false)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                    <X className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <>
                  <h3 className="font-bold text-slate-900 dark:text-white truncate" title={doc.title}>
                    {doc.title}
                  </h3>
                  {doc.isStarred && <Star className="w-3.5 h-3.5 text-yellow-400 fill-current flex-shrink-0" />}
                </>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">
              {isOwner ? 'Your File' : `Shared by ${doc.uploadedBy?.name || 'Admin'}`}
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2">
            {canView && (
              <button 
                onClick={handleMainView}
                className={`cursor-pointer hover:scale-105 transition-all text-[9px] px-2 py-0.5 rounded-md font-bold flex items-center gap-1 border ${
                  doc.fileUrl?.startsWith('http') 
                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800/50" 
                  : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800/50"
                }`}
              >
                <Eye className="w-2.5 h-2.5" /> {(isWord || isExcel || isPPT) && doc.fileUrl ? 'VIEW (EXTERNAL)' : 'READ (LOCAL)'}
              </button>
            )}
            {canDownload && (
              <button 
                onClick={(e) => { e.stopPropagation(); handleSecureAction('download'); }}
                className="cursor-pointer hover:bg-emerald-100 hover:scale-105 transition-all text-[9px] px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-md font-bold flex items-center gap-1 border border-emerald-100 dark:border-emerald-800/50"
              >
                <Download className="w-2.5 h-2.5" /> DOWNLOAD
              </button>
            )}
            {canEdit && (
              <button 
                onClick={(e) => { e.stopPropagation(); handleOpenEditor(); }}
                className="cursor-pointer hover:bg-amber-100 hover:scale-105 transition-all text-[9px] px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-md font-bold flex items-center gap-1 border border-amber-100 dark:border-amber-800/50"
              >
                {isEditorSupported ? <FileEdit className="w-2.5 h-2.5" /> : <Edit3 className="w-2.5 h-2.5" />} EDIT
              </button>
            )}
            <button 
              onClick={handleOpenDesktop}
              className="cursor-pointer hover:bg-indigo-100 hover:scale-105 transition-all text-[9px] px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md font-bold flex items-center gap-1 border border-indigo-100 dark:border-indigo-800/50"
            >
              <Monitor className="w-2.5 h-2.5" /> OPEN APP
            </button>
          </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-50 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-500">{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500/10 text-indigo-500 rounded-full border border-indigo-500/20">
                    <span className="text-[8px] font-black uppercase tracking-tighter">Premium Editor</span>
                  </div>
                  <span className="text-[8px] text-slate-300">V5.8-ULTRA-SECURE</span>
              {doc.storageType === 'cloudinary' && (
                <span className="bg-emerald-500/10 text-emerald-600 text-[8px] px-1.5 py-0.5 font-black rounded uppercase tracking-wider border border-emerald-500/20">
                  Cloud Protected
                </span>
              )}
              {isEditorSupported && (
                <span className="bg-indigo-500/10 text-indigo-500 text-[8px] px-1.5 py-0.5 font-bold rounded uppercase tracking-wider">Premium Editor</span>
              )}
            </div>
            <span>{formatDate(doc.createdAt)}</span>
          </div>
        </div>

        <AnimatePresence>
          {showOptions && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="absolute right-4 top-14 w-48 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-2xl shadow-2xl z-20 py-2 overflow-hidden"
            >
              <button 
                onClick={() => { onStar(doc._id); setShowOptions(false); }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <Star className={`w-4 h-4 ${doc.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} /> 
                {doc.isStarred ? 'Unstar' : 'Star'}
              </button>
              
              {canEdit && isEditorSupported && (
                <button 
                  onClick={() => { handleOpenEditor(); setShowOptions(false); }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors font-bold"
                >
                  <FileEdit className="w-4 h-4" /> Open Editor
                </button>
              )}

              {canEdit && (
                <button 
                  onClick={() => { setIsEditing(true); setShowOptions(false); }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <Edit3 className="w-4 h-4" /> Rename Metadata
                </button>
              )}

              {user?.role !== 'Viewer' && (isOwner || doc.permissions?.canEdit || isAdmin) && (
                <button 
                  onClick={() => { onShare(doc._id, doc.title); setShowOptions(false); }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <Share2 className="w-4 h-4" /> Share Access
                </button>
              )}
              
              {(isOwner || isAdmin) && (
                <button 
                  onClick={() => { onDelete(doc._id); setShowOptions(false); }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-bold"
                >
                  <Trash className="w-4 h-4" /> Delete Permanently
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Full Document Editor Modal */}
      <AnimatePresence>
        {isEditorOpen && (
          <React.Suspense fallback={
            <div className="fixed inset-0 z-[200] bg-slate-900/50 flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            </div>
          }>
            {isExcel ? (
              <ExcelEditor doc={doc} onClose={() => setIsEditorOpen(false)} onRefresh={onRefresh} readOnlyMode={readOnlyMode} />
            ) : isPPT ? (
              <PPTEditor doc={doc} onClose={() => setIsEditorOpen(false)} onRefresh={onRefresh} readOnlyMode={readOnlyMode} />
            ) : isWord || isPdf ? (
              <MSWordOnline doc={doc} onClose={() => setIsEditorOpen(false)} onRefresh={onRefresh} readOnlyMode={readOnlyMode} />
            ) : (
              <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center p-10">
                <h2 className="text-xl font-bold mb-4">Unsupported Format</h2>
                <p className="text-gray-500 mb-6">The editor doesn't support this specific file type yet.</p>
                <button onClick={() => setIsEditorOpen(false)} className="px-6 py-2 bg-[#185abd] text-white rounded">Close</button>
              </div>
            )}
          </React.Suspense>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewState.isOpen && (
            // Re-verify it's a cloud office file before showing OfficeViewer
            (isWord || isExcel || isPPT) && doc.fileUrl?.startsWith('http') ? (
                <OfficeViewer doc={doc} onClose={() => setViewState({ isOpen: false, url: null })} />
            ) : (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-4"
            onContextMenu={(e) => e.preventDefault()}
          >
            <button 
              onClick={() => setViewState({ isOpen: false, url: null })} 
              className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-red-500 text-white rounded-full transition-all z-[110] shadow-xl"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="relative w-full max-w-6xl h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl">
              <iframe 
                src={`${viewState.url}#toolbar=0`} 
                className="w-full h-full border-0" 
                title="Secure Viewer" 
              />
              <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden flex flex-wrap content-around justify-center opacity-[0.03]">
                {Array.from({length: 40}).map((_, i) => (
                  <span key={i} className="text-3xl font-black -rotate-45 text-slate-900 mx-10 my-10 select-none uppercase">
                    {user?.email} • CONFIDENTIAL
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
            )
        )}
      </AnimatePresence>
    </>
  );
};

export default SmartDocCard;
