import { useState, useEffect } from 'react';
import api from '../services/api';
import { HiLockClosed, HiCheckCircle, HiExclamationCircle, HiShieldCheck, HiRefresh, HiDatabase, HiLightningBolt } from 'react-icons/hi';

export default function Settings() {
    // Password States
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [pwLoading, setPwLoading] = useState(false);
    const [pwMessage, setPwMessage] = useState({ type: '', text: '' });

    // SportRadar States
    const [srData, setSrData] = useState(null);
    const [manualToken, setManualToken] = useState('');
    const [srLoading, setSrLoading] = useState(false);
    const [srActionLoading, setSrActionLoading] = useState(null); // 'update' or 'refresh'
    const [srMessage, setSrMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchSrToken();
    }, []);

    const fetchSrToken = async () => {
        setSrLoading(true);
        try {
            const res = await api.get('/sportradar/token');
            if (res.success) {
                setSrData(res);
            }
        } catch (err) {
            console.error("Failed to fetch SR token:", err);
        } finally {
            setSrLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setPwMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }
        if (newPassword.length < 6) {
            setPwMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        setPwLoading(true);
        setPwMessage({ type: '', text: '' });

        try {
            const response = await api.post('/change-password', { oldPassword, newPassword });
            if (response.success) {
                setPwMessage({ type: 'success', text: response.message });
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
            }
        } catch (err) {
            setPwMessage({ type: 'error', text: err.message || "Failed to change password" });
        } finally {
            setPwLoading(false);
        }
    };

    const handleManualTokenUpdate = async (e) => {
        e.preventDefault();
        if (!manualToken) return;

        setSrActionLoading('update');
        setSrMessage({ type: '', text: '' });

        try {
            const res = await api.post('/sportradar/update', { token: manualToken });
            if (res.success) {
                setSrMessage({ type: 'success', text: 'Token updated successfully!' });
                setManualToken('');
                fetchSrToken();
            }
        } catch (err) {
            setSrMessage({ type: 'error', text: err.message || 'Failed to update token' });
        } finally {
            setSrActionLoading(null);
        }
    };

    const handleForceRefresh = async () => {
        setSrActionLoading('refresh');
        setSrMessage({ type: '', text: '' });

        try {
            const res = await api.post('/sportradar/refresh');
            if (res.success) {
                setSrMessage({ type: 'success', text: 'Auto-refresh successful!' });
                fetchSrToken();
            }
        } catch (err) {
            setSrMessage({ type: 'error', text: err.message || 'Auto-refresh failed. Check logs/proxy.' });
        } finally {
            setSrActionLoading(null);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-12">
            {/* Page Header */}
            <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 bg-brand-accent/20 rounded-xl flex items-center justify-center ring-1 ring-brand-accent/30 shadow-lg shadow-brand-accent/10">
                    <HiShieldCheck className="w-6 h-6 text-brand-accent" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">System Settings</h1>
                    <p className="text-slate-400 text-sm">Manage global configurations and security credentials.</p>
                </div>
            </div>

            {/* SPORTRADAR CONFIGURATION SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                            <HiDatabase className="text-brand-accent" />
                            Provider Status
                        </h3>
                        {srLoading ? (
                            <div className="animate-pulse space-y-3">
                                <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                                <div className="h-4 bg-slate-800 rounded w-1/2"></div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Current Source</p>
                                    <div className="flex items-center justify-between">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tight ${srData?.source === 'Manual (Admin Panel)' ? 'bg-orange-500/20 text-orange-400' : 'bg-brand-accent/20 text-brand-accent'
                                            }`}>
                                            {srData?.source || 'Not Set'}
                                        </span>
                                        <span className="text-[10px] text-slate-400">{new Date(srData?.updatedAt).toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Active Token</p>
                                    <p className="text-xs font-mono text-emerald-400 break-all bg-emerald-500/5 p-2 rounded border border-emerald-500/10">
                                        {srData?.token || 'None'}
                                    </p>
                                </div>

                                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Last Sync Status</p>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${srData?.lastAttemptStatus === 'Success' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}></div>
                                        <span className="text-xs text-white font-medium">{srData?.lastAttemptStatus || 'Unknown'}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl shadow-black/20 h-full">
                        <div className="bg-slate-800/30 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                            <h2 className="text-white font-bold flex items-center gap-2">
                                <HiLightningBolt className="text-brand-accent" />
                                SportRadar Token Management
                            </h2>
                            <button
                                onClick={handleForceRefresh}
                                disabled={srActionLoading === 'refresh'}
                                className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-1.5 rounded-lg border border-slate-700 transition-all flex items-center gap-1.5 disabled:opacity-50"
                            >
                                <HiRefresh className={`w-3.5 h-3.5 ${srActionLoading === 'refresh' ? 'animate-spin' : ''}`} />
                                FORCE AUTO-REFRESH
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {srMessage.text && (
                                <div className={`px-4 py-3 rounded-xl text-sm flex items-center gap-3 ${srMessage.type === 'success'
                                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'
                                    : 'bg-red-500/10 border border-red-500/20 text-red-500'
                                    }`}>
                                    {srMessage.type === 'success' ? <HiCheckCircle className="shrink-0 w-5 h-5" /> : <HiExclamationCircle className="shrink-0 w-5 h-5" />}
                                    {srMessage.text}
                                </div>
                            )}

                            <form onSubmit={handleManualTokenUpdate} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">Update Token Manually</label>
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            required
                                            value={manualToken}
                                            onChange={(e) => setManualToken(e.target.value)}
                                            className="flex-1 bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/50 outline-none transition-all placeholder:text-slate-700 font-mono text-sm"
                                            placeholder="Paste SportRadar token here..."
                                        />
                                        <button
                                            type="submit"
                                            disabled={srActionLoading === 'update' || !manualToken}
                                            className="bg-brand-accent hover:bg-brand-accent-hover disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-brand-accent/20 flex items-center justify-center gap-2"
                                        >
                                            {srActionLoading === 'update' ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <>SAVE TOKEN</>
                                            )}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-2 px-1 italic">
                                        Note: Manually saving a token will temporarily bypass the auto-refresh cycle until the next scheduled sync.
                                    </p>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECURITY SETTINGS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Security Policy</h3>
                        <ul className="space-y-4 text-xs text-slate-400 leading-relaxed">
                            <li className="flex gap-3">
                                <span className="w-1.5 h-1.5 bg-brand-accent rounded-full mt-1 shrink-0"></span>
                                Changing your password will automatically terminate all active sessions.
                            </li>
                            <li className="flex gap-3">
                                <span className="w-1.5 h-1.5 bg-brand-accent rounded-full mt-1 shrink-0"></span>
                                Ensure your new password is at least 6 characters long and includes numbers.
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl shadow-black/20">
                        <div className="bg-slate-800/30 px-6 py-4 border-b border-slate-800">
                            <h2 className="text-white font-bold flex items-center gap-2">
                                <HiLockClosed className="text-brand-accent" />
                                Change Access Password
                            </h2>
                        </div>

                        <form onSubmit={handlePasswordChange} className="p-6 space-y-6">
                            {pwMessage.text && (
                                <div className={`px-4 py-3 rounded-xl text-sm flex items-center gap-3 ${pwMessage.type === 'success'
                                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'
                                    : 'bg-red-500/10 border border-red-500/20 text-red-500'
                                    }`}>
                                    {pwMessage.type === 'success' ? <HiCheckCircle className="shrink-0 w-5 h-5" /> : <HiExclamationCircle className="shrink-0 w-5 h-5" />}
                                    {pwMessage.text}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">Current Password</label>
                                <input
                                    type="password"
                                    required
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/50 outline-none transition-all placeholder:text-slate-700"
                                    placeholder="Enter current password"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">New Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/50 outline-none transition-all placeholder:text-slate-700"
                                        placeholder="Min 6 characters"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">Confirm Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/50 outline-none transition-all placeholder:text-slate-700"
                                        placeholder="Repeat new password"
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={pwLoading}
                                    className="bg-brand-accent hover:bg-brand-accent-hover disabled:opacity-50 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg shadow-brand-accent/20 flex items-center justify-center gap-2 group"
                                >
                                    {pwLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            UPDATE PASSWORD
                                            <HiLockClosed className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

