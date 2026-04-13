import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Users, FileText, HardDrive, Shield, Trash2, Eye, EyeOff, 
  Download, Edit3, Camera, CameraOff, Lock, Unlock, ChevronDown,
  BarChart3, ArrowLeft, Search, AlertTriangle
} from 'lucide-react';

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
        const res = await axios.get(`${API_BASE}/admin/documents`);
        setDocuments(res.data);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
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
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full max-w-md pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
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
                            {u._id !== user?.id && (
                              <button onClick={() => deleteUser(u._id)} className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
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
                      onUpdate={updatePermissions}
                      formatBytes={formatBytes}
                    />
                  ))}
                  {filteredDocs.length === 0 && (
                    <div className="text-center py-12 text-slate-500 bg-white/5 rounded-2xl">No documents found</div>
                  )}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Document Permission Card Component
const DocumentPermissionCard = ({ doc, onUpdate, formatBytes }) => {
  const [expanded, setExpanded] = useState(false);
  const [perms, setPerms] = useState(doc.permissions || {
    canView: true, canDownload: true, canEdit: false, preventScreenshot: false, watermark: false
  });
  const [access, setAccess] = useState(doc.accessLevel || 'private');

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
                    const isOn = pb.key === 'preventScreenshot' || pb.key === 'watermark' ? perms[pb.key] : perms[pb.key];
                    const Icon = isOn ? pb.icon : pb.offIcon;
                    return (
                      <button
                        key={pb.key}
                        onClick={() => togglePerm(pb.key)}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          isOn 
                            ? `bg-${pb.color}-500/10 border-${pb.color}-500/30 text-${pb.color}-400`
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
