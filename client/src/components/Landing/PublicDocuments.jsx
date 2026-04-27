import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Eye, FileText, Database, EyeOff, X, FileImage, FileVideo, FileAudio, Archive, File, FileSpreadsheet, Presentation, FileCode, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import OnlyOfficeEditor from '../Dashboard/OnlyOfficeEditor';
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
    
    if (docInfo.isImage) return <FileImage className={`w-6 h-6 ${colorClass} shrink-0`} />;
    if (docInfo.isPdf) return <FileText className={`w-6 h-6 ${colorClass} shrink-0`} />;
    if (docInfo.isExcel) return <FileSpreadsheet className={`w-6 h-6 ${colorClass} shrink-0`} />;
    if (docInfo.isPPT) return <Presentation className={`w-6 h-6 ${colorClass} shrink-0`} />;
    if (docInfo.isWord) return <FileText className={`w-6 h-6 ${colorClass} shrink-0`} />;

    const t = doc.fileType?.toLowerCase() || '';
    if (t.includes('video')) return <FileVideo className="w-6 h-6 text-purple-500 shrink-0" />;
    if (t.includes('audio')) return <FileAudio className="w-6 h-6 text-green-500 shrink-0" />;
    if (t.includes('zip') || t.includes('compressed')) return <Archive className="w-6 h-6 text-amber-600 shrink-0" />;
    if (t.includes('javascript') || t.includes('html') || t.includes('css') || t.includes('code')) return <FileCode className="w-6 h-6 text-blue-500 shrink-0" />;
    
    return <File className="w-6 h-6 text-slate-400 shrink-0" />;
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
    setViewState({ isOpen: true, doc });
  };

  return (
    <section className="py-24 bg-slate-50/50 relative overflow-hidden" id="repository">
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary-50/50 to-transparent -z-10"></div>
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block px-5 py-2 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-emerald-100 shadow-sm"
          >
            Open Data Protocol
          </motion.div>
          <h2 className="text-3xl lg:text-5xl font-black mb-8 text-slate-950 tracking-tight leading-[1.1]">
            Public Document <br /> <span className="text-emerald-600">Repository</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
            Search, view, and verify publicly available files issued by authorized sources within the DocVault ecosystem.
          </p>
        </div>

        {/* Search Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white p-3 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 mb-20 max-w-4xl mx-auto flex items-center gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by ID, Name, or Issuing Authority..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 border-none bg-transparent rounded-3xl focus:outline-none text-slate-700 font-bold placeholder:text-slate-400 text-base"
            />
          </div>
          <button 
            onClick={fetchPublicData}
            className="px-10 py-4 bg-slate-950 hover:bg-primary-600 text-white rounded-3xl font-black transition-all shadow-2xl hover:shadow-primary-600/30 active:scale-95 uppercase tracking-widest text-xs"
          >
            Search Now
          </button>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {[
            { label: 'Total Categories', value: stats.totalDepartments, color: 'bg-blue-600' },
            { label: 'Total Issuers', value: stats.totalIssuers, color: 'bg-red-600' },
            { label: 'Total Documents', value: stats.totalDocuments, color: 'bg-emerald-600' }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white border border-slate-100 rounded-[2.5rem] p-8 text-center shadow-xl shadow-slate-200/50 group hover:-translate-y-2 transition-all duration-500"
            >
              <div className={`w-3 h-3 rounded-full ${stat.color} mx-auto mb-6 shadow-lg shadow-current/50`}></div>
              <h3 className="text-4xl font-black text-slate-950 mb-3 tracking-tight">{stat.value}</h3>
              <p className="text-slate-400 font-black text-xs uppercase tracking-[0.2em]">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Documents Table */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden"
        >
          <div className="bg-slate-50/50 px-10 py-8 border-b border-slate-100 flex justify-between items-center">
            <h4 className="flex items-center gap-3 font-black text-slate-900 text-lg uppercase tracking-wider">
              <Database className="w-6 h-6 text-primary-600" /> 
              Live Repository Access
            </h4>
            {loading ? (
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-primary-600 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-primary-600 animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 rounded-full bg-primary-600 animate-bounce [animation-delay:0.4s]"></div>
              </div>
            ) : (
              <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                System Synchronized
              </div>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/30 text-slate-400 text-xs font-black uppercase tracking-[0.2em] border-b border-slate-100">
                  <th className="px-10 py-5">#</th>
                  <th className="px-10 py-5">Issued By</th>
                  <th className="px-10 py-5">Issued Date</th>
                  <th className="px-10 py-5">Type</th>
                  <th className="px-10 py-5">Document Name</th>
                  <th className="px-10 py-5 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {documents.length > 0 ? documents.map((doc, index) => (
                  <tr key={doc._id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors group cursor-default">
                    <td className="px-10 py-6 text-sm font-bold text-slate-300 group-hover:text-primary-600 transition-colors">{index + 1}</td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-xs text-slate-500">
                          {(doc.uploadedBy?.name || 'U')[0]}
                        </div>
                        <span className="font-bold text-slate-800">{doc.uploadedBy?.name || 'Unknown User'}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-sm font-bold text-slate-500 italic">
                      {new Date(doc.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-10 py-6">
                      <span className={`inline-block px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                        getDocType(doc.fileType, doc.fileName, doc.title).mainType === 'word' ? 'bg-blue-50 text-blue-700' :
                        getDocType(doc.fileType, doc.fileName, doc.title).mainType === 'excel' ? 'bg-emerald-50 text-emerald-700' :
                        getDocType(doc.fileType, doc.fileName, doc.title).mainType === 'pdf' ? 'bg-red-50 text-red-700' :
                        getDocType(doc.fileType, doc.fileName, doc.title).mainType === 'ppt' ? 'bg-orange-50 text-orange-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {getDocType(doc.fileType, doc.fileName, doc.title).mainType || 'FILE'}
                      </span>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="bg-slate-50 p-3 rounded-xl group-hover:scale-110 transition-transform">
                          {getDocIcon(doc)}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 group-hover:text-primary-600 transition-colors">{doc.title}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                            {doc.tags?.join(' • ') || 'Standard Public Access'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-center">
                      {(doc.permissions?.canView !== false) ? (
                        <button 
                          onClick={() => handleViewSecure(doc)}
                          className="w-12 h-12 bg-white hover:bg-emerald-500 hover:text-white text-emerald-500 rounded-2xl transition-all shadow-lg border border-emerald-50 flex items-center justify-center mx-auto active:scale-90"
                          title="View Document"
                        >
                          {doc.permissions?.preventScreenshot ? (
                            <EyeOff className="w-6 h-6" />
                          ) : (
                            <Eye className="w-6 h-6" />
                          )}
                        </button>
                      ) : (
                        <div title="View Restricted" className="w-12 h-12 bg-slate-100 text-slate-300 rounded-2xl flex items-center justify-center mx-auto cursor-not-allowed">
                          <EyeOff className="w-6 h-6" />
                        </div>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="px-10 py-24 text-center">
                      {!loading ? (
                        <div className="max-w-xs mx-auto">
                          <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                            <Search className="w-10 h-10" />
                          </div>
                          <p className="text-slate-400 font-bold">No public documents found matching your search criteria.</p>
                        </div>
                      ) : (
                        <div className="animate-pulse space-y-4">
                          {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-50 rounded-2xl"></div>)}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

      </div>

      <AnimatePresence>
        {viewState.isOpen && viewState.doc && (
          <>
            {(() => {
              const info = getDocType(viewState.doc.fileType, viewState.doc.fileName, viewState.doc.title);
              if (info.isWord || info.isExcel || info.isPPT) {
                return (
                  <OnlyOfficeEditor 
                    doc={viewState.doc} 
                    onClose={() => setViewState({ isOpen: false, doc: null })} 
                    onRefresh={() => {}} 
                    readOnlyMode={true} 
                  />
                );
              }
              return (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 lg:p-10"
                >
                    <motion.div 
                      initial={{ scale: 0.9, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.9, y: 20 }}
                      className="relative w-full max-w-6xl h-full bg-white rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] flex flex-col border border-white/20"
                    >
                        <div className="h-20 border-b border-slate-100 flex items-center justify-between px-10 bg-white">
                            <div className="flex items-center gap-4">
                              <div className="bg-emerald-500/10 p-2.5 rounded-xl">
                                <Shield className="w-6 h-6 text-emerald-600" />
                              </div>
                              <h3 className="font-black text-slate-900 text-xl tracking-tight">{viewState.doc.title}</h3>
                            </div>
                            <button 
                              onClick={() => setViewState({ isOpen: false, doc: null })} 
                              className="px-8 py-3 bg-red-50 text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all active:scale-95 shadow-sm"
                            >
                              Close Viewer
                            </button>
                        </div>
                        <iframe 
                            src={`${API_BASE}/public/view/${viewState.doc._id}#toolbar=0`} 
                            className="w-full h-full border-0 flex-1 bg-slate-50" 
                            title="Secure Viewer"
                        />
                        <div className="h-10 bg-slate-50 border-t border-slate-100 flex items-center justify-center px-10">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Protected by DocVault Secure Encryption Engine</p>
                        </div>
                    </motion.div>
                </motion.div>
              );
            })()}

          </>
        )}
      </AnimatePresence>
    </section>
  );
};

export default PublicDocuments;
