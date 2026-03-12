import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { HiLockClosed, HiUser, HiOutlineLightningBolt, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.post('/login', { username, password });
            if (response.success) {
                localStorage.setItem('adminToken', response.token);
                localStorage.setItem('adminUser', response.username);
                navigate('/');
            }
        } catch (err) {
            setError(err.message || "Invalid credentials");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            {/* Background Glow */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-accent/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-md relative z-10">
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 bg-brand-accent/20 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-brand-accent/30 shadow-[0_0_20px_rgba(0,123,255,0.2)]">
                            <HiOutlineLightningBolt className="w-8 h-8 text-brand-accent" />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">9W GATEKEEPER</h1>
                        <p className="text-slate-400 text-sm mt-1">Admin API Gate Control Panel</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-3">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shrink-0"></div>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">Username</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-accent transition-colors">
                                    <HiUser className="w-5 h-5" />
                                </span>
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-slate-700 text-white pl-12 pr-4 py-3 rounded-xl focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/50 outline-none transition-all placeholder:text-slate-600"
                                    placeholder="Enter username"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">Password</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-accent transition-colors">
                                    <HiLockClosed className="w-5 h-5" />
                                </span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-slate-700 text-white pl-12 pr-12 py-3 rounded-xl focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/50 outline-none transition-all placeholder:text-slate-600"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-brand-accent transition-colors p-1"
                                >
                                    {showPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-brand-accent hover:bg-brand-accent-hover disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-brand-accent/20 flex items-center justify-center gap-2 group mt-8"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    LOGIN ACCESS
                                    <HiOutlineLightningBolt className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-slate-800 text-center">
                        <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-medium leading-relaxed">
                            Secured & Protected By<br />
                            <span className="text-brand-accent">9W CLOUD STACK v4.0.0</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
