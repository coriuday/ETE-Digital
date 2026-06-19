/**
 * BulkJobPostPage — Drag-and-drop CSV upload for bulk job creation
 *
 * Features:
 *  - Drag-and-drop zone or click to upload CSV
 *  - Live preview table of parsed jobs before submission
 *  - Row-level validation errors shown inline
 *  - Download CSV template button
 *  - Progress indicator + result summary (X created, Y failed)
 */
import { useState, useRef, useCallback } from 'react';
import AppShell from '../../components/layout/AppShell';
import api from '../../api/client';
import {
    Upload, FileText, Download, CheckCircle2, AlertCircle,
    Loader2, X, Briefcase,
} from 'lucide-react';

interface ParsedRow {
    title: string;
    description: string;
    location: string;
    job_type: string;
    salary_min: string;
    salary_max: string;
    skills_required: string;
    experience_required: string;
    expires_days: string;
    remote_ok: string;
    company: string;
    [key: string]: string;
}

interface UploadError {
    row: number;
    reason: string;
}

interface UploadResult {
    created: number;
    failed: number;
    errors: UploadError[];
}

const PREVIEW_COLUMNS = ['title', 'location', 'job_type', 'salary_min', 'salary_max', 'expires_days'];

function parseCSVText(text: string): ParsedRow[] {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
    return lines.slice(1).map(line => {
        // Handle quoted fields
        const values: string[] = [];
        let current = '';
        let inQuotes = false;
        for (const char of line) {
            if (char === '"') { inQuotes = !inQuotes; }
            else if (char === ',' && !inQuotes) { values.push(current); current = ''; }
            else { current += char; }
        }
        values.push(current);
        const row: ParsedRow = {} as ParsedRow;
        headers.forEach((h, i) => { row[h] = values[i]?.trim() ?? ''; });
        return row;
    }).filter(r => r.title);
}

