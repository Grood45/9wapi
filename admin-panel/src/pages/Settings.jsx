import { useState } from 'react';
import api from '../services/api';
import { HiLockClosed, HiCheckCircle, HiExclamationCircle, HiShieldCheck } from 'react-icons/hi';

export default function Settings() {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await api.post('/change-password', { oldPassword, newPassword });
            if (response.success) {
                setMessage({ type: 'success', text: response.message });
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
                // Note: user will be auto-logged out by the interceptor if required by backend
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.message || "Failed to change password" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-brand-accent/20 rounded-xl flex items-center justify-center ring-1 ring-brand-accent/30 shadow-lg shadow-brand-accent/10">
                    <HiShieldCheck className="w-6 h-6 text-brand-accent" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Security Settings</h1>
                    <p className="text-slate-400 text-sm">Manage your admin credentials and session security.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Information Card */}
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
                            <li className="flex gap-3">
                                <span className="w-1.5 h-1.5 bg-brand-accent rounded-full mt-1 shrink-0"></span>
                                Authenticated sessions are valid for 24 hours only.
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Form Card */}
                <div className="lg:col-span-2">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl shadow-black/20">
                        <div className="bg-slate-800/30 px-6 py-4 border-b border-slate-800">
                            <h2 className="text-white font-bold flex items-center gap-2">
                                <HiLockClosed className="text-brand-accent" />
                                Change Access Password
                            </h2>
                        </div>

                        <form onSubmit={handlePasswordChange} className="p-6 space-y-6">
                            {message.text && (
                                <div className={`px-4 py-3 rounded-xl text-sm flex items-center gap-3 ${message.type === 'success'
                                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'
                                        : 'bg-red-500/10 border border-red-500/20 text-red-500'
                                    }`}>
                                    {message.type === 'success' ? <HiCheckCircle className="shrink-0 w-5 h-5" /> : <HiExclamationCircle className="shrink-0 w-5 h-5" />}
                                    {message.text}
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
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">Confirm New Password</label>
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
                                    disabled={loading}
                                    className="bg-brand-accent hover:bg-brand-accent-hover disabled:opacity-50 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg shadow-brand-accent/20 flex items-center justify-center gap-2 group"
                                >
                                    {loading ? (
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
