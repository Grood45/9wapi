import { useState, useEffect } from 'react';
import api from '../services/api';
import { HiOutlineUsers, HiOutlineCurrencyDollar } from 'react-icons/hi';

export default function Dashboard() {
    const [stats, setStats] = useState({ activeClients: 0, totalExpected: 0, totalCollected: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const [cRes, lRes] = await Promise.all([
                    api.get('/clients'),
                    api.get('/ledgers/stats')
                ]);

                const active = cRes.data?.filter(c => c.status === 'active').length || 0;
                setStats({
                    activeClients: active,
                    totalExpected: lRes.data?.expectedIncome || 0,
                    totalCollected: lRes.data?.collectedIncome || 0
                });
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        fetchDashboard();
    }, []);

    if (loading) return <div className="text-slate-400 p-8">Loading Statistics...</div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold">System Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card-panel p-6 flex items-center gap-4 border-l-4 border-l-brand-accent">
                    <div className="bg-brand-accent/20 p-4 rounded-xl text-brand-accent">
                        <HiOutlineUsers className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-400 uppercase">Active Clients</p>
                        <p className="text-3xl font-bold">{stats.activeClients}</p>
                    </div>
                </div>

                <div className="card-panel p-6 flex flex-col justify-center border-l-4 border-l-emerald-500">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-semibold text-slate-400 uppercase">Monthly Income</p>
                        <HiOutlineCurrencyDollar className="text-emerald-500 w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-emerald-400">₹{stats.totalCollected.toLocaleString()}</p>
                        <p className="text-xs text-slate-500 mt-1">Expected: ₹{stats.totalExpected.toLocaleString()}</p>
                    </div>
                </div>

                <div className="card-panel p-6 flex justify-center flex-col border-l-4 border-l-amber-500">
                    <p className="text-sm font-semibold text-slate-400 uppercase mb-2">Pending Dues</p>
                    <p className="text-3xl font-bold text-amber-400">₹{Math.max(0, stats.totalExpected - stats.totalCollected).toLocaleString()}</p>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3">
                        <div
                            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-1000"
                            style={{ width: `${stats.totalExpected > 0 ? (stats.totalCollected / stats.totalExpected) * 100 : 0}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
