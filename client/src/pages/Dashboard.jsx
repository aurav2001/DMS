import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/Dashboard/DashboardLayout';
import DocumentGrid from '../components/Dashboard/DocumentGrid';
import Breadcrumbs from '../components/Dashboard/Breadcrumbs';
import UploadModal from '../components/Dashboard/UploadModal';
import NewFolderModal from '../components/Dashboard/NewFolderModal';
import ShareModal from '../components/Dashboard/ShareModal';
import GlobalShareModal from '../components/Dashboard/GlobalShareModal';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FolderPlus, Share2, Trash2 } from 'lucide-react';
import { API_BASE } from '../utils/api';

const Dashboard = () => {
    const [documents, setDocuments] = useState([]);
    const [folders, setFolders] = useState([]);
    const [crumbs, setCrumbs] = useState([]);
    const [currentFolderId, setCurrentFolderId] = useState('root');
    
    const [loading, setLoading] = useState(true);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [shareData, setShareData] = useState(null); // { id, type, name }
    const [activeTab, setActiveTab] = useState('My Documents');
    const [searchQuery, setSearchQuery] = useState('');
    const { token } = useAuth();

    const fetchContents = async () => {
        try {
            setLoading(true);
            // Fetch Folders and Documents for the current view
            const res = await axios.get(`${API_BASE}/folders/contents/${currentFolderId}`, {
                params: { tab: activeTab, search: searchQuery },
                headers: { 'x-auth-token': token }
            });
            setFolders(res.data.folders);
            setDocuments(res.data.documents);

            // Fetch Breadcrumbs if not in root
            if (currentFolderId !== 'root') {
                const bRes = await axios.get(`${API_BASE}/folders/${currentFolderId}/breadcrumbs`, {
                    headers: { 'x-auth-token': token }
                });
                setCrumbs(bRes.data);
            } else {
                setCrumbs([]);
            }
        } catch (err) {
            toast.error('Failed to fetch contents');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchContents();
    }, [token, activeTab, searchQuery, currentFolderId]);

    const handleFolderOpen = (id, name) => {
        setCurrentFolderId(id);
    };

    const handleNavigate = (id) => {
        setCurrentFolderId(id);
    };

    const handleFolderDelete = async (id) => {
        if (!window.confirm('Delete this folder and all its items?')) return;
        try {
            await axios.delete(`${API_BASE}/folders/${id}`, {
                headers: { 'x-auth-token': token }
            });
            toast.success('Folder deleted');
            fetchContents();
        } catch (err) {
            toast.error('Failed to delete folder');
        }
    };

    const handleFolderShare = (id, name) => {
        setShareData({ id, name, type: 'folder' });
    };

    const handleDocShare = (id, name) => {
        setShareData({ id, name, type: 'document' });
    };

    // Document Handlers
    const handleDocStar = async (id) => {
        try {
            await axios.patch(`${API_BASE}/documents/${id}/star`, {}, { headers: { 'x-auth-token': token } });
            fetchContents();
        } catch (err) { toast.error('Failed to update'); }
    };

    const handleDocDelete = async (id) => {
        if (!window.confirm('Delete this document?')) return;
        try {
            await axios.delete(`${API_BASE}/documents/${id}`, { headers: { 'x-auth-token': token } });
            toast.success('Moved to trash');
            fetchContents();
        } catch (err) { toast.error('Delete failed'); }
    };

    const handleSync = async () => {
        try {
            setLoading(true);
            const res = await axios.post(`${API_BASE}/documents/sync`, {}, { headers: { 'x-auth-token': token } });
            toast.success(res.data.message);
            fetchContents();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Sync failed');
        } finally { setLoading(false); }
    };

    return (
        <DashboardLayout 
            onUploadClick={() => setIsUploadOpen(true)}
            onNewFolderClick={() => setIsNewFolderOpen(true)}
            onShareClick={() => setIsShareModalOpen(true)}
            onSyncClick={handleSync}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            docCount={documents.length + folders.length}
        >
            <Breadcrumbs crumbs={crumbs} onNavigate={handleNavigate} />

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-40 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
                    ))}
                </div>
            ) : (
                <DocumentGrid 
                    documents={documents} 
                    folders={folders}
                    onRefresh={fetchContents}
                    onFolderOpen={handleFolderOpen}
                    onFolderDelete={handleFolderDelete}
                    onFolderShare={handleFolderShare}
                    onStar={handleDocStar}
                    onDelete={handleDocDelete}
                    onShare={handleDocShare}
                />
            )}
            
            {isUploadOpen && (
                <UploadModal 
                    folderId={currentFolderId === 'root' ? null : currentFolderId}
                    onClose={() => setIsUploadOpen(false)} 
                    onSuccess={fetchContents} 
                />
            )}

            {isNewFolderOpen && (
                <NewFolderModal 
                    currentFolderId={currentFolderId}
                    onClose={() => setIsNewFolderOpen(false)}
                    onSuccess={fetchContents}
                />
            )}

            {isShareModalOpen && (
                <GlobalShareModal 
                    onClose={() => setIsShareModalOpen(false)}
                    onSuccess={fetchContents}
                />
            )}

            {shareData && (
                <ShareModal 
                    isOpen={!!shareData}
                    onClose={() => setShareData(null)}
                    itemId={shareData.id}
                    itemName={shareData.name}
                    itemType={shareData.type}
                    onSuccess={fetchContents}
                />
            )}
        </DashboardLayout>
    );
};

export default Dashboard;
