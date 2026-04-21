import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Eye, FileText, Database, EyeOff, X, FileImage, FileVideo, FileAudio, Archive, File, FileSpreadsheet, Presentation, FileCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import MSWordOnline from '../Dashboard/MSWordOnline';
import SpreadsheetEngine from '../Dashboard/SpreadsheetEngine';
import OfficeViewer from '../Dashboard/OfficeViewer';
import { getDocType, getIconColor } from '../../utils/fileUtils';

import { API_BASE } from '../../utils/api';

const PublicDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({ totalDocuments: 0, totalIssuers: 0, totalDepartments: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState({ isOpen: false, url: null, doc: null });
  const { user } = useAuth();

  const getDocIcon = (doc) => {
    const docInfo = getDocType(doc.fileType, doc.fileName, doc.title);
    const colorClass = getIconColor(docInfo.mainType);
    
    if (docInfo.isImage) return <FileImage className={`w-5 h-5 ${colorClass} mt-0.5 shrink-0`} />;
    if (docInfo.isPdf) return <FileText className={`w-5 h-5 ${colorClass} mt-0.5 shrink-0`} />;
    if (docInfo.isExcel) return <FileSpreadsheet className={`w-5 h-5 ${colorClass} mt-0.5 shrink-0`} />;
    if (docInfo.isPPT) return <Presentation className={`w-5 h-5 ${colorClass} mt-0.5 shrink-0`} />;
    if (docInfo.isWord) return <FileText className={`w-5 h-5 ${colorClass} mt-0.5 shrink-0`} />;

    const t = doc.fileType?.toLowerCase() || '';
    if (t.includes('video')) return <FileVideo className="w-5 h-5 text-purple-500 mt-0.5 shrink-0" />;
    if (t.includes('audio')) return <FileAudio className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />;
    if (t.includes('zip') || t.includes('compressed')) return <Archive className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />;
    if (t.includes('javascript') || t.includes('html') || t.includes('css') || t.includes('code')) return <FileCode className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />;
    
    return <File className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />;
  };

  const fetchPublicData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/public/documents`, {
        params: { search: searchQuery }
      });
      setDocuments(res.data.documents);
      setStats(res.data.stats);
    } catch (err) {
      console.error('Failed to fetch public documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPublicData();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleViewSecure = async (doc) => {
    // For Public View, we use the Premium Internal Viewers directly
    setViewState({ isOpen: true, doc });
  };

  return (
    <section className="py-32 bg-slate-50/50 relative overflow-hidden" id="repository">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-emerald-100"
          >
            Open Data Protocol
          </motion.div>
          <h2 className="text-4xl lg:text-5xl font-black mb-6 text-slate-950 tracking-tight">
            Public Document <span className="text-emerald-600">Repository</span>
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium">
            Search, view, and verify publicly available files issued by authorized sources within the DocVault ecosystem.
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-2 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 mb-16 max-w-4xl mx-auto flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by ID, Name, or Issuing Authority..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-5 border-none bg-transparent rounded-2xl focus:outline-none text-slate-700 font-medium placeholder:text-slate-400"
            />
          </div>
          <button 
            onClick={fetchPublicData}
            className="px-10 py-4 bg-slate-950 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all shadow-xl hover:shadow-slate-900/20 active:scale-95"
          >
            Search Repository
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-6 text-center shadow-sm">
            <h3 className="text-4xl font-bold text-blue-900 mb-2">{stats.totalDepartments}</h3>
            <p className="text-blue-800 font-semibold text-sm uppercase tracking-wider">Total Categories</p>
          </div>
          <div className="bg-red-50/50 border border-red-100 rounded-xl p-6 text-center shadow-sm">
            <h3 className="text-4xl font-bold text-red-900 mb-2">{stats.totalIssuers}</h3>
            <p className="text-red-800 font-semibold text-sm uppercase tracking-wider">Total Issuers</p>
          </div>
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-6 text-center shadow-sm">
            <h3 className="text-4xl font-bold text-emerald-900 mb-2">{stats.totalDocuments}</h3>
            <p className="text-emerald-800 font-semibold text-sm uppercase tracking-wider">Total Documents</p>
          </div>
        </div>

        {/* Documents Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-100/50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h4 className="flex items-center gap-2 font-semibold text-slate-700">
              <Database className="w-5 h-5" /> 
              Latest {documents.length > 0 ? documents.length : ''} Public Documents
            </h4>
            {loading && <div className="animate-pulse w-24 h-4 bg-slate-300 rounded"></div>}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
                  <th className="px-6 py-3 font-semibold pb-3">#</th>
                  <th className="px-6 py-3 font-semibold pb-3">Issued By</th>
                  <th className="px-6 py-3 font-semibold pb-3">Issued Date</th>
                  <th className="px-6 py-3 font-semibold pb-3">Document Type</th>
                  <th className="px-6 py-3 font-semibold pb-3">Document Name & Description</th>
                  <th className="px-6 py-3 font-semibold pb-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {documents.length > 0 ? documents.map((doc, index) => (
                  <tr key={doc._id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-500">{index + 1}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {doc.uploadedBy?.name || 'Unknown User'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(doc.createdAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        getDocType(doc.fileType, doc.fileName, doc.title).mainType === 'word' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        getDocType(doc.fileType, doc.fileName, doc.title).mainType === 'excel' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        getDocType(doc.fileType, doc.fileName, doc.title).mainType === 'pdf' ? 'bg-red-50 text-red-700 border border-red-100' :
                        getDocType(doc.fileType, doc.fileName, doc.title).mainType === 'ppt' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                        'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {(getDocType(doc.fileType, doc.fileName, doc.title).mainType || 'DOCUMENT').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        {getDocIcon(doc)}
                        <div>
                          <p className="font-medium text-slate-900">{doc.title}</p>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {doc.tags?.join(', ') || 'No specific description provided.'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {(doc.permissions?.canView !== false) ? (
                        <button 
                          onClick={() => handleViewSecure(doc)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors inline-block"
                          title="View Document"
                        >
                          {doc.permissions?.preventScreenshot ? (
                            <EyeOff className="w-5 h-5 text-red-500" />
                          ) : (
                            <Eye className="w-5 h-5 text-emerald-500" />
                          )}
                        </button>
                      ) : (
                        <div title="View Restricted" className="p-2 text-slate-300 inline-block cursor-not-allowed">
                          <EyeOff className="w-5 h-5" />
                        </div>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                      {!loading ? 'No public documents found matching your search.' : 'Loading documents...'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <AnimatePresence>
        {viewState.isOpen && viewState.doc && (
          <>
            {(viewState.doc.fileType?.includes('word') || viewState.doc.fileType?.includes('officedocument')) ? (
              <MSWordOnline 
                doc={viewState.doc} 
                onClose={() => setViewState({ isOpen: false, doc: null })} 
                readOnlyMode={true} 
              />
            ) : (viewState.doc.fileType?.includes('excel') || viewState.doc.fileType?.includes('sheet') || viewState.doc.fileType?.includes('csv')) ? (
              <SpreadsheetEngine 
                doc={viewState.doc} 
                onClose={() => setViewState({ isOpen: false, doc: null })} 
                readOnlyMode={true} 
              />
            ) : (
                <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="relative w-full max-w-5xl h-[85vh] bg-white rounded-xl overflow-hidden shadow-2xl flex flex-col">
                        <div className="h-14 border-b flex items-center justify-between px-6 bg-slate-50">
                            <h3 className="font-bold text-slate-800">{viewState.doc.title}</h3>
                            <button onClick={() => setViewState({ isOpen: false, doc: null })} className="text-red-500 font-bold p-2">CLOSE</button>
                        </div>
                        <iframe 
                            src={`${API_BASE}/public/view/${viewState.doc._id}#toolbar=0`} 
                            className="w-full h-full border-0 flex-1" 
                            title="Secure Viewer"
                        />
                    </div>
                </div>
            )}
          </>
        )}
      </AnimatePresence>
    </section>
  );
};

export default PublicDocuments;
