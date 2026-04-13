import React from 'react';
import DocumentCard from './DocumentCard';
import { FileQuestion } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const DocumentGrid = ({ documents, fetchDocuments }) => {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const handleStar = async (id) => {
        try {
            await axios.patch(`${API_BASE}/documents/${id}/star`);
            fetchDocuments();
        } catch (err) {
            toast.error('Failed to update document');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this document?')) return;
        try {
            await axios.delete(`${API_BASE}/documents/${id}`);
            toast.success('Document deleted');
            fetchDocuments();
        } catch (err) {
            toast.error('Failed to delete document');
        }
    };

    const handleShare = (id) => {
        const userId = window.prompt('Enter the user ID to share with:');
        if (!userId) return;
        try {
            axios.post(`${API_BASE}/documents/${id}/share`, { userId });
            toast.success('Shared successfully!');
        } catch (err) {
            toast.error('Sharing failed');
        }
    };

    if (documents.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-4">
                    <FileQuestion className="w-12 h-12 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold dark:text-white">No documents found</h3>
                <p className="text-slate-500">Upload your first document to get started.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {documents.map(doc => (
                <DocumentCard 
                    key={doc._id} 
                    doc={doc} 
                    onStar={handleStar}
                    onDelete={handleDelete}
                    onShare={handleShare}
                />
            ))}
        </div>
    );
};

export default DocumentGrid;
