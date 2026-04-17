/**
 * Centralized utility for document type detection used across the DocVault ecosystem.
 */

export const getDocType = (fileType = '', fileName = '', title = '') => {
    const t = (fileType || '').toLowerCase();
    const f = (fileName || '').toLowerCase();
    const s = (title || '').toLowerCase();

    // Helper for extension checking
    const hasExt = (exts) => exts.some(ext => f.endsWith(ext) || s.endsWith(ext));

    const isPdf = t.includes('pdf') || hasExt(['.pdf']);
    
    const isExcel = t.includes('spreadsheet') || 
                   t.includes('excel') || 
                   t.includes('csv') || 
                   t.includes('sheet') ||
                   hasExt(['.xlsx', '.xls', '.csv', '.ods']);

    const isPPT = t.includes('presentation') || 
                 t.includes('powerpoint') || 
                 t.includes('slides') ||
                 hasExt(['.pptx', '.ppt', '.odp']);

    const isWord = t.includes('word') || 
                  t.includes('officedocument.word') || 
                  t.includes('text/rtf') ||
                  hasExt(['.docx', '.doc', '.rtf', '.odt']);

    const isImage = t.includes('image') || hasExt(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp']);

    return {
        isPdf,
        isExcel,
        isPPT,
        isWord,
        isImage,
        isEditorSupported: isPdf || isWord || isExcel || isPPT,
        // Combined type label
        mainType: isPdf ? 'pdf' : isWord ? 'word' : isExcel ? 'excel' : isPPT ? 'ppt' : isImage ? 'image' : 'generic'
    };
};

export const getIconColor = (type) => {
    switch (type) {
        case 'word': return 'text-blue-600';
        case 'excel': return 'text-green-600';
        case 'ppt': return 'text-red-600';
        case 'pdf': return 'text-red-500';
        case 'image': return 'text-orange-500';
        default: return 'text-slate-400';
    }
};

export const getBgColor = (type) => {
    switch (type) {
        case 'word': return 'bg-blue-100';
        case 'excel': return 'bg-green-100';
        case 'ppt': return 'bg-red-100';
        case 'pdf': return 'bg-slate-100';
        default: return 'bg-slate-50';
    }
};
