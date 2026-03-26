import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { HiChartBar, HiOutlineRefresh, HiDatabase, HiLink, HiShieldCheck, HiExclamation, HiChevronRight, HiClock, HiCollection } from 'react-icons/hi';

const StreamingAnalytics = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [countdown, setCountdown] = useState(0);

    const loadStats = useCallback(async () => {
        try {
            const res = await api.get("/streaming/stats");
            setStats(res);
            setCountdown(res.summary?.nextSyncSeconds || 0);
        } catch (e) {
            console.error("Analytics load failed:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadStats();
        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    loadStats();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [loadStats]);

    if (loading && !stats) return (
        <div className="p-8 flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
        </div>
    );

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="p-8 space-y-10 max-w-[1600px] mx-auto text-slate-200">
            {/* 🛸 ANALYTICS HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black bg-gradient-to-r from-white via-slate-400 to-slate-600 bg-clip-text text-transparent italic uppercase tracking-tighter">Streaming Intelligence Hub</h1>
                    <p className="text-slate-500 font-medium tracking-wide">Real-time Coverage Analytics & Provider Synchronization Status</p>
                </div>
                
                <div className="flex items-center gap-4 bg-slate-900/80 p-4 rounded-3xl border border-slate-800 backdrop-blur-xl shadow-2xl">
                    <div className="w-10 h-10 bg-brand-accent/20 rounded-xl flex items-center justify-center border border-brand-accent/30">
                        <HiClock className="text-brand-accent w-6 h-h-6 animate-pulse" />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Next Auto-Sync</p>
                        <p className="text-xl font-black font-mono text-brand-accent">{formatTime(countdown)}</p>
                    </div>
                    <button 
                        onClick={loadStats}
                        className="ml-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all border border-slate-700 active:scale-95"
                    >
                        <HiOutlineRefresh className={`w-5 h-5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* 📊 GLOBAL KPI GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title="Global Inventory" 
                    value={stats?.summary?.totalBetfair} 
                    subvalue="Betfair Anchor Matches" 
                    icon={<HiDatabase className="text-blue-500" />}
                    color="blue"
                    percent={100}
                />
                <StatCard 
                    title="Merged Coverage" 
                    value={`${stats?.summary?.overallPercent}%`} 
                    subvalue={`${stats?.summary?.totalMapped} Linked Events`} 
                    icon={<HiShieldCheck className="text-emerald-500" />}
                    color="emerald"
                    percent={stats?.summary?.overallPercent}
                />
                <StatCard 
                    title="Diamond Link-Rate" 
                    value={stats?.summary?.diamondMapped} 
                    subvalue="Diamond TV Matches Mapped" 
                    icon={<HiLink className="text-orange-500" />}
                    color="orange"
                    percent={(stats?.summary?.diamondMapped / stats?.summary?.totalBetfair * 100) || 0}
                />
            </div>

            {/* 🗺️ SPORT BREAKDOWN MATRIX */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {['Cricket', 'Soccer', 'Tennis'].map(sport => {
                    const data = stats?.breakdown?.[sport] || { betfair: 0, mapped: 0, diamond: 0, d247: 0, percent: 0 };
                    return (
                        <div key={sport} className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8 space-y-6 hover:shadow-[0_0_50px_rgba(0,0,0,0.3)] transition-all">
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">{sport}</h3>
                                <div className="px-4 py-1.5 bg-brand-accent/10 border border-brand-accent/20 rounded-full">
                                    <p className="text-[10px] font-black text-brand-accent uppercase">{data.percent}% Mapped</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <ProviderRow label="Betfair (Target)" count={data.betfair} color="bg-blue-500" />
                                <ProviderRow label="Diamond TV" count={data.diamond} color="bg-orange-500" />
                                <ProviderRow label="D247 Index" count={data.d247} color="bg-emerald-400" />
                            </div>

                            <div className="pt-6 border-t border-slate-800">
                                <div className="flex justify-between items-end mb-2">
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Efficiency Status</p>
                                    <p className="text-lg font-black text-white">{data.mapped} <span className="text-[10px] text-slate-500 font-normal ml-1">Merged</span></p>
                                </div>
                                <div className="h-3 bg-slate-800 rounded-full overflow-hidden p-0.5">
                                    <div className="h-full bg-gradient-to-r from-brand-accent to-emerald-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" style={{ width: `${data.percent}%` }}></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ⚠️ COVERAGE GAPS & ACTION */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 border border-brand-accent/20 rounded-[3rem] p-10 flex flex-col md:flex-row items-center gap-10">
                <div className="p-6 bg-brand-accent/10 rounded-full border border-brand-accent/20">
                    <HiCollection className="w-16 h-16 text-brand-accent" />
                </div>
                <div className="flex-1 space-y-2 text-center md:text-left">
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Pending Inventory Optimization</h2>
                    <p className="text-slate-400 font-medium max-w-2xl">There are currently <span className="text-white font-bold">{stats?.summary?.totalBetfair - stats?.summary?.totalMapped} unmapped Betfair events</span>. Use the Magic Merger tool to manually align these and achieve 100% coverage.</p>
                </div>
                <a 
                    href="/admin/streaming-merger" 
                    className="px-10 py-5 bg-brand-accent hover:bg-brand-blue/80 text-white font-black rounded-2xl transition-all shadow-2xl active:scale-95 flex items-center gap-3 uppercase italic tracking-tighter"
                >
                    Launch Magic Merger <HiChevronRight className="w-6 h-6" />
                </a>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, subvalue, icon, color, percent }) => (
    <div className={`bg-slate-900/50 border border-slate-800/50 p-8 rounded-[2.5rem] relative overflow-hidden group hover:border-${color}-500/30 transition-all`}>
        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-25 transition-opacity">
            {React.cloneElement(icon, { className: 'w-24 h-24' })}
        </div>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-3">{title}</p>
        <h2 className="text-5xl font-black text-white mb-2">{value}</h2>
        <p className="text-xs text-slate-500 font-medium">{subvalue}</p>
        <div className="mt-8 flex items-center gap-2">
            <div className={`flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden`}>
                <div className={`h-full bg-${color}-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]`} style={{ width: `${percent}%` }}></div>
            </div>
        </div>
    </div>
);

const ProviderRow = ({ label, count, color }) => (
    <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50 hover:border-slate-700 transition-all group">
        <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${color} group-hover:animate-pulse`}></div>
            <p className="text-sm font-bold text-slate-400">{label}</p>
        </div>
        <p className="text-lg font-black text-white">{count}</p>
    </div>
);

export default StreamingAnalytics;
