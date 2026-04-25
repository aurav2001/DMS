import React, { useState, useEffect, useCallback } from 'react';
import { X, Loader2, ShieldCheck, FileEdit, Download, RefreshCw, Shield, ExternalLink, AlertTriangle, FolderOpen, Upload, CheckCircle2, HardDrive, Cloud, FileText } from 'lucide-react';
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
import { DocumentEditor } from "@onlyoffice/document-editor-react";

const OnlyOfficeEditor = ({ doc, onClose, onRefresh, readOnlyMode = false }) => {
    const [loading, setLoading] = useState(true);
    const [engine, setEngine] = useState('onlyoffice'); // Default to ONLYOFFICE
    const [fileUrl, setFileUrl] = useState(null);
    const [editorConfig, setEditorConfig] = useState(null);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const DS_URL = import.meta.env.VITE_ONLYOFFICE_URL || 'https://f53f9984.docs.onlyoffice.com/';
    console.log('ONLYOFFICE: Initializing with DS_URL:', DS_URL);

    // Workspace state
    const [workspaceDir, setWorkspaceDir] = useState(null);
    const [workspaceName, setWorkspaceName] = useState(null);
    const [savedToWorkspace, setSavedToWorkspace] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const fsSupported = isFileSystemAccessSupported();

    const ext = doc.fileName?.split('.').pop().toLowerCase() || '';
    const isOfficeFile = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp'].includes(ext);
    const isPdf = ext === 'pdf';

    // ONLYOFFICE Configuration
    const getDocumentType = (extension) => {
        if (['doc', 'docx', 'odt', 'txt', 'pdf'].includes(extension)) return 'word';
        if (['xls', 'xlsx', 'ods', 'csv'].includes(extension)) return 'cell';
        if (['ppt', 'pptx', 'odp'].includes(extension)) return 'slide';
        return 'word';
    };

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

    // Get file URL and signed config
    useEffect(() => {
        const prepareEditor = async () => {
            try {
                setLoading(true);
                setError(null);

                let currentFileUrl = doc.fileUrl;
                if (!currentFileUrl || !currentFileUrl.startsWith('http')) {
                    currentFileUrl = `${SOCKET_URL}/api/onlyoffice/download/${doc._id}`;
                }
                setFileUrl(currentFileUrl);

                // Prepare base config for signing
                const baseConfig = {
                    document: {
                        fileType: ext,
                        key: `${doc._id}-${new Date(doc.updatedAt).getTime()}`,
                        title: doc.fileName || doc.title,
                        url: currentFileUrl,
                        permissions: {
                            edit: !readOnlyMode,
                            download: true,
                            fillForms: true,
                            review: true,
                            comment: true
                        }
                    },
                    documentType: getDocumentType(ext),
                    editorConfig: {
                        callbackUrl: `${SOCKET_URL}/api/onlyoffice/callback/${doc._id}`,
                        user: {
                            id: user?.id || "guest",
                            name: user?.name || "Guest User"
                        },
                        customization: {
                            forcesave: true,
                            compactToolbar: false,
                            autosave: true
                        }
                    }
                };

                // Fetch signed config from backend
                const response = await axios.post(`${SOCKET_URL}/api/onlyoffice/config`, baseConfig);
                console.log('ONLYOFFICE: Received signed config with token:', response.data.token ? 'YES' : 'NO');
                setEditorConfig(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Failed to prepare editor:', err);
                setError('Could not prepare ONLYOFFICE Document Server. Check configuration.');
                setLoading(false);
            }
        };

        if (doc) {
            prepareEditor();
        }
    }, [doc, SOCKET_URL, user, readOnlyMode, ext]);

    const onDocumentReady = () => {
        console.log("ONLYOFFICE: Document is ready");
        setLoading(false);
    };

    const onAppReady = () => {
        console.log("ONLYOFFICE: App is ready");
    };

    const onError = (e) => {
        console.error("ONLYOFFICE Error Event:", e);
        if (e && e.data) {
            console.error("ONLYOFFICE Error Data:", JSON.stringify(e.data));
        }
        setError("ONLYOFFICE Error: " + (e?.data?.error || "Unknown error"));
        setLoading(false);
    };

    const encodedUrl = fileUrl ? encodeURIComponent(fileUrl) : '';
    const microsoftUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;
    const googleUrl = `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`;

    let viewerUrl = engine === 'microsoft' ? microsoftUrl : googleUrl;

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
            let dirHandle = workspaceDir;
            if (!dirHandle) {
                dirHandle = await pickWorkspaceDirectory();
                if (!dirHandle) return;
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
                toast.error(`File "${fileName}" not found in workspace!`, { id: 'ws-upload' });
                return;
            }

            setUploading(true);
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
            toast.success('Changes uploaded successfully!', { id: 'ws-upload' });
            if (onRefresh) onRefresh();
            setTimeout(() => setUploadSuccess(false), 3000);
        } catch (err) {
            setUploading(false);
            toast.error(err.response?.data?.message || 'Upload failed', { id: 'ws-upload' });
        }
    };

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
            toast.success('File downloaded!', { icon: '📝' });
        } catch (err) {
            toast.error('Download failed');
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] bg-slate-950 flex items-center justify-center">
            <div className="bg-white w-full h-full overflow-hidden flex flex-col shadow-2xl">
                {/* Header */}
                <div className="bg-slate-900 text-white px-4 sm:px-6 py-3 flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl border ${engine === 'onlyoffice' ? 'bg-indigo-500/20 border-indigo-500/30' : 'bg-slate-700/20 border-slate-700/30'}`}>
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
                                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${loading ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                                {engine === 'onlyoffice' ? 'ONLYOFFICE Document Server' : engine === 'microsoft' ? 'Microsoft Office Viewer' : 'Google Docs Viewer'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Engine Switcher */}
                        {isOfficeFile && (
                            <div className="hidden sm:flex bg-slate-800 rounded-lg p-1 mr-1 border border-slate-700">
                                <button
                                    onClick={() => { setEngine('onlyoffice'); setLoading(true); }}
                                    className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${engine === 'onlyoffice' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                >
                                    ONLYOFFICE
                                </button>
                                <button
                                    onClick={() => { setEngine('microsoft'); setLoading(true); }}
                                    className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${engine === 'microsoft' ? 'bg-[#185abd] text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                >
                                    MS Viewer
                                </button>
                                <button
                                    onClick={() => { setEngine('google'); setLoading(true); }}
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
                    </div>
                </div>

                {/* Workspace Edit Bar (only if NOT using OnlyOffice) */}
                {!readOnlyMode && engine !== 'onlyoffice' && (
                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 sm:px-6 py-2.5 flex items-center justify-between border-b border-slate-700/50">
                        <div className="flex items-center gap-3">
                            {fsSupported ? (
                                workspaceDir ? (
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                            <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
                                            <span className="text-[11px] font-bold text-emerald-400 truncate max-w-[120px]">{workspaceName}</span>
                                        </div>
                                        <button onClick={handleChangeWorkspace} className="text-[10px] text-slate-500 hover:text-slate-300 underline transition-colors">Change</button>
                                    </div>
                                ) : (
                                    <button onClick={handleSetupWorkspace} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg border border-amber-500/20 text-amber-400 text-[11px] font-bold transition-all">
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

                        <div className="flex items-center gap-2">
                            {fsSupported && workspaceDir ? (
                                <>
                                    <button onClick={handleDownloadToWorkspace} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${savedToWorkspace ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/20'}`}>
                                        {savedToWorkspace ? <><CheckCircle2 className="w-3.5 h-3.5" /> Saved</> : <><Download className="w-3.5 h-3.5" /> Sync to Workspace</>}
                                    </button>
                                    <button onClick={handleUploadFromWorkspace} disabled={uploading} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${uploadSuccess ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-500/50'}`}>
                                        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} {uploading ? 'Uploading...' : 'Upload Changes'}
                                    </button>
                                </>
                            ) : (
                                <button onClick={handleNormalDownload} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition-all border border-emerald-500">
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
                            <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
                            <h3 className="mt-6 text-slate-800 font-bold text-xl">Opening Document</h3>
                            <p className="mt-2 text-slate-500 text-sm max-w-xs text-center">Preparing ONLYOFFICE Document Server...</p>
                        </div>
                    )}

                    {error && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-10">
                            <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
                            <h3 className="text-slate-800 font-bold text-xl">{error}</h3>
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setEngine('microsoft')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition-all">
                                    <RefreshCw className="w-4 h-4 inline mr-2" /> Use MS Viewer
                                </button>
                                <button onClick={handleNormalDownload} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-500 transition-all">
                                    <Download className="w-4 h-4 inline mr-2" /> Download File
                                </button>
                            </div>
                        </div>
                    )}

                    {editorConfig && !error && (
                        engine === 'onlyoffice' && !isPdf ? (
                            <DocumentEditor
                                id="docxEditor"
                                documentServerUrl={DS_URL}
                                config={editorConfig}
                                events_onDocumentReady={onDocumentReady}
                                events_onAppReady={onAppReady}
                                events_onError={onError}
                            />
                        ) : (
                            <iframe
                                key={`${engine}-${fileUrl}`}
                                src={isPdf ? fileUrl : viewerUrl}
                                className="w-full h-full border-0"
                                title="Document Viewer"
                                onLoad={() => setLoading(false)}
                                sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-downloads allow-modals"
                            />
                        )
                    )}
                </div>

                {/* Footer */}
                <div className="h-10 border-t border-slate-200 flex items-center justify-between px-4 sm:px-6 bg-slate-50">
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5"><Shield className="w-3 h-3 text-emerald-500" /> Secure Editing</span>
                        <span className="hidden md:inline">• {engine === 'onlyoffice' ? 'Local Document Server' : 'Cloud Rendering'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnlyOfficeEditor;
