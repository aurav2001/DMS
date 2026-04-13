import React, { useState } from 'react';
import { 
  FileText, 
  MoreVertical, 
  Download, 
  Share2, 
  Trash, 
  Star,
  FileCode,
  FileImage,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DocumentCard = ({ doc, onStar, onDelete, onShare }) => {
  const [showOptions, setShowOptions] = useState(false);

  const getIcon = (type) => {
    if (type.includes('image')) return <FileImage className="w-10 h-10 text-orange-500" />;
    if (type.includes('pdf')) return <FileText className="w-10 h-10 text-red-500" />;
    return <FileCode className="w-10 h-10 text-blue-500" />;
  };

  const formatDate = (date) => new Date(date).toLocaleDateString();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-xl transition-all group relative"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
          {getIcon(doc.fileType)}
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => onStar(doc._id)} 
            className={`p-1.5 rounded-lg transition-colors ${doc.isStarred ? 'text-yellow-400' : 'text-slate-300 hover:text-yellow-400'}`}
          >
            <Star className={`w-5 h-5 ${doc.isStarred ? 'fill-current' : ''}`} />
          </button>
          <div className="relative">
            <button onClick={() => setShowOptions(!showOptions)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
            <AnimatePresence>
              {showOptions && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl shadow-2xl z-20 py-2 overflow-hidden"
                >
                  <button onClick={() => { 
                    if (doc.fileUrl.startsWith('http')) {
                      window.open(doc.fileUrl);
                    } else {
                      const API_SERVER = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
                      window.open(`${API_SERVER}/${doc.fileUrl}`); 
                    }
                    setShowOptions(false); 
                  }} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <Download className="w-4 h-4" /> Download
                  </button>
                  <button onClick={() => { onShare(doc._id); setShowOptions(false); }} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                  <hr className="my-1 border-slate-100 dark:border-slate-700" />
                  <button onClick={() => { onDelete(doc._id); setShowOptions(false); }} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-semibold">
                    <Trash className="w-4 h-4" /> Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="font-bold text-slate-900 dark:text-white truncate" title={doc.title}>
          {doc.title}
        </h3>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</span>
          <span>{formatDate(doc.createdAt)}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default DocumentCard;
