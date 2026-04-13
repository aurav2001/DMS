import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Download, FileText, Database } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const PublicDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({ totalDocuments: 0, totalIssuers: 0, totalDepartments: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

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
    }, 500); // 500ms debounce for search
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleDownload = (docId) => {
    window.open(`${API_BASE}/documents/download/${docId}`);
  };

  return (
    <section className="py-20 bg-slate-50 relative overflow-hidden" id="repository">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-slate-900 border-b-2 border-indigo-500 inline-block pb-2">
            Public Document Repository
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Search, view, and download publicly available files issued by authorized sources in our system.
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-8 max-w-3xl mx-auto flex gap-4">
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
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
          >
            Search
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Card 1: Departments/Tags */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-6 text-center shadow-sm">
            <h3 className="text-4xl font-bold text-blue-900 mb-2">{stats.totalDepartments}</h3>
            <p className="text-blue-800 font-semibold text-sm uppercase tracking-wider">Total Categories</p>
          </div>
          
          {/* Card 2: Issuers/Users */}
          <div className="bg-red-50/50 border border-red-100 rounded-xl p-6 text-center shadow-sm">
            <h3 className="text-4xl font-bold text-red-900 mb-2">{stats.totalIssuers}</h3>
            <p className="text-red-800 font-semibold text-sm uppercase tracking-wider">Total Issuers</p>
          </div>
          
          {/* Card 3: Documents */}
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
                      <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                        {doc.fileType.split('/')[1]?.toUpperCase() || 'DOCUMENT'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium text-slate-900">{doc.title}</p>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {doc.tags?.join(', ') || 'No specific description provided.'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleDownload(doc._id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-block"
                        title="Download PDF"
                      >
                        <Download className="w-5 h-5" />
                      </button>
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
    </section>
  );
};

export default PublicDocuments;
