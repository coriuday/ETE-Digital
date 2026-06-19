/**
 * PrivacyPage — GDPR Data Export and Account Deletion
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import api from '../../api/client';
import { useAuthStore } from '../../stores/authStore';
import { Download, Trash2, Shield, AlertTriangle, Loader2 } from 'lucide-react';

export default function PrivacyPage() {
    const { logout } = useAuthStore();
    const navigate = useNavigate();
    
    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState('');
    
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleteError, setDeleteError] = useState('');

    const handleExport = async () => {
        setExporting(true);
        setExportError('');
        try {
            const res = await api.get('/users/gdpr/export', { responseType: 'blob' });
            
            // Create a blob link to download
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            
            // Generate filename based on Content-Disposition header if available, otherwise fallback
            const contentDisposition = res.headers['content-disposition'];
            let filename = 'jobsrow_data_export.json';
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?([^"]+)"?/);
                if (match && match[1]) filename = match[1];
            }
            
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
        } catch (err: any) {
            setExportError('Failed to export data. Please try again later.');
        } finally {
            setExporting(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'DELETE') return;
        
        setDeleting(true);
        setDeleteError('');
        try {
            await api.delete('/users/gdpr/account');
            logout();
            navigate('/login');
        } catch (err: any) {
            setDeleteError(err.response?.data?.detail || 'Failed to delete account. Please try again or contact support.');
            setDeleting(false);
        }
    };

    return (
        <AppShell>
            <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
                
                {/* Header */}
                <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                        <Shield className="text-indigo-600" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Privacy & Data (GDPR)</h1>
                        <p className="text-gray-500 mt-1">Manage your personal data, export a copy, or delete your account permanently.</p>
                    </div>
                </div>

                {/* Export Section */}
                <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-50 rounded-xl">
                            <Download className="text-blue-600" size={24} />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-lg font-semibold text-gray-900">Export Your Data</h2>
                            <p className="text-gray-500 text-sm mt-1 mb-4 max-w-2xl">
                                Request a machine-readable copy of your personal data. This includes your profile information, settings, and job applications. The file will be provided in JSON format.
                            </p>
                            
                            {exportError && (
                                <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                                    {exportError}
                                </div>
                            )}

                            <button
                                onClick={handleExport}
                                disabled={exporting}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                {exporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                                {exporting ? 'Preparing Download...' : 'Download Data Archive'}
                            </button>
                        </div>
                    </div>
                </section>

                {/* Delete Section */}
                <section className="bg-white rounded-2xl border border-red-200 p-6 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-red-50 rounded-xl">
                            <Trash2 className="text-red-600" size={24} />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-lg font-semibold text-gray-900">Delete Account</h2>
                            <p className="text-gray-500 text-sm mt-1 mb-4 max-w-2xl">
                                Permanently delete your Jobsrow account and all of your content. 
                                <strong className="text-gray-700"> This action is not reversible.</strong>
                            </p>

                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="px-5 py-2.5 bg-red-50 text-red-700 border border-red-200 font-medium rounded-xl hover:bg-red-100 transition-colors"
                            >
                                Delete My Account
                            </button>
                        </div>
                    </div>
                </section>

                {/* Delete Confirmation Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                        <div className="bg-white rounded-3xl p-6 lg:p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                            
                            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="text-red-600" size={28} />
                            </div>
                            
                            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Are you absolutely sure?</h3>
                            <p className="text-center text-gray-500 text-sm mb-6">
                                This action cannot be undone. This will permanently delete your account, your profile data, and remove your data from our servers.
                            </p>

                            {deleteError && (
                                <div className="mb-4 text-sm text-center text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                                    {deleteError}
                                </div>
                            )}

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Please type <strong>DELETE</strong> to confirm.
                                </label>
                                <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    placeholder="DELETE"
                                />
                            </div>

                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setDeleteConfirmText('');
                                        setDeleteError('');
                                    }}
                                    disabled={deleting}
                                    className="flex-1 py-2.5 px-4 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={deleteConfirmText !== 'DELETE' || deleting}
                                    className="flex-1 py-2.5 px-4 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                                >
                                    {deleting ? <Loader2 className="animate-spin" size={20} /> : 'Delete Account'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </AppShell>
    );
}
