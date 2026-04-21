import React, { useState, useEffect } from 'react';
import { X, Save, FileSpreadsheet, Loader2, Plus, Trash2, ChevronLeft, ChevronRight, Search, Filter, Monitor, ExternalLink, Shield, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getDocType } from '../../utils/fileUtils';
import { API_BASE } from '../../utils/api';

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
    }, [doc, readOnlyMode]);

    const loadExcel = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE}/documents/download/${doc._id}`, {
                responseType: 'arraybuffer',
                headers: { 'x-auth-token': token }
            });

            const wb = XLSX.read(res.data, { type: 'array' });
            setWorkbook(wb);
            setSheets(wb.SheetNames);
            if (wb.SheetNames.length > 0) switchSheet(wb.SheetNames[0], wb);
        } catch (err) {
            console.error('Excel Load Error:', err);
            toast.error('Failed to load spreadsheet');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const switchSheet = (sheetName, wb = workbook) => {
        const sheet = wb.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        const paddedData = [...jsonData];
        while (paddedData.length < 20) paddedData.push(new Array(10).fill(''));
        setData(paddedData);
        setActiveSheet(sheetName);
        const maxCols = Math.max(...paddedData.map(r => r.length), 10);
        const cols = [];
        for (let i = 0; i < maxCols; i++) cols.push(XLSX.utils.encode_col(i));
        setColumns(cols);
    };

    const handleCellChange = (rowIndex, colIndex, value) => {
        const newData = [...data];
        if (!newData[rowIndex]) newData[rowIndex] = [];
        newData[rowIndex][colIndex] = value;
        setData(newData);
    };

    const openInDesktop = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE}/documents/${doc._id}/open-in-desktop`, {}, {
                headers: { 'x-auth-token': token }
            });
            if (res.data.uri) {
                toast.success('Opening in Excel Desktop...', { icon: '🚀' });
                window.location.href = res.data.uri;
            }
        } catch (err) {
            toast.error('Failed to open Excel App');
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const newSheet = XLSX.utils.aoa_to_sheet(data);
            workbook.Sheets[activeSheet] = newSheet;
            const wbOut = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbOut], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const formData = new FormData();
            formData.append('file', blob, doc.fileName);
            formData.append('type', 'xlsx');
            const token = localStorage.getItem('token');
            await axios.post(`${API_BASE}/documents/${doc._id}/version`, formData, {
                headers: { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' }
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


    return (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full h-full max-w-6xl rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[#1d6f42]">
                            <FileSpreadsheet className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 truncate max-w-md">{doc.title}</h3>
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                                {readOnlyMode ? 'View Only' : 'Edit Mode'} • DocVault Premium Engine
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={openInDesktop}
                            className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-all active:scale-95 group"
                        >
                            <Monitor className="w-4 h-4 text-[#1d6f42] group-hover:animate-bounce" />
                            <span>OPEN IN EXCEL APP</span>
                            <ExternalLink className="w-3 h-3 opacity-50" />
                        </button>

                        {!readOnlyMode && (
                            <button 
                                onClick={handleSave} 
                                disabled={saving}
                                className={`flex items-center gap-2 px-5 py-2 ${saving ? 'bg-amber-400' : 'bg-[#1d6f42]'} hover:opacity-90 text-white text-xs font-black rounded-lg transition-all shadow-lg active:scale-95 group`}
                            >
                                {saving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                )}
                                {saving ? 'SAVING...' : 'SAVE TO SERVER'}
                            </button>
                        )}
                        
                        <button 
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Toolbar */}
                {!readOnlyMode && (
                    <div className="h-12 bg-[#f3f2f1] border-b border-[#d1d1d1] flex items-center px-4 gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-[#d1d1d1] rounded text-[11px] italic">
                                <span>fx:</span>
                                <input className="flex-1 outline-none font-mono text-[10px]" placeholder="Enter formula..." readOnly />
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                            <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-emerald-600" /> Cloud Sync Active</span>
                        </div>
                    </div>
                )}

                {/* Grid */}
                <div className="flex-1 overflow-auto bg-gray-100 p-4">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4 text-gray-400">
                            <Loader2 className="w-10 h-10 animate-spin text-[#1d6f42]" />
                            <p className="font-bold text-sm">Initializing Spreadsheet Engine...</p>
                        </div>
                    ) : (
                        <div className="inline-block bg-white shadow-xl rounded-xl border border-gray-300 overflow-hidden min-w-full">
                            <table className="border-collapse table-fixed w-full font-sans">
                                <thead>
                                    <tr>
                                        <th className="w-10 bg-[#f3f2f1] border border-[#d1d1d1] sticky top-0 left-0 z-20"></th>
                                        {columns.map((col, i) => (
                                            <th key={i} className="min-w-[120px] h-8 bg-[#f3f2f1] border border-[#d1d1d1] text-[10px] font-bold text-[#616161] sticky top-0 z-10 uppercase">{col}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((row, rowIndex) => (
                                        <tr key={rowIndex}>
                                            <td className="bg-[#f3f2f1] border border-[#d1d1d1] text-[10px] font-bold text-center text-[#616161] sticky left-0 z-10">{rowIndex + 1}</td>
                                            {columns.map((_, colIndex) => (
                                                <td key={colIndex} className="p-0 border border-[#e1e1e1] relative">
                                                    <input 
                                                        className={`w-full h-8 px-2 text-xs border-none outline-none bg-transparent ${readOnlyMode ? 'cursor-default' : 'focus:bg-emerald-50'}`}
                                                        value={row[colIndex] || ''}
                                                        onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                                        readOnly={readOnlyMode}
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

                {/* Footer */}
                <div className="h-10 bg-[#f3f3f3] border-t border-gray-300 flex items-center px-4 gap-2">
                    <div className="h-full flex items-center">
                        {sheets.map(sheet => (
                            <button
                                key={sheet}
                                onClick={() => switchSheet(sheet)}
                                className={`h-full px-6 flex items-center text-[11px] font-bold transition-all border-r border-gray-300 ${activeSheet === sheet ? 'bg-white text-[#1d6f42] border-t-2 border-t-[#1d6f42]' : 'text-gray-500 hover:bg-gray-200'}`}
                            >
                                {sheet}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExcelEditor;
