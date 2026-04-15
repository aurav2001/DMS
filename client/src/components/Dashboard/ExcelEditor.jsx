import React, { useState, useEffect } from 'react';
import { X, Save, FileSpreadsheet, Loader2, Plus, Trash2, ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import toast from 'react-hot-toast';

const ExcelEditor = ({ doc, onClose, onRefresh }) => {
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

            const wb = XLSX.read(res.data, { type: 'array' });
            setWorkbook(wb);
            setSheets(wb.SheetNames);
            
            if (wb.SheetNames.length > 0) {
                switchSheet(wb.SheetNames[0], wb);
            }
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

    return (
        <div className="fixed inset-0 z-[200] bg-[#f8f9fa] flex flex-col font-sans">
            {/* Header / Ribbon */}
            <div className="h-14 bg-[#1d6f42] flex items-center justify-between px-4 shadow-md">
                <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-1.5 rounded-lg">
                        <FileSpreadsheet className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-sm leading-tight">{doc.title}</h2>
                        <p className="text-green-100 text-[10px] uppercase font-bold tracking-wider">Excel Online Editor</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 bg-white text-[#1d6f42] hover:bg-green-50 disabled:opacity-50 text-xs font-bold rounded-full transition-all shadow-sm"
                    >
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
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
                    <div className="inline-block bg-white shadow-xl rounded-lg border border-gray-300 overflow-hidden min-w-full">
                        <table className="border-collapse table-fixed w-full">
                            <thead>
                                <tr>
                                    <th className="w-10 bg-gray-50 border border-gray-300 sticky top-0 left-0 z-20"></th>
                                    {columns.map((col, i) => (
                                        <th key={i} className="min-w-[120px] h-8 bg-gray-50 border border-gray-300 text-[10px] font-bold text-gray-500 sticky top-0 z-10">
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((row, rowIndex) => (
                                    <tr key={rowIndex}>
                                        <td className="bg-gray-50 border border-gray-300 text-[10px] font-bold text-center text-gray-500 sticky left-0 z-10">
                                            {rowIndex + 1}
                                        </td>
                                        {columns.map((_, colIndex) => (
                                            <td key={colIndex} className="p-0 border border-gray-200 focus-within:ring-2 focus-within:ring-[#1d6f42] focus-within:z-30 relative transition-all">
                                                <input 
                                                    className="w-full h-8 px-2 text-xs border-none outline-none focus:bg-white bg-transparent hover:bg-gray-50/50 transition-colors"
                                                    value={row[colIndex] || ''}
                                                    onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
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
