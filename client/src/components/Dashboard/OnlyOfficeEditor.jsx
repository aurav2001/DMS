import React, { useState, useEffect, useCallback } from 'react';
import { X, Loader2, ShieldCheck, FileEdit, Download, RefreshCw, Shield, ExternalLink, AlertTriangle, FolderOpen, Upload, CheckCircle2, HardDrive, Cloud } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE, SOCKET_URL } from '../../utils/api';
import { 
    isFileSystemAccessSupported, 
    pickWorkspaceDirectory, 
    getWorkspaceDirectory, 
    saveFileToWorkspace, 
    readFileFromWorkspace,
    clearWorkspace 
} from '../../utils/fileSystemApi';
import axios from 'axios';
import toast from 'react-hot-toast';

const OnlyOfficeEditor = ({ doc, onClose, onRefresh, readOnlyMode = false }) => {
    const [loading, setLoading] = useState(true);
    const [engine, setEngine] = useState('microsoft');
    const [fileUrl, setFileUrl] = useState(null);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    // Workspace state
    const [workspaceDir, setWorkspaceDir] = useState(null);
    const [workspaceName, setWorkspaceName] = useState(null);
    const [savedToWorkspace, setSavedToWorkspace] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const fsSupported = isFileSystemAccessSupported();

    // Load saved workspace on mount
    useEffect(() => {
        if (fsSupported) {
            getWorkspaceDirectory().then(handle => {
                if (handle) {
                    setWorkspaceDir(handle);
                    setWorkspaceName(handle.name);
                }
            });
        }
    }, [fsSupported]);

    // Get file URL for viewing
    useEffect(() => {
        const getFileUrl = async () => {
            try {
                setLoading(true);
                setError(null);

                if (doc.fileUrl && doc.fileUrl.startsWith('http')) {
                    setFileUrl(doc.fileUrl);
                    setLoading(false);
                    return;
                }

                const backendUrl = SOCKET_URL;
                const publicUrl = `${backendUrl}/api/onlyoffice/download/${doc._id}`;
                setFileUrl(publicUrl);
                setLoading(false);
            } catch (err) {
                console.error('Failed to get file URL:', err);
                setError('Could not prepare file for viewing');
                setLoading(false);
            }
        };

        getFileUrl();
    }, [doc]);

    const encodedUrl = fileUrl ? encodeURIComponent(fileUrl) : '';
    const microsoftUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;
    const googleUrl = `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`;
    const viewerUrl = engine === 'microsoft' ? microsoftUrl : googleUrl;

    const ext = doc.fileName?.split('.').pop().toLowerCase() || '';
    const isOfficeFile = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp'].includes(ext);
    const isPdf = ext === 'pdf';

    // ---- Workspace Functions ----

    const handleSetupWorkspace = async () => {
        try {
            const handle = await pickWorkspaceDirectory();
            if (handle) {
                setWorkspaceDir(handle);
                setWorkspaceName(handle.name);
                toast.success(`Workspace set: ${handle.name}`, { icon: '📁', duration: 3000 });
            }
        } catch (err) {
            console.error('Workspace setup failed:', err);
            toast.error('Could not set workspace folder');
        }
    };

    const handleChangeWorkspace = async () => {
        await clearWorkspace();
        setWorkspaceDir(null);
        setWorkspaceName(null);
        setSavedToWorkspace(false);
        toast('Workspace cleared. Select a new one.', { icon: '🔄' });
    };

    const handleDownloadToWorkspace = async () => {
        try {
            // If no workspace set, prompt to set one first
            let dirHandle = workspaceDir;
            if (!dirHandle) {
                dirHandle = await pickWorkspaceDirectory();
                if (!dirHandle) return; // User cancelled
                setWorkspaceDir(dirHandle);
                setWorkspaceName(dirHandle.name);
            }

            toast.loading('Downloading to workspace...', { id: 'ws-download' });

            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE}/documents/download/${doc._id}`, {
                responseType: 'blob',
                headers: { 'x-auth-token': token }
            });

            const fileName = doc.fileName || doc.title;
            await saveFileToWorkspace(dirHandle, fileName, response.data);

            setSavedToWorkspace(true);
            toast.success(`Saved to ${dirHandle.name}/${fileName}`, { 
                id: 'ws-download',
                duration: 5000, 
                icon: '✅' 
            });
        } catch (err) {
            console.error('Download to workspace failed:', err);
            if (err.name === 'NotAllowedError') {
                toast.error('Permission denied. Please allow access to the folder.', { id: 'ws-download' });
            } else {
                toast.error('Failed to save to workspace', { id: 'ws-download' });
            }
        }
    };

    const handleUploadFromWorkspace = async () => {
        try {
            if (!workspaceDir) {
                toast.error('No workspace folder set!');
                return;
            }

            const fileName = doc.fileName || doc.title;
            
            toast.loading('Reading file from workspace...', { id: 'ws-upload' });

            const file = await readFileFromWorkspace(workspaceDir, fileName);
            if (!file) {
                toast.error(`File "${fileName}" not found in workspace! Make sure you saved it after editing.`, { 
                    id: 'ws-upload',
                    duration: 5000 
                });
                return;
            }

            setUploading(true);

            // Create FormData and upload
            const formData = new FormData();
            formData.append('file', file, fileName);

            const token = localStorage.getItem('token');
            await axios.put(`${API_BASE}/documents/${doc._id}/reupload`, formData, {
                headers: { 
                    'x-auth-token': token,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setUploading(false);
            setUploadSuccess(true);
            toast.success('Changes uploaded successfully!', { 
                id: 'ws-upload',
                duration: 4000, 
                icon: '🚀' 
            });

            if (onRefresh) onRefresh();

            // Reset success state after animation
            setTimeout(() => setUploadSuccess(false), 3000);
        } catch (err) {
            setUploading(false);
            console.error('Upload from workspace failed:', err);
            
            if (err.response?.status === 404) {
                toast.error('Re-upload endpoint not found. Please contact admin.', { id: 'ws-upload' });
            } else {
                toast.error(err.response?.data?.message || 'Upload failed', { id: 'ws-upload' });
            }
        }
    };

    // Fallback: Normal browser download
    const handleNormalDownload = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE}/documents/download/${doc._id}`, {
                responseType: 'blob',
                headers: { 'x-auth-token': token }
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', doc.fileName || doc.title);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('File downloaded! Edit and re-upload when done.', { duration: 4000, icon: '📝' });
        } catch (err) {
            toast.error('Download failed');
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white w-full h-full rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-white/10">
                {/* Header */}
                <div className="bg-slate-900 text-white px-4 sm:px-6 py-3 flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl border ${engine === 'microsoft' ? 'bg-[#185abd]/20 border-[#185abd]/30' : 'bg-green-500/10 border-green-500/20'}`}>
                            {readOnlyMode ? (
                                <ShieldCheck className="w-5 h-5 text-blue-400" />
                            ) : (
                                <FileEdit className="w-5 h-5 text-emerald-400" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="font-bold text-sm sm:text-lg tracking-tight truncate max-w-[150px] sm:max-w-md">{doc.title || doc.fileName}</h2>
                                {readOnlyMode && (
                                    <span className="bg-blue-500/20 text-blue-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-blue-500/20">
                                        Read Only
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                {engine === 'microsoft' ? 'Microsoft Office Viewer' : 'Google Docs Viewer'}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {/* Engine Switcher */}
                        {isOfficeFile && (
                            <div className="hidden sm:flex bg-slate-800 rounded-lg p-1 mr-1 border border-slate-700">
                                <button 
                                    onClick={() => { setEngine('microsoft'); setLoading(true); setTimeout(() => setLoading(false), 1000); }}
                                    className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${engine === 'microsoft' ? 'bg-[#185abd] text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                >
                                    MS Office
                                </button>
                                <button 
                                    onClick={() => { setEngine('google'); setLoading(true); setTimeout(() => setLoading(false), 1000); }}
                                    className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${engine === 'google' ? 'bg-green-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Google
                                </button>
                            </div>
                        )}

                        <button 
                            onClick={() => { if (onRefresh) onRefresh(); onClose(); }}
                            className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all border border-slate-700"
                        >
                            Close
                        </button>
                        <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Workspace Edit Bar (only in edit mode) */}
                {!readOnlyMode && (
                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 sm:px-6 py-2.5 flex items-center justify-between border-b border-slate-700/50">
                        <div className="flex items-center gap-3">
                            {/* Workspace Status */}
                            {fsSupported ? (
                                workspaceDir ? (
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                            <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
                                            <span className="text-[11px] font-bold text-emerald-400 truncate max-w-[120px]">{workspaceName}</span>
                                        </div>
                                        <button
                                            onClick={handleChangeWorkspace}
                                            className="text-[10px] text-slate-500 hover:text-slate-300 underline transition-colors"
                                        >
                                            Change
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleSetupWorkspace}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg border border-amber-500/20 text-amber-400 text-[11px] font-bold transition-all"
                                    >
                                        <FolderOpen className="w-3.5 h-3.5" /> Set Workspace Folder
                                    </button>
                                )
                            ) : (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-700/50 rounded-lg border border-slate-600/50">
                                    <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-[10px] text-slate-400">Normal Download Mode</span>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            {fsSupported && workspaceDir ? (
                                <>
                                    {/* Download to Workspace */}
                                    <button
                                        onClick={handleDownloadToWorkspace}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                                            savedToWorkspace 
                                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                                                : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/20'
                                        }`}
                                    >
                                        {savedToWorkspace ? (
                                            <><CheckCircle2 className="w-3.5 h-3.5" /> Saved to Workspace</>
                                        ) : (
                                            <><Download className="w-3.5 h-3.5" /> Download to Workspace</>
                                        )}
                                    </button>

                                    {/* Upload from Workspace */}
                                    <button
                                        onClick={handleUploadFromWorkspace}
                                        disabled={uploading}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                                            uploadSuccess
                                                ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/20'
                                                : uploading
                                                    ? 'bg-slate-700 text-slate-400 border-slate-600 cursor-wait'
                                                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                                        }`}
                                    >
                                        {uploading ? (
                                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...</>
                                        ) : uploadSuccess ? (
                                            <><CheckCircle2 className="w-3.5 h-3.5" /> Synced!</>
                                        ) : (
                                            <><Upload className="w-3.5 h-3.5" /> Upload Changes</>
                                        )}
                                    </button>
                                </>
                            ) : (
                                /* Fallback: Normal download */
                                <button
                                    onClick={handleNormalDownload}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition-all border border-emerald-500"
                                >
                                    <Download className="w-3.5 h-3.5" /> Edit Offline
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Viewer Area */}
                <div className="flex-1 relative bg-slate-100">
                    {loading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/90 z-10 backdrop-blur-sm">
                            <div className="relative">
                                <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-8 h-8 bg-white rounded-full"></div>
                                </div>
                            </div>
                            <h3 className="mt-6 text-slate-800 font-bold text-xl">Opening Document</h3>
                            <p className="mt-2 text-slate-500 text-sm max-w-xs text-center">
                                Loading via {engine === 'microsoft' ? 'Microsoft Office' : 'Google Docs'} viewer...
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-10">
                            <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
                            <h3 className="text-slate-800 font-bold text-xl">{error}</h3>
                            <p className="mt-2 text-slate-500 text-sm max-w-md text-center">
                                Try switching to {engine === 'microsoft' ? 'Google' : 'Microsoft'} viewer, or download the file.
                            </p>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setEngine(engine === 'microsoft' ? 'google' : 'microsoft')}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition-all"
                                >
                                    <RefreshCw className="w-4 h-4 inline mr-2" /> Switch Engine
                                </button>
                                <button
                                    onClick={handleNormalDownload}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-500 transition-all"
                                >
                                    <Download className="w-4 h-4 inline mr-2" /> Download File
                                </button>
                            </div>
                        </div>
                    )}

                    {fileUrl && !error && (
                        <iframe
                            key={`${engine}-${fileUrl}`}
                            src={isPdf ? fileUrl : viewerUrl}
                            className="w-full h-full border-0"
                            title="Document Viewer"
                            onLoad={() => setLoading(false)}
                            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="h-10 border-t border-slate-200 flex items-center justify-between px-4 sm:px-6 bg-slate-50">
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5">
                            <Shield className="w-3 h-3 text-emerald-500" /> Secure View
                        </span>
                        <span className="hidden md:inline">• {engine === 'microsoft' ? 'Microsoft' : 'Google'} Cloud Rendering</span>
                        {!readOnlyMode && fsSupported && (
                            <span className="hidden lg:flex items-center gap-1 text-indigo-500 font-bold">
                                <HardDrive className="w-3 h-3" /> Workspace Sync Active
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {fileUrl && (
                            <button
                                onClick={() => window.open(isPdf ? fileUrl : viewerUrl, '_blank')}
                                className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                            >
                                <ExternalLink className="w-3 h-3" /> Open in New Tab
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnlyOfficeEditor;
