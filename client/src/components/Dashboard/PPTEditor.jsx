import React, { useState, useEffect } from 'react';
import { X, Save, Presentation, Loader2, ChevronLeft, ChevronRight, Type, Monitor } from 'lucide-react';
import JSZip from 'jszip';
import PptxGenJS from 'pptxgenjs';
import axios from 'axios';
import toast from 'react-hot-toast';

const PPTEditor = ({ doc, onClose, onRefresh }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [slides, setSlides] = useState([]); // Array of slide objects {id, title, notes, elements: []}
    const [activeSlideIndex, setActiveSlideIndex] = useState(0);

    useEffect(() => {
        loadPPT();
    }, [doc]);

    const loadPPT = async () => {
        try {
            setLoading(true);
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE}/documents/download/${doc._id}`, {
                responseType: 'arraybuffer',
                headers: { 'x-auth-token': token }
            });

            // Validate ZIP header (PPTX files must start with PK)
            const bytes = new Uint8Array(res.data);
            if (bytes[0] !== 0x50 || bytes[1] !== 0x4B) {
                throw new Error("Invalid format: This file is not a valid PowerPoint document (.pptx). Missing ZIP header.");
            }

            const zip = await JSZip.loadAsync(res.data);
            const slideFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'));
            
            const parsedSlides = await Promise.all(slideFiles.map(async (fileName, idx) => {
                const content = await zip.file(fileName).async('text');
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(content, 'text/xml');
                
                // Simplified text extraction
                const textNodes = Array.from(xmlDoc.getElementsByTagName('a:t'));
                return {
                    id: idx + 1,
                    text: textNodes.map(node => node.textContent).join(' \n'),
                    fileName
                };
            }));

            setSlides(parsedSlides);
        } catch (err) {
            console.error('PPT Load Error:', err);
            toast.error('Failed to parse presentation. It might be too complex for browser editing.');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleTextChange = (value) => {
        const newSlides = [...slides];
        newSlides[activeSlideIndex].text = value;
        setSlides(newSlides);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            
            // Use PptxGenJS to recreate the presentation with the new text
            const pptx = new PptxGenJS();
            pptx.title = doc.title;

            slides.forEach(slide => {
                const s = pptx.addSlide();
                s.addText(slide.text, { 
                    x: 1, y: 1, w: '80%', h: '80%', 
                    fontSize: 18, color: '363636', align: 'center', valign: 'middle'
                });
            });

            const blob = await pptx.write('blob');
            
            const formData = new FormData();
            formData.append('file', blob, doc.fileName);
            formData.append('type', 'pptx');

            const token = localStorage.getItem('token');
            await axios.post(`${API_BASE}/documents/${doc._id}/version`, formData, {
                headers: { 
                    'x-auth-token': token,
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success('Presentation saved!');
            onRefresh();
            onClose();
        } catch (err) {
            console.error('Save Error:', err);
            toast.error('Failed to save presentation');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-[#f0f2f5] flex flex-col font-sans">
            {/* Header */}
            <div className="h-14 bg-[#b7472a] flex items-center justify-between px-4 shadow-lg z-50">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-xl">
                        <Presentation className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-sm">{doc.title}</h2>
                        <div className="flex items-center gap-2">
                            <span className="bg-white/20 text-white text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider">PPT Editor v1.0</span>
                            <span className="text-red-100 text-[10px] font-medium opacity-80">Slide {activeSlideIndex + 1} of {slides.length}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 bg-white text-[#b7472a] hover:bg-red-50 disabled:opacity-50 text-xs font-black rounded-full transition-all shadow-md group"
                    >
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                        {saving ? 'Processing...' : 'Export & Save'}
                    </button>
                    <button 
                        onClick={onClose}
                        className="p-2.5 hover:bg-white/10 text-white rounded-full transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar (Thumbnails) */}
                <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto p-4 flex flex-col gap-4">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-2">Slides Overview</h3>
                    {loading ? (
                        Array.from({length: 3}).map((_, i) => (
                            <div key={i} className="aspect-video bg-gray-100 animate-pulse rounded-lg border-2 border-transparent" />
                        ))
                    ) : (
                        slides.map((slide, idx) => (
                            <button
                                key={slide.id}
                                onClick={() => setActiveSlideIndex(idx)}
                                className={`group relative aspect-video rounded-lg border-2 transition-all p-3 text-[8px] text-gray-400 overflow-hidden text-left ${
                                    activeSlideIndex === idx 
                                    ? 'border-[#b7472a] bg-red-50 shadow-md ring-4 ring-red-500/10' 
                                    : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                                }`}
                            >
                                <span className="absolute top-1 left-1 font-bold text-[#b7472a] flex items-center gap-1">
                                    <Monitor className="w-2.5 h-2.5" /> Slide {idx + 1}
                                </span>
                                <div className="mt-4 line-clamp-3">
                                    {slide.text || 'Empty slide content'}
                                </div>
                            </button>
                        ))
                    )}
                </div>

                {/* Main Editor Area */}
                <div className="flex-1 bg-gray-200/50 p-8 flex flex-col items-center overflow-auto">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4 text-gray-400">
                            <Loader2 className="w-12 h-12 animate-spin text-[#b7472a]" />
                            <p className="font-black text-xs uppercase tracking-widest italic">Decoding Slide Data...</p>
                        </div>
                    ) : slides.length > 0 ? (
                        <div className="w-full max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[#b7472a]/10 rounded-lg">
                                        <Type className="w-5 h-5 text-[#b7472a]" />
                                    </div>
                                    <h4 className="font-bold text-gray-700">Edit Slide Content</h4>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        disabled={activeSlideIndex === 0}
                                        onClick={() => setActiveSlideIndex(activeSlideIndex - 1)}
                                        className="p-2 bg-white rounded-lg shadow-sm disabled:opacity-30 hover:text-[#b7472a] transition-colors"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button 
                                        disabled={activeSlideIndex === slides.length - 1}
                                        onClick={() => setActiveSlideIndex(activeSlideIndex + 1)}
                                        className="p-2 bg-white rounded-lg shadow-sm disabled:opacity-30 hover:text-[#b7472a] transition-colors"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-2xl p-10 min-h-[500px] flex flex-col border border-gray-100">
                                <div className="flex-1 flex flex-col gap-4">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Slide Text</label>
                                    <textarea 
                                        className="flex-1 w-full p-6 text-xl text-gray-700 bg-gray-50 rounded-xl focus:ring-4 focus:ring-red-500/5 focus:outline-none border-2 border-transparent focus:border-[#b7472a]/20 transition-all resize-none leading-relaxed"
                                        placeholder="Start typing slide content..."
                                        value={slides[activeSlideIndex].text}
                                        onChange={(e) => handleTextChange(e.target.value)}
                                    />
                                </div>
                                <div className="mt-8 pt-8 border-t border-gray-100 flex items-center justify-between text-gray-400">
                                    <div className="flex items-center gap-4 text-[10px] font-bold">
                                        <span>Words: {slides[activeSlideIndex].text.split(/\s+/).filter(Boolean).length}</span>
                                        <span>Characters: {slides[activeSlideIndex].text.length}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 animate-pulse">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                        <span className="text-[9px] font-bold uppercase tracking-tighter">Live Preview Active</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-gray-400">No slides found in this presentation.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PPTEditor;
