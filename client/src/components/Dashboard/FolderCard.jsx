import React from 'react';
import { Folder, MoreVertical, Share2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

const FolderCard = ({ folder, onOpen, onShare, onDelete }) => {
    return (
        <motion.div 
            whileHover={{ scale: 1.02 }}
            onDoubleClick={() => onOpen(folder._id, folder.name)}
            className="group relative bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all cursor-pointer select-none"
        >
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                    <Folder className="w-8 h-8 text-amber-500 fill-amber-500/20" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 dark:text-white truncate">
                        {folder.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Folder
                    </p>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onShare(folder._id, folder.name); }}
                        className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg"
                    >
                        <Share2 className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(folder._id); }}
                        className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
            
            {/* Folder Shared Badge */}
            {folder.sharedWith?.length > 0 && (
                <div className="absolute top-2 right-2 flex -space-x-2">
                    {folder.sharedWith.slice(0, 3).map((share, i) => (
                        <div key={i} className="w-5 h-5 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] text-white font-bold">
                            S
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
};

export default FolderCard;
