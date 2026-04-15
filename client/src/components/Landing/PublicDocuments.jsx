import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Eye, FileText, Database, EyeOff, X, FileImage, FileVideo, FileAudio, Archive, File } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const PublicDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({ totalDocuments: 0, totalIssuers: 0, totalDepartments: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState({ isOpen: false, url: null, doc: null });
  const { user } = useAuth();

  const getDocIcon = (type) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('image')) return <FileImage className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />;
    if (t.includes('pdf')) return <FileText className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />;
    if (t.includes('video')) return <FileVideo className="w-5 h-5 text-purple-500 mt-0.5 shrink-0" />;
    if (t.includes('audio')) return <FileAudio className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />;
    if (t.includes('zip') || t.includes('compressed')) return <Archive className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />;
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
    try {
      const response = await axios.get(`${API_BASE}/public/view/${doc._id}`, {
        responseType: 'arraybuffer'
      });
      
      const isWord = doc.fileType.includes('word') || doc.fileType.includes('officedocument');
      let url = null;
      let htmlContent = null;

      if (isWord) {
        const mammoth = await import('mammoth');
        const result = await mammoth.convertToHtml({ arrayBuffer: response.data });
        htmlContent = result.value;
      } else {
        const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/pdf' });
        url = window.URL.createObjectURL(blob);
      }
      
      setViewState({ isOpen: true, url, htmlContent, doc, isWord });
    } catch (err) {
      console.error(err);
      alert('Failed to load document preview.');
    }
  };

  return (
    <section className="py-14 sm:py-16 lg:py-20 bg-slate-50 relative overflow-hidden" id="repository">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">

        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-slate-900 border-b-2 border-indigo-500 inline-block pb-2">
            Public Document Repository
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto px-2">
            Search, view, and download publicly available files issued by authorized sources in our system.
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200 mb-6 sm:mb-8 max-w-3xl mx-auto flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Document Name / Description"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
          <button
            onClick={fetchPublicData}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
          >
            Search
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 sm:p-6 text-center shadow-sm">
            <h3 className="text-3xl sm:text-4xl font-bold text-blue-900 mb-1 sm:mb-2">{stats.totalDepartments}</h3>
            <p className="text-blue-800 font-semibold text-xs sm:text-sm uppercase tracking-wider">Total Categories</p>
          </div>
          <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 sm:p-6 text-center shadow-sm">
            <h3 className="text-3xl sm:text-4xl font-bold text-red-900 mb-1 sm:mb-2">{stats.totalIssuers}</h3>
            <p className="text-red-800 font-semibold text-xs sm:text-sm uppercase tracking-wider">Total Issuers</p>
          </div>
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 sm:p-6 text-center shadow-sm">
            <h3 className="text-3xl sm:text-4xl font-bold text-emerald-900 mb-1 sm:mb-2">{stats.totalDocuments}</h3>
            <p className="text-emerald-800 font-semibold text-xs sm:text-sm uppercase tracking-wider">Total Documents</p>
          </div>
        </div>

        {/* Documents Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-100/50 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 flex justify-between items-center gap-2">
            <h4 className="flex items-center gap-2 font-semibold text-slate-700 text-sm sm:text-base">
              <Database className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span className="truncate">Latest {documents.length > 0 ? documents.length : ''} Public Documents</span>
            </h4>
            {loading && <div className="animate-pulse w-16 sm:w-24 h-4 bg-slate-300 rounded shrink-0"></div>}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[720px]">
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
                      <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                        {doc.fileType.split('/')[1]?.toUpperCase() || 'DOCUMENT'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        {getDocIcon(doc.fileType)}
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
        {viewState.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4 selection:bg-transparent"
            onContextMenu={(e) => e.preventDefault()}
            style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
          >
            <button
              onClick={() => setViewState({ isOpen: false, url: null, doc: null })}
              className="absolute top-3 right-3 sm:top-6 sm:right-6 p-2 bg-white/10 hover:bg-red-500 text-white rounded-full transition-colors z-[70]"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <div className="relative w-full max-w-5xl h-[90vh] sm:h-[85vh] bg-white rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 flex flex-col">
              {viewState.isWord ? (
                <div
                  className="flex-1 overflow-auto p-4 sm:p-8 md:p-16 bg-white prose prose-slate max-w-none break-words pointer-events-auto"
                  dangerouslySetInnerHTML={{ __html: viewState.htmlContent }} 
                />
              ) : (
                <iframe 
                  src={`${viewState.url}#toolbar=0`} 
                  className="w-full h-full border-0 pointer-events-auto flex-1" 
                  title="Secure Viewer"
                  onContextMenu={(e) => e.preventDefault()}
                />
              )}
              <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden flex flex-wrap content-around justify-center opacity-10">
                {Array.from({length: 30}).map((_, i) => (
                  <span key={i} className="text-4xl font-bold -rotate-45 text-slate-900 mx-10 my-10 select-none">
                    {user?.email || 'GUEST-ACCESS'} - PUBLIC VIEW
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default PublicDocuments;
