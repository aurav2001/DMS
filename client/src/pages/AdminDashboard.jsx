import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Users, FileText, HardDrive, Shield, Trash2, Eye, EyeOff, 
  Download, Edit3, Camera, CameraOff, Lock, Unlock, ChevronDown,
  BarChart3, ArrowLeft, Search, AlertTriangle, X, UserPlus, Loader2
} from 'lucide-react';
import AddUserModal from '../components/Admin/AddUserModal';

import MSWordOnline from '../components/Dashboard/MSWordOnline';
import ExcelEditor from '../components/Dashboard/SpreadsheetEngine';
import PPTEditor from '../components/Dashboard/PresentationEngine';
import OfficeViewer from '../components/Dashboard/OfficeViewer';
import { getDocType } from '../utils/fileUtils';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sharingModal, setSharingModal] = useState({ isOpen: false, user: null });
  const [userSearch, setUserSearch] = useState('');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  
  // Viewer States
  const [viewState, setViewState] = useState({ isOpen: false, url: null, doc: null });
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeEditorDoc, setActiveEditorDoc] = useState(null);
  const [readOnlyMode, setReadOnlyMode] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'Admin') {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const res = await axios.get(`${API_BASE}/admin/stats`);
        setStats(res.data);
      } else if (activeTab === 'users') {
        const res = await axios.get(`${API_BASE}/admin/users`);
        setUsers(res.data);
      } else if (activeTab === 'documents') {
        const [docRes, userRes] = await Promise.all([
          axios.get(`${API_BASE}/admin/documents`),
          axios.get(`${API_BASE}/admin/users`)
        ]);
        setDocuments(docRes.data);
        setUsers(userRes.data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const updateRole = async (userId, role) => {
    try {
      await axios.patch(`${API_BASE}/admin/users/${userId}/role`, { role });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const deleteUser = async (userId) => {
    if (!confirm('Are you sure? This will delete the user and all their documents.')) return;
    try {
      await axios.delete(`${API_BASE}/admin/users/${userId}`);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const updatePermissions = async (docId, permissions, accessLevel) => {
    try {
      await axios.patch(`${API_BASE}/admin/documents/${docId}/permissions`, { permissions, accessLevel });
      setDocuments(prev => prev.map(d => d._id === docId ? { ...d, permissions, accessLevel } : d));
    } catch (err) { console.error(err); }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleSecureAction = async (doc, action) => {
    try {
      const endpoint = action === 'view' ? 'view' : 'download';
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/documents/${endpoint}/${doc._id}`, {
        responseType: 'blob',
        headers: { 'x-auth-token': token }
      });
      const contentType = response.headers['content-type'] || '';
      const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
      
      if (action === 'download') {
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', doc.fileName || doc.title);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        // Safety net: Detect Office files from the actual server response type
        const freshInfo = getDocType(contentType, doc.fileName, doc.title);
        if (freshInfo.isWord || freshInfo.isExcel || freshInfo.isPPT) {
            openInEditor(doc);
        } else {
            setViewState({ isOpen: true, url, doc });
        }
      }
    } catch (err) {
      console.error(err);
      alert('Failed to access document content');
    }
  };

  const openInEditor = (doc) => {
    setActiveEditorDoc(doc);
    setIsEditorOpen(true);
    setReadOnlyMode(true);
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredDocs = documents.filter(d => 
    d.title?.toLowerCase().includes(search.toLowerCase())
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'documents', label: 'Documents', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020617] via-[#050811] to-[#080d1a] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/10 rounded-lg transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-red-500 to-orange-500 p-2 rounded-xl">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
                <p className="text-xs text-slate-400">DocVault Management Console</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-emerald-400">● Admin</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-white/5 p-1.5 rounded-2xl w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearch(''); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search (for users/docs tabs) */}
        {activeTab !== 'overview' && (
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            {activeTab === 'users' && (
              <button 
                onClick={() => setIsAddUserModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition shadow-lg shadow-indigo-600/20 group"
              >
                <UserPlus className="w-5 h-5 transition-transform group-hover:scale-110" />
                Add New User
              </button>
            )}
            {activeTab === 'users' && isAddUserModalOpen && (
              <AddUserModal 
                onClose={() => setIsAddUserModalOpen(false)}
                onSuccess={fetchData}
              />
            )}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && stats && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/10 border border-blue-500/20 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-blue-500/20 p-2 rounded-lg"><Users className="w-5 h-5 text-blue-400" /></div>
                      <span className="text-slate-400 text-sm">Total Users</span>
                    </div>
                    <p className="text-4xl font-bold">{stats.totalUsers}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/10 border border-purple-500/20 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-purple-500/20 p-2 rounded-lg"><FileText className="w-5 h-5 text-purple-400" /></div>
                      <span className="text-slate-400 text-sm">Total Documents</span>
                    </div>
                    <p className="text-4xl font-bold">{stats.totalDocs}</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-800/10 border border-emerald-500/20 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-emerald-500/20 p-2 rounded-lg"><HardDrive className="w-5 h-5 text-emerald-400" /></div>
                      <span className="text-slate-400 text-sm">Storage Used</span>
                    </div>
                    <p className="text-4xl font-bold">{formatBytes(stats.totalStorage)}</p>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-400" /> Recent Users
                    </h3>
                    <div className="space-y-3">
                      {stats.recentUsers?.map(u => (
                        <div key={u._id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-bold">
                              {u.name?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{u.name}</p>
                              <p className="text-xs text-slate-400">{u.email}</p>
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            u.role === 'Admin' ? 'bg-red-500/20 text-red-400' : 
                            u.role === 'Editor' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-500/20 text-slate-400'
                          }`}>{u.role}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-400" /> Recent Documents
                    </h3>
                    <div className="space-y-3">
                      {stats.recentDocs?.map(d => (
                        <div key={d._id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                          <div>
                            <p className="text-sm font-medium">{d.title}</p>
                            <p className="text-xs text-slate-400">by {d.uploadedBy?.name} • {formatBytes(d.fileSize)}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            d.accessLevel === 'public' ? 'bg-green-500/20 text-green-400' : 
                            d.accessLevel === 'restricted' ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-500/20 text-slate-400'
                          }`}>{d.accessLevel || 'private'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400 text-sm">
                        <th className="text-left p-4">User</th>
                        <th className="text-left p-4">Email</th>
                        <th className="text-left p-4">Role</th>
                        <th className="text-left p-4">Joined</th>
                        <th className="text-left p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u => (
                        <tr key={u._id} className="border-b border-white/5 hover:bg-white/5 transition">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-bold">
                                {u.name?.charAt(0)}
                              </div>
                              <span className="font-medium">{u.name}</span>
                            </div>
                          </td>
                          <td className="p-4 text-slate-400 text-sm">{u.email}</td>
                          <td className="p-4">
                            <select 
                              value={u.role} 
                              onChange={e => updateRole(u._id, e.target.value)}
                              className="bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
                            >
                              <option value="Viewer" className="bg-slate-800">Viewer</option>
                              <option value="Editor" className="bg-slate-800">Editor</option>
                              <option value="Admin" className="bg-slate-800">Admin</option>
                            </select>
                          </td>
                          <td className="p-4 text-slate-400 text-sm">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => setSharingModal({ isOpen: true, user: u })}
                                className="p-2 hover:bg-indigo-500/20 rounded-lg text-indigo-400 transition"
                                title="Share specific document with this user"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                              {u._id !== user?.id && (
                                <button onClick={() => deleteUser(u._id)} className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-12 text-slate-500">No users found</div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="space-y-4">
                    {filteredDocs.map(doc => (
                      <DocumentPermissionCard 
                        key={doc._id} 
                        doc={doc} 
                        users={users}
                        onUpdate={updatePermissions}
                        onView={() => {
                          const docInfo = getDocType(doc.fileType, doc.fileName, doc.title);
                          const isCloudOffice = (docInfo.isWord || docInfo.isExcel || docInfo.isPPT) && doc.fileUrl?.startsWith('http');
                          
                          if (isCloudOffice) {
                            setViewState({ isOpen: true, url: null, doc });
                          } else if (docInfo.isWord || docInfo.isExcel || docInfo.isPPT) {
                            openInEditor(doc);
                          } else {
                            handleSecureAction(doc, 'view');
                          }
                        }}
                        formatBytes={formatBytes}
                      />
                    ))}
                  {filteredDocs.length === 0 && (
                    <div className="text-center py-12 text-slate-500 bg-white/5 rounded-2xl">No documents found</div>
                  )}
                </div>
              </motion.div>
            )}
            {/* Sharing Modal */}
            <AnimatePresence>
              {sharingModal.isOpen && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                >
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
                  >
                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-indigo-600/10">
                      <div>
                        <h3 className="text-xl font-bold text-white">Select File to Share</h3>
                        <p className="text-sm text-indigo-300 italic">Picking a document to share with <b>{sharingModal.user?.name}</b></p>
                      </div>
                      <button onClick={() => setSharingModal({ isOpen: false, user: null })} className="p-2 hover:bg-white/10 rounded-full transition"><X className="w-6 h-6 text-white" /></button>
                    </div>
                    
                    <div className="p-4">
                      <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                          type="text" 
                          placeholder="Search document name, uploader name or email..." 
                          className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                        />
                      </div>
                      
                      <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {documents.filter(d => 
                          d.title.toLowerCase().includes(userSearch.toLowerCase()) ||
                          d.uploadedBy?.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                          d.uploadedBy?.email?.toLowerCase().includes(userSearch.toLowerCase())
                        ).length > 0 ? (
                          documents.filter(d => 
                            d.title.toLowerCase().includes(userSearch.toLowerCase()) ||
                            d.uploadedBy?.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                            d.uploadedBy?.email?.toLowerCase().includes(userSearch.toLowerCase())
                          ).map(doc => (
                            <button 
                              key={doc._id}
                              onClick={async () => {
                                try {
                                  await axios.post(`${API_BASE}/documents/${doc._id}/share`, { email: sharingModal.user.email });
                                  alert(`Shared ${doc.title} with ${sharingModal.user.name}`);
                                  setSharingModal({ isOpen: false, user: null });
                                } catch (err) { alert('Failed to share document'); }
                              }}
                              className="w-full flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/10"
                            >
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-indigo-400" />
                                <div className="text-left">
                                  <p className="text-sm font-medium">{doc.title}</p>
                                  <p className="text-xs text-slate-500">{doc.uploadedBy?.name} • {formatBytes(doc.fileSize)}</p>
                                </div>
                              </div>
                              <div className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-xs font-bold">Share</div>
                            </button>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-sm text-slate-500">No matching documents found</p>
                            <p className="text-xs text-slate-600 mt-1">Try searching by title or uploader's name/email</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Full Document Editor Modal */}
      <AnimatePresence>
        {isEditorOpen && activeEditorDoc && (
          <React.Suspense fallback={
            <div className="fixed inset-0 z-[200] bg-slate-900/50 flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            </div>
          }>
            {(() => {
              const info = getDocType(activeEditorDoc.fileType, activeEditorDoc.fileName, activeEditorDoc.title);
              if (info.isExcel) return <ExcelEditor doc={activeEditorDoc} onClose={() => setIsEditorOpen(false)} onRefresh={fetchData} readOnlyMode={readOnlyMode} />;
              if (info.isPPT) return <PPTEditor doc={activeEditorDoc} onClose={() => setIsEditorOpen(false)} onRefresh={fetchData} readOnlyMode={readOnlyMode} />;
              return <MSWordOnline doc={activeEditorDoc} onClose={() => setIsEditorOpen(false)} onRefresh={fetchData} readOnlyMode={readOnlyMode} />;
            })()}
          </React.Suspense>
        )}
      </AnimatePresence>

      {/* Secure Viewer Modal */}
      <AnimatePresence>
        {viewState.isOpen && viewState.doc && (
            (() => {
                const info = getDocType(viewState.doc.fileType, viewState.doc.fileName, viewState.doc.title);
                if ((info.isWord || info.isExcel || info.isPPT) && viewState.doc.fileUrl?.startsWith('http')) {
                    return <OfficeViewer doc={viewState.doc} onClose={() => setViewState({ isOpen: false, url: null, doc: null })} />;
                }
                return (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-4"
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        <button 
                        onClick={() => setViewState({ isOpen: false, url: null, doc: null })} 
                        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-red-500 text-white rounded-full transition-all z-[210] shadow-xl"
                        >
                        <X className="w-6 h-6" />
                        </button>
                        <div className="relative w-full max-w-6xl h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl">
                        <iframe 
                            src={`${viewState.url}#toolbar=0`} 
                            className="w-full h-full border-0" 
                            title="Secure Viewer" 
                        />
                        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden flex flex-wrap content-around justify-center opacity-[0.03]">
                            {Array.from({length: 40}).map((_, i) => (
                            <span key={i} className="text-3xl font-black -rotate-45 text-slate-900 mx-10 my-10 select-none uppercase">
                                {user?.email} • ADMIN VIEW
                            </span>
                            ))}
                        </div>
                        </div>
                    </motion.div>
                );
            })()
        )}
      </AnimatePresence>
    </div>
  );
};

// Document Permission Card Component
const DocumentPermissionCard = ({ doc, onUpdate, formatBytes, users, onView }) => {
  const [expanded, setExpanded] = useState(false);
  const [shareSearch, setShareSearch] = useState('');
  const [showUserList, setShowUserList] = useState(false);
  const [sharedUsers, setSharedUsers] = useState(doc.sharedWith || []);
  const [access, setAccess] = useState(doc.accessLevel || 'private');
  const [perms, setPerms] = useState(doc.permissions || {
    canView: true,
    canDownload: true,
    canEdit: false,
    preventScreenshot: false,
    watermark: false
  });

  const togglePerm = (key) => {
    const updated = { ...perms, [key]: !perms[key] };
    setPerms(updated);
    onUpdate(doc._id, updated, access);
  };

  const changeAccess = (val) => {
    setAccess(val);
    onUpdate(doc._id, perms, val);
  };

  const permButtons = [
    { key: 'canView', label: 'View Only', icon: Eye, offIcon: EyeOff, color: 'blue' },
    { key: 'canDownload', label: 'Download', icon: Download, offIcon: Lock, color: 'green' },
    { key: 'canEdit', label: 'Edit/Write', icon: Edit3, offIcon: Lock, color: 'purple' },
    { key: 'preventScreenshot', label: 'Block Screenshot', icon: CameraOff, offIcon: Camera, color: 'red' },
    { key: 'watermark', label: 'Watermark', icon: AlertTriangle, offIcon: AlertTriangle, color: 'orange' },
  ];

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className="bg-indigo-500/20 p-2.5 rounded-xl">
            <FileText className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <p className="font-medium">{doc.title}</p>
            <p className="text-xs text-slate-400">
              by {doc.uploadedBy?.name} • {formatBytes(doc.fileSize)} • {doc.fileType}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={(e) => { e.stopPropagation(); onView(); }}
            className="p-2 hover:bg-white/10 rounded-lg text-indigo-400 transition flex items-center gap-2 border border-indigo-500/20"
            title="View content"
          >
            <Eye className="w-4 h-4" />
            <span className="text-[10px] font-bold">VIEW</span>
          </button>
          <span className={`text-xs px-3 py-1 rounded-full ${
            access === 'public' ? 'bg-green-500/20 text-green-400' : 
            access === 'restricted' ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-500/20 text-slate-400'
          }`}>{access}</span>
          <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10"
          >
            <div className="p-5 space-y-5">
              {/* Access Level */}
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Access Level</label>
                <div className="flex gap-2">
                  {['private', 'restricted', 'public'].map(level => (
                    <button
                      key={level}
                      onClick={() => changeAccess(level)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        access === level 
                          ? level === 'public' ? 'bg-green-600 text-white' :
                            level === 'restricted' ? 'bg-orange-600 text-white' : 'bg-slate-600 text-white'
                          : 'bg-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {level === 'private' && <Lock className="w-3 h-3 inline mr-1" />}
                      {level === 'restricted' && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                      {level === 'public' && <Unlock className="w-3 h-3 inline mr-1" />}
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Permission Toggles */}
              <div>
                <label className="text-sm text-slate-400 mb-3 block">Permissions</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {permButtons.map(pb => {
                    const isOn = perms[pb.key];
                    const Icon = isOn ? pb.icon : pb.offIcon;
                    return (
                      <button
                        key={pb.key}
                        onClick={() => togglePerm(pb.key)}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          isOn 
                            ? `bg-indigo-500/10 border-indigo-500/30 text-indigo-400`
                            : 'bg-white/5 border-white/10 text-slate-500'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{pb.label}</span>
                        <div className={`ml-auto w-10 h-5 rounded-full relative transition-all ${isOn ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${isOn ? 'left-5' : 'left-0.5'}`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Manage Access Section */}
              <div className="pt-4 border-t border-white/10">
                <label className="text-sm text-slate-400 mb-3 block flex justify-between items-center">
                  <span>Manage Access</span>
                  <span className="text-xs">{sharedUsers.length} users have access</span>
                </label>
                
                {/* List of Shared Users */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {sharedUsers.length > 0 ? sharedUsers.map(uId => {
                    const u = users.find(user => user._id === uId);
                    return (
                      <div key={uId} className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-full text-sm group">
                        <span className="text-indigo-300">{u?.name || 'Loading...'}</span>
                        <button 
                          onClick={async () => {
                            try {
                              await axios.post(`${API_BASE}/documents/${doc._id}/unshare`, { userId: uId });
                              setSharedUsers(prev => prev.filter(id => id !== uId));
                            } catch (err) { console.error(err); }
                          }}
                          className="hover:text-red-400 text-indigo-500 transition"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  }) : (
                    <p className="text-xs text-slate-500 italic">No users have shared access yet.</p>
                  )}
                </div>

                {/* Search & Add Member */}
                <div className="relative">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input 
                        type="text" 
                        placeholder="Search user name or email..." 
                        value={shareSearch}
                        onChange={(e) => {
                          setShareSearch(e.target.value);
                          setShowUserList(true);
                        }}
                        onFocus={() => setShowUserList(true)}
                        className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {showUserList && shareSearch.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-white/10 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto py-2">
                      {users
                        .filter(u => 
                          (u.email.toLowerCase().includes(shareSearch.toLowerCase()) || 
                           u.name.toLowerCase().includes(shareSearch.toLowerCase())) && 
                          !sharedUsers.includes(u._id)
                        )
                        .map(u => (
                          <button 
                            key={u._id}
                            onClick={async () => {
                              try {
                                await axios.post(`${API_BASE}/documents/${doc._id}/share`, { email: u.email });
                                setSharedUsers(prev => [...prev, u._id]);
                                setShareSearch('');
                                setShowUserList(false);
                              } catch (err) { console.error(err); }
                            }}
                            className="flex items-center justify-between w-full px-4 py-2 hover:bg-white/5 text-left transition"
                          >
                            <div>
                              <p className="text-sm font-medium">{u.name}</p>
                              <p className="text-xs text-slate-400">{u.email}</p>
                            </div>
                            <span className="text-xs text-indigo-400">Invite</span>
                          </button>
                        ))}
                      {users.filter(u => 
                        (u.email.toLowerCase().includes(shareSearch.toLowerCase()) || 
                         u.name.toLowerCase().includes(shareSearch.toLowerCase())) && 
                        !sharedUsers.includes(u._id)
                      ).length === 0 && (
                        <p className="px-4 py-2 text-xs text-slate-500">No matching users found</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
