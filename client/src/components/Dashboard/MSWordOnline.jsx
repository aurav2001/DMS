import React, { useState, useEffect, useRef } from 'react';
import { X, Save, FileText, Loader2, Type, Undo2, Redo2, Bold, Italic, Underline, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, 
  Link2, Image, Table, Minus, Plus, ChevronDown, Palette, Highlighter, 
  Strikethrough, Subscript, Superscript, IndentIncrease, IndentDecrease,
  Printer, ZoomIn, ZoomOut, FileDown, Copy, Scissors, Clipboard, Share2, Check, Trash, Monitor, ExternalLink,
  Eye, Lock, Shield, Download // ✅ Added missing icons for Premium View
} from 'lucide-react';
import mammoth from 'mammoth';
import { PDFDocument, rgb } from 'pdf-lib';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getDocType } from '../../utils/fileUtils';
import { API_BASE } from '../../utils/api';

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

const MSWordOnline = ({ doc, onClose, onRefresh, readOnlyMode = false }) => {
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
    const [tablePicker, setTablePicker] = useState({ visible: false, rows: 0, cols: 0, custom: false });
    const [customTable, setCustomTable] = useState({ rows: 3, cols: 3 });
    const [pages, setPages] = useState([{ id: 1, content: '' }]);
    const [focusedPageIdx, setFocusedPageIdx] = useState(0);
    const [selectedImg, setSelectedImg] = useState(null);
    const [imageSettings, setImageSettings] = useState({ visible: false, rect: null });
    const [selectedCell, setSelectedCell] = useState(null);
    const [tableSettings, setTableSettings] = useState({ visible: false, rect: null });
    const [hfStatus, setHfStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
    const editorRefs = useRef([]);
    const fileInputRef = useRef(null);
    const selectionRef = useRef(null);

    const tabs = ['File', 'Home', 'Insert', 'Layout', 'Review', 'View'];

    useEffect(() => {
        loadDocument();
    }, [doc, readOnlyMode]);

    // ✅ FIX: Block all keyboard input when readOnlyMode is true
    useEffect(() => {
        if (!readOnlyMode) return;

        const blockInput = (e) => {
            // Allow navigation keys, copy, select-all — block everything else
            const allowedKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End'];
            const isCopy = (e.ctrlKey || e.metaKey) && e.key === 'c';
            const isSelectAll = (e.ctrlKey || e.metaKey) && e.key === 'a';
            
            if (!allowedKeys.includes(e.key) && !isCopy && !isSelectAll) {
                e.preventDefault();
                e.stopPropagation();
            }
        };

        document.addEventListener('keydown', blockInput, true);
        return () => document.removeEventListener('keydown', blockInput, true);
    }, [readOnlyMode]);

    const openInDesktop = async () => {
        try {
            const token = localStorage.getItem('token');
            
            const res = await axios.post(`${API_BASE}/documents/${doc._id}/open-in-desktop`, {}, {
                headers: { 'x-auth-token': token }
            });
            
            if (res.data.mode === 'protocol' && res.data.uri) {
                toast.success('Triggering Desktop Application...', { icon: '🚀' });
                setTimeout(() => {
                    window.location.href = res.data.uri;
                }, 1000);
            } else {
                toast.success(`Opening ${doc.title} in Desktop App...`, { icon: '🚀' });
            }
        } catch (err) {
            console.error('Desktop Open Error:', err);
            toast.error(err.response?.data?.message || 'Failed to open in Desktop App');
        }
    };

    const loadDocument = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE}/documents/download/${doc._id}?t=${Date.now()}`, {
                responseType: 'arraybuffer',
                headers: { 'x-auth-token': token }
            });

            const docInfo = getDocType(doc.fileType, doc.fileName, doc.title);
            
            if (docInfo.isPdf) {
                setMode('pdf');
                const pdfDoc = await PDFDocument.load(res.data);
                setPdfInstance(pdfDoc);
                const pdfBytes = await pdfDoc.save();
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                setPdfUrl(URL.createObjectURL(blob));
            } else if (docInfo.isWord) {
                setMode('word');
                
                const bytes = new Uint8Array(res.data);
                if (bytes[0] !== 0x50 || bytes[1] !== 0x4B) {
                    throw new Error("Invalid file format: This file does not appear to be a valid .docx document (missing ZIP header).");
                }

                if (readOnlyMode) {
                  // ✅ HIGH-FIDELITY JUGAD: Use docx-preview for "Same Format" Original look
                  setHfStatus('loading');
                  try {
                    if (!window.docx) {
                      await new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = "https://cdn.jsdelivr.net/npm/docx-preview@0.1.20/dist/docx-preview.js";
                        script.onload = resolve;
                        script.onerror = reject;
                        document.head.appendChild(script);
                      });
                    }
                    
                    setTimeout(async () => {
                      try {
                        const container = document.getElementById('high-fidelity-view');
                        if (container && window.docx) {
                          await window.docx.renderAsync(res.data, container, null, {
                            inWrapper: false,
                            ignoreHeight: false,
                            ignoreWidth: false,
                          });
                          setHfStatus('success');
                          setLoading(false);
                        } else {
                          setHfStatus('error');
                        }
                      } catch (renderErr) {
                        console.error("Render Error:", renderErr);
                        setHfStatus('error');
                      }
                    }, 500);
                  } catch (e) {
                    console.error("High Fidelity Script Load Failed:", e);
                    setHfStatus('error');
                  }
                }

                const mammothOptions = {
                    styleMap: [
                        "p[style-name='Heading 1'] => h1:fresh",
                        "p[style-name='Heading 2'] => h2:fresh",
                        "p[style-name='Heading 3'] => h3:fresh",
                        "p => p:fresh",
                        "r[style-name='Strong'] => b",
                        "p[style-align='center'] => p.center:fresh",
                        "p[style-align='right'] => p.right:fresh",
                        "p[style-align='left'] => p.left:fresh",
                        "p[style-align='both'] => p.justify:fresh"
                    ],
                    ignoreEmptyParagraphs: false
                };

                const result = await mammoth.convertToHtml({ arrayBuffer: res.data }, mammothOptions);
                
                const tempDiv = document.createElement('div');
                tempDiv.style.width = '816px';
                tempDiv.style.padding = '96px 72px';
                tempDiv.style.visibility = 'hidden';
                tempDiv.style.position = 'absolute';
                tempDiv.style.boxSizing = 'border-box';
                tempDiv.style.lineHeight = '1.4';
                tempDiv.style.fontFamily = 'Calibri, sans-serif';
                tempDiv.innerHTML = result.value;
                document.body.appendChild(tempDiv);

                const pageLimit = 1056; 
                const paginatedPages = [];
                let currentPageHtml = '';
                let currentHeight = 192; 

                Array.from(tempDiv.children).forEach((child) => {
                    const childHeight = child.offsetHeight || 24;
                    if (currentHeight + childHeight > pageLimit && currentPageHtml !== '') {
                        paginatedPages.push({ id: Date.now() + Math.random(), content: currentPageHtml });
                        currentPageHtml = child.outerHTML;
                        currentHeight = 192 + childHeight;
                    } else {
                        currentPageHtml += child.outerHTML;
                        currentHeight += childHeight;
                    }
                });
                
                if (currentPageHtml !== '') {
                    paginatedPages.push({ id: Date.now() + Math.random(), content: currentPageHtml });
                }

                document.body.removeChild(tempDiv);
                if (paginatedPages.length === 0) paginatedPages.push({ id: 1, content: result.value || '<p>No content found.</p>' });
                
                setPages(paginatedPages);
            } else {
                throw new Error("This file type is not supported for browser viewing. Try downloading instead.");
            }
        } catch (err) {
            console.error('Editor Load Error:', err);
            try {
                if (doc.fileType?.includes('word') || doc.fileName?.endsWith('.docx')) {
                    const result = await mammoth.convertToHtml({ arrayBuffer: res.data }, { ignoreEmptyParagraphs: true });
                    setPages([{ id: 'recovery-page', content: result.value || 'Content could not be parsed.' }]);
                } else {
                    throw err;
                }
            } catch (recoveryErr) {
                const msg = err.message.includes('ZIP header') 
                    ? 'Error: File is not a valid .docx (it might be an old .doc or corrupted)' 
                    : 'Failed to load document for editing. Switching to safe view...';
                toast.error(msg, { duration: 5000 });
                if (!pages[0].content) onClose();
            }
        } finally {
            setLoading(false);
        }
    };

    const execCommand = (command, value = null) => {
        // ✅ FIX: Block execCommand in read-only mode
        if (readOnlyMode) return;

        if (selectionRef.current) {
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(selectionRef.current);
        }
        
        document.execCommand('styleWithCSS', false, false);
        document.execCommand(command, false, value);
        
        const activePage = editorRefs.current[focusedPageIdx];
        activePage?.focus();
        saveSelection();
    };

    const handlePageInput = (idx, e) => {
        // ✅ FIX: Block any input changes in read-only mode
        if (readOnlyMode) {
            e.preventDefault();
            return;
        }

        const el = e.currentTarget;
        const newPages = [...pages];
        newPages[idx].content = el.innerHTML;
        
        if (el.scrollHeight > 1056) {
            const lastChild = el.lastElementChild;
            if (lastChild) {
                const overflowHtml = lastChild.outerHTML;
                lastChild.remove();
                newPages[idx].content = el.innerHTML;
                
                if (idx + 1 < newPages.length) {
                    newPages[idx + 1].content = overflowHtml + newPages[idx + 1].content;
                } else {
                    newPages.push({ id: Date.now(), content: overflowHtml });
                }
                setPages(newPages);
            }
        }
    };

    const handleKeyDown = (e, idx) => {
        // ✅ FIX: In read-only mode, only allow navigation & copy keys
        if (readOnlyMode) {
            const allowedKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End'];
            const isCopy = (e.ctrlKey || e.metaKey) && e.key === 'c';
            const isSelectAll = (e.ctrlKey || e.metaKey) && e.key === 'a';
            if (!allowedKeys.includes(e.key) && !isCopy && !isSelectAll) {
                e.preventDefault();
            }
            return;
        }

        if (e.key === 'Tab') {
            e.preventDefault();
            document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
        }
        
        if (e.key === 'Backspace') {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                if (range.startOffset === 0 && range.endOffset === 0 && idx > 0) {
                    const prevPage = editorRefs.current[idx - 1];
                    if (prevPage) {
                        e.preventDefault();
                        prevPage.focus();
                        const newRange = document.createRange();
                        newRange.selectNodeContents(prevPage);
                        newRange.collapse(false);
                        const newSel = window.getSelection();
                        newSel.removeAllRanges();
                        newSel.addRange(newRange);
                    }
                }
            }
        }
    };

    const saveSelection = () => {
        const selection = window.getSelection();
        const activePage = editorRefs.current[focusedPageIdx];
        if (selection.rangeCount > 0 && activePage?.contains(selection.anchorNode)) {
            selectionRef.current = selection.getRangeAt(0);
        }
    };

    const handleImageUpload = (e) => {
        if (readOnlyMode) return; // ✅ FIX: Block image upload in read-only
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const imgHtml = `<img src="${event.target.result}" draggable="true" style="max-width: 100%; height: auto; display: block; margin: 10px 0; cursor: move;" />`;
                execCommand('insertHTML', imgHtml);
            };
            reader.readAsDataURL(file);
        }
    };

    const setImgAlignment = (align) => {
        if (readOnlyMode || !selectedImg) return; // ✅ FIX
        if (align === 'left') {
            selectedImg.style.float = 'left';
            selectedImg.style.margin = '0 15px 15px 0';
            selectedImg.style.display = 'inline';
        } else if (align === 'right') {
            selectedImg.style.float = 'right';
            selectedImg.style.margin = '0 0 15px 15px';
            selectedImg.style.display = 'inline';
        } else {
            selectedImg.style.float = 'none';
            selectedImg.style.display = 'block';
            selectedImg.style.margin = '15px auto';
        }
        updateImageHud();
    };

    const updateImageHud = () => {
        if (!selectedImg) return;
        const rect = selectedImg.getBoundingClientRect();
        const canvas = selectedImg.closest('.overflow-auto');
        const canvasRect = canvas.getBoundingClientRect();

        setImageSettings({
            visible: true,
            rect: {
                top: rect.top - canvasRect.top + canvas.scrollTop,
                left: rect.left - canvasRect.left + canvas.scrollLeft,
                width: rect.width,
                height: rect.height
            }
        });
    };

    const handleImgResize = (e, direction) => {
        if (readOnlyMode) return; // ✅ FIX: Block resize in read-only
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = selectedImg.clientWidth;
        
        const onMouseMove = (moveEvent) => {
            const delta = moveEvent.clientX - startX;
            const newWidth = startWidth + (direction === 'se' ? delta : -delta);
            if (newWidth > 50) {
                selectedImg.style.width = `${newWidth}px`;
                selectedImg.style.height = 'auto';
                updateImageHud();
            }
        };
        
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    const handleEditorClick = (e) => {
        const activePage = editorRefs.current[focusedPageIdx];

        // ✅ FIX: In read-only mode, don't show edit overlays for table/image
        if (readOnlyMode) {
            saveSelection();
            return;
        }

        if (e.target.tagName === 'IMG') {
            const prevSelected = activePage.querySelector('[data-selected="true"]');
            if (prevSelected) {
                prevSelected.removeAttribute('data-selected');
                prevSelected.style.outline = 'none';
            }

            setSelectedImg(e.target);
            e.target.setAttribute('data-selected', 'true');
            e.target.style.outline = '3px solid #0078d4';
            e.target.style.outlineOffset = '2px';
            
            setSelectedCell(null);
            setTableSettings({ visible: false, rect: null });
            const rect = e.target.getBoundingClientRect();
            const editorRect = activePage.getBoundingClientRect();
            setImageSettings({
                visible: true,
                rect: {
                    top: rect.top - editorRect.top + activePage.scrollTop,
                    left: rect.left - editorRect.left + activePage.scrollLeft,
                    width: rect.width,
                    height: rect.height
                }
            });
            saveSelection();
            return;
        } 
        
        const selected = activePage?.querySelector('[data-selected="true"]');
        if (selected) {
            selected.removeAttribute('data-selected');
            selected.style.outline = 'none';
        }
        
        const cell = e.target.closest('td, th');
        if (cell) {
            setSelectedCell(cell);
            setSelectedImg(null);
            setImageSettings({ visible: false, rect: null });
            const rect = cell.getBoundingClientRect();
            const editorRect = activePage.getBoundingClientRect();
            setTableSettings({
                visible: true,
                rect: {
                    top: rect.top - editorRect.top + activePage.scrollTop,
                    left: rect.left - editorRect.left + activePage.scrollLeft,
                    width: rect.width,
                    height: rect.height
                }
            });
        } else {
            setSelectedImg(null);
            setImageSettings({ visible: false, rect: null });
            setSelectedCell(null);
            setTableSettings({ visible: false, rect: null });
        }
        saveSelection();
    };

    const handleTableAction = (action) => {
        if (readOnlyMode || !selectedCell) return; // ✅ FIX
        const row = selectedCell.parentElement;
        const table = row.closest('table');
        const rowIndex = row.rowIndex;
        const cellIndex = selectedCell.cellIndex;

        switch (action) {
            case 'insertRowBelow':
                const newRow = table.insertRow(rowIndex + 1);
                for (let i = 0; i < row.cells.length; i++) {
                    const newCell = newRow.insertCell(i);
                    newCell.innerHTML = '&nbsp;';
                    newCell.style.border = '1px solid #dee2e6';
                    newCell.style.padding = '8px';
                }
                break;
            case 'insertColRight':
                for (let i = 0; i < table.rows.length; i++) {
                    const newCell = table.rows[i].insertCell(cellIndex + 1);
                    newCell.innerHTML = '&nbsp;';
                    newCell.style.border = '1px solid #dee2e6';
                    newCell.style.padding = '8px';
                }
                break;
            case 'deleteRow':
                if (table.rows.length > 1) table.deleteRow(rowIndex);
                else table.remove();
                break;
            case 'deleteCol':
                if (row.cells.length > 1) {
                    for (let i = 0; i < table.rows.length; i++) table.rows[i].deleteCell(cellIndex);
                } else table.remove();
                break;
            case 'deleteTable':
                table.remove();
                break;
            default: break;
        }
        setTableSettings({ visible: false, rect: null });
        setSelectedCell(null);
    };

    const insertTable = (rows, cols) => {
        if (readOnlyMode) return; // ✅ FIX
        let tableHtml = `<table border="1" style="border-collapse: collapse; width: 100%; border: 1px solid #dee2e6; margin: 10px 0;"><tbody>`;
        for (let i = 0; i < rows; i++) {
            tableHtml += '<tr>';
            for (let j = 0; j < cols; j++) {
                tableHtml += '<td style="border: 1px solid #dee2e6; padding: 8px; min-width: 50px;">&nbsp;</td>';
            }
            tableHtml += '</tr>';
        }
        tableHtml += '</tbody></table><p>&nbsp;</p>';
        execCommand('insertHTML', tableHtml);
        setTablePicker({ visible: false, rows: 0, cols: 0 });
    };

    const handleSave = async () => {
        if (readOnlyMode) return; // ✅ FIX: Can't save in read-only
        try {
            setSaving(true);
            
            if (mode === 'word') {
                const htmlContent = pages.map(p => p.content).join('<div style="page-break-after: always;"></div>');
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

    const ToolbarButton = ({ icon: Icon, label, onClick, active, className = '', showLabel = false }) => (
        <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClick}
            title={label}
            className={`flex flex-col items-center justify-center p-1.5 rounded-sm hover:bg-[#edebe9] transition-colors border border-transparent ${active ? 'bg-[#edebe9] border-[#c8c6c4]' : ''} ${className}`}
        >
            <Icon className={`w-4 h-4 ${active ? 'text-[#2b579a]' : 'text-[#323130]'}`} />
            {showLabel && <span className="text-[10px] mt-1 text-[#323130] font-medium leading-none">{label}</span>}
        </button>
    );

    const ToolbarSeparator = () => <div className="w-px h-8 bg-[#d1d1d1] mx-1 self-center" />;

    const GroupContainer = ({ children, label }) => (
        <div className="flex flex-col items-center px-2 border-r border-[#edebe9] h-full last:border-0 hover:bg-[#faf9f8] transition-colors">
            <div className="flex items-center gap-1.5 flex-1 p-2">
                {children}
            </div>
            <span className="text-[9px] text-[#605e5c] pb-1 uppercase tracking-tighter font-semibold">{label}</span>
        </div>
    );

    const renderHomeTab = () => (
        <div className="flex items-center gap-0 px-2 py-0.5 flex-wrap h-full">
            <GroupContainer label="Clipboard">
                <ToolbarButton icon={Clipboard} label="Paste" onClick={() => execCommand('paste')} showLabel />
                <div className="flex flex-col">
                    <ToolbarButton icon={Scissors} label="Cut" onClick={() => execCommand('cut')} />
                    <ToolbarButton icon={Copy} label="Copy" onClick={() => execCommand('copy')} />
                </div>
            </GroupContainer>

            <GroupContainer label="Font">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1">
                        <div className="relative">
                            <button 
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { setShowFontPicker(!showFontPicker); setShowSizePicker(false); saveSelection(); }}
                                className="flex items-center gap-1 px-2 py-0.5 bg-white border border-[#c8c8c8] rounded text-xs min-w-[100px] hover:border-[#0078d4] transition-colors"
                            >
                                <span className="truncate" style={{ fontFamily: currentFont }}>{currentFont}</span>
                                <ChevronDown className="w-3 h-3 text-[#666]" />
                            </button>
                            {showFontPicker && (
                                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-[#c8c8c8] rounded shadow-xl z-[300] max-h-64 overflow-y-auto">
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
                        <div className="relative">
                            <button 
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { setShowSizePicker(!showSizePicker); setShowFontPicker(false); saveSelection(); }}
                                className="flex items-center gap-1 px-2 py-0.5 bg-white border border-[#c8c8c8] rounded text-xs min-w-[45px] hover:border-[#0078d4] transition-colors"
                            >
                                <span>{currentSize}</span>
                                <ChevronDown className="w-3 h-3 text-[#666]" />
                            </button>
                            {showSizePicker && (
                                <div className="absolute top-full left-0 mt-1 w-16 bg-white border border-[#c8c8c8] rounded shadow-xl z-[300] max-h-64 overflow-y-auto">
                                    {FONT_SIZES.map(size => (
                                        <button 
                                            key={size}
                                            onClick={() => { execCommand('fontSize', size <= 10 ? '1' : size <= 13 ? '3' : size <= 18 ? '4' : size <= 24 ? '5' : size <= 36 ? '6' : '7'); setCurrentSize(size); setShowSizePicker(false); }}
                                            className="w-full text-left px-3 py-1 text-sm hover:bg-[#deecf9]"
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                        <ToolbarButton icon={Bold} label="Bold" onClick={() => execCommand('bold')} />
                        <ToolbarButton icon={Italic} label="Italic" onClick={() => execCommand('italic')} />
                        <ToolbarButton icon={Underline} label="Underline" onClick={() => execCommand('underline')} />
                        <ToolbarButton icon={Strikethrough} label="Strikethrough" onClick={() => execCommand('strikethrough')} />
                        <div className="relative">
                            <button 
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { setShowColorPicker(!showColorPicker); saveSelection(); }} 
                                className="p-1 hover:bg-[#c8c8c8] rounded flex flex-col items-center"
                            >
                                <Type className="w-4 h-4" />
                                <div className="w-3 h-1 bg-red-600 rounded-sm mt-0.5" />
                            </button>
                            {showColorPicker && (
                                <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-[#c8c8c8] rounded shadow-xl z-[300] w-[180px]">
                                    <div className="grid grid-cols-8 gap-0.5">
                                        {COLORS.map(color => (
                                            <button key={color} onClick={() => { execCommand('foreColor', color); setShowColorPicker(false); }} className="w-5 h-5 rounded hover:scale-125 transition-transform" style={{ backgroundColor: color }} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </GroupContainer>

            <GroupContainer label="Paragraph">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-0.5">
                        <ToolbarButton icon={List} label="Bullets" onClick={() => execCommand('insertUnorderedList')} />
                        <ToolbarButton icon={ListOrdered} label="Numbering" onClick={() => execCommand('insertOrderedList')} />
                        <ToolbarButton icon={IndentDecrease} label="Decrease Indent" onClick={() => execCommand('outdent')} />
                        <ToolbarButton icon={IndentIncrease} label="Increase Indent" onClick={() => execCommand('indent')} />
                    </div>
                    <div className="flex items-center gap-0.5">
                        <ToolbarButton icon={AlignLeft} label="Align Left" onClick={() => execCommand('justifyLeft')} />
                        <ToolbarButton icon={AlignCenter} label="Align Center" onClick={() => execCommand('justifyCenter')} />
                        <ToolbarButton icon={AlignRight} label="Align Right" onClick={() => execCommand('justifyRight')} />
                        <ToolbarButton icon={AlignJustify} label="Justify" onClick={() => execCommand('justifyFull')} />
                    </div>
                </div>
            </GroupContainer>

            <GroupContainer label="Styles">
                <div className="flex items-center gap-1">
                    <button onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('formatBlock', 'p')} className="flex flex-col items-center justify-center border border-[#d1d1d1] bg-white rounded p-1 w-12 h-12 hover:border-[#0078d4]">
                        <span className="text-[10px] font-bold">AaBbCc</span>
                        <span className="text-[8px] text-gray-500">Normal</span>
                    </button>
                    <button onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('formatBlock', 'h1')} className="flex flex-col items-center justify-center border border-[#d1d1d1] bg-white rounded p-1 w-12 h-12 hover:border-[#0078d4]">
                        <span className="text-[10px] font-bold">AaBbCc</span>
                        <span className="text-[8px] text-gray-500">Title</span>
                    </button>
                    <button onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('formatBlock', 'h2')} className="flex flex-col items-center justify-center border border-[#d1d1d1] bg-white rounded p-1 w-12 h-12 hover:border-[#0078d4]">
                        <span className="text-[10px] font-bold">AaBbCc</span>
                        <span className="text-[8px] text-gray-500">Subtitle</span>
                    </button>
                    <ToolbarButton icon={ChevronDown} label="More" onClick={() => {}} />
                </div>
            </GroupContainer>

            <GroupContainer label="Editing">
                <ToolbarButton icon={Undo2} label="Undo" onClick={() => execCommand('undo')} showLabel />
                <ToolbarButton icon={Redo2} label="Redo" onClick={() => execCommand('redo')} showLabel />
            </GroupContainer>
        </div>
    );

    const renderInsertTab = () => (
        <div className="flex items-center gap-0 px-2 py-0.5 h-full">
            <GroupContainer label="Tables">
                <div className="relative">
                    <ToolbarButton 
                        icon={Table} 
                        label="Table" 
                        onClick={() => setTablePicker({ ...tablePicker, visible: !tablePicker.visible })} 
                        showLabel 
                    />
                    {tablePicker.visible && (
                        <div className="absolute top-full left-0 mt-1 p-3 bg-white border border-[#c8c8c8] shadow-2xl z-[300] rounded w-[230px]">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-semibold text-[#333]">Insert Table</span>
                                <span className="text-[10px] text-blue-600">{tablePicker.rows}x{tablePicker.cols}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '4px', marginBottom: '8px' }}>
                                {Array.from({ length: 100 }).map((_, i) => {
                                    const r = Math.floor(i / 10) + 1;
                                    const c = (i % 10) + 1;
                                    const isSelected = r <= tablePicker.rows && c <= tablePicker.cols;
                                    return (
                                        <div 
                                            key={i}
                                            style={{ width: '18px', height: '18px', border: '1px solid', borderColor: isSelected ? '#0078d4' : '#dee2e6', backgroundColor: isSelected ? '#deecf9' : '#f8f9fa' }}
                                            className="cursor-pointer transition-colors"
                                            onMouseDown={(e) => e.preventDefault()}
                                            onMouseEnter={() => setTablePicker({ ...tablePicker, rows: r, cols: c })}
                                            onClick={() => insertTable(r, c)}
                                        />
                                    );
                                })}
                            </div>
                            <button 
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => setTablePicker({ ...tablePicker, custom: !tablePicker.custom })}
                                className="w-full text-center py-1.5 text-[10px] text-[#333] hover:bg-[#f3f3f3] border-t border-[#eee]"
                            >
                                {tablePicker.custom ? 'Hide Custom' : 'Custom Table...'}
                            </button>
                            {tablePicker.custom && (
                                <div className="mt-2 pt-2 border-t border-[#eee] flex items-center gap-2">
                                    <div className="flex-1">
                                        <p className="text-[8px] text-gray-500 mb-0.5 uppercase">Rows</p>
                                        <input type="number" value={customTable.rows} onChange={(e) => setCustomTable({...customTable, rows: parseInt(e.target.value) || 1})} className="w-full border border-gray-300 rounded px-1 py-0.5 text-[10px]" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[8px] text-gray-500 mb-0.5 uppercase">Cols</p>
                                        <input type="number" value={customTable.cols} onChange={(e) => setCustomTable({...customTable, cols: parseInt(e.target.value) || 1})} className="w-full border border-gray-300 rounded px-1 py-0.5 text-[10px]" />
                                    </div>
                                    <button onClick={() => insertTable(customTable.rows, customTable.cols)} className="h-8 px-2 bg-blue-600 text-white rounded text-[10px] self-end hover:bg-blue-700">Insert</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </GroupContainer>

            <GroupContainer label="Illustrations">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                <ToolbarButton icon={Image} label="Pictures" onClick={() => fileInputRef.current?.click()} showLabel />
            </GroupContainer>

            <GroupContainer label="Links">
                <ToolbarButton icon={Link2} label="Link" onClick={() => {
                    const url = prompt('Enter URL:');
                    if (url) execCommand('createLink', url);
                }} showLabel />
            </GroupContainer>

            <GroupContainer label="Symbols">
                <ToolbarButton icon={Minus} label="Line" onClick={() => execCommand('insertHorizontalRule')} showLabel />
            </GroupContainer>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => { setShowFontPicker(false); setShowSizePicker(false); setShowColorPicker(false); setShowHighlightPicker(false); }}>
            <div className="bg-white w-full h-full max-w-6xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Top Toolbar - Logo & Global Actions */}
                <div className="h-14 bg-[#185abd] flex items-center justify-between px-4 shadow-lg z-[60]">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm border border-white/5">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-sm tracking-tight">{doc.title}</h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="bg-white/20 text-white text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider border border-white/10">Premium High-Fidelity Editor</span>
                                <span className="text-blue-100 text-[9px] font-medium opacity-80 flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Auto-Sync Active
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {!readOnlyMode && (
                            <button 
                                onClick={handleSave} 
                                disabled={saving}
                                className={`flex items-center gap-2 px-5 py-2 ${saving ? 'bg-amber-400' : 'bg-emerald-500'} hover:opacity-90 text-white text-xs font-black rounded-lg transition-all shadow-lg active:scale-95 group`}
                            >
                                {saving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                )}
                                {saving ? 'SAVING TO CLOUD...' : 'SAVE TO SERVER'}
                            </button>
                        )}
                        
                        <button 
                            onClick={onClose}
                            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Editor Ribbon (Editable Only) */}
                {!readOnlyMode && (
                    <div className="bg-[#f3f2f1] border-b border-[#d1d1d1] flex flex-col">
                        <div className="flex items-center px-4">
                            {tabs.map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-1.5 text-[11px] font-bold transition-all border-b-2 ${
                                        activeTab === tab 
                                            ? 'text-[#2b579a] border-[#2b579a] bg-white shadow-sm' 
                                            : 'text-[#323130] border-transparent hover:bg-white/50 hover:text-[#005a9e]'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                            <div className="flex-1" />
                        </div>
                        
                        {mode === 'word' && (
                            <div className="bg-[#f3f3f3] border-t border-[#d1d1d1] min-h-[92px] flex items-stretch">
                                {activeTab === 'Home' && renderHomeTab()}
                                {activeTab === 'Insert' && renderInsertTab()}
                                {activeTab === 'Layout' && (
                                    <div className="flex px-2 py-0.5 h-full">
                                        <GroupContainer label="Page Setup">
                                            <ToolbarButton icon={FileText} label="Margins" onClick={() => {}} showLabel />
                                            <ToolbarButton icon={AlignCenter} label="Orientation" onClick={() => {}} showLabel />
                                            <ToolbarButton icon={Minus} label="Size" onClick={() => {}} showLabel />
                                        </GroupContainer>
                                    </div>
                                )}
                                {activeTab === 'View' && (
                                    <div className="flex px-2 py-0.5 h-full">
                                        <GroupContainer label="Zoom">
                                            <ToolbarButton icon={ZoomOut} label="Zoom Out" onClick={() => setZoom(Math.max(50, zoom - 10))} showLabel />
                                            <div className="flex flex-col items-center justify-center min-w-[50px]">
                                                <span className="text-xs font-bold text-[#333]">{zoom}%</span>
                                                <span className="text-[9px] text-[#888]">Scale</span>
                                            </div>
                                            <ToolbarButton icon={ZoomIn} label="Zoom In" onClick={() => setZoom(Math.min(200, zoom + 10))} showLabel />
                                        </GroupContainer>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Content Area */}
                <div className="flex-1 overflow-auto bg-[#f3f2f1] p-6 flex flex-col items-center relative scroll-smooth thin-scrollbar shadow-inner">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center text-slate-500 gap-4 mt-20">
                            <Loader2 className="w-12 h-12 animate-spin text-[#185abd]" />
                            <p className="font-medium">Opening document...</p>
                        </div>
                    ) : (
                        <div className="w-full flex flex-col items-center">
                            {/* High-Fidelity Preview (Reading Only) */}
                            {readOnlyMode && hfStatus !== 'error' && (
                                <div id="high-fidelity-view" className="bg-white shadow-[0_10px_40px_rgba(0,0,0,0.1)] rounded-sm mb-8" style={{ width: '816px', minHeight: '1056px' }}></div>
                            )}

                            {/* Main Editable/Fallback Content */}
                            {(!readOnlyMode || hfStatus === 'error') && pages.map((page, idx) => (
                                <div key={page.id} className="relative mb-8 flex flex-col items-center">
                                    <div 
                                        ref={el => editorRefs.current[idx] = el}
                                        contentEditable={!readOnlyMode}
                                        suppressContentEditableWarning={true}
                                        onInput={(e) => {
                                            const newPages = [...pages];
                                            newPages[idx].content = e.currentTarget.innerHTML;
                                            setPages(newPages);
                                        }}
                                        onFocus={() => setFocusedPageIdx(idx)}
                                        onClick={handleEditorClick}
                                        className={`bg-white shadow-[0_10px_40px_rgba(0,0,0,0.1)] outline-none ${readOnlyMode ? 'cursor-default' : 'cursor-text'}`}
                                        style={{
                                            width: '816px',
                                            minHeight: '1056px',
                                            padding: '96px 96px',
                                            fontFamily: currentFont + ', "Segoe UI", Calibri, sans-serif',
                                            fontSize: currentSize + 'pt',
                                            lineHeight: '1.5',
                                            color: '#323130',
                                            boxSizing: 'border-box',
                                            overflow: 'hidden',
                                            zoom: zoom / 100,
                                        }}
                                        dangerouslySetInnerHTML={{ __html: page.content }}
                                    />
                                    <div className="mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">Page {idx+1} of {pages.length}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Premium Footer */}
                <div className="h-12 border-t border-slate-200 flex items-center justify-between px-6 bg-slate-50">
                    <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5"><Shield className="w-3 h-3 text-emerald-500" /> Cloud Sync Secure</span>
                        <span className="hidden md:inline font-bold text-slate-400">V5.9-UNIFIED</span>
                        <span className="hidden md:inline">• Premium High-Fidelity Enabled</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {!readOnlyMode && (
                            <span className="text-[10px] text-slate-400 italic hidden sm:block">Changes will be saved to version history</span>
                        )}
                        <button 
                            onClick={() => {
                                const link = document.createElement('a');
                                link.href = doc.fileUrl;
                                link.download = doc.fileName;
                                link.click();
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-lg transition-all"
                        >
                            <Download className="w-3.5 h-3.5" /> Download Original
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MSWordOnline;
