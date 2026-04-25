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

import OnlyOfficeEditor from './OnlyOfficeEditor';
import OfficeViewer from './OfficeViewer';

import { getDocType, getIconColor, getBgColor } from '../../utils/fileUtils';
import { API_BASE } from '../../utils/api';

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
  const isViewer = user?.role === 'Viewer';
  
  // USE BACKEND CALCULATED PERMISSIONS (Reliable)
  // Fallback to local calculation if backend didn't provide it yet
  const canView = doc.userPermissions?.canView ?? (isOwner || isAdmin || doc.permissions?.canView !== false);
  const canDownload = doc.userPermissions?.canDownload ?? (isOwner || isAdmin || doc.permissions?.canDownload !== false);
  
  // EDIT PERMISSION: Never allow for Viewer role
  const hasEditPermission = !isViewer && (doc.userPermissions?.canEdit ?? (isOwner || isAdmin || doc.permissions?.canEdit === true));
  
  // UI GATING: Locked if Approved
  const isLocked = doc.status === 'Approved';
  const showEditActions = hasEditPermission && !isLocked;
  
  const canEdit = showEditActions;
  const canShare = !isViewer && (doc.userPermissions?.canShare ?? (isOwner || isAdmin || doc.permissions?.canEdit));
  
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
      
      const response = await axios.post(`${API_BASE}/documents/${doc._id}/open-in-desktop`, {}, {
        headers: { 'x-auth-token': token }
      });
      
      if (response.data.uri) {
        window.location.href = response.data.uri;
        toast.success(`Opening ${doc.title} in Desktop...`, { icon: '🚀' });
      }
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
        whileHover={{ y: -8, scale: 1.01 }}
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all duration-300 group relative overflow-hidden"
      >
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-colors duration-500" />

        <div className="flex justify-between items-start mb-6 relative z-10">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 transition-all duration-300 transform group-hover:scale-110">
            {getIcon(doc.fileType, doc.fileName, doc.title)}
          </div>
          <div className="flex items-center gap-1.5 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            {canView && (
              <button 
                onClick={handleMainView} 
                className="p-2.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 rounded-xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm border border-slate-100 dark:border-slate-700" 
                title="View"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            {canDownload && (
              <button 
                onClick={() => handleSecureAction('download')} 
                className="p-2.5 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 rounded-xl text-slate-400 hover:text-emerald-500 transition-all shadow-sm border border-slate-100 dark:border-slate-700" 
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            {canEdit && isEditorSupported && (
              <button 
                onClick={handleOpenEditor} 
                className="p-2.5 bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-500/20 rounded-xl text-slate-400 hover:text-amber-600 transition-all shadow-sm border border-slate-100 dark:border-slate-700" 
                title="Web Editor"
              >
                <FileEdit className="w-4 h-4" />
              </button>
            )}
          </div>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowOptions(!showOptions)} 
            className={`p-2 rounded-xl transition-all duration-300 ${showOptions ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <MoreVertical className="w-5 h-5" />
          </motion.button>
        </div>

        <div className="space-y-4 relative z-10">
          <div className="space-y-2">
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
                  <h3 className="font-bold text-slate-800 dark:text-white truncate flex items-center gap-2 text-base" title={doc.title}>
                    {doc.title}
                    {doc.versions && doc.versions.length > 0 && (
                      <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 flex items-center gap-1 font-bold shrink-0">
                        V{doc.versions.length + 1}
                      </span>
                    )}
                  </h3>
                  {doc.isStarred && <Star className="w-4 h-4 text-yellow-400 fill-current flex-shrink-0" />}
                </>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-2">
                <span>{isOwner ? 'Your File' : `Shared by ${doc.uploadedBy?.name || 'Admin'}`}</span>
                {doc.department && (
                  <span className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[9px] px-2 py-0.5 rounded-lg font-bold uppercase tracking-widest border border-indigo-100 dark:border-indigo-500/20">
                    {doc.department}
                  </span>
                )}
              </p>
              {doc.status && (
                <span className={`text-[9px] px-2 py-0.5 rounded-lg font-bold uppercase tracking-wider border ${
                  doc.status === 'Approved' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' :
                  doc.status === 'Pending Review' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20' :
                  'bg-slate-50 dark:bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-500/20'
                }`}>
                  {doc.status}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {isAdmin && doc.status === 'Pending Review' && (
              <button 
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    await axios.patch(`${API_BASE}/documents/${doc._id}/status`, { status: 'Approved' }, { headers: { 'x-auth-token': localStorage.getItem('token') } });
                    toast.success('Document Approved!');
                    if (onRefresh) onRefresh();
                  } catch (err) { toast.error('Approval failed'); }
                }}
                className="flex-1 cursor-pointer hover:bg-emerald-600 hover:shadow-lg transition-all text-[10px] px-3 py-1.5 bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md border-b-2 border-emerald-700"
              >
                <Check className="w-3 h-3" /> APPROVE
              </button>
            )}
            {!isAdmin && isOwner && doc.status === 'Draft' && (
              <button 
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    await axios.patch(`${API_BASE}/documents/${doc._id}/status`, { status: 'Pending Review' }, { headers: { 'x-auth-token': localStorage.getItem('token') } });
                    toast.success('Submitted for Review!');
                    if (onRefresh) onRefresh();
                  } catch (err) { toast.error('Submission failed'); }
                }}
                className="flex-1 cursor-pointer hover:bg-amber-600 hover:shadow-lg transition-all text-[10px] px-3 py-1.5 bg-amber-500 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md border-b-2 border-amber-700"
              >
                <FileEdit className="w-3 h-3" /> SUBMIT
              </button>
            )}
            
            {canEdit && canDownload && isEditorSupported && (
              <button 
                onClick={handleOpenDesktop}
                className="flex-1 cursor-pointer hover:bg-indigo-700 hover:shadow-lg transition-all text-[10px] px-3 py-1.5 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md border-b-2 border-indigo-800"
                title="Open in Microsoft Office"
              >
                <Monitor className="w-3 h-3" /> OFFICE
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</span>
              {doc.storageType === 'cloudinary' && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/20">
                  <span className="text-[8px] font-black uppercase tracking-widest">Cloud</span>
                </div>
              )}
              {isEditorSupported && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded-full border border-indigo-500/20">
                  <span className="text-[8px] font-black uppercase tracking-widest">Premium</span>
                </div>
              )}
            </div>
            <span className="text-[10px] font-medium text-slate-400">{formatDate(doc.createdAt)}</span>
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

              {canShare && (
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

              {/* Version History Section */}
              {doc.versions && doc.versions.length > 0 && (
                <div className="mt-2 pt-2 border-t dark:border-slate-700 px-4">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Previous Versions</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                    {doc.versions.slice().reverse().map((v, i) => (
                      <div 
                        key={i}
                        className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-[10px] border border-slate-100 dark:border-slate-600"
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700 dark:text-slate-200">Version {v.versionNumber}</span>
                          <span className="text-[8px] text-slate-400">{new Date(v.updatedAt).toLocaleDateString()}</span>
                        </div>
                        <a 
                          href={`${API_BASE}/documents/${doc._id}/version/${v.versionNumber}?token=${localStorage.getItem('token')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-all"
                          title="Download this version"
                        >
                          <Download className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
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
            <OnlyOfficeEditor 
              doc={doc} 
              onClose={() => setIsEditorOpen(false)} 
              onRefresh={onRefresh} 
              readOnlyMode={readOnlyMode} 
            />

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
