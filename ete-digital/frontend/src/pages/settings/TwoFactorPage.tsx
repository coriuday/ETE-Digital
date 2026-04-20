/**
 * Two-Factor Authentication Settings Page
 * /settings/2fa
 *
 * Allows users to:
 *  - See their current 2FA status
 *  - Enable 2FA (scan QR → verify code → get backup codes)
 *  - Disable 2FA (confirm with current TOTP code)
 *  - View backup codes count
 */
import { useState, useEffect } from 'react';
import { QrCode, Shield, ShieldCheck, ShieldOff, Copy, Download, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import apiClient from '../../api/client';

type Step = 'status' | 'setup' | 'enable' | 'backup_codes' | 'disable';

interface TwoFAStatus {
    enabled: boolean;
    backup_codes_remaining: number;
}

interface SetupData {
    qr_uri: string;
    secret: string;
}

export default function TwoFactorPage() {
    const [step, setStep] = useState<Step>('status');
    const [status, setStatus] = useState<TwoFAStatus | null>(null);
    const [setupData, setSetupData] = useState<SetupData | null>(null);
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [verifyCode, setVerifyCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        loadStatus();
    }, []);

    const loadStatus = async () => {
        try {
            const res = await apiClient.get('/api/auth/2fa/status');
            setStatus(res.data);
        } catch {
            setError('Failed to load 2FA status.');
        }
    };

    const handleSetup = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await apiClient.post('/api/auth/2fa/setup');
            setSetupData(res.data);
            setStep('setup');
        } catch (e: any) {
            setError(e.response?.data?.detail || 'Failed to start 2FA setup.');
        } finally {
            setLoading(false);
        }
    };

    const handleEnable = async () => {
        if (verifyCode.length !== 6) {
            setError('Enter the 6-digit code from your authenticator app.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await apiClient.post('/api/auth/2fa/enable', { code: verifyCode });
            setBackupCodes(res.data.backup_codes);
            setStatus({ enabled: true, backup_codes_remaining: res.data.backup_codes.length });
            setStep('backup_codes');
        } catch (e: any) {
            setError(e.response?.data?.detail || 'Invalid code. Try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDisable = async () => {
        if (verifyCode.length !== 6) {
            setError('Enter your current 6-digit TOTP code to confirm.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await apiClient.post('/api/auth/2fa/disable', { code: verifyCode });
            setStatus({ enabled: false, backup_codes_remaining: 0 });
            setStep('status');
            setVerifyCode('');
        } catch (e: any) {
            setError(e.response?.data?.detail || 'Invalid code. Could not disable 2FA.');
        } finally {
            setLoading(false);
        }
    };

    const copyBackupCodes = () => {
        navigator.clipboard.writeText(backupCodes.join('\n'));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadBackupCodes = () => {
        const content = `Jobrows 2FA Backup Codes\nGenerated: ${new Date().toLocaleString()}\n\n${backupCodes.join('\n')}\n\nKeep these codes safe. Each code can only be used once.`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'jobrows-backup-codes.txt';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <AppShell>
            <div className="min-h-full bg-gray-50">
                {/* Header */}
                <div className="border-b border-gray-200 px-6 py-5 bg-white">
                    <div className="max-w-2xl mx-auto flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                            <Shield size={18} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Two-Factor Authentication</h1>
                            <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                        </div>
                    </div>
                </div>

                <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                            <AlertTriangle size={16} className="flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    {/* STATUS VIEW */}
                    {step === 'status' && status && (
                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${status.enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                                    {status.enabled
                                        ? <ShieldCheck size={24} className="text-green-600" />
                                        : <ShieldOff size={24} className="text-gray-400" />
                                    }
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">
                                        2FA is {status.enabled ? 'Enabled' : 'Disabled'}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {status.enabled
                                            ? `${status.backup_codes_remaining} backup codes remaining`
                                            : 'Your account is not protected with 2FA yet'}
                                    </p>
                                </div>
                            </div>

                            {!status.enabled ? (
                                <div>
                                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                                        Two-factor authentication adds an extra step when you log in. After entering your password, you'll also need a 6-digit code from your authenticator app (Google Authenticator, Authy, 1Password, etc.).
                                    </p>
                                    <button
                                        onClick={handleSetup}
                                        disabled={loading}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 size={16} className="animate-spin" /> : <QrCode size={16} />}
                                        Set Up 2FA
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => { setStep('disable'); setError(''); setVerifyCode(''); }}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors"
                                >
                                    <ShieldOff size={16} /> Disable 2FA
                                </button>
                            )}
                        </div>
                    )}

                    {/* SETUP VIEW — Show QR code */}
                    {step === 'setup' && setupData && (
                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
                            <h2 className="font-bold text-gray-900 text-lg mb-2">Scan QR Code</h2>
                            <p className="text-sm text-gray-500 mb-6">
                                Open your authenticator app and scan the QR code below. If you can't scan it, enter the secret manually.
                            </p>

                            {/* QR Code — rendered via qrcode.react or an online generator */}
                            <div className="flex justify-center mb-6">
                                <div className="p-4 bg-white border-2 border-gray-200 rounded-2xl">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupData.qr_uri)}`}
                                        alt="2FA QR Code"
                                        width={200}
                                        height={200}
                                        className="rounded-lg"
                                    />
                                </div>
                            </div>

                            <div className="mb-6 p-3 bg-gray-50 rounded-xl">
                                <p className="text-xs text-gray-500 mb-1 font-medium">Manual entry key:</p>
                                <p className="font-mono text-sm text-gray-800 tracking-wider break-all">{setupData.secret}</p>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700">
                                    Enter the 6-digit code from your app
                                </label>
                                <input
                                    type="text"
                                    maxLength={6}
                                    placeholder="000000"
                                    value={verifyCode}
                                    onChange={e => { setVerifyCode(e.target.value.replace(/\D/g, '')); setError(''); }}
                                    className="w-full px-4 py-3 text-center text-2xl tracking-widest font-mono border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500"
                                />
                                <button
                                    onClick={handleEnable}
                                    disabled={loading || verifyCode.length !== 6}
                                    className="w-full py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                    Activate 2FA
                                </button>
                            </div>
                        </div>
                    )}

                    {/* BACKUP CODES VIEW */}
                    {step === 'backup_codes' && (
                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <CheckCircle2 size={24} className="text-green-500" />
                                <h2 className="font-bold text-gray-900 text-lg">2FA Activated!</h2>
                            </div>
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-6">
                                <p className="text-sm text-amber-800 font-medium">⚠️ Save these backup codes now!</p>
                                <p className="text-xs text-amber-700 mt-1">If you lose access to your authenticator app, you can use these one-time codes to log in. They will NOT be shown again.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-6 p-4 bg-gray-50 rounded-xl font-mono text-sm">
                                {backupCodes.map((code, i) => (
                                    <div key={i} className="text-gray-700 py-1">{code}</div>
                                ))}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={copyBackupCodes}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                                >
                                    <Copy size={15} /> {copied ? 'Copied!' : 'Copy All'}
                                </button>
                                <button
                                    onClick={downloadBackupCodes}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors"
                                >
                                    <Download size={15} /> Download
                                </button>
                            </div>
                            <button
                                onClick={() => setStep('status')}
                                className="w-full mt-3 py-2.5 text-sm text-gray-500 hover:text-gray-700"
                            >
                                I've saved my codes — Done
                            </button>
                        </div>
                    )}

                    {/* DISABLE VIEW */}
                    {step === 'disable' && (
                        <div className="bg-white rounded-2xl border border-red-200 p-6">
                            <h2 className="font-bold text-gray-900 text-lg mb-2">Disable 2FA</h2>
                            <p className="text-sm text-gray-500 mb-6">
                                Enter your current 6-digit TOTP code to confirm. This will remove 2FA protection from your account.
                            </p>
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    maxLength={6}
                                    placeholder="000000"
                                    value={verifyCode}
                                    onChange={e => { setVerifyCode(e.target.value.replace(/\D/g, '')); setError(''); }}
                                    className="w-full px-4 py-3 text-center text-2xl tracking-widest font-mono border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-400"
                                />
                                <button
                                    onClick={handleDisable}
                                    disabled={loading || verifyCode.length !== 6}
                                    className="w-full py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldOff size={16} />}
                                    Confirm Disable
                                </button>
                                <button
                                    onClick={() => { setStep('status'); setError(''); }}
                                    className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppShell>
    );
}
