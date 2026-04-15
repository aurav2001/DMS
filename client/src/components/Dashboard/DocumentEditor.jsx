import React, { useState, useEffect, useRef } from 'react';
import { X, Save, FileText, Loader2, Type, Undo2, Redo2, Bold, Italic, Underline, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, 
  Link2, Image, Table, Minus, ChevronDown, Palette, Highlighter, 
  Strikethrough, Subscript, Superscript, IndentIncrease, IndentDecrease,
  Printer, ZoomIn, ZoomOut, FileDown, Copy, Scissors, Clipboard
} from 'lucide-react';
import * as mammoth from 'mammoth';
import { PDFDocument, rgb } from 'pdf-lib';
import axios from 'axios';
import toast from 'react-hot-toast';

const FONTS = ['Arial', 'Times New Roman', 'Calibri', 'Georgia', 'Verdana', 'Courier New', 'Trebuchet MS', 'Comic Sans MS', 'Impact', 'Tahoma'];
const FONT_SIZES = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '26', '28', '36', '48', '72'];
const COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#cccccc', '#efefef', '#f3f3f3', '#ffffff',
  '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#9900ff', '#ff00ff',
  '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#cfe2f3', '#d9d2e9', '#ead1dc',
  '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#9fc5e8', '#b4a7d6', '#d5a6bd',
  '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6fa8dc', '#8e7cc3', '#c27ba0',
  '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3d85c6', '#674ea7', '#a64d79',
  '#990000', '#b45f06', '#bf9000', '#38761d', '#134f5c', '#0b5394', '#351c75', '#741b47',
];

