import React, { useEffect, useRef, useState } from 'react';
import { X, Loader2, ShieldCheck, FileEdit } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SOCKET_URL } from '../../utils/api';

const OnlyOfficeEditor = ({ doc, onClose, onRefresh, readOnlyMode = false }) => {
    const editorRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    
    useEffect(() => {
        const scriptId = 'onlyoffice-api-script';
        let script = document.getElementById(scriptId);
        
        const initEditor = () => {
            if (!window.DocsAPI) {
                console.error('ONLYOFFICE DocsAPI not found');
                return;
            }

            const backendUrl = SOCKET_URL; // Using the root backend URL
            const onlyofficeUrl = import.meta.env.VITE_ONLYOFFICE_URL || 'http://localhost:8080';
            
            // Critical Fix for Docker: If ONLYOFFICE is local, it needs to reach the backend via host.docker.internal
            let backendUrlForOnlyOffice = SOCKET_URL;
            if (onlyofficeUrl.includes('localhost') || onlyofficeUrl.includes('127.0.0.1')) {
                backendUrlForOnlyOffice = backendUrlForOnlyOffice.replace('localhost', 'host.docker.internal').replace('127.0.0.1', 'host.docker.internal');
            }
            
            // File type detection for ONLYOFFICE
            const ext = doc.fileName.split('.').pop().toLowerCase();
            let documentType = 'word'; // default
            if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) documentType = 'cell';
            if (['ppt', 'pptx', 'odp'].includes(ext)) documentType = 'slide';
            if (ext === 'pdf') documentType = 'pdf';
 
            // Document unique key for ONLYOFFICE (changes when file changes)
            const documentKey = `${doc._id}_${new Date(doc.updatedAt || Date.now()).getTime()}`;
 
            const config = {
                document: {
                    fileType: ext,
                    key: documentKey,
                    title: doc.title || doc.fileName,
                    url: `${backendUrlForOnlyOffice}/api/onlyoffice/download/${doc._id}`,
                    permissions: {
                        edit: !readOnlyMode && ext !== 'pdf',
                        download: true,
                        print: true,
                        comment: true,
                        fillForms: !readOnlyMode,
                        review: !readOnlyMode
                    }
                },
                documentType: documentType,
                editorConfig: {
                    callbackUrl: `${backendUrlForOnlyOffice}/api/onlyoffice/callback/${doc._id}`,
                    user: {
                        id: user?._id || "guest",
                        name: user?.name || "Guest User"
                    },
                    mode: (readOnlyMode || ext === 'pdf') ? 'view' : 'edit',
                    lang: 'en',
                    customization: {
                        forcesave: true,
                        autosave: true,
                        chat: true,
                        comments: true,
                        compactToolbar: false,
                        help: false,
                        toolbarNoTabs: false
                    }
                },
                height: "100%",
                width: "100%",
                events: {
                    "onDocumentReady": () => setLoading(false),
                    "onError": (e) => console.error("ONLYOFFICE Error:", e),
                }
            };

            try {
                // Initialize ONLYOFFICE
                new window.DocsAPI.DocEditor("onlyoffice-container", config);
            } catch (err) {
                console.error("Failed to initialize ONLYOFFICE:", err);
            }
        };

        if (!script) {
            script = document.createElement('script');
            script.id = scriptId;
            script.src = `${import.meta.env.VITE_ONLYOFFICE_URL || 'http://localhost:8080'}/web-apps/apps/api/documents/api.js`;
            script.async = true;
            script.onload = initEditor;
            document.head.appendChild(script);
        } else {
            // If script already exists, just init
            // Note: If DocsAPI is already there, we might need a small timeout to ensure container is ready
            setTimeout(initEditor, 100);
        }

        return () => {
            // No explicit cleanup needed for DocsAPI usually, 
            // but we might want to clear the container
            const container = document.getElementById("onlyoffice-container");
            if (container) container.innerHTML = "";
        };
    }, [doc, readOnlyMode, user]);

    return (
        <div className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white w-full h-full rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-white/10">
                {/* Modern Header */}
                <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
                            {readOnlyMode ? (
                                <ShieldCheck className="w-6 h-6 text-blue-400" />
                            ) : (
                                <FileEdit className="w-6 h-6 text-emerald-400" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="font-bold text-lg tracking-tight">{doc.title || doc.fileName}</h2>
                                {readOnlyMode && (
                                    <span className="bg-blue-500/20 text-blue-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-blue-500/20">
                                        Read Only
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                ONLYOFFICE Document Server Connected
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => {
                                onRefresh();
                                onClose();
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all border border-slate-700 flex items-center gap-2"
                        >
                            Save & Close
                        </button>
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 relative bg-slate-50">
                    {loading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/90 z-10 backdrop-blur-sm">
                            <div className="relative">
                                <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-8 h-8 bg-white rounded-full"></div>
                                </div>
                            </div>
                            <h3 className="mt-6 text-slate-800 font-bold text-xl">Opening Editor</h3>
                            <p className="mt-2 text-slate-500 text-sm max-w-xs text-center">
                                Preparing your workspace in ONLYOFFICE Document Server...
                            </p>
                        </div>
                    )}
                    <div id="onlyoffice-container" className="w-full h-full"></div>
                </div>
            </div>
        </div>
    );
};

export default OnlyOfficeEditor;
