import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Upload, File, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

const UploadModal = ({ onClose, onSuccess }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [title, setTitle] = useState('');

    const onDrop = useCallback(acceptedFiles => {
        setFile(acceptedFiles[0]);
        if (!title) setTitle(acceptedFiles[0].name);
    }, [title]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
        onDrop,
        multiple: false
    });

    const handleUpload = async () => {
        if (!file) return;
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);

        try {
            const res = await axios.post(`${API_BASE}/documents/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('File uploaded successfully!');
            onSuccess(res.data);
        } catch (err) {
            toast.error('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
            >
                <div className="flex justify-between items-center p-4 sm:p-6 border-b dark:border-slate-800 shrink-0">
                    <h2 className="text-lg sm:text-xl font-bold dark:text-white">Upload Document</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <div className="p-4 sm:p-6 overflow-y-auto">
                    {!file ? (
                        <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-2xl p-6 sm:p-12 text-center transition-all cursor-pointer ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:border-primary-400'}`}
                        >
                            <input {...getInputProps()} />
                            <div className="bg-primary-100 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                <Upload className="w-7 h-7 sm:w-8 sm:h-8 text-primary-600" />
                            </div>
                            <h3 className="text-base sm:text-lg font-bold dark:text-white mb-1">Click or drag file to upload</h3>
                            <p className="text-xs sm:text-sm text-slate-400">Support for PDF, DOCX, PNG, JPG (Max 10MB)</p>
                        </div>
                    ) : (
                        <div className="space-y-4 sm:space-y-6">
                            <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <File className="w-8 h-8 sm:w-10 sm:h-10 text-primary-600 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-slate-900 dark:text-white truncate text-sm sm:text-base">{file.name}</div>
                                    <div className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                                </div>
                                <button onClick={() => setFile(null)} className="text-red-500 hover:text-red-600 text-xs sm:text-sm font-bold shrink-0">Remove</button>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-2">Document Title</label>
                                <input 
                                    type="text" 
                                    className="w-full px-4 py-3 rounded-xl border dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>

                            <button 
                                onClick={handleUpload}
                                disabled={uploading}
                                className="btn-primary w-full flex items-center justify-center gap-2"
                            >
                                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                                {uploading ? 'Uploading...' : 'Start Upload'}
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default UploadModal;
