import React from 'react';
import { Folder, MoreVertical, Share2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

const FolderCard = ({ folder, onOpen, onShare, onDelete }) => {
    return (
        <motion.div 
            whileHover={{ y: -5, scale: 1.02 }}
            onDoubleClick={() => onOpen(folder._id, folder.name)}
            className="group relative bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer select-none overflow-hidden"
        >
            {/* Decorative gradient blur */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/5 blur-3xl group-hover:bg-amber-500/10 transition-colors" />

            <div className="flex items-center gap-5 relative z-10">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                    <Folder className="w-8 h-8 text-amber-500 fill-amber-500/20" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 dark:text-white truncate text-base">
                        {folder.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            Folder
                        </p>
                        {folder.sharedWith?.length > 0 && (
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                        )}
                        {folder.sharedWith?.length > 0 && (
                            <p className="text-[10px] text-indigo-500 font-bold uppercase">
                                Shared
                            </p>
                        )}
                    </div>
                </div>
                
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onShare(folder._id, folder.name); }}
                        className="p-2.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-600 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-all"
                        title="Share"
                    >
                        <Share2 className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(folder._id); }}
                        className="p-2.5 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-500/20 text-slate-400 hover:text-red-500 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-all"
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
            
            {/* Folder Shared Badge Visualization */}
            {folder.sharedWith?.length > 0 && (
                <div className="absolute top-4 right-4 flex -space-x-2.5 group-hover:-space-x-1 transition-all duration-300">
                    {folder.sharedWith.slice(0, 3).map((share, i) => (
                        <div 
                            key={i} 
                            className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] text-white font-black shadow-md"
                            title={`Shared User ${i+1}`}
                        >
                            {share.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                    ))}
                    {folder.sharedWith.length > 3 && (
                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] text-slate-500 font-bold shadow-md">
                            +{folder.sharedWith.length - 3}
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
};

export default FolderCard;
