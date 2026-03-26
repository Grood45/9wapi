import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineDocumentDownload, HiOutlineChevronLeft, HiOutlineAdjustments, HiOutlineCheckCircle, HiOutlineDuplicate, HiOutlineTrash, HiOutlineSearch } from 'react-icons/hi';
import { PROVIDER_ENDPOINTS } from '../constants/apiEndpoints';
import { generateIntegrationPdf } from '../utils/pdfExporter';

export default function DocumentsExport() {
    const navigate = useNavigate();
    const [selectedEndpoints, setSelectedEndpoints] = useState({}); // { Provider: [ids] }
    const [providerFilter, setProviderFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const providers = useMemo(() => Object.keys(PROVIDER_ENDPOINTS), []);

    // Global Select All Logic
    const isAllSelected = useMemo(() => {
        const totalEndpoints = providers.reduce((acc, p) => acc + PROVIDER_ENDPOINTS[p].length, 0);
        const selectedCount = Object.values(selectedEndpoints).flat().length;
        return selectedCount > 0 && selectedCount === totalEndpoints;
    }, [selectedEndpoints, providers]);

    const toggleGlobalSelectAll = () => {
        if (isAllSelected) {
            setSelectedEndpoints({});
        } else {
            const all = {};
            providers.forEach(p => {
                all[p] = PROVIDER_ENDPOINTS[p].map(e => e.id);
            });
            setSelectedEndpoints(all);
        }
    };

    const toggleProviderSelection = (provider, isSelected) => {
        const updated = { ...selectedEndpoints };
        if (isSelected) {
            updated[provider] = PROVIDER_ENDPOINTS[provider].map(e => e.id);
        } else {
            delete updated[provider];
        }
        setSelectedEndpoints(updated);
    };

    const toggleEndpointSelection = (provider, endpointId) => {
        const current = selectedEndpoints[provider] || [];
        const updated = current.includes(endpointId)
            ? current.filter(id => id !== endpointId)
            : [...current, endpointId];

        setSelectedEndpoints({ ...selectedEndpoints, [provider]: updated });
    };

    const handleExport = () => {
        const dataToExport = {};
        Object.keys(selectedEndpoints).forEach(p => {
            if (selectedEndpoints[p]?.length > 0) {
                dataToExport[p] = PROVIDER_ENDPOINTS[p].filter(ep => selectedEndpoints[p].includes(ep.id));
            }
        });

        if (Object.keys(dataToExport).length === 0) {
            alert('Please select at least one endpoint to export.');
            return;
        }

        generateIntegrationPdf(dataToExport);
    };

    const filteredProviders = useMemo(() => {
        return providers.filter(p => {
            const matchesFilter = providerFilter === 'all' || p === providerFilter;
            const matchesSearch = p.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                PROVIDER_ENDPOINTS[p].some(e => e.label.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesFilter && matchesSearch;
        });
    }, [providerFilter, searchQuery, providers]);

    return (
        <div className="min-h-screen bg-brand-panel p-6 pb-32 animate-fade-in text-slate-100">
            {/* Header Section */}
            <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-700/50 pb-8">
                <div>
                    <button onClick={() => navigate('/admin/docs')} className="flex items-center gap-1 text-slate-500 hover:text-brand-accent mb-2 transition-colors text-xs font-bold uppercase tracking-widest">
                        <HiOutlineChevronLeft className="w-4 h-4" /> Back to Directory
                    </button>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Forge Integration Guide</h2>
                    <p className="text-slate-400 text-sm">Select and curate the technical manual for your integration partners.</p>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={toggleGlobalSelectAll}
                        className={`btn-secondary flex items-center gap-2 px-6 py-3 rounded-2xl border-2 transition-all font-bold text-sm ${isAllSelected ? 'bg-brand-accent/10 border-brand-accent text-brand-accent' : 'border-slate-700 text-slate-400'}`}
                    >
                        {isAllSelected ? <HiOutlineTrash className="w-5 h-5" /> : <HiOutlineDuplicate className="w-5 h-5" />}
                        {isAllSelected ? 'Deselect All' : 'Select All'}
                    </button>
                    <button
                        onClick={handleExport}
                        className="btn-primary flex items-center gap-2 px-8 py-3 rounded-2xl shadow-xl shadow-brand-accent/20 font-black text-sm uppercase tracking-wide"
                    >
                        <HiOutlineDocumentDownload className="w-6 h-6" /> Generate Manual
                    </button>
                </div>
            </div>

            {/* Filters Section */}
            <div className="max-w-7xl mx-auto mb-10 flex flex-wrap items-center gap-4">
                <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800">
                    <button 
                        onClick={() => setProviderFilter('all')}
                        className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${providerFilter === 'all' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        ALL PROVIDERS
                    </button>
                    {providers.map(p => (
                        <button 
                            key={p}
                            onClick={() => {
                                setProviderFilter(p);
                                // User said: "filter kara provider ka toh uska ekdam tick aa jaye"
                                toggleProviderSelection(p, true);
                            }}
                            className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${providerFilter === p ? 'bg-brand-accent text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            {p.toUpperCase()}
                        </button>
                    ))}
                </div>

                <div className="relative flex-1 max-w-sm ml-auto">
                    <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                    <input 
                        type="text" 
                        placeholder="Search endpoints or providers..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-accent transition-all"
                    />
                </div>
            </div>

            {/* Provider Cards Grid */}
            <div className="max-w-7xl mx-auto space-y-10">
                {filteredProviders.map(p => {
                    const endpoints = PROVIDER_ENDPOINTS[p];
                    const selected = selectedEndpoints[p] || [];
                    const allSelectedForProvider = selected.length === endpoints.length;

                    return (
                        <div key={p} className="bg-slate-900/20 rounded-[2.5rem] border border-slate-800/50 overflow-hidden shadow-2xl animate-slide-up group">
                            <div className="p-8 border-b border-slate-800/30 flex justify-between items-center bg-slate-800/20">
                                <div className="flex items-center gap-4">
                                    <div className="w-3 h-12 bg-brand-accent rounded-full"></div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white uppercase tracking-tight">{p}</h3>
                                        <p className="text-xs text-brand-accent font-bold tracking-widest uppercase opacity-70">{endpoints.length} Available Channels</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => toggleProviderSelection(p, !allSelectedForProvider)}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl border-2 transition-all text-xs font-black ${allSelectedForProvider ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'border-slate-700 text-slate-500 hover:border-slate-500'}`}
                                >
                                    {allSelectedForProvider ? <HiOutlineCheckCircle className="w-4 h-4" /> : <HiOutlineAdjustments className="w-4 h-4" />}
                                    {allSelectedForProvider ? 'TICKED' : 'SELECT ALL'}
                                </button>
                            </div>

                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {endpoints.map(ep => (
                                    <label key={ep.id} className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer select-none group/ep ${selected.includes(ep.id) ? 'bg-brand-accent/5 border-brand-accent/40 shadow-inner' : 'bg-slate-900/40 border-slate-800/50 hover:border-slate-700 hover:bg-slate-800/30'}`}>
                                        <div className="mt-1">
                                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selected.includes(ep.id) ? 'bg-brand-accent border-brand-accent' : 'border-slate-600'}`}>
                                                {selected.includes(ep.id) && <span className="text-white text-[10px]">✓</span>}
                                            </div>
                                            <input 
                                                type="checkbox" 
                                                className="hidden" 
                                                checked={selected.includes(ep.id)} 
                                                onChange={() => toggleEndpointSelection(p, ep.id)}
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <p className={`text-sm font-bold truncate transition-colors ${selected.includes(ep.id) ? 'text-white' : 'text-slate-300'}`} title={ep.label}>{ep.label}</p>
                                            <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate uppercase tracking-tighter" title={ep.id}>{ep.id}</p>
                                            <div className="mt-2 text-[9px] text-slate-400 italic line-clamp-1 opacity-0 group-hover/ep:opacity-100 transition-opacity">
                                                {ep.description}
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Sticky Footer Action Bar */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-40">
                <div className="bg-slate-900/90 backdrop-blur-2xl border border-slate-700 p-6 rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-brand-accent/20 rounded-2xl flex items-center justify-center text-brand-accent font-black text-xl border border-brand-accent/20">
                            {Object.values(selectedEndpoints).flat().length}
                        </div>
                        <div>
                            <p className="text-white font-black text-sm uppercase tracking-tight">Channels Selected</p>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Ready for export</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={() => setSelectedEndpoints({})} className="text-xs font-black text-slate-500 hover:text-red-400 transition-colors uppercase tracking-widest mr-4">
                            Reset Ticks
                        </button>
                        <button
                            onClick={handleExport}
                            className="bg-brand-accent hover:bg-brand-accent-hover text-white flex items-center gap-3 px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-lg shadow-brand-accent/20"
                        >
                            <HiOutlineDocumentDownload className="w-6 h-6" /> Generate Guide
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