const DocumentEditor = ({ doc, onClose, onRefresh }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [mode, setMode] = useState('');
    const [pdfInstance, setPdfInstance] = useState(null);
    const [pdfUrl, setPdfUrl] = useState('');
    const [zoom, setZoom] = useState(100);
    const [showFontPicker, setShowFontPicker] = useState(false);
    const [showSizePicker, setShowSizePicker] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showHighlightPicker, setShowHighlightPicker] = useState(false);
    const [currentFont, setCurrentFont] = useState('Calibri');
    const [currentSize, setCurrentSize] = useState('11');
    const [activeTab, setActiveTab] = useState('Home');
    const editorRef = useRef(null);

    const tabs = ['File', 'Home', 'Insert', 'Layout', 'Review', 'View'];

    useEffect(() => {
        loadDocument();
    }, [doc]);

    const loadDocument = async () => {
        try {
            setLoading(true);
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE}/documents/download/${doc._id}`, {
                responseType: 'arraybuffer',
                headers: { 'x-auth-token': token }
            });

            if (doc.fileType.includes('pdf')) {
                setMode('pdf');
                const pdfDoc = await PDFDocument.load(res.data);
                setPdfInstance(pdfDoc);
                const pdfBytes = await pdfDoc.save();
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                setPdfUrl(URL.createObjectURL(blob));
            } else if (doc.fileType.includes('word') || doc.fileType.includes('officedocument')) {
                setMode('word');
                const result = await mammoth.convertToHtml({ arrayBuffer: res.data });
                // Wait for editor to mount then set content
                setTimeout(() => {
                    if (editorRef.current) {
                        editorRef.current.innerHTML = result.value;
                    }
                }, 100);
            } else {
                toast.error('Format not supported for browser editing yet');
                onClose();
            }
        } catch (err) {
            console.error('Editor Load Error:', err);
            toast.error('Failed to load document for editing');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const execCommand = (command, value = null) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            
            if (mode === 'word') {
                const htmlContent = editorRef.current?.innerHTML || '';
                const token = localStorage.getItem('token');
                await axios.post(`${API_BASE}/documents/${doc._id}/version`, {
                    htmlContent,
                    type: 'docx'
                }, {
                    headers: { 'x-auth-token': token }
                });
            } else if (mode === 'pdf') {
                const pdfBytes = await pdfInstance.save();
                const token = localStorage.getItem('token');
                const formData = new FormData();
                formData.append('file', new Blob([pdfBytes], { type: 'application/pdf' }), doc.fileName);
                formData.append('type', 'pdf');
                await axios.post(`${API_BASE}/documents/${doc._id}/version`, formData, {
                    headers: { 
                        'x-auth-token': token,
                        'Content-Type': 'multipart/form-data'
                    }
                });
            }

            toast.success('Document saved successfully!');
            onRefresh();
            onClose();
        } catch (err) {
            console.error('Save Error:', err);
            toast.error('Failed to save document');
        } finally {
            setSaving(false);
        }
    };

    const ToolbarButton = ({ icon: Icon, label, onClick, active, className = '' }) => (
        <button
            onClick={onClick}
            title={label}
            className={`p-1.5 rounded hover:bg-[#c8c8c8] transition-colors ${active ? 'bg-[#c8c8c8]' : ''} ${className}`}
        >
            <Icon className="w-4 h-4 text-[#333]" />
        </button>
    );

    const ToolbarSeparator = () => <div className="w-px h-6 bg-[#d1d1d1] mx-1" />;

    const renderHomeTab = () => (
        <div className="flex items-center gap-0.5 px-2 py-1 flex-wrap">
            {/* Clipboard Group */}
            <div className="flex items-center gap-0.5 pr-2 border-r border-[#d1d1d1] mr-2">
                <ToolbarButton icon={Clipboard} label="Paste" onClick={() => execCommand('paste')} />
                <ToolbarButton icon={Scissors} label="Cut" onClick={() => execCommand('cut')} />
                <ToolbarButton icon={Copy} label="Copy" onClick={() => execCommand('copy')} />
            </div>

            {/* Font Family Picker */}
            <div className="relative">
                <button 
                    onClick={() => { setShowFontPicker(!showFontPicker); setShowSizePicker(false); }}
                    className="flex items-center gap-1 px-2 py-1 bg-white border border-[#c8c8c8] rounded text-xs min-w-[120px] hover:border-[#0078d4] transition-colors"
                >
                    <span className="truncate" style={{ fontFamily: currentFont }}>{currentFont}</span>
                    <ChevronDown className="w-3 h-3 text-[#666] flex-shrink-0" />
                </button>
                {showFontPicker && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-[#c8c8c8] rounded shadow-xl z-50 max-h-64 overflow-y-auto">
                        {FONTS.map(font => (
                            <button 
                                key={font}
                                onClick={() => { execCommand('fontName', font); setCurrentFont(font); setShowFontPicker(false); }}
                                className="w-full text-left px-3 py-1.5 text-sm hover:bg-[#deecf9] transition-colors"
                                style={{ fontFamily: font }}
                            >
                                {font}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Font Size Picker */}
            <div className="relative ml-1">
                <button 
                    onClick={() => { setShowSizePicker(!showSizePicker); setShowFontPicker(false); }}
                    className="flex items-center gap-1 px-2 py-1 bg-white border border-[#c8c8c8] rounded text-xs min-w-[50px] hover:border-[#0078d4] transition-colors"
                >
                    <span>{currentSize}</span>
                    <ChevronDown className="w-3 h-3 text-[#666]" />
                </button>
                {showSizePicker && (
                    <div className="absolute top-full left-0 mt-1 w-20 bg-white border border-[#c8c8c8] rounded shadow-xl z-50 max-h-64 overflow-y-auto">
                        {FONT_SIZES.map(size => (
                            <button 
                                key={size}
                                onClick={() => { execCommand('fontSize', size <= 10 ? '1' : size <= 13 ? '3' : size <= 18 ? '4' : size <= 24 ? '5' : size <= 36 ? '6' : '7'); setCurrentSize(size); setShowSizePicker(false); }}
                                className="w-full text-left px-3 py-1.5 text-sm hover:bg-[#deecf9] transition-colors"
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <ToolbarSeparator />

            {/* Text Format */}
            <ToolbarButton icon={Bold} label="Bold (Ctrl+B)" onClick={() => execCommand('bold')} />
            <ToolbarButton icon={Italic} label="Italic (Ctrl+I)" onClick={() => execCommand('italic')} />
            <ToolbarButton icon={Underline} label="Underline (Ctrl+U)" onClick={() => execCommand('underline')} />
            <ToolbarButton icon={Strikethrough} label="Strikethrough" onClick={() => execCommand('strikethrough')} />

            {/* Text Color */}
            <div className="relative">
                <button 
                    onClick={() => { setShowColorPicker(!showColorPicker); setShowHighlightPicker(false); }}
                    className="p-1.5 rounded hover:bg-[#c8c8c8] transition-colors flex flex-col items-center"
                    title="Font Color"
                >
                    <Type className="w-4 h-4 text-[#333]" />
                    <div className="w-4 h-1 bg-red-600 rounded-sm mt-0.5" />
                </button>
                {showColorPicker && (
                    <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-[#c8c8c8] rounded shadow-xl z-50 w-[200px]">
                        <p className="text-xs text-gray-500 mb-1 font-medium">Font Color</p>
                        <div className="grid grid-cols-8 gap-0.5">
                            {COLORS.map(color => (
                                <button 
                                    key={color}
                                    onClick={() => { execCommand('foreColor', color); setShowColorPicker(false); }}
                                    className="w-5 h-5 rounded border border-gray-200 hover:scale-125 transition-transform"
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Highlight Color */}
            <div className="relative">
                <button 
                    onClick={() => { setShowHighlightPicker(!showHighlightPicker); setShowColorPicker(false); }}
                    className="p-1.5 rounded hover:bg-[#c8c8c8] transition-colors"
                    title="Highlight Color"
                >
                    <Highlighter className="w-4 h-4 text-[#333]" />
                </button>
                {showHighlightPicker && (
                    <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-[#c8c8c8] rounded shadow-xl z-50 w-[200px]">
                        <p className="text-xs text-gray-500 mb-1 font-medium">Highlight</p>
                        <div className="grid grid-cols-8 gap-0.5">
                            {COLORS.slice(0, 24).map(color => (
                                <button 
                                    key={color}
                                    onClick={() => { execCommand('hiliteColor', color); setShowHighlightPicker(false); }}
                                    className="w-5 h-5 rounded border border-gray-200 hover:scale-125 transition-transform"
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <ToolbarSeparator />

            {/* Alignment */}
            <ToolbarButton icon={AlignLeft} label="Align Left" onClick={() => execCommand('justifyLeft')} />
            <ToolbarButton icon={AlignCenter} label="Align Center" onClick={() => execCommand('justifyCenter')} />
            <ToolbarButton icon={AlignRight} label="Align Right" onClick={() => execCommand('justifyRight')} />
            <ToolbarButton icon={AlignJustify} label="Justify" onClick={() => execCommand('justifyFull')} />

            <ToolbarSeparator />

            {/* Lists & Indent */}
            <ToolbarButton icon={List} label="Bullet List" onClick={() => execCommand('insertUnorderedList')} />
            <ToolbarButton icon={ListOrdered} label="Numbered List" onClick={() => execCommand('insertOrderedList')} />
            <ToolbarButton icon={IndentDecrease} label="Decrease Indent" onClick={() => execCommand('outdent')} />
            <ToolbarButton icon={IndentIncrease} label="Increase Indent" onClick={() => execCommand('indent')} />

            <ToolbarSeparator />

            {/* Undo/Redo */}
            <ToolbarButton icon={Undo2} label="Undo (Ctrl+Z)" onClick={() => execCommand('undo')} />
            <ToolbarButton icon={Redo2} label="Redo (Ctrl+Y)" onClick={() => execCommand('redo')} />
        </div>
    );

    const renderInsertTab = () => (
        <div className="flex items-center gap-0.5 px-2 py-1">
            <ToolbarButton icon={Table} label="Insert Table" onClick={() => execCommand('insertHTML', '<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse; width:100%; border:1px solid #ccc;"><tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr><tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr><tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr></table>')} />
            <ToolbarButton icon={Image} label="Insert Image" onClick={() => {
                const url = prompt('Enter image URL:');
                if (url) execCommand('insertImage', url);
            }} />
            <ToolbarButton icon={Link2} label="Insert Link" onClick={() => {
                const url = prompt('Enter URL:');
                if (url) execCommand('createLink', url);
            }} />
            <ToolbarButton icon={Minus} label="Horizontal Line" onClick={() => execCommand('insertHorizontalRule')} />
        </div>
    );

    return (
        <div className="fixed inset-0 z-[200] bg-[#f3f3f3] flex flex-col" onClick={() => { setShowFontPicker(false); setShowSizePicker(false); setShowColorPicker(false); setShowHighlightPicker(false); }}>
            
            {/* ===== Title Bar (Word Online style) ===== */}
            <div className="h-10 bg-[#185abd] flex items-center justify-between px-4 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-white" />
                        <span className="text-white text-sm font-semibold">{doc.title}</span>
                        <span className="text-blue-200 text-xs">- DocVault Editor</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-1 bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white text-xs font-semibold rounded transition-all"
                    >
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button 
                        onClick={onClose}
                        className="p-1 hover:bg-red-600 text-white rounded transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* ===== Ribbon Tabs ===== */}
            <div className="bg-[#f3f3f3] border-b border-[#d1d1d1]">
                <div className="flex items-center">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-1.5 text-xs font-medium transition-colors ${
                                activeTab === tab 
                                    ? 'text-[#185abd] border-b-2 border-[#185abd] bg-white' 
                                    : 'text-[#666] hover:text-[#333] hover:bg-[#e5e5e5]'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* ===== Ribbon Toolbar ===== */}
            {mode === 'word' && (
                <div className="bg-[#f3f3f3] border-b border-[#d1d1d1] min-h-[40px]" onClick={e => e.stopPropagation()}>
                    {activeTab === 'Home' && renderHomeTab()}
                    {activeTab === 'Insert' && renderInsertTab()}
                    {activeTab === 'Layout' && (
                        <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-[#666]">
                            <span>Margins: Normal</span>
                            <ToolbarSeparator />
                            <span>Orientation: Portrait</span>
                            <ToolbarSeparator />
                            <span>Size: A4</span>
                        </div>
                    )}
                    {activeTab === 'View' && (
                        <div className="flex items-center gap-2 px-3 py-1.5">
                            <ToolbarButton icon={ZoomOut} label="Zoom Out" onClick={() => setZoom(Math.max(50, zoom - 10))} />
                            <span className="text-xs font-medium text-[#333] min-w-[40px] text-center">{zoom}%</span>
                            <ToolbarButton icon={ZoomIn} label="Zoom In" onClick={() => setZoom(Math.min(200, zoom + 10))} />
                            <ToolbarSeparator />
                            <ToolbarButton icon={Printer} label="Print" onClick={() => window.print()} />
                        </div>
                    )}
                    {activeTab === 'File' && (
                        <div className="flex items-center gap-2 px-3 py-1.5">
                            <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1 bg-[#185abd] text-white text-xs rounded hover:bg-[#1348a0] transition-colors">
                                <Save className="w-3.5 h-3.5" /> Save
                            </button>
                            <button onClick={() => {
                                const blob = new Blob([editorRef.current?.innerHTML || ''], { type: 'text/html' });
                                const a = document.createElement('a');
                                a.href = URL.createObjectURL(blob);
                                a.download = `${doc.title}.html`;
                                a.click();
                            }} className="flex items-center gap-1.5 px-3 py-1 border border-[#c8c8c8] text-xs rounded hover:bg-[#e5e5e5] transition-colors">
                                <FileDown className="w-3.5 h-3.5" /> Export as HTML
                            </button>
                            <ToolbarSeparator />
                            <button onClick={onClose} className="flex items-center gap-1.5 px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors">
                                <X className="w-3.5 h-3.5" /> Close Editor
                            </button>
                        </div>
                    )}
                    {activeTab === 'Review' && (
                        <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-[#666]">
                            <span>Word Count: {editorRef.current?.innerText?.split(/\s+/).filter(Boolean).length || 0} words</span>
                        </div>
                    )}
                </div>
            )}

            {/* ===== Ruler ===== */}
            {mode === 'word' && (
                <div className="bg-white border-b border-[#e0e0e0] flex justify-center">
                    <div className="w-full max-w-[820px] h-5 relative">
                        <div className="absolute inset-0 flex items-end">
                            {Array.from({ length: 21 }).map((_, i) => (
                                <div key={i} className="flex-1 border-l border-[#ccc] h-full flex items-end justify-start pl-0.5">
                                    <span className="text-[7px] text-[#999] leading-none">{i}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ===== Document Canvas ===== */}
            <div className="flex-1 overflow-auto bg-[#e8e8e8] flex justify-center py-8 px-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center text-slate-500 gap-4">
                        <Loader2 className="w-12 h-12 animate-spin text-[#185abd]" />
                        <p className="font-medium">Opening document...</p>
                    </div>
                ) : mode === 'word' ? (
                    <div 
                        style={{ 
                            transform: `scale(${zoom / 100})`, 
                            transformOrigin: 'top center',
                            transition: 'transform 0.2s ease'
                        }}
                    >
                        <div 
                            ref={editorRef}
                            contentEditable
                            suppressContentEditableWarning
                            className="bg-white shadow-[0_2px_10px_rgba(0,0,0,0.12)] outline-none"
                            style={{
                                width: '816px',       /* 8.5 inches * 96 DPI */
                                minHeight: '1056px',   /* 11 inches * 96 DPI */
                                padding: '96px 72px',  /* 1 inch top/bottom, 0.75 inch left/right */
                                fontFamily: 'Calibri, sans-serif',
                                fontSize: '11pt',
                                lineHeight: '1.5',
                                color: '#333',
                                boxSizing: 'border-box',
                            }}
                            onKeyDown={(e) => {
                                // Ctrl+B, Ctrl+I, Ctrl+U shortcuts
                                if (e.ctrlKey && e.key === 'b') { e.preventDefault(); execCommand('bold'); }
                                if (e.ctrlKey && e.key === 'i') { e.preventDefault(); execCommand('italic'); }
                                if (e.ctrlKey && e.key === 'u') { e.preventDefault(); execCommand('underline'); }
                                if (e.ctrlKey && e.key === 's') { e.preventDefault(); handleSave(); }
                                if (e.ctrlKey && e.key === 'z') { e.preventDefault(); execCommand('undo'); }
                                if (e.ctrlKey && e.key === 'y') { e.preventDefault(); execCommand('redo'); }
                            }}
                        />
                    </div>
                ) : (
                    <iframe 
                        src={pdfUrl} 
                        className="bg-white shadow-lg rounded"
                        style={{ width: '816px', height: '90vh' }}
                        title="PDF Viewer"
                    />
                )}
            </div>

            {/* ===== Status Bar ===== */}
            <div className="h-6 bg-[#185abd] flex items-center justify-between px-4 text-white text-[10px]">
                <div className="flex items-center gap-4">
                    <span>Page 1 of 1</span>
                    <span>{editorRef.current?.innerText?.split(/\s+/).filter(Boolean).length || 0} Words</span>
                    <span>{mode === 'word' ? 'Editing' : 'Viewing'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setZoom(Math.max(50, zoom - 10))} className="hover:bg-white/20 p-0.5 rounded">
                        <ZoomOut className="w-3 h-3" />
                    </button>
                    <div className="w-16 h-1 bg-white/30 rounded-full relative">
                        <div className="absolute h-full bg-white rounded-full" style={{ width: `${((zoom - 50) / 150) * 100}%` }} />
                    </div>
                    <button onClick={() => setZoom(Math.min(200, zoom + 10))} className="hover:bg-white/20 p-0.5 rounded">
                        <ZoomIn className="w-3 h-3" />
                    </button>
                    <span className="ml-1">{zoom}%</span>
                </div>
            </div>
        </div>
    );
};

export default DocumentEditor;
