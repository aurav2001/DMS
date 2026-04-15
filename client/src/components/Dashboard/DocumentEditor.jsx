import React, { useState, useEffect } from 'react';
import { X, Save, FileText, Loader2, Type, Move } from 'lucide-react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import * as mammoth from 'mammoth';
import { PDFDocument, rgb } from 'pdf-lib';
import axios from 'axios';
import toast from 'react-hot-toast';

const DocumentEditor = ({ doc, onClose, onRefresh }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editorData, setEditorData] = useState('');
    const [mode, setMode] = useState(''); // 'word' or 'pdf'
    const [pdfInstance, setPdfInstance] = useState(null);
    const [pdfUrl, setPdfUrl] = useState('');

    useEffect(() => {
        loadDocument();
    }, [doc]);

    const loadDocument = async () => {
        try {
            setLoading(true);
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const res = await axios.get(`${API_BASE}/documents/download/${doc._id}`, {
                responseType: 'arraybuffer'
            });

            if (doc.fileType.includes('pdf')) {
                setMode('pdf');
                const pdfDoc = await PDFDocument.load(res.data);
                setPdfInstance(pdfDoc);
                const pdfBytes = await pdfDoc.save();
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                setPdfUrl(URL.createObjectURL(blob));
            } else if (doc.fileType.includes('word') || doc.fileType.includes('officedocument')) {
                setMode('word');
                const result = await mammoth.convertToHtml({ arrayBuffer: res.data });
                setEditorData(result.value);
            } else {
                toast.error('Format not supported for browser editing yet');
                onClose();
            }
        } catch (err) {
            console.error('Editor Load Error:', err);
            toast.error('Failed to load document for editing');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            
            if (mode === 'word') {
                await axios.post(`${API_BASE}/documents/${doc._id}/version`, {
                    htmlContent: editorData,
                    type: 'docx'
                });
            } else if (mode === 'pdf') {
                // In a real app we would apply annotations here. 
                // For now we just 'save' the current state as a new version.
                const pdfBytes = await pdfInstance.save();
                const formData = new FormData();
                formData.append('file', new Blob([pdfBytes], { type: 'application/pdf' }), doc.fileName);
                formData.append('type', 'pdf');
                await axios.post(`${API_BASE}/documents/${doc._id}/version`, formData);
            }

            toast.success('Version saved successfully');
            onRefresh();
            onClose();
        } catch (err) {
            console.error('Save Error:', err);
            toast.error('Failed to save document');
        } finally {
            setSaving(false);
        }
    };

    // Helper to add text to PDF (basic interaction example)
    const addTextToPdf = async () => {
        if (!pdfInstance) return;
        const pages = pdfInstance.getPages();
        const firstPage = pages[0];
        firstPage.drawText('EDITED IN BROWSER', {
            x: 50,
            y: 50,
            size: 30,
            color: rgb(0.95, 0.1, 0.1),
        });
        const pdfBytes = await pdfInstance.save();
        setPdfUrl(URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' })));
        toast.info('Text annotation added to first page');
    };

    return (
        <div className="fixed inset-0 z-[200] bg-slate-900 flex flex-col">
            {/* Header */}
            <div className="h-16 bg-slate-800 border-b border-white/10 flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                        <FileText className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold leading-none">{doc.title}</h3>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                            {mode === 'word' ? 'Word-style Editor' : 'PDF Viewer & Signer'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {mode === 'pdf' && (
                        <button 
                            onClick={addTextToPdf}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-semibold rounded-xl transition-all border border-white/10"
                        >
                            <Type className="w-4 h-4" /> Add Text
                        </button>
                    )}
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                    </button>
                    <button 
                        onClick={onClose}
                        className="p-2 bg-white/5 hover:bg-red-500 text-white rounded-xl transition-all border border-white/10"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 overflow-auto bg-slate-950 p-4 md:p-8 flex justify-center">
                {loading ? (
                    <div className="flex flex-col items-center justify-center text-slate-400 gap-4">
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
                        <p className="font-medium animate-pulse">Initializing Editor Suite...</p>
                    </div>
                ) : (
                    <div className="w-full max-w-5xl bg-white shadow-2xl rounded-t-xl overflow-hidden shadow-indigo-500/5">
                        {mode === 'word' ? (
                            <div className="prose max-w-none">
                                <CKEditor
                                    editor={ClassicEditor}
                                    data={editorData}
                                    onChange={(event, editor) => {
                                        const data = editor.getData();
                                        setEditorData(data);
                                    }}
                                    config={{
                                        licenseKey: 'GPL',
                                        toolbar: [
                                            'heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote', '|', 'undo', 'redo'
                                        ],
                                        placeholder: 'Start writing your document...'
                                    }}
                                />
                            </div>
                        ) : (
                            <iframe 
                                src={pdfUrl} 
                                className="w-full h-full border-0 min-h-[80vh]" 
                                title="PDF Editor"
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentEditor;
