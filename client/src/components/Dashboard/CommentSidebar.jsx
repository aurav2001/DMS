import React, { useState, useEffect } from 'react';
import { Send, User, MessageSquare, X, Clock } from 'lucide-react';
import axios from 'axios';
import { API_BASE, SOCKET_URL, ENABLE_SOCKETS } from '../../utils/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';

const CommentSidebar = ({ docId, user }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchComments();

        // Socket setup for real-time comments
        if (!ENABLE_SOCKETS) return;

        const socket = io(SOCKET_URL);
        socket.emit('join_location', { userId: user?._id, name: user?.name, location: docId });

        socket.on('annotation_added', (comment) => {
            setComments(prev => {
                // Avoid duplicates if sender
                if (prev.find(c => c._id === comment._id)) return prev;
                return [...prev, comment];
            });
        });

        return () => socket.disconnect();
    }, [docId]);

    const fetchComments = async () => {
        try {
            const res = await axios.get(`${API_BASE}/documents/${docId}/annotations`, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            setComments(res.data);
        } catch (err) {
            console.error('Failed to fetch comments');
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE}/documents/${docId}/annotations`, 
                { text: newComment, type: 'general' },
                { headers: { 'x-auth-token': localStorage.getItem('token') } }
            );
            setComments([...comments, res.data]);
            setNewComment('');
            toast.success('Comment added');
        } catch (err) {
            toast.error('Failed to add comment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-80 h-full bg-white dark:bg-slate-900 border-l dark:border-slate-800 flex flex-col shadow-xl animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-bold dark:text-white">Collaborations</h3>
                    <span className="bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{comments.length}</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {comments.length === 0 ? (
                    <div className="text-center py-10 opacity-30">
                        <MessageSquare className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-sm font-medium">No comments yet</p>
                        <p className="text-[10px]">Be the first to start the discussion!</p>
                    </div>
                ) : (
                    comments.map((c, i) => (
                        <motion.div 
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            key={i} 
                            className="group"
                        >
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                    {c.author?.avatar ? (
                                        <img src={c.author.avatar} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-4 h-4 text-slate-400" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-bold dark:text-white">{c.author?.name}</span>
                                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                            <Clock className="w-2.5 h-2.5" />
                                            {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700 group-hover:border-indigo-500/30 transition-colors">
                                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{c.text}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            <div className="p-4 border-t dark:border-slate-800 bg-white dark:bg-slate-900">
                <form onSubmit={handleSend} className="relative">
                    <textarea 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl p-3 pr-10 text-xs focus:ring-2 focus:ring-indigo-500 dark:text-white resize-none min-h-[80px]"
                    />
                    <button 
                        type="submit"
                        disabled={loading || !newComment.trim()}
                        className="absolute bottom-3 right-3 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all disabled:opacity-50 active:scale-95"
                    >
                        {loading ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CommentSidebar;
