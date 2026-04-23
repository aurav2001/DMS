import React, { useState, useEffect } from 'react';
import { X, Loader2, ShieldCheck, FileEdit, Download, RefreshCw, Shield, ExternalLink, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE, SOCKET_URL } from '../../utils/api';
import axios from 'axios';
import toast from 'react-hot-toast';

const OnlyOfficeEditor = ({ doc, onClose, onRefresh, readOnlyMode = false }) => {
    const [loading, setLoading] = useState(true);
    const [engine, setEngine] = useState('microsoft');
    const [fileUrl, setFileUrl] = useState(null);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    // Get a publicly accessible URL for the document
    useEffect(() => {
        const getFileUrl = async () => {
            try {
                setLoading(true);
                setError(null);

                // If doc already has a public fileUrl (cloud storage), use it directly
                if (doc.fileUrl && doc.fileUrl.startsWith('http')) {
                    setFileUrl(doc.fileUrl);
                    setLoading(false);
                    return;
                }

                // For SFTP/MongoDB stored files, use our backend download endpoint
                // Microsoft/Google viewers need a publicly accessible URL
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

    const handleDownloadForEdit = async () => {
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
            toast.success('File downloaded! Edit it in your desktop app, then re-upload.', { duration: 5000, icon: '📝' });
        } catch (err) {
            console.error('Download failed:', err);
            toast.error('Download failed');
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white w-full h-full rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-white/10">
                {/* Modern Header */}
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
                            <div className="hidden sm:flex bg-slate-800 rounded-lg p-1 mr-2 border border-slate-700">
                                <button 
                                    onClick={() => { setEngine('microsoft'); setLoading(true); setTimeout(() => setLoading(false), 1000); }}
                                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${engine === 'microsoft' ? 'bg-[#185abd] text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                >
                                    MS Office
                                </button>
                                <button 
                                    onClick={() => { setEngine('google'); setLoading(true); setTimeout(() => setLoading(false), 1000); }}
                                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${engine === 'google' ? 'bg-green-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Google
                                </button>
                            </div>
                        )}

                        {!readOnlyMode && (
                            <button 
                                onClick={handleDownloadForEdit}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all border border-emerald-500 flex items-center gap-1.5"
                            >
                                <Download className="w-3.5 h-3.5" /> Edit Offline
                            </button>
                        )}

                        <button 
                            onClick={() => {
                                if (onRefresh) onRefresh();
                                onClose();
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all border border-slate-700 flex items-center gap-1.5"
                        >
                            Close
                        </button>
                        <button 
                            onClick={onClose}
                            className="p-1.5 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Editor/Viewer Area */}
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
                                Try switching to {engine === 'microsoft' ? 'Google' : 'Microsoft'} viewer, or download the file to view it locally.
                            </p>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setEngine(engine === 'microsoft' ? 'google' : 'microsoft')}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition-all"
                                >
                                    <RefreshCw className="w-4 h-4 inline mr-2" />
                                    Switch Engine
                                </button>
                                <button
                                    onClick={handleDownloadForEdit}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-500 transition-all"
                                >
                                    <Download className="w-4 h-4 inline mr-2" />
                                    Download File
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
                <div className="h-10 border-t border-slate-200 flex items-center justify-between px-6 bg-slate-50">
                    <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5">
                            <Shield className="w-3 h-3 text-emerald-500" /> Secure View
                        </span>
                        <span className="hidden md:inline">• {engine === 'microsoft' ? 'Microsoft' : 'Google'} Cloud Rendering</span>
                        {!readOnlyMode && (
                            <span className="text-amber-600 font-bold">• To edit: Download → Edit in Office → Re-upload</span>
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