export default function BulkJobPostPage() {
    const [dragging, setDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<ParsedRow[]>([]);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<UploadResult | null>(null);
    const [error, setError] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback((f: File) => {
        if (!f.name.endsWith('.csv')) {
            setError('Please upload a .csv file.');
            return;
        }
        setFile(f);
        setResult(null);
        setError('');
        const reader = new FileReader();
        reader.onload = e => {
            const text = e.target?.result as string;
            setPreview(parseCSVText(text));
        };
        reader.readAsText(f);
    }, []);

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files[0];
        if (f) handleFile(f);
    };

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) handleFile(f);
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setError('');
        const form = new FormData();
        form.append('file', file);
        try {
            const res = await api.post('/jobs/bulk/', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setResult(res.data);
            if (res.data.created > 0) {
                setFile(null);
                setPreview([]);
            }
        } catch (e: any) {
            setError(e.response?.data?.detail ?? 'Upload failed. Check your CSV format.');
        } finally {
            setUploading(false);
        }
    };

    const handleDownloadTemplate = async () => {
        const res = await api.get('/jobs/bulk/template', { responseType: 'blob' });
        const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = 'jobsrow_bulk_template.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const resetForm = () => {
        setFile(null);
        setPreview([]);
        setResult(null);
        setError('');
    };

    return (
        <AppShell>
            <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <Upload size={20} className="text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-text-primary">Bulk Job Post</h1>
                            <p className="text-sm text-text-secondary">Upload a CSV to create up to 200 jobs at once</p>
                        </div>
                    </div>
                    <button onClick={handleDownloadTemplate}
                        className="flex items-center gap-2 px-4 py-2 border border-border text-text-primary rounded-xl text-sm font-medium hover:bg-background transition-colors">
                        <Download size={14} /> Download Template
                    </button>
                </div>

                {/* Success result */}
                {result && (
                    <div className={`rounded-2xl border p-6 ${result.created > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                        <div className="flex items-start gap-3">
                            <CheckCircle2 size={22} className={result.created > 0 ? 'text-emerald-600' : 'text-amber-500'} />
                            <div className="flex-1">
                                <h2 className="font-bold text-text-primary mb-1">Upload Complete</h2>
                                <div className="flex gap-6 text-sm">
                                    <span className="text-emerald-700 font-semibold">✓ {result.created} jobs created</span>
                                    {result.failed > 0 && <span className="text-red-600 font-semibold">✗ {result.failed} rows failed</span>}
                                </div>
                                {result.errors.length > 0 && (
                                    <div className="mt-3 space-y-1">
                                        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Row Errors:</p>
                                        {result.errors.map(e => (
                                            <div key={e.row} className="flex items-center gap-2 text-xs bg-surface rounded-lg px-3 py-1.5 border border-red-100">
                                                <AlertCircle size={12} className="text-red-500 flex-shrink-0" />
                                                <span className="text-text-secondary">Row {e.row}:</span>
                                                <span className="text-red-600">{e.reason}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button onClick={resetForm} className="text-text-tertiary hover:text-text-secondary p-1">
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                        <AlertCircle size={18} /> {error}
                    </div>
                )}

                {/* Drop zone */}
                {!file ? (
                    <div
                        onDragOver={e => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={onDrop}
                        onClick={() => inputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all ${dragging ? 'border-indigo-400 bg-indigo-50 scale-[1.01]' : 'border-border bg-background hover:border-indigo-300 hover:bg-indigo-50/50'}`}
                    >
                        <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={onInputChange} />
                        <div className="w-16 h-16 bg-surface border-2 border-dashed border-border rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <FileText size={28} className="text-text-tertiary" />
                        </div>
                        <p className="font-semibold text-text-primary text-lg">Drop your CSV here</p>
                        <p className="text-text-tertiary text-sm mt-1">or click to browse — max 200 rows</p>
                        <p className="text-xs text-text-tertiary mt-3">
                            Required columns: <code className="bg-gray-100 px-1 rounded">title</code>, <code className="bg-gray-100 px-1 rounded">description</code>, <code className="bg-gray-100 px-1 rounded">job_type</code>
                        </p>
                    </div>
                ) : (
                    <div className="bg-surface rounded-2xl border border-border shadow-sm p-5 space-y-4">
                        {/* File info */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                                    <FileText size={18} className="text-indigo-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-text-primary text-sm">{file.name}</p>
                                    <p className="text-xs text-text-tertiary">{preview.length} rows parsed</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={resetForm} className="text-text-tertiary hover:text-text-secondary p-2 rounded-lg hover:bg-background transition-colors">
                                    <X size={16} />
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={uploading || preview.length === 0}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-lg shadow-indigo-200"
                                >
                                    {uploading ? (
                                        <><Loader2 size={14} className="animate-spin" /> Uploading...</>
                                    ) : (
                                        <><Briefcase size={14} /> Post {preview.length} Job{preview.length !== 1 ? 's' : ''}</>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Preview table */}
                        {preview.length > 0 && (
                            <div className="overflow-x-auto rounded-xl border border-border">
                                <table className="w-full text-xs">
                                    <thead className="bg-background">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-text-tertiary font-semibold uppercase tracking-wider">#</th>
                                            {PREVIEW_COLUMNS.map(col => (
                                                <th key={col} className="px-3 py-2 text-left text-text-tertiary font-semibold uppercase tracking-wider">
                                                    {col.replace('_', ' ')}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {preview.slice(0, 15).map((row, i) => (
                                            <tr key={i} className="hover:bg-background/50 transition-colors">
                                                <td className="px-3 py-2 text-text-tertiary">{i + 2}</td>
                                                {PREVIEW_COLUMNS.map(col => (
                                                    <td key={col} className="px-3 py-2 text-text-primary max-w-[180px] truncate">
                                                        {row[col] || <span className="text-gray-300 italic">—</span>}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {preview.length > 15 && (
                                    <div className="px-4 py-2 text-center text-xs text-text-tertiary bg-background border-t border-border">
                                        + {preview.length - 15} more rows
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
                    <p className="font-semibold mb-2">CSV Format Guide</p>
                    <ul className="space-y-1 text-xs text-blue-600 list-disc list-inside">
                        <li><code>job_type</code> must be one of: <code>full_time</code>, <code>part_time</code>, <code>contract</code>, <code>internship</code></li>
                        <li><code>skills_required</code> — comma-separated e.g. <code>Python,React,SQL</code></li>
                        <li><code>expires_days</code> — number of days until job expires (default: 30)</li>
                        <li><code>remote_ok</code> — <code>true</code> or <code>false</code></li>
                        <li>Use double-quotes for fields containing commas</li>
                    </ul>
                </div>
            </div>
        </AppShell>
    );
}
