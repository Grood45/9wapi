import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { HiOutlineHome, HiOutlineUsers, HiOutlineKey, HiOutlineCurrencyDollar, HiOutlineDocumentText, HiOutlineCog, HiOutlineLogout, HiOutlineLink, HiOutlineChartBar } from 'react-icons/hi';

export default function Sidebar() {
    const navigate = useNavigate();
    const [username, setUsername] = useState(localStorage.getItem('adminUser') || 'Admin');

    useEffect(() => {
        // Verify session status on mount
        const verify = async () => {
            try {
                await api.get('/verify-session');
            } catch (err) {
                // Interceptor will handle redirect if 401
            }
        };
        verify();
    }, []);

    const handleLogout = async () => {
        try {
            await api.post('/logout');
        } catch (err) {
            console.error("Logout failed:", err);
        } finally {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            navigate('/login');
        }
    };

    const navItems = [
        { path: '/', label: 'Dashboard', icon: HiOutlineHome },
        { path: '/clients', label: 'Clients', icon: HiOutlineUsers },
        { path: '/access', label: 'Access Control', icon: HiOutlineKey },
        { path: '/ledger', label: 'Ledger', icon: HiOutlineCurrencyDollar },
        { path: '/docs', label: 'API Documentation', icon: HiOutlineDocumentText },
        { path: '/merger', label: 'Streaming Merger', icon: HiOutlineLink },
        { path: '/analytics', label: 'Analytics Hub', icon: HiOutlineChartBar },
        { path: '/settings', label: 'Settings', icon: HiOutlineCog },
    ];

    return (
        <aside className="w-64 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col">
            <div className="h-16 flex items-center px-6 border-b border-slate-800">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-brand-accent/20">
                        9W
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">GateKeeper</span>
                </div>
            </div>
            <nav className="flex-1 p-4 space-y-1">
                {navItems.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                ? 'bg-brand-accent/10 text-brand-accent border border-brand-accent/20'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {item.label}
                    </NavLink>
                ))}
            </nav>
            <div className="p-4 border-t border-slate-800 space-y-2">
                <div className="flex items-center gap-3 px-3 py-2 bg-slate-800/50 rounded-lg">
                    <div className="w-8 h-8 bg-brand-accent/10 text-brand-accent border border-brand-accent/20 rounded-full flex justify-center items-center text-xs font-bold">
                        {username.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="text-sm overflow-hidden">
                        <p className="text-white font-medium truncate">{username}</p>
                        <p className="text-xs text-slate-400">System Root</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-red-400/10 rounded-lg text-sm font-medium transition-colors"
                >
                    <HiOutlineLogout className="w-5 h-5" />
                    Logout Access
                </button>
            </div>
        </aside>
    );
}
