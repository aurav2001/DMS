import React, { useState } from 'react';
import { X, ExternalLink, Download, Shield, RefreshCw } from 'lucide-react';

const OfficeViewer = ({ doc, onClose }) => {
  const [engine, setEngine] = useState('microsoft'); // 'microsoft' or 'google'
  
  const encodedUrl = encodeURIComponent(doc.fileUrl);
  
  const microsoftUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;
  const googleUrl = `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`;
  
  const viewerUrl = engine === 'microsoft' ? microsoftUrl : googleUrl;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full h-full max-w-6xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="h-16 border-b dark:border-slate-800 flex items-center justify-between px-4 md:px-6 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${engine === 'microsoft' ? 'bg-[#185abd]' : 'bg-green-600'}`}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h3 className="text-sm font-bold dark:text-white truncate max-w-[200px] md:max-w-md">
                {doc.title}
              </h3>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                {engine === 'microsoft' ? 'Microsoft Native Engine' : 'Google Native Engine'} (Same Format)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-200 dark:bg-slate-800 rounded-lg p-1 mr-2">
                <button 
                    onClick={() => setEngine('microsoft')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${engine === 'microsoft' ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    MS 365
                </button>
                <button 
                    onClick={() => setEngine('google')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${engine === 'google' ? 'bg-white dark:bg-slate-700 text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Google
                </button>
            </div>
            
            <button 
              onClick={() => window.open(doc.fileUrl, '_blank')}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-400"
              title="Open Original"
            >
              <ExternalLink className="w-5 h-5" />
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Viewer Area */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-3 md:p-6 flex flex-col items-center">
            <div className="w-full h-full bg-white rounded-xl shadow-lg overflow-hidden border dark:border-slate-800 relative">
                <div className="absolute inset-0 flex items-center justify-center -z-10 bg-white dark:bg-slate-900">
                    <div className="flex flex-col items-center gap-3">
                        <RefreshCw className="w-10 h-10 text-primary-500 animate-spin" />
                        <p className="text-sm text-slate-500 font-medium text-center px-4">
                            Requesting from {engine === 'microsoft' ? 'Microsoft' : 'Google'} Servers...<br/>
                            <span className="text-xs text-slate-400">If it fails, try switching the engine above</span>
                        </p>
                    </div>
                </div>

                <iframe
                    key={engine}
                    src={viewerUrl}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    title="Office Viewer"
                    className="relative z-10 w-full h-full"
                >
                    This browser does not support iframes. Please download the file to view it.
                </iframe>
            </div>
        </div>

        {/* Footer */}
        <div className="h-12 border-t dark:border-slate-800 flex items-center justify-between px-6 bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium">
                <span className="flex items-center gap-1.5 line-clamp-1">
                    <Shield className="w-3 h-3 text-emerald-500" /> Cloud Sync Secure
                </span>
                <span className="hidden md:inline">• Optimized View</span>
            </div>
            <button 
                onClick={() => {
                    const link = document.createElement('a');
                    link.href = doc.fileUrl;
                    link.download = doc.fileName;
                    link.click();
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-lg transition-all"
            >
                <Download className="w-3.5 h-3.5" /> Download
            </button>
        </div>
      </div>
    </div>
  );
};

export default OfficeViewer;
