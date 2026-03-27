import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { HiFire, HiCalendar, HiLink, HiTrash, HiSearch, HiIdentification, HiInformationCircle, HiX, HiChevronLeft, HiChevronRight, HiFilter, HiClipboard, HiCheck, HiTrendingUp, HiChartBar, HiCube, HiClock } from "react-icons/hi";

/**
 * ⚡ 20-Year Exp Performance Strategy:
 * 1. Synchronous Merging: Side-by-side cards for intuitive ID linking.
 * 2. Real-time Filters: Sport & In-Play toggles for rapid discovery.
 * 3. Detailed Inspection: Side-by-side comparison of raw provider data.
 * 4. Paged Management: High-performance table with custom pagination.
 */

export default function StreamingMerger() {
    const [sportId, setSportId] = useState(4); // Default Cricket
    const [inplay, setInplay] = useState(1); // Default Live
    const [search, setSearch] = useState("");
    
    const [betfairPool, setBetfairPool] = useState([]);
    const [diamondPool, setDiamondPool] = useState([]);
    const [d247Pool, setD247Pool] = useState([]);
    const [mappings, setMappings] = useState([]);
    const [stats, setStats] = useState(null);
    
    const [selectedBf, setSelectedBf] = useState(null);
    const [selectedD, setSelectedD] = useState(null);
    const [selectedD247, setSelectedD247] = useState(null);
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const [mappedSearch, setMappedSearch] = useState("");
    const [mappedSportFilter, setMappedSportFilter] = useState("all");
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [copiedId, setCopiedId] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalData, setModalData] = useState(null);

    const loadUnmapped = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/streaming/unmapped?sportId=${sportId}&inplay=${inplay}`);
            setBetfairPool(res.betfair || []);
            setDiamondPool(res.diamond || []);
            setD247Pool(res.d247 || []);
        } catch (e) {
            console.error("Failed to load unmapped events:", e);
        } finally {
            setLoading(false);
        }
    }, [sportId, inplay]);

    const loadMappings = useCallback(async () => {
        const data = await api.get("/streaming/mappings");
        setMappings(data.mappings || []);
    }, []);

    const loadStats = useCallback(async () => {
        try {
            const res = await api.get("/streaming/stats");
            setStats(res);
            if (res.summary?.nextSyncSeconds) {
                setCountdown(res.summary.nextSyncSeconds);
            }
        } catch (e) {
            console.error("Failed to load stats:", e);
        }
    }, []);

    useEffect(() => {
        loadUnmapped();
        loadMappings();
        loadStats();
    }, [loadUnmapped, loadMappings, loadStats]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const filteredBetfair = betfairPool.filter(e => 
        (e.name || "").toLowerCase().includes(search.toLowerCase()) || 
        (e.id || "").toString().includes(search)
    );

    const filteredDiamond = diamondPool.filter(e => 
        (e.name || "").toLowerCase().includes(search.toLowerCase()) || 
        (e.id || "").toString().includes(search)
    );

    const filteredD247 = d247Pool.filter(e => 
        (e.name || "").toLowerCase().includes(search.toLowerCase()) || 
        (e.id || "").toString().includes(search)
    );

    const handleMerge = async () => {
        if (!selectedBf || (!selectedD && !selectedD247)) return;
        try {
            await api.post("/streaming/merge", {
                betfairId: selectedBf.id,
                diamondId: selectedD?.id,
                d247Id: selectedD247?.id || selectedD247,
                eventName: selectedBf.name,
                sportId: sportId
            });
            setSelectedBf(null);
            setSelectedD(null);
            setSelectedD247(null);
            loadUnmapped();
            loadMappings();
            loadStats();
        } catch (e) {
            alert(e.message);
        }
    };

    const handleUnlink = async (id) => {
        if (!window.confirm("Unlink this event?")) return;
        try {
            await api.delete(`/streaming/unlink/${id}`);
            loadMappings();
            loadStats();
        } catch (e) {
            alert(e.message);
        }
    };

    const handleCopy = (id) => {
        navigator.clipboard.writeText(id);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const openDetails = async (mapping) => {
        setShowModal(true);
        setModalLoading(true);
        try {
            const res = await api.get(`/streaming/details/${mapping.betfairId}/${mapping.diamondId || 'none'}`);
            setModalData(res);
        } catch (e) {
            console.error(e);
        } finally {
            setModalLoading(false);
        }
    };

    const filteredMappings = mappings.filter(m => {
        const matchesSearch = (m.eventName || "").toLowerCase().includes(mappedSearch.toLowerCase()) || 
                            (m.betfairId || "").toString().includes(mappedSearch);
        const matchesSport = mappedSportFilter === "all" || m.sportId.toString() === mappedSportFilter;
        return matchesSearch && matchesSport;
    });

    const indexOfLastEntry = currentPage * entriesPerPage;
    const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
    const currentEntries = filteredMappings.slice(indexOfFirstEntry, indexOfLastEntry);
    const totalPages = Math.ceil(filteredMappings.length / entriesPerPage);

    const Modal = ({ data, onClose }) => {
        if (!showModal) return null;
        return (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[999] flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 w-full max-w-6xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                    <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                        <div>
                            <h2 className="text-3xl font-black italic uppercase italic tracking-tighter text-white">Streaming Intelligence Report</h2>
                            <p className="text-slate-500 font-medium">Comparative Provider Data Payload Inspection</p>
                        </div>
                        <button onClick={onClose} className="p-3 hover:bg-slate-800 rounded-full transition-all border border-slate-800">
                            <HiX className="w-6 h-6 text-slate-400" />
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-10 bg-slate-950/30">
                        {modalLoading ? (
                            <div className="flex items-center justify-center p-20">
                                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-accent shadow-[0_0_20px_rgba(59,130,246,0.3)]"></div>
                            </div>
                        ) : data ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* Betfair Column */}
                                <div className="space-y-6">
                                    <div className="px-6 py-4 bg-blue-500/10 border border-blue-500/20 rounded-3xl">
                                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Anchored Provider</p>
                                        <h3 className="text-xl font-black text-white italic tracking-tight">BETFAIR DATA</h3>
                                    </div>
                                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 space-y-4">
                                        <div className="flex justify-between border-b border-slate-800/50 pb-1">
                                            <span className="text-slate-500">Event ID:</span>
                                            <span className="text-white font-mono">{data.betfair?.eventId || "N/A"}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-800/50 pb-1">
                                            <span className="text-slate-500">Event Name:</span>
                                            <span className="text-slate-300 truncate max-w-[120px]">{data.betfair?.eventName || "N/A"}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-800/50 pb-1">
                                            <span className="text-slate-500">Start Time:</span>
                                            <span className="text-slate-400 text-xs">{data.betfair?.startTime ? new Date(data.betfair.startTime).toLocaleString() : "N/A"}</span>
                                        </div>
                                        <pre className="mt-4 text-[9px] text-slate-600 bg-black/20 p-2 rounded overflow-x-auto max-h-32">
                                            {JSON.stringify(data.betfair || { message: "N/A" }, null, 2)}
                                        </pre>
                                    </div>
                                </div>

                                {/* Diamond Column */}
                                <div className="space-y-6">
                                    <div className="px-6 py-4 bg-orange-500/10 border border-orange-500/20 rounded-3xl">
                                        <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Primary Streamer</p>
                                        <h3 className="text-xl font-black text-white italic tracking-tight">DIAMOND TV</h3>
                                    </div>
                                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 space-y-4">
                                        <div className="flex justify-between border-b border-slate-800/50 pb-1">
                                            <span className="text-slate-500">Global ID:</span>
                                            <span className="text-white font-mono">{data.diamond?.gmid || "N/A"}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-800/50 pb-1">
                                            <span className="text-slate-500">Market Name:</span>
                                            <span className="text-slate-300 truncate max-w-[120px]">{data.diamond?.ename || "N/A"}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-800/50 pb-1">
                                            <span className="text-slate-500">Channel ID:</span>
                                            <span className="text-orange-400 font-bold">{data.diamond?.channelId || "N/A"}</span>
                                        </div>
                                        <pre className="mt-4 text-[9px] text-slate-600 bg-black/20 p-2 rounded overflow-x-auto max-h-32">
                                            {JSON.stringify(data.diamond || { message: "Mapping missing" }, null, 2)}
                                        </pre>
                                    </div>
                                </div>

                                {/* D247 Column */}
                                <div className="space-y-6">
                                    <div className="px-6 py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl">
                                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Fallback Intelligence</p>
                                        <h3 className="text-xl font-black text-white italic tracking-tight">D247 DATA</h3>
                                    </div>
                                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 space-y-4">
                                        <div className="flex justify-between border-b border-slate-800/50 pb-1">
                                            <span className="text-slate-500">D247 ID:</span>
                                            <span className="text-white font-mono">{data.d247?.event_id || "N/A"}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-800/50 pb-1">
                                            <span className="text-slate-500">Event Name:</span>
                                            <span className="text-slate-300 truncate max-w-[120px]">{data.d247?.event_name || "N/A"}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-800/50 pb-1">
                                            <span className="text-slate-500">Status:</span>
                                            <span className={data.d247?.in_play ? "text-red-400 font-bold" : "text-slate-400"}>
                                                {data.d247?.in_play ? "LIVE" : "UPCOMING"}
                                            </span>
                                        </div>
                                        <pre className="mt-4 text-[9px] text-slate-600 bg-black/20 p-2 rounded overflow-x-auto max-h-32">
                                            {JSON.stringify(data.d247 || { message: "Mapping missing" }, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-12 text-center text-slate-500 italic">No detailed intel available.</div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-8 space-y-10 max-w-[1600px] mx-auto min-h-screen bg-slate-950 text-slate-200">
            <Modal data={modalData} onClose={() => setShowModal(false)} />

            {/* 🛸 HUD HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black bg-gradient-to-r from-white via-slate-400 to-slate-600 bg-clip-text text-transparent italic uppercase tracking-tighter">Streaming Magic Merger</h1>
                    <p className="text-slate-500 font-medium tracking-wide">Three-Provider Auto-Resolution Engine v2.0</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3 bg-slate-900/80 px-4 py-2 rounded-2xl border border-slate-800 backdrop-blur-xl">
                        <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse"></div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Next Auto-Sync: </span>
                        <span className="text-sm font-black font-mono text-brand-accent w-12 text-center text-orange-400 font-bold">
                            {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                        </span>
                    </div>

                    <a 
                        href="/admin/analytics"
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2.5 rounded-2xl border border-slate-700 transition-all font-bold text-sm shadow-xl active:scale-95 translate-y-[2px]"
                    >
                        <HiChartBar className="text-brand-accent w-5 h-5" />
                        View Live Analytics
                    </a>

                    <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-2xl">
                        {[4, 1, 2].map((id) => (
                            <button 
                                key={id}
                                onClick={() => { setSportId(id); setCurrentPage(1); }}
                                className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${sportId === id ? 'bg-brand-accent text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {id === 4 ? "CRICKET" : id === 1 ? "SOCCER" : "TENNIS"}
                            </button>
                        ))}
                    </div>

                    <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
                        {[1, 0].map(val => (
                            <button 
                                key={val}
                                onClick={() => { setInplay(val); setCurrentPage(1); }}
                                className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${inplay === val ? 'bg-brand-accent text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {val === 1 ? "LIVE" : "UPCOMING"}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 🔍 SEARCH & FILTERS */}
            <div className="flex flex-col md:flex-row gap-6">
                <div className="relative flex-1 group">
                    <HiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 w-6 h-6 group-focus-within:text-brand-accent transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Search unmapped pools (Name or ID)..."
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-2.5xl py-5 pl-16 pr-6 focus:outline-none focus:border-brand-accent transition-all font-medium text-lg placeholder:text-slate-600"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <button 
                    onClick={handleMerge}
                    disabled={!selectedBf || (!selectedD && !selectedD247)}
                    className={`px-10 py-5 rounded-2.5xl font-black flex items-center gap-3 transition-all shadow-2xl active:scale-95 uppercase italic tracking-tighter ${(!selectedBf || (!selectedD && !selectedD247)) ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50' : 'bg-brand-accent hover:bg-brand-blue/80 text-white animate-pulse'}`}
                >
                    <HiLink className="w-6 h-6" /> Commit Linkage
                </button>
            </div>

            {/* 🃏 UNMAPPED POOLS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Betfair Pool */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest italic">Unmapped Betfair</h3>
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">{filteredBetfair.length} Events</span>
                    </div>
                    <div className="bg-slate-900/30 border border-slate-800/50 rounded-[2rem] p-4 h-[450px] overflow-y-auto space-y-3 custom-scrollbar">
                        {filteredBetfair.map((e) => (
                            <div 
                                key={e.id}
                                onClick={() => setSelectedBf(selectedBf?.id === e.id ? null : e)}
                                className={`p-5 rounded-2.5xl border transition-all cursor-pointer group relative overflow-hidden ${selectedBf?.id === e.id ? 'bg-blue-500/10 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.2)]' : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-600'}`}
                            >
                                <div className="flex flex-col gap-1 relative z-10">
                                    <span className="text-white font-black italic tracking-tight text-lg group-hover:text-blue-400 transition-colors uppercase">{e.name}</span>
                                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                        <span>#{e.id}</span>
                                        <span>{(e.time && !isNaN(new Date(e.time))) ? new Date(e.time).toLocaleString() : "Date N/A"}</span>
                                    </div>
                                </div>
                                {selectedBf?.id === e.id && (
                                    <div className="absolute top-4 right-4 text-blue-500">
                                        <HiCheck className="w-6 h-6" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Diamond Pool */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest italic">Unmapped Diamond</h3>
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">{filteredDiamond.length} Events</span>
                    </div>
                    <div className="bg-slate-900/30 border border-slate-800/50 rounded-[2rem] p-4 h-[450px] overflow-y-auto space-y-3 custom-scrollbar">
                        {filteredDiamond.map((e) => (
                            <div 
                                key={e.id}
                                onClick={() => setSelectedD(selectedD?.id === e.id ? null : e)}
                                className={`p-5 rounded-2.5xl border transition-all cursor-pointer relative overflow-hidden ${selectedD?.id === e.id ? 'bg-orange-500/10 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.2)]' : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-600'}`}
                            >
                                <div className="flex flex-col gap-1 relative z-10 text-right">
                                    <span className="text-white font-black italic tracking-tight text-lg uppercase">{e.name}</span>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">GMID: #{e.id}</span>
                                </div>
                                {selectedD?.id === e.id && (
                                    <div className="absolute top-4 left-4 text-orange-500">
                                        <HiCheck className="w-6 h-6" />
                                    </div>
                                )}
                            </div>
                        ))}
                        {filteredDiamond.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-700 italic space-y-3 opacity-50">
                                <HiIdentification className="w-16 h-16" />
                                <p className="font-bold">No Primary Feeds Available</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* D247 Pool */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest italic">Unmapped D247</h3>
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">{filteredD247.length} Events</span>
                    </div>
                    <div className="bg-slate-900/30 border border-slate-800/50 rounded-[2rem] p-4 h-[450px] overflow-y-auto space-y-3 custom-scrollbar">
                        {filteredD247.map((e) => (
                            <div 
                                key={e.id}
                                onClick={() => setSelectedD247(selectedD247?.id === e.id ? null : e)}
                                className={`p-5 rounded-2.5xl border transition-all cursor-pointer relative overflow-hidden ${selectedD247?.id === e.id ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-600'}`}
                            >
                                <div className="flex flex-col gap-1 relative z-10 text-right">
                                    <span className="text-white font-black italic tracking-tight text-lg uppercase">{e.name}</span>
                                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                        <span>#{e.id}</span>
                                        <span>{e.time ? new Date(e.time).toLocaleString() : "Live"}</span>
                                    </div>
                                </div>
                                {selectedD247?.id === e.id && (
                                    <div className="absolute top-4 left-4 text-emerald-500">
                                        <HiCheck className="w-6 h-6" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 📊 ACTIVE MAPPINGS CONTROL CENTER */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h2 className="text-3xl font-black bg-gradient-to-r from-white via-slate-400 to-slate-600 bg-clip-text text-transparent italic tracking-tighter uppercase">Active Mappings Hub</h2>
                        <p className="text-slate-500 font-medium tracking-wide italic">Operational Synchronization Database</p>
                    </div>

                    <div className="flex items-center gap-4 bg-slate-900/50 p-2 rounded-2.5xl border border-slate-800">
                        <div className="relative group">
                            <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-brand-accent transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Search DB..."
                                className="bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-12 pr-4 focus:outline-none focus:border-brand-accent transition-all text-sm font-bold w-64"
                                value={mappedSearch}
                                onChange={(e) => setMappedSearch(e.target.value)}
                            />
                        </div>
                        <select 
                            className="bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 focus:outline-none focus:border-brand-accent transition-all text-sm font-black appearance-none"
                            value={mappedSportFilter}
                            onChange={(e) => setMappedSportFilter(e.target.value)}
                        >
                            <option value="all">ALL SPORTS</option>
                            <option value="4">CRICKET</option>
                            <option value="1">SOCCER</option>
                            <option value="2">TENNIS</option>
                        </select>
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-950 border-b border-slate-800">
                                <th className="px-8 py-6 text-[10px] font-black text-slate-500 tracking-[0.2em] italic">EVENT METADATA</th>
                                <th className="px-6 py-6 text-[10px] font-black text-slate-500 tracking-[0.2em] italic">PROVIDER LINKAGE</th>
                                <th className="px-6 py-6 text-[10px] font-black text-slate-500 tracking-[0.2em] italic">MATCH INTEL</th>
                                <th className="px-6 py-6 text-[10px] font-black text-slate-500 tracking-[0.2em] italic">RESOLUTION</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-500 tracking-[0.2em] italic text-right">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {currentEntries.map(m => (
                                <tr key={m._id} className="hover:bg-brand-accent/[0.03] transition-colors group">
                                    <td className="px-8 py-6">
                                        <p className="text-white font-black italic tracking-tight text-lg uppercase group-hover:text-brand-accent transition-colors">{m.eventName}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-bold text-slate-600 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">BF-ID: {m.betfairId}</span>
                                            {m.status === 'auto' && <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest">Auto Merged</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${m.diamondId ? 'bg-orange-500' : 'bg-slate-700'}`}></div>
                                                <span className={`text-[11px] font-bold ${m.diamondId ? 'text-slate-300' : 'text-slate-600 italic'}`}>{m.diamondId || "NO PRIMARY LINK"}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${m.d247Id ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                                                <span className={`text-[11px] font-bold ${m.d247Id ? 'text-slate-300' : 'text-slate-600 italic'}`}>{m.d247Id || "NO FALLBACK LINK"}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <button 
                                            onClick={() => openDetails(m)}
                                            className="flex items-center gap-2 text-slate-400 hover:text-brand-accent bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 transition-all font-bold text-xs group-hover:border-brand-accent/30"
                                        >
                                            <HiCube className="w-4 h-4" /> Payload Meta
                                        </button>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold italic tracking-wider">
                                                {m.eventTime ? new Date(m.eventTime).toLocaleString() : "Date N/A"}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right space-x-2">
                                        <button 
                                            onClick={() => handleCopy(m.betfairId)}
                                            className="p-3 text-slate-500 hover:text-white bg-slate-950 rounded-xl transition-all border border-slate-800 hover:border-slate-600"
                                            title="Copy ID"
                                        >
                                            {copiedId === m.betfairId ? <HiCheck className="w-5 h-5 text-emerald-500" /> : <HiClipboard className="w-5 h-5" />}
                                        </button>
                                        <button 
                                            onClick={() => handleUnlink(m._id)}
                                            className="p-3 text-slate-500 hover:text-red-500 bg-slate-950 rounded-xl transition-all border border-slate-800 hover:border-red-500/30"
                                        >
                                            <HiTrash className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                <div className="flex items-center justify-between px-2">
                    <p className="text-xs text-slate-600 font-bold uppercase tracking-widest italic">Showing {indexOfFirstEntry + 1} to {Math.min(indexOfLastEntry, filteredMappings.length)} of {filteredMappings.length} Operational Mappings</p>
                    <div className="flex items-center gap-2">
                        <button 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="p-3 bg-slate-900 border border-slate-800 rounded-xl disabled:opacity-20 text-slate-400 hover:text-white transition-all"
                        >
                            <HiChevronLeft className="w-6 h-6" />
                        </button>
                        <span className="text-sm font-black text-brand-accent px-4 italic tracking-widest">{currentPage} / {totalPages || 1}</span>
                        <button 
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="p-3 bg-slate-900 border border-slate-800 rounded-xl disabled:opacity-20 text-slate-400 hover:text-white transition-all"
                        >
                            <HiChevronRight className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
