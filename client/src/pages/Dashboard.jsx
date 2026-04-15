import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/Dashboard/DashboardLayout';
import DocumentGrid from '../components/Dashboard/DocumentGrid';
import UploadModal from '../components/Dashboard/UploadModal';
import GlobalShareModal from '../components/Dashboard/GlobalShareModal';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Dashboard = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('My Documents');
    const [searchQuery, setSearchQuery] = useState('');
    const { token } = useAuth();

    const fetchDocuments = async () => {
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/documents`, {
                params: { tab: activeTab, search: searchQuery }
            });
            setDocuments(res.data);
        } catch (err) {
            toast.error('Failed to fetch documents');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchDocuments();
    }, [token, activeTab, searchQuery]);

    const handleUploadSuccess = (newDoc) => {
        setDocuments([newDoc, ...documents]);
        setIsUploadOpen(false);
    };

    return (
        <DashboardLayout 
            onUploadClick={() => setIsUploadOpen(true)}
            onShareClick={() => setIsShareModalOpen(true)}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            docCount={documents.length}
        >
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
                    ))}
                </div>
            ) : (
                <DocumentGrid documents={documents} fetchDocuments={fetchDocuments} />
            )}
            
            {isUploadOpen && (
                <UploadModal 
                    onClose={() => setIsUploadOpen(false)} 
                    onSuccess={handleUploadSuccess} 
                />
            )}

            {isShareModalOpen && (
                <GlobalShareModal 
                    onClose={() => setIsShareModalOpen(false)}
                    onSuccess={fetchDocuments}
                />
            )}
        </DashboardLayout>
    );
};

export default Dashboard;
