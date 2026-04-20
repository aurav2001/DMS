import React from 'react';
import SmartDocCard from './SmartDocCard';
import FolderCard from './FolderCard';
import { FileQuestion } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const DocumentGrid = ({ 
    documents, 
    folders = [], 
    onRefresh,
    onFolderOpen,
    onFolderDelete,
    onFolderShare,
    onStar,
    onDelete,
    onShare
}) => {
    
    if (documents.length === 0 && folders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-4">
                    <FileQuestion className="w-12 h-12 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold dark:text-white">Empty Folder</h3>
                <p className="text-slate-500">Create a folder or upload a document to get started.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Folders Section */}
            {folders.length > 0 && (
                <div>
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">Folders</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {folders.map(folder => (
                            <FolderCard 
                                key={folder._id}
                                folder={folder}
                                onOpen={onFolderOpen}
                                onShare={onFolderShare}
                                onDelete={onFolderDelete}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Documents Section */}
            {documents.length > 0 && (
                <div>
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">Documents</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {documents.map(doc => (
                            <SmartDocCard 
                                key={doc._id} 
                                doc={doc} 
                                onStar={onStar}
                                onDelete={onDelete}
                                onShare={onShare}
                                onRefresh={onRefresh}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentGrid;
