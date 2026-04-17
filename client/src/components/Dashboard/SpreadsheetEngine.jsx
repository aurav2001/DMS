import React, { useState, useEffect } from 'react';
import { X, Save, FileSpreadsheet, Loader2, Plus, Trash2, ChevronLeft, ChevronRight, Search, Filter, Monitor, ExternalLink, Shield, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getDocType } from '../../utils/fileUtils';

const ExcelEditor = ({ doc, onClose, onRefresh, readOnlyMode = false }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [workbook, setWorkbook] = useState(null);
    const [sheets, setSheets] = useState([]);
    const [activeSheet, setActiveSheet] = useState('');
    const [data, setData] = useState([]); // 2D array of the active sheet
    const [columns, setColumns] = useState([]);

    useEffect(() => {
        loadExcel();
    }, [doc]);

    const loadExcel = async () => {
        try {
            setLoading(true);
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE}/documents/download/${doc._id}`, {
                responseType: 'arraybuffer',
                headers: { 'x-auth-token': token }
            });

            const docInfo = getDocType(doc.fileType, doc.fileName, doc.title);
            const wb = XLSX.read(res.data, { type: 'array' });
            
            // Basic validation: XLSX files should start with PK (0x50 0x4B)
            if (docInfo.isExcel && !doc.fileName.endsWith('.csv')) {
                const bytes = new Uint8Array(res.data);
                if (bytes[0] !== 0x50 || bytes[1] !== 0x4B) {
                    throw new Error("Invalid format: This file claims to be a spreadsheet but is missing the required XLSX header.");
                }
            }

            setWorkbook(wb);
            setSheets(wb.SheetNames);
            
            if (wb.SheetNames.length > 0) {
                switchSheet(wb.SheetNames[0], wb);
            }
        } catch (err) {
            console.error('Excel Load Error:', err);
            // RECOVERY JUGAD: If high-fidelity read fails, try a 'raw' read
            try {
                const wb = XLSX.read(res.data, { type: 'array', raw: true, cellStyles: false });
                setWorkbook(wb);
                setSheets(wb.SheetNames);
                if (wb.SheetNames.length > 0) switchSheet(wb.SheetNames[0], wb);
                toast.success('Loaded in recovery mode', { icon: '🛡️' });
            } catch (recoveryErr) {
                const msg = err.message.includes('Invalid format') 
                    ? 'Error: This file is not a valid Excel document (.xlsx)' 
                    : 'Failed to load spreadsheet. It might be too large or corrupted.';
                toast.error(msg, { duration: 5000 });
                onClose();
            }
        } finally {
            setLoading(false);
        }
    };

    const switchSheet = (sheetName, wb = workbook) => {
        const sheet = wb.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        
        // Ensure at least 20 rows and 10 columns for a good UI
        const paddedData = [...jsonData];
        while (paddedData.length < 20) paddedData.push(new Array(10).fill(''));
        
        setData(paddedData);
        setActiveSheet(sheetName);

        // Generate column headers (A, B, C...)
        const maxCols = Math.max(...paddedData.map(r => r.length), 10);
        const cols = [];
        for (let i = 0; i < maxCols; i++) {
            cols.push(XLSX.utils.encode_col(i));
        }
        setColumns(cols);
    };

    const handleCellChange = (rowIndex, colIndex, value) => {
        const newData = [...data];
        if (!newData[rowIndex]) newData[rowIndex] = [];
        newData[rowIndex][colIndex] = value;
        setData(newData);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            
            // Update the workbook with the current sheet's data
            const newSheet = XLSX.utils.aoa_to_sheet(data);
            workbook.Sheets[activeSheet] = newSheet;

            const wbOut = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbOut], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            
            const formData = new FormData();
            formData.append('file', blob, doc.fileName);
            formData.append('type', 'xlsx');

            const token = localStorage.getItem('token');
            await axios.post(`${API_BASE}/documents/${doc._id}/version`, formData, {
                headers: { 
                    'x-auth-token': token,
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success('Spreadsheet saved successfully!');
            onRefresh();
            onClose();
        } catch (err) {
            console.error('Save Error:', err);
            toast.error('Failed to save spreadsheet');
        } finally {
            setSaving(false);
        }
    };

    const openInDesktop = async () => {
        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
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
                toast.success(`Opening ${doc.title} in Excel...`, { icon: '🚀' });
            }
        } catch (err) {
            console.error('Desktop Open Error:', err);
            toast.error(err.response?.data?.message || 'Failed to open Desktop Application');
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full h-full max-w-6xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Premium Header (Unified) */}
                <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[#1d6f42]">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-slate-900 truncate max-w-md">
                                    {doc.title}
                                </h3>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${readOnlyMode ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                                    {readOnlyMode ? 'View Only' : 'Edit Mode'}
                                </span>
                            </div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                                {readOnlyMode ? 'Premium Native Engine (Same Format)' : 'DocVault Premium Spreadsheet Suite'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={openInDesktop}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-bold rounded-lg transition-all shadow-sm group"
                            title="Open in Original Microsoft Excel Desktop App"
                        >
                            <Monitor className="w-3.5 h-3.5 text-[#1d6f42] group-hover:scale-110 transition-transform" />
                            <span className="hidden md:inline">Open in Excel</span>
                        </button>

                        <div className="h-8 w-px bg-slate-200 mx-1 hidden md:block" />

                        <button onClick={onClose} className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Editor Toolbar (Only in Edit mode) */}
                {!readOnlyMode && (
                    <div className="h-12 bg-[#f3f2f1] border-b border-[#d1d1d1] flex items-center px-4 gap-4">
                        <div className="flex bg-white border border-[#d1d1d1] rounded overflow-hidden">
                            <button className="px-3 py-1 hover:bg-[#edebe9] text-[11px] font-bold border-r border-[#d1d1d1]">File</button>
                            <button className="px-3 py-1 bg-white text-[#1d6f42] text-[11px] font-bold border-r border-[#d1d1d1]">Home</button>
                            <button className="px-3 py-1 hover:bg-[#edebe9] text-[11px] font-bold">Insert</button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-[#d1d1d1] rounded text-[11px] text-[#323130] italic">
                                <span>Formula fx: </span>
                                <input className="flex-1 outline-none font-mono text-[10px]" placeholder="Enter formula..." readOnly={readOnlyMode} />
                            </div>
                        </div>
                        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-1.5 bg-[#1d6f42] text-white text-[11px] font-bold hover:bg-[#155a34] transition-all rounded shadow-sm">
                            <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                )}

                {/* Content Area */}
                <div className="flex-1 overflow-auto bg-[#f3f2f1] p-6 flex flex-col items-center relative scroll-smooth thin-scrollbar shadow-inner">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center text-slate-500 gap-4 mt-20">
                            <Loader2 className="w-12 h-12 animate-spin text-[#1d6f42]" />
                            <p className="font-medium">Opening spreadsheet...</p>
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center">
                            <div className="inline-block bg-white shadow-[0_10px_40px_rgba(0,0,0,0.1)] rounded-xl border border-gray-300 overflow-hidden min-w-full">
                                <table className="border-collapse table-fixed w-full font-sans">
                                    <thead>
                                        <tr>
                                            <th className="w-10 bg-[#f3f2f1] border border-[#d1d1d1] sticky top-0 left-0 z-20"></th>
                                            {columns.map((col, i) => (
                                                <th key={i} className="min-w-[120px] h-8 bg-[#f3f2f1] border border-[#d1d1d1] text-[10px] font-bold text-[#616161] sticky top-0 z-10 uppercase">
                                                    {col}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.map((row, rowIndex) => (
                                            <tr key={rowIndex}>
                                                <td className="bg-[#f3f2f1] border border-[#d1d1d1] text-[10px] font-bold text-center text-[#616161] sticky left-0 z-10">
                                                    {rowIndex + 1}
                                                </td>
                                                {columns.map((_, colIndex) => (
                                                    <td key={colIndex} className="p-0 border border-[#e1e1e1] relative transition-all">
                                                        <input 
                                                            className={`w-full h-8 px-2 text-xs border-none outline-none bg-transparent ${readOnlyMode ? 'cursor-default' : 'focus:bg-emerald-50 focus:ring-1 focus:ring-emerald-500/30'}`}
                                                            value={row[colIndex] || ''}
                                                            onChange={(e) => {
                                                                if (readOnlyMode) return;
                                                                const newData = [...data];
                                                                newData[rowIndex][colIndex] = e.target.value;
                                                                setData(newData);
                                                            }}
                                                            readOnly={readOnlyMode}
                                                            style={{ color: '#323130' }}
                                                        />
                                                    </td>
                                                ))}
                                            </tr>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="bg-white/20 text-white text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider border border-white/10">Premium Editor</span>
                            <span className="text-green-100 text-[9px] font-medium opacity-80">Excel Engine Active</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={openInDesktop}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-[11px] font-bold rounded-full transition-all group"
                    >
                        <Monitor className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                        <span>Open in Desktop</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                    </button>
                    {!readOnlyMode && (
                        <button 
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-5 py-2 bg-white text-[#1d6f42] hover:bg-green-50 disabled:opacity-50 text-xs font-bold rounded-full transition-all shadow-sm"
                        >
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    )}
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-red-500 hover:text-white text-white/80 rounded-full transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Formula Bar Simulation */}
            <div className="h-10 bg-white border-b border-gray-200 flex items-center px-4 gap-2">
                <div className="flex items-center justify-center w-10 h-6 bg-gray-50 border border-gray-200 rounded text-[10px] font-bold text-gray-500">fx</div>
                <input 
                    className="flex-1 h-7 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1d6f42] rounded border border-transparent hover:border-gray-200"
                    placeholder="Enter formula or text..."
                    readOnly
                />
            </div>

            {/* Main Content: The Grid */}
            <div className="flex-1 overflow-auto bg-gray-100 p-4">
                {loading ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4 text-gray-400">
                        <Loader2 className="w-10 h-10 animate-spin text-[#1d6f42]" />
                        <p className="font-bold text-sm">Initializing Spreadsheet Engine...</p>
                    </div>
                ) : (
                    <div className="inline-block bg-white shadow-[0_10px_40px_rgba(0,0,0,0.1)] rounded-xl border border-gray-300 overflow-hidden min-w-full">
                        <table className="border-collapse table-fixed w-full font-sans">
                            <thead>
                                <tr>
                                    <th className="w-10 bg-[#f3f2f1] border border-[#d1d1d1] sticky top-0 left-0 z-20"></th>
                                    {columns.map((col, i) => (
                                        <th key={i} className="min-w-[120px] h-8 bg-[#f3f2f1] border border-[#d1d1d1] text-[10px] font-bold text-[#616161] sticky top-0 z-10 uppercase">
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((row, rowIndex) => (
                                    <tr key={rowIndex}>
                                        <td className="bg-[#f3f2f1] border border-[#d1d1d1] text-[10px] font-bold text-center text-[#616161] sticky left-0 z-10">
                                            {rowIndex + 1}
                                        </td>
                                        {columns.map((_, colIndex) => (
                                            <td key={colIndex} className="p-0 border border-[#e1e1e1] focus-within:ring-1 focus-within:ring-[#1d6f42] focus-within:z-30 relative transition-all">
                                                <input 
                                                    className={`w-full h-8 px-2 text-xs border-none outline-none focus:bg-white bg-transparent ${readOnlyMode ? 'cursor-default' : 'hover:bg-[#f3f2f1]/50'} transition-colors`}
                                                    value={row[colIndex] || ''}
                                                    onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                                    readOnly={readOnlyMode}
                                                    style={{ color: '#323130' }}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Footer / Sheet Tabs */}
            <div className="h-10 bg-[#f3f3f3] border-t border-gray-300 flex items-center px-4 gap-2">
                <div className="flex items-center gap-1 bg-white border border-gray-300 rounded px-2 py-1 h-7">
                    <Plus className="w-3.5 h-3.5 text-gray-400 cursor-pointer hover:text-[#1d6f42]" />
                </div>
                <div className="h-full flex items-center">
                    {sheets.map(sheet => (
                        <button
                            key={sheet}
                            onClick={() => switchSheet(sheet)}
                            className={`h-full px-6 flex items-center text-[11px] font-bold tracking-tight transition-all border-r border-gray-300 ${
                                activeSheet === sheet 
                                ? 'bg-white text-[#1d6f42] border-t-2 border-t-[#1d6f42]' 
                                : 'text-gray-500 hover:bg-gray-200'
                            }`}
                        >
                            {sheet}
                        </button>
                    ))}
                </div>
                <div className="ml-auto flex items-center gap-4 text-[10px] text-gray-400 font-bold uppercase">
                    <span className="flex items-center gap-1"><Filter className="w-3 h-3" /> Filter: Off</span>
                    <span className="flex items-center gap-1"><Search className="w-3 h-3" /> Search Active</span>
                </div>
            </div>
        </div>
    );
};

export default ExcelEditor;
